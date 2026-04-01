import React from 'react'
import { WifiOff } from 'lucide-react'
import { getSupabaseClientOptional } from '../../lib/supabase'
import { useTranslation } from '../../hooks/useTranslation'

export function MockModeBanner() {
  const { t } = useTranslation()

  if (getSupabaseClientOptional()) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-amber-800 dark:text-amber-300">
      <WifiOff className="h-3 w-3 shrink-0" />
      <span>{t('app.mockMode.banner')}</span>
    </div>
  )
}
