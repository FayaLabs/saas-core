import React from 'react'
import { CalendarDays, Tag, Clock } from 'lucide-react'
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

export function AvailabilityTab() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Availability"
      description="Configure when this service can be booked, set duration rules, and manage capacity limits."
    />
  )
}

export function ServicePricingTab() {
  return (
    <ComingSoon
      icon={Tag}
      title="Pricing Tiers"
      description="Manage pricing tiers, member discounts, and location-specific pricing for this service."
    />
  )
}

export function ServiceActivityTab() {
  return (
    <ComingSoon
      icon={Clock}
      title="Activity"
      description="View a log of all bookings, changes, and events related to this service."
    />
  )
}

export const SERVICE_DETAIL_TABS = [
  { id: 'availability', label: 'Availability', component: AvailabilityTab },
  { id: 'pricing', label: 'Pricing', component: ServicePricingTab },
  { id: 'activity', label: 'Activity', component: ServiceActivityTab },
]
