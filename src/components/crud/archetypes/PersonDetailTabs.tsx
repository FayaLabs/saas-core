import React from 'react'
import { Shield, Clock, FileText, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ScheduleEditor } from './ScheduleEditor'

function ComingSoon({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
        <Badge variant="secondary" className="mt-3 text-[10px]">Coming Soon</Badge>
      </CardContent>
    </Card>
  )
}

export function AccessTab() {
  return (
    <ComingSoon
      icon={Shield}
      title="Access & Permissions"
      description="Manage login credentials, assign permission roles, and control what this person can access in the system."
    />
  )
}

export function ActivityTab() {
  return (
    <ComingSoon
      icon={Clock}
      title="Activity Timeline"
      description="View a chronological log of all actions, changes, and events related to this person."
    />
  )
}

export function DocumentsTab() {
  return (
    <ComingSoon
      icon={FileText}
      title="Documents"
      description="Attach and manage files, contracts, certifications, and other documents for this person."
    />
  )
}

export function ScheduleTab({ item }: { item: any }) {
  if (!item?.id) {
    return (
      <ComingSoon
        icon={CalendarDays}
        title="Schedule"
        description="View and manage appointments, shifts, and availability for this person."
      />
    )
  }
  return <ScheduleEditor assigneeId={item.id} />
}

export const PERSON_DETAIL_TABS = [
  { id: 'access', label: 'Access', component: AccessTab, visibleFor: ['staff'] },
  { id: 'schedule', label: 'Schedule', component: ScheduleTab, visibleFor: ['staff'] },
  { id: 'documents', label: 'Documents', component: DocumentsTab },
  { id: 'activity', label: 'Activity', component: ActivityTab },
]
