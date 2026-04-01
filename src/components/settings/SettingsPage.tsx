import * as React from 'react'
import { Building2, User, Shield, Palette } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../hooks/useTranslation'
import { ConnectedCompanySettings } from './ConnectedCompanySettings'
import { ConnectedUserProfile } from './ConnectedUserProfile'
import { ConnectedSecuritySettings } from './ConnectedSecuritySettings'
import { ConnectedBrandingSettings } from './ConnectedBrandingSettings'

interface SettingsTab {
  id: string
  label: string
  icon?: React.ReactNode
  component: React.ReactNode
}

interface SettingsPageProps {
  tabs?: SettingsTab[]
  extraTabs?: SettingsTab[]
  defaultTab?: string
  className?: string
  beforeContent?: React.ReactNode
  afterContent?: React.ReactNode
}

const DEFAULT_TABS: SettingsTab[] = [
  { id: 'general', label: 'General', icon: <Building2 className="h-4 w-4" />, component: <ConnectedCompanySettings /> },
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" />, component: <ConnectedUserProfile /> },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" />, component: <ConnectedSecuritySettings /> },
  { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" />, component: <ConnectedBrandingSettings /> },
]

export function SettingsPage({
  tabs,
  extraTabs,
  defaultTab,
  className,
  beforeContent,
  afterContent,
}: SettingsPageProps) {
  const { t } = useTranslation()
  const baseTabs = tabs ?? DEFAULT_TABS
  const resolvedTabs = extraTabs ? [...baseTabs, ...extraTabs] : baseTabs

  // Detect active tab from URL: /settings/financial/... → 'financial'
  function getTabFromHash(): string {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) || '/' : '/'
    if (hash.startsWith('/settings/')) {
      const tabId = hash.slice('/settings/'.length).split('/')[0]
      if (resolvedTabs.find((t) => t.id === tabId)) return tabId
    }
    return defaultTab ?? resolvedTabs[0]?.id ?? 'general'
  }

  const [activeTab, setActiveTab] = React.useState(getTabFromHash)

  // Sync tab from hash changes
  React.useEffect(() => {
    const handler = () => setActiveTab(getTabFromHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [resolvedTabs])

  const activeContent = resolvedTabs.find((t) => t.id === activeTab)?.component

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {beforeContent}

      <div className="flex gap-6">
        {/* Left side menu */}
        <nav className="w-52 shrink-0">
          <ul className="space-y-0.5">
            {resolvedTabs.map((tab, i) => (
              <React.Fragment key={tab.id}>
                {/* Divider between core tabs and plugin tabs */}
                {(tab as any).isPlugin && (i === 0 || !(resolvedTabs[i - 1] as any)?.isPlugin) && (
                  <li className="py-2">
                    <div className="border-t" />
                    <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('common.plugins')}</p>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => { setActiveTab(tab.id); window.location.hash = `/settings/${tab.id}` }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                    {tab.label}
                  </button>
                </li>
              </React.Fragment>
            ))}
          </ul>
        </nav>

        {/* Content area */}
        <div className="min-w-0 flex-1">{activeContent}</div>
      </div>

      {afterContent}
    </div>
  )
}
