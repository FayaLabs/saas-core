-- Tenants table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  settings jsonb not null default '{}',
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tenant members (join table)
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'manager', 'staff', 'viewer')),
  joined_at timestamptz not null default now(),
  unique(tenant_id, user_id)
);

-- Indexes
create index idx_tenant_members_tenant on public.tenant_members(tenant_id);
create index idx_tenant_members_user on public.tenant_members(user_id);
create index idx_tenants_slug on public.tenants(slug);

-- RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;

-- Tenants policies: members can read their tenant
create policy "Members can view their tenant"
  on public.tenants for select
  using (id in (select tenant_id from public.tenant_members where user_id = auth.uid()));

-- Owners/admins can update tenant
create policy "Admins can update tenant"
  on public.tenants for update
  using (id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner', 'admin')));

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert with check (id = auth.uid());

-- Members can view other members in same tenant
create policy "Members can view tenant members"
  on public.tenant_members for select
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()));

-- Owners/admins can manage members
create policy "Admins can insert members"
  on public.tenant_members for insert
  with check (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner', 'admin')));

create policy "Admins can update members"
  on public.tenant_members for update
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner', 'admin')));

create policy "Admins can delete members"
  on public.tenant_members for delete
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner', 'admin')));

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tenants_updated_at before update on public.tenants
  for each row execute function public.handle_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
