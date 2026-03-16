import * as React from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import type { Subscription, Plan } from '../../types'

interface SubscriptionCardProps {
  subscription: Subscription
  plan?: Plan
  onCancel?: () => void
  onResume?: () => void
  loading?: boolean
}

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  trialing: { label: 'Trial', variant: 'secondary' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline' },
  paused: { label: 'Paused', variant: 'outline' },
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SubscriptionCard({
  subscription,
  plan,
  onCancel,
  onResume,
  loading,
}: SubscriptionCardProps) {
  const statusInfo = STATUS_STYLES[subscription.status] ?? STATUS_STYLES.active

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {plan?.name ?? 'Current Plan'}
          </CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        {plan && <CardDescription>{plan.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {subscription.cancelAtPeriodEnd
              ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
              : `Next billing: ${formatDate(subscription.currentPeriodEnd)}`}
          </span>
        </div>

        {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Trial ends {formatDate(subscription.trialEnd)}</span>
          </div>
        )}

        {plan && (
          <div className="text-sm">
            <span className="text-2xl font-bold">
              ${subscription.interval === 'monthly' ? plan.prices.monthly : plan.prices.yearly}
            </span>
            <span className="text-muted-foreground">
              /{subscription.interval === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
        )}

        {subscription.status === 'past_due' && (
          <div className={cn(
            'rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'
          )}>
            Your payment is past due. Please update your payment method to avoid service interruption.
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        {subscription.cancelAtPeriodEnd && onResume ? (
          <Button variant="default" onClick={onResume} disabled={loading}>
            {loading ? 'Resuming...' : 'Resume Subscription'}
          </Button>
        ) : (
          onCancel && subscription.status === 'active' && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              {loading ? 'Canceling...' : 'Cancel Subscription'}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
}
