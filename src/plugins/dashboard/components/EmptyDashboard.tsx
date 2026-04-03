import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import { useTranslation } from '../../../hooks/useTranslation'

export function EmptyDashboard() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <LayoutDashboard className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold">{t('dashboard.empty.title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {t('dashboard.empty.subtitle')}
      </p>
    </div>
  )
}
