import * as React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Popover from '@radix-ui/react-popover'
import {
  Home,
  Users,
  Settings,
  CreditCard,
  Bell,
  Calendar,
  Package,
  BarChart3,
  FileText,
  Mail,
  PanelLeftClose,
  PanelLeft,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useRouter } from '../../lib/router'
import { UserMenu } from './UserMenu'
import { NotificationInbox } from '../notifications/NotificationInbox'
import { useNotificationStore } from '../../stores/notifications.store'
import { usePermission } from '../../hooks/usePermission'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
  permission?: { feature: string; action: 'read' | 'create' | 'edit' | 'delete' }
}

interface SidebarUser {
  fullName: string
  avatarUrl?: string
  email: string
}

interface SidebarProps {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  collapsed: boolean
  onToggle: () => void
  onNavigate?: (route: string) => void
  currentPath?: string
  user?: SidebarUser
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  onBilling?: () => void
  userMenuExtras?: { label: string; icon?: React.ReactNode; onClick: () => void }[]
  orgSwitcher?: React.ReactNode
  topContent?: React.ReactNode
  footerContent?: React.ReactNode
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Users,
  Settings,
  CreditCard,
  Bell,
  Calendar,
  Package,
  BarChart3,
  FileText,
  Mail,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Home
}

function NavItem({
  item,
  collapsed,
  isActive,
  onNavigate,
}: {
  item: NavigationItem
  collapsed: boolean
  isActive: boolean
  onNavigate: (route: string) => void
}) {
  const Icon = getIcon(item.icon)

  const content = (
    <button
      onClick={() => onNavigate(item.route)}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-muted',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{item.label}</span>
          {item.badge !== undefined && (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
          >
            {item.label}
            {item.badge !== undefined && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return content
}

export function Sidebar({
  navigation,
  logo,
  collapsed,
  onToggle,
  onNavigate,
  currentPath: currentPathProp,
  user,
  onSignOut,
  onProfile,
  onSettings,
  onBilling,
  userMenuExtras,
  orgSwitcher,
  topContent,
  footerContent,
}: SidebarProps) {
  const router = useRouter()
  const routerPath = router.usePathname()
  const currentPath = currentPathProp ?? routerPath
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
  const { can } = usePermission()

  // Filter navigation items by permission
  const visibleNavigation = navigation.filter((item) => {
    if (!item.permission) return true
    return can(item.permission.feature, item.permission.action)
  })

  const mainItems = visibleNavigation.filter((item) => item.section === 'main')
  const secondaryItems = visibleNavigation.filter((item) => item.section === 'secondary')
  const settingsItems = visibleNavigation.filter((item) => item.section === 'settings')

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route)
    } else {
      router.navigate(route)
    }
  }

  return (
    <Tooltip.Provider>
      <aside
        className={cn(
          'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo + Collapse Toggle */}
        <div
          className={cn(
            'flex h-14 items-center justify-between border-b border-sidebar-border px-4',
            collapsed && 'justify-center px-2'
          )}
        >
          {!collapsed && (
            <>
              {logo ?? <span className="text-lg font-bold">App</span>}
              <button
                onClick={onToggle}
                className="ml-auto rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={onToggle}
              className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {topContent && <div className="mb-4 space-y-2">{topContent}</div>}

          {mainItems.length > 0 && (
            <div className="space-y-1">
              {mainItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={currentPath === item.route || currentPath.startsWith(item.route + '/')}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}

          {secondaryItems.length > 0 && (
            <div className="mt-6 space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                  Secondary
                </p>
              )}
              {secondaryItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={currentPath === item.route || currentPath.startsWith(item.route + '/')}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Settings nav items */}
        {settingsItems.length > 0 && (
          <div className="border-t border-sidebar-border p-2 space-y-1">
            {settingsItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                isActive={currentPath === item.route || currentPath.startsWith(item.route + '/')}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}

        {footerContent && (
          <div className="border-t border-sidebar-border p-2">
            <div className="space-y-2">{footerContent}</div>
          </div>
        )}

        {/* Org Switcher — above user row */}
        {orgSwitcher && React.isValidElement(orgSwitcher)
          ? React.cloneElement(orgSwitcher as React.ReactElement<any>, { collapsed })
          : orgSwitcher}

        {/* Bottom: User row with inline action icons */}
        <div className="border-t border-sidebar-border p-2">
          <div className={cn(
            'flex items-center rounded-md',
            collapsed ? 'flex-col gap-1' : 'gap-1 px-1'
          )}>
            {/* User Menu — left side, dropdown opens right */}
            {user && (
              <UserMenu
                user={user}
                onSignOut={onSignOut}
                onProfile={onProfile}
                onSettings={onSettings}
                onBilling={onBilling}
                extraItems={userMenuExtras}
                side="right"
              />
            )}

            {/* Spacer pushes icons to right when expanded */}
            {!collapsed && <div className="flex-1" />}

            {/* Search */}
            <button
              className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  className="relative inline-flex shrink-0 items-center justify-center rounded-md p-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="right"
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
          </div>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
