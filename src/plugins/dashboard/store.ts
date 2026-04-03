import { createStore, type StoreApi } from 'zustand/vanilla'
import { dedup } from '../../lib/dedup'
import type { DashboardDataProvider } from './data/types'
import type { ResolvedMetric, OnboardingProgress, DashboardPreferences, DashboardMetric } from './types'

export interface DashboardUIState {
  // KPI metrics
  metrics: ResolvedMetric[]
  metricsLoading: boolean

  // Preferences
  preferences: DashboardPreferences | null
  preferencesLoading: boolean

  // Onboarding
  onboardingProgress: OnboardingProgress[]
  onboardingLoading: boolean
  onboardingDismissed: boolean

  // Actions
  fetchMetrics(): Promise<void>
  fetchPreferences(): Promise<void>
  savePreferences(visibleMetrics: string[], metricOrder: string[]): Promise<void>
  fetchOnboardingProgress(): Promise<void>
  completeOnboardingStep(stepId: string): Promise<void>
  dismissOnboarding(): void
  refreshAll(): Promise<void>
}

export function createDashboardStore(
  provider: DashboardDataProvider,
  metricDefs: DashboardMetric[],
): StoreApi<DashboardUIState> {
  return createStore<DashboardUIState>((set, get) => ({
    metrics: [],
    metricsLoading: false,

    preferences: null,
    preferencesLoading: false,

    onboardingProgress: [],
    onboardingLoading: false,
    onboardingDismissed: false,

    async fetchMetrics() {
      return dedup('dashboard:metrics', async () => {
        set({ metricsLoading: true })

        const { preferences } = get()
        const visibleIds = preferences?.visibleMetrics
        const orderIds = preferences?.metricOrder

        // Determine which metrics to compute
        let toCompute: DashboardMetric[]
        if (visibleIds && visibleIds.length > 0) {
          toCompute = metricDefs.filter((m) => visibleIds.includes(m.id))
        } else {
          toCompute = metricDefs.filter((m) => m.defaultVisible)
        }

        // Sort by user order or default
        if (orderIds && orderIds.length > 0) {
          toCompute.sort((a, b) => {
            const ai = orderIds.indexOf(a.id)
            const bi = orderIds.indexOf(b.id)
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
          })
        } else {
          toCompute.sort((a, b) => a.defaultOrder - b.defaultOrder)
        }

        // Initialize as loading
        const loading: ResolvedMetric[] = toCompute.map((m) => ({
          ...m, currentValue: null, loading: true,
        }))
        set({ metrics: loading })

        // Compute all in parallel
        const results = await Promise.allSettled(
          toCompute.map((m) => m.compute()),
        )

        const resolved: ResolvedMetric[] = toCompute.map((m, i) => {
          const result = results[i]
          if (result.status === 'fulfilled') {
            return { ...m, currentValue: result.value, loading: false }
          }
          return {
            ...m, currentValue: null, loading: false,
            error: result.reason?.message ?? 'Failed to compute metric',
          }
        })

        set({ metrics: resolved, metricsLoading: false })
      })
    },

    async fetchPreferences() {
      return dedup('dashboard:preferences', async () => {
        set({ preferencesLoading: true })
        const preferences = await provider.getPreferences()
        set({ preferences, preferencesLoading: false })
      })
    },

    async savePreferences(visibleMetrics, metricOrder) {
      const preferences = await provider.savePreferences({ visibleMetrics, metricOrder })
      set({ preferences })
      // Re-fetch metrics with new visibility
      await get().fetchMetrics()
    },

    async fetchOnboardingProgress() {
      return dedup('dashboard:onboarding', async () => {
        set({ onboardingLoading: true })
        const onboardingProgress = await provider.getOnboardingProgress()
        set({ onboardingProgress, onboardingLoading: false })
      })
    },

    async completeOnboardingStep(stepId) {
      await provider.markStepComplete(stepId)
      set((state) => ({
        onboardingProgress: state.onboardingProgress.some((p) => p.stepId === stepId)
          ? state.onboardingProgress.map((p) =>
              p.stepId === stepId ? { ...p, completedAt: new Date().toISOString() } : p,
            )
          : [...state.onboardingProgress, { stepId, completedAt: new Date().toISOString() }],
      }))
    },

    dismissOnboarding() {
      set({ onboardingDismissed: true })
    },

    async refreshAll() {
      const state = get()
      await Promise.all([
        state.fetchPreferences(),
        state.fetchOnboardingProgress(),
      ])
      await state.fetchMetrics()
    },
  }))
}
