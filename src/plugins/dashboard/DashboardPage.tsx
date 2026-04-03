import React, { useEffect, useMemo, useCallback } from 'react'
import type { StoreApi } from 'zustand'
import { DashboardContextProvider, type ResolvedDashboardConfig } from './DashboardContext'
import type { DashboardDataProvider } from './data/types'
import type { DashboardUIState } from './store'
import { useRouter } from '../../lib/router'
import { useOrganizationStore } from '../../stores/organization.store'
import { useTranslation } from '../../hooks/useTranslation'
import { KpiGrid } from './components/KpiGrid'
import { OnboardingChecklist } from './components/OnboardingChecklist'
import { SectionRenderer } from './components/SectionRenderer'
import { EmptyDashboard } from './components/EmptyDashboard'

export function DashboardPage({ config, provider, store }: {
  config: ResolvedDashboardConfig
  provider: DashboardDataProvider
  store: StoreApi<DashboardUIState>
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const tenantId = useOrganizationStore((s) => s.currentOrg?.id)
  const refreshAll = store.getState().refreshAll

  useEffect(() => {
    refreshAll()
  }, [refreshAll, tenantId])

  const onNavigate = useCallback((path: string) => {
    router.navigate(path)
  }, [router])

  const mainSections = useMemo(
    () => config.sections.filter((s) => s.zone === 'main').sort((a, b) => a.order - b.order),
    [config.sections],
  )

  const rightSections = useMemo(
    () => config.sections.filter((s) => s.zone === 'bottom-right' || s.zone === 'sidebar').sort((a, b) => a.order - b.order),
    [config.sections],
  )

  const hasContent = config.metrics.length > 0 || config.sections.length > 0 || config.onboardingSteps.length > 0

  return (
    <DashboardContextProvider config={config} provider={provider} store={store}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        {!hasContent ? (
          <EmptyDashboard />
        ) : (
          <>
            {/* KPI Cards */}
            {config.metrics.length > 0 && <KpiGrid />}

            {/* Two-column content area */}
            {(mainSections.length > 0 || rightSections.length > 0 || config.showOnboarding) && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: main sections */}
                {mainSections.length > 0 && (
                  <div className="lg:col-span-3 space-y-6">
                    <SectionRenderer
                      sections={mainSections}
                      tenantId={tenantId}
                      onNavigate={onNavigate}
                    />
                  </div>
                )}

                {/* Right: onboarding + sidebar sections */}
                {(config.showOnboarding || rightSections.length > 0) && (
                  <div className={`${mainSections.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5'} space-y-6`}>
                    {config.showOnboarding && (
                      <OnboardingChecklist onNavigate={onNavigate} />
                    )}
                    <SectionRenderer
                      sections={rightSections}
                      tenantId={tenantId}
                      onNavigate={onNavigate}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardContextProvider>
  )
}
