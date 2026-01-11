import Stripe from "stripe"

// Lazy initialize Stripe client to avoid build-time errors
let stripeClient: Stripe | null = null
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    })
  }
  return stripeClient
}

// For backward compatibility - use getStripe() for new code
export const stripe = {
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get checkout() { return getStripe().checkout },
  get webhooks() { return getStripe().webhooks },
  get billingPortal() { return getStripe().billingPortal },
}

// Stripe Price IDs from environment
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_PRICE_ID,
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  LIFETIME: process.env.STRIPE_LIFETIME_PRICE_ID,
} as const

// Legacy PLANS export for backward compatibility
export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    features: ["10 AI chats/day", "Basic analytics", "Custom username"],
    messagesPerDay: 10,
  },
  PRO: {
    name: "Pro",
    price: 800, // $8.00 in cents
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    features: ["100 AI chats/day", "Advanced analytics", "Priority support"],
    messagesPerDay: 100,
  },
  LIFETIME: {
    name: "Lifetime",
    price: 4900, // $49.00 in cents
    priceId: STRIPE_PRICES.LIFETIME,
    features: ["Unlimited AI chats", "All Pro features", "One-time payment"],
    messagesPerDay: 1000,
  },
} as const

export type PlanType = keyof typeof PLANS
