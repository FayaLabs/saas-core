import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as LucideIcons from 'lucide-react'
import { GripVertical, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useDashboardConfig, useDashboardStore } from '../DashboardContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { Checkbox } from '../../../components/ui/checkbox'

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return (LucideIcons as any)[name] ?? LucideIcons.BarChart3
}

export function DashboardSettingsTab() {
  const { t } = useTranslation()
  const { metrics: allMetrics } = useDashboardConfig()
  const preferences = useDashboardStore((s) => s.preferences)
  const savePreferences = useDashboardStore((s) => s.savePreferences)
  const fetchPreferences = useDashboardStore((s) => s.fetchPreferences)

  const [visible, setVisible] = useState<Set<string>>(new Set())
  const [order, setOrder] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragRef = useRef<string | null>(null)

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  useEffect(() => {
    if (preferences) {
      setVisible(new Set(preferences.visibleMetrics))
      setOrder(preferences.metricOrder.length > 0 ? preferences.metricOrder : allMetrics.map((m) => m.id))
    } else {
      setVisible(new Set(allMetrics.filter((m) => m.defaultVisible).map((m) => m.id)))
      setOrder([...allMetrics].sort((a, b) => a.defaultOrder - b.defaultOrder).map((m) => m.id))
    }
  }, [preferences, allMetrics])

  const sortedMetrics = React.useMemo(() => {
    const orderMap = new Map(order.map((id, i) => [id, i]))
    return [...allMetrics].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
  }, [allMetrics, order])

  const toggleMetric = useCallback((id: string) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setDirty(true)
  }, [])

  // --- Drag-and-drop handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    dragRef.current = id
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragRef.current && dragRef.current !== id) {
      setDragOverId(id)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = dragRef.current
    if (!sourceId || sourceId === targetId) return

    setOrder((prev) => {
      const sourceIdx = prev.indexOf(sourceId)
      const targetIdx = prev.indexOf(targetId)
      if (sourceIdx === -1 || targetIdx === -1) return prev
      const next = [...prev]
      next.splice(sourceIdx, 1)
      next.splice(targetIdx, 0, sourceId)
      return next
    })
    setDirty(true)
    setDragId(null)
    setDragOverId(null)
    dragRef.current = null
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragId(null)
    setDragOverId(null)
    dragRef.current = null
  }, [])

  const handleSave = useCallback(async () => {
    await savePreferences(Array.from(visible), order)
    setDirty(false)
    toast.success(t('dashboard.settings.saved'))
  }, [visible, order, savePreferences, t])

  const handleReset = useCallback(() => {
    setVisible(new Set(allMetrics.filter((m) => m.defaultVisible).map((m) => m.id)))
    setOrder([...allMetrics].sort((a, b) => a.defaultOrder - b.defaultOrder).map((m) => m.id))
    setDirty(true)
  }, [allMetrics])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">{t('dashboard.settings.metricsVisibility')}</h3>
        <p className="text-xs text-muted-foreground mb-3">{t('dashboard.settings.subtitle')}</p>
      </div>

      <div className="space-y-1.5">
        {sortedMetrics.map((metric) => {
          const Icon = getIcon(metric.icon)
          const isVisible = visible.has(metric.id)
          const isDragging = dragId === metric.id
          const isDragOver = dragOverId === metric.id

          return (
            <div
              key={metric.id}
              draggable
              onDragStart={(e) => handleDragStart(e, metric.id)}
              onDragOver={(e) => handleDragOver(e, metric.id)}
              onDrop={(e) => handleDrop(e, metric.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                isDragging ? 'opacity-40 border-dashed' : ''
              } ${isDragOver ? 'border-primary bg-primary/5' : ''} ${
                !isVisible ? 'opacity-60' : ''
              }`}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isVisible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{metric.label}</p>
                {metric.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{metric.description}</p>
                )}
              </div>
              <Checkbox
                checked={isVisible}
                onChange={() => toggleMetric(metric.id)}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {t('common.save') || 'Save'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('dashboard.settings.resetDefaults')}
        </button>
      </div>
    </div>
  )
}
