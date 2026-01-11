import { Plan, PaymentProvider } from "@prisma/client"
import type { PaymentMethod, PlanPricingConfig, Currency } from "./types"

// ==========================================
// Plan Pricing Configuration
// ==========================================

export const PLAN_PRICING: PlanPricingConfig = {
  PRO: {
    monthly: {
      USD: 800, // $8.00 in cents
      VND: 199000, // 199,000 VND
    },
    yearly: {
      USD: 8000, // $80.00 in cents (save ~17%)
      VND: 1990000, // 1,990,000 VND
    },
  },
  LIFETIME: {
    oneTime: {
      USD: 4900, // $49.00 in cents
      VND: 1190000, // 1,190,000 VND
    },
  },
}

// ==========================================
// Payment Methods Configuration
// ==========================================

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "STRIPE" as PaymentProvider,
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, AMEX",
    icon: "credit-card",
    currencies: ["USD"],
    supportedPlans: ["PRO", "LIFETIME"] as Plan[],
    supportsRecurring: true,
  },
  {
    id: "VNPAY" as PaymentProvider,
    name: "VNPay",
    description: "ATM nội địa, Visa, QR Pay",
    icon: "vnpay",
    currencies: ["VND"],
    supportedPlans: ["PRO", "LIFETIME"] as Plan[],
    supportsRecurring: true,
  },
  {
    id: "MOMO" as PaymentProvider,
    name: "MoMo",
    description: "Ví điện tử MoMo",
    icon: "momo",
    currencies: ["VND"],
    supportedPlans: ["PRO", "LIFETIME"] as Plan[],
    supportsRecurring: true,
  },
]

// ==========================================
// Helper Functions
// ==========================================

export function getPaymentMethod(provider: PaymentProvider): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((m) => m.id === provider)
}

export function getPaymentMethodsForCurrency(currency: Currency): PaymentMethod[] {
  return PAYMENT_METHODS.filter((m) => m.currencies.includes(currency))
}

export function getPlanPrice(
  plan: Exclude<Plan, "FREE">,
  currency: Currency,
  billingCycle?: "monthly" | "yearly"
): number {
  const pricing = PLAN_PRICING[plan]

  if (plan === "LIFETIME") {
    return pricing.oneTime?.[currency] ?? 0
  }

  if (billingCycle === "yearly") {
    return pricing.yearly?.[currency] ?? 0
  }

  return pricing.monthly?.[currency] ?? 0
}

export function getPlanPriceDisplay(
  plan: Exclude<Plan, "FREE">,
  currency: Currency,
  billingCycle?: "monthly" | "yearly"
): { amount: number; period: string } {
  const amount = getPlanPrice(plan, currency, billingCycle)

  if (plan === "LIFETIME") {
    return { amount, period: "" }
  }

  if (billingCycle === "yearly") {
    return { amount, period: "/year" }
  }

  return { amount, period: "/month" }
}

// ==========================================
// Environment Config
// ==========================================

export const VNPAY_CONFIG = {
  tmnCode: process.env.VNPAY_TMN_CODE || "",
  hashSecret: process.env.VNPAY_HASH_SECRET || "",
  url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  apiUrl:
    process.env.VNPAY_API_URL ||
    "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vnpay/return`,
  ipnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vnpay/ipn`,
}

export const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "",
  accessKey: process.env.MOMO_ACCESS_KEY || "",
  secretKey: process.env.MOMO_SECRET_KEY || "",
  apiEndpoint:
    process.env.MOMO_API_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api",
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/momo/callback`,
  ipnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/momo/ipn`,
}
