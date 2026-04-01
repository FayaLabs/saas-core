import type { ReportColumnDef } from '../types'
import { formatValuePlain } from '../lib/columns'

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportToCsv(
  columns: ReportColumnDef[],
  data: Record<string, any>[],
  filename: string,
  currency?: string,
): void {
  const visibleCols = columns.filter((c) => c.visible !== false)

  const header = visibleCols.map((c) => escapeCsvField(c.label)).join(',')

  const rows = data.map((row) =>
    visibleCols
      .map((col) => escapeCsvField(formatValuePlain(row[col.key], col, currency)))
      .join(','),
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()

  URL.revokeObjectURL(url)
}
