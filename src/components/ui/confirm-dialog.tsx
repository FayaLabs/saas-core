import * as React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'success'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<ConfirmVariant, { icon: React.ElementType; iconBg: string; iconColor: string; buttonClass: string }> = {
  default: {
    icon: Info,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  destructive: {
    icon: XCircle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    buttonClass: 'bg-red-500 text-white hover:bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    buttonClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    buttonClass: 'bg-emerald-500 text-white hover:bg-emerald-600',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border/50 bg-card shadow-2xl animate-zoom-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
      >
        <div className="p-6">
          {/* Icon + text */}
          <div className="flex gap-4">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full shrink-0', config.iconBg)}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 id="confirm-title" className="text-sm font-semibold text-foreground">
                {title}
              </h3>
              {description && (
                <p id="confirm-desc" className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn('rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50', config.buttonClass)}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
