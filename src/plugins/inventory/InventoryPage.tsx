import React, { useState, useMemo } from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { Settings } from 'lucide-react'
import { ModulePage, type ModuleNavItem } from '../../components/layout/ModulePage'
import { InventoryContextProvider, type ResolvedInventoryConfig } from './InventoryContext'
import type { InventoryDataProvider } from './data/types'
import type { InventoryUIState } from './store'
import type { PluginRegistryDef, PluginQuickAction } from '../../types/plugins'
import { useModuleNavigation } from '../../hooks/useModuleNavigation'
import { QuickActionsButton } from '../../components/plugins/QuickActionsButton'
import { DashboardView } from './views/DashboardView'
import { ProductListView } from './views/ProductListView'
import { ProductFormView } from './views/ProductFormView'
import { StockMovementView } from './views/StockMovementView'
import { MovementHistoryView } from './views/MovementHistoryView'
import { RecipesView } from './views/RecipesView'
import { RecipeFormView } from './views/RecipeFormView'
import { RecipeDetailView } from './views/RecipeDetailView'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { InventoryGeneralSettings } from './components/InventoryGeneralSettings'
import { InventoryOnboarding } from './components/InventoryOnboarding'

function buildNav(config: ResolvedInventoryConfig, view: string, navigate: (v: string) => void): ModuleNavItem[] {
  const items: ModuleNavItem[] = [
    { id: 'dashboard', label: config.labels.dashboard, icon: 'BarChart3', active: view === 'dashboard', onClick: () => navigate('dashboard') },
    {
      id: 'products', label: config.labels.products, icon: 'Package', active: view.startsWith('products'),
      children: [
        { id: 'products-new', label: config.labels.productsNew, active: view === 'products-new', onClick: () => navigate('products-new') },
        { id: 'products-list', label: config.labels.productsList, active: view === 'products-list', onClick: () => navigate('products-list') },
      ],
    },
    {
      id: 'stock', label: config.labels.stock, icon: 'ArrowUpCircle',
      children: [
        { id: 'stock-entry', label: config.labels.stockEntry, active: view === 'stock-entry', onClick: () => navigate('stock-entry') },
        { id: 'stock-exit', label: config.labels.stockExit, active: view === 'stock-exit', onClick: () => navigate('stock-exit') },
        { id: 'stock-history', label: config.labels.stockHistory, active: view === 'stock-history', onClick: () => navigate('stock-history') },
      ],
    },
  ]

  if (config.modules.recipes) {
    items.push({
      id: 'recipes', label: config.labels.recipes, icon: 'BookOpen',
      children: [
        { id: 'recipes-list', label: config.labels.recipesList, active: view === 'recipes-list' || view.startsWith('recipes-detail:'), onClick: () => navigate('recipes-list') },
        { id: 'recipes-new', label: config.labels.recipesNew, active: view === 'recipes-new', onClick: () => navigate('recipes-new') },
      ],
    })
  }

  return items
}

export function InventoryPage({ config, provider, store, registries }: {
  config: ResolvedInventoryConfig
  provider: InventoryDataProvider
  store: StoreApi<InventoryUIState>
  registries?: PluginRegistryDef[]
}) {
  const { view, animationClass, navigate } = useModuleNavigation('/inventory', {
    dashboard: 0,
    'products-list': 0, 'products-new': 1,
    'stock-entry': 1, 'stock-exit': 1, 'stock-history': 0,
    'recipes-list': 0, 'recipes-new': 1, 'recipes-detail': 1,
    settings: 1,
  }, 'dashboard')

  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    try { return localStorage.getItem('saas-core:inventory-onboarded') === 'true' } catch { return false }
  })

  const isSettings = view === 'settings'
  const isSummary = view === 'dashboard' || view === ''
  const nav = buildNav(config, view, navigate)

  const quickActions = useMemo<PluginQuickAction[]>(() => {
    const actions: PluginQuickAction[] = [
      {
        id: 'new-product',
        label: 'New Product',
        icon: 'Package',
        description: 'Add a product to your catalog',
        action: () => navigate('products-new'),
      },
      {
        id: 'stock-entry',
        label: 'Stock Entry',
        icon: 'ArrowUpRight',
        description: 'Record goods received',
        action: () => navigate('stock-entry'),
      },
      {
        id: 'stock-exit',
        label: 'Stock Exit',
        icon: 'ArrowDownRight',
        description: 'Record goods used or sold',
        action: () => navigate('stock-exit'),
      },
    ]
    return actions
  }, [])

  if (!onboardingComplete) {
    return (
      <InventoryContextProvider config={config} provider={provider} store={store}>
        <InventoryOnboarding onComplete={() => { setOnboardingComplete(true); try { localStorage.setItem('saas-core:inventory-onboarded', 'true') } catch {} }} />
      </InventoryContextProvider>
    )
  }

  if (isSettings && registries && registries.length > 0) {
    return (
      <InventoryContextProvider config={config} provider={provider} store={store}>
        <div key="settings" className={animationClass}>
          <PluginSettingsPanel
            title="Inventory Settings"
            subtitle="Preferences, suppliers, categories, and units"
            generalSettings={<InventoryGeneralSettings />}
            registries={registries}
            routeBase="/inventory/settings"
            onClose={() => navigate('dashboard')}
          />
        </div>
      </InventoryContextProvider>
    )
  }

  // Parse edit/detail intents from view like 'products-edit:uuid' or 'stock-detail:uuid'
  const editMatch = view.match(/^products-edit:(.+)$/)
  const editId = editMatch?.[1]
  const movementDetailMatch = view.match(/^stock-detail:(.+)$/)
  const movementDetailId = movementDetailMatch?.[1]

  function renderView() {
    if (editId) return <ProductFormView editId={editId} onSaved={() => navigate('products-list')} />

    if (movementDetailId) {
      // Find the movement in the store or fetch it
      const movements = store.getState().movements
      const movement = movements.find((m) => m.id === movementDetailId)
      if (movement) {
        return <StockMovementView defaultType={movement.movementType} viewMovement={movement} onSaved={() => navigate('stock-history')} />
      }
      // If not found, go back to history
      return <MovementHistoryView onViewDetail={(id) => navigate(`stock-detail:${id}`)} />
    }

    switch (view) {
      case 'products-list': return <ProductListView onNew={() => navigate('products-new')} onEdit={(id) => navigate(`products-edit:${id}`)} />
      case 'products-new': return <ProductFormView onSaved={() => navigate('products-list')} />
      case 'stock-entry': return <StockMovementView defaultType="entry" onSaved={() => navigate('stock-history')} />
      case 'stock-exit': return <StockMovementView defaultType="exit" onSaved={() => navigate('stock-history')} />
      case 'stock-history': return <MovementHistoryView onViewDetail={(id) => navigate(`stock-detail:${id}`)} />
      case 'recipes-list': return <RecipesView onNew={() => navigate('recipes-new')} onView={(id) => navigate(`recipes-detail:${id}`)} />
      case 'recipes-new': return <RecipeFormView onSaved={(id) => id ? navigate(`recipes-detail:${id}`) : navigate('recipes-list')} />
      default: {
        if (view.startsWith('recipes-detail:')) {
          const id = view.slice('recipes-detail:'.length)
          return <RecipeDetailView recipeId={id} onBack={() => navigate('recipes-list')} />
        }
        return <DashboardView />
      }
    }
  }

  return (
    <InventoryContextProvider config={config} provider={provider} store={store}>
      <ModulePage
        title={config.labels.pageTitle}
        subtitle={config.labels.pageSubtitle}
        nav={nav}
        showHeader={isSummary}
        headerAction={
          <div className="flex items-center gap-2">
            {quickActions.length > 0 && <QuickActionsButton actions={quickActions} />}
            {registries && registries.length > 0 && (
              <button
                onClick={() => { window.location.hash = '/settings/inventory' }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted/50 transition-colors"
                title="Inventory Settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        }
      >
        <div key={view} className={animationClass}>
          {renderView()}
        </div>
      </ModulePage>
    </InventoryContextProvider>
  )
}
