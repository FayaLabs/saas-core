export type EntityArchetype = 'person' | 'service' | 'product' | 'transaction' | 'organization' | 'asset'

export interface BaseEntity {
  id: string
  tenantId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface PersonEntity extends BaseEntity {
  archetype: 'person'
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  avatarUrl?: string
  tags: string[]
  metadata: Record<string, unknown>
}

export interface ServiceEntity extends BaseEntity {
  archetype: 'service'
  name: string
  duration: number
  price: number
  description?: string
  category?: string
}

export interface ProductEntity extends BaseEntity {
  archetype: 'product'
  name: string
  sku?: string
  price: number
  stock?: number
  images: string[]
  category?: string
}

export interface TransactionEntity extends BaseEntity {
  archetype: 'transaction'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'refunded' | 'failed'
  items: { name: string; quantity: number; price: number }[]
  personId?: string
}

export interface OrganizationEntity extends BaseEntity {
  archetype: 'organization'
  name: string
  address?: string
  phone?: string
  settings: Record<string, unknown>
  parentId?: string
}

export interface AssetEntity extends BaseEntity {
  archetype: 'asset'
  name: string
  type: string
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  capacity?: number
  location?: string
}

export type Entity = PersonEntity | ServiceEntity | ProductEntity | TransactionEntity | OrganizationEntity | AssetEntity
