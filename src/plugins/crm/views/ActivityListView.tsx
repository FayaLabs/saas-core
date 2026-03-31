import React, { useEffect } from 'react'
import { Phone, Mail, Users, FileText, CheckSquare, MessageCircle, Check } from 'lucide-react'
import { useCrmStore } from '../CrmContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import type { ActivityType } from '../types'

const TYPE_ICONS: Record<string, React.ElementType> = {
  call: Phone, email: Mail, meeting: Users, note: FileText, task: CheckSquare, whatsapp: MessageCircle,
}

export function ActivityListView() {
  const activities = useCrmStore((s) => s.activities)
  const activitiesLoading = useCrmStore((s) => s.activitiesLoading)
  const fetchActivities = useCrmStore((s) => s.fetchActivities)

  useEffect(() => { fetchActivities({}) }, [])

  return (
    <div className="space-y-4">
      <SubpageHeader title="Activities" subtitle="Interactions and tasks" />
      {activitiesLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <p className="text-sm text-muted-foreground">No activities recorded</p>
          <p className="text-xs text-muted-foreground mt-1">Activities are logged from deals and lead interactions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => {
            const Icon = TYPE_ICONS[a.activityType] ?? FileText
            return (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.completedAt && <Check className="h-3 w-3 text-emerald-500" />}
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize">{a.activityType} &middot; {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
