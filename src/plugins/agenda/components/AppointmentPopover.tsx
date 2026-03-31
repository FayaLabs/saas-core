import React, { useState, useRef, useEffect } from 'react'
import { X, Pencil, Trash2, Clock, MapPin, User, FileText } from 'lucide-react'
import { PersonLink } from '../../../components/shared/PersonLink'
import { FloatingPanel, type FloatingPanelRef } from './FloatingPanel'
import { useAgendaConfig, useAgendaStore } from '../AgendaContext'
import { isStatusAvailable } from '../types'
import type { CalendarBooking } from '../types'

interface Props {
  booking: CalendarBooking
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (id: string) => void
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
function fmtCurrency(amount: number, locale: string, code: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount)
}

// Inline status select for the popover
function PopoverStatusSelect({ value, statuses, bookingStartsAt, onChange }: {
  value: string; statuses: Array<{ value: string; label: string; color: string; availableWhen?: string }>
  bookingStartsAt: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = statuses.find((s) => s.value === value)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:opacity-80"
        style={{ backgroundColor: (current?.color ?? '#6b7280') + '18', color: current?.color ?? '#6b7280' }}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: current?.color }} />
        {current?.label ?? value}
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 min-w-[140px]">
          {statuses.map((s) => {
            const available = isStatusAvailable(s as any, bookingStartsAt)
            return (
            <button key={s.value} type="button" disabled={!available}
              onClick={() => { if (available) { onChange(s.value); setOpen(false) } }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                !available ? 'opacity-30 cursor-not-allowed' : s.value === value ? 'bg-muted/30' : 'hover:bg-muted/50'
              }`}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
            </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AppointmentPopover({ booking, position, onClose, onEdit }: Props) {
  const config = useAgendaConfig()
  const deleteBooking = useAgendaStore((s) => s.deleteBooking)
  const updateStatus = useAgendaStore((s) => s.updateBookingStatus)
  const statusConfig = config.statuses.find((s) => s.value === booking.status)
  const color = statusConfig?.color ?? '#6b7280'
  const timeRange = `${fmtTime(booking.startsAt)}${booking.endsAt ? ' – ' + fmtTime(booking.endsAt) : ''}`

  async function handleDelete(panel: FloatingPanelRef) {
    if (!confirm('Delete this appointment?')) return
    await deleteBooking(booking.id)
    onClose()
  }

  return (
    <FloatingPanel position={position} width={320} height={340} onClose={onClose}>
      {(panel) => (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-end gap-0.5 px-3 pt-3 pb-1">
            <button onClick={() => panel.expandThen(() => onEdit(booking.id))}
              className="p-1.5 rounded-full hover:bg-muted transition-colors" title="Edit">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => handleDelete(panel)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors" title="Delete">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={panel.dismiss} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-3 w-3 rounded shrink-0" style={{ backgroundColor: color }} />
              <div className="min-w-0">
                <PersonLink personId={booking.clientId} name={booking.clientName ?? 'Unknown'} className="text-base" />
                <p className="text-sm text-muted-foreground mt-0.5">{fmtDate(booking.startsAt)} &middot; {timeRange}</p>
              </div>
            </div>

            {booking.services && booking.services.length > 0 && (
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-sm space-y-0.5">
                  {booking.services.map((svc) => (
                    <p key={svc.id}>{svc.name} <span className="text-muted-foreground">({svc.durationMinutes}min)</span></p>
                  ))}
                </div>
              </div>
            )}

            {booking.professionalName && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{booking.professionalName}</span>
              </div>
            )}

            {booking.locationName && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{booking.locationName}</span>
              </div>
            )}

            {booking.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}

            {booking.orderTotal != null && booking.orderTotal > 0 && (
              <div className="pt-2 border-t flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{fmtCurrency(booking.orderTotal, config.currency.locale, config.currency.code)}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <PopoverStatusSelect
                value={booking.status}
                statuses={config.statuses}
                bookingStartsAt={booking.startsAt}
                onChange={(v) => { updateStatus(booking.id, v); onClose() }}
              />
            </div>
          </div>
        </>
      )}
    </FloatingPanel>
  )
}
