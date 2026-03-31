import React, { useEffect } from 'react'
import { Users, TrendingUp, Target, Clock, AlertTriangle, ArrowRight, Trophy, BarChart3 } from 'lucide-react'
import { useCrmConfig, useCrmStore, formatCurrency } from '../CrmContext'

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Visual funnel — actual trapezoid shape
// ---------------------------------------------------------------------------

function SalesFunnel() {
  const { currency } = useCrmConfig()
  const funnel = useCrmStore((s) => s.funnel)

  if (funnel.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Sales Funnel</h3>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-20 mb-3" style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}>
            <div className="w-full h-full bg-muted/30 rounded" />
          </div>
          <p className="text-xs text-muted-foreground">No pipeline data yet</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Create your first deal to see the funnel</p>
        </div>
      </div>
    )
  }

  const total = funnel.length
  const maxValue = Math.max(...funnel.map((s) => s.dealCount), 1)

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Sales Funnel</h3>
        <span className="text-[10px] text-muted-foreground">{funnel.reduce((s, f) => s + f.dealCount, 0)} total deals</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        {funnel.map((stage, i) => {
          // Funnel width: first stage = 100%, last = 30%, linear interpolation
          const widthPercent = 100 - ((i / Math.max(total - 1, 1)) * 70)
          const barWidth = Math.max((stage.dealCount / maxValue) * 100, 8)

          return (
            <div key={stage.stageId} className="w-full" style={{ maxWidth: `${widthPercent}%` }}>
              <div
                className="relative rounded-md overflow-hidden transition-all"
                style={{ backgroundColor: stage.stageColor + '18' }}
              >
                {/* Filled portion */}
                <div
                  className="h-10 rounded-md flex items-center justify-between px-3 transition-all"
                  style={{
                    backgroundColor: stage.stageColor + '30',
                    width: '100%',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.stageColor }} />
                    <span className="text-xs font-medium truncate">{stage.stageName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold">{stage.dealCount}</span>
                    {stage.totalValue > 0 && (
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{formatCurrency(stage.totalValue, currency)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Connector arrow */}
              {i < total - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="h-1.5 w-px bg-muted" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Conversion summary */}
      {funnel.length >= 2 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
          <span className="text-[10px] text-muted-foreground">{funnel[0].stageName}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{funnel[funnel.length - 1].stageName}</span>
          <span className="text-[10px] font-semibold ml-1">
            {funnel[funnel.length - 1].dealCount > 0 && funnel[0].dealCount > 0
              ? `${((funnel[funnel.length - 1].dealCount / funnel[0].dealCount) * 100).toFixed(1)}%`
              : '—'}
          </span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Performance metrics card
// ---------------------------------------------------------------------------

function PerformanceMetrics() {
  const { currency } = useCrmConfig()
  const summary = useCrmStore((s) => s.summary)

  const metrics = [
    { label: 'Deals won this month', value: String(summary?.wonDealsThisMonth ?? 0), highlight: true },
    { label: 'Revenue won', value: formatCurrency(summary?.wonDealsValueThisMonth ?? 0, currency), color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Avg deal value', value: formatCurrency(summary?.averageDealValue ?? 0, currency) },
    { label: 'Conversion rate', value: `${(summary?.conversionRate ?? 0).toFixed(1)}%` },
  ]

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Performance</h3>
      </div>
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <span className={`text-sm font-semibold ${m.color ?? ''}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pipeline value by stage — horizontal stacked bar
// ---------------------------------------------------------------------------

function PipelineValueBar() {
  const { currency } = useCrmConfig()
  const funnel = useCrmStore((s) => s.funnel)
  const totalValue = funnel.reduce((s, f) => s + f.totalValue, 0)

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Pipeline Value</h3>
        </div>
        <span className="text-sm font-bold">{formatCurrency(totalValue, currency)}</span>
      </div>

      {totalValue > 0 ? (
        <>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {funnel.filter((s) => s.totalValue > 0).map((stage) => (
              <div
                key={stage.stageId}
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(stage.totalValue / totalValue) * 100}%`,
                  backgroundColor: stage.stageColor,
                  minWidth: '4px',
                }}
                title={`${stage.stageName}: ${formatCurrency(stage.totalValue, currency)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {funnel.filter((s) => s.totalValue > 0).map((stage) => (
              <div key={stage.stageId} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.stageColor }} />
                <span className="text-[10px] text-muted-foreground">{stage.stageName}</span>
                <span className="text-[10px] font-medium">{formatCurrency(stage.totalValue, currency)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-4 rounded-full bg-muted/30" />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recent leads
// ---------------------------------------------------------------------------

function RecentLeads() {
  const leads = useCrmStore((s) => s.leads)
  const fetchLeads = useCrmStore((s) => s.fetchLeads)

  useEffect(() => { fetchLeads({ pageSize: 5 }) }, [])

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Recent Leads</h3>
        <span className="text-[10px] text-muted-foreground">{leads.length} leads</span>
      </div>
      {leads.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No leads yet. Capture your first lead to get started.</p>
      ) : (
        <div className="space-y-1">
          {leads.slice(0, 5).map((lead) => (
            <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{lead.name}</p>
                <p className="text-[10px] text-muted-foreground">{lead.sourceName || lead.email || lead.phone || 'No contact info'}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium capitalize ${
                lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                lead.status === 'qualified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                lead.status === 'converted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {lead.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function DashboardView() {
  const { currency } = useCrmConfig()
  const summary = useCrmStore((s) => s.summary)
  const pipelines = useCrmStore((s) => s.pipelines)
  const fetchSummary = useCrmStore((s) => s.fetchSummary)
  const fetchPipelines = useCrmStore((s) => s.fetchPipelines)
  const fetchFunnel = useCrmStore((s) => s.fetchFunnel)

  useEffect(() => {
    fetchPipelines()
    fetchSummary()
  }, [])

  useEffect(() => {
    if (pipelines.length > 0) fetchFunnel(pipelines[0].id)
  }, [pipelines])

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={String(summary?.totalLeads ?? 0)}
          subtitle={`${summary?.newLeadsThisMonth ?? 0} new this month`}
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <StatCard
          label="Open Pipeline"
          value={formatCurrency(summary?.openDealsValue ?? 0, currency)}
          subtitle={`${summary?.totalDeals ?? 0} active deals`}
          icon={Target}
          color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        />
        <StatCard
          label="Conversion Rate"
          value={`${(summary?.conversionRate ?? 0).toFixed(1)}%`}
          subtitle="Lead to deal"
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        <StatCard
          label="Pending Tasks"
          value={String(summary?.pendingActivities ?? 0)}
          subtitle={`${summary?.overdueActivities ?? 0} overdue`}
          icon={summary?.overdueActivities ? AlertTriangle : Clock}
          color={summary?.overdueActivities
            ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}
        />
      </div>

      {/* Funnel + Performance */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SalesFunnel />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <PerformanceMetrics />
        </div>
      </div>

      {/* Pipeline value + Recent leads */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineValueBar />
        <RecentLeads />
      </div>
    </div>
  )
}
