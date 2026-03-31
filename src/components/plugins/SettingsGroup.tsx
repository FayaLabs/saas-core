import React from 'react'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------------------
// ToggleRow — a single setting with label, description, and checkbox
// ---------------------------------------------------------------------------

export function ToggleRow({ label, description, checked, onChange, disabled }: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={cn(
      'flex items-center justify-between gap-4 py-3 cursor-pointer',
      disabled && 'opacity-50 cursor-not-allowed',
    )}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-muted',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5',
          checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5',
        )} />
      </button>
    </label>
  )
}

// ---------------------------------------------------------------------------
// SettingsGroup — a bordered section with title and children
// ---------------------------------------------------------------------------

export function SettingsGroup({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="px-1 pb-1 pt-4 first:pt-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="rounded-lg border bg-card px-5 divide-y">
        {children}
      </div>
    </div>
  )
}
