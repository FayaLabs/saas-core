import React, { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
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
}

function useSubRoute(basePath: string) {
  const [sub, setSub] = useState(() => {
    const hash = window.location.hash.slice(1) || '/'
    return hash.startsWith(basePath) ? hash.slice(basePath.length) : ''
  })

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(1) || '/'
      setSub(hash.startsWith(basePath) ? hash.slice(basePath.length) : '')
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [basePath])

  return sub // '' = list, '/new' = create, '/:id' = detail, '/:id/edit' = edit
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

export function CrudPage<T extends { id: string }>({ entityDef, useStore, basePath, display, feature }: CrudPageProps<T>) {
  const store = useStore()
  const sub = useSubRoute(basePath)
  const [deleteItem, setDeleteItem] = useState<T | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const namePlural = entityDef.namePlural ?? entityDef.name + 's'
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'

  useEffect(() => {
    store.fetch()
  }, [])

  const navigateToList = () => { window.location.hash = basePath }

  // /new — create form
  if (sub === '/new') {
    return (
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
  }

  // /:id/edit — edit form
  if (sub.endsWith('/edit')) {
    const id = sub.slice(1, -5) // remove leading / and trailing /edit
    const item = store.getById(id)

    if (!item && store.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )
    }

    if (!item) {
      return (
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
    }

    return (
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

  // /:id — detail view
  if (sub.startsWith('/') && sub.length > 1) {
    const id = sub.slice(1)
    const item = store.getById(id)

    if (!item && store.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )
    }

    if (!item) {
      return (
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
    }

    return (
      <CrudDetailPage
        entityDef={entityDef}
        item={item as any}
        namePlural={namePlural}
        basePath={basePath}
        onBack={navigateToList}
        onEdit={() => { window.location.hash = `${basePath}/${id}/edit` }}
        onDelete={() => setDeleteItem(item)}
        feature={feature}
      />
    )
  }

  // List view
  const handleSearch = (value: string) => {
    setSearchInput(value)
    store.setQuery({ search: value || undefined })
  }

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      store.remove((deleteItem as any).id)
      setDeleteItem(null)
      navigateToList()
    }
  }

  const isEmpty = store.items.length === 0 && !store.loading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{namePlural}</h1>
          <p className="text-muted-foreground">{store.total} total {namePlural.toLowerCase()}</p>
        </div>
        {feature ? (
          <PermissionGate feature={feature} action="create">
            <Button onClick={() => { window.location.hash = `${basePath}/new` }}>+ Add {entityDef.name}</Button>
          </PermissionGate>
        ) : (
          <Button onClick={() => { window.location.hash = `${basePath}/new` }}>+ Add {entityDef.name}</Button>
        )}
      </div>

      {/* Search */}
      {entityDef.fields.some((f) => f.searchable) && (
        <Input
          type="text"
          placeholder={`Search ${namePlural.toLowerCase()}...`}
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      )}

      {/* Empty state */}
      {isEmpty ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No {namePlural.toLowerCase()} yet</p>
            <Button onClick={() => { window.location.hash = `${basePath}/new` }}>Add your first {entityDef.name.toLowerCase()}</Button>
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

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        entityName={entityDef.name}
        displayValue={deleteItem ? (deleteItem as any)[displayField] : undefined}
      />
    </div>
  )
}
