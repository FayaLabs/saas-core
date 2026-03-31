import React, { useState, useMemo } from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { Settings } from 'lucide-react'
import { ModulePage, type ModuleNavItem } from '../../components/layout/ModulePage'
import { CrmContextProvider, type ResolvedCrmConfig } from './CrmContext'
import type { CrmDataProvider } from './data/types'
import type { CrmUIState } from './store'
import type { PluginRegistryDef, PluginQuickAction } from '../../types/plugins'
import { useModuleNavigation } from '../../hooks/useModuleNavigation'
import { QuickActionsButton } from '../../components/plugins/QuickActionsButton'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { CrmGeneralSettings } from './components/CrmGeneralSettings'
import { PipelineSettings } from './components/PipelineSettings'
import { CrmOnboarding } from './components/CrmOnboarding'
import { DashboardView } from './views/DashboardView'
import { PipelineView } from './views/PipelineView'
import { LeadListView } from './views/LeadListView'
import { LeadFormView } from './views/LeadFormView'
import { QuoteListView } from './views/QuoteListView'
import { QuoteFormView } from './views/QuoteFormView'
import { ActivityListView } from './views/ActivityListView'
import { ContactsView } from './views/ContactsView'

function buildNav(config: ResolvedCrmConfig, view: string, navigate: (v: string) => void): ModuleNavItem[] {
  const items: ModuleNavItem[] = [
    { id: 'dashboard', label: config.labels.dashboard, icon: 'BarChart3', active: view === 'dashboard', onClick: () => navigate('dashboard') },
  ]

  if (config.modules.pipeline) {
    items.push({ id: 'pipeline', label: config.labels.pipeline, icon: 'Filter', active: view === 'pipeline', onClick: () => navigate('pipeline') })
  }

  items.push({
    id: 'leads', label: config.labels.leads, icon: 'UserPlus',
    children: [
      { id: 'leads-new', label: config.labels.leadsNew, active: view === 'leads-new', onClick: () => navigate('leads-new') },
      { id: 'leads-list', label: config.labels.leadsList, active: view === 'leads-list', onClick: () => navigate('leads-list') },
    ],
  })

  if (config.modules.quotes) {
    items.push({
      id: 'quotes', label: config.labels.quotes, icon: 'FileText',
      children: [
        { id: 'quotes-new', label: config.labels.quotesNew, active: view === 'quotes-new', onClick: () => navigate('quotes-new') },
        { id: 'quotes-list', label: config.labels.quotesList, active: view === 'quotes-list', onClick: () => navigate('quotes-list') },
      ],
    })
  }

  if (config.modules.activities) {
    items.push({ id: 'activities', label: config.labels.activities, icon: 'MessageCircle', active: view === 'activities', onClick: () => navigate('activities') })
  }

  if (config.modules.contacts) {
    items.push({
      id: 'contacts', label: config.labels.contacts, icon: 'Users',
      children: [
        { id: 'contacts-active', label: config.labels.contactsActive, active: view === 'contacts-active', onClick: () => navigate('contacts-active') },
        { id: 'contacts-inactive', label: config.labels.contactsInactive, active: view === 'contacts-inactive', onClick: () => navigate('contacts-inactive') },
        { id: 'contacts-vip', label: config.labels.contactsVip, active: view === 'contacts-vip', onClick: () => navigate('contacts-vip') },
      ],
    })
  }

  return items
}

export function CrmPage({ config, provider, store, registries }: {
  config: ResolvedCrmConfig
  provider: CrmDataProvider
  store: StoreApi<CrmUIState>
  registries?: PluginRegistryDef[]
}) {
  const { view, animationClass, navigate } = useModuleNavigation('/sales', {
    dashboard: 0, pipeline: 0,
    'leads-list': 0, 'leads-new': 1,
    'quotes-list': 0, 'quotes-new': 1,
    activities: 0,
    'contacts-active': 0, 'contacts-inactive': 0, 'contacts-vip': 0,
    settings: 1,
  }, 'dashboard')

  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    try { return localStorage.getItem('saas-core:crm-onboarded') === 'true' } catch { return false }
  })

  const isSettings = view === 'settings'
  const isSummary = view === 'dashboard'
  const nav = buildNav(config, view, navigate)

  const quickActions = useMemo<PluginQuickAction[]>(() => [
    { id: 'new-lead', label: 'New Lead', icon: 'UserPlus', description: 'Capture a new lead', action: () => navigate('leads-new') },
    { id: 'new-deal', label: 'New Deal', icon: 'Target', description: 'Create a deal from pipeline', action: () => navigate('pipeline') },
    ...(config.modules.quotes ? [{ id: 'new-quote', label: 'New Quote', icon: 'FileText', description: 'Send a proposal', action: () => navigate('quotes-new') }] : []),
    ...(config.modules.activities ? [{ id: 'log-activity', label: 'Log Activity', icon: 'MessageCircle', description: 'Record a call, email, or note', action: () => navigate('activities') }] : []),
  ], [config.modules])

  if (!onboardingComplete) {
    return (
      <CrmContextProvider config={config} provider={provider} store={store}>
        <CrmOnboarding onComplete={() => { setOnboardingComplete(true); try { localStorage.setItem('saas-core:crm-onboarded', 'true') } catch {} }} />
      </CrmContextProvider>
    )
  }

  if (isSettings && registries && registries.length > 0) {
    return (
      <CrmContextProvider config={config} provider={provider} store={store}>
        <div key="settings" className={animationClass}>
          <PluginSettingsPanel
            title="Sales & CRM Settings"
            subtitle="Configure pipeline, lead management, and registries"
            generalSettings={<CrmGeneralSettings />}
            customTabs={[
              { id: 'pipeline', label: 'Pipeline', icon: 'Filter', content: <PipelineSettings /> },
            ]}
            registries={registries}
            routeBase="/sales/settings"
            onClose={() => navigate('dashboard')}
          />
        </div>
      </CrmContextProvider>
    )
  }

  function renderView() {
    switch (view) {
      case 'pipeline': return <PipelineView />
      case 'leads-list': return <LeadListView onNew={() => navigate('leads-new')} />
      case 'leads-new': return <LeadFormView onSaved={() => navigate('leads-list')} />
      case 'quotes-new': return <QuoteFormView onSaved={() => navigate('quotes-list')} />
      case 'quotes-list': return <QuoteListView onNew={() => navigate('quotes-new')} />
      case 'activities': return <ActivityListView />
      case 'contacts-active': return <ContactsView segment="active" />
      case 'contacts-inactive': return <ContactsView segment="inactive" />
      case 'contacts-vip': return <ContactsView segment="vip" />
      default: return <DashboardView />
    }
  }

  return (
    <CrmContextProvider config={config} provider={provider} store={store}>
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
                onClick={() => navigate('settings', '/sales/settings/' + (registries[0]?.id ?? ''))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted/50 transition-colors"
                title="CRM Settings"
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
    </CrmContextProvider>
  )
}
