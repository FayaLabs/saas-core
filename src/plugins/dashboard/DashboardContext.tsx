import React from 'react'
import { useStore, type StoreApi } from 'zustand'
import type { DashboardDataProvider } from './data/types'
import type { DashboardUIState } from './store'
import type { DashboardMetric, DashboardSection, OnboardingStep } from './types'

// ---------------------------------------------------------------------------
// Resolved config
// ---------------------------------------------------------------------------

export interface DashboardPluginLabels {
  pageTitle: string
  pageSubtitle: string
  kpiTitle: string
  onboardingTitle: string
  onboardingSubtitle: string
  settingsTitle: string
}

export interface DashboardCurrency {
  code: string
  locale: string
  symbol: string
}

export interface ResolvedDashboardConfig {
  labels: DashboardPluginLabels
  metrics: DashboardMetric[]
  sections: DashboardSection[]
  onboardingSteps: OnboardingStep[]
  currency: DashboardCurrency
  showOnboarding: boolean
}

// ---------------------------------------------------------------------------
// Triple context (config, provider, store)
// ---------------------------------------------------------------------------

const DashboardConfigContext = React.createContext<ResolvedDashboardConfig | null>(null)
const DashboardProviderContext = React.createContext<DashboardDataProvider | null>(null)
const DashboardStoreContext = React.createContext<StoreApi<DashboardUIState> | null>(null)

export function DashboardContextProvider({ config, provider, store, children }: {
  config: ResolvedDashboardConfig
  provider: DashboardDataProvider
  store: StoreApi<DashboardUIState>
  children?: React.ReactNode
}) {
  return (
    <DashboardConfigContext.Provider value={config}>
      <DashboardProviderContext.Provider value={provider}>
        <DashboardStoreContext.Provider value={store}>
          {children}
        </DashboardStoreContext.Provider>
      </DashboardProviderContext.Provider>
    </DashboardConfigContext.Provider>
  )
}

export function useDashboardConfig(): ResolvedDashboardConfig {
  const ctx = React.useContext(DashboardConfigContext)
  if (!ctx) throw new Error('useDashboardConfig must be used within DashboardPage')
  return ctx
}

export function useDashboardProvider(): DashboardDataProvider {
  const ctx = React.useContext(DashboardProviderContext)
  if (!ctx) throw new Error('useDashboardProvider must be used within DashboardPage')
  return ctx
}

export function useDashboardStore<T>(selector: (state: DashboardUIState) => T): T {
  const store = React.useContext(DashboardStoreContext)
  if (!store) throw new Error('useDashboardStore must be used within DashboardPage')
  return useStore(store, selector)
}

export function formatMetricValue(value: number, format: string | undefined, currency: DashboardCurrency): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency', currency: currency.code, minimumFractionDigits: 2,
      }).format(value)
    case 'percent':
      return new Intl.NumberFormat(currency.locale, {
        style: 'percent', minimumFractionDigits: 1,
      }).format(value / 100)
    case 'duration':
      return `${Math.round(value)} min`
    default:
      return new Intl.NumberFormat(currency.locale).format(value)
  }
}
