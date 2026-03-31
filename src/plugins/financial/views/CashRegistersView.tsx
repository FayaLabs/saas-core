import React, { useEffect, useState, useMemo } from 'react'
import { Landmark, Play, Square, Clock, ChevronDown, ChevronUp, Calculator, X, Check, StickyNote } from 'lucide-react'
import { useFinancialConfig, useFinancialStore, formatCurrency } from '../FinancialContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { CurrencyInput } from '../../../components/ui/currency-input'

// ---------------------------------------------------------------------------
// Denomination definitions (BRL default — overridden by currency config)
// ---------------------------------------------------------------------------

interface Denomination {
  label: string
  value: number
  type: 'bill' | 'coin'
}

const BRL_DENOMINATIONS: Denomination[] = [
  { label: 'R$ 200', value: 200, type: 'bill' },
  { label: 'R$ 100', value: 100, type: 'bill' },
  { label: 'R$ 50', value: 50, type: 'bill' },
  { label: 'R$ 20', value: 20, type: 'bill' },
  { label: 'R$ 10', value: 10, type: 'bill' },
  { label: 'R$ 5', value: 5, type: 'bill' },
  { label: 'R$ 2', value: 2, type: 'bill' },
  { label: 'R$ 1', value: 1, type: 'coin' },
  { label: 'R$ 0,50', value: 0.5, type: 'coin' },
  { label: 'R$ 0,25', value: 0.25, type: 'coin' },
  { label: 'R$ 0,10', value: 0.1, type: 'coin' },
  { label: 'R$ 0,05', value: 0.05, type: 'coin' },
]

// ---------------------------------------------------------------------------
// Denomination counter sub-component
// ---------------------------------------------------------------------------

function DenominationCounter({
  denominations,
  counts,
  onChange,
  currency,
}: {
  denominations: Denomination[]
  counts: Record<number, number>
  onChange: (counts: Record<number, number>) => void
  currency: { code: string; locale: string; symbol: string }
}) {
  const bills = denominations.filter((d) => d.type === 'bill')
  const coins = denominations.filter((d) => d.type === 'coin')

  function setCount(value: number, count: number) {
    onChange({ ...counts, [value]: Math.max(0, count) })
  }

  function renderRow(d: Denomination) {
    const qty = counts[d.value] ?? 0
    const subtotal = qty * d.value
    return (
      <div key={d.value} className="flex items-center gap-2 py-1">
        <span className="w-20 text-xs font-medium text-muted-foreground">{d.label}</span>
        <span className="text-muted-foreground text-xs">×</span>
        <input
          type="number"
          min={0}
          value={qty || ''}
          onChange={(e) => setCount(d.value, parseInt(e.target.value) || 0)}
          placeholder="0"
          className="w-16 rounded border bg-background px-2 py-1 text-xs text-center tabular-nums"
        />
        <span className="text-xs text-muted-foreground">=</span>
        <span className="w-24 text-xs text-right tabular-nums font-medium">
          {formatCurrency(subtotal, currency)}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {bills.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Bills</p>
          {bills.map(renderRow)}
        </div>
      )}
      {coins.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Coins</p>
          {coins.map(renderRow)}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Opening panel (step-based)
// ---------------------------------------------------------------------------

type OpenMode = 'quick' | 'count'

function CashOpeningPanel({
  cashAccounts,
  currency,
  onOpen,
}: {
  cashAccounts: { id: string; name: string }[]
  currency: { code: string; locale: string; symbol: string }
  onOpen: (accountId: string, balance: number, notes?: string) => Promise<void>
}) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(cashAccounts[0]?.id ?? '')
  const [mode, setMode] = useState<OpenMode>('quick')
  const [quickBalance, setQuickBalance] = useState(0)
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const countedTotal = useMemo(() => {
    return BRL_DENOMINATIONS.reduce((sum, d) => sum + (counts[d.value] ?? 0) * d.value, 0)
  }, [counts])

  const effectiveBalance = mode === 'count' ? countedTotal : quickBalance

  function resetForm() {
    setQuickBalance(0)
    setCounts({})
    setNotes('')
    setShowNotes(false)
    setConfirming(false)
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await onOpen(selectedAccountId, effectiveBalance, notes || undefined)
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  if (cashAccounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        No cash register accounts found. Create a bank account with type "Cash Register" first.
      </p>
    )
  }

  // Confirmation step
  if (confirming) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold">Confirm Cash Opening</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Register</span>
            <span className="font-medium">{cashAccounts.find((a) => a.id === selectedAccountId)?.name}</span>
            <span className="text-muted-foreground">Opening Balance</span>
            <span className="font-bold text-base">{formatCurrency(effectiveBalance, currency)}</span>
            {mode === 'count' && (
              <>
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">Denomination count</span>
              </>
            )}
            {notes && (
              <>
                <span className="text-muted-foreground">Notes</span>
                <span className="font-medium">{notes}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" /> Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> {submitting ? 'Opening…' : 'Confirm & Open'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Account selector */}
      {cashAccounts.length > 1 && (
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Register</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full mt-0.5 rounded-lg border bg-background px-2 py-1.5 text-xs"
          >
            {cashAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg border p-0.5 w-fit">
        <button
          onClick={() => setMode('quick')}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            mode === 'quick' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Quick Amount
        </button>
        <button
          onClick={() => setMode('count')}
          className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            mode === 'count' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Calculator className="h-3 w-3" /> Count Bills & Coins
        </button>
      </div>

      {/* Quick mode */}
      {mode === 'quick' && (
        <CurrencyInput
          value={quickBalance}
          onChange={setQuickBalance}
          symbol={currency.symbol}
          locale={currency.locale}
          currencyCode={currency.code}
          label="Opening Balance"
        />
      )}

      {/* Count mode */}
      {mode === 'count' && (
        <div className="space-y-3">
          <DenominationCounter
            denominations={BRL_DENOMINATIONS}
            counts={counts}
            onChange={setCounts}
            currency={currency}
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground uppercase">Counted Total</span>
            <span className="text-lg font-bold">{formatCurrency(countedTotal, currency)}</span>
          </div>
        </div>
      )}

      {/* Notes toggle */}
      <div>
        {!showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <StickyNote className="h-3 w-3" /> Add notes
          </button>
        ) : (
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Opening observations…"
              className="w-full mt-0.5 rounded-lg border bg-background px-2 py-1.5 text-xs resize-none"
            />
          </div>
        )}
      </div>

      {/* Open button */}
      <button
        onClick={() => setConfirming(true)}
        disabled={effectiveBalance <= 0}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Play className="h-3 w-3" /> Open Session
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Closing panel (inline within open session card)
// ---------------------------------------------------------------------------

function CashClosingPanel({
  session,
  currency,
  onClose,
}: {
  session: { id: string; openingBalance: number; bankAccountName?: string }
  currency: { code: string; locale: string; symbol: string }
  onClose: (sessionId: string, balance: number, notes?: string) => Promise<void>
}) {
  const [mode, setMode] = useState<OpenMode>('quick')
  const [quickBalance, setQuickBalance] = useState(0)
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const countedTotal = useMemo(() => {
    return BRL_DENOMINATIONS.reduce((sum, d) => sum + (counts[d.value] ?? 0) * d.value, 0)
  }, [counts])

  const effectiveBalance = mode === 'count' ? countedTotal : quickBalance
  const difference = effectiveBalance - session.openingBalance

  async function handleClose() {
    setSubmitting(true)
    try {
      await onClose(session.id, effectiveBalance, notes || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg border p-0.5 w-fit">
        <button
          onClick={() => setMode('quick')}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            mode === 'quick' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Quick Amount
        </button>
        <button
          onClick={() => setMode('count')}
          className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            mode === 'count' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Calculator className="h-3 w-3" /> Count
        </button>
      </div>

      {mode === 'quick' ? (
        <CurrencyInput
          value={quickBalance}
          onChange={setQuickBalance}
          symbol={currency.symbol}
          locale={currency.locale}
          currencyCode={currency.code}
          label="Closing Balance"
        />
      ) : (
        <div className="space-y-3">
          <DenominationCounter
            denominations={BRL_DENOMINATIONS}
            counts={counts}
            onChange={setCounts}
            currency={currency}
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground uppercase">Counted Total</span>
            <span className="text-lg font-bold">{formatCurrency(countedTotal, currency)}</span>
          </div>
        </div>
      )}

      {/* Difference indicator */}
      {effectiveBalance > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Difference from opening</span>
          <span className={`text-sm font-bold tabular-nums ${
            difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-red-500' : 'text-muted-foreground'
          }`}>
            {difference >= 0 ? '+' : ''}{formatCurrency(difference, currency)}
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase">Closing Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Closing observations…"
          className="w-full mt-0.5 rounded-lg border bg-background px-2 py-1.5 text-xs resize-none"
        />
      </div>

      <button
        onClick={handleClose}
        disabled={submitting || effectiveBalance <= 0}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        <Square className="h-3 w-3" /> {submitting ? 'Closing…' : 'Close Session'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function CashRegistersView() {
  const { currency, labels } = useFinancialConfig()
  const bankAccounts = useFinancialStore((s) => s.bankAccounts)
  const cashSessions = useFinancialStore((s) => s.cashSessions)
  const fetchBankAccounts = useFinancialStore((s) => s.fetchBankAccounts)
  const fetchCashSessions = useFinancialStore((s) => s.fetchCashSessions)
  const openCashSession = useFinancialStore((s) => s.openCashSession)
  const closeCashSession = useFinancialStore((s) => s.closeCashSession)

  const [expandedClosing, setExpandedClosing] = useState<string | null>(null)

  useEffect(() => {
    fetchBankAccounts()
    fetchCashSessions()
  }, [])

  const cashAccounts = bankAccounts.filter((a) => a.accountType === 'cash_register')
  const openSessions = cashSessions.filter((s) => s.status === 'open')
  const closedSessions = cashSessions.filter((s) => s.status === 'closed')

  async function handleOpen(accountId: string, balance: number, notes?: string) {
    await openCashSession({ bankAccountId: accountId, openingBalance: balance, notes })
  }

  async function handleClose(sessionId: string, balance: number, notes?: string) {
    await closeCashSession({ sessionId, closingBalance: balance, notes })
    setExpandedClosing(null)
  }

  return (
    <div className="space-y-6">
      <SubpageHeader title={labels.cashRegisters ?? 'Cash Registers'} subtitle="Open, count and close cash sessions" />

      {/* Open sessions */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold">Open Sessions</h3>
            {openSessions.length > 0 && (
              <span className="rounded-full bg-blue-500/10 text-blue-600 px-2 py-0.5 text-[10px] font-semibold">
                {openSessions.length}
              </span>
            )}
          </div>
        </div>

        {openSessions.length === 0 ? (
          <CashOpeningPanel cashAccounts={cashAccounts} currency={currency} onOpen={handleOpen} />
        ) : (
          <div className="divide-y">
            {openSessions.map((session) => (
              <div key={session.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{session.bankAccountName ?? 'Cash Register'}</p>
                    <p className="text-xs text-muted-foreground">
                      Opened {new Date(session.openedAt).toLocaleString()}
                      {session.openedByName ? ` by ${session.openedByName}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Opening</p>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(session.openingBalance, currency)}</p>
                  </div>
                </div>

                {/* Expand/collapse closing controls */}
                {expandedClosing === session.id ? (
                  <CashClosingPanel session={session} currency={currency} onClose={handleClose} />
                ) : (
                  <button
                    onClick={() => setExpandedClosing(session.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" /> Close this session
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick open — when sessions already exist but user may want another */}
      {openSessions.length > 0 && cashAccounts.length > openSessions.length && (
        <OpenAnotherCollapsible cashAccounts={cashAccounts} openSessions={openSessions} currency={currency} onOpen={handleOpen} />
      )}

      {/* Session history */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Session History</h3>
        </div>
        {closedSessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No closed sessions yet</div>
        ) : (
          <div className="divide-y">
            {closedSessions.map((session) => (
              <div key={session.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{session.bankAccountName ?? 'Cash Register'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.openedAt).toLocaleDateString()} — {session.closedAt ? new Date(session.closedAt).toLocaleDateString() : ''}
                    </p>
                    {session.openedByName && (
                      <p className="text-[10px] text-muted-foreground">by {session.openedByName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Open: {formatCurrency(session.openingBalance, currency)}</span>
                      <span>Close: {formatCurrency(session.closingBalance ?? 0, currency)}</span>
                    </div>
                    {session.difference !== undefined && session.difference !== 0 && (
                      <p className={`text-xs font-semibold tabular-nums mt-0.5 ${session.difference > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        Diff: {session.difference >= 0 ? '+' : ''}{formatCurrency(session.difference, currency)}
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate" title={session.notes}>
                        {session.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible "Open another register"
// ---------------------------------------------------------------------------

function OpenAnotherCollapsible({
  cashAccounts,
  openSessions,
  currency,
  onOpen,
}: {
  cashAccounts: { id: string; name: string }[]
  openSessions: { bankAccountId: string }[]
  currency: { code: string; locale: string; symbol: string }
  onOpen: (accountId: string, balance: number, notes?: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const availableAccounts = cashAccounts.filter((a) => !openSessions.some((s) => s.bankAccountId === a.id))

  if (availableAccounts.length === 0) return null

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Play className="h-3 w-3 text-primary" />
          Open another register
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && <CashOpeningPanel cashAccounts={availableAccounts} currency={currency} onOpen={onOpen} />}
    </div>
  )
}
