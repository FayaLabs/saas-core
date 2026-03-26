import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import {
  Menu,
  Search,
  ChevronDown,
  Filter,
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
  DollarSign,
  Megaphone,
  ShoppingCart,
  Target,
  Wrench,
  ClipboardList,
  Briefcase,
  UserCog,
  BookOpen,
  MessageCircle,
  Globe,
  Percent,
  Tag,
  Camera,
  UtensilsCrossed,
  MapPin,
  Handshake,
  Contact,
  Building2,
  Plus,
  List,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useRouter } from '../../lib/router'
import { useLayoutStore } from '../../stores/layout.store'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
  children?: NavigationItem[]
}

interface TopbarProps {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  user?: { fullName: string; avatarUrl?: string; email: string }
  onMenuClick?: () => void
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Users, Settings, CreditCard, Bell, Calendar, Package, BarChart3,
  FileText, Mail, DollarSign, Megaphone, ShoppingCart, Target, Wrench,
  ClipboardList, Briefcase, UserCog, BookOpen, MessageCircle, Globe,
  Percent, Tag, Camera, UtensilsCrossed, Search, MapPin, Handshake,
  Contact, Building2, ChevronDown, Filter, Plus, List,
}

// Also add to BottomNav
export { ICON_MAP }

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Home
}

function NavDropdown({ item, currentPath, onNavigate }: {
  item: NavigationItem
  currentPath: string
  onNavigate: (route: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const Icon = getIcon(item.icon)
  const isChildActive = item.children?.some(
    (child) => currentPath === child.route || currentPath.startsWith(child.route + '/')
  )

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
            isChildActive
              ? 'border-sidebar-accent-foreground font-semibold text-sidebar-foreground'
              : 'border-transparent text-sidebar-muted hover:text-sidebar-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[200px] rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {item.children?.map((child) => {
            const ChildIcon = getIcon(child.icon)
            const isActive = currentPath === child.route || currentPath.startsWith(child.route + '/')
            return (
              <button
                key={child.id}
                onClick={() => {
                  onNavigate(child.route)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-popover-foreground hover:bg-muted/70'
                )}
              >
                <ChildIcon className="h-4 w-4 text-muted-foreground" />
                <span>{child.label}</span>
              </button>
            )
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function Topbar({ navigation, logo, onMenuClick, leftContent, rightContent }: TopbarProps) {
  const router = useRouter()
  const currentPath = router.usePathname()
  const setCommandPaletteOpen = useLayoutStore((s) => s.setCommandPaletteOpen)
  const mainNav = navigation.filter((item) => item.section === 'main')
  const secondaryNav = navigation.filter((item) => item.section === 'secondary')
  const allNav = [...mainNav, ...secondaryNav]

  return (
    <header className="sticky top-0 z-50 w-full shrink-0">
      {/* Row 1: Logo + Search + Actions — lighter brand */}
      <div className="bg-sidebar-accent text-sidebar-foreground backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between px-4 md:px-6">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar/30 hover:text-sidebar-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden shrink-0 items-center md:flex">
              {logo ?? <span className="text-lg font-bold">App</span>}
            </div>
          </div>

          {/* Center: Search (desktop only) — opens command palette */}
          <div className="mx-8 hidden max-w-sm flex-1 md:flex">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="relative flex h-8 w-full items-center rounded-md bg-sidebar/60 px-3 pl-8 text-sm text-sidebar-muted transition-colors hover:bg-sidebar/80"
            >
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-muted" />
              <span className="text-xs">Search...</span>
              <kbd className="ml-auto hidden rounded bg-sidebar/60 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-muted sm:inline-block">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {leftContent}
            {rightContent}
          </div>
        </div>
      </div>

      {/* Row 2: Navigation (desktop only) — darker */}
      <div className="hidden bg-sidebar md:block">
        <div className="flex h-11 w-full items-center px-4 md:px-6">
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {allNav.map((item) => {
              // Dropdown for items with children
              if (item.children && item.children.length > 0) {
                return (
                  <NavDropdown
                    key={item.id}
                    item={item}
                    currentPath={currentPath}
                    onNavigate={(route) => router.navigate(route)}
                  />
                )
              }

              // Regular nav item
              const Icon = getIcon(item.icon)
              const isActive =
                item.route === '/'
                  ? currentPath === '/'
                  : currentPath === item.route || currentPath.startsWith(item.route + '/')

              return (
                <button
                  key={item.id}
                  onClick={() => router.navigate(item.route)}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'border-primary font-semibold text-sidebar-foreground'
                      : 'border-transparent text-sidebar-muted hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
