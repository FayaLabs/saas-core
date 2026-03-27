import React from 'react'
import { User } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { ActiveToggle } from './ActiveToggle'
import type { FieldDef, FieldGroup } from '../../../types/crud'

interface PersonFormLayoutProps {
  fields: FieldDef[]
  fieldGroups: FieldGroup[]
  values: Record<string, any>
  onChange: (key: string, val: any) => void
  renderField: (field: FieldDef, value: any, onChange: (val: any) => void) => React.ReactNode
}

const IDENTITY_FIELDS = new Set(['name', 'dateOfBirth', 'documentNumber'])
const CONTACT_FIELDS = new Set(['email', 'phone'])
const ADDRESS_FIELDS = new Set(['address', 'city', 'state', 'country', 'postalCode'])
const SKIP_FIELDS = new Set(['isActive', 'status', 'tags', 'avatarUrl', 'notes'])
const ALL_PERSON_FIELDS = new Set([...IDENTITY_FIELDS, ...CONTACT_FIELDS, ...ADDRESS_FIELDS, ...SKIP_FIELDS])

function FieldItem({ field, value, onChange, renderField, colSpan }: {
  field: FieldDef; value: any; onChange: (val: any) => void
  renderField: PersonFormLayoutProps['renderField']; colSpan?: boolean
}) {
  return (
    <div className={`space-y-1.5 ${colSpan ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-medium">
        {field.label}{field.required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {renderField(field, value, onChange)}
    </div>
  )
}

export function PersonFormLayout({ fields, fieldGroups, values, onChange, renderField }: PersonFormLayoutProps) {
  const nameField = fields.find((f) => f.key === 'name')
  const docField = fields.find((f) => f.key === 'documentNumber')
  const dobField = fields.find((f) => f.key === 'dateOfBirth')
  const contactFields = fields.filter((f) => CONTACT_FIELDS.has(f.key))
  const addressFields = fields.filter((f) => ADDRESS_FIELDS.has(f.key))
  const notesField = fields.find((f) => f.key === 'notes')
  const hasActive = fields.some((f) => f.key === 'isActive')

  // Project-specific fields
  const projectFields = fields.filter((f) => !ALL_PERSON_FIELDS.has(f.key))

  const groupFieldMap = new Map<string, FieldDef[]>()
  const ungroupedProject: FieldDef[] = []
  for (const field of projectFields) {
    if (field.group) {
      const existing = groupFieldMap.get(field.group) ?? []
      existing.push(field)
      groupFieldMap.set(field.group, existing)
    } else {
      ungroupedProject.push(field)
    }
  }

  return (
    <div className="space-y-6">
      {/* Identity card — avatar + name + dob + doc + active toggle */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-4">
              {/* Row 1: Name + Document + Active toggle */}
              <div className="flex items-start gap-4">
                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                  {nameField && (
                    <div className={`space-y-1.5 ${!docField ? 'sm:col-span-2' : ''}`}>
                      <label className="text-sm font-medium">{nameField.label}{nameField.required && <span className="text-destructive ml-0.5">*</span>}</label>
                      {renderField(nameField, values[nameField.key], (val) => onChange(nameField.key, val))}
                    </div>
                  )}
                  {docField && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{docField.label}{docField.required && <span className="text-destructive ml-0.5">*</span>}</label>
                      {renderField(docField, values[docField.key], (val) => onChange(docField.key, val))}
                    </div>
                  )}
                </div>
                {hasActive && (
                  <div className="mt-6 shrink-0">
                    <ActiveToggle active={values.isActive ?? true} onChange={(v) => onChange('isActive', v)} />
                  </div>
                )}
              </div>
              {/* Row 2: Date of birth */}
              {dobField && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldItem field={dobField} value={values[dobField.key]} onChange={(val) => onChange(dobField.key, val)} renderField={renderField} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project-specific grouped fields */}
      {fieldGroups.map((group) => {
        const gFields = groupFieldMap.get(group.id)
        if (!gFields || gFields.length === 0) return null
        const cols = group.columns ?? 2
        return (
          <div key={group.id}>
            <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
            {group.description && <p className="text-xs text-muted-foreground mt-0.5 mb-3">{group.description}</p>}
            <Card className="mt-1">
              <CardContent className="pt-5">
                <div className={`grid gap-4 ${cols >= 2 ? 'md:grid-cols-2' : ''} ${cols >= 3 ? 'lg:grid-cols-3' : ''}`}>
                  {gFields.map((field) => (
                    <FieldItem key={field.key} field={field} value={values[field.key]} onChange={(val) => onChange(field.key, val)} renderField={renderField} colSpan={field.span === 2} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}

      {/* Ungrouped project fields */}
      {ungroupedProject.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-4 md:grid-cols-2">
              {ungroupedProject.map((field) => (
                <FieldItem key={field.key} field={field} value={values[field.key]} onChange={(val) => onChange(field.key, val)} renderField={renderField} colSpan={field.span === 2} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      {contactFields.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <Card className="mt-1">
            <CardContent className="pt-5">
              <div className="grid gap-4 md:grid-cols-2">
                {contactFields.map((field) => (
                  <FieldItem key={field.key} field={field} value={values[field.key]} onChange={(val) => onChange(field.key, val)} renderField={renderField} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Address */}
      {addressFields.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">Address</h3>
          <Card className="mt-1">
            <CardContent className="pt-5">
              <div className="grid gap-4 md:grid-cols-2">
                {addressFields.map((field) => (
                  <FieldItem key={field.key} field={field} value={values[field.key]} onChange={(val) => onChange(field.key, val)} renderField={renderField} colSpan={field.key === 'address'} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notes */}
      {notesField && (
        <Card>
          <CardContent className="pt-5">
            <FieldItem field={notesField} value={values[notesField.key]} onChange={(val) => onChange(notesField.key, val)} renderField={renderField} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
