import React from 'react'
import * as LucideIcons from 'lucide-react'
import { useDashboardConfig, formatMetricValue } from '../DashboardContext'
import type { ResolvedMetric } from '../types'

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return (LucideIcons as any)[name] ?? LucideIcons.BarChart3
}

function TrendIndicator({ trend, percent }: { trend?: 'up' | 'down' | 'neutral'; percent?: number }) {
  if (!trend || trend === 'neutral') return null
  const Arrow = trend === 'up' ? LucideIcons.TrendingUp : LucideIcons.TrendingDown
  const color = trend === 'up' ? 'text-green-600' : 'text-red-600'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Arrow className="h-3 w-3" />
      {percent != null && <span>{Math.abs(percent).toFixed(0)}%</span>}
    </span>
  )
}

export function KpiCard({ metric }: { metric: ResolvedMetric }) {
  const { currency } = useDashboardConfig()
  const Icon = getIcon(metric.icon)

  const trendPercent = metric.currentValue?.previousValue && metric.currentValue.value
    ? ((metric.currentValue.value - metric.currentValue.previousValue) / metric.currentValue.previousValue) * 100
    : undefined

  return (
    <div className="rounded-card border bg-card p-4 shadow-sm flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground truncate">{metric.label}</p>
        {metric.loading ? (
          <div className="mt-1 h-6 w-16 animate-pulse rounded bg-muted" />
        ) : metric.error ? (
          <p className="mt-1 text-sm text-destructive">{metric.error}</p>
        ) : metric.currentValue ? (
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight">
              {formatMetricValue(metric.currentValue.value, metric.format, currency)}
            </span>
            <TrendIndicator trend={metric.currentValue.trend} percent={trendPercent} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
