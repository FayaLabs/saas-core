import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, AlertTriangle, X, User, Briefcase, FileText, CircleDot, Plus, MapPin } from 'lucide-react'
import {
  Modal, ModalContent, ModalTitle,
} from '../../../components/ui/modal'
import { DatePicker } from '../../../components/ui/date-picker'
import { TimePicker } from '../../../components/ui/time-picker'
import { SearchCombobox, type ComboboxOption } from './SearchCombobox'
import { useAgendaConfig, useAgendaProvider, useAgendaStore } from '../AgendaContext'
import { isStatusAvailable } from '../types'
import type { CreateBookingInput } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(amount: number, locale: string, code: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount)
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
    <div ref={ref} className="relative">
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted/30 transition-colors text-left w-full">
        {current && <>
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: current.color }} />
          <span>{current.label}</span>
        </>}
        <svg className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && dropRect && createPortal(
        <div style={{ position: 'fixed', left: dropRect.left, top: dropRect.bottom + 4, width: dropRect.width, zIndex: 200 }}
          className="rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {statuses.map((s) => {
            const available = !bookingDate || isStatusAvailable(s as any, bookingDate)
            return (
              <button key={s.value} type="button" disabled={!available}
                onClick={() => { if (available) { onChange(s.value); setOpen(false) } }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
                  !available ? 'opacity-30 cursor-not-allowed' : s.value === value ? 'bg-muted/30' : 'hover:bg-muted/50'
                }`}>
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
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
// Professional Select — custom dropdown with initials
// ---------------------------------------------------------------------------

function ProfessionalSelect({ value, onChange, professionals }: {
  value: string; onChange: (v: string) => void
  professionals: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = professionals.find((p) => p.id === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted/30 transition-colors text-left">
        {current ? (
          <>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
              {initials(current.name)}
            </span>
            <span>{current.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select professional...</span>
        )}
        <svg className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {professionals.map((p) => (
            <button key={p.id} type="button"
              onClick={() => { onChange(p.id); setOpen(false) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${p.id === value ? 'bg-muted/30' : ''}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                {initials(p.name)}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Location Select — custom dropdown with MapPin icon
// ---------------------------------------------------------------------------

function LocationSelect({ value, onChange, locations }: {
  value: string; onChange: (v: string) => void
  locations: Array<{ id: string; name: string }>
}) {
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
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted/30 transition-colors text-left">
        {current ? (
          <span>{current.name}</span>
        ) : (
          <span className="text-muted-foreground">Select location...</span>
        )}
        <svg className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
          {locations.map((l) => (
            <button key={l.id} type="button"
              onClick={() => { onChange(l.id); setOpen(false) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${l.id === value ? 'bg-muted/30' : ''}`}>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Appointment Modal — Google Calendar-inspired layout
// ---------------------------------------------------------------------------

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  bookingId?: string
  prefill?: Partial<CreateBookingInput>
  onClose: () => void
}

export function AppointmentModal({ open, mode, bookingId, prefill, onClose }: Props) {
  const config = useAgendaConfig()
  const provider = useAgendaProvider()
  const createBooking = useAgendaStore((s) => s.createBooking)
  const updateBooking = useAgendaStore((s) => s.updateBooking)
  const deleteBooking = useAgendaStore((s) => s.deleteBooking)
  const professionals = useAgendaStore((s) => s.professionals)
  const storeLocations = useAgendaStore((s) => s.locations)

  const [loading, setLoading] = useState(mode === 'edit')
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
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [quickCreate, setQuickCreate] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientOptions, setClientOptions] = useState<ComboboxOption[]>([])
  const [serviceOptions, setServiceOptions] = useState<ComboboxOption[]>([])
  const [showServiceSearch, setShowServiceSearch] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return
    // Reset to defaults/prefill on each open
    setClientId(prefill?.clientId ?? ''); setClientSearch('')
    setProfessionalId(prefill?.professionalId ?? ''); setLocationId(prefill?.locationId ?? ''); setServices([])
    setServiceSearch(''); setNotes(''); setStatus('scheduled')
    setConflict(false); setShowServiceSearch(false); setLoading(mode === 'edit')
    setQuickCreate(false); setNewClientName(''); setNewClientPhone(''); setNewClientEmail(''); setCreatingClient(false)
    // Auto-select professional if only one exists
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

  // Edit: load existing when modal opens
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && bookingId) {
      setLoading(true)
      provider.getBookingById(bookingId).then((b) => {
        if (!b) { setLoading(false); return }
        setClientId(b.clientId ?? ''); setClientSearch(b.clientName ?? '')
        setProfessionalId(b.professionalId ?? ''); setLocationId(b.locationId ?? '')
        setDate(b.startsAt.slice(0, 10))
        const d = new Date(b.startsAt)
        setStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
        setStatus(b.status); setNotes(b.notes ?? '')
        if (b.services) setServices(b.services.map((s) => ({
          serviceId: s.serviceId ?? '', name: s.name, durationMinutes: s.durationMinutes, price: s.price,
        })))
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [open, mode, bookingId])

  // Search effects
  useEffect(() => {
    if (!config.contactLookup || clientSearch.length < 1 || clientId) { setClientOptions([]); return }
    const t = setTimeout(async () => {
      try { setClientOptions(await config.contactLookup!.search(clientSearch)) } catch { setClientOptions([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [clientSearch, clientId])

  useEffect(() => {
    if (!config.serviceLookup || serviceSearch.length < 1) { setServiceOptions([]); return }
    const t = setTimeout(async () => {
      try { setServiceOptions(await config.serviceLookup!.search(serviceSearch)) } catch { setServiceOptions([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [serviceSearch])

  // Computed
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0)
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
    const t = setTimeout(() => {
      provider.checkConflict({
        assigneeId: professionalId, startsAt: `${date}T${startTime}:00`, endsAt: `${date}T${endTime}:00`, excludeBookingId: bookingId,
      }).then(setConflict).catch(() => setConflict(false))
    }, 300)
    return () => clearTimeout(t)
  }, [professionalId, date, startTime, endTime, bookingId])

  function selectClient(opt: ComboboxOption) { setClientId(opt.id); setClientSearch(opt.label); setClientOptions([]) }
  function addService(opt: ComboboxOption) {
    setServices((p) => [...p, { serviceId: opt.id, name: opt.label, durationMinutes: 60, price: opt.price ?? 0 }])
    setServiceSearch(''); setServiceOptions([]); setShowServiceSearch(false)
  }
  function removeService(idx: number) { setServices((p) => p.filter((_, i) => i !== idx)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !professionalId || services.length === 0 || conflict) return
    setSaving(true)
    try {
      const startsAt = new Date(`${date}T${startTime}:00`).toISOString()
      if (mode === 'create') {
        await createBooking({ clientId, professionalId, locationId: locationId || undefined, startsAt, notes: notes || undefined,
          services: services.map((s) => ({ serviceId: s.serviceId, name: s.name, durationMinutes: s.durationMinutes, price: s.price })) })
      } else if (bookingId) {
        await updateBooking(bookingId, { clientId, professionalId, locationId: locationId || undefined, startsAt, notes: notes || undefined, status: status as any })
      }
      onClose()
    } catch { /* toast */ }
    setSaving(false)
  }

  async function handleDelete() {
    if (!bookingId || !confirm('Delete this appointment?')) return
    await deleteBooking(bookingId); onClose()
  }

  const canSubmit = clientId && professionalId && services.length > 0 && !conflict && !saving

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent size="xl" noPadding>

        {/* ═══ TOP — title + date/time (sticky) ═══ */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <ModalTitle className="!text-xl mb-4">
            {mode === 'create' ? 'New Appointment' : 'Edit Appointment'}
          </ModalTitle>

          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker value={date} onChange={setDate} className="w-auto" />
            <TimePicker value={startTime} onChange={setStartTime}
              min={config.businessHours.startTime} max={config.businessHours.endTime}
              interval={config.slotDuration} className="w-[110px]" />
            <span className="text-sm text-muted-foreground">to</span>
            <TimePicker value={endTime} onChange={() => {}} readOnly className="w-[110px]" />
          </div>

          {conflict && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive mt-3">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Time conflict — this professional is already booked at this time.
            </div>
          )}
        </div>

        {/* ═══ BODY — scrollable details ═══ */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="border-t bg-muted/20 px-5 py-5 space-y-4 flex-1 overflow-y-auto">

            {/* Skeleton loading state for edit mode */}
            {loading && (
              <>
                {/* Client skeleton */}
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-2.5 rounded bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                    <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
                {/* Professional skeleton */}
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-2.5 rounded bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
                {/* Services skeleton */}
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-2.5 rounded bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
                    <div className="h-10 w-3/4 rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
                {/* Status skeleton */}
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-2.5 rounded bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                    <div className="h-9 w-40 rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
                {/* Notes skeleton */}
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-2.5 rounded bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-10 rounded bg-muted animate-pulse" />
                    <div className="h-20 w-full rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
              </>
            )}

            {/* Actual form fields — hidden while loading */}
            {!loading && <>

            {/* Client */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Client</label>
                {!quickCreate ? (
                  <SearchCombobox
                    value={clientSearch}
                    onChange={(v) => { setClientSearch(v); setClientId('') }}
                    onSelect={selectClient}
                    options={clientOptions}
                    placeholder="Search client..."
                    allowCreate
                    createLabel="New client"
                    onCreateNew={(name) => { setQuickCreate(true); setNewClientName(name); setNewClientPhone(''); setNewClientEmail('') }}
                  />
                ) : (
                  <div className="rounded-lg border bg-background p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Name" className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
                      <button type="button" onClick={() => setQuickCreate(false)}
                        className="p-1 text-muted-foreground hover:text-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="tel" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="Phone" className="rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="Email (optional)" className="rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                          toast.error('Failed to create client', { description: err?.message })
                        }
                        setCreatingClient(false)
                      }}
                      className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                      {creatingClient ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Professional — custom dropdown, auto-selected if only one */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Professional</label>
                <ProfessionalSelect value={professionalId} onChange={setProfessionalId} professionals={professionals} />
              </div>
            </div>

            {/* Location — only when locationSelection module is enabled */}
            {config.modules.locationSelection && (storeLocations.length > 0 || config.locations.length > 0) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Location</label>
                  <LocationSelect
                    value={locationId}
                    onChange={setLocationId}
                    locations={storeLocations.length > 0 ? storeLocations : config.locations}
                  />
                </div>
              </div>
            )}

            {/* Services */}
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Services</label>

                {services.length > 0 && (
                  <div className="space-y-1 mb-1.5">
                    {services.map((svc, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg bg-background border px-3 py-2 text-sm">
                        <span className="flex-1 truncate font-medium">{svc.name}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{svc.durationMinutes}min</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{fmtCurrency(svc.price, currency.locale, currency.code)}</span>
                        <button type="button" onClick={() => removeService(idx)} className="p-0.5 text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(services.length === 0 || showServiceSearch) ? (
                  <SearchCombobox
                    value={serviceSearch}
                    onChange={setServiceSearch}
                    onSelect={addService}
                    options={serviceOptions}
                    placeholder="Search service to add..."
                    autoFocus={showServiceSearch}
                    onBlurEmpty={() => services.length > 0 && setShowServiceSearch(false)}
                    renderRight={(opt) => opt.price != null ? (
                      <span className="text-muted-foreground text-xs">{fmtCurrency(opt.price, currency.locale, currency.code)}</span>
                    ) : null}
                  />
                ) : (
                  <button type="button" onClick={() => setShowServiceSearch(true)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-0.5">
                    <Plus className="h-3 w-3" /> Add service
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
                <CircleDot className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Status</label>
                  <StatusSelect value={status} onChange={setStatus} statuses={config.statuses} bookingDate={date} />
                </div>
            </div>

            {/* Notes */}
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add description..." rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            </>}
          </div>

          {/* ═══ FOOTER (sticky) ═══ */}
          <div className="px-5 py-3 border-t bg-card flex items-center justify-between shrink-0 sm:rounded-b-2xl">
            <div className="flex items-center gap-4">
              {mode === 'edit' && (
                <button type="button" onClick={handleDelete} className="text-xs text-destructive font-medium hover:underline">Delete</button>
              )}
              {/* Summary */}
              {services.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {totalDuration}min &middot; {fmtCurrency(totalPrice, currency.locale, currency.code)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" disabled={!canSubmit}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {saving ? 'Saving...' : mode === 'create' ? 'Save' : 'Update'}
              </button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
