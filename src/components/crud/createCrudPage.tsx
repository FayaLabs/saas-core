import React from 'react'
import { CrudPage } from './CrudPage'
import { createCrudStore } from '../../stores/createCrudStore'
import { createMockProvider } from '../../lib/data-providers/mock'
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
  const provider = options?.dataProvider ?? createMockProvider(entityDef, options?.mockData)
  const useStore = createCrudStore(provider)
  const display = options?.display ?? 'table'

  const GeneratedCrudPage: React.FC & { __crudBasePath?: string } = () => {
    // Resolve basePath from the hash — the component is mounted at a known path
    // We read it from the static property set by createSaasApp
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
  // Mark as CRUD page for prefix routing in createSaasApp
  ;(GeneratedCrudPage as any).__isCrudPage = true
  return GeneratedCrudPage
}
