import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { FieldDef, FieldGroup, EntityDef } from '../../types/crud'

interface CrudFormPageProps {
  entityDef: EntityDef
  mode: 'create' | 'edit'
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void
  onCancel: () => void
  namePlural: string
}

function getDefaultValues(fields: FieldDef[]): Record<string, any> {
  const values: Record<string, any> = {}
  for (const field of fields) {
    if (field.showInForm === false) continue
    if (field.defaultValue != null) {
      values[field.key] = field.defaultValue
    } else {
      switch (field.type) {
        case 'boolean':
          values[field.key] = false
          break
        case 'number':
        case 'currency':
          values[field.key] = ''
          break
        default:
          values[field.key] = ''
      }
    }
  }
  return values
}

function renderField(field: FieldDef, value: any, onChange: (val: any) => void) {
  const baseClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className={`${baseClass} min-h-[80px] py-2`}
        />
      )
    case 'select': {
      const options = (field.options ?? []).map((o) =>
        typeof o === 'string' ? { label: o, value: o } : o,
      )
      return (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={baseClass}
        >
          <option value="">{field.placeholder ?? `Select ${field.label.toLowerCase()}...`}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">{field.label}</span>
        </label>
      )
    case 'number':
    case 'currency':
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={field.placeholder}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.type === 'currency' ? '0.01' : undefined}
        />
      )
    case 'date':
      return <Input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required} />
    case 'datetime':
      return <Input type="datetime-local" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required} />
    case 'time':
      return <Input type="time" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required} />
    default:
      return (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
  }
}

function FormFieldItem({ field, value, onChange }: { field: FieldDef; value: any; onChange: (val: any) => void }) {
  return (
    <div className={`grid gap-1.5 ${field.span === 2 ? 'md:col-span-2' : ''}`}>
      {field.type !== 'boolean' && (
        <label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {renderField(field, value, onChange)}
    </div>
  )
}

function FormGroup({
  group,
  fields,
  values,
  onChange,
}: {
  group: FieldGroup
  fields: FieldDef[]
  values: Record<string, any>
  onChange: (key: string, val: any) => void
}) {
  const cols = group.columns ?? 2

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
      {group.description && (
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">{group.description}</p>
      )}
      <Card>
        <CardContent className="pt-5">
          <div className={`grid gap-4 ${cols >= 2 ? 'md:grid-cols-2' : ''} ${cols >= 3 ? 'lg:grid-cols-3' : ''}`}>
            {fields.map((field) => (
              <FormFieldItem
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(val) => onChange(field.key, val)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CrudFormPage({ entityDef, mode, initialData, onSubmit, onCancel, namePlural }: CrudFormPageProps) {
  const formFields = entityDef.fields.filter((f) => f.showInForm !== false)
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'
  const [values, setValues] = useState<Record<string, any>>(() =>
    mode === 'edit' && initialData ? { ...getDefaultValues(formFields), ...initialData } : getDefaultValues(formFields),
  )

  useEffect(() => {
    setValues(
      mode === 'edit' && initialData ? { ...getDefaultValues(formFields), ...initialData } : getDefaultValues(formFields),
    )
  }, [mode, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const handleChange = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const title = mode === 'create' ? `Add ${entityDef.name}` : `Edit ${entityDef.name}`
  const breadcrumbLabel = mode === 'create' ? `New ${entityDef.name}` : (initialData?.[displayField] ?? 'Edit')

  // Organize fields by groups
  const groups = entityDef.fieldGroups ?? []
  const groupFieldMap = new Map<string, FieldDef[]>()
  const ungroupedFields: FieldDef[] = []

  for (const field of formFields) {
    if (field.group) {
      const existing = groupFieldMap.get(field.group) ?? []
      existing.push(field)
      groupFieldMap.set(field.group, existing)
    } else {
      ungroupedFields.push(field)
    }
  }

  const hasGroups = groups.length > 0 || groupFieldMap.size > 0

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {namePlural}
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{breadcrumbLabel}</span>
        </nav>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {mode === 'create' ? `Create a new ${entityDef.name.toLowerCase()}.` : `Update ${entityDef.name.toLowerCase()} details.`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ungrouped fields */}
          {ungroupedFields.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <div className={`grid gap-4 ${!hasGroups ? '' : 'md:grid-cols-2'}`}>
                  {ungroupedFields.map((field) => (
                    <FormFieldItem
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      onChange={(val) => handleChange(field.key, val)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grouped fields */}
          {groups.map((group) => {
            const fields = groupFieldMap.get(group.id)
            if (!fields || fields.length === 0) return null
            return (
              <FormGroup
                key={group.id}
                group={group}
                fields={fields}
                values={values}
                onChange={handleChange}
              />
            )
          })}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">{mode === 'create' ? `Add ${entityDef.name}` : 'Save Changes'}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
