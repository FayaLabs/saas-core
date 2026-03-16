-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  title text not null,
  body text not null default '',
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'push')),
  read boolean not null default false,
  action_url text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_tenant on public.notifications(tenant_id);
create index idx_notifications_unread on public.notifications(user_id, read) where read = false;

-- RLS
alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users can update (mark read) their own notifications
create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- System can insert notifications (via service role)
create policy "Service can insert notifications"
  on public.notifications for insert
  with check (true);
