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
              ? 'border-primary font-semibold text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
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
  const mainNav = navigation.filter((item) => item.section === 'main')
  const secondaryNav = navigation.filter((item) => item.section === 'secondary')
  const allNav = [...mainNav, ...secondaryNav]

  return (
    <header className="sticky top-0 z-50 w-full shrink-0">
      {/* Row 1: Logo + Search + Actions */}
      <div className="border-b border-border/40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 w-full items-center justify-between px-4 md:px-6">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex shrink-0 items-center">
              {logo ?? <span className="text-lg font-bold">App</span>}
            </div>
          </div>

          {/* Center: Search (desktop only) */}
          <div className="mx-8 hidden max-w-xl flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <div className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 pl-9 text-sm text-muted-foreground">
                <span>Search...</span>
                <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {leftContent}
            {rightContent}
          </div>
        </div>
      </div>

      {/* Row 2: Navigation (desktop only) */}
      <div className="hidden border-b border-border/40 bg-muted/50 md:block">
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
                      ? 'border-primary font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
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
