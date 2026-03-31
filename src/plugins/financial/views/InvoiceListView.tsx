import React, { useEffect, useState } from 'react'
import { Search, Plus, FileText, CircleDashed, CircleEllipsis, CircleCheckBig, CircleAlert, Ban } from 'lucide-react'
import { useFinancialConfig, useFinancialStore, formatCurrency } from '../FinancialContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { TableSkeleton } from '../../../components/ui/skeleton'
import type { TransactionDirection, InvoiceStatus } from '../types'

const STATUS_OPTIONS: { value: InvoiceStatus; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: CircleDashed },
  { value: 'partial', label: 'Partial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: CircleEllipsis },
  { value: 'paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CircleCheckBig },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: CircleAlert },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-muted text-muted-foreground', icon: Ban },
]

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status)
  const Icon = opt?.icon ?? CircleDashed
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${opt?.color ?? 'bg-muted text-muted-foreground'}`}>
      <Icon className="h-2.5 w-2.5" /> {opt?.label ?? status}
    </span>
  )
}

export function InvoiceListView({ direction, onNew, onEdit }: {
  direction: TransactionDirection
  onNew?: () => void
  onEdit?: (id: string) => void
}) {
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
  const listTitle = direction === 'debit' ? 'Accounts Payable' : 'Accounts Receivable'

  return (
    <div className="space-y-4">
      <SubpageHeader
        title={listTitle}
        subtitle={`${filtered.length} invoices`}
      />
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by contact or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {onNew && (
          <button
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_OPTIONS.filter((o) => o.value !== 'cancelled').map((opt) => {
          const active = statusFilter.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(active ? statusFilter.filter((s) => s !== opt.value) : [...statusFilter, opt.value])}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active ? opt.color : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {invoicesLoading ? (
        <TableSkeleton columns={6} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No invoices yet</p>
          {onNew && (
            <button onClick={onNew} className="text-xs text-primary hover:underline mt-1">
              Create your first invoice
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Description</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Amount</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Paid</th>
                <th className="text-center font-medium text-muted-foreground px-4 py-2.5">Status</th>
                <th className="text-center font-medium text-muted-foreground px-4 py-2.5">Inst.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} onClick={() => onEdit?.(inv.id)} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{inv.invoiceDate}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inv.contactName || '—'}</p>
                    {inv.itemsSummary && <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{inv.itemsSummary}</p>}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${inv.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>{formatCurrency(inv.totalAmount, currency)}</td>
                  <td className={`px-4 py-3 text-right ${inv.status === 'cancelled' ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>{formatCurrency(inv.paidAmount, currency)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{inv.totalInstallments}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoicesTotal > filtered.length && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/20">
              Showing {filtered.length} of {invoicesTotal}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
