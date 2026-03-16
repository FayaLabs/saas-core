import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
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
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
}

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: NavigationItem[]
  logo?: React.ReactNode
  activeRoute: string
  onNavigate: (route: string) => void
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

export function MobileDrawer({
  open,
  onOpenChange,
  navigation,
  logo,
  activeRoute,
  onNavigate,
}: MobileDrawerProps) {
  const mainItems = navigation.filter((item) => item.section === 'main')
  const secondaryItems = navigation.filter((item) => item.section === 'secondary')
  const settingsItems = navigation.filter((item) => item.section === 'settings')

  const handleNavigate = (route: string) => {
    onNavigate(route)
    onOpenChange(false)
  }

  const renderItem = (item: NavigationItem) => {
    const Icon = ICON_MAP[item.icon] ?? Home
    const isActive =
      activeRoute === item.route || activeRoute.startsWith(item.route + '/')

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.route)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge !== undefined && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            'duration-200'
          )}
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            {logo ?? <span className="text-lg font-bold">App</span>}
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            {mainItems.length > 0 && (
              <div className="space-y-1">{mainItems.map(renderItem)}</div>
            )}

            {secondaryItems.length > 0 && (
              <div className="mt-6 space-y-1">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Secondary
                </p>
                {secondaryItems.map(renderItem)}
              </div>
            )}

            {settingsItems.length > 0 && (
              <div className="mt-6 space-y-1">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Settings
                </p>
                {settingsItems.map(renderItem)}
              </div>
            )}
          </nav>

          <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Application navigation links
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
