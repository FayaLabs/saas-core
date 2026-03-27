import type { DataProvider, CrudQuery, CrudResult } from './types'
import { getSupabaseClientOptional } from '../supabase'
import type { EntityArchetype } from '../../types/entities'

// Archetypes that have a `kind` discriminator column
const HAS_KIND = new Set<EntityArchetype>(['person', 'category', 'order', 'transaction', 'booking', 'schedule', 'location'])

const ARCHETYPE_CONFIG: Record<EntityArchetype, { table: string; fkColumn: string }> = {
  person: { table: 'persons', fkColumn: 'person_id' },
  category: { table: 'categories', fkColumn: 'category_id' },
  product: { table: 'products', fkColumn: 'product_id' },
  service: { table: 'services', fkColumn: 'service_id' },
  location: { table: 'locations', fkColumn: 'location_id' },
  order: { table: 'orders', fkColumn: 'order_id' },
  transaction: { table: 'transactions', fkColumn: 'transaction_id' },
  booking: { table: 'bookings', fkColumn: 'booking_id' },
  schedule: { table: 'schedules', fkColumn: 'schedule_id' },
}

const ARCHETYPE_COLUMNS: Record<EntityArchetype, Set<string>> = {
  person: new Set(['name', 'email', 'phone', 'document_number', 'avatar_url', 'date_of_birth', 'address', 'city', 'state', 'country', 'postal_code', 'tags', 'is_active', 'notes', 'metadata']),
  category: new Set(['name', 'slug', 'parent_id', 'icon', 'color', 'sort_order', 'is_active', 'metadata']),
  product: new Set(['name', 'description', 'sku', 'price', 'cost', 'currency', 'unit', 'image_url', 'stock', 'min_stock', 'status', 'is_active', 'tags', 'metadata', 'category_id']),
  service: new Set(['name', 'description', 'price', 'cost', 'currency', 'duration_minutes', 'image_url', 'status', 'is_active', 'tags', 'metadata', 'category_id']),
  location: new Set(['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'is_headquarters', 'is_active', 'tags', 'notes', 'metadata']),
  order: new Set(['reference_number', 'status', 'party_id', 'assignee_id', 'location_id', 'subtotal', 'discount', 'tax', 'total', 'currency', 'due_at', 'completed_at', 'notes', 'tags', 'metadata']),
  transaction: new Set(['order_id', 'party_id', 'amount', 'currency', 'payment_method', 'reference', 'status', 'transacted_at', 'notes', 'metadata']),
  booking: new Set(['party_id', 'assignee_id', 'location_id', 'order_id', 'starts_at', 'ends_at', 'status', 'notes', 'metadata']),
  schedule: new Set(['assignee_id', 'location_id', 'day_of_week', 'specific_date', 'starts_at', 'ends_at', 'is_active', 'metadata']),
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function mapRow<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value
  }
  return result as T
}

export interface ArchetypeProviderConfig {
  archetype: EntityArchetype
  archetypeKind: string
  projectTable: string
  tenantId: () => string | undefined
  searchColumns?: string[]
}

export function createArchetypeProvider<T extends { id: string }>(
  config: ArchetypeProviderConfig,
): DataProvider<T> {
  const ac = ARCHETYPE_CONFIG[config.archetype]
  const archetypeColumns = ARCHETYPE_COLUMNS[config.archetype]
  const { fkColumn } = ac

  function getClient() {
    const supabase = getSupabaseClientOptional()
    if (!supabase) throw new Error('Supabase client not available')
    return supabase
  }

  function coreClient() {
    return getClient().schema('saas_core')
  }

  function splitFields(data: Record<string, unknown>): { archetypeData: Record<string, unknown>; projectData: Record<string, unknown> } {
    const archetypeData: Record<string, unknown> = {}
    const projectData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (['id', 'createdAt', 'updatedAt', 'tenantId', fkColumn].includes(key)) continue
      const snakeKey = camelToSnake(key)
      if (archetypeColumns.has(snakeKey)) {
        archetypeData[snakeKey] = value
      } else {
        projectData[snakeKey] = value
      }
    }
    return { archetypeData, projectData }
  }

  return {
    async list(query: CrudQuery): Promise<CrudResult<T>> {
      const tenantId = config.tenantId()
      if (!tenantId) return { data: [], total: 0 }

      // 1. Query project table to get FK IDs + project columns
      let q = getClient()
        .from(config.projectTable)
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)

      // Pagination
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 50
      const from = (page - 1) * pageSize
      q = q.range(from, from + pageSize - 1)
      q = q.order('created_at', { ascending: false })

      const { data: projectRows, error: projectError, count } = await q
      if (projectError) throw projectError
      if (!projectRows || projectRows.length === 0) return { data: [], total: count ?? 0 }

      // 2. Get archetype IDs from project rows
      const archetypeIds = projectRows.map((r: any) => r[fkColumn]).filter(Boolean)
      if (archetypeIds.length === 0) return { data: [], total: count ?? 0 }

      // 3. Fetch archetype rows
      let aq = coreClient()
        .from(ac.table)
        .select('*')
        .in('id', archetypeIds)

      // Search on archetype columns
      if (query.search && config.searchColumns && config.searchColumns.length > 0) {
        const term = `%${query.search}%`
        const orClauses = config.searchColumns
          .map((col) => camelToSnake(col))
          .filter((col) => archetypeColumns.has(col))
          .map((col) => `${col}.ilike.${term}`)
        if (orClauses.length > 0) {
          aq = aq.or(orClauses.join(','))
        }
      }

      // Sort on archetype columns
      if (query.sortBy) {
        const snakeCol = camelToSnake(query.sortBy)
        if (archetypeColumns.has(snakeCol)) {
          aq = aq.order(snakeCol, { ascending: query.sortDir !== 'desc' })
        }
      } else {
        aq = aq.order('created_at', { ascending: false })
      }

      const { data: archetypeRows, error: archetypeError } = await aq
      if (archetypeError) throw archetypeError

      // 4. Merge: archetype + project → flat rows
      const archetypeMap = new Map<string, Record<string, unknown>>()
      for (const row of (archetypeRows ?? [])) {
        archetypeMap.set((row as any).id, row as Record<string, unknown>)
      }

      const rows = projectRows
        .map((projectRow: any) => {
          const archetypeRow = archetypeMap.get(projectRow[fkColumn])
          if (!archetypeRow) return null

          const flat: Record<string, unknown> = {
            ...archetypeRow,
            ...projectRow,
            id: projectRow[fkColumn], // Use archetype ID as the entity ID
          }
          delete flat[fkColumn]
          return mapRow<T>(flat)
        })
        .filter(Boolean) as T[]

      return { data: rows, total: count ?? 0 }
    },

    async create(data) {
      const tenantId = config.tenantId()
      if (!tenantId) throw new Error('No tenant selected')

      const { archetypeData, projectData } = splitFields(data as Record<string, unknown>)

      // 1. Insert into archetype table
      archetypeData.tenant_id = tenantId
      if (HAS_KIND.has(config.archetype)) {
        archetypeData.kind = config.archetypeKind
      }

      const { data: archetypeRow, error: archetypeError } = await coreClient()
        .from(ac.table)
        .insert(archetypeData)
        .select()
        .single()

      if (archetypeError) throw archetypeError
      const archetypeId = (archetypeRow as any).id

      // 2. Insert into project table with archetype FK as PK
      projectData[fkColumn] = archetypeId
      projectData.tenant_id = tenantId

      const { error: projectError } = await getClient()
        .from(config.projectTable)
        .insert(projectData)

      if (projectError) {
        await coreClient().from(ac.table).delete().eq('id', archetypeId)
        throw projectError
      }

      return { id: archetypeId, ...archetypeRow, ...projectData } as unknown as T
    },

    async update(id, data) {
      const { archetypeData, projectData } = splitFields(data as Record<string, unknown>)

      if (Object.keys(archetypeData).length > 0) {
        const { error } = await coreClient()
          .from(ac.table)
          .update(archetypeData)
          .eq('id', id)
        if (error) throw error
      }

      if (Object.keys(projectData).length > 0) {
        const { error } = await getClient()
          .from(config.projectTable)
          .update(projectData)
          .eq(fkColumn, id)
        if (error) throw error
      }

      // Re-fetch
      const { data: archetypeRow } = await coreClient().from(ac.table).select('*').eq('id', id).single()
      const { data: projectRow } = await getClient().from(config.projectTable).select('*').eq(fkColumn, id).single()

      const flat = { ...archetypeRow, ...projectRow, id }
      delete (flat as any)[fkColumn]
      return mapRow<T>(flat as Record<string, unknown>)
    },

    async remove(id) {
      const { error } = await coreClient()
        .from(ac.table)
        .delete()
        .eq('id', id)
      if (error) throw error
    },
  }
}
