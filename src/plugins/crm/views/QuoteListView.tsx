import React, { useEffect } from 'react'
import { FileText, Pencil } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../../../components/ui/data-table'
import { useCrmStore, useCrmConfig, formatCurrency } from '../CrmContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import type { Quote } from '../types'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  invoiced: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
}

function useQuoteColumns(currency: { code: string; locale: string; symbol: string }, onEditQuote?: (id: string) => void): ColumnDef<Quote, any>[] {
  const { t } = useTranslation()
  const cols: ColumnDef<Quote, any>[] = [
    { accessorKey: 'quoteNumber', header: '#', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue() as string}</span> },
    { accessorKey: 'contactName', header: t('crm.quotes.contact'), cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) || '—'}</span> },
    { accessorKey: 'quoteDate', header: t('crm.quotes.date'), cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue() as string}</span> },
    {
      accessorKey: 'totalAmount', header: t('crm.quotes.amount'),
      cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue() as number, currency)}</span>,
    },
    {
      accessorKey: 'status', header: t('crm.quotes.status'),
      cell: ({ getValue }) => {
        const status = getValue() as string
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'}`}>{status}</span>
      },
    },
  ]

  if (onEditQuote) {
    cols.push({
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <button
            onClick={(e) => { e.stopPropagation(); onEditQuote(row.original.id) }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Edit quote"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    })
  }

  return cols
}

export function QuoteListView({ onNew, onEdit, onEditQuote }: { onNew?: () => void; onEdit?: (id: string) => void; onEditQuote?: (id: string) => void }) {
  const { t } = useTranslation()
  const { currency } = useCrmConfig()
  const quotes = useCrmStore((s) => s.quotes)
  const quotesLoading = useCrmStore((s) => s.quotesLoading)
  const fetchQuotes = useCrmStore((s) => s.fetchQuotes)

  useEffect(() => { fetchQuotes({}) }, [])

  const columns = useQuoteColumns(currency, onEditQuote)

  return (
    <div className="space-y-4">
      <SubpageHeader
        title={t('crm.quotes.title')}
        subtitle={t('crm.quotes.quotesCount', { count: String(quotes.length) })}
        actions={onNew && (
          <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <span className="h-3.5 w-3.5 inline-flex items-center justify-center">+</span> {t('crm.quotes.newQuote')}
          </button>
        )}
      />
      {quotesLoading ? (
        <DataTable columns={columns} data={[]} loading />
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{t('crm.quotes.noQuotes')}</p>
          {onNew && <button onClick={onNew} className="text-xs text-primary hover:underline mt-1">{t('crm.quotes.createFirst')}</button>}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={quotes}
          onRowClick={(row) => onEdit?.(row.id)}
        />
      )}
    </div>
  )
}
