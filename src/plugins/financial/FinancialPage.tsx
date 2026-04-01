import React, { useState, useCallback, useMemo } from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { Settings } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
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
  t: (key: string, params?: Record<string, string | number>) => string,
): ModuleNavItem[] {
  const items: ModuleNavItem[] = [
    {
      id: 'summary',
      label: t('financial.nav.summary'),
      icon: 'BarChart3',
      active: activeView === 'summary',
      onClick: () => navigate('summary'),
    },
  ]

  if (config.modules.payables) {
    items.push({
      id: 'payables',
      label: t('financial.nav.payables'),
      icon: 'ArrowUpCircle',
      active: activeView.startsWith('payables'),
      children: [
        { id: 'payables-new', label: t('financial.nav.new'), active: activeView === 'payables-new', onClick: () => navigate('payables-new') },
        { id: 'payables-list', label: t('financial.nav.list'), active: activeView === 'payables-list', onClick: () => navigate('payables-list') },
        { id: 'payables-recurring', label: t('financial.nav.recurringExpenses'), active: activeView === 'payables-recurring', onClick: () => navigate('payables-recurring') },
      ],
    })
  }

  if (config.modules.receivables) {
    items.push({
      id: 'receivables',
      label: t('financial.nav.receivables'),
      icon: 'ArrowDownCircle',
      active: activeView.startsWith('receivables'),
      children: [
        { id: 'receivables-new', label: t('financial.nav.new'), active: activeView === 'receivables-new', onClick: () => navigate('receivables-new') },
        { id: 'receivables-list', label: t('financial.nav.list'), active: activeView === 'receivables-list', onClick: () => navigate('receivables-list') },
      ],
    })
  }

  if (config.modules.cashRegisters) {
    items.push({
      id: 'cash-registers',
      label: t('financial.nav.cashRegisters'),
      icon: 'Landmark',
      active: activeView === 'cash-registers',
      onClick: () => navigate('cash-registers'),
    })
  }

  if (config.modules.statements) {
    items.push({
      id: 'statements',
      label: t('financial.nav.statements'),
      icon: 'Receipt',
      active: activeView === 'statements',
      onClick: () => navigate('statements'),
    })
  }

  if (config.modules.commissions) {
    items.push({
      id: 'commissions',
      label: t('financial.nav.commissions'),
      icon: 'Users',
      children: [
        { id: 'commissions-overview', label: t('financial.nav.overview'), active: activeView === 'commissions', onClick: () => navigate('commissions') },
        { id: 'commissions-rules', label: t('financial.nav.rules'), active: activeView === 'commissions', onClick: () => navigate('commissions') },
      ],
    })
  }

  if (config.modules.cards) {
    items.push({
      id: 'cards',
      label: t('financial.nav.cards'),
      icon: 'CreditCard',
      children: [
        { id: 'cards-overview', label: t('financial.nav.overview'), active: activeView === 'cards', onClick: () => navigate('cards') },
        { id: 'cards-reconciliation', label: t('financial.nav.reconciliation'), active: activeView === 'cards', onClick: () => navigate('cards') },
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

  const { t } = useTranslation()
  const intent = parseIntent(view)
  const isSettings = view === 'settings'
  const nav = buildNav(config, view, navigate, t)

  const quickActions = useMemo<PluginQuickAction[]>(() => {
    const actions: PluginQuickAction[] = []
    if (config.modules.payables) {
      actions.push({
        id: 'new-payable',
        label: t('financial.quickActions.newPayable'),
        icon: 'ArrowUpCircle',
        description: t('financial.quickActions.newPayableDesc'),
        action: () => navigate('payables-new'),
      })
    }
    if (config.modules.receivables) {
      actions.push({
        id: 'new-receivable',
        label: t('financial.quickActions.newReceivable'),
        icon: 'ArrowDownCircle',
        description: t('financial.quickActions.newReceivableDesc'),
        action: () => navigate('receivables-new'),
      })
    }
    if (config.modules.cashRegisters) {
      actions.push({
        id: 'open-cash',
        label: t('financial.quickActions.openCashRegister'),
        icon: 'Landmark',
        description: t('financial.quickActions.openCashRegisterDesc'),
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
            title={t('financial.settingsPage.title')}
            subtitle={t('financial.settingsPage.subtitle')}
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
                title={t('financial.settingsPage.title')}
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
