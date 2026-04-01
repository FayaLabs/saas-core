import React, { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import { useFinancialConfig, useFinancialStore, formatCurrency } from '../FinancialContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { DatePicker } from '../../../components/ui/date-picker'
import { useTranslation } from '../../../hooks/useTranslation'

export function StatementsView() {
  const { t } = useTranslation()
  const { currency, labels } = useFinancialConfig()
  const bankAccounts = useFinancialStore((s) => s.bankAccounts)
  const statementEntries = useFinancialStore((s) => s.statementEntries)
  const statementLoading = useFinancialStore((s) => s.statementLoading)
  const fetchBankAccounts = useFinancialStore((s) => s.fetchBankAccounts)
  const fetchStatement = useFinancialStore((s) => s.fetchStatement)

  const [accountId, setAccountId] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => { fetchBankAccounts() }, [])

  useEffect(() => {
    if (accountId) {
      fetchStatement({ bankAccountId: accountId, dateRange: { from: dateFrom, to: dateTo } })
    }
  }, [accountId, dateFrom, dateTo])

  // Auto-select first account
  useEffect(() => {
    if (!accountId && bankAccounts.length > 0) {
      setAccountId(bankAccounts[0].id)
    }
  }, [bankAccounts])

  return (
    <div className="space-y-4">
      <SubpageHeader title={t('financial.statements.title')} subtitle={t('financial.statements.subtitle')} />
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 max-w-xs">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">{t('financial.statements.account')}</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full mt-0.5 rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">{t('financial.statements.selectAccount')}</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase">{t('financial.statements.from')}</label>
          <DatePicker value={dateFrom} onChange={setDateFrom} className="mt-0.5" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase">{t('financial.statements.to')}</label>
          <DatePicker value={dateTo} onChange={setDateTo} className="mt-0.5" />
        </div>
      </div>

      {/* Statement table */}
      {!accountId ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('financial.statements.selectToView')}</p>
        </div>
      ) : statementLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : statementEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('financial.statements.noTransactions')}</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Description</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Debit</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Credit</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Balance</th>
              </tr>
            </thead>
            <tbody>
              {statementEntries.map((entry, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{entry.movement.paymentDate ?? entry.movement.dueDate}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium">{entry.invoice?.contactName || entry.movement.notes || 'Transaction'}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{entry.movement.movementKind}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right text-red-500 text-xs">
                    {entry.movement.direction === 'debit' ? formatCurrency(entry.movement.paidAmount, currency) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-600 text-xs">
                    {entry.movement.direction === 'credit' ? formatCurrency(entry.movement.paidAmount, currency) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-xs">{formatCurrency(entry.runningBalance, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
