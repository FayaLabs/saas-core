import * as React from 'react'
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

interface BottomNavProps {
  navigation: NavigationItem[]
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

export function BottomNav({ navigation, activeRoute, onNavigate }: BottomNavProps) {
  const items = navigation.slice(0, 5)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background px-2 md:hidden">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon] ?? Home
        const isActive =
          activeRoute === item.route || activeRoute.startsWith(item.route + '/')

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.route)}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute -top-0.5 right-1/4 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
