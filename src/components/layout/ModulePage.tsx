import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ICON_MAP } from './Topbar'

interface ModuleNavItem {
  id: string
  label: string
  icon?: string
  active?: boolean
  onClick?: () => void
  children?: { id: string; label: string; onClick?: () => void }[]
}

interface ModulePageProps {
  title: string
  subtitle?: string
  nav: ModuleNavItem[]
  children: React.ReactNode
  className?: string
}

function NavItem({ item }: { item: ModuleNavItem }) {
  const [expanded, setExpanded] = React.useState(true)
  const Icon = item.icon ? (ICON_MAP[item.icon] ?? null) : null
  const hasChildren = item.children && item.children.length > 0

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren ? setExpanded(!expanded) : item.onClick?.()}
        className={cn(
          'flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-sm transition-colors',
          item.active
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        {hasChildren && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
        )}
      </button>
      {hasChildren && expanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
          {item.children!.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={child.onClick}
              className="flex items-center w-full rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ModulePage({ title, subtitle, nav, children, className }: ModulePageProps) {
  return (
    <div className={cn('flex gap-6 -mt-2', className)}>
      {/* Side navigation */}
      <div className="w-48 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 mb-2">{title}</p>
        <nav className="space-y-0.5">
          {nav.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

// Re-export for convenience
export type { ModuleNavItem }
