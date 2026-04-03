import React, { useEffect, useMemo, useCallback } from 'react'
import { Rocket, X } from 'lucide-react'
import { useDashboardConfig, useDashboardStore } from '../DashboardContext'
import { OnboardingStepItem } from './OnboardingStepItem'
import { useTranslation } from '../../../hooks/useTranslation'

export function OnboardingChecklist({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { t } = useTranslation()
  const { onboardingSteps } = useDashboardConfig()
  const progress = useDashboardStore((s) => s.onboardingProgress)
  const dismissed = useDashboardStore((s) => s.onboardingDismissed)
  const loading = useDashboardStore((s) => s.onboardingLoading)
  const fetchProgress = useDashboardStore((s) => s.fetchOnboardingProgress)
  const completeStep = useDashboardStore((s) => s.completeOnboardingStep)
  const dismiss = useDashboardStore((s) => s.dismissOnboarding)

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Auto-check step completion on mount
  useEffect(() => {
    if (loading || onboardingSteps.length === 0) return
    onboardingSteps.forEach(async (step) => {
      const alreadyDone = progress.some((p) => p.stepId === step.id && p.completedAt)
      if (alreadyDone) return
      try {
        const isDone = await step.check()
        if (isDone) completeStep(step.id)
      } catch { /* ignore check errors */ }
    })
  }, [loading, onboardingSteps, progress, completeStep])

  const sortedSteps = useMemo(
    () => [...onboardingSteps].sort((a, b) => a.order - b.order),
    [onboardingSteps],
  )

  const completedCount = useMemo(
    () => sortedSteps.filter((s) => progress.some((p) => p.stepId === s.id && p.completedAt)).length,
    [sortedSteps, progress],
  )

  const allDone = completedCount === sortedSteps.length
  const progressPercent = sortedSteps.length > 0 ? (completedCount / sortedSteps.length) * 100 : 0

  const handleAction = useCallback((step: typeof sortedSteps[0]) => {
    if (typeof step.action === 'string') {
      onNavigate?.(step.action)
    } else {
      step.action()
    }
  }, [onNavigate])

  if (dismissed || sortedSteps.length === 0) return null
  if (allDone && dismissed) return null

  return (
    <div className="rounded-card border bg-card shadow-sm">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('dashboard.onboarding.title')}</h3>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          title={t('dashboard.onboarding.dismiss')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{t('dashboard.onboarding.subtitle')}</span>
          <span>{completedCount}/{sortedSteps.length}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {allDone ? (
        <div className="p-4 pt-2 text-center">
          <p className="text-sm text-green-600 font-medium">{t('dashboard.onboarding.allDone')}</p>
        </div>
      ) : (
        <div className="px-2 pb-2">
          {sortedSteps.map((step) => (
            <OnboardingStepItem
              key={step.id}
              step={step}
              completed={progress.some((p) => p.stepId === step.id && p.completedAt != null)}
              onAction={() => handleAction(step)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
