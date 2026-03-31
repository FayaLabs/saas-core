import React from 'react'
import { useFinancialConfig } from '../FinancialContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'

export function CommissionsView() {
  const { labels } = useFinancialConfig()

  return (
    <div className="space-y-4">
      <SubpageHeader title={labels.commissions} subtitle="Team commissions" />
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted p-12">
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  )
}
