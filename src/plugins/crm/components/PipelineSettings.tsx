import React, { useEffect } from 'react'
import { useCrmStore } from '../CrmContext'
import { SettingsGroup } from '../../../components/plugins/SettingsGroup'

export function PipelineSettings() {
  const stages = useCrmStore((s) => s.stages)
  const pipelines = useCrmStore((s) => s.pipelines)
  const fetchPipelines = useCrmStore((s) => s.fetchPipelines)

  useEffect(() => { fetchPipelines() }, [])

  return (
    <div className="space-y-4">
      <SettingsGroup title="Pipeline Stages" description="Define stages that deals move through. Drag to reorder.">
        {stages.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading stages...</div>
        ) : (
          <div className="space-y-0">
            {stages.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-3 py-3">
                <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{stage.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Probability: {stage.probability}%
                    {stage.isWon && ' — Win stage'}
                    {stage.isLost && ' — Loss stage'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{stage.probability}%</span>
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      <p className="text-[10px] text-muted-foreground px-1">
        Pipeline stage customization (add, remove, reorder, edit colors and probabilities) will be available when connected to the database.
      </p>
    </div>
  )
}
