import React, { useState, useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { toast } from '../notifications/ToastProvider'
import { PersonFormLayout } from './archetypes/PersonFormLayout'
import { ProductFormLayout } from './archetypes/ProductFormLayout'
import { ServiceFormLayout } from './archetypes/ServiceFormLayout'
import { LocationFormLayout } from './archetypes/LocationFormLayout'
import { SubjectFormLayout } from './archetypes/SubjectFormLayout'
import { useTranslation } from '../../hooks/useTranslation'
import type { FieldDef, FieldGroup, EntityDef } from '../../types/crud'
import type { FormLayout } from '../../types/crud'

interface CrudFormPageProps {
  entityDef: EntityDef
  mode: 'create' | 'edit'
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void | Promise<void>
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
  const baseClass = 'flex h-10 w-full rounded-input border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={!!value}
            onChange={(checked) => onChange(checked)}
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
  const { t } = useTranslation()
  const formFields = entityDef.fields.filter((f) => f.showInForm !== false)
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'
  const [values, setValues] = useState<Record<string, any>>(() =>
    mode === 'edit' && initialData ? { ...getDefaultValues(formFields), ...initialData } : getDefaultValues(formFields),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValues(
      mode === 'edit' && initialData ? { ...getDefaultValues(formFields), ...initialData } : getDefaultValues(formFields),
    )
  }, [mode, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Sanitize: convert empty strings to null so the DB doesn't choke on e.g. empty date fields
      const sanitized: Record<string, any> = {}
      for (const [key, val] of Object.entries(values)) {
        sanitized[key] = val === '' ? null : val
      }
      await onSubmit(sanitized)
    } catch (err: any) {
      const message = err?.message || 'Something went wrong'
      toast.error(t('crud.form.failedToSave', { entity: entityDef.name.toLowerCase() }), { description: message })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const title = mode === 'create' ? t('crud.form.addTitle', { entity: entityDef.name }) : t('crud.form.editTitle', { entity: entityDef.name })
  const breadcrumbLabel = mode === 'create' ? t('crud.form.newBreadcrumb', { entity: entityDef.name }) : (initialData?.[displayField] ?? t('common.edit'))

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

  const archetypeLayoutProps = {
    fields: formFields,
    allFields: entityDef.fields,
    fieldGroups: groups,
    values,
    onChange: handleChange,
    renderField,
    entityIcon: entityDef.icon,
  }

  function renderFormBody(layout?: FormLayout) {
    switch (layout) {
      case 'person':
        return <PersonFormLayout {...archetypeLayoutProps} />
      case 'product':
        return <ProductFormLayout {...archetypeLayoutProps} />
      case 'service':
        return <ServiceFormLayout {...archetypeLayoutProps} />
      case 'location':
        return <LocationFormLayout {...archetypeLayoutProps} />
      case 'subject':
        return <SubjectFormLayout {...archetypeLayoutProps} />
      default:
        // Generic layout — ungrouped + grouped fields
        return (
          <>
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
          </>
        )
    }
  }

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
            {mode === 'create' ? t('crud.form.createDescription', { entity: entityDef.name.toLowerCase() }) : t('crud.form.editDescription', { entity: entityDef.name.toLowerCase() })}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderFormBody(entityDef.layout)}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? t('common.saving') : mode === 'create' ? t('crud.form.addTitle', { entity: entityDef.name }) : t('crud.form.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
