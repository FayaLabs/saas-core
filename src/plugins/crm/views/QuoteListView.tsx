import React, { useEffect } from 'react'
import { FileText, Plus, Pencil } from 'lucide-react'
import { useCrmStore, useCrmConfig, formatCurrency } from '../CrmContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { TableSkeleton } from '../../../components/ui/skeleton'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
}

export function QuoteListView({ onNew, onEdit, onEditQuote }: { onNew?: () => void; onEdit?: (id: string) => void; onEditQuote?: (id: string) => void }) {
  const { t } = useTranslation()
  const { currency } = useCrmConfig()
  const quotes = useCrmStore((s) => s.quotes)
  const quotesLoading = useCrmStore((s) => s.quotesLoading)
  const fetchQuotes = useCrmStore((s) => s.fetchQuotes)

  useEffect(() => { fetchQuotes({}) }, [])

  return (
    <div className="space-y-4">
      <SubpageHeader
        title={t('crm.quotes.title')}
        subtitle={t('crm.quotes.quotesCount', { count: String(quotes.length) })}
        actions={onNew && (
          <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> {t('crm.quotes.newQuote')}
          </button>
        )}
      />
      {quotesLoading ? (
        <TableSkeleton columns={5} />
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{t('crm.quotes.noQuotes')}</p>
          {onNew && <button onClick={onNew} className="text-xs text-primary hover:underline mt-1">{t('crm.quotes.createFirst')}</button>}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left font-medium text-muted-foreground px-4 py-2.5">#</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Contact</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
              <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Amount</th>
              <th className="text-center font-medium text-muted-foreground px-4 py-2.5">Status</th>
              <th className="text-right font-medium text-muted-foreground px-4 py-2.5 w-16">Actions</th>
            </tr></thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} onClick={() => onEdit?.(q.id)} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.quoteNumber}</td>
                  <td className="px-4 py-3 font-medium">{q.contactName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.quoteDate}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(q.totalAmount, currency)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[q.status] ?? 'bg-muted text-muted-foreground'}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditQuote?.(q.id) }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Edit quote"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
