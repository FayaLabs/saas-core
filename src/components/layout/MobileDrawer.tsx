import * as React from 'react'
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Home, Users, Settings, CreditCard, Bell, Calendar, Package, BarChart3,
  FileText, Mail, DollarSign, Megaphone, ShoppingCart, Target, Wrench,
  ClipboardList, Briefcase, UserCog, BookOpen, MessageCircle, Globe,
  Percent, Tag, Camera, UtensilsCrossed, MapPin, Handshake, Contact,
  Building2, Filter, Plus, List, ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../hooks/useTranslation'
import { UserMenu } from './UserMenu'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
  children?: NavigationItem[]
}

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: NavigationItem[]
  logo?: React.ReactNode
  activeRoute: string
  onNavigate: (route: string) => void
  user?: { fullName: string; avatarUrl?: string; email: string }
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  onBilling?: () => void
  userMenuExtras?: { label: string; icon?: React.ReactNode; onClick: () => void }[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Users, Settings, CreditCard, Bell, Calendar, Package, BarChart3,
  FileText, Mail, DollarSign, Megaphone, ShoppingCart, Target, Wrench,
  ClipboardList, Briefcase, UserCog, BookOpen, MessageCircle, Globe,
  Percent, Tag, Camera, UtensilsCrossed, MapPin, Handshake, Contact,
  Building2, Filter, Plus, List,
}

function isRouteActive(route: string, activeRoute: string): boolean {
  return activeRoute === route || activeRoute.startsWith(route + '/')
}

function hasActiveChild(item: NavigationItem, activeRoute: string): boolean {
  return item.children?.some((c) => isRouteActive(c.route, activeRoute)) ?? false
}

function getInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export function MobileDrawer({
  open,
  onOpenChange,
  navigation,
  logo,
  activeRoute,
  onNavigate,
  user,
  onSignOut,
  onProfile,
  onSettings,
  onBilling,
  userMenuExtras,
}: MobileDrawerProps) {
  const { t } = useTranslation()
  const mainItems = navigation.filter((item) => item.section === 'main')
  const secondaryItems = navigation.filter((item) => item.section === 'secondary')
  const settingsItems = navigation.filter((item) => item.section === 'settings')

  // Track which parent items are expanded
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand items whose children contain the active route
    const initial = new Set<string>()
    for (const item of navigation) {
      if (hasActiveChild(item, activeRoute)) {
        initial.add(item.id)
      }
    }
    return initial
  })

  // Update expanded state when active route changes
  useEffect(() => {
    for (const item of navigation) {
      if (hasActiveChild(item, activeRoute)) {
        setExpanded((prev) => {
          if (prev.has(item.id)) return prev
          const next = new Set(prev)
          next.add(item.id)
          return next
        })
      }
    }
  }, [activeRoute, navigation])

  const handleNavigate = (route: string) => {
    onNavigate(route)
    onOpenChange(false)
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderItem = (item: NavigationItem) => {
    const Icon = ICON_MAP[item.icon] ?? Home
    const hasChildren = item.children && item.children.length > 0
    const isActive = isRouteActive(item.route, activeRoute)
    const isExpanded = expanded.has(item.id)
    const childActive = hasChildren && hasActiveChild(item, activeRoute)

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'hover:bg-muted',
              isActive || childActive
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-180',
              )}
            />
          </button>

          {isExpanded && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
              {item.children!.map((child) => {
                const ChildIcon = ICON_MAP[child.icon] ?? Home
                const childIsActive = isRouteActive(child.route, activeRoute)
                return (
                  <button
                    key={child.id}
                    onClick={() => handleNavigate(child.route)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-muted',
                      childIsActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    <ChildIcon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{child.label}</span>
                    {child.badge !== undefined && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {child.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.route)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          'hover:bg-muted',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge !== undefined && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {item.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="saas-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="saas-drawer fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card shadow-2xl outline-none">
          <Dialog.Title className="sr-only">{t('layout.mobileDrawer.title')}</Dialog.Title>
          <Dialog.Description className="sr-only">{t('layout.mobileDrawer.description')}</Dialog.Description>

          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            {logo ?? <span className="text-lg font-bold">App</span>}
            <Dialog.Close asChild>
              <button
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 flex flex-col">
            {mainItems.length > 0 && (
              <div className="space-y-0.5">{mainItems.map(renderItem)}</div>
            )}

            {secondaryItems.length > 0 && (
              <div className="mt-6 space-y-0.5">
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('common.more')}
                </p>
                {secondaryItems.map(renderItem)}
              </div>
            )}

            {settingsItems.length > 0 && (
              <div className="mt-6 space-y-0.5">
                {settingsItems.map(renderItem)}
              </div>
            )}
          </nav>

          {/* User section — pinned to bottom */}
          {user && (
            <div className="mt-auto shrink-0 border-t border-border p-3">
              <UserMenu
                user={user}
                onSignOut={onSignOut}
                onProfile={() => { onProfile?.(); onOpenChange(false) }}
                onSettings={() => { onSettings?.(); onOpenChange(false) }}
                onBilling={() => { onBilling?.(); onOpenChange(false) }}
                extraItems={userMenuExtras}
                side="top"
              >
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">
                  <Avatar.Root className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted border border-border/30">
                    {user.avatarUrl && (
                      <Avatar.Image src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    )}
                    <Avatar.Fallback className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      {getInitials(user.fullName)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground rotate-180" />
                </button>
              </UserMenu>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
