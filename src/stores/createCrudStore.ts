import { create } from 'zustand'
import type { DataProvider, CrudQuery } from '../lib/data-providers/types'

export interface CrudState<T> {
  items: T[]
  total: number
  loading: boolean
  query: CrudQuery
}

export interface CrudActions<T> {
  fetch: () => Promise<void>
  create: (data: any) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  remove: (id: string) => Promise<void>
  setQuery: (query: Partial<CrudQuery>) => void
  getById: (id: string) => T | undefined
}

export type CrudStore<T> = CrudState<T> & CrudActions<T>

export function createCrudStore<T extends { id: string }>(
  dataProvider: DataProvider<T>,
) {
  // Dedup: track the current in-flight fetch to avoid duplicate requests
  let inflightFetch: Promise<void> | null = null
  let lastQueryKey = ''

  function queryKey(query: CrudQuery): string {
    return JSON.stringify(query)
  }

  return create<CrudStore<T>>((set, get) => ({
    items: [],
    total: 0,
    loading: false,
    query: {},

    async fetch() {
      const currentKey = queryKey(get().query)

      // If we already have an in-flight request for the same query, reuse it
      if (inflightFetch && currentKey === lastQueryKey) {
        return inflightFetch
      }

      lastQueryKey = currentKey
      set({ loading: true })

      const promise = (async () => {
        try {
          const result = await dataProvider.list(get().query)
          set({ items: result.data, total: result.total, loading: false })
        } catch {
          set({ loading: false })
        } finally {
          inflightFetch = null
        }
      })()

      inflightFetch = promise
      return promise
    },

    async create(data) {
      const item = await dataProvider.create(data)
      inflightFetch = null // invalidate dedup cache
      lastQueryKey = ''
      await get().fetch()
      return item
    },

    async update(id, data) {
      const item = await dataProvider.update(id, data)
      inflightFetch = null
      lastQueryKey = ''
      await get().fetch()
      return item
    },

    async remove(id) {
      await dataProvider.remove(id)
      inflightFetch = null
      lastQueryKey = ''
      await get().fetch()
    },

    setQuery(partial) {
      set((s) => ({ query: { ...s.query, ...partial } }))
      queueMicrotask(() => get().fetch())
    },

    getById(id) {
      return get().items.find((item) => item.id === id)
    },
  }))
}
