import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useOrganizationStore } from '../../stores/organization.store'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { CrudFormPage } from './CrudFormPage'
import { CrudDetailPage } from './CrudDetailPage'
import { CrudCardGrid } from './CrudCardGrid'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { fieldToColumns } from './fieldToColumn'
import { PermissionGate } from '../organization/PermissionGate'
import type { EntityDef } from '../../types/crud'
import type { CrudStore } from '../../stores/createCrudStore'

type CrudDisplay = 'table' | 'cards'

interface CrudPageProps<T extends { id: string }> {
  entityDef: EntityDef<T>
  useStore: () => CrudStore<T>
  basePath: string
  display: CrudDisplay
  feature?: string
  /** If true, hides create/edit/delete actions — list and detail view only */
  readOnly?: boolean
}

function getRouteDepth(sub: string): number {
  if (sub === '' || sub === '/') return 0        // list
  if (sub === '/new') return 1                    // create
  if (sub.endsWith('/edit')) return 2             // edit
  return 1                                        // detail
}

function useSubRoute(basePath: string) {
  const getSub = () => {
    const hash = window.location.hash.slice(1) || '/'
    return hash.startsWith(basePath) ? hash.slice(basePath.length) : ''
  }

  const [sub, setSub] = useState(getSub)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const prevDepthRef = useRef(getRouteDepth(getSub()))

  useEffect(() => {
    const handler = () => {
      const next = getSub()
      const nextDepth = getRouteDepth(next)
      setDirection(nextDepth > prevDepthRef.current ? 'forward' : 'back')
      prevDepthRef.current = nextDepth
      setSub(next)
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [basePath])

  return { sub, direction }
}

function CrudTableView<T extends { id: string }>({
  entityDef,
  store,
  basePath,
  onDelete,
  feature,
}: {
  entityDef: EntityDef<T>
  store: CrudStore<T>
  basePath: string
  onDelete: (item: T) => void
  feature?: string
}) {
  const columns = fieldToColumns(entityDef.fields)
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'

  const handleSort = (key: string) => {
    const currentSort = store.query.sortBy
    const currentDir = store.query.sortDir ?? 'asc'
    if (currentSort === key) {
      store.setQuery({ sortDir: currentDir === 'asc' ? 'desc' : 'asc' })
    } else {
      store.setQuery({ sortBy: key, sortDir: 'asc' })
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left p-4 text-sm font-medium text-muted-foreground ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {store.query.sortBy === col.key && (
                      <span className="text-xs">{store.query.sortDir === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </span>
                </th>
              ))}
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {store.items.map((item) => {
              const id = (item as any).id
              return (
                <tr
                  key={id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => { window.location.hash = `${basePath}/${id}` }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="p-4 text-sm">
                      {col.key === displayField ? (
                        <span className="font-medium text-foreground">
                          {col.render((item as any)[col.key], item)}
                        </span>
                      ) : (
                        col.render((item as any)[col.key], item)
                      )}
                    </td>
                  ))}
                  <td className="p-4 text-sm text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {feature ? (
                        <>
                          <PermissionGate feature={feature} action="edit">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { window.location.hash = `${basePath}/${id}/edit` }}><Pencil className="h-4 w-4" /></Button>
                          </PermissionGate>
                          <PermissionGate feature={feature} action="delete">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                          </PermissionGate>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { window.location.hash = `${basePath}/${id}/edit` }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function CrudPage<T extends { id: string }>({ entityDef, useStore, basePath, display, feature, readOnly }: CrudPageProps<T>) {
  const store = useStore()
  const { sub, direction } = useSubRoute(basePath)
  const [deleteItem, setDeleteItem] = useState<T | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const namePlural = entityDef.namePlural ?? entityDef.name + 's'
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentOrgId = useOrganizationStore((s) => s.currentOrg?.id)

  useEffect(() => {
    store.fetch()
  }, [currentOrgId])

  const navigateToList = () => { window.location.hash = basePath }
  const animClass = direction === 'forward' ? 'saas-nav-forward' : 'saas-nav-back'

  // Determine which view to show
  let viewKey = 'list'
  let content: React.ReactNode = null

  if (sub === '/new' && !readOnly) {
    viewKey = 'new'
    content = (
      <CrudFormPage
        entityDef={entityDef}
        mode="create"
        namePlural={namePlural}
        onCancel={navigateToList}
        onSubmit={async (data) => {
          await store.create(data)
          navigateToList()
        }}
      />
    )
  } else if (sub === '/new' && readOnly) {
    // readOnly — redirect back to list
    navigateToList()
  } else if (sub.endsWith('/edit') && !readOnly) {
    const id = sub.slice(1, -5)
    const item = store.getById(id)
    viewKey = `edit-${id}`

    if (!item && store.loading) {
      content = (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )
    } else if (!item) {
      content = (
        <div className="space-y-6">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <button type="button" onClick={navigateToList} className="hover:text-foreground transition-colors">{namePlural}</button>
            <span>/</span>
            <span className="text-foreground font-medium">Not Found</span>
          </nav>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{entityDef.name} not found.</p>
            <Button onClick={navigateToList}>Back to {namePlural}</Button>
          </div>
        </div>
      )
    } else {
      content = (
        <CrudFormPage
          entityDef={entityDef}
          mode="edit"
          initialData={item as any}
          namePlural={namePlural}
          onCancel={() => { window.location.hash = `${basePath}/${id}` }}
          onSubmit={async (data) => {
            await store.update(id, data as Partial<T>)
            window.location.hash = `${basePath}/${id}`
          }}
        />
      )
    }
  } else if (sub.endsWith('/edit') && readOnly) {
    // readOnly — redirect to detail view
    const id = sub.slice(1, -5)
    window.location.hash = `${basePath}/${id}`
  } else if (sub.startsWith('/') && sub.length > 1) {
    const id = sub.slice(1)
    const item = store.getById(id)
    viewKey = `detail-${id}`

    if (!item && store.loading) {
      content = (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )
    } else if (!item) {
      content = (
        <div className="space-y-6">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <button type="button" onClick={navigateToList} className="hover:text-foreground transition-colors">{namePlural}</button>
            <span>/</span>
            <span className="text-foreground font-medium">Not Found</span>
          </nav>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{entityDef.name} not found.</p>
            <Button onClick={navigateToList}>Back to {namePlural}</Button>
          </div>
        </div>
      )
    } else {
      content = (
        <CrudDetailPage
          entityDef={entityDef}
          item={item as any}
          namePlural={namePlural}
          basePath={basePath}
          onBack={navigateToList}
          onEdit={readOnly ? undefined : () => { window.location.hash = `${basePath}/${id}/edit` }}
          onDelete={readOnly ? undefined : () => setDeleteItem(item)}
          feature={feature}
        />
      )
    }
  } else {
    // List view
    const handleSearch = (value: string) => {
      setSearchInput(value)
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        store.setQuery({ search: value || undefined })
      }, 350)
    }

    const isEmpty = store.items.length === 0 && !store.loading
    const isInitialLoad = store.loading && store.items.length === 0
    const columns = fieldToColumns(entityDef.fields)

    content = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{namePlural}</h1>
            {isInitialLoad ? (
              <div className="h-5 w-32 animate-pulse rounded bg-muted mt-1" />
            ) : (
              <p className="text-muted-foreground">{store.total} total {namePlural.toLowerCase()}</p>
            )}
          </div>
          {!readOnly && (feature ? (
            <PermissionGate feature={feature} action="create">
              <Button onClick={() => { window.location.hash = `${basePath}/new` }}>+ Add {entityDef.name}</Button>
            </PermissionGate>
          ) : (
            <Button onClick={() => { window.location.hash = `${basePath}/new` }}>+ Add {entityDef.name}</Button>
          ))}
        </div>

        {entityDef.fields.some((f) => f.searchable) && (
          <Input
            type="text"
            placeholder={`Search ${namePlural.toLowerCase()}...`}
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        )}

        {isInitialLoad ? (
          display === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="space-y-2">
                      <div className="flex justify-between"><div className="h-4 w-20 animate-pulse rounded bg-muted" /><div className="h-4 w-16 animate-pulse rounded bg-muted" /></div>
                      <div className="flex justify-between"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="h-4 w-12 animate-pulse rounded bg-muted" /></div>
                      <div className="flex justify-between"><div className="h-4 w-16 animate-pulse rounded bg-muted" /><div className="h-4 w-20 animate-pulse rounded bg-muted" /></div>
                    </div>
                  </div>
                  <div className="border-t px-5 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {columns.map((col) => (
                        <th key={col.key} className="text-left p-4 text-sm font-medium text-muted-foreground">{col.label}</th>
                      ))}
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {columns.map((col, ci) => (
                          <td key={col.key} className="p-4">
                            <div className={`h-4 animate-pulse rounded bg-muted ${ci === 0 ? 'w-32' : 'w-20'}`} />
                          </td>
                        ))}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        ) : isEmpty ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No {namePlural.toLowerCase()} yet</p>
              {!readOnly && <Button onClick={() => { window.location.hash = `${basePath}/new` }}>Add your first {entityDef.name.toLowerCase()}</Button>}
            </div>
          </Card>
        ) : display === 'cards' ? (
          <CrudCardGrid
            items={store.items}
            entityDef={entityDef as EntityDef<any>}
            onEdit={(item) => { window.location.hash = `${basePath}/${(item as any).id}` }}
            onDelete={(item) => setDeleteItem(item)}
          />
        ) : (
          <CrudTableView
            entityDef={entityDef}
            store={store}
            basePath={basePath}
            onDelete={(item) => setDeleteItem(item)}
            feature={feature}
          />
        )}
      </div>
    )
  }

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      store.remove((deleteItem as any).id)
      setDeleteItem(null)
      navigateToList()
    }
  }

  return (
    <>
      <div key={viewKey} className={animClass}>
        {content}
      </div>
      <DeleteConfirmDialog
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        entityName={entityDef.name}
        displayValue={deleteItem ? (deleteItem as any)[displayField] : undefined}
      />
    </>
  )
}
