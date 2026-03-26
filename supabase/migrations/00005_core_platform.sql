-- ============================================================
-- Migration 00005: Core Platform
--
-- Evolves the schema from plugin-only to a complete SaaS platform:
--   1. Rename niches → verticals
--   2. Plans & pricing (per-vertical tiers)
--   3. Locations (multi-unit / multi-branch)
--   4. RBAC permission system
--   5. Integration providers
--   6. Audit logs
--   7. Invitations (token-based)
--   8. API keys
--   9. Feature flags
--  10. Webhooks
--  11. Plugin schema isolation (plg_* schemas)
--  12. Recreate plugin RPCs with new naming
--  13. Seed data
-- ============================================================

-- ============================================================
-- 1. RENAME niches → verticals
-- ============================================================

ALTER TABLE public.niches RENAME TO verticals;

ALTER TABLE public.tenants RENAME COLUMN niche_id TO vertical_id;
ALTER TABLE public.plugins RENAME COLUMN niche_id TO vertical_id;

-- Update scope values: niche→vertical, cross-niche→universal, add tenant scope
ALTER TABLE public.plugins DROP CONSTRAINT plugins_scope_niche_check;
ALTER TABLE public.plugins DROP CONSTRAINT IF EXISTS plugins_check;
-- Drop the inline CHECK on scope column and recreate
-- The inline CHECK is anonymous, find and drop it
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'plugins'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND con.conname != 'plugins_scope_niche_check'
  LOOP
    EXECUTE format('ALTER TABLE public.plugins DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Add new scope check with updated values
ALTER TABLE public.plugins ADD CONSTRAINT plugins_scope_check
  CHECK (scope IN ('core', 'vertical', 'universal', 'addon', 'tenant'));

-- Add tenant_id for tenant-scoped plugins
ALTER TABLE public.plugins ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.plugins ADD CONSTRAINT plugins_scope_vertical_check CHECK (
  (scope IN ('core', 'universal', 'addon') AND vertical_id IS NULL AND tenant_id IS NULL)
  OR (scope = 'vertical' AND vertical_id IS NOT NULL AND tenant_id IS NULL)
  OR (scope = 'tenant' AND tenant_id IS NOT NULL)
);

-- Update any existing scope values (safe even if empty)
UPDATE public.plugins SET scope = 'vertical' WHERE scope = 'niche';
UPDATE public.plugins SET scope = 'universal' WHERE scope = 'cross-niche';

-- Rename indexes
ALTER INDEX idx_tenants_niche RENAME TO idx_tenants_vertical;
ALTER INDEX idx_plugins_niche RENAME TO idx_plugins_vertical;

-- ============================================================
-- 2. PLANS & PRICING
-- ============================================================

CREATE TABLE public.plans (
  id text PRIMARY KEY,
  vertical_id text REFERENCES public.verticals(id),
  name text NOT NULL,
  description text,
  tier int NOT NULL DEFAULT 0,
  price_monthly_cents int NOT NULL DEFAULT 0,
  price_yearly_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans"
  ON public.plans FOR SELECT USING (true);

-- ============================================================
-- 3. LOCATIONS (multi-unit / multi-branch)
-- ============================================================

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'BR',
  phone text,
  email text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  is_headquarters boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}',
  coordinates point,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_locations_tenant ON public.locations(tenant_id);
CREATE INDEX idx_locations_active ON public.locations(tenant_id, is_active) WHERE is_active = true;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view locations"
  ON public.locations FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update locations"
  ON public.locations FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete locations"
  ON public.locations FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Location members (staff assigned to locations)
CREATE TABLE public.location_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff', 'viewer')),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, user_id)
);

CREATE INDEX idx_location_members_location ON public.location_members(location_id);
CREATE INDEX idx_location_members_user ON public.location_members(user_id);

ALTER TABLE public.location_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view location members"
  ON public.location_members FOR SELECT
  USING (location_id IN (
    SELECT l.id FROM public.locations l
    JOIN public.tenant_members tm ON tm.tenant_id = l.tenant_id
    WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage location members"
  ON public.location_members FOR INSERT
  WITH CHECK (location_id IN (
    SELECT l.id FROM public.locations l
    JOIN public.tenant_members tm ON tm.tenant_id = l.tenant_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update location members"
  ON public.location_members FOR UPDATE
  USING (location_id IN (
    SELECT l.id FROM public.locations l
    JOIN public.tenant_members tm ON tm.tenant_id = l.tenant_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete location members"
  ON public.location_members FOR DELETE
  USING (location_id IN (
    SELECT l.id FROM public.locations l
    JOIN public.tenant_members tm ON tm.tenant_id = l.tenant_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
  ));

-- ============================================================
-- 4. RBAC PERMISSION SYSTEM
-- ============================================================

-- Drop old plugin permission tables (replaced by unified RBAC)
DROP TABLE IF EXISTS public.tenant_plugin_role_permissions;
DROP TABLE IF EXISTS public.plugin_permissions;

-- All permissions in the system (system + plugin-declared)
CREATE TABLE public.permissions (
  id text PRIMARY KEY,
  description text,
  category text NOT NULL DEFAULT 'general',
  plugin_id text REFERENCES public.plugins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read permissions"
  ON public.permissions FOR SELECT USING (true);

-- Default role → permission mappings
CREATE TABLE public.role_permissions (
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer')),
  permission_id text NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read role permissions"
  ON public.role_permissions FOR SELECT USING (true);

-- Per-tenant role permission overrides
CREATE TABLE public.tenant_role_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer')),
  permission_id text NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role, permission_id)
);

CREATE INDEX idx_tenant_role_overrides ON public.tenant_role_overrides(tenant_id);

ALTER TABLE public.tenant_role_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view role overrides"
  ON public.tenant_role_overrides FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert role overrides"
  ON public.tenant_role_overrides FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update role overrides"
  ON public.tenant_role_overrides FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete role overrides"
  ON public.tenant_role_overrides FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authorize(tenant_id, permission) — use in RLS and app logic
CREATE OR REPLACE FUNCTION public.authorize(p_tenant_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
  v_override boolean;
  v_has_default boolean;
BEGIN
  SELECT role INTO v_role
  FROM public.tenant_members
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id;

  IF v_role IS NULL THEN RETURN false; END IF;
  IF v_role = 'owner' THEN RETURN true; END IF;

  -- Check tenant-specific override first
  SELECT granted INTO v_override
  FROM public.tenant_role_overrides
  WHERE tenant_id = p_tenant_id AND role = v_role AND permission_id = p_permission;

  IF v_override IS NOT NULL THEN RETURN v_override; END IF;

  -- Fall back to default role permissions
  SELECT true INTO v_has_default
  FROM public.role_permissions
  WHERE role = v_role AND permission_id = p_permission;

  RETURN COALESCE(v_has_default, false);
END;
$$;

-- ============================================================
-- 5. INTEGRATION PROVIDERS
-- ============================================================

CREATE TABLE public.integration_providers (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  auth_type text NOT NULL DEFAULT 'oauth2' CHECK (auth_type IN ('oauth2', 'api_key', 'webhook', 'none')),
  config_schema jsonb NOT NULL DEFAULT '{}',
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read integration providers"
  ON public.integration_providers FOR SELECT USING (true);

CREATE TABLE public.tenant_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider_id text NOT NULL REFERENCES public.integration_providers(id),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text,
  config jsonb NOT NULL DEFAULT '{}',
  credentials jsonb NOT NULL DEFAULT '{}',
  token_expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  connected_by uuid REFERENCES auth.users(id),
  connected_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_tenant_integrations_unique
  ON public.tenant_integrations(tenant_id, provider_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_tenant_integrations_tenant ON public.tenant_integrations(tenant_id);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view integrations"
  ON public.tenant_integrations FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert integrations"
  ON public.tenant_integrations FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update integrations"
  ON public.tenant_integrations FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete integrations"
  ON public.tenant_integrations FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE TRIGGER tenant_integrations_updated_at BEFORE UPDATE ON public.tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. AUDIT LOGS
-- ============================================================

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(tenant_id, action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(tenant_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- ============================================================
-- 7. INVITATIONS
-- ============================================================

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'viewer')),
  location_ids uuid[] DEFAULT '{}',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_invitations_pending
  ON public.invitations(tenant_id, email) WHERE status = 'pending';
CREATE INDEX idx_invitations_tenant ON public.invitations(tenant_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invitations"
  ON public.invitations FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Accept invitation via token
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inv record;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_inv.tenant_id, auth.uid(), v_inv.role)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  -- Assign to specified locations
  IF v_inv.location_ids IS NOT NULL AND array_length(v_inv.location_ids, 1) > 0 THEN
    INSERT INTO public.location_members (location_id, user_id, role)
    SELECT unnest(v_inv.location_ids), auth.uid(), v_inv.role
    ON CONFLICT (location_id, user_id) DO NOTHING;
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_inv.tenant_id,
    'role', v_inv.role
  );
END;
$$;

-- ============================================================
-- 8. API KEYS
-- ============================================================

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api keys"
  ON public.api_keys FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can insert api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update api keys"
  ON public.api_keys FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- ============================================================
-- 9. FEATURE FLAGS
-- ============================================================

CREATE TABLE public.feature_flags (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  default_enabled boolean NOT NULL DEFAULT false,
  min_plan_tier int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT USING (true);

CREATE TABLE public.tenant_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_id text NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  enabled boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature_id)
);

CREATE INDEX idx_tenant_features ON public.tenant_feature_overrides(tenant_id);

ALTER TABLE public.tenant_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view feature overrides"
  ON public.tenant_feature_overrides FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  ));

-- is_feature_enabled(tenant_id, feature_id) — checks overrides → plan gating → default
CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_tenant_id uuid, p_feature_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_override boolean;
  v_default boolean;
  v_min_tier int;
  v_tenant_tier int;
BEGIN
  SELECT enabled INTO v_override
  FROM public.tenant_feature_overrides
  WHERE tenant_id = p_tenant_id AND feature_id = p_feature_id;

  IF v_override IS NOT NULL THEN RETURN v_override; END IF;

  SELECT default_enabled, min_plan_tier INTO v_default, v_min_tier
  FROM public.feature_flags WHERE id = p_feature_id;

  IF v_default IS NULL THEN RETURN false; END IF;
  IF NOT v_default THEN RETURN false; END IF;

  IF v_min_tier IS NOT NULL AND v_min_tier > 0 THEN
    SELECT COALESCE(p.tier, 0) INTO v_tenant_tier
    FROM public.tenants t
    LEFT JOIN public.plans p ON p.id = t.plan
    WHERE t.id = p_tenant_id;

    RETURN COALESCE(v_tenant_tier, 0) >= v_min_tier;
  END IF;

  RETURN v_default;
END;
$$;

-- ============================================================
-- 10. WEBHOOKS
-- ============================================================

CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhooks_tenant ON public.webhooks(tenant_id);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhooks"
  ON public.webhooks FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can insert webhooks"
  ON public.webhooks FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update webhooks"
  ON public.webhooks FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete webhooks"
  ON public.webhooks FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  response_status int,
  response_body text,
  success boolean NOT NULL DEFAULT false,
  attempts int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at) WHERE NOT success;

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (webhook_id IN (
    SELECT w.id FROM public.webhooks w
    JOIN public.tenant_members tm ON tm.tenant_id = w.tenant_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
  ));

-- ============================================================
-- 11. PLUGIN SCHEMA ISOLATION
-- Each plugin package creates tables in its own plg_* schema.
-- We pre-create schemas + grant access to Supabase roles.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS plg_financial;
CREATE SCHEMA IF NOT EXISTS plg_nfse;
CREATE SCHEMA IF NOT EXISTS plg_whatsapp;
CREATE SCHEMA IF NOT EXISTS plg_loyalty;
CREATE SCHEMA IF NOT EXISTS plg_reports;
CREATE SCHEMA IF NOT EXISTS plg_scheduling;
CREATE SCHEMA IF NOT EXISTS plg_table_mgmt;
CREATE SCHEMA IF NOT EXISTS plg_qr_menu;
CREATE SCHEMA IF NOT EXISTS plg_kitchen_display;

GRANT USAGE ON SCHEMA plg_financial TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_nfse TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_whatsapp TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_loyalty TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_reports TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_scheduling TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_table_mgmt TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_qr_menu TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA plg_kitchen_display TO authenticated, anon, service_role;

-- Default privileges so future tables in plugin schemas get RLS-compatible grants
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_financial GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_nfse GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_whatsapp GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_loyalty GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_reports GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_scheduling GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_table_mgmt GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_qr_menu GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_kitchen_display GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA plg_financial GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_nfse GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_whatsapp GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_loyalty GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_reports GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_scheduling GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_table_mgmt GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_qr_menu GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plg_kitchen_display GRANT ALL ON TABLES TO service_role;

-- ============================================================
-- 12. RECREATE PLUGIN RPCs (updated naming: vertical_id, new scopes)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_active_plugins(p_tenant_id uuid)
RETURNS TABLE (
  plugin_id text,
  name text,
  version text,
  scope text,
  manifest jsonb,
  config jsonb,
  enabled_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT p.id, p.name, p.version, p.scope, p.manifest, tp.config, tp.enabled_at
  FROM public.tenant_plugins tp
  JOIN public.plugins p ON p.id = tp.plugin_id
  WHERE tp.tenant_id = p_tenant_id AND tp.status = 'active'
  ORDER BY p.scope, p.name;
$$;

CREATE OR REPLACE FUNCTION public.get_available_plugins_for_tenant(p_tenant_id uuid)
RETURNS TABLE (
  plugin_id text,
  name text,
  description text,
  description_nl text,
  icon text,
  version text,
  scope text,
  vertical_id text,
  min_plan text,
  is_default boolean,
  manifest jsonb,
  is_installed boolean,
  install_status text
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH tenant_info AS (
    SELECT t.id, t.vertical_id, t.plan
    FROM public.tenants t WHERE t.id = p_tenant_id
  )
  SELECT
    p.id, p.name, p.description, p.description_nl, p.icon,
    p.version, p.scope, p.vertical_id, p.min_plan, p.is_default, p.manifest,
    tp.id IS NOT NULL, tp.status
  FROM public.plugins p
  CROSS JOIN tenant_info ti
  LEFT JOIN public.tenant_plugins tp ON tp.plugin_id = p.id AND tp.tenant_id = ti.id
  WHERE p.scope IN ('core', 'universal', 'addon')
    OR (p.scope = 'vertical' AND p.vertical_id = ti.vertical_id)
    OR (p.scope = 'tenant' AND p.tenant_id = ti.id)
  ORDER BY p.scope, p.name;
$$;

CREATE OR REPLACE FUNCTION public.enable_plugin_for_tenant(p_tenant_id uuid, p_plugin_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_dep record;
  v_enabled text[] := ARRAY[]::text[];
BEGIN
  FOR v_dep IN
    WITH RECURSIVE dep_tree AS (
      SELECT depends_on FROM public.plugin_dependencies
      WHERE plugin_id = p_plugin_id AND NOT is_optional
      UNION
      SELECT pd.depends_on FROM public.plugin_dependencies pd
      JOIN dep_tree dt ON pd.plugin_id = dt.depends_on
      WHERE NOT pd.is_optional
    )
    SELECT depends_on FROM dep_tree
  LOOP
    INSERT INTO public.tenant_plugins (tenant_id, plugin_id, status, enabled_at, enabled_by)
    VALUES (p_tenant_id, v_dep.depends_on, 'active', now(), auth.uid())
    ON CONFLICT (tenant_id, plugin_id) DO UPDATE
      SET status = 'active', enabled_at = now(), enabled_by = auth.uid(), disabled_at = NULL
    WHERE tenant_plugins.status <> 'active';
    v_enabled := v_enabled || v_dep.depends_on;
  END LOOP;

  INSERT INTO public.tenant_plugins (tenant_id, plugin_id, status, enabled_at, enabled_by)
  VALUES (p_tenant_id, p_plugin_id, 'active', now(), auth.uid())
  ON CONFLICT (tenant_id, plugin_id) DO UPDATE
    SET status = 'active', enabled_at = now(), enabled_by = auth.uid(), disabled_at = NULL
  WHERE tenant_plugins.status <> 'active';
  v_enabled := v_enabled || p_plugin_id;

  RETURN jsonb_build_object('success', true, 'enabled_plugins', to_jsonb(v_enabled));
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_tenant_plugins(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_vertical_id text;
  v_defaults text[];
  v_pid text;
BEGIN
  SELECT vertical_id INTO v_vertical_id FROM public.tenants WHERE id = p_tenant_id;

  -- Core defaults
  INSERT INTO public.tenant_plugins (tenant_id, plugin_id, status, enabled_at)
  SELECT p_tenant_id, id, 'active', now() FROM public.plugins
  WHERE is_default AND scope = 'core'
  ON CONFLICT (tenant_id, plugin_id) DO NOTHING;

  -- Vertical defaults
  IF v_vertical_id IS NOT NULL THEN
    INSERT INTO public.tenant_plugins (tenant_id, plugin_id, status, enabled_at)
    SELECT p_tenant_id, id, 'active', now() FROM public.plugins
    WHERE is_default AND scope = 'vertical' AND vertical_id = v_vertical_id
    ON CONFLICT (tenant_id, plugin_id) DO NOTHING;

    SELECT default_plugins INTO v_defaults FROM public.verticals WHERE id = v_vertical_id;
    IF v_defaults IS NOT NULL THEN
      FOREACH v_pid IN ARRAY v_defaults LOOP
        INSERT INTO public.tenant_plugins (tenant_id, plugin_id, status, enabled_at)
        VALUES (p_tenant_id, v_pid, 'active', now())
        ON CONFLICT (tenant_id, plugin_id) DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'tenant_id', p_tenant_id, 'vertical_id', v_vertical_id);
END;
$$;

-- ============================================================
-- 13. SEED DATA
-- ============================================================

-- Plans (universal free + per-vertical tiers)
INSERT INTO public.plans (id, vertical_id, name, tier, price_monthly_cents, price_yearly_cents, limits) VALUES
  ('free',               NULL,       'Free',       0,     0,      0,      '{"max_locations": 1, "max_members": 3, "max_api_keys": 0}'),
  ('beauty:starter',     'beauty',   'Starter',    1,  4900,  47000,      '{"max_locations": 1, "max_members": 10, "max_api_keys": 2}'),
  ('beauty:pro',         'beauty',   'Pro',        2,  9900,  95000,      '{"max_locations": 3, "max_members": 25, "max_api_keys": 5}'),
  ('beauty:business',    'beauty',   'Business',   3, 19900, 191000,      '{"max_locations": 10, "max_members": 100, "max_api_keys": 20}'),
  ('beauty:enterprise',  'beauty',   'Enterprise', 4, 49900, 479000,      '{"max_locations": -1, "max_members": -1, "max_api_keys": -1}'),
  ('food:starter',       'food',     'Starter',    1,  5900,  56600,      '{"max_locations": 1, "max_members": 15, "max_api_keys": 2}'),
  ('food:pro',           'food',     'Pro',        2, 11900, 114000,      '{"max_locations": 3, "max_members": 30, "max_api_keys": 5}'),
  ('food:business',      'food',     'Business',   3, 24900, 239000,      '{"max_locations": 10, "max_members": 100, "max_api_keys": 20}'),
  ('food:enterprise',    'food',     'Enterprise', 4, 59900, 575000,      '{"max_locations": -1, "max_members": -1, "max_api_keys": -1}'),
  ('health:starter',     'health',   'Starter',    1,  5900,  56600,      '{"max_locations": 1, "max_members": 10, "max_api_keys": 2}'),
  ('health:pro',         'health',   'Pro',        2, 11900, 114000,      '{"max_locations": 5, "max_members": 50, "max_api_keys": 10}'),
  ('health:business',    'health',   'Business',   3, 24900, 239000,      '{"max_locations": 20, "max_members": 200, "max_api_keys": 50}'),
  ('health:enterprise',  'health',   'Enterprise', 4, 59900, 575000,      '{"max_locations": -1, "max_members": -1, "max_api_keys": -1}'),
  ('services:starter',   'services', 'Starter',    1,  3900,  37400,      '{"max_locations": 1, "max_members": 5, "max_api_keys": 2}'),
  ('services:pro',       'services', 'Pro',        2,  7900,  75800,      '{"max_locations": 3, "max_members": 20, "max_api_keys": 5}'),
  ('services:business',  'services', 'Business',   3, 14900, 143000,      '{"max_locations": 10, "max_members": 100, "max_api_keys": 20}'),
  ('services:enterprise','services', 'Enterprise', 4, 39900, 383000,      '{"max_locations": -1, "max_members": -1, "max_api_keys": -1}');

-- Add FK from tenants.plan → plans.id (default 'free' already exists)
ALTER TABLE public.tenants
  ADD CONSTRAINT fk_tenants_plan FOREIGN KEY (plan) REFERENCES public.plans(id);

-- Permissions (system-wide)
INSERT INTO public.permissions (id, description, category) VALUES
  ('tenant.read',       'View tenant information',        'tenant'),
  ('tenant.update',     'Update tenant settings',         'tenant'),
  ('tenant.delete',     'Delete the tenant',              'tenant'),
  ('team.read',         'View team members',              'team'),
  ('team.invite',       'Invite new members',             'team'),
  ('team.manage',       'Update or remove members',       'team'),
  ('team.manage_roles', 'Change member roles',            'team'),
  ('locations.read',    'View locations',                  'locations'),
  ('locations.manage',  'Create, update, delete locations','locations'),
  ('billing.read',      'View billing information',       'billing'),
  ('billing.manage',    'Manage subscription & payments', 'billing'),
  ('plugins.read',      'View installed plugins',         'plugins'),
  ('plugins.manage',    'Enable or disable plugins',      'plugins'),
  ('plugins.configure', 'Configure plugin settings',      'plugins'),
  ('settings.read',     'View settings',                  'settings'),
  ('settings.update',   'Change settings',                'settings'),
  ('audit.read',        'View audit logs',                'audit'),
  ('api_keys.read',     'View API keys',                  'api'),
  ('api_keys.manage',   'Create and revoke API keys',     'api'),
  ('integrations.read', 'View integrations',              'integrations'),
  ('integrations.manage','Manage integration connections', 'integrations'),
  ('webhooks.read',     'View webhooks',                  'webhooks'),
  ('webhooks.manage',   'Create and manage webhooks',     'webhooks');

-- Default role → permission mappings (owner gets all implicitly via authorize())
INSERT INTO public.role_permissions (role, permission_id) VALUES
  -- admin: everything except tenant.delete
  ('admin', 'tenant.read'),       ('admin', 'tenant.update'),
  ('admin', 'team.read'),         ('admin', 'team.invite'),
  ('admin', 'team.manage'),       ('admin', 'team.manage_roles'),
  ('admin', 'locations.read'),    ('admin', 'locations.manage'),
  ('admin', 'billing.read'),      ('admin', 'billing.manage'),
  ('admin', 'plugins.read'),      ('admin', 'plugins.manage'),
  ('admin', 'plugins.configure'),
  ('admin', 'settings.read'),     ('admin', 'settings.update'),
  ('admin', 'audit.read'),
  ('admin', 'api_keys.read'),     ('admin', 'api_keys.manage'),
  ('admin', 'integrations.read'), ('admin', 'integrations.manage'),
  ('admin', 'webhooks.read'),     ('admin', 'webhooks.manage'),
  -- manager
  ('manager', 'tenant.read'),
  ('manager', 'team.read'),       ('manager', 'team.invite'),
  ('manager', 'locations.read'),
  ('manager', 'billing.read'),
  ('manager', 'plugins.read'),    ('manager', 'plugins.configure'),
  ('manager', 'settings.read'),   ('manager', 'settings.update'),
  ('manager', 'audit.read'),
  ('manager', 'integrations.read'),
  ('manager', 'webhooks.read'),
  -- staff
  ('staff', 'tenant.read'),
  ('staff', 'team.read'),
  ('staff', 'locations.read'),
  ('staff', 'plugins.read'),
  ('staff', 'settings.read'),
  -- viewer
  ('viewer', 'tenant.read'),
  ('viewer', 'team.read'),
  ('viewer', 'locations.read'),
  ('viewer', 'plugins.read'),
  ('viewer', 'settings.read');

-- Integration providers
INSERT INTO public.integration_providers (id, name, description, category, auth_type) VALUES
  ('google-calendar', 'Google Calendar',      'Sync appointments and schedules',    'calendar',  'oauth2'),
  ('google-mail',     'Gmail / Google SMTP',   'Send transactional and marketing email', 'email', 'oauth2'),
  ('smtp',            'Custom SMTP',           'Send email via your own SMTP server','email',    'api_key'),
  ('whatsapp',        'WhatsApp Business',     'Send messages and notifications',    'messaging', 'api_key'),
  ('stripe',          'Stripe',                'Online payments and subscriptions',  'payment',  'api_key'),
  ('pix',             'Pix (Brazil)',           'Instant payments via Pix',          'payment',  'api_key'),
  ('s3',              'Amazon S3 / R2',         'File and media storage',            'storage',  'api_key'),
  ('twilio',          'Twilio',                'SMS and voice notifications',        'messaging', 'api_key');

-- Plugins (from FAY-924 architecture)
INSERT INTO public.plugins (id, name, description, description_nl, version, scope, vertical_id, is_default, min_plan, manifest) VALUES
  -- Core (auto-enabled for everyone)
  ('financial',        'Financial',          'Invoicing, payments, and cash flow management',
    'Manage all financial operations including invoicing, payment tracking, accounts receivable/payable, and cash flow analysis for the business.',
    '0.1.0', 'core', NULL, true, 'free',
    '{"schema": "plg_financial", "package": "@fayz/plg-financial"}'::jsonb),

  -- Universal (available to all verticals)
  ('nfse',             'NFSe',               'Brazilian electronic invoice emission',
    'Issue and manage Nota Fiscal de Serviço Eletrônica (NFSe) for all services rendered, with automatic tax calculation and municipal integration.',
    '0.1.0', 'universal', NULL, false, 'starter',
    '{"schema": "plg_nfse", "package": "@fayz/plg-nfse"}'::jsonb),

  ('whatsapp',         'WhatsApp Business',   'Customer communication via WhatsApp',
    'Send appointment reminders, order updates, promotional messages, and handle customer inquiries through WhatsApp Business API.',
    '0.1.0', 'universal', NULL, false, 'starter',
    '{"schema": "plg_whatsapp", "package": "@fayz/plg-whatsapp"}'::jsonb),

  ('loyalty',          'Loyalty & Rewards',   'Points system, rewards, and retention programs',
    'Create and manage customer loyalty programs with points accumulation, reward tiers, referral bonuses, and retention campaigns.',
    '0.1.0', 'universal', NULL, false, 'pro',
    '{"schema": "plg_loyalty", "package": "@fayz/plg-loyalty"}'::jsonb),

  ('reports',          'Reports & Analytics', 'Business intelligence dashboards and reports',
    'Generate comprehensive business reports including revenue analytics, customer insights, staff performance, and operational metrics with customizable dashboards.',
    '0.1.0', 'universal', NULL, false, 'starter',
    '{"schema": "plg_reports", "package": "@fayz/plg-reports"}'::jsonb),

  -- Vertical: beauty
  ('scheduling',       'Scheduling',          'Appointment booking and calendar management',
    'Full appointment scheduling system with online booking, calendar management, automated reminders, staff availability, and recurring appointment support.',
    '0.1.0', 'vertical', 'beauty', true, 'free',
    '{"schema": "plg_scheduling", "package": "@fayz/plg-scheduling"}'::jsonb),

  -- Vertical: food
  ('table-mgmt',       'Table Management',    'Table map, status tracking, and reservations',
    'Visual table map with real-time status tracking, reservation management, table assignments, and capacity planning for the restaurant floor.',
    '0.1.0', 'vertical', 'food', true, 'free',
    '{"schema": "plg_table_mgmt", "package": "@fayz/plg-table-mgmt"}'::jsonb),

  ('qr-menu',          'QR Menu',             'Scan-to-order digital menu',
    'Digital menu accessible via QR code with category browsing, item customization, dietary filters, and direct-to-kitchen ordering.',
    '0.1.0', 'vertical', 'food', true, 'free',
    '{"schema": "plg_qr_menu", "package": "@fayz/plg-qr-menu"}'::jsonb),

  ('kitchen-display',  'Kitchen Display',     'Order queue and kitchen management',
    'Real-time kitchen display system showing order queue, preparation status, priority management, and estimated completion times.',
    '0.1.0', 'vertical', 'food', true, 'free',
    '{"schema": "plg_kitchen_display", "package": "@fayz/plg-kitchen-display"}'::jsonb);

-- Plugin dependencies
INSERT INTO public.plugin_dependencies (plugin_id, depends_on, is_optional) VALUES
  ('nfse', 'financial', false);

-- Update vertical default_plugins
UPDATE public.verticals SET default_plugins = '{financial,scheduling}'        WHERE id = 'beauty';
UPDATE public.verticals SET default_plugins = '{financial,table-mgmt,qr-menu,kitchen-display}' WHERE id = 'food';
UPDATE public.verticals SET default_plugins = '{financial}'                   WHERE id = 'health';
UPDATE public.verticals SET default_plugins = '{financial}'                   WHERE id = 'services';
