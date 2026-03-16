import { createClient } from '@supabase/supabase-js'
import type { Tenant, TenantMember, TenantSettings, MemberRole } from '../../types'

function getClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function mapTenant(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url ?? undefined,
    settings: row.settings,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMember(row: any): TenantMember {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
    user: {
      id: row.user.id,
      email: row.user.email,
      fullName: row.user.full_name,
      avatarUrl: row.user.avatar_url ?? undefined,
    },
    joinedAt: row.joined_at,
  }
}

export class TenantService {
  static async getTenant(tenantId: string): Promise<Tenant> {
    const supabase = getClient()

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) throw new Error(`Failed to fetch tenant: ${error.message}`)
    return mapTenant(data)
  }

  static async createTenant(input: {
    name: string
    slug: string
    ownerId: string
    plan?: string
    settings?: Partial<TenantSettings>
  }): Promise<Tenant> {
    const supabase = getClient()

    const defaultSettings: TenantSettings = {
      timezone: 'UTC',
      currency: 'USD',
      locale: 'en',
      branding: {},
    }

    const now = new Date().toISOString()

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: input.name,
        slug: input.slug,
        plan: input.plan ?? 'free',
        settings: { ...defaultSettings, ...input.settings },
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (tenantError) throw new Error(`Failed to create tenant: ${tenantError.message}`)

    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        user_id: input.ownerId,
        tenant_id: tenant.id,
        role: 'owner',
        joined_at: now,
      })

    if (memberError) throw new Error(`Failed to add owner to tenant: ${memberError.message}`)

    return mapTenant(tenant)
  }

  static async updateTenantSettings(
    tenantId: string,
    settings: Partial<TenantSettings>,
  ): Promise<Tenant> {
    const supabase = getClient()

    const { data: existing, error: fetchError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single()

    if (fetchError) throw new Error(`Failed to fetch tenant: ${fetchError.message}`)

    const merged = {
      ...existing.settings,
      ...settings,
      branding: {
        ...existing.settings?.branding,
        ...settings.branding,
      },
    }

    const { data, error } = await supabase
      .from('tenants')
      .update({ settings: merged, updated_at: new Date().toISOString() })
      .eq('id', tenantId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update tenant settings: ${error.message}`)
    return mapTenant(data)
  }

  static async getMembers(tenantId: string): Promise<TenantMember[]> {
    const supabase = getClient()

    const { data, error } = await supabase
      .from('tenant_members')
      .select('*, user:users(id, email, full_name, avatar_url)')
      .eq('tenant_id', tenantId)
      .order('joined_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch members: ${error.message}`)
    return (data ?? []).map(mapMember)
  }

  static async addMember(
    tenantId: string,
    userId: string,
    role: MemberRole,
  ): Promise<TenantMember> {
    const supabase = getClient()

    const { data: existing } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      throw new Error('User is already a member of this tenant.')
    }

    const { data, error } = await supabase
      .from('tenant_members')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role,
        joined_at: new Date().toISOString(),
      })
      .select('*, user:users(id, email, full_name, avatar_url)')
      .single()

    if (error) throw new Error(`Failed to add member: ${error.message}`)
    return mapMember(data)
  }

  static async removeMember(tenantId: string, memberId: string): Promise<void> {
    const supabase = getClient()

    const { data: member, error: fetchError } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError) throw new Error(`Member not found: ${fetchError.message}`)

    if (member.role === 'owner') {
      const { data: owners } = await supabase
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')

      if ((owners?.length ?? 0) <= 1) {
        throw new Error('Cannot remove the last owner of a tenant.')
      }
    }

    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('id', memberId)
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Failed to remove member: ${error.message}`)
  }

  static async updateMemberRole(
    tenantId: string,
    memberId: string,
    role: MemberRole,
  ): Promise<TenantMember> {
    const supabase = getClient()

    if (role === 'owner') {
      throw new Error('Cannot directly assign owner role. Use ownership transfer instead.')
    }

    const { data: member, error: fetchError } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError) throw new Error(`Member not found: ${fetchError.message}`)

    if (member.role === 'owner') {
      throw new Error('Cannot change the role of an owner.')
    }

    const { data, error } = await supabase
      .from('tenant_members')
      .update({ role })
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .select('*, user:users(id, email, full_name, avatar_url)')
      .single()

    if (error) throw new Error(`Failed to update member role: ${error.message}`)
    return mapMember(data)
  }
}
