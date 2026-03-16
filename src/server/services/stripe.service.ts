import Stripe from 'stripe'

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

export class StripeService {
  static async createCustomer(
    email: string,
    tenantId: string,
    name?: string
  ): Promise<Stripe.Customer> {
    const stripe = getStripeClient()
    return stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    })
  }

  static async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    const stripe = getStripeClient()
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })
  }

  static async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const stripe = getStripeClient()
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }

  static async resumeSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const stripe = getStripeClient()
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
  }

  static async getInvoices(
    customerId: string,
    limit = 20
  ): Promise<Stripe.Invoice[]> {
    const stripe = getStripeClient()
    const result = await stripe.invoices.list({
      customer: customerId,
      limit,
    })
    return result.data
  }

  static async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient()
    return stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })
  }

  static constructWebhookEvent(
    body: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    const stripe = getStripeClient()
    return stripe.webhooks.constructEvent(body, signature, secret)
  }
}
