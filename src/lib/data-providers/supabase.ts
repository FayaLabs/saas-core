import type { DataProvider, CrudQuery, CrudResult } from './types'
import { getSupabaseClient } from '../supabase'

export interface SupabaseProviderConfig {
  /** DB schema — default 'public', supports 'plg_*' plugin schemas */
  schema?: string
  /** Scope queries to a specific tenant */
  tenantId?: string | (() => string | undefined)
  /** Column name for tenant scoping (default 'tenant_id') */
  tenantIdColumn?: string
  /** Columns to search with ilike */
  searchColumns?: string[]
  /** Custom select expression (default '*') */
  selectColumns?: string
  /** camelCase ↔ snake_case overrides */
  columnMap?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Case conversion utilities
// ---------------------------------------------------------------------------

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function mapRow<T>(row: Record<string, unknown>, columnMap?: Record<string, string>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = columnMap?.[key] ?? snakeToCamel(key)
    result[camelKey] = value
  }
  return result as T
}

function mapEntity(entity: Record<string, unknown>, columnMap?: Record<string, string>): Record<string, unknown> {
  // Build reverse map: camelCase → snake_case
  const reverseMap: Record<string, string> = {}
  if (columnMap) {
    for (const [snake, camel] of Object.entries(columnMap)) {
      reverseMap[camel] = snake
    }
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(entity)) {
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'tenantId') continue
    const snakeKey = reverseMap[key] ?? camelToSnake(key)
    result[snakeKey] = value
  }
  return result
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

export function createSupabaseProvider<T extends { id: string }>(
  table: string,
  config?: SupabaseProviderConfig,
): DataProvider<T> {
  const schema = config?.schema ?? 'public'
  const tenantIdCol = config?.tenantIdColumn ?? 'tenant_id'
  const searchCols = config?.searchColumns ?? []
  const selectCols = config?.selectColumns ?? '*'
  const columnMap = config?.columnMap

  function resolveTenantId(): string | undefined {
    if (!config?.tenantId) return undefined
    return typeof config.tenantId === 'function' ? config.tenantId() : config.tenantId
  }

  function getClient() {
    const supabase = getSupabaseClient()
    return schema === 'public' ? supabase : supabase.schema(schema)
  }

  return {
    async list(query: CrudQuery): Promise<CrudResult<T>> {
      let q = getClient()
        .from(table)
        .select(selectCols, { count: 'exact' })

      // Tenant scoping
      const tenantId = resolveTenantId()
      if (tenantId) {
        q = q.eq(tenantIdCol, tenantId)
      }

      // Search
      if (query.search && searchCols.length > 0) {
        const term = `%${query.search}%`
        const orClause = searchCols.map((col) => `${col}.ilike.${term}`).join(',')
        q = q.or(orClause)
      }

      // Sort
      if (query.sortBy) {
        const col = camelToSnake(query.sortBy)
        q = q.order(col, { ascending: query.sortDir !== 'desc' })
      } else {
        q = q.order('created_at', { ascending: false })
      }

      // Pagination
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 50
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      q = q.range(from, to)

      const { data, error, count } = await q

      if (error) throw error

      return {
        data: (data ?? []).map((row: any) => mapRow<T>(row, columnMap)),
        total: count ?? 0,
      }
    },

    async create(data) {
      const row = mapEntity(data as Record<string, unknown>, columnMap)

      const tenantId = resolveTenantId()
      if (tenantId) {
        row[tenantIdCol] = tenantId
      }

      const { data: created, error } = await getClient()
        .from(table)
        .insert(row)
        .select()
        .single()

      if (error) throw error
      return mapRow<T>(created as Record<string, unknown>, columnMap)
    },

    async update(id, data) {
      const row = mapEntity(data as Record<string, unknown>, columnMap)

      const { data: updated, error } = await getClient()
        .from(table)
        .update(row)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return mapRow<T>(updated as Record<string, unknown>, columnMap)
    },

    async remove(id) {
      const { error } = await getClient()
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  }
}
