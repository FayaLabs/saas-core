import type { PluginScope, VerticalId } from '../../types/plugins'
import type { EntityLookup } from '../../types/entity-lookup'
import type { AgendaDataProvider } from './data/types'
import type { StatusConfig } from './types'

// ---------------------------------------------------------------------------
// Public options interface
// ---------------------------------------------------------------------------

export interface AgendaPluginLabels {
  pageTitle: string
  pageSubtitle: string
  calendar: string
  dayView: string
  weekView: string
  monthView: string
  listView: string
  workingHours: string
  confirmations: string
  newAppointment: string
  filters: string
}

export interface ConfirmationChannelOption {
  id: string
  label: string
  icon: string
}

export interface LocationOption {
  id: string
  name: string
  isHQ?: boolean
}

export interface AgendaPluginOptions {
  modules?: {
    workingHours?: boolean
    confirmations?: boolean
    conflictDetection?: boolean
    dragAndDrop?: boolean
  }
  labels?: Partial<AgendaPluginLabels>
  currency?: { code?: string; locale?: string; symbol?: string }

  /** Booking kind used in saas_core.bookings.kind (default: 'appointment') */
  bookingKind?: string

  /** Order kind for financial records (default: 'service_order') */
  orderKind?: string

  /** Schedule kind in saas_core.schedules.kind (default: 'working_hours') */
  scheduleKind?: string

  /** Booking status options */
  statuses?: StatusConfig[]

  /** Calendar visible time range (default: '08:00'-'20:00') */
  businessHours?: { startTime: string; endTime: string }

  /** Slot duration in minutes (default: 30) */
  slotDuration?: number

  /** Person kind for professionals (default: 'staff') */
  professionalKind?: string

  /** Person kind for clients (default: 'customer') */
  clientKind?: string

  /** Auto-create an order when creating a booking (default: true) */
  autoCreateOrder?: boolean

  /** Contact/client lookup */
  contactLookup?: EntityLookup

  /** Service lookup */
  serviceLookup?: EntityLookup

  /** Professional/staff lookup */
  professionalLookup?: EntityLookup

  /** Location lookup */
  locationLookup?: EntityLookup

  /** Business locations for unit filtering */
  locations?: LocationOption[]

  /** Confirmation channel options */
  confirmationChannels?: ConfirmationChannelOption[]

  /** Data provider — defaults to Supabase, falls back to mock */
  dataProvider?: AgendaDataProvider

  /** Default values for schedule block advanced settings */
  scheduleBlockDefaults?: {
    bufferMinutes?: number
    maxConcurrent?: number
    minAdvanceHours?: number
    maxAdvanceDays?: number
  }

  navPosition?: number
  navSection?: 'main' | 'secondary'
  scope?: PluginScope
  verticalId?: VerticalId
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LABELS: AgendaPluginLabels = {
  pageTitle: 'Agenda',
  pageSubtitle: 'Calendar and appointment management',
  calendar: 'Calendar',
  dayView: 'Day',
  weekView: 'Week',
  monthView: 'Month',
  listView: 'Agenda',
  workingHours: 'Working Hours',
  confirmations: 'Confirmations',
  newAppointment: 'New Appointment',
  filters: 'Filters',
}

const DEFAULT_CURRENCY = { code: 'BRL', locale: 'pt-BR', symbol: 'R$' }

const DEFAULT_STATUSES: StatusConfig[] = [
  { value: 'scheduled', label: 'Scheduled', color: '#6366f1' },
  { value: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b', availableWhen: 'today_only' },
  { value: 'completed', label: 'Completed', color: '#10b981', availableWhen: 'today_or_past' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'no_show', label: 'No Show', color: '#6b7280', availableWhen: 'today_or_past' },
]

// ---------------------------------------------------------------------------
// Resolved config — fully merged, no optionals
// ---------------------------------------------------------------------------

export interface AgendaModules {
  workingHours: boolean
  confirmations: boolean
  conflictDetection: boolean
  dragAndDrop: boolean
}

export interface AgendaCurrency {
  code: string
  locale: string
  symbol: string
}

export interface ResolvedAgendaConfig {
  modules: AgendaModules
  labels: AgendaPluginLabels
  currency: AgendaCurrency
  bookingKind: string
  orderKind: string
  scheduleKind: string
  statuses: StatusConfig[]
  businessHours: { startTime: string; endTime: string }
  slotDuration: number
  professionalKind: string
  clientKind: string
  autoCreateOrder: boolean
  locations: LocationOption[]
  confirmationChannels: ConfirmationChannelOption[]
  contactLookup?: EntityLookup
  serviceLookup?: EntityLookup
  professionalLookup?: EntityLookup
  locationLookup?: EntityLookup
  scheduleBlockDefaults: {
    bufferMinutes: number
    maxConcurrent: number
    minAdvanceHours: number
    maxAdvanceDays: number
  }
}

// ---------------------------------------------------------------------------
// Config resolver
// ---------------------------------------------------------------------------

export function resolveConfig(options?: AgendaPluginOptions): ResolvedAgendaConfig {
  return {
    modules: {
      workingHours: options?.modules?.workingHours !== false,
      confirmations: options?.modules?.confirmations !== false,
      conflictDetection: options?.modules?.conflictDetection !== false,
      dragAndDrop: options?.modules?.dragAndDrop !== false,
    },
    labels: { ...DEFAULT_LABELS, ...options?.labels },
    currency: { ...DEFAULT_CURRENCY, ...options?.currency },
    bookingKind: options?.bookingKind ?? 'appointment',
    orderKind: options?.orderKind ?? 'service_order',
    scheduleKind: options?.scheduleKind ?? 'working_hours',
    statuses: options?.statuses ?? DEFAULT_STATUSES,
    businessHours: options?.businessHours ?? { startTime: '08:00', endTime: '20:00' },
    slotDuration: options?.slotDuration ?? 30,
    professionalKind: options?.professionalKind ?? 'staff',
    clientKind: options?.clientKind ?? 'customer',
    autoCreateOrder: options?.autoCreateOrder !== false,
    locations: options?.locations ?? [],
    confirmationChannels: options?.confirmationChannels ?? [],
    contactLookup: options?.contactLookup,
    serviceLookup: options?.serviceLookup,
    professionalLookup: options?.professionalLookup,
    locationLookup: options?.locationLookup,
    scheduleBlockDefaults: {
      bufferMinutes: options?.scheduleBlockDefaults?.bufferMinutes ?? 0,
      maxConcurrent: options?.scheduleBlockDefaults?.maxConcurrent ?? 1,
      minAdvanceHours: options?.scheduleBlockDefaults?.minAdvanceHours ?? 0,
      maxAdvanceDays: options?.scheduleBlockDefaults?.maxAdvanceDays ?? 60,
    },
  }
}
