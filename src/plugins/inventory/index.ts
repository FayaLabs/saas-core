import React from 'react'
import type { PluginManifest, PluginScope, VerticalId } from '../../types/plugins'
import { InventoryPage } from './InventoryPage'
import type { ResolvedInventoryConfig } from './InventoryContext'
import type { InventoryDataProvider } from './data/types'
import { createMockInventoryProvider } from './data/mock'
import { createSupabaseInventoryProvider } from './data/supabase'
import { createInventoryStore } from './store'
import { inventoryRegistries } from './registries'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { InventoryGeneralSettings } from './components/InventoryGeneralSettings'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface InventoryPluginLabels {
  pageTitle: string
  pageSubtitle: string
  dashboard: string
  products: string
  productsNew: string
  productsList: string
  stock: string
  stockEntry: string
  stockExit: string
  stockHistory: string
  recipes: string
  recipesNew: string
  recipesList: string
}

export interface InventoryPluginOptions {
  modules?: {
    recipes?: boolean
    stockLocations?: boolean
    batchTracking?: boolean
  }
  labels?: Partial<InventoryPluginLabels>
  productTypes?: Array<{ value: string; label: string }>
  currency?: { code?: string; locale?: string; symbol?: string }
  navPosition?: number
  navSection?: 'main' | 'secondary'
  scope?: PluginScope
  verticalId?: VerticalId
  dataProvider?: InventoryDataProvider
  locations?: Array<{ id: string; name: string; isHQ?: boolean }>
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LABELS: InventoryPluginLabels = {
  pageTitle: 'Inventory',
  pageSubtitle: 'Product catalog and stock management',
  dashboard: 'Dashboard',
  products: 'Products',
  productsNew: 'New',
  productsList: 'List',
  stock: 'Stock',
  stockEntry: 'Entry',
  stockExit: 'Exit',
  stockHistory: 'History',
  recipes: 'Recipes',
  recipesNew: 'New',
  recipesList: 'List',
}

const DEFAULT_CURRENCY = { code: 'BRL', locale: 'pt-BR', symbol: 'R$' }

const DEFAULT_PRODUCT_TYPES = [
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'sale', label: 'For Sale' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'asset', label: 'Asset' },
]

// ---------------------------------------------------------------------------
// Config resolver
// ---------------------------------------------------------------------------

function resolveConfig(options?: InventoryPluginOptions): ResolvedInventoryConfig {
  return {
    modules: {
      recipes: options?.modules?.recipes !== false,
      stockLocations: options?.modules?.stockLocations !== false,
      batchTracking: options?.modules?.batchTracking ?? false,
    },
    labels: { ...DEFAULT_LABELS, ...options?.labels },
    currency: { ...DEFAULT_CURRENCY, ...options?.currency },
    productTypes: options?.productTypes ?? DEFAULT_PRODUCT_TYPES,
    locations: options?.locations ?? [],
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createInventoryPlugin(options?: InventoryPluginOptions): PluginManifest {
  const config = resolveConfig(options)
  // Use Supabase provider — it resolves the client lazily on first call
  // Fall back to mock only if no explicit provider is given
  const provider = options?.dataProvider ?? createSupabaseInventoryProvider()
  const store = createInventoryStore(provider)

  const PageComponent: React.FC<any> = () =>
    React.createElement(InventoryPage, { config, provider, store, registries: inventoryRegistries })

  return {
    id: 'inventory',
    name: config.labels.pageTitle,
    icon: 'Package',
    version: '1.0.0',
    scope: options?.scope ?? 'universal',
    verticalId: options?.verticalId,
    defaultEnabled: true,
    dependencies: [],
    navigation: [
      {
        section: options?.navSection ?? 'main',
        position: options?.navPosition ?? 4,
        label: config.labels.pageTitle,
        route: '/inventory',
        icon: 'Package',
        permission: { feature: 'inventory', action: 'read' as const },
      },
    ],
    routes: [
      {
        path: '/inventory',
        component: PageComponent,
        permission: { feature: 'inventory', action: 'read' as const },
      },
    ],
    widgets: [],
    aiTools: [
      {
        id: 'inventory.low-stock',
        name: 'getLowStock',
        description: 'Lists products with stock below minimum threshold.',
        icon: 'AlertTriangle',
        mode: 'read' as const,
        category: 'Inventory',
        parameters: {
          type: 'object' as const,
          properties: {
            threshold: { type: 'number' as const, description: 'Custom stock threshold' },
          },
        },
        suggestions: [
          { label: 'Which products are running low?' },
          { label: 'What ingredients need restocking?', verticalId: 'food' as const },
        ],
        permission: { feature: 'inventory', action: 'read' as const },
      },
    ],
    registries: inventoryRegistries,
    settings: [
      {
        id: 'inventory',
        label: 'Inventory',
        icon: 'Package',
        component: (() => {
          const Tab: React.FC = () =>
            React.createElement(PluginSettingsPanel, {
              title: 'Inventory Settings',
              subtitle: 'Preferences, suppliers, categories, and units',
              generalSettings: React.createElement(InventoryGeneralSettings),
              registries: inventoryRegistries,
              routeBase: '/settings/inventory',
            })
          Tab.displayName = 'InventorySettingsTab'
          return Tab
        })(),
        order: 11,
        permission: { feature: 'inventory', action: 'read' as const },
      },
    ],
  }
}

export type { InventoryDataProvider } from './data/types'
export type { ResolvedInventoryConfig } from './InventoryContext'
