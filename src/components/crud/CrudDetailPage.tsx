import React from 'react'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { WidgetSlot } from '../plugins/WidgetSlot'
import type { EntityDef, FieldDef, FieldGroup } from '../../types/crud'

interface CrudDetailPageProps {
  entityDef: EntityDef
  item: Record<string, any>
  namePlural: string
  basePath: string
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  feature?: string
}

function formatValue(field: FieldDef, value: any): React.ReactNode {
  if (value == null || value === '') return <span className="text-muted-foreground/50">—</span>

  if (field.renderCell) return field.renderCell(value, {})

  switch (field.type) {
    case 'boolean':
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    case 'currency': {
      const num = typeof value === 'number' ? value : parseFloat(value)
      return isNaN(num) ? value : new Intl.NumberFormat('en-US', { style: 'currency', currency: field.currency ?? 'USD' }).format(num)
    }
    case 'date':
      try { return new Date(value).toLocaleDateString() } catch { return value }
    case 'datetime':
      try { return new Date(value).toLocaleString() } catch { return value }
    case 'select': {
      const options = (field.options ?? []).map((o) => typeof o === 'string' ? { label: o, value: o } : o)
      const match = options.find((o) => o.value === value)
      return <Badge variant="secondary">{match?.label ?? value}</Badge>
    }
    case 'image':
      return value ? (
        <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover" />
      ) : null
    case 'email':
      return <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>
    case 'phone':
      return <a href={`tel:${value}`} className="text-primary hover:underline">{value}</a>
    case 'url':
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{value}</a>
    case 'textarea':
      return <p className="whitespace-pre-wrap">{value}</p>
    default:
      return String(value)
  }
}

function FieldRow({ field, value }: { field: FieldDef; value: any }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
      <dd className="col-span-2 text-sm text-foreground">{formatValue(field, value)}</dd>
    </div>
  )
}

function FieldGroupSection({
  group,
  fields,
  item,
}: {
  group: FieldGroup
  fields: FieldDef[]
  item: Record<string, any>
}) {
  const cols = group.columns ?? 2

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{group.label}</h3>
      {group.description && (
        <p className="text-xs text-muted-foreground mb-3">{group.description}</p>
      )}
      <Card>
        <CardContent className="p-0">
          <dl className={`grid divide-y ${cols >= 2 ? 'md:grid-cols-2 md:divide-y-0' : ''}`}>
            {fields.map((field) => (
              <div key={field.key} className={`px-5 ${cols >= 2 ? 'md:border-b md:last:border-b-0' : ''}`}>
                <FieldRow field={field} value={item[field.key]} />
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function OverviewTab({
  entityDef,
  item,
}: {
  entityDef: EntityDef
  item: Record<string, any>
}) {
  const detailFields = entityDef.fields.filter(
    (f) => f.showInDetail !== false && f.key !== 'id' && f.key !== entityDef.displayField && f.key !== entityDef.imageField
  )

  // Group fields
  const groups = entityDef.fieldGroups ?? []
  const groupedFieldIds = new Set(
    detailFields.filter((f) => f.group).map((f) => f.key)
  )
  const ungroupedFields = detailFields.filter((f) => !f.group)

  // Build group → fields map
  const groupFieldMap = new Map<string, FieldDef[]>()
  for (const field of detailFields) {
    if (field.group) {
      const existing = groupFieldMap.get(field.group) ?? []
      existing.push(field)
      groupFieldMap.set(field.group, existing)
    }
  }

  return (
    <div className="space-y-6">
      {/* Ungrouped fields */}
      {ungroupedFields.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <dl className="divide-y">
              {ungroupedFields.map((field) => (
                <div key={field.key} className="px-5">
                  <FieldRow field={field} value={item[field.key]} />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Grouped fields */}
      {groups.map((group) => {
        const fields = groupFieldMap.get(group.id)
        if (!fields || fields.length === 0) return null
        return (
          <FieldGroupSection key={group.id} group={group} fields={fields} item={item} />
        )
      })}

      {/* Catch any grouped fields without a matching FieldGroup definition */}
      {Array.from(groupFieldMap.entries()).map(([groupId, fields]) => {
        if (groups.some((g) => g.id === groupId)) return null
        return (
          <FieldGroupSection
            key={groupId}
            group={{ id: groupId, label: groupId.charAt(0).toUpperCase() + groupId.slice(1) }}
            fields={fields}
            item={item}
          />
        )
      })}
    </div>
  )
}

export function CrudDetailPage({
  entityDef,
  item,
  namePlural,
  basePath,
  onBack,
  onEdit,
  onDelete,
  feature,
}: CrudDetailPageProps) {
  const displayField = entityDef.displayField ?? entityDef.fields[0]?.key ?? 'id'
  const displayValue = item[displayField] ?? 'Untitled'
  const subtitleValue = entityDef.subtitleField ? item[entityDef.subtitleField] : null
  const imageValue = entityDef.imageField ? item[entityDef.imageField] : null
  const initial = typeof displayValue === 'string' ? displayValue.charAt(0).toUpperCase() : '?'

  const customTabs = entityDef.detailTabs ?? []
  const entityId = entityDef.name.toLowerCase().replace(/\s+/g, '-')
  const widgetZone = `${entityId}.detail.tabs`

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          {namePlural}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{displayValue}</span>
      </nav>

      {/* Hero */}
      <div className="flex items-start gap-5">
        {/* Avatar / Image */}
        {imageValue ? (
          <img
            src={imageValue}
            alt={displayValue}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl font-bold shadow-sm">
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{displayValue}</h1>
          {subtitleValue && (
            <p className="text-muted-foreground mt-0.5">{subtitleValue}</p>
          )}
          {/* Quick meta */}
          <div className="flex items-center gap-2 mt-2">
            {item.status && (
              <Badge variant="secondary">
                {typeof item.status === 'string' ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : item.status}
              </Badge>
            )}
            {item.is_active !== undefined && (
              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {customTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab entityDef={entityDef} item={item} />
        </TabsContent>

        {customTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {tab.component ? (
              React.createElement(tab.component, { item, entityDef })
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No content yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Widget zone for plugin tab injection */}
      <WidgetSlot zone={widgetZone} />
    </div>
  )
}
