import React from 'react'
import { Clock, FileText, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ScheduleEditor } from './ScheduleEditor'
import { AccessTab } from './AccessTab'
import { useTranslation } from '../../../hooks/useTranslation'

function ComingSoon({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
        <Badge variant="secondary" className="mt-3 text-[10px]">{t('crud.archetype.comingSoon')}</Badge>
      </CardContent>
    </Card>
  )
}

// AccessTab is imported from ./AccessTab

export function ActivityTab() {
  const { t } = useTranslation()
  return (
    <ComingSoon
      icon={Clock}
      title={t('crud.archetype.activity.title')}
      description={t('crud.archetype.activity.description')}
    />
  )
}

export function DocumentsTab() {
  const { t } = useTranslation()
  return (
    <ComingSoon
      icon={FileText}
      title={t('crud.archetype.documents.title')}
      description={t('crud.archetype.documents.description')}
    />
  )
}

export function ScheduleTab({ item }: { item: any }) {
  const { t } = useTranslation()
  if (!item?.id) {
    return (
      <ComingSoon
        icon={CalendarDays}
        title={t('crud.archetype.schedule.title')}
        description={t('crud.archetype.schedule.description')}
      />
    )
  }
  return <ScheduleEditor assigneeId={item.id} />
}

export const PERSON_DETAIL_TABS = [
  { id: 'access', label: 'Access', icon: 'Shield', component: AccessTab, visibleFor: ['staff'] },
  { id: 'schedule', label: 'Schedule', icon: 'CalendarDays', component: ScheduleTab, visibleFor: ['staff'] },
  { id: 'documents', label: 'Documents', icon: 'FileText', component: DocumentsTab },
  { id: 'activity', label: 'Activity', icon: 'Clock', component: ActivityTab },
]
