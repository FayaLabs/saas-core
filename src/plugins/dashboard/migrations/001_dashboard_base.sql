-- Dashboard Plugin: Preferences & Onboarding Progress
-- Tables prefixed with dsh_ per convention

-- Per-tenant dashboard display preferences (metric visibility + order)
CREATE TABLE IF NOT EXISTS public.dsh_dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  visible_metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  metric_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE public.dsh_dashboard_preferences ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dsh_dashboard_preferences_tenant
  ON public.dsh_dashboard_preferences(tenant_id);

-- Auto-update updated_at
CREATE TRIGGER set_dsh_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dsh_dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION saas_core.handle_updated_at();

-- Per-tenant onboarding step completion tracking
CREATE TABLE IF NOT EXISTS public.dsh_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES saas_core.tenants(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, step_id)
);
ALTER TABLE public.dsh_onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dsh_onboarding_progress_tenant
  ON public.dsh_onboarding_progress(tenant_id);
