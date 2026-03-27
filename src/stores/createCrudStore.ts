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
  return create<CrudStore<T>>((set, get) => ({
    items: [],
    total: 0,
    loading: false,
    query: {},

    async fetch() {
      set({ loading: true })
      try {
        const result = await dataProvider.list(get().query)
        set({ items: result.data, total: result.total, loading: false })
      } catch {
        set({ loading: false })
      }
    },

    async create(data) {
      const item = await dataProvider.create(data)
      await get().fetch()
      return item
    },

    async update(id, data) {
      const item = await dataProvider.update(id, data)
      await get().fetch()
      return item
    },

    async remove(id) {
      await dataProvider.remove(id)
      await get().fetch()
    },

    setQuery(partial) {
      set((s) => ({ query: { ...s.query, ...partial } }))
      // Use queueMicrotask to ensure state is committed before fetch
      queueMicrotask(() => get().fetch())
    },

    getById(id) {
      return get().items.find((item) => item.id === id)
    },
  }))
}
