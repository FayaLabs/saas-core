import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, AlertTriangle, X, User, Briefcase, FileText, CircleDot, Plus, MapPin } from 'lucide-react'
import {
  Modal, ModalContent, ModalTitle,
} from '../../../components/ui/modal'
import { SearchCombobox, type ComboboxOption } from './SearchCombobox'
import { useAgendaConfig, useAgendaProvider, useAgendaStore } from '../AgendaContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { useLocaleStore } from '../../../stores/locale.store'
import { isStatusAvailable } from '../types'
import type { CreateBookingInput, BookingTypeId } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(amount: number, locale: string, code: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount)
}

function formatCompactDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

interface ServiceItem { serviceId: string; name: string; durationMinutes: number; price: number }

// ---------------------------------------------------------------------------
// Custom Status Select
// ---------------------------------------------------------------------------

function StatusSelect({ value, onChange, statuses, bookingDate }: {
  value: string; onChange: (v: string) => void
  statuses: Array<{ value: string; label: string; color: string; availableWhen?: string }>
  bookingDate?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = statuses.find((s) => s.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const btnRef = useRef<HTMLButtonElement>(null)
  const [dropRect, setDropRect] = useState<DOMRect | null>(null)

  function handleOpen() {
    if (btnRef.current) setDropRect(btnRef.current.getBoundingClientRect())
    setOpen((p) => !p)
  }

  return (
    <div ref={ref} className="relative flex-1">
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/30 transition-colors text-left w-full">
        {current && <>
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: current.color }} />
          <span>{current.label}</span>
        </>}
        <svg className="ml-auto h-3 w-3 text-muted-foreground shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && dropRect && createPortal(
        <div data-modal-passthrough style={{ position: 'fixed', left: dropRect.left, top: dropRect.bottom + 4, width: dropRect.width, zIndex: 9999, pointerEvents: 'auto' }}
          className="rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {statuses.map((s) => {
            const available = !bookingDate || isStatusAvailable(s as any, bookingDate)
            return (
              <button key={s.value} type="button" disabled={!available}
                onClick={() => { if (available) { onChange(s.value); setOpen(false) } }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
                  !available ? 'opacity-30 cursor-not-allowed' : s.value === value ? 'bg-muted/30' : 'hover:bg-muted/50'
                }`}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Professional Select — compact inline dropdown with initials
// ---------------------------------------------------------------------------

function ProfessionalSelect({ value, onChange, professionals }: {
  value: string; onChange: (v: string) => void
  professionals: Array<{ id: string; name: string }>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = professionals.find((p) => p.id === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-1">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/30 transition-colors text-left">
        {current ? (
          <span>{current.name}</span>
        ) : (
          <span className="text-muted-foreground">{t('agenda.appointment.selectProfessional')}</span>
        )}
        <svg className="ml-auto h-3 w-3 text-muted-foreground shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {professionals.map((p) => (
            <button key={p.id} type="button"
              onClick={() => { onChange(p.id); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors ${p.id === value ? 'bg-muted/30' : ''}`}>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Location Select — compact inline dropdown
// ---------------------------------------------------------------------------

function LocationSelect({ value, onChange, locations }: {
  value: string; onChange: (v: string) => void
  locations: Array<{ id: string; name: string }>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = locations.find((l) => l.id === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-1">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/30 transition-colors text-left">
        {current ? (
          <span>{current.name}</span>
        ) : (
          <span className="text-muted-foreground">{t('agenda.appointment.selectLocation')}</span>
        )}
        <svg className="ml-auto h-3 w-3 text-muted-foreground shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
          {locations.map((l) => (
            <button key={l.id} type="button"
              onClick={() => { onChange(l.id); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors ${l.id === value ? 'bg-muted/30' : ''}`}>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Appointment Modal — Google Calendar-inspired compact layout
// ---------------------------------------------------------------------------

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  bookingId?: string
  prefill?: Partial<CreateBookingInput> & { endsAt?: string }
  onClose: () => void
}

export function AppointmentModal({ open, mode, bookingId, prefill, onClose }: Props) {
  const { t } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)
  const config = useAgendaConfig()
  const provider = useAgendaProvider()
  const createBooking = useAgendaStore((s) => s.createBooking)
  const updateBooking = useAgendaStore((s) => s.updateBooking)
  const deleteBooking = useAgendaStore((s) => s.deleteBooking)
  const professionals = useAgendaStore((s) => s.professionals)
  const storeLocations = useAgendaStore((s) => s.locations)

  // --- State ---
  const [loading, setLoading] = useState(mode === 'edit')
  const [bookingType, setBookingType] = useState<BookingTypeId>(prefill?.kind ?? 'appointment')
  const [clientId, setClientId] = useState(prefill?.clientId ?? '')
  const [clientSearch, setClientSearch] = useState('')
  const [professionalId, setProfessionalId] = useState(prefill?.professionalId ?? '')
  const [locationId, setLocationId] = useState(prefill?.locationId ?? '')
  const [services, setServices] = useState<ServiceItem[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [date, setDate] = useState(() => {
    if (prefill?.startsAt) return prefill.startsAt.slice(0, 10)
    return new Date().toISOString().slice(0, 10)
  })
  const [startTime, setStartTime] = useState(() => {
    if (prefill?.startsAt) {
      const d = new Date(prefill.startsAt)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return '09:00'
  })
  const [status, setStatus] = useState('scheduled')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [quickCreate, setQuickCreate] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientOptions, setClientOptions] = useState<ComboboxOption[]>([])
  const [serviceOptions, setServiceOptions] = useState<ComboboxOption[]>([])
  const [editingDate, setEditingDate] = useState(false)
  const [editingTime, setEditingTime] = useState(false)

  // Active booking type config
  const activeType = config.bookingTypes.find((bt) => bt.id === bookingType) ?? config.bookingTypes[0]

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return
    setClientId(prefill?.clientId ?? ''); setClientSearch('')
    setProfessionalId(prefill?.professionalId ?? ''); setLocationId(prefill?.locationId ?? ''); setServices([])
    setServiceSearch(''); setNotes(''); setStatus('scheduled'); setShowNotes(false)
    setConflict(false); setLoading(mode === 'edit')
    setQuickCreate(false); setNewClientName(''); setNewClientPhone(''); setNewClientEmail(''); setCreatingClient(false)
    setBookingType(prefill?.kind ?? 'appointment')
    setEditingDate(false); setEditingTime(false)
    if (!prefill?.professionalId && professionals.length === 1) setProfessionalId(professionals[0].id)
    setDate(() => {
      if (prefill?.startsAt) return prefill.startsAt.slice(0, 10)
      return new Date().toISOString().slice(0, 10)
    })
    setStartTime(() => {
      if (prefill?.startsAt) {
        const d = new Date(prefill.startsAt)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      }
      return '09:00'
    })
  }, [open])

  // Edit: load existing
  useEffect(() => {
    if (!open || mode !== 'edit' || !bookingId) return
    setLoading(true)
    provider.getBookingById(bookingId).then((b) => {
      if (!b) { setLoading(false); return }
      setBookingType((b.kind as BookingTypeId) ?? 'appointment')
      setClientId(b.clientId ?? ''); setClientSearch(b.clientName ?? '')
      setProfessionalId(b.professionalId ?? ''); setLocationId(b.locationId ?? '')
      setDate(b.startsAt.slice(0, 10))
      const d = new Date(b.startsAt)
      setStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
      setStatus(b.status); setNotes(b.notes ?? '')
      if (b.notes) setShowNotes(true)
      if (b.services) setServices(b.services.map((s) => ({
        serviceId: s.serviceId ?? '', name: s.name, durationMinutes: s.durationMinutes, price: s.price,
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [open, mode, bookingId])

  // Search effects
  useEffect(() => {
    if (!config.contactLookup || clientSearch.length < 1 || clientId) { setClientOptions([]); return }
    const timer = setTimeout(async () => {
      try { setClientOptions(await config.contactLookup!.search(clientSearch)) } catch { setClientOptions([]) }
    }, 250)
    return () => clearTimeout(timer)
  }, [clientSearch, clientId])

  useEffect(() => {
    if (!config.serviceLookup || serviceSearch.length < 1) { setServiceOptions([]); return }
    const timer = setTimeout(async () => {
      try { setServiceOptions(await config.serviceLookup!.search(serviceSearch)) } catch { setServiceOptions([]) }
    }, 250)
    return () => clearTimeout(timer)
  }, [serviceSearch])

  // Computed
  const serviceDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0)
  const selectionDuration = useMemo(() => {
    if (!prefill?.startsAt || !prefill?.endsAt) return 0
    return Math.round((new Date(prefill.endsAt).getTime() - new Date(prefill.startsAt).getTime()) / 60000)
  }, [prefill?.startsAt, prefill?.endsAt])
  const totalDuration = serviceDuration > 0 ? serviceDuration : selectionDuration
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)
  const { currency } = config

  const endTime = useMemo(() => {
    const [h, m] = startTime.split(':').map(Number)
    const total = h * 60 + m + totalDuration
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }, [startTime, totalDuration])

  // Conflict check
  useEffect(() => {
    if (!professionalId || totalDuration === 0) { setConflict(false); return }
    const timer = setTimeout(() => {
      provider.checkConflict({
        assigneeId: professionalId, startsAt: `${date}T${startTime}:00`, endsAt: `${date}T${endTime}:00`, excludeBookingId: bookingId,
      }).then(setConflict).catch(() => setConflict(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [professionalId, date, startTime, endTime, bookingId])

  function selectClient(opt: ComboboxOption) { setClientId(opt.id); setClientSearch(opt.label); setClientOptions([]) }
  function addService(opt: ComboboxOption) {
    setServices((p) => [...p, { serviceId: opt.id, name: opt.label, durationMinutes: 60, price: opt.price ?? 0 }])
    setServiceSearch(''); setServiceOptions([])
  }
  function removeService(idx: number) { setServices((p) => p.filter((_, i) => i !== idx)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    try {
      const startsAt = new Date(`${date}T${startTime}:00`).toISOString()
      if (mode === 'create') {
        await createBooking({ kind: bookingType, clientId, professionalId, locationId: locationId || undefined, startsAt, notes: notes || undefined,
          services: services.map((s) => ({ serviceId: s.serviceId, name: s.name, durationMinutes: s.durationMinutes, price: s.price })) })
      } else if (bookingId) {
        await updateBooking(bookingId, { clientId, professionalId, locationId: locationId || undefined, startsAt, notes: notes || undefined, status: status as any })
      }
      onClose()
    } catch { /* toast */ }
    setSaving(false)
  }

  async function handleDelete() {
    if (!bookingId || !confirm(t('agenda.appointment.deleteConfirm'))) return
    await deleteBooking(bookingId); onClose()
  }

  const canSubmit = (
    (!activeType.requiresClient || clientId) &&
    (!activeType.fields.professional || professionalId) &&
    (!activeType.requiresServices || services.length > 0) &&
    !conflict && !saving
  )

  const showTabs = config.bookingTypes.length > 1

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent size="lg" noPadding>

        {/* ═══ TOP — type tabs + date/time ═══ */}
        <div className="px-5 pt-4 pb-3 shrink-0 space-y-3">
          <ModalTitle className="sr-only">
            {mode === 'create' ? t('agenda.appointment.new') : t('agenda.appointment.edit')}
          </ModalTitle>

          {/* Booking type — tabs in create mode, title in edit mode */}
          {showTabs && mode === 'create' ? (
            <div className="flex gap-4 border-b">
              {config.bookingTypes.map((bt) => {
                const label = t(`agenda.bookingType.${bt.id}`) || bt.label
                const isActive = bookingType === bt.id
                return (
                  <button key={bt.id} type="button" onClick={() => setBookingType(bt.id)}
                    className={`relative pb-2 text-xs font-medium transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-foreground" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : mode === 'edit' && (
            <h2 className="text-sm font-semibold">
              {t(`agenda.bookingType.${bookingType}`) || activeType.label}
            </h2>
          )}

          {/* Date/time + professional row */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
              {editingDate ? (
                <input type="date" value={date} autoFocus
                  onChange={(e) => { setDate(e.target.value); setEditingDate(false) }}
                  onBlur={() => setEditingDate(false)}
                  className="bg-transparent text-sm font-medium focus:outline-none border-b border-foreground w-auto shrink-0" />
              ) : (
                <button type="button" onClick={() => setEditingDate(true)}
                  className="px-0.5 py-0.5 font-medium border-b border-transparent hover:border-foreground transition-colors shrink-0">
                  {formatCompactDate(date, locale)}
                </button>
              )}
              {editingTime ? (
                <input type="time" value={startTime} autoFocus
                  onChange={(e) => { if (e.target.value) { setStartTime(e.target.value); setEditingTime(false) } }}
                  onBlur={() => setEditingTime(false)}
                  className="bg-transparent text-xs text-muted-foreground focus:outline-none border-b border-foreground w-auto shrink-0" />
              ) : (
                <button type="button" onClick={() => setEditingTime(true)}
                  className="px-0.5 py-0.5 text-xs text-muted-foreground border-b border-transparent hover:border-foreground transition-colors shrink-0">
                  {startTime}
                </button>
              )}
              <span className="text-[11px] text-muted-foreground/60">—</span>
              <span className="text-[11px] text-muted-foreground/60">{endTime}</span>

              {/* Professional — right-aligned on the same row */}
              {activeType.fields.professional && (
                <div className="ml-auto shrink-0">
                  <ProfessionalSelect value={professionalId} onChange={setProfessionalId} professionals={professionals} />
                </div>
              )}
            </div>
          </div>

          {conflict && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t('agenda.appointment.conflict')}
            </div>
          )}
        </div>

        {/* ═══ BODY — compact form rows ═══ */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="border-t px-5 py-3 space-y-1 flex-1 overflow-y-auto">

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-2 py-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className="h-4 w-4 rounded bg-muted animate-pulse shrink-0" />
                    <div className="h-8 flex-1 rounded-lg bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {!loading && <>

            {/* Client */}
            {activeType.fields.client && (
              <div className="flex items-center gap-3 py-1">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  {!quickCreate ? (
                    <SearchCombobox
                      value={clientSearch}
                      onChange={(v) => { setClientSearch(v); setClientId('') }}
                      onSelect={selectClient}
                      options={clientOptions}
                      placeholder={t('agenda.appointment.searchClient')}
                      allowCreate
                      createLabel={t('agenda.appointment.newClient')}
                      onCreateNew={(name) => { setQuickCreate(true); setNewClientName(name); setNewClientPhone(''); setNewClientEmail('') }}
                      minimal
                      inlineLabel={t('agenda.appointment.addClient')}
                    />
                  ) : (
                    <div className="rounded-lg border bg-background p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                          placeholder={t('agenda.appointment.name')} className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
                        <button type="button" onClick={() => setQuickCreate(false)}
                          className="p-1 text-muted-foreground hover:text-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="tel" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder={t('agenda.appointment.phone')} className="rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder={t('agenda.appointment.emailOptional')} className="rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <button type="button" disabled={creatingClient || !newClientName.trim()}
                        onClick={async () => {
                          setCreatingClient(true)
                          try {
                            const { getSupabaseClientOptional } = await import('../../../lib/supabase')
                            const { useOrganizationStore } = await import('../../../stores/organization.store')
                            const supabase = getSupabaseClientOptional()
                            const tenantId = useOrganizationStore.getState().currentOrg?.id
                            if (!supabase || !tenantId) throw new Error('Not initialized')
                            const { data, error } = await supabase.schema('saas_core').from('persons').insert({
                              tenant_id: tenantId, kind: config.clientKind, name: newClientName.trim(),
                              phone: newClientPhone.trim() || null, email: newClientEmail.trim() || null,
                            }).select('id, name').single()
                            if (error) throw error
                            setClientId(data.id); setClientSearch(data.name); setQuickCreate(false)
                          } catch (err: any) {
                            const { toast } = await import('sonner')
                            toast.error(t('agenda.appointment.createClientFailed'), { description: err?.message })
                          }
                          setCreatingClient(false)
                        }}
                        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                        {creatingClient ? t('agenda.appointment.creating') : t('agenda.appointment.create')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {activeType.fields.location && config.modules.locationSelection && (storeLocations.length > 0 || config.locations.length > 0) && (
              <div className="flex items-center gap-3 py-1">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <LocationSelect
                  value={locationId}
                  onChange={setLocationId}
                  locations={storeLocations.length > 0 ? storeLocations : config.locations}
                />
              </div>
            )}

            {/* Services */}
            {activeType.fields.services && (
              <div className="flex items-start gap-3 py-1">
                <Briefcase className="h-4 w-4 mt-1.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  {services.length > 0 && (
                    <div className="space-y-0.5 mb-1">
                      {services.map((svc, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-sm">
                          <span className="flex-1 truncate">{svc.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{svc.durationMinutes}min</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{fmtCurrency(svc.price, currency.locale, currency.code)}</span>
                          <button type="button" onClick={() => removeService(idx)} className="p-0.5 text-muted-foreground hover:text-destructive shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <SearchCombobox
                    value={serviceSearch}
                    onChange={setServiceSearch}
                    onSelect={addService}
                    options={serviceOptions}
                    placeholder={t('agenda.appointment.searchService')}
                    onBlurEmpty={() => {}}
                    renderRight={(opt) => opt.price != null ? (
                      <span className="text-muted-foreground text-xs">{fmtCurrency(opt.price, currency.locale, currency.code)}</span>
                    ) : null}
                    minimal
                    inlineLabel={services.length > 0 ? t('agenda.appointment.addService') : t('agenda.appointment.addServiceFirst')}
                    inlineIcon={services.length > 0 ? 'plus' : 'search'}
                  />
                </div>
              </div>
            )}

            {/* Status */}
            {activeType.fields.status && (
              <div className="flex items-center gap-3 py-1">
                <CircleDot className="h-4 w-4 text-muted-foreground shrink-0" />
                <StatusSelect value={status} onChange={setStatus} statuses={config.statuses} bookingDate={date} />
              </div>
            )}

            {/* Notes — progressive disclosure */}
            {!showNotes ? (
              <div className="flex items-center gap-3 py-1">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <button type="button" onClick={() => setShowNotes(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left py-1.5 pl-2">
                  {t('agenda.appointment.addNotes')}
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 py-1">
                <FileText className="h-4 w-4 mt-2 text-muted-foreground shrink-0" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('agenda.appointment.addDescription')} rows={2} autoFocus
                  className="w-full flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}

            </>}
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="px-5 py-2.5 border-t bg-card flex items-center justify-between shrink-0 sm:rounded-b-2xl">
            <div className="flex items-center gap-3">
              {mode === 'edit' && (
                <button type="button" onClick={handleDelete} className="text-xs text-destructive font-medium hover:underline">{t('agenda.appointment.delete')}</button>
              )}
              {services.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {totalDuration}min &middot; {fmtCurrency(totalPrice, currency.locale, currency.code)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors">{t('agenda.appointment.cancel')}</button>
              <button type="submit" disabled={!canSubmit}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {saving ? t('agenda.appointment.saving') : mode === 'create' ? t('agenda.appointment.save') : t('agenda.appointment.update')}
              </button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
