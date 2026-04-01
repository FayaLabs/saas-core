import React, { useEffect, useState } from 'react'
import { Search, Plus, UserPlus } from 'lucide-react'
import { useCrmStore } from '../CrmContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { TableSkeleton } from '../../../components/ui/skeleton'
import type { LeadStatus } from '../types'

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  { value: 'contacted', label: 'Contacted', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
  { value: 'qualified', label: 'Qualified', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  { value: 'unqualified', label: 'Unqualified', color: 'bg-muted text-muted-foreground' },
  { value: 'converted', label: 'Converted', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
]

export function LeadListView({ onNew, onEdit }: { onNew?: () => void; onEdit?: (id: string) => void }) {
  const { t } = useTranslation()
  const leads = useCrmStore((s) => s.leads)
  const leadsLoading = useCrmStore((s) => s.leadsLoading)
  const fetchLeads = useCrmStore((s) => s.fetchLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])

  useEffect(() => {
    fetchLeads({ status: statusFilter.length > 0 ? statusFilter : undefined, search: search || undefined })
  }, [statusFilter, search])

  return (
    <div className="space-y-4">
      <SubpageHeader title={t('crm.leads.title')} subtitle={`${leads.length} leads`} />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder={t('crm.leads.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        {onNew && (
          <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> {t('crm.leads.newLead')}
          </button>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const active = statusFilter.includes(opt.value)
          return (
            <button key={opt.value} onClick={() => setStatusFilter(active ? statusFilter.filter((s) => s !== opt.value) : [...statusFilter, opt.value])} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${active ? opt.color : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {opt.label}
            </button>
          )
        })}
      </div>
      {leadsLoading ? (
        <TableSkeleton columns={4} />
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <UserPlus className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{t('crm.leads.noLeads')}</p>
          {onNew && <button onClick={onNew} className="text-xs text-primary hover:underline mt-1">{t('crm.leads.captureFirst')}</button>}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Contact</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Source</th>
              <th className="text-center font-medium text-muted-foreground px-4 py-2.5">Status</th>
            </tr></thead>
            <tbody>
              {leads.map((lead) => {
                const statusOpt = STATUS_OPTIONS.find((o) => o.value === lead.status)
                return (
                  <tr key={lead.id} onClick={() => onEdit?.(lead.id)} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{lead.email || lead.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{lead.sourceName || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusOpt?.color ?? 'bg-muted text-muted-foreground'}`}>{statusOpt?.label ?? lead.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
