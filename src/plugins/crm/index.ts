import React from 'react'
import type { PluginManifest, PluginScope, VerticalId } from '../../types/plugins'
import type { EntityLookupMap } from '../../types/entity-lookup'
import { CrmPage } from './CrmPage'
import type { ResolvedCrmConfig } from './CrmContext'
import type { CrmDataProvider } from './data/types'
import { createMockCrmProvider } from './data/mock'
import { createSupabaseCrmProvider } from './data/supabase'
import { createCrmStore } from './store'
import { crmRegistries } from './registries'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { CrmGeneralSettings } from './components/CrmGeneralSettings'
import { PipelineSettings } from './components/PipelineSettings'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CrmPluginLabels {
  pageTitle: string
  pageSubtitle: string
  dashboard: string
  pipeline: string
  leads: string
  leadsNew: string
  leadsList: string
  deals: string
  quotes: string
  quotesNew: string
  quotesList: string
  activities: string
  contacts: string
  contactsActive: string
  contactsInactive: string
  contactsVip: string
}

export interface CrmPluginOptions {
  modules?: {
    quotes?: boolean
    activities?: boolean
    contacts?: boolean
    pipeline?: boolean
  }
  labels?: Partial<CrmPluginLabels>
  currency?: { code?: string; locale?: string; symbol?: string }
  leadSources?: Array<{ value: string; label: string }>
  dealStages?: Array<{ name: string; color: string; probability: number }>
  activityTypes?: Array<{ value: string; label: string; icon?: string }>
  itemTypes?: Array<{ value: string; label: string }>
  dataProvider?: CrmDataProvider
  navPosition?: number
  navSection?: 'main' | 'secondary'
  scope?: PluginScope
  verticalId?: VerticalId
  /** Entity lookups for cross-plugin references (e.g., product/service search in quotes) */
  entityLookups?: EntityLookupMap
  /** Contact/person lookup for client search in quotes and leads */
  contactLookup?: import('../../types/entity-lookup').EntityLookup
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LABELS: CrmPluginLabels = {
  pageTitle: 'Sales',
  pageSubtitle: 'CRM, leads, deals, and pipeline management',
  dashboard: 'Dashboard',
  pipeline: 'Pipeline',
  leads: 'Leads',
  leadsNew: 'New',
  leadsList: 'List',
  deals: 'Deals',
  quotes: 'Quotes',
  quotesNew: 'New',
  quotesList: 'List',
  activities: 'Activities',
  contacts: 'Contacts',
  contactsActive: 'Active',
  contactsInactive: 'Inactive',
  contactsVip: 'VIP',
}

const DEFAULT_CURRENCY = { code: 'BRL', locale: 'pt-BR', symbol: 'R$' }

const DEFAULT_ITEM_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' },
]

// ---------------------------------------------------------------------------
// Config resolver
// ---------------------------------------------------------------------------

function resolveConfig(options?: CrmPluginOptions): ResolvedCrmConfig {
  return {
    modules: {
      quotes: options?.modules?.quotes !== false,
      activities: options?.modules?.activities !== false,
      contacts: options?.modules?.contacts !== false,
      pipeline: options?.modules?.pipeline !== false,
    },
    labels: { ...DEFAULT_LABELS, ...options?.labels },
    currency: { ...DEFAULT_CURRENCY, ...options?.currency },
    itemTypes: options?.itemTypes ?? DEFAULT_ITEM_TYPES,
    entityLookups: options?.entityLookups ?? {},
    contactLookup: options?.contactLookup,
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCrmPlugin(options?: CrmPluginOptions): PluginManifest {
  const config = resolveConfig(options)
  const provider = options?.dataProvider ?? createSupabaseCrmProvider()
  const store = createCrmStore(provider)

  const PageComponent: React.FC<any> = () =>
    React.createElement(CrmPage, { config, provider, store, registries: crmRegistries })

  return {
    id: 'crm',
    name: config.labels.pageTitle,
    icon: 'Filter',
    version: '1.0.0',
    scope: options?.scope ?? 'universal',
    verticalId: options?.verticalId,
    defaultEnabled: true,
    dependencies: [],
    navigation: [
      {
        section: options?.navSection ?? 'main',
        position: options?.navPosition ?? 5,
        label: config.labels.pageTitle,
        route: '/sales',
        icon: 'Filter',
        permission: { feature: 'sales', action: 'read' as const },
      },
    ],
    routes: [
      {
        path: '/sales',
        component: PageComponent,
        permission: { feature: 'sales', action: 'read' as const },
      },
    ],
    widgets: [],
    aiTools: [
      {
        id: 'crm.count-customers',
        name: 'countCustomers',
        description: 'Returns the number of active customers/clients.',
        icon: 'Users',
        mode: 'read' as const,
        category: 'Sales',
        parameters: {
          type: 'object' as const,
          properties: {
            status: { type: 'string' as const, enum: ['active', 'inactive', 'all'] },
          },
        },
        suggestions: [
          { label: 'How many customers do we have?', verticalId: 'beauty' as const },
          { label: 'How many clients do we have?', verticalId: 'services' as const },
          { label: 'How many patients today?', verticalId: 'health' as const },
        ],
        permission: { feature: 'sales', action: 'read' as const },
      },
      {
        id: 'crm.list-leads',
        name: 'listLeads',
        description: 'Lists leads with optional filters.',
        icon: 'Target',
        mode: 'read' as const,
        category: 'Sales',
        parameters: {
          type: 'object' as const,
          properties: {
            source: { type: 'string' as const, description: 'Lead source filter' },
            status: { type: 'string' as const, enum: ['new', 'contacted', 'qualified', 'lost'] },
          },
        },
        permission: { feature: 'sales', action: 'read' as const },
        suggestions: [
          { label: 'Show new leads from this week' },
        ],
      },
    ],
    registries: crmRegistries,
    settings: [
      {
        id: 'crm',
        label: 'Sales & CRM',
        icon: 'Filter',
        component: (() => {
          const Tab: React.FC = () =>
            React.createElement(PluginSettingsPanel, {
              title: 'Sales & CRM Settings',
              subtitle: 'Pipeline, lead management, and registries',
              generalSettings: React.createElement(CrmGeneralSettings),
              customTabs: [
                { id: 'pipeline', label: 'Pipeline', icon: 'Filter', content: React.createElement(PipelineSettings) },
              ],
              registries: crmRegistries,
              routeBase: '/settings/crm',
            })
          Tab.displayName = 'CrmSettingsTab'
          return Tab
        })(),
        order: 12,
        permission: { feature: 'sales', action: 'read' as const },
      },
    ],
  }
}

export type { CrmDataProvider } from './data/types'
export type { ResolvedCrmConfig } from './CrmContext'
