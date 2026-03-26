-- ============================================================
-- Migration 00004: Plugin System
-- Adds niches, plugin registry, dependencies, tenant plugins,
-- permissions, and helper RPC functions.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Niches (verticals)
-- -----------------------------------------------------------
create table public.niches (
  id text primary key,
  name text not null,
  description text,
  icon text,
  default_plugins text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.niches enable row level security;

create policy "Anyone can read niches"
  on public.niches for select
  using (true);

-- Only service role can write niches (no authenticated insert/update/delete policies)

-- -----------------------------------------------------------
-- 2. Add niche_id to tenants
-- -----------------------------------------------------------
alter table public.tenants
  add column niche_id text references public.niches(id);

create index idx_tenants_niche on public.tenants(niche_id);

-- -----------------------------------------------------------
-- 3. Plugins (global registry)
-- -----------------------------------------------------------
create table public.plugins (
  id text primary key,
  name text not null,
  description text,
  description_nl text,
  icon text,
  version text not null default '0.1.0',
  scope text not null default 'core' check (scope in ('core', 'niche', 'cross-niche', 'addon')),
  niche_id text references public.niches(id),
  min_plan text not null default 'free',
  is_default boolean not null default false,
  manifest jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- core/cross-niche plugins must NOT have a niche_id; niche plugins MUST have one
  constraint plugins_scope_niche_check check (
    (scope in ('core', 'cross-niche', 'addon') and niche_id is null)
    or (scope = 'niche' and niche_id is not null)
  )
);

create index idx_plugins_scope on public.plugins(scope);
create index idx_plugins_niche on public.plugins(niche_id);

alter table public.plugins enable row level security;

create policy "Anyone can read plugins"
  on public.plugins for select
  using (true);

create trigger plugins_updated_at before update on public.plugins
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------
-- 4. Plugin dependencies (DAG)
-- -----------------------------------------------------------
create table public.plugin_dependencies (
  id uuid primary key default gen_random_uuid(),
  plugin_id text not null references public.plugins(id) on delete cascade,
  depends_on text not null references public.plugins(id) on delete cascade,
  is_optional boolean not null default false,
  constraint plugin_deps_unique unique (plugin_id, depends_on),
  constraint plugin_deps_no_self check (plugin_id <> depends_on)
);

alter table public.plugin_dependencies enable row level security;

create policy "Anyone can read plugin dependencies"
  on public.plugin_dependencies for select
  using (true);

-- -----------------------------------------------------------
-- 5. Tenant plugins (per-tenant state)
-- -----------------------------------------------------------
create table public.tenant_plugins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plugin_id text not null references public.plugins(id) on delete cascade,
  status text not null default 'pending_setup' check (status in ('pending_setup', 'active', 'disabled', 'removed')),
  config jsonb not null default '{}',
  enabled_by uuid references auth.users(id),
  enabled_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_plugins_unique unique (tenant_id, plugin_id)
);

create index idx_tenant_plugins_tenant on public.tenant_plugins(tenant_id);
create index idx_tenant_plugins_status on public.tenant_plugins(tenant_id, status);

alter table public.tenant_plugins enable row level security;

-- Members can read their tenant's plugins
create policy "Members can view tenant plugins"
  on public.tenant_plugins for select
  using (tenant_id in (
    select tenant_id from public.tenant_members where user_id = auth.uid()
  ));

-- Admins+ can manage tenant plugins
create policy "Admins can insert tenant plugins"
  on public.tenant_plugins for insert
  with check (tenant_id in (
    select tenant_id from public.tenant_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "Admins can update tenant plugins"
  on public.tenant_plugins for update
  using (tenant_id in (
    select tenant_id from public.tenant_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "Admins can delete tenant plugins"
  on public.tenant_plugins for delete
  using (tenant_id in (
    select tenant_id from public.tenant_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

create trigger tenant_plugins_updated_at before update on public.tenant_plugins
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------
-- 6. Plugin permissions
-- -----------------------------------------------------------
create table public.plugin_permissions (
  id uuid primary key default gen_random_uuid(),
  plugin_id text not null references public.plugins(id) on delete cascade,
  permission text not null,
  description text,
  default_roles text[] not null default '{owner,admin}',
  constraint plugin_perms_unique unique (plugin_id, permission)
);

alter table public.plugin_permissions enable row level security;

create policy "Anyone can read plugin permissions"
  on public.plugin_permissions for select
  using (true);

-- -----------------------------------------------------------
-- 7. Tenant plugin role permissions (overrides)
-- -----------------------------------------------------------
create table public.tenant_plugin_role_permissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plugin_id text not null references public.plugins(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'staff', 'viewer')),
  permission text not null,
  granted boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tenant_role_perms_unique unique (tenant_id, plugin_id, role, permission)
);

create index idx_tenant_role_perms_tenant on public.tenant_plugin_role_permissions(tenant_id);

alter table public.tenant_plugin_role_permissions enable row level security;

-- Members can read their tenant's permission overrides
create policy "Members can view tenant role permissions"
  on public.tenant_plugin_role_permissions for select
  using (tenant_id in (
    select tenant_id from public.tenant_members where user_id = auth.uid()
  ));

-- Admins+ can manage
create policy "Admins can insert tenant role permissions"
  on public.tenant_plugin_role_permissions for insert
  with check (tenant_id in (
    select tenant_id from public.tenant_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "Admins can update tenant role permissions"
  on public.tenant_plugin_role_permissions for update
  using (tenant_id in (
    select tenant_id from public.tenant_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "Admins can delete tenant role permissions"
  on public.tenant_plugin_role_permissions for delete
  using (tenant_id in (
    select tenant_id from public.tenant_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- ============================================================
-- Helper RPC Functions
-- ============================================================

-- -----------------------------------------------------------
-- get_tenant_active_plugins: boot-time loader
-- Returns active plugins with manifest + tenant config
-- -----------------------------------------------------------
create or replace function public.get_tenant_active_plugins(p_tenant_id uuid)
returns table (
  plugin_id text,
  name text,
  version text,
  scope text,
  manifest jsonb,
  config jsonb,
  enabled_at timestamptz
)
language sql
stable
security definer
as $$
  select
    p.id as plugin_id,
    p.name,
    p.version,
    p.scope,
    p.manifest,
    tp.config,
    tp.enabled_at
  from public.tenant_plugins tp
  join public.plugins p on p.id = tp.plugin_id
  where tp.tenant_id = p_tenant_id
    and tp.status = 'active'
  order by p.scope, p.name;
$$;

-- -----------------------------------------------------------
-- get_available_plugins_for_tenant: marketplace view
-- Respects niche scoping + plan gating
-- -----------------------------------------------------------
create or replace function public.get_available_plugins_for_tenant(p_tenant_id uuid)
returns table (
  plugin_id text,
  name text,
  description text,
  description_nl text,
  icon text,
  version text,
  scope text,
  niche_id text,
  min_plan text,
  is_default boolean,
  manifest jsonb,
  is_installed boolean,
  install_status text
)
language sql
stable
security definer
as $$
  with tenant_info as (
    select t.id, t.niche_id, t.plan
    from public.tenants t
    where t.id = p_tenant_id
  )
  select
    p.id as plugin_id,
    p.name,
    p.description,
    p.description_nl,
    p.icon,
    p.version,
    p.scope,
    p.niche_id,
    p.min_plan,
    p.is_default,
    p.manifest,
    tp.id is not null as is_installed,
    tp.status as install_status
  from public.plugins p
  cross join tenant_info ti
  left join public.tenant_plugins tp
    on tp.plugin_id = p.id and tp.tenant_id = ti.id
  where
    -- core/cross-niche/addon always visible
    p.scope in ('core', 'cross-niche', 'addon')
    -- niche plugins only visible if tenant matches
    or (p.scope = 'niche' and p.niche_id = ti.niche_id)
  order by p.scope, p.name;
$$;

-- -----------------------------------------------------------
-- enable_plugin_for_tenant: enables a plugin + required deps
-- -----------------------------------------------------------
create or replace function public.enable_plugin_for_tenant(
  p_tenant_id uuid,
  p_plugin_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_dep record;
  v_enabled_ids text[] := array[]::text[];
begin
  -- First, enable required dependencies recursively
  for v_dep in
    with recursive dep_tree as (
      select depends_on, is_optional
      from public.plugin_dependencies
      where plugin_id = p_plugin_id and not is_optional
      union
      select pd.depends_on, pd.is_optional
      from public.plugin_dependencies pd
      join dep_tree dt on pd.plugin_id = dt.depends_on
      where not pd.is_optional
    )
    select depends_on from dep_tree
  loop
    insert into public.tenant_plugins (tenant_id, plugin_id, status, enabled_at, enabled_by)
    values (p_tenant_id, v_dep.depends_on, 'active', now(), auth.uid())
    on conflict (tenant_id, plugin_id) do update
      set status = 'active',
          enabled_at = now(),
          enabled_by = auth.uid(),
          disabled_at = null
    where tenant_plugins.status <> 'active';

    v_enabled_ids := v_enabled_ids || v_dep.depends_on;
  end loop;

  -- Then enable the plugin itself
  insert into public.tenant_plugins (tenant_id, plugin_id, status, enabled_at, enabled_by)
  values (p_tenant_id, p_plugin_id, 'active', now(), auth.uid())
  on conflict (tenant_id, plugin_id) do update
    set status = 'active',
        enabled_at = now(),
        enabled_by = auth.uid(),
        disabled_at = null
  where tenant_plugins.status <> 'active';

  v_enabled_ids := v_enabled_ids || p_plugin_id;

  return jsonb_build_object(
    'success', true,
    'enabled_plugins', to_jsonb(v_enabled_ids)
  );
end;
$$;

-- -----------------------------------------------------------
-- provision_tenant_plugins: post-signup provisioning
-- Enables core defaults + niche defaults for a new tenant
-- -----------------------------------------------------------
create or replace function public.provision_tenant_plugins(p_tenant_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_niche_id text;
  v_niche_defaults text[];
  v_plugin_id text;
  v_count int := 0;
begin
  -- Get tenant's niche
  select t.niche_id into v_niche_id
  from public.tenants t
  where t.id = p_tenant_id;

  -- Enable core default plugins
  insert into public.tenant_plugins (tenant_id, plugin_id, status, enabled_at)
  select p_tenant_id, p.id, 'active', now()
  from public.plugins p
  where p.is_default = true and p.scope = 'core'
  on conflict (tenant_id, plugin_id) do nothing;

  get diagnostics v_count = row_count;

  -- Enable niche defaults if tenant has a niche
  if v_niche_id is not null then
    -- Enable niche-specific default plugins
    insert into public.tenant_plugins (tenant_id, plugin_id, status, enabled_at)
    select p_tenant_id, p.id, 'active', now()
    from public.plugins p
    where p.is_default = true
      and p.scope = 'niche'
      and p.niche_id = v_niche_id
    on conflict (tenant_id, plugin_id) do nothing;

    -- Also enable plugins listed in niche default_plugins array
    select n.default_plugins into v_niche_defaults
    from public.niches n
    where n.id = v_niche_id;

    if v_niche_defaults is not null then
      foreach v_plugin_id in array v_niche_defaults loop
        insert into public.tenant_plugins (tenant_id, plugin_id, status, enabled_at)
        values (p_tenant_id, v_plugin_id, 'active', now())
        on conflict (tenant_id, plugin_id) do nothing;
      end loop;
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'tenant_id', p_tenant_id,
    'niche_id', v_niche_id
  );
end;
$$;

-- ============================================================
-- Seed Data: Niches
-- ============================================================
insert into public.niches (id, name, description, icon, default_plugins) values
  ('beauty', 'Beauty & Wellness', 'Salons, spas, barbershops, and beauty studios', '💇', '{}'),
  ('food', 'Food & Beverage', 'Restaurants, cafés, bars, and food trucks', '🍽️', '{}'),
  ('health', 'Health & Fitness', 'Gyms, clinics, physiotherapy, and wellness centers', '🏥', '{}'),
  ('services', 'Professional Services', 'Consulting, legal, accounting, and general service businesses', '💼', '{}');
