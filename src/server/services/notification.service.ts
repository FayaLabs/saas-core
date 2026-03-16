import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Notification, NotificationType, NotificationChannel } from '../../types'

interface CreateNotificationInput {
  tenantId: string
  userId: string
  type: NotificationType
  title: string
  body: string
  channel?: NotificationChannel
  actionUrl?: string
  metadata?: Record<string, unknown>
}

function getServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export class NotificationService {
  static async getNotifications(
    tenantId: string,
    userId: string,
    limit = 50
  ): Promise<Notification[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Notification[]
  }

  static async createNotification(
    input: CreateNotificationInput
  ): Promise<Notification> {
    const supabase = getServiceClient()

    const record = {
      tenant_id: input.tenantId,
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      channel: input.channel ?? 'in_app',
      read: false,
      action_url: input.actionUrl ?? null,
      metadata: input.metadata ?? null,
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  }

  static async markRead(notificationId: string): Promise<void> {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
  }

  static async markAllRead(tenantId: string, userId: string): Promise<void> {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  }

  static async deleteOldNotifications(
    tenantId: string,
    olderThan: Date
  ): Promise<number> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('tenant_id', tenantId)
      .lt('created_at', olderThan.toISOString())
      .select('id')

    if (error) throw error
    return data?.length ?? 0
  }
}
