import React from 'react'
import type { PluginManifest, PluginScope, VerticalId } from '../../types/plugins'
import { DashboardPage } from './DashboardPage'
import { DashboardContextProvider, type ResolvedDashboardConfig, type DashboardPluginLabels, type DashboardCurrency } from './DashboardContext'
import type { DashboardDataProvider } from './data/types'
import type { DashboardMetric, DashboardSection, OnboardingStep } from './types'
import { createMockDashboardProvider } from './data/mock'
import { getSupabaseClientOptional } from '../../lib/supabase'
import { createSupabaseDashboardProvider } from './data/supabase'
import { createDashboardStore } from './store'
import { dashboardLocales } from './locales'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { DashboardSettingsTab } from './components/DashboardSettingsTab'

// ---------------------------------------------------------------------------
// Safe provider (auto-selects mock or Supabase)
// ---------------------------------------------------------------------------

function createSafeDashboardProvider(): DashboardDataProvider {
  let resolved: DashboardDataProvider | null = null
  function get(): DashboardDataProvider {
    if (!resolved) resolved = getSupabaseClientOptional() ? createSupabaseDashboardProvider() : createMockDashboardProvider()
    return resolved
  }
  return new Proxy({} as DashboardDataProvider, {
    get: (_, prop) => (...args: any[]) => (get() as any)[prop](...args),
  })
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DashboardPluginOptions {
  /** KPI metrics to show on the dashboard */
  metrics?: DashboardMetric[]
  /** Custom sections injected by the consumer app */
  sections?: DashboardSection[]
  /** Onboarding steps for the getting-started checklist */
  onboardingSteps?: OnboardingStep[]
  /** Label overrides */
  labels?: Partial<DashboardPluginLabels>
  /** Currency config for metrics that use 'currency' format */
  currency?: { code?: string; locale?: string; symbol?: string }
  /** Plugin scope */
  scope?: PluginScope
  /** Vertical ID */
  verticalId?: VerticalId
  /** Data provider override (defaults to safe auto-selection) */
  dataProvider?: DashboardDataProvider
  /** Whether to show onboarding module. Default: true if onboardingSteps provided */
  showOnboarding?: boolean
  /** Nav position (default: 0 — first item) */
  navPosition?: number
  /** Nav section (default: 'main') */
  navSection?: 'main' | 'secondary'
  /** Navigation icon override (default: 'LayoutDashboard') */
  navIcon?: string
  /** Skip adding a navigation entry (use when the consumer app provides its own page entry for '/') */
  skipNavigation?: boolean
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LABELS: DashboardPluginLabels = {
  pageTitle: 'Dashboard',
  pageSubtitle: 'Business overview',
  kpiTitle: 'Key Metrics',
  onboardingTitle: 'Getting Started',
  onboardingSubtitle: 'Complete these steps to set up your business',
  settingsTitle: 'Dashboard',
}

const DEFAULT_CURRENCY: DashboardCurrency = { code: 'BRL', locale: 'pt-BR', symbol: 'R$' }

// ---------------------------------------------------------------------------
// Config resolver
// ---------------------------------------------------------------------------

function resolveConfig(options?: DashboardPluginOptions): ResolvedDashboardConfig {
  return {
    labels: { ...DEFAULT_LABELS, ...options?.labels },
    metrics: options?.metrics ?? [],
    sections: options?.sections ?? [],
    onboardingSteps: options?.onboardingSteps ?? [],
    currency: { ...DEFAULT_CURRENCY, ...options?.currency },
    showOnboarding: options?.showOnboarding ?? (options?.onboardingSteps != null && options.onboardingSteps.length > 0),
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDashboardPlugin(options?: DashboardPluginOptions): PluginManifest {
  const config = resolveConfig(options)
  const provider = options?.dataProvider ?? createSafeDashboardProvider()
  const store = createDashboardStore(provider, config.metrics)

  const PageComponent: React.FC<any> = () =>
    React.createElement(DashboardPage, { config, provider, store })

  return {
    id: 'dashboard',
    name: config.labels.pageTitle,
    icon: 'LayoutDashboard',
    version: '1.0.0',
    scope: options?.scope ?? 'universal',
    verticalId: options?.verticalId,
    defaultEnabled: true,
    dependencies: [],

    navigation: options?.skipNavigation ? [] : [
      {
        section: options?.navSection ?? 'main',
        position: options?.navPosition ?? 0,
        label: config.labels.pageTitle,
        route: '/',
        icon: options?.navIcon ?? 'LayoutDashboard',
      },
    ],

    routes: [
      {
        path: '/',
        component: PageComponent,
      },
    ],

    widgets: [],

    aiTools: [
      {
        id: 'dashboard.kpi-summary',
        name: 'getKpiSummary',
        description: 'Returns a summary of all KPI metrics for the current dashboard, including trends and comparisons.',
        icon: 'BarChart3',
        mode: 'read' as const,
        category: 'Dashboard',
        parameters: {
          type: 'object' as const,
          properties: {
            category: {
              type: 'string' as const,
              description: 'Filter by metric category',
              enum: ['revenue', 'operations', 'clients', 'custom', 'all'],
            },
          },
        },
        suggestions: [
          { label: 'How is my business doing today?' },
          { label: "What's my revenue today?" },
          { label: 'Give me a summary of today' },
        ],
      },
    ],

    settings: [
      {
        id: 'dashboard',
        label: config.labels.settingsTitle,
        icon: 'LayoutDashboard',
        component: (() => {
          const Tab: React.FC = () =>
            React.createElement(DashboardContextProvider, { config, provider, store },
              React.createElement(PluginSettingsPanel, {
                title: config.labels.settingsTitle + ' Settings',
                subtitle: config.labels.pageSubtitle,
                generalSettings: React.createElement(DashboardSettingsTab),
                registries: [],
                routeBase: '/settings/dashboard',
              }),
            )
          Tab.displayName = 'DashboardSettingsTab'
          return Tab
        })(),
        order: 1,
      },
    ],

    locales: dashboardLocales,
  }
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { DashboardDataProvider } from './data/types'
export type { ResolvedDashboardConfig, DashboardPluginLabels, DashboardCurrency } from './DashboardContext'
export type {
  DashboardMetric, MetricValue, MetricCategory, MetricFormat, ResolvedMetric,
  DashboardSection, DashboardSectionProps, DashboardZone,
  OnboardingStep, OnboardingProgress,
  DashboardPreferences,
} from './types'
