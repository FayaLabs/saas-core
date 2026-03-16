export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl?: string
  settings: TenantSettings
  plan: string
  createdAt: string
  updatedAt: string
}

export interface TenantSettings {
  timezone: string
  currency: string
  locale: string
  branding: {
    primaryColor?: string
    accentColor?: string
    logoUrl?: string
    faviconUrl?: string
  }
}

export type MemberRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer'

export interface TenantMember {
  id: string
  userId: string
  tenantId: string
  role: MemberRole
  profileId?: string
  profileName?: string
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl?: string
  }
  joinedAt: string
}

export interface TenantState {
  tenant: Tenant | null
  members: TenantMember[]
  currentRole: MemberRole | null
  loading: boolean
}
