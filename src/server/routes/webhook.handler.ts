import type { Request, Response } from 'express'
import Stripe from 'stripe'
import { StripeService } from '../services/stripe.service'

interface WebhookDeps {
  upsertSubscription: (data: {
    stripeSubscriptionId: string
    tenantId: string
    planId: string
    status: string
    interval: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }) => Promise<void>
  recordPayment: (data: {
    stripeInvoiceId: string
    tenantId: string
    amount: number
    currency: string
    pdfUrl: string | null
    paidAt: string
  }) => Promise<void>
  markSubscriptionCanceled: (stripeSubscriptionId: string) => Promise<void>
}

export function createWebhookHandler(deps: WebhookDeps) {
  return async function handleWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing stripe-signature header' })
      return
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      res.status(500).json({ error: 'Webhook secret not configured' })
      return
    }

    let event: Stripe.Event

    try {
      event = StripeService.constructWebhookEvent(req.body, signature, webhookSecret)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', message)
      res.status(400).json({ error: `Webhook Error: ${message}` })
      return
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const subscriptionId = session.subscription as string
          const tenantId = session.metadata?.tenantId ?? session.client_reference_id ?? ''

          if (subscriptionId && tenantId) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
              apiVersion: '2024-06-20',
            })
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            const priceId = sub.items.data[0]?.price.id ?? ''
            const interval = sub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

            await deps.upsertSubscription({
              stripeSubscriptionId: sub.id,
              tenantId,
              planId: priceId,
              status: sub.status,
              interval,
              currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            })
          }
          break
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice
          const customerId = invoice.customer as string
          const tenantId = (invoice.metadata?.tenantId ?? '') as string

          await deps.recordPayment({
            stripeInvoiceId: invoice.id,
            tenantId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            pdfUrl: invoice.invoice_pdf ?? null,
            paidAt: new Date((invoice.status_transitions?.paid_at ?? 0) * 1000).toISOString(),
          })
          break
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription
          const tenantId = sub.metadata?.tenantId ?? ''
          const priceId = sub.items.data[0]?.price.id ?? ''
          const interval = sub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

          await deps.upsertSubscription({
            stripeSubscriptionId: sub.id,
            tenantId,
            planId: priceId,
            status: sub.status,
            interval,
            currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          })
          break
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription
          await deps.markSubscriptionCanceled(sub.id)
          break
        }

        default:
          break
      }

      res.json({ received: true })
    } catch (err) {
      console.error(`Error processing webhook event ${event.type}:`, err)
      res.status(500).json({ error: 'Webhook processing failed' })
    }
  }
}
