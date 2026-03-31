import React, { useEffect } from 'react'
import { useCrmStore, useCrmConfig, formatCurrency } from '../CrmContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'

export function PipelineView({ onDealClick }: { onDealClick?: (id: string) => void }) {
  const { currency } = useCrmConfig()
  const pipelines = useCrmStore((s) => s.pipelines)
  const stages = useCrmStore((s) => s.stages)
  const dealsByStage = useCrmStore((s) => s.dealsByStage)
  const dealsLoading = useCrmStore((s) => s.dealsLoading)
  const fetchPipelines = useCrmStore((s) => s.fetchPipelines)
  const fetchDealsByStage = useCrmStore((s) => s.fetchDealsByStage)

  useEffect(() => { fetchPipelines() }, [])
  useEffect(() => { if (pipelines.length > 0) fetchDealsByStage(pipelines[0].id) }, [pipelines])

  const visibleStages = stages.filter((s) => !s.isLost)

  return (
    <div className="space-y-4">
      <SubpageHeader title="Pipeline" subtitle="Deals by stage" />

      {dealsLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {visibleStages.map((stage) => {
            const deals = dealsByStage.get(stage.id) ?? []
            return (
              <div key={stage.id} className="min-w-[240px] max-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold">{stage.name}</span>
                  <span className="text-[10px] text-muted-foreground">({deals.length})</span>
                </div>
                <div className="space-y-2">
                  {deals.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No deals
                    </div>
                  ) : (
                    deals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => onDealClick?.(deal.id)}
                        className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer"
                      >
                        <p className="text-sm font-medium truncate">{deal.title}</p>
                        {deal.contactName && <p className="text-[10px] text-muted-foreground mt-0.5">{deal.contactName}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-semibold">{formatCurrency(deal.value, currency)}</span>
                          <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
