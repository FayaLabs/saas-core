import * as React from 'react'
import {
  Menu,
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
import { useRouter } from '../../lib/router'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
}

interface TopbarProps {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  user?: { fullName: string; avatarUrl?: string; email: string }
  onMenuClick?: () => void
  rightContent?: React.ReactNode
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

export function Topbar({ navigation, logo, onMenuClick, rightContent }: TopbarProps) {
  const router = useRouter()
  const currentPath = router.usePathname()
  const mainNav = navigation.filter((item) => item.section === 'main')

  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="mr-3 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo */}
      <div className="mr-6 flex shrink-0 items-center">
        {logo ?? <span className="text-lg font-bold">App</span>}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden flex-1 items-center gap-1 md:flex">
        {mainNav.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Home
          const isActive =
            currentPath === item.route || currentPath.startsWith(item.route + '/')

          return (
            <button
              key={item.id}
              onClick={() => router.navigate(item.route)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden" />

      {/* Right content (user menu, notifications, etc.) */}
      {rightContent}
    </header>
  )
}
