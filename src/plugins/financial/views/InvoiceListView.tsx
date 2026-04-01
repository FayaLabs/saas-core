import React, { useEffect, useState, useMemo } from 'react'
import { FileText, CircleDashed, CircleEllipsis, CircleCheckBig, CircleAlert, Ban } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { ListView } from '../../../components/ui/list-view'
import { useFinancialConfig, useFinancialStore, formatCurrency } from '../FinancialContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { PersonLink } from '../../../components/shared/PersonLink'
import { useTranslation } from '../../../hooks/useTranslation'
import type { TransactionDirection, InvoiceStatus, Invoice } from '../types'

const STATUS_OPTIONS: { value: InvoiceStatus; labelKey: string; color: string; icon: React.ElementType }[] = [
  { value: 'open', labelKey: 'financial.invoice.statusOpen', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: CircleDashed },
  { value: 'partial', labelKey: 'financial.invoice.statusPartial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: CircleEllipsis },
  { value: 'paid', labelKey: 'financial.invoice.statusPaid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CircleCheckBig },
  { value: 'overdue', labelKey: 'financial.invoice.statusOverdue', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: CircleAlert },
  { value: 'cancelled', labelKey: 'financial.invoice.statusCancelled', color: 'bg-muted text-muted-foreground', icon: Ban },
]

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const opt = STATUS_OPTIONS.find((o) => o.value === status)
  const Icon = opt?.icon ?? CircleDashed
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${opt?.color ?? 'bg-muted text-muted-foreground'}`}>
      <Icon className="h-2.5 w-2.5" /> {opt ? t(opt.labelKey) : status}
    </span>
  )
}

function useInvoiceColumns(currency: { code: string; locale: string; symbol: string }): ColumnDef<Invoice, any>[] {
  const { t } = useTranslation()
  return useMemo(() => [
    {
      accessorKey: 'invoiceDate', header: t('financial.invoice.columnDate'),
      cell: ({ getValue }) => <span className="text-muted-foreground text-xs">{getValue() as string}</span>,
    },
    {
      id: 'description', header: t('financial.invoice.columnDescription'),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          {row.original.contactName ? (
            <PersonLink personId={row.original.contactId} name={row.original.contactName} size="sm" className="text-sm font-medium" />
          ) : (
            <p className="font-medium">—</p>
          )}
          {row.original.itemsSummary && <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{row.original.itemsSummary}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount', header: t('financial.invoice.columnAmount'), enableSorting: true,
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>
          {formatCurrency(row.original.totalAmount, currency)}
        </span>
      ),
    },
    {
      accessorKey: 'paidAmount', header: t('financial.invoice.columnPaid'),
      cell: ({ row }) => (
        <span className={row.original.status === 'cancelled' ? 'line-through text-muted-foreground' : 'text-muted-foreground'}>
          {formatCurrency(row.original.paidAmount, currency)}
        </span>
      ),
    },
    {
      accessorKey: 'status', header: t('financial.invoice.columnStatus'),
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'totalInstallments', header: t('financial.invoice.columnInst'),
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as number}</span>,
    },
  ], [currency, t])
}

export function InvoiceListView({ direction, onNew, onEdit }: {
  direction: TransactionDirection
  onNew?: () => void
  onEdit?: (id: string) => void
}) {
  const { t } = useTranslation()
  const { currency } = useFinancialConfig()
  const invoices = useFinancialStore((s) => s.invoices)
  const invoicesTotal = useFinancialStore((s) => s.invoicesTotal)
  const invoicesLoading = useFinancialStore((s) => s.invoicesLoading)
  const fetchInvoices = useFinancialStore((s) => s.fetchInvoices)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([])

  useEffect(() => {
    fetchInvoices({
      direction,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      search: search || undefined,
    })
  }, [direction, statusFilter, search])

  const filtered = invoices.filter((inv) => inv.direction === direction)
  const listTitle = direction === 'debit' ? t('financial.invoice.accountsPayable') : t('financial.invoice.accountsReceivable')
  const columns = useInvoiceColumns(currency)
  const tags = useMemo(
    () => STATUS_OPTIONS.filter((o) => o.value !== 'cancelled').map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  )

  return (
    <div className="space-y-4">
      <SubpageHeader
        title={listTitle}
        subtitle={t('financial.invoice.invoices', { count: filtered.length })}
      />
      <ListView<Invoice>
        columns={columns}
        data={filtered}
        loading={invoicesLoading}
        searchPlaceholder={t('financial.invoice.searchPlaceholder')}
        search={search}
        onSearchChange={setSearch}
        searchDebounce={0}
        tags={tags}
        activeTag={statusFilter.length === 1 ? statusFilter[0] : undefined}
        onTagChange={(v) => setStatusFilter(v ? [v as InvoiceStatus] : [])}
        newLabel={t('financial.invoice.new')}
        onNew={onNew}
        onRowClick={(row) => onEdit?.(row.id)}
        emptyIcon={FileText}
        emptyMessage={t('financial.invoice.noInvoices')}
        emptyActionLabel={onNew ? t('financial.invoice.createFirst') : undefined}
        onEmptyAction={onNew}
      />
    </div>
  )
}
