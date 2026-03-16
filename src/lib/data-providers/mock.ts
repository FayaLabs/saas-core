import type { DataProvider, CrudQuery, CrudResult } from './types'
import type { EntityDef } from '../../types/crud'

export function createMockProvider<T extends { id: string; [key: string]: any }>(
  entityDef: EntityDef<T>,
  initialData: T[] = [],
): DataProvider<T> {
  let items = [...initialData]

  const searchableKeys = entityDef.fields
    .filter((f) => f.searchable)
    .map((f) => f.key)

  return {
    async list(query: CrudQuery): Promise<CrudResult<T>> {
      let filtered = [...items]

      // Search
      if (query.search && searchableKeys.length > 0) {
        const term = query.search.toLowerCase()
        filtered = filtered.filter((item) =>
          searchableKeys.some((key) => {
            const val = item[key]
            return typeof val === 'string' && val.toLowerCase().includes(term)
          }),
        )
      }

      // Sort
      const sortBy = query.sortBy ?? entityDef.defaultSort
      const sortDir = query.sortDir ?? entityDef.defaultSortDir ?? 'asc'
      if (sortBy) {
        filtered.sort((a, b) => {
          const av = a[sortBy] ?? ''
          const bv = b[sortBy] ?? ''
          const cmp = typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv))
          return sortDir === 'desc' ? -cmp : cmp
        })
      }

      const total = filtered.length
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 50
      const start = (page - 1) * pageSize
      const data = filtered.slice(start, start + pageSize)

      return { data, total }
    },

    async create(data) {
      const now = new Date().toISOString()
      const item = {
        ...data,
        id: crypto.randomUUID(),
        tenantId: 'mock-tenant',
        createdAt: now,
        updatedAt: now,
      } as unknown as T
      items.unshift(item)
      return item
    },

    async update(id, data) {
      const idx = items.findIndex((i) => i.id === id)
      if (idx === -1) throw new Error(`Item not found: ${id}`)
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() }
      return items[idx]
    },

    async remove(id) {
      items = items.filter((i) => i.id !== id)
    },
  }
}
