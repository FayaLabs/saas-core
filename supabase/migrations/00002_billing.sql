-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id text not null,
  status text not null default 'trialing' check (status in ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  interval text not null default 'monthly' check (interval in ('monthly', 'yearly')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now() + interval '30 days',
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id),
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  stripe_invoice_id text unique,
  pdf_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Payment events (audit log)
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  stripe_event_id text unique,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_subscriptions_tenant on public.subscriptions(tenant_id);
create index idx_invoices_tenant on public.invoices(tenant_id);
create index idx_payment_events_tenant on public.payment_events(tenant_id);

-- RLS
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_events enable row level security;

-- Members can view their tenant's subscription
create policy "Members can view subscription"
  on public.subscriptions for select
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()));

-- Only owners can manage subscription
create policy "Owners can manage subscription"
  on public.subscriptions for all
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role = 'owner'));

-- Members can view invoices
create policy "Members can view invoices"
  on public.invoices for select
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()));

-- Payment events readable by owners/admins
create policy "Admins can view payment events"
  on public.payment_events for select
  using (tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner', 'admin')));

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();
