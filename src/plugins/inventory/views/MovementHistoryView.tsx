import React, { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, RefreshCw, ArrowRightLeft, Trash2, Search, Eye } from 'lucide-react'
import { useInventoryStore, formatCurrency, useInventoryConfig } from '../InventoryContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { TableSkeleton } from '../../../components/ui/skeleton'
import type { MovementType } from '../types'

const TYPE_ICONS: Record<MovementType, React.ElementType> = {
  entry: ArrowDownRight,
  exit: ArrowUpRight,
  adjustment: RefreshCw,
  transfer: ArrowRightLeft,
  loss: Trash2,
}

const TYPE_COLORS: Record<MovementType, string> = {
  entry: 'text-emerald-500',
  exit: 'text-red-500',
  adjustment: 'text-blue-500',
  transfer: 'text-violet-500',
  loss: 'text-amber-500',
}

export function MovementHistoryView({ onViewDetail }: { onViewDetail?: (id: string) => void } = {}) {
  const { t } = useTranslation()
  const { currency } = useInventoryConfig()
  const movements = useInventoryStore((s) => s.movements)
  const movementsLoading = useInventoryStore((s) => s.movementsLoading)
  const fetchMovements = useInventoryStore((s) => s.fetchMovements)

  const [search, setSearch] = useState('')

  useEffect(() => { fetchMovements({ search: search || undefined }) }, [search])

  return (
    <div className="space-y-4">
      <SubpageHeader title={t('inventory.history.title')} subtitle={t('inventory.history.subtitle')} />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input type="text" placeholder={t('inventory.history.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {movementsLoading ? (
        <TableSkeleton columns={6} />
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <p className="text-sm text-muted-foreground">{t('inventory.history.noMovements')}</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Product</th>
                <th className="text-center font-medium text-muted-foreground px-4 py-2.5">Type</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Location</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Qty</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const Icon = TYPE_ICONS[m.movementType] ?? RefreshCw
                const color = TYPE_COLORS[m.movementType] ?? 'text-muted-foreground'
                return (
                  <tr key={m.id} onClick={() => onViewDetail?.(m.id)} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.movementDate}</td>
                    <td className="px-4 py-3 font-medium">{m.productName ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 ${color}`}>
                        <Icon className="h-3 w-3" />
                        <span className="text-xs capitalize">{m.movementType}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {m.stockLocationName ?? '—'}
                      {m.movementType === 'transfer' && m.destinationLocationName && (
                        <span> → {m.destinationLocationName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{m.movementType === 'entry' ? '+' : '-'}{m.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(m.totalCost, currency)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
