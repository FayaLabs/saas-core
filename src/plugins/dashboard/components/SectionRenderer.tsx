import React from 'react'
import type { DashboardSection } from '../types'

export function SectionRenderer({ sections, tenantId, onNavigate }: {
  sections: DashboardSection[]
  tenantId?: string
  onNavigate?: (path: string) => void
}) {
  if (sections.length === 0) return null

  return (
    <>
      {sections.map((section) => {
        const Component = section.component
        return (
          <div key={section.id}>
            <Component tenantId={tenantId} onNavigate={onNavigate} />
          </div>
        )
      })}
    </>
  )
}
