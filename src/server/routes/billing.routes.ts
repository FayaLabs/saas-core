import { Router, type Request, type Response } from 'express'
import { StripeService } from '../services/stripe.service'

const router = Router()

router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { customerId, priceId, successUrl, cancelUrl } = req.body

    if (!customerId || !priceId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: 'Missing required fields: customerId, priceId, successUrl, cancelUrl' })
      return
    }

    const session = await StripeService.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl
    )

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Checkout session creation failed:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body

    if (!subscriptionId) {
      res.status(400).json({ error: 'Missing required field: subscriptionId' })
      return
    }

    const subscription = await StripeService.cancelSubscription(subscriptionId)
    res.json({
      id: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  } catch (err) {
    console.error('Subscription cancellation failed:', err)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

router.post('/resume', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body

    if (!subscriptionId) {
      res.status(400).json({ error: 'Missing required field: subscriptionId' })
      return
    }

    const subscription = await StripeService.resumeSubscription(subscriptionId)
    res.json({
      id: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: subscription.status,
    })
  } catch (err) {
    console.error('Subscription resume failed:', err)
    res.status(500).json({ error: 'Failed to resume subscription' })
  }
})

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query

    if (!customerId || typeof customerId !== 'string') {
      res.status(400).json({ error: 'Missing required query parameter: customerId' })
      return
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
    const invoices = await StripeService.getInvoices(customerId, limit)

    const mapped = invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount_due,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      createdAt: new Date((inv.created ?? 0) * 1000).toISOString(),
      paidAt: inv.status_transitions?.paid_at
        ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
        : null,
    }))

    res.json(mapped)
  } catch (err) {
    console.error('Invoice fetch failed:', err)
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
})

export const billingRouter = router
