import type { EntityLookup, EntityLookupResult, ArchetypeType } from '../types/entity-lookup'
import { getSupabaseClientOptional } from './supabase'

/** Display config per archetype type */
const ARCHETYPE_DISPLAY: Record<ArchetypeType, {
  table: string
  labelField: string
  subtitleFields: string[]
  priceField?: string
  groupField?: string
}> = {
  person: { table: 'persons', labelField: 'name', subtitleFields: ['email', 'phone'], groupField: 'kind' },
  product: { table: 'products', labelField: 'name', subtitleFields: ['sku', 'description'], priceField: 'price' },
  service: { table: 'services', labelField: 'name', subtitleFields: ['duration_minutes', 'description'], priceField: 'price' },
}

interface ArchetypeLookupConfig {
  archetype: ArchetypeType
  kind?: string | string[]
  kindLabels?: Record<string, string>
  limit?: number
}

function toResult(
  row: Record<string, unknown>,
  display: typeof ARCHETYPE_DISPLAY[ArchetypeType],
  kindLabels?: Record<string, string>,
): EntityLookupResult {
  const label = String(row[display.labelField] ?? row.name ?? '')
  const subtitleParts = display.subtitleFields
    .map((f) => row[f])
    .filter(Boolean)
    .map((v) => {
      // Format duration_minutes nicely
      if (typeof v === 'number') return `${v}min`
      return String(v)
    })

  let group: string | undefined
  if (display.groupField && row[display.groupField]) {
    const rawGroup = String(row[display.groupField])
    group = kindLabels?.[rawGroup] ?? rawGroup
  }

  return {
    id: String(row.id),
    label,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
    group,
    price: display.priceField ? Number(row[display.priceField]) || undefined : undefined,
    data: row,
  }
}

/**
 * Create an EntityLookup that queries a saas_core archetype table.
 * Queries Supabase directly. Returns empty results if Supabase is not configured.
 *
 * @example
 * createArchetypeLookup({ archetype: 'person', kind: ['client', 'supplier'] })
 * createArchetypeLookup({ archetype: 'product' })
 * createArchetypeLookup({ archetype: 'service' })
 */
export function createArchetypeLookup(config: ArchetypeLookupConfig): EntityLookup {
  const display = ARCHETYPE_DISPLAY[config.archetype]
  const limit = config.limit ?? 20
  const kinds = config.kind ? (Array.isArray(config.kind) ? config.kind : [config.kind]) : undefined

  return {
    async search(query: string) {
      const supabase = getSupabaseClientOptional()
      if (!supabase) return []

      let qb = supabase
        .schema('saas_core')
        .from(display.table)
        .select('*')
        .ilike(display.labelField, `%${query}%`)
        .eq('is_active', true)
        .limit(limit)

      if (kinds && kinds.length === 1) qb = qb.eq('kind', kinds[0])
      if (kinds && kinds.length > 1) qb = qb.in('kind', kinds)

      const { data } = await qb
      return (data ?? []).map((row: Record<string, unknown>) => toResult(row, display, config.kindLabels))
    },

    async getById(id: string) {
      const supabase = getSupabaseClientOptional()
      if (!supabase) return null

      const { data } = await supabase
        .schema('saas_core')
        .from(display.table)
        .select('*')
        .eq('id', id)
        .single()

      return data ? toResult(data as Record<string, unknown>, display, config.kindLabels) : null
    },
  }
}
