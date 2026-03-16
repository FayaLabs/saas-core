import React from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { FieldDef, EntityDef } from '../../types/crud'

interface CrudCardGridProps<T> {
  items: T[]
  entityDef: EntityDef<T>
  onEdit: (item: T) => void
  onDelete: (item: T) => void
}

function formatValue(field: FieldDef, value: any): React.ReactNode {
  if (value == null || value === '') return null

  switch (field.type) {
    case 'currency': {
      const num = typeof value === 'number' ? value : parseFloat(value)
      if (isNaN(num)) return null
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: field.currency ?? 'USD' }).format(num)
    }
    case 'date':
      try { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) }
      catch { return String(value) }
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'select':
      return <Badge variant="secondary">{String(value)}</Badge>
    case 'image':
      return null // images rendered separately as hero
    default:
      return String(value)
  }
}

export function CrudCardGrid<T extends { id: string }>({ items, entityDef, onEdit, onDelete }: CrudCardGridProps<T>) {
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'
  const imageField = entityDef.imageField
  const visibleFields = entityDef.fields.filter(
    (f) => f.showInTable !== false && f.key !== displayField && f.key !== imageField && f.type !== 'image'
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const record = item as any
        const imageUrl = imageField ? record[imageField] : null

        return (
          <Card key={record.id} className="flex flex-col overflow-hidden">
            {imageUrl && (
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt={record[displayField] ?? ''}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-5 flex-1">
              <h3 className="font-semibold text-base mb-3">{record[displayField] ?? record.id}</h3>
              <dl className="space-y-1.5">
                {visibleFields.slice(0, 4).map((field) => {
                  const val = formatValue(field, record[field.key])
                  if (val == null) return null
                  return (
                    <div key={field.key} className="flex items-center justify-between text-sm">
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="font-medium">{val}</dd>
                    </div>
                  )
                })}
              </dl>
            </div>
            <div className="flex items-center gap-1 border-t px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>Delete</Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
