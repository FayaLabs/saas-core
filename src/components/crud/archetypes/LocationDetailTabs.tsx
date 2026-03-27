import React from 'react'
import { Users, CalendarDays, BarChart3, Clock } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'

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

export function MembersTab() {
  return (
    <ComingSoon
      icon={Users}
      title="Team Members"
      description="View and manage staff assigned to this location, their roles and schedules."
    />
  )
}

export function LocationScheduleTab() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Operating Hours"
      description="Set business hours, holidays, and special schedules for this location."
    />
  )
}

export function LocationStatsTab() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Statistics"
      description="View performance metrics, revenue, and activity for this location."
    />
  )
}

export function LocationActivityTab() {
  return (
    <ComingSoon
      icon={Clock}
      title="Activity"
      description="View a log of all events, changes, and operations at this location."
    />
  )
}

export const LOCATION_DETAIL_TABS = [
  { id: 'members', label: 'Team', component: MembersTab },
  { id: 'schedule', label: 'Hours', component: LocationScheduleTab },
  { id: 'stats', label: 'Statistics', component: LocationStatsTab },
  { id: 'activity', label: 'Activity', component: LocationActivityTab },
]
