import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown } from 'lucide-react'
import type { BlockSettings } from '../../../lib/schedule-service'
import type { ScheduleBlockConfig } from '../../../lib/schedule-config'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BlockSettingsPopoverProps {
  settings: BlockSettings
  onChange: (settings: BlockSettings) => void
  config: ScheduleBlockConfig
  /** Ref to the trigger element for positioning */
  triggerRef: React.RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlockSettingsPopover({
  settings,
  onChange,
  config,
  triggerRef,
  open,
  onClose,
}: BlockSettingsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popW = 280
    let left = rect.left + rect.width / 2 - popW / 2
    if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12
    if (left < 8) left = 8
    setPos({ top: rect.bottom + 6, left })
  }, [open, triggerRef])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return
      if (triggerRef.current?.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, triggerRef])

  if (!open) return null

  const showServices = config.showServices !== false && config.services && config.services.length > 0
  const showConcurrent = config.showConcurrent !== false
  const showBookingWindow = config.showBookingWindow !== false

  function update(patch: Partial<BlockSettings>) {
    onChange({ ...settings, ...patch })
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-[280px] rounded-xl border bg-popover shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="text-xs font-semibold">Block Settings</span>
        <button type="button" onClick={onClose} className="p-0.5 rounded text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Services multi-select */}
        {showServices && (
          <ServiceSelect
            services={config.services!}
            selected={settings.allowedServiceIds ?? []}
            onChange={(ids) => update({ allowedServiceIds: ids.length > 0 ? ids : undefined })}
          />
        )}

        {/* Max concurrent */}
        {showConcurrent && (
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Max concurrent</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => update({ maxConcurrent: Math.max(1, (settings.maxConcurrent ?? config.defaults.maxConcurrent) - 1) })}
                className="flex h-7 w-7 items-center justify-center rounded-md border text-sm hover:bg-muted transition-colors"
              >
                -
              </button>
              <span className="text-sm font-medium w-6 text-center">
                {settings.maxConcurrent ?? config.defaults.maxConcurrent}
              </span>
              <button
                type="button"
                onClick={() => update({ maxConcurrent: (settings.maxConcurrent ?? config.defaults.maxConcurrent) + 1 })}
                className="flex h-7 w-7 items-center justify-center rounded-md border text-sm hover:bg-muted transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Booking window */}
        {showBookingWindow && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Min advance</label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  min={0}
                  value={settings.minAdvanceHours ?? config.defaults.minAdvanceHours}
                  onChange={(e) => update({ minAdvanceHours: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs tabular-nums"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">hrs</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Max advance</label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  min={1}
                  value={settings.maxAdvanceDays ?? config.defaults.maxAdvanceDays}
                  onChange={(e) => update({ maxAdvanceDays: Number(e.target.value) || 30 })}
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs tabular-nums"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">days</span>
              </div>
            </div>
          </div>
        )}

        {/* Label */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">Label</label>
          <input
            type="text"
            value={settings.label ?? ''}
            onChange={(e) => update({ label: e.target.value || undefined })}
            placeholder="e.g. Morning - Cuts only"
            className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground/40"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Service multi-select (simple dropdown with checkboxes)
// ---------------------------------------------------------------------------

function ServiceSelect({
  services,
  selected,
  onChange,
}: {
  services: { id: string; name: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const allSelected = selected.length === 0
  const label = allSelected
    ? 'All services'
    : selected.length === 1
      ? services.find((s) => s.id === selected[0])?.name ?? '1 service'
      : `${selected.length} services`

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] font-medium text-muted-foreground">Allowed services</label>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="mt-1 flex items-center justify-between w-full rounded-md border bg-background px-2 py-1.5 text-xs hover:bg-muted/30 transition-colors"
      >
        <span className={allSelected ? 'text-muted-foreground' : ''}>{label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-lg border bg-popover shadow-lg py-1">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`block w-full px-2.5 py-1.5 text-xs text-left transition-colors ${allSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}`}
          >
            All services
          </button>
          {services.map((s) => {
            const checked = selected.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-left transition-colors ${checked ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                }`}>
                  {checked && <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span className="truncate">{s.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
