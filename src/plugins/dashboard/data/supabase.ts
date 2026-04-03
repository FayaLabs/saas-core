import type { DashboardDataProvider } from './types'
import type { DashboardPreferences, OnboardingProgress } from '../types'
import { getSupabaseClientOptional } from '../../../lib/supabase'
import { useOrganizationStore } from '../../../stores/organization.store'

function getTenantId(): string | undefined {
  return useOrganizationStore.getState().currentOrg?.id
}

function getClient() {
  const supabase = getSupabaseClientOptional()
  if (!supabase) throw new Error('Supabase not initialized')
  return supabase
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value
  }
  return result
}

export function createSupabaseDashboardProvider(): DashboardDataProvider {
  return {
    async getPreferences(): Promise<DashboardPreferences | null> {
      const tenantId = getTenantId()
      if (!tenantId) return null
      const { data } = await getClient()
        .from('dsh_dashboard_preferences')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()
      if (!data) return null
      return snakeToCamel(data) as unknown as DashboardPreferences
    },

    async savePreferences(prefs) {
      const tenantId = getTenantId()
      if (!tenantId) throw new Error('No active tenant')
      const { data, error } = await getClient()
        .from('dsh_dashboard_preferences')
        .upsert(
          {
            tenant_id: tenantId,
            visible_metrics: prefs.visibleMetrics,
            metric_order: prefs.metricOrder,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id' },
        )
        .select('*')
        .single()
      if (error) throw error
      return snakeToCamel(data) as unknown as DashboardPreferences
    },

    async getOnboardingProgress(): Promise<OnboardingProgress[]> {
      const tenantId = getTenantId()
      if (!tenantId) return []
      const { data } = await getClient()
        .from('dsh_onboarding_progress')
        .select('step_id, completed_at')
        .eq('tenant_id', tenantId)
      return (data ?? []).map((r) => ({
        stepId: r.step_id,
        completedAt: r.completed_at,
      }))
    },

    async markStepComplete(stepId) {
      const tenantId = getTenantId()
      if (!tenantId) return
      await getClient()
        .from('dsh_onboarding_progress')
        .upsert(
          {
            tenant_id: tenantId,
            step_id: stepId,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,step_id' },
        )
    },

    async resetOnboarding() {
      const tenantId = getTenantId()
      if (!tenantId) return
      await getClient()
        .from('dsh_onboarding_progress')
        .delete()
        .eq('tenant_id', tenantId)
    },
  }
}
