import React, { useState } from 'react'
import { DollarSign, Landmark, CreditCard, BookOpen, ChevronRight, Check } from 'lucide-react'
import { useTranslation } from '../../../hooks/useTranslation'

const STEPS = [
  {
    id: 'welcome',
    icon: DollarSign,
    title: 'Welcome to Financial',
    description: 'Let\'s set up your financial module. This quick wizard will help you configure the essentials.',
  },
  {
    id: 'accounts',
    icon: Landmark,
    title: 'Bank Accounts',
    description: 'Add your bank accounts, cash registers, and credit cards. You can always add more later from Settings.',
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payment Methods',
    description: 'Review which payment types you accept. Default types (Cash, PIX, Credit Card, etc.) are already set up.',
  },
  {
    id: 'chart',
    icon: BookOpen,
    title: 'Chart of Accounts',
    description: 'A default chart of accounts template has been created. You can customize it anytime from Settings.',
  },
]

export function FinancialOnboarding({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const Icon = current.icon

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{current.description}</p>
          </div>

          {/* Step-specific hint */}
          {step > 0 && step < STEPS.length - 1 && (
            <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              {t('financial.onboarding.configureHint')}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                {t('financial.onboarding.back')}
              </button>
            )}
            {isLast ? (
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Check className="h-4 w-4" /> {t('financial.onboarding.startUsing')}
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {step === 0 ? t('financial.onboarding.getStarted') : t('financial.onboarding.next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Skip */}
          {!isLast && step === 0 && (
            <button
              onClick={onComplete}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('financial.onboarding.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
