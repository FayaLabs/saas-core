export type PlanInterval = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

export interface Plan {
  id: string
  verticalId?: string
  name: string
  description?: string
  tier: number
  priceMonthly: number
  priceYearly: number
  currency: string
  features: string[]
  limits: Record<string, number>
  isActive: boolean
  createdAt: string
  /** @deprecated Use priceMonthly/priceYearly */
  prices?: { monthly: number; yearly: number }
  popular?: boolean
}

export interface Subscription {
  id: string
  tenantId: string
  planId: string
  status: SubscriptionStatus
  interval: PlanInterval
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  stripeSubscriptionId?: string
}

export interface Invoice {
  id: string
  tenantId: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  pdfUrl?: string
  createdAt: string
  paidAt?: string
}

export interface BillingState {
  subscription: Subscription | null
  invoices: Invoice[]
  plans: Plan[]
  loading: boolean
}
