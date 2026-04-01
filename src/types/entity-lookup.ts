// ---------------------------------------------------------------------------
// Entity Lookup — cross-plugin entity reference types
// Pure types only. Runtime functions are in lib/archetype-lookup.ts
// ---------------------------------------------------------------------------

export interface EntityLookupResult {
  id: string
  label: string
  subtitle?: string
  group?: string
  icon?: string
  price?: number
  data?: Record<string, unknown>
}

export interface EntityLookup {
  search(query: string): Promise<EntityLookupResult[]>
  getById(id: string): Promise<EntityLookupResult | null>
}

export type EntityLookupMap = Record<string, EntityLookup>

export type ArchetypeType = 'person' | 'product' | 'service' | 'location'
