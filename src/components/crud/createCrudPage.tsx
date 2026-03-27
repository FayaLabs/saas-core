import React, { useMemo } from 'react'
import { CrudPage } from './CrudPage'
import { createCrudStore } from '../../stores/createCrudStore'
import { createMockProvider } from '../../lib/data-providers/mock'
import { createSupabaseProvider } from '../../lib/data-providers/supabase'
import { getSupabaseClientOptional } from '../../lib/supabase'
import type { EntityDef } from '../../types/crud'
import type { DataProvider } from '../../lib/data-providers/types'
import { useOrganizationStore } from '../../stores/organization.store'

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

      const client = getSupabaseClientOptional()
      let provider: DataProvider<T>

      if (client && entityDef.data?.table) {
        provider = createSupabaseProvider<T>(entityDef.data.table, {
          schema: entityDef.data.schema,
          tenantId: entityDef.data.tenantScoped === false
            ? undefined
            : () => useOrganizationStore.getState().currentOrg?.id,
          tenantIdColumn: entityDef.data.tenantIdColumn,
          searchColumns: entityDef.data.searchColumns ?? entityDef.fields
            .filter((field) => field.searchable)
            .map((field) => field.key),
          selectColumns: entityDef.data.selectColumns,
          columnMap: entityDef.data.columnMap,
        })
      } else {
        provider = createMockProvider(entityDef, options?.mockData)
      }

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
  return GeneratedCrudPage
}
