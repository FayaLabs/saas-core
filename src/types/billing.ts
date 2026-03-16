export type PlanInterval = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

export interface Plan {
  id: string
  name: string
  description: string
  features: string[]
  prices: {
    monthly: number
    yearly: number
  }
  limits?: Record<string, number>
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
