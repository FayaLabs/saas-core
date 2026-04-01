import React, { useMemo } from 'react'
import { CrudPage } from './CrudPage'
import { createCrudStore } from '../../stores/createCrudStore'
import { resolveDataProvider } from '../../lib/data-providers/resolve'
import type { EntityDef } from '../../types/crud'
import type { DataProvider } from '../../lib/data-providers/types'

interface CreateCrudPageOptions<T extends { id: string }> {
  mockData?: T[]
  dataProvider?: DataProvider<T>
  /** List display mode: 'table' (default) or 'cards' */
  display?: 'table' | 'cards'
  /** Feature ID for permission gating on CRUD actions */
  feature?: string
}

export function createCrudPage<T extends { id: string }>(
  entityDef: EntityDef<T>,
  options?: CreateCrudPageOptions<T>,
): React.ComponentType & { __crudBasePath?: string } {
  const display = options?.display ?? 'table'

  // If an explicit dataProvider was given, use it eagerly (no lazy resolution needed)
  let eagerStore: ReturnType<typeof createCrudStore<T>> | null = null
  if (options?.dataProvider) {
    eagerStore = createCrudStore(options.dataProvider)
  }

  const GeneratedCrudPage: React.FC & { __crudBasePath?: string } = () => {
    // Lazy provider resolution — runs at render time when Supabase is already initialized
    const useStore = useMemo(() => {
      if (eagerStore) return eagerStore
      const provider = resolveDataProvider(entityDef, options?.mockData)
      return createCrudStore(provider)
    }, [])

    const basePath = GeneratedCrudPage.__crudBasePath ?? '/'
    return (
      <CrudPage
        entityDef={entityDef as EntityDef<any>}
        useStore={useStore as any}
        basePath={basePath}
        display={display}
        feature={options?.feature}
      />
    )
  }

  GeneratedCrudPage.displayName = `CrudPage(${entityDef.name})`
  ;(GeneratedCrudPage as any).__isCrudPage = true
  ;(GeneratedCrudPage as any).__entityDef = entityDef
  return GeneratedCrudPage
}
