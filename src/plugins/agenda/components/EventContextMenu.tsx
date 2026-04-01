import React, { useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2, Check } from 'lucide-react'
import { FloatingPanel } from './FloatingPanel'
import { useAgendaConfig, useAgendaStore } from '../AgendaContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { isStatusAvailable } from '../types'
import type { CalendarBooking } from '../types'

// ---------------------------------------------------------------------------
// Tooltip — portaled to body
// ---------------------------------------------------------------------------

function Tooltip({ anchor, label }: { anchor: DOMRect; label: string }) {
  return createPortal(
    <div style={{ position: 'fixed', left: anchor.left + anchor.width / 2, top: anchor.bottom + 6, transform: 'translateX(-50%)', zIndex: 120 }}
      className="pointer-events-none">
      <div className="rounded-md bg-foreground text-background px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shadow-lg">
        {label}
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Status dot with portaled tooltip
// ---------------------------------------------------------------------------

function StatusDot({ color, label, isActive, disabled, onClick }: {
  color: string; label: string; isActive: boolean; disabled?: boolean; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  return (
    <>
      <button ref={btnRef} type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
        onMouseEnter={() => { setHover(true); if (btnRef.current) setRect(btnRef.current.getBoundingClientRect()) }}
        onMouseLeave={() => setHover(false)}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          disabled ? 'opacity-25 cursor-not-allowed' : isActive ? 'ring-2 ring-offset-2 ring-offset-popover' : 'hover:scale-110'
        }`}
        style={{ backgroundColor: color, ['--tw-ring-color' as any]: isActive ? color : undefined }}>
        {isActive && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
      </button>
      {hover && rect && <Tooltip anchor={rect} label={label} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Context Menu
// ---------------------------------------------------------------------------

interface Props {
  booking: CalendarBooking
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (id: string) => void
}

export function EventContextMenu({ booking, position, onClose, onEdit }: Props) {
  const { t } = useTranslation()
  const config = useAgendaConfig()
  const updateStatus = useAgendaStore((s) => s.updateBookingStatus)
  const deleteBooking = useAgendaStore((s) => s.deleteBooking)

  async function handleDelete() {
    if (!confirm(t('agenda.appointment.deleteConfirm'))) return
    await deleteBooking(booking.id)
    onClose()
  }

  return (
    <FloatingPanel position={position} width={230} height={180} offset={{ x: 4, y: 4 }} onClose={onClose} zIndex={110}>
      {(panel) => (
        <>
          <div className="py-1">
            <button onClick={() => panel.expandThen(() => onEdit(booking.id))}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
              <Pencil className="h-4 w-4 text-muted-foreground" /> {t('agenda.contextMenu.edit')}
            </button>
            <button onClick={handleDelete}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors text-destructive">
              <Trash2 className="h-4 w-4" /> {t('agenda.contextMenu.delete')}
            </button>
          </div>

          <div className="border-t px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">{t('agenda.contextMenu.changeStatus')}</p>
            <div className="flex items-center gap-1.5">
              {config.statuses.map((s) => {
                const available = isStatusAvailable(s, booking.startsAt)
                return (
                  <StatusDot key={s.value} color={s.color} label={available ? s.label : `${s.label} ${t('agenda.contextMenu.notAvailable')}`}
                    isActive={booking.status === s.value}
                    disabled={!available}
                    onClick={() => { if (available) { updateStatus(booking.id, s.value); panel.dismiss() } }} />
                )
              })}
            </div>
          </div>
        </>
      )}
    </FloatingPanel>
  )
}
