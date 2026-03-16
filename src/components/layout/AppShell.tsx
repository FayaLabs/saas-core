import * as React from 'react'
import { SidebarLayout } from './SidebarLayout'
import { TopbarLayout } from './TopbarLayout'
import { MinimalLayout } from './MinimalLayout'
import { UserMenu } from './UserMenu'
import { NotificationBell } from '../notifications/NotificationBell'
import { NotificationInbox } from '../notifications/NotificationInbox'
import { useNotificationStore } from '../../stores/notifications.store'
import { Menu, Search } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
}

interface AppShellUser {
  fullName: string
  avatarUrl?: string
  email: string
}

interface AppShellProps {
  variant: 'sidebar' | 'topbar' | 'minimal'
  navigation?: NavigationItem[]
  logo?: React.ReactNode
  user?: AppShellUser
  children?: React.ReactNode
  onNavigate?: (route: string) => void
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  onBilling?: () => void
  pageTitle?: string
  currentPath?: string
  userMenuExtras?: { label: string; icon?: React.ReactNode; onClick: () => void }[]
  orgSwitcher?: React.ReactNode
}

function TopbarActions({
  user,
  onSignOut,
  onProfile,
  onSettings,
  userMenuExtras,
}: {
  user?: AppShellUser
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  userMenuExtras?: AppShellProps['userMenuExtras']
}) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()

  return (
    <div className="flex items-center gap-1">
      <button
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Notification dropdown */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <div>
            <NotificationBell unreadCount={unreadCount} />
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-50 rounded-md border border-border bg-card shadow-md animate-in fade-in-0 zoom-in-95"
          >
            <NotificationInbox
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* User menu */}
      {user && (
        <UserMenu
          user={user}
          onSignOut={onSignOut}
          onProfile={onProfile}
          onSettings={onSettings}
          extraItems={userMenuExtras}
        />
      )}
    </div>
  )
}

export function AppShell({
  variant,
  navigation = [],
  logo,
  user,
  children,
  onNavigate,
  onSignOut,
  onProfile,
  onSettings,
  onBilling,
  pageTitle,
  currentPath,
  userMenuExtras,
  orgSwitcher,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  switch (variant) {
    case 'sidebar': {
      // For sidebar variant: topbar only has page title + mobile hamburger
      // Search, notifications, and user menu are in the sidebar bottom
      const sidebarTopbar = (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {pageTitle && <h2 className="font-semibold text-lg">{pageTitle}</h2>}
          </div>
          <div />
        </>
      )

      return (
        <SidebarLayout
          navigation={navigation}
          logo={logo}
          user={user}
          onNavigate={onNavigate}
          currentPath={currentPath}
          topbarContent={sidebarTopbar}
          onSignOut={onSignOut}
          onProfile={onProfile}
          onSettings={onSettings}
          onBilling={onBilling}
          userMenuExtras={userMenuExtras}
          orgSwitcher={orgSwitcher}
        >
          {children}
          {/* Mobile drawer */}
          {mobileMenuOpen && (
            <MobileOverlay
              navigation={navigation}
              logo={logo}
              onNavigate={(route) => {
                onNavigate?.(route)
                setMobileMenuOpen(false)
              }}
              onClose={() => setMobileMenuOpen(false)}
            />
          )}
        </SidebarLayout>
      )
    }

    case 'topbar':
      return (
        <TopbarLayout
          navigation={navigation}
          logo={logo}
          user={user}
          onNavigate={onNavigate}
          rightContent={
            <div className="flex items-center gap-1">
              <TopbarActions
                user={user}
                onSignOut={onSignOut}
                onProfile={onProfile}
                onSettings={onSettings}
                userMenuExtras={userMenuExtras}
              />
            </div>
          }
        >
          {children}
        </TopbarLayout>
      )

    case 'minimal':
      return (
        <MinimalLayout logo={logo} user={user}>
          {children}
        </MinimalLayout>
      )

    default: {
      const _exhaustive: never = variant
      return null
    }
  }
}

function MobileOverlay({
  navigation,
  logo,
  onNavigate,
  onClose,
}: {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  onNavigate: (route: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          {logo ?? <span className="text-lg font-bold">App</span>}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.route)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  )
}
