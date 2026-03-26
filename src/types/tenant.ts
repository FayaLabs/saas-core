export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl?: string
  settings: TenantSettings
  plan: string
  verticalId?: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  tenantId: string
  name: string
  slug: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country: string
  phone?: string
  email?: string
  timezone: string
  isHeadquarters: boolean
  isActive: boolean
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface LocationMember {
  id: string
  locationId: string
  userId: string
  role: string
  isPrimary: boolean
  createdAt: string
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
