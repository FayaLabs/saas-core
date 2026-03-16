import React from 'react'
import type { FieldDef } from '../../types/crud'
import { Badge } from '../ui/badge'

function formatCurrency(value: any, currency = 'USD'): string {
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
}

function formatDate(value: any): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return String(value)
  }
}

function formatDateTime(value: any): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return String(value)
  }
}

export interface ColumnDef {
  key: string
  label: string
  sortable: boolean
  render: (value: any, row: any) => React.ReactNode
}

export function fieldToColumns(fields: FieldDef[]): ColumnDef[] {
  return fields
    .filter((f) => f.showInTable !== false)
    .map((field): ColumnDef => {
      const sortable = field.sortable ?? ['text', 'number', 'currency', 'date', 'datetime', 'email'].includes(field.type)

      const render = field.renderCell ?? ((value: any, _row: any): React.ReactNode => {
        if (value == null || value === '') return <span className="text-muted-foreground">—</span>

        switch (field.type) {
          case 'currency':
            return <span>{formatCurrency(value, field.currency)}</span>
          case 'date':
            return <span>{formatDate(value)}</span>
          case 'datetime':
            return <span>{formatDateTime(value)}</span>
          case 'boolean':
            return value ? (
              <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          case 'select':
            return <Badge variant="secondary">{String(value)}</Badge>
          case 'number':
            return <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
          default:
            return <span>{String(value)}</span>
        }
      })

      return { key: field.key, label: field.label, sortable, render }
    })
}
