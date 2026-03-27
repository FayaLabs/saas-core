import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Building2, User, Shield, Palette } from 'lucide-react'
import { cn } from '../../lib/cn'
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
  const baseTabs = tabs ?? DEFAULT_TABS
  const resolvedTabs = extraTabs ? [...baseTabs, ...extraTabs] : baseTabs
  const resolvedDefault = defaultTab ?? resolvedTabs[0]?.id ?? 'general'

  return (
    <div className={cn('mx-auto max-w-4xl space-y-6', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and organization preferences.
        </p>
      </div>

      {beforeContent}

      <TabsPrimitive.Root defaultValue={resolvedDefault}>
        <TabsPrimitive.List className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          {resolvedTabs.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
              )}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {resolvedTabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.id}
            value={tab.id}
            className="mt-6 focus-visible:outline-none"
          >
            {tab.component}
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>

      {afterContent}
    </div>
  )
}
