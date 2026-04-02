import React from 'react'
import { DollarSign, Check, AlertTriangle, Clock } from 'lucide-react'
import type { BookingPaymentStatus } from '../financial-bridge'
import { useTranslation } from '../../../hooks/useTranslation'

const STATUS_CONFIG: Record<BookingPaymentStatus, {
  dot: string
  text: string
  bg: string
  icon: React.ElementType
}> = {
  none: { dot: '', text: 'text-muted-foreground', bg: 'hover:bg-muted/50', icon: DollarSign },
  pending: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  partial: { dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
  paid: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: Check },
  overdue: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
  cancelled: { dot: 'bg-gray-400', text: 'text-muted-foreground', bg: 'bg-muted/30', icon: DollarSign },
}

interface PaymentStatusBadgeProps {
  status: BookingPaymentStatus
  totalAmount?: number
  paidAmount?: number
  formatCurrency?: (amount: number) => string
  onClick?: () => void
  compact?: boolean
}

export function PaymentStatusBadge({
  status, totalAmount, paidAmount, formatCurrency, onClick, compact,
}: PaymentStatusBadgeProps) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.none

  const label = status === 'none'
    ? t('agenda.payment.title')
    : t(`agenda.payment.${status}`)

  const amount = formatCurrency && totalAmount != null
    ? status === 'partial' && paidAmount != null
      ? `${formatCurrency(paidAmount)}/${formatCurrency(totalAmount)}`
      : formatCurrency(totalAmount)
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${cfg.bg} ${cfg.text} ${
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      }`}
    >
      {status === 'none' ? (
        <DollarSign className="h-3 w-3 shrink-0" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      )}
      {!compact && <span>{label}</span>}
      {amount && <span className="font-normal opacity-75">{amount}</span>}
    </button>
  )
}
