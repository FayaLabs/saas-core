import type { DashboardDataProvider } from './types'
import type { DashboardPreferences, OnboardingProgress } from '../types'

function uid(): string { return crypto.randomUUID?.() ?? String(Date.now()) }
function now(): string { return new Date().toISOString() }

interface MockStore {
  preferences: DashboardPreferences | null
  onboardingProgress: OnboardingProgress[]
}

export function createMockDashboardProvider(): DashboardDataProvider {
  const store: MockStore = {
    preferences: null,
    onboardingProgress: [],
  }

  return {
    async getPreferences() {
      return store.preferences
    },

    async savePreferences(prefs) {
      const ts = now()
      if (store.preferences) {
        store.preferences = {
          ...store.preferences,
          visibleMetrics: prefs.visibleMetrics,
          metricOrder: prefs.metricOrder,
          updatedAt: ts,
        }
      } else {
        store.preferences = {
          id: uid(),
          tenantId: 'mock-tenant',
          visibleMetrics: prefs.visibleMetrics,
          metricOrder: prefs.metricOrder,
          createdAt: ts,
          updatedAt: ts,
        }
      }
      return store.preferences
    },

    async getOnboardingProgress() {
      return store.onboardingProgress
    },

    async markStepComplete(stepId) {
      const existing = store.onboardingProgress.find((p) => p.stepId === stepId)
      if (existing) {
        existing.completedAt = now()
      } else {
        store.onboardingProgress.push({ stepId, completedAt: now() })
      }
    },

    async resetOnboarding() {
      store.onboardingProgress = []
    },
  }
}
