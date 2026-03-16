import type React from 'react'

export type FieldType =
  | 'text' | 'email' | 'phone' | 'url' | 'image'
  | 'number' | 'currency'
  | 'select' | 'multiselect'
  | 'date' | 'datetime' | 'time'
  | 'boolean' | 'textarea'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[] | { label: string; value: string }[]
  min?: number
  max?: number
  currency?: string
  showInTable?: boolean
  showInForm?: boolean
  sortable?: boolean
  searchable?: boolean
  renderCell?: (value: any, row: any) => React.ReactNode
  defaultValue?: any
}

export interface EntityDef<T = Record<string, any>> {
  name: string
  namePlural?: string
  icon: string
  fields: FieldDef[]
  defaultSort?: string
  defaultSortDir?: 'asc' | 'desc'
  displayField?: string
  /** Field key containing an image URL — shown as hero image on card layout */
  imageField?: string
}
