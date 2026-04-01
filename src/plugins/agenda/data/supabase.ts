import type { AgendaDataProvider } from './types'
import type {
  CalendarBooking, Professional, Schedule, TimeSlot,
  CreateBookingInput, UpdateBookingInput, SaveScheduleInput,
  BookingQuery, ConflictCheckParams, AvailableSlotsParams, BookingStatus,
} from '../types'
import { getSupabaseClientOptional } from '../../../lib/supabase'
import { useOrganizationStore } from '../../../stores/organization.store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTenantId(): string | undefined {
  return useOrganizationStore.getState().currentOrg?.id
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value
  }
  return result
}

function getClients() {
  const supabase = getSupabaseClientOptional()
  if (!supabase) throw new Error('Supabase not initialized')
  return { core: supabase.schema('saas_core'), pub: supabase }
}

function mapBooking(row: Record<string, unknown>): CalendarBooking {
  return snakeToCamel(row) as unknown as CalendarBooking
}

function mapSchedule(row: Record<string, unknown>): Schedule {
  return snakeToCamel(row) as unknown as Schedule
}

function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Supabase Agenda Provider
// ---------------------------------------------------------------------------

export function createSupabaseAgendaProvider(): AgendaDataProvider {
  return {
    // v_bookings is in public schema (PostgREST default)
    async getBookings(query: BookingQuery): Promise<CalendarBooking[]> {
      const { pub } = getClients()
      let q = pub.from('v_bookings').select('*')
        .gte('starts_at', query.dateRange.start)
        .lte('starts_at', query.dateRange.end)

      if (query.kind) q = q.eq('kind', query.kind)
      if (query.statuses?.length) q = q.in('status', query.statuses)
      if (query.professionalIds?.length) q = q.in('professional_id', query.professionalIds)
      if (query.locationId) q = q.eq('location_id', query.locationId)

      q = q.order('starts_at', { ascending: true })

      const { data, error } = await q
      if (error) throw error
      return (data ?? []).map(mapBooking)
    },

    async getBookingById(id: string): Promise<CalendarBooking | null> {
      const { pub } = getClients()
      const { data, error } = await pub.from('v_bookings').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data ? mapBooking(data as Record<string, unknown>) : null
    },

    async createBooking(input: CreateBookingInput): Promise<CalendarBooking> {
      const { core } = getClients()
      const tenantId = getTenantId()
      if (!tenantId) throw new Error('No active tenant')

      const hasServices = input.services.length > 0
      const totalDuration = input.services.reduce((sum, s) => sum + s.durationMinutes, 0)
      const totalPrice = input.services.reduce((sum, s) => sum + s.price, 0)
      const endsAt = addMinutes(input.startsAt, totalDuration || 30)

      let orderId: string | null = null

      // Create order only when services exist (appointments with services)
      if (hasServices) {
        const { data: order, error: orderErr } = await core.from('orders').insert({
          tenant_id: tenantId,
          kind: 'service_order',
          party_id: input.clientId,
          assignee_id: input.professionalId,
          location_id: input.locationId ?? null,
          status: 'draft',
          subtotal: totalPrice,
          total: totalPrice,
          notes: 'Appointment',
          metadata: { source: 'agenda' },
        }).select('id').single()
        if (orderErr) throw orderErr
        orderId = order.id

        const orderItems = input.services.map((s, i) => ({
          order_id: order.id,
          service_id: s.serviceId,
          name: s.name,
          quantity: 1,
          unit_price: s.price,
          total: s.price,
          sort_order: i,
          metadata: { duration_minutes: s.durationMinutes },
        }))
        const { error: oiErr } = await core.from('order_items').insert(orderItems)
        if (oiErr) throw oiErr
      }

      // Create booking (time reservation)
      const { data: booking, error: bkErr } = await core.from('bookings').insert({
        tenant_id: tenantId,
        kind: input.kind ?? 'appointment',
        party_id: input.clientId || null,
        assignee_id: input.professionalId,
        location_id: input.locationId ?? null,
        order_id: orderId,
        starts_at: input.startsAt,
        ends_at: endsAt,
        status: 'scheduled',
        notes: input.notes ?? null,
        metadata: {},
      }).select('id').single()
      if (bkErr) throw bkErr

      // Create booking items (only when services exist)
      if (hasServices) {
        const bookingItems = input.services.map((s, i) => ({
          booking_id: booking.id,
          service_id: s.serviceId,
          assignee_id: s.assigneeId ?? input.professionalId,
          name: s.name,
          duration_minutes: s.durationMinutes,
          price: s.price,
          sort_order: i,
        }))
        const { error: biErr } = await core.from('booking_items').insert(bookingItems)
        if (biErr) throw biErr
      }

      // Return the full booking from the view
      return (await this.getBookingById(booking.id))!
    },

    async updateBooking(id: string, data: UpdateBookingInput): Promise<CalendarBooking> {
      const { core } = getClients()
      const updates: Record<string, unknown> = {}
      if (data.startsAt) updates.starts_at = data.startsAt
      if (data.endsAt) updates.ends_at = data.endsAt
      if (data.status) updates.status = data.status
      if (data.notes !== undefined) updates.notes = data.notes
      if (data.professionalId) updates.assignee_id = data.professionalId
      if (data.clientId) updates.party_id = data.clientId
      if (data.locationId) updates.location_id = data.locationId

      const { error } = await core.from('bookings').update(updates).eq('id', id)
      if (error) throw error
      return (await this.getBookingById(id))!
    },

    async deleteBooking(id: string): Promise<void> {
      const { core } = getClients()
      const { data: booking } = await core.from('bookings').select('order_id').eq('id', id).single()
      const { error } = await core.from('bookings').delete().eq('id', id)
      if (error) throw error
      if (booking?.order_id) {
        await core.from('orders').delete().eq('id', booking.order_id)
      }
    },

    async updateBookingStatus(id: string, status: string): Promise<CalendarBooking> {
      return this.updateBooking(id, { status: status as BookingStatus })
    },

    async checkConflict(params: ConflictCheckParams): Promise<boolean> {
      const { core } = getClients()
      let q = core.from('bookings').select('id', { count: 'exact', head: true })
        .eq('assignee_id', params.assigneeId)
        .not('status', 'in', '("cancelled","no_show")')
        .lt('starts_at', params.endsAt)
        .gt('ends_at', params.startsAt)

      if (params.excludeBookingId) {
        q = q.neq('id', params.excludeBookingId)
      }

      const { count, error } = await q
      if (error) throw error
      return (count ?? 0) > 0
    },

    async getAvailableSlots(params: AvailableSlotsParams): Promise<TimeSlot[]> {
      const { pub } = getClients()
      const { data, error } = await pub.rpc('get_available_slots', {
        p_tenant_id: getTenantId(),
        p_assignee_id: params.assigneeId,
        p_date: params.date,
        p_duration_minutes: params.durationMinutes,
        p_slot_interval: params.slotInterval ?? 30,
      })
      if (error) throw error
      return (data ?? []).map((row: any) => ({ start: row.slot_start, end: row.slot_end }))
    },

    async getSchedules(professionalId?: string): Promise<Schedule[]> {
      const { core } = getClients()
      let q = core.from('schedules').select('*').eq('kind', 'working_hours')
      if (professionalId) q = q.eq('assignee_id', professionalId)
      q = q.order('day_of_week').order('starts_at')

      const { data, error } = await q
      if (error) throw error
      return (data ?? []).map(mapSchedule)
    },

    async saveSchedule(input: SaveScheduleInput): Promise<Schedule> {
      const { core } = getClients()
      const tenantId = getTenantId()
      if (!tenantId) throw new Error('No active tenant')

      const { data, error } = await core.from('schedules').insert({
        tenant_id: tenantId,
        kind: 'working_hours',
        assignee_id: input.assigneeId,
        location_id: input.locationId ?? null,
        day_of_week: input.dayOfWeek ?? null,
        specific_date: input.specificDate ?? null,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        is_active: input.isActive !== false,
      }).select('*').single()
      if (error) throw error
      return mapSchedule(data as Record<string, unknown>)
    },

    async deleteSchedule(id: string): Promise<void> {
      const { core } = getClients()
      const { error } = await core.from('schedules').delete().eq('id', id)
      if (error) throw error
    },

    async getProfessionals(): Promise<Professional[]> {
      const { core } = getClients()
      const { data, error } = await core.from('persons')
        .select('id, name, avatar_url, is_active')
        .eq('kind', 'staff')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data ?? []).map((p: any) => ({
        id: p.id, name: p.name, avatarUrl: p.avatar_url,
        locationId: null, locationName: null, isActive: p.is_active,
      }))
    },

    async getLocations(): Promise<Array<{ id: string; name: string }>> {
      const { core } = getClients()
      const { data, error } = await core.from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data ?? []).map((l: any) => ({ id: l.id, name: l.name }))
    },

    async getConfirmationsPending(daysAhead = 2): Promise<CalendarBooking[]> {
      const { pub } = getClients()
      const now = new Date().toISOString()
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() + daysAhead)

      const { data, error } = await pub.from('v_bookings').select('*')
        .eq('status', 'scheduled')
        .gte('starts_at', now)
        .lte('starts_at', cutoff.toISOString())
        .order('starts_at')
      if (error) throw error
      return (data ?? []).map(mapBooking)
    },

    async sendConfirmation(bookingId: string, channel: string): Promise<void> {
      const { core } = getClients()
      const { data: booking } = await core.from('bookings').select('metadata').eq('id', bookingId).single()
      const metadata = (booking?.metadata ?? {}) as Record<string, unknown>
      const confirmations = (metadata.confirmations as any[] ?? [])
      confirmations.push({ channel, sentAt: new Date().toISOString(), status: 'sent' })
      await core.from('bookings').update({ metadata: { ...metadata, confirmations } }).eq('id', bookingId)
    },

    async completeBooking(bookingId: string): Promise<{ booking: CalendarBooking; orderId: string }> {
      const { core } = getClients()
      const { error: bkErr } = await core.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
      if (bkErr) throw bkErr
      const booking = await this.getBookingById(bookingId)
      if (!booking) throw new Error('Booking not found')
      if (booking.orderId) {
        await core.from('orders').update({ status: 'completed' }).eq('id', booking.orderId)
      }
      return { booking, orderId: booking.orderId ?? '' }
    },
  }
}
