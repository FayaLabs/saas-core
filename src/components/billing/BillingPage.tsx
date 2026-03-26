import * as React from 'react'
import { PlanSelector } from './PlanSelector'
import { SubscriptionCard } from './SubscriptionCard'
import { useBillingStore } from '../../stores/billing.store'
import { useBilling } from '../../hooks/useBilling'
import type { PlanInterval } from '../../types'

interface BillingPageProps {
  className?: string
}

export function BillingPage({ className }: BillingPageProps) {
  const { plans, subscription, loading } = useBillingStore()
  const billing = useBilling()
  const [interval, setInterval] = React.useState<PlanInterval>('monthly')

  // Fetch subscription on mount
  React.useEffect(() => {
    billing.fetchSubscription()
  }, [])

  const currentPlan = plans.find((p) => p.id === subscription?.planId)

  return (
    <div className={className ?? 'mx-auto max-w-5xl space-y-8'}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing.
        </p>
      </div>

      {subscription && (
        <SubscriptionCard
          subscription={subscription}
          plan={currentPlan}
          onCancel={billing.cancelSubscription}
          loading={loading}
        />
      )}

      {plans.length > 0 && (
        <PlanSelector
          plans={plans}
          currentPlanId={subscription?.planId}
          interval={interval}
          onIntervalChange={setInterval}
          onSelectPlan={(planId) => billing.subscribe(planId, interval)}
          loading={loading}
        />
      )}
    </div>
  )
}
