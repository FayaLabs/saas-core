import React from 'react'
import { SubpageHeader } from '../../../components/layout/ModulePage'

export function ContactsView({ segment }: { segment: 'active' | 'inactive' | 'vip' }) {
  const titles: Record<string, { title: string; subtitle: string }> = {
    active: { title: 'Active Contacts', subtitle: 'Contacts with recent interactions' },
    inactive: { title: 'Inactive Contacts', subtitle: 'Contacts without recent activity' },
    vip: { title: 'VIP Contacts', subtitle: 'High-value contacts' },
  }
  const t = titles[segment] ?? titles.active

  return (
    <div className="space-y-4">
      <SubpageHeader title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
        <p className="text-sm text-muted-foreground">Contact segmentation coming soon</p>
        <p className="text-xs text-muted-foreground mt-1">Contacts will be automatically segmented based on activity and value</p>
      </div>
    </div>
  )
}
