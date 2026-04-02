import { exportCSV } from '../../lib/csv'
import type { CSVColumn } from '../../lib/csv'
import type { EntityDef } from '../../types/crud'

export function exportToCSV<T extends Record<string, any>>(
  items: T[],
  entityDef: EntityDef,
): void {
  const columns: CSVColumn[] = entityDef.fields
    .filter((f) => f.showInTable !== false)
    .map((f) => ({ key: f.key, label: f.label }))

  const namePlural = entityDef.namePlural ?? entityDef.name + 's'
  const filename = `${namePlural.toLowerCase().replace(/\s+/g, '-')}-export`

  exportCSV(columns, items, filename)
}
