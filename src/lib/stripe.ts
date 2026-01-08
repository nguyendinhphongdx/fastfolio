import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
})

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
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ["100 AI chats/day", "Advanced analytics", "Priority support"],
    messagesPerDay: 100,
  },
  LIFETIME: {
    name: "Lifetime",
    price: 4900, // $49.00 in cents
    priceId: process.env.STRIPE_LIFETIME_PRICE_ID,
    features: ["Unlimited AI chats", "All Pro features", "One-time payment"],
    messagesPerDay: 1000,
  },
} as const

export type PlanType = keyof typeof PLANS
