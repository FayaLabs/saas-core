import React, { useState, useCallback, useMemo } from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { Settings } from 'lucide-react'
import { ModulePage, type ModuleNavItem } from '../../components/layout/ModulePage'
import { FinancialContextProvider, type ResolvedFinancialConfig } from './FinancialContext'
import type { FinancialDataProvider } from './data/types'
import type { FinancialUIState } from './store'
import type { PluginRegistryDef, PluginQuickAction } from '../../types/plugins'
import { useModuleNavigation } from '../../hooks/useModuleNavigation'
import { QuickActionsButton } from '../../components/plugins/QuickActionsButton'
import { SummaryView } from './views/SummaryView'
import { PayablesView } from './views/PayablesView'
import { ReceivablesView } from './views/ReceivablesView'
import { CashRegistersView } from './views/CashRegistersView'
import { StatementsView } from './views/StatementsView'
import { CommissionsView } from './views/CommissionsView'
import { CardsView } from './views/CardsView'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { FinancialGeneralSettings } from './components/FinancialGeneralSettings'
import { FinancialOnboarding } from './components/FinancialOnboarding'

// ---------------------------------------------------------------------------
// View intent — what subpage + mode to show
// ---------------------------------------------------------------------------

export interface ViewIntent {
  view: string
  mode?: 'list' | 'new' | 'edit' | 'detail'
  editId?: string
}

function parseIntent(activeView: string): ViewIntent {
  if (activeView === 'payables-new') return { view: 'payables', mode: 'new' }
  if (activeView === 'payables-list') return { view: 'payables', mode: 'list' }
  if (activeView.startsWith('payables-detail:')) return { view: 'payables', mode: 'detail', editId: activeView.split(':')[1] }
  if (activeView.startsWith('payables-edit:')) return { view: 'payables', mode: 'edit', editId: activeView.split(':')[1] }
  if (activeView === 'receivables-new') return { view: 'receivables', mode: 'new' }
  if (activeView === 'receivables-list') return { view: 'receivables', mode: 'list' }
  if (activeView.startsWith('receivables-detail:')) return { view: 'receivables', mode: 'detail', editId: activeView.split(':')[1] }
  if (activeView.startsWith('receivables-edit:')) return { view: 'receivables', mode: 'edit', editId: activeView.split(':')[1] }
  return { view: activeView }
}

// ---------------------------------------------------------------------------
// Nav builder
// ---------------------------------------------------------------------------

function buildNav(
  config: ResolvedFinancialConfig,
  activeView: string,
  navigate: (view: string, hash?: string) => void,
): ModuleNavItem[] {
  const items: ModuleNavItem[] = [
    {
      id: 'summary',
      label: config.labels.summary,
      icon: 'BarChart3',
      active: activeView === 'summary',
      onClick: () => navigate('summary'),
    },
  ]

  if (config.modules.payables) {
    items.push({
      id: 'payables',
      label: config.labels.payables,
      icon: 'ArrowUpCircle',
      active: activeView.startsWith('payables'),
      children: [
        { id: 'payables-new', label: config.labels.payablesNew, active: activeView === 'payables-new', onClick: () => navigate('payables-new') },
        { id: 'payables-list', label: config.labels.payablesList, active: activeView === 'payables-list', onClick: () => navigate('payables-list') },
        { id: 'payables-recurring', label: config.labels.payablesRecurring, active: activeView === 'payables-recurring', onClick: () => navigate('payables-recurring') },
      ],
    })
  }

  if (config.modules.receivables) {
    items.push({
      id: 'receivables',
      label: config.labels.receivables,
      icon: 'ArrowDownCircle',
      active: activeView.startsWith('receivables'),
      children: [
        { id: 'receivables-new', label: config.labels.receivablesNew, active: activeView === 'receivables-new', onClick: () => navigate('receivables-new') },
        { id: 'receivables-list', label: config.labels.receivablesList, active: activeView === 'receivables-list', onClick: () => navigate('receivables-list') },
      ],
    })
  }

  if (config.modules.cashRegisters) {
    items.push({
      id: 'cash-registers',
      label: config.labels.cashRegisters,
      icon: 'Landmark',
      active: activeView === 'cash-registers',
      onClick: () => navigate('cash-registers'),
    })
  }

  if (config.modules.statements) {
    items.push({
      id: 'statements',
      label: config.labels.statements,
      icon: 'Receipt',
      active: activeView === 'statements',
      onClick: () => navigate('statements'),
    })
  }

  if (config.modules.commissions) {
    items.push({
      id: 'commissions',
      label: config.labels.commissions,
      icon: 'Users',
      children: [
        { id: 'commissions-overview', label: config.labels.commissionsOverview, active: activeView === 'commissions', onClick: () => navigate('commissions') },
        { id: 'commissions-rules', label: config.labels.commissionsRules, active: activeView === 'commissions', onClick: () => navigate('commissions') },
      ],
    })
  }

  if (config.modules.cards) {
    items.push({
      id: 'cards',
      label: config.labels.cards,
      icon: 'CreditCard',
      children: [
        { id: 'cards-overview', label: config.labels.cardsOverview, active: activeView === 'cards', onClick: () => navigate('cards') },
        { id: 'cards-reconciliation', label: config.labels.cardsReconciliation, active: activeView === 'cards', onClick: () => navigate('cards') },
      ],
    })
  }

  return items
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function FinancialPage({ config, provider, store, registries }: {
  config: ResolvedFinancialConfig
  provider: FinancialDataProvider
  store: StoreApi<FinancialUIState>
  registries?: PluginRegistryDef[]
}) {
  const { view, animationClass, navigate } = useModuleNavigation('/financial', {
    summary: 0,
    'payables-list': 0, 'payables-new': 1, 'receivables-list': 0, 'receivables-new': 1,
    'cash-registers': 0, statements: 0, commissions: 0, cards: 0,
    settings: 1,
  })

  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    try { return localStorage.getItem('saas-core:financial-onboarded') === 'true' } catch { return false }
  })

  const intent = parseIntent(view)
  const isSettings = view === 'settings'
  const nav = buildNav(config, view, navigate)

  const quickActions = useMemo<PluginQuickAction[]>(() => {
    const actions: PluginQuickAction[] = []
    if (config.modules.payables) {
      actions.push({
        id: 'new-payable',
        label: 'New Payable',
        icon: 'ArrowUpCircle',
        description: 'Record an expense or bill to pay',
        action: () => navigate('payables-new'),
      })
    }
    if (config.modules.receivables) {
      actions.push({
        id: 'new-receivable',
        label: 'New Receivable',
        icon: 'ArrowDownCircle',
        description: 'Record income or amount to receive',
        action: () => navigate('receivables-new'),
      })
    }
    if (config.modules.cashRegisters) {
      actions.push({
        id: 'open-cash',
        label: 'Open Cash Register',
        icon: 'Landmark',
        description: 'Start a new cash session',
        action: () => navigate('cash-registers'),
      })
    }
    return actions
  }, [config.modules])

  function handleOnboardingComplete() {
    setOnboardingComplete(true)
    try { localStorage.setItem('saas-core:financial-onboarded', 'true') } catch {}
  }

  // Show onboarding on first visit
  if (!onboardingComplete) {
    return (
      <FinancialContextProvider config={config} provider={provider} store={store}>
        <FinancialOnboarding onComplete={handleOnboardingComplete} />
      </FinancialContextProvider>
    )
  }

  // Settings view
  if (isSettings && registries && registries.length > 0) {
    return (
      <FinancialContextProvider config={config} provider={provider} store={store}>
        <div key="settings" className={animationClass}>
          <PluginSettingsPanel
            title="Financial Settings"
            subtitle="Preferences, payment methods, and accounts"
            generalSettings={<FinancialGeneralSettings />}
            registries={registries}
            routeBase="/financial/settings"
            onClose={() => navigate('summary')}
          />
        </div>
      </FinancialContextProvider>
    )
  }

  function renderView() {
    switch (intent.view) {
      case 'payables':
        return <PayablesView intent={intent} onNavigate={navigate} />
      case 'receivables':
        return <ReceivablesView intent={intent} onNavigate={navigate} />
      case 'cash-registers':
        return <CashRegistersView />
      case 'statements':
        return <StatementsView />
      case 'commissions':
        return <CommissionsView />
      case 'cards':
        return <CardsView />
      default:
        return <SummaryView />
    }
  }

  return (
    <FinancialContextProvider config={config} provider={provider} store={store}>
      <ModulePage
        title={config.labels.pageTitle}
        subtitle={config.labels.pageSubtitle}
        nav={nav}
        showHeader={intent.view === 'summary' || view === 'summary'}
        headerAction={
          <div className="flex items-center gap-2">
            {quickActions.length > 0 && <QuickActionsButton actions={quickActions} />}
            {registries && registries.length > 0 && (
              <button
                onClick={() => { window.location.hash = '/settings/financial' }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted/50 transition-colors"
                title="Financial Settings"
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
    </FinancialContextProvider>
  )
}
