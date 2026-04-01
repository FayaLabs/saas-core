import React, { useEffect } from 'react'
import { Package, AlertTriangle, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react'
import { useInventoryConfig, useInventoryStore, formatCurrency } from '../InventoryContext'
import { useTranslation } from '../../../hooks/useTranslation'

function StatCard({ label, value, subtitle, icon: Icon, color }: {
  label: string; value: string; subtitle: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  )
}

export function DashboardView() {
  const { t } = useTranslation()
  const { currency } = useInventoryConfig()
  const summary = useInventoryStore((s) => s.summary)
  const fetchSummary = useInventoryStore((s) => s.fetchSummary)

  useEffect(() => { fetchSummary() }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('inventory.dashboard.totalProducts')}
          value={String(summary?.totalProducts ?? 0)}
          subtitle={t('inventory.dashboard.activeItems')}
          icon={Package}
          color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <StatCard
          label={t('inventory.dashboard.lowStock')}
          value={String(summary?.lowStockCount ?? 0)}
          subtitle={t('inventory.dashboard.belowMinimum')}
          icon={AlertTriangle}
          color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
        <StatCard
          label={t('inventory.dashboard.outOfStock')}
          value={String(summary?.outOfStockCount ?? 0)}
          subtitle={t('inventory.dashboard.needRestocking')}
          icon={TrendingDown}
          color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
        />
        <StatCard
          label={t('inventory.dashboard.stockValue')}
          value={formatCurrency(summary?.totalStockValue ?? 0, currency)}
          subtitle={t('inventory.dashboard.totalValue')}
          icon={BarChart3}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">{t('inventory.dashboard.recentActivity')}</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">{t('inventory.dashboard.entries')}</span>
              <span className="font-medium">{summary?.movementsByType?.entry ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              <span className="text-muted-foreground">{t('inventory.dashboard.exits')}</span>
              <span className="font-medium">{summary?.movementsByType?.exit ?? 0}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t('inventory.dashboard.last7Days')}</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">{t('inventory.dashboard.quickActions')}</h3>
          <p className="text-xs text-muted-foreground">{t('inventory.dashboard.quickActionsDesc')}</p>
        </div>
      </div>
    </div>
  )
}
