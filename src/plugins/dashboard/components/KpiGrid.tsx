import React, { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useDashboardStore } from '../DashboardContext'
import { KpiCard } from './KpiCard'
import { useTranslation } from '../../../hooks/useTranslation'

export function KpiGrid() {
  const { t } = useTranslation()
  const metrics = useDashboardStore((s) => s.metrics)
  const metricsLoading = useDashboardStore((s) => s.metricsLoading)
  const fetchMetrics = useDashboardStore((s) => s.fetchMetrics)

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  if (metrics.length === 0 && !metricsLoading) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('dashboard.kpi.title')}
        </h2>
        <button
          type="button"
          onClick={() => fetchMetrics()}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={t('dashboard.kpi.refresh')}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  )
}
