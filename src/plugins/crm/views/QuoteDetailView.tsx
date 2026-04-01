import React, { useEffect, useState } from 'react'
import { FileText, Calendar, User, Hash, Ban, Pencil, CircleCheckBig, ArrowRight } from 'lucide-react'
import { useCrmConfig, useCrmProvider, formatCurrency } from '../CrmContext'
import { useTranslation } from '../../../hooks/useTranslation'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { QuoteStatusDropdown } from '../components/QuoteStatusDropdown'
import { PersonLink } from '../../../components/shared/PersonLink'
import type { Quote } from '../types'
export function QuoteDetailView({ quoteId, onBack, onEdit }: { quoteId: string; onBack: () => void; onEdit?: () => void }) {
  const { t } = useTranslation()
  const { currency } = useCrmConfig()
  const provider = useCrmProvider()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    provider.getQuoteById(quoteId).then((q) => {
      setQuote(q)
      setLoading(false)
    })
  }, [quoteId])

  if (loading) {
    return (
      <div className="space-y-5">
        <SubpageHeader title="" onBack={onBack} parentLabel={t('crm.quotes.title')} />
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="h-1 bg-muted animate-pulse" />
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted/40 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
                  <div className="h-6 w-32 rounded bg-muted/40 animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-muted/40 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-muted/30 animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-2 w-10 rounded bg-muted/30 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-5">
        <SubpageHeader title={t('crm.quoteDetail.title')} onBack={onBack} parentLabel={t('crm.quotes.title')} />
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{t('crm.quoteDetail.notFound')}</p>
          <button onClick={onBack} className="text-xs text-primary hover:underline mt-1">{t('crm.quoteDetail.backToList')}</button>
        </div>
      </div>
    )
  }

  const subtotal = quote.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
  const totalDiscount = quote.items.reduce((sum, it) => sum + it.discount, 0)

  return (
    <div className="space-y-5">
      <SubpageHeader
        title={`#${quote.quoteNumber}`}
        onBack={onBack}
        parentLabel={t('crm.quotes.title')}
        actions={onEdit && quote.status !== 'approved' && quote.status !== 'rejected' && (
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors">
            <Pencil className="h-3 w-3" /> {t('crm.quoteDetail.edit')}
          </button>
        )}
      />

      {/* Quote document card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Top accent stripe */}
        <div className="h-1 bg-primary" />

        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('crm.quoteDetail.quoteNumber', { number: quote.quoteNumber })}
                </p>
                <p className="text-xl font-bold mt-0.5">{formatCurrency(quote.totalAmount, currency)}</p>
              </div>
            </div>
            <QuoteStatusDropdown quote={quote} onStatusChange={(q) => setQuote(q)} />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{t('crm.quoteDetail.client')}</p>
                {quote.contactName ? (
                  <PersonLink personId={quote.contactId ?? quote.leadId} name={quote.contactName} size="sm" />
                ) : (
                  <p className="text-xs font-medium truncate">—</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">{t('crm.quoteDetail.date')}</p>
                <p className="text-xs font-medium">{quote.quoteDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">{t('crm.quoteDetail.validUntil')}</p>
                <p className="text-xs font-medium">{quote.validUntil}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">{t('crm.quoteDetail.items')}</p>
                <p className="text-xs font-medium">{quote.items.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        {quote.items.length > 0 && (
          <>
            <div className="px-5 pt-3 pb-1.5">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('crm.quoteDetail.items')}</h3>
            </div>
            <div className="px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[10px] text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">{t('crm.quoteDetail.description')}</th>
                    <th className="text-right py-2 font-medium">{t('crm.quoteDetail.qty')}</th>
                    <th className="text-right py-2 font-medium">{t('crm.quoteDetail.unitPrice')}</th>
                    <th className="text-right py-2 font-medium">{t('crm.quoteDetail.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quote.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="py-2.5 text-xs text-muted-foreground w-8">{i + 1}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground capitalize">{item.itemKind}</span>
                          <span className="truncate">{item.description || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-xs tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 text-right text-xs tabular-nums">{formatCurrency(item.unitPrice, currency)}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums">{formatCurrency(item.totalAmount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-5 py-3 mt-1 border-t bg-muted/10">
              <div className="flex flex-col items-end gap-0.5">
                {totalDiscount > 0 && (
                  <>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-muted-foreground">{t('crm.quoteDetail.subtotal')}</span>
                      <span className="tabular-nums w-24 text-right">{formatCurrency(subtotal, currency)}</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-emerald-600">
                      <span>{t('crm.quoteDetail.discount')}</span>
                      <span className="tabular-nums w-24 text-right">-{formatCurrency(totalDiscount, currency)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-6 text-sm font-bold pt-1">
                  <span>{t('crm.quoteDetail.total')}</span>
                  <span className="tabular-nums w-24 text-right">{formatCurrency(quote.totalAmount, currency)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payment conditions inside card */}
        {quote.paymentConditions && (
          <div className="px-5 py-3 border-t">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('crm.quoteDetail.paymentConditions')}</p>
            <p className="text-xs text-muted-foreground">{quote.paymentConditions}</p>
          </div>
        )}

        {/* Notes inside card */}
        {quote.observations && (
          <div className="px-5 py-3 border-t">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('crm.quoteDetail.notes')}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{quote.observations}</p>
          </div>
        )}
      </div>

      {/* Invoice link — when approved */}
      {quote.convertedInvoiceId && (
        <div className="flex items-center justify-between rounded-lg border bg-emerald-500/5 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <CircleCheckBig className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">{t('crm.quoteDetail.invoiceCreated')}</span>
          </div>
          <a
            href={`#/financial/receivables/detail/${quote.convertedInvoiceId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t('crm.quoteDetail.viewInvoice')} <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Rejection reason — outside the card */}
      {quote.status === 'rejected' && quote.rejectionReason && (
        <div className="flex items-center justify-between rounded-lg border bg-red-500/5 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Ban className="h-3.5 w-3.5 text-red-500" />
            <span className="text-muted-foreground">{t('crm.quoteDetail.rejectionReason')}: <span className="font-medium text-foreground">{quote.rejectionReason}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}
