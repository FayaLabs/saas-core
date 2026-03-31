import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Banknote, QrCode, CreditCard, Building2, ArrowRightLeft, FileCheck, Pencil } from 'lucide-react'
import { useFinancialConfig, useFinancialStore, formatCurrency } from '../FinancialContext'
import { CurrencyInput } from '../../../components/ui/currency-input'
import type { FinancialMovement, PaymentMethodType } from '../types'

const TYPE_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  bank_transfer: ArrowRightLeft,
  check: FileCheck,
}

const TYPE_COLORS: Record<string, string> = {
  cash: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-500/15',
  pix: 'border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 data-[active=true]:border-teal-500 data-[active=true]:bg-teal-500/15',
  credit_card: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-500/15',
  debit_card: 'border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 data-[active=true]:border-violet-500 data-[active=true]:bg-violet-500/15',
  bank_transfer: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 data-[active=true]:border-amber-500 data-[active=true]:bg-amber-500/15',
  check: 'border-gray-500/30 bg-gray-500/5 hover:bg-gray-500/10 data-[active=true]:border-gray-500 data-[active=true]:bg-gray-500/15',
}

const ICON_COLORS: Record<string, string> = {
  cash: 'text-emerald-500',
  pix: 'text-teal-500',
  credit_card: 'text-blue-500',
  debit_card: 'text-violet-500',
  bank_transfer: 'text-amber-500',
  check: 'text-gray-500',
}

export function PaymentModal({ movement, onClose, onPaid }: {
  movement: FinancialMovement
  onClose: () => void
  onPaid: () => void
}) {
  const { currency } = useFinancialConfig()
  const payMovement = useFinancialStore((s) => s.payMovement)
  const bankAccounts = useFinancialStore((s) => s.bankAccounts)
  const paymentMethods = useFinancialStore((s) => s.paymentMethods)
  const paymentMethodTypes = useFinancialStore((s) => s.paymentMethodTypes)
  const fetchBankAccounts = useFinancialStore((s) => s.fetchBankAccounts)
  const fetchPaymentMethods = useFinancialStore((s) => s.fetchPaymentMethods)

  const remaining = movement.amount - movement.paidAmount
  const [amount, setAmount] = useState(remaining)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [cardInstallments, setCardInstallments] = useState(1)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const [expandMethodPicker, setExpandMethodPicker] = useState(true)

  useEffect(() => {
    fetchBankAccounts()
    fetchPaymentMethods()
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const selectedType = useMemo(() =>
    paymentMethodTypes.find((t) => t.id === selectedTypeId),
    [paymentMethodTypes, selectedTypeId]
  )

  const txType = selectedType?.transactionType ?? ''

  const filteredMethods = useMemo(() =>
    paymentMethods.filter((m) => m.paymentMethodTypeId === selectedTypeId),
    [paymentMethods, selectedTypeId]
  )

  const needsBankAccount = txType === 'bank_transfer' || txType === 'pix' || txType === 'check'
  const needsCard = txType === 'credit_card' || txType === 'debit_card'
  const needsCardInstallments = txType === 'credit_card'

  function handleSelectType(typeId: string) {
    setSelectedTypeId(typeId)
    setExpandMethodPicker(false)
    setPaymentMethodId('')
    setBankAccountId('')
    setCardBrand('')
    setCardInstallments(1)
  }

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  async function handlePay() {
    if (amount <= 0 || !selectedTypeId) return
    setSaving(true)
    try {
      await payMovement({
        movementId: movement.id,
        amount,
        paymentDate,
        paymentMethodId: paymentMethodId || undefined,
        bankAccountId: bankAccountId || undefined,
        cardBrand: needsCard ? cardBrand || undefined : undefined,
        cardInstallments: needsCardInstallments ? cardInstallments : undefined,
      })
      setVisible(false)
      setTimeout(onPaid, 200)
    } catch {
      // toast handled by store
    } finally {
      setSaving(false)
    }
  }

  const SelectedIcon = selectedType ? (TYPE_ICONS[txType] ?? Banknote) : null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-colors duration-200"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card shadow-2xl mx-4 transition-all duration-200 max-h-[90vh] overflow-y-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-card z-10">
          <div>
            <h3 className="text-base font-semibold">Record Payment</h3>
            <p className="text-xs text-muted-foreground">
              Installment #{movement.installmentNumber} &middot; {formatCurrency(remaining, currency)} remaining
            </p>
          </div>
          <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Payment method type selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment Method</label>

            {/* Collapsed: show selected as inline chip */}
            <div
              className="grid transition-all duration-200 ease-out"
              style={{ gridTemplateRows: selectedTypeId && !expandMethodPicker ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                {selectedType && (
                  <button
                    onClick={() => setExpandMethodPicker(true)}
                    className={`flex items-center gap-2 mt-1.5 w-full rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/30 ${TYPE_COLORS[txType] ?? ''}`}
                    data-active="true"
                  >
                    {SelectedIcon && <SelectedIcon className={`h-4 w-4 ${ICON_COLORS[txType] ?? ''}`} />}
                    <span className="text-sm font-medium flex-1">{selectedType?.name}</span>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded: full grid */}
            <div
              className="grid transition-all duration-200 ease-out"
              style={{ gridTemplateRows: expandMethodPicker ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {paymentMethodTypes.map((type) => {
                    const tt = type.transactionType ?? ''
                    const Icon = TYPE_ICONS[tt] ?? Banknote
                    const isActive = selectedTypeId === type.id
                    return (
                      <button
                        key={type.id}
                        data-active={isActive}
                        onClick={() => handleSelectType(type.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all ${TYPE_COLORS[tt] ?? TYPE_COLORS.cash}`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? ICON_COLORS[tt] ?? '' : 'text-muted-foreground'}`} />
                        <span className={`text-[11px] font-medium leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{type.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Form fields — only after method selected */}
          {selectedTypeId && (
            <div key={selectedTypeId} className="space-y-4">
              {/* Amount + Date side by side */}
              <div className="grid grid-cols-2 gap-3 stagger-field" style={{ animationDelay: '0ms' }}>
                <CurrencyInput
                  label="Amount"
                  value={amount}
                  onChange={setAmount}
                  symbol={currency.symbol}
                  locale={currency.locale}
                  currencyCode={currency.code}
                />
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              {/* Specific payment method */}
              {filteredMethods.length > 0 && (
                <div className="stagger-field" style={{ animationDelay: '50ms' }}>
                  <label className="text-xs font-medium text-muted-foreground">
                    {needsCard ? 'Card' : 'Account'}
                  </label>
                  <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {filteredMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}

              {/* Card fields side by side */}
              {needsCard && (
                <div className={`grid gap-3 stagger-field ${needsCardInstallments ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ animationDelay: '100ms' }}>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Card Brand</label>
                    <select value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="">Select brand...</option>
                      {['Visa', 'Mastercard', 'American Express', 'Elo', 'Hipercard', 'Diners Club'].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {needsCardInstallments && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Installments</label>
                      <select value={cardInstallments} onChange={(e) => setCardInstallments(Number(e.target.value))} className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}x {n > 1 ? formatCurrency(amount / n, currency) : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Bank account */}
              {needsBankAccount && bankAccounts.length > 0 && (
                <div className="stagger-field" style={{ animationDelay: '100ms' }}>
                  <label className="text-xs font-medium text-muted-foreground">Bank Account</label>
                  <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="">Select account...</option>
                    {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="stagger-field" style={{ animationDelay: '150ms' }}>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          )}
        </div>

        {/* Keyframe for staggered field entrance */}
        <style>{`
          .stagger-field {
            animation: field-slide-in 250ms ease-out both;
          }
          @keyframes field-slide-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t sticky bottom-0 bg-card">
          <button onClick={handleClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button
            onClick={handlePay}
            disabled={amount <= 0 || !selectedTypeId || saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {saving ? 'Processing...' : `Pay ${formatCurrency(amount, currency)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
