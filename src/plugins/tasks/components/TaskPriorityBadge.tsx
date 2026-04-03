import React from 'react'
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { TaskPriority } from '../types'

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  low: { color: 'text-muted-foreground', bg: 'bg-muted', icon: ArrowDown },
  medium: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: Minus },
  high: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: ArrowUp },
  urgent: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', icon: AlertTriangle },
}

export function TaskPriorityBadge({ priority, showLabel }: { priority: TaskPriority; showLabel?: boolean }) {
  const cfg = PRIORITY_CONFIG[priority]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className="h-3 w-3" />
      {showLabel && <span className="capitalize">{priority}</span>}
    </span>
  )
}
