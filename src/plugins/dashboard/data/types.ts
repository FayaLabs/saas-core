import type { DashboardPreferences, OnboardingProgress } from '../types'

export interface DashboardDataProvider {
  // --- Preferences ---
  getPreferences(): Promise<DashboardPreferences | null>
  savePreferences(prefs: {
    visibleMetrics: string[]
    metricOrder: string[]
  }): Promise<DashboardPreferences>

  // --- Onboarding ---
  getOnboardingProgress(): Promise<OnboardingProgress[]>
  markStepComplete(stepId: string): Promise<void>
  resetOnboarding(): Promise<void>
}
