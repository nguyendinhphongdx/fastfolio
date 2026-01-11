import { Plan } from "@prisma/client"

// ==========================================
// Plan Limits Configuration
// ==========================================

export const PLAN_LIMITS = {
  FREE: {
    // Chat limits
    messagesPerMonth: 50,

    // Portfolio limits
    maxProjects: 3,
    maxSkillCategories: 3,
    maxQuestions: 5,

    // Features
    customDomain: false,
    analytics: false,
    removeWatermark: false,
    prioritySupport: false,
    customAIProvider: false,

    // Storage
    maxAvatarSizeMB: 2,
    maxResumeSizeMB: 5,
  },
  PRO: {
    // Chat limits
    messagesPerMonth: 1000,

    // Portfolio limits
    maxProjects: 20,
    maxSkillCategories: 10,
    maxQuestions: 50,

    // Features
    customDomain: true,
    analytics: true,
    removeWatermark: true,
    prioritySupport: true,
    customAIProvider: true,

    // Storage
    maxAvatarSizeMB: 10,
    maxResumeSizeMB: 20,
  },
  LIFETIME: {
    // Chat limits
    messagesPerMonth: -1, // Unlimited

    // Portfolio limits
    maxProjects: -1, // Unlimited
    maxSkillCategories: -1, // Unlimited
    maxQuestions: -1, // Unlimited

    // Features
    customDomain: true,
    analytics: true,
    removeWatermark: true,
    prioritySupport: true,
    customAIProvider: true,

    // Storage
    maxAvatarSizeMB: 20,
    maxResumeSizeMB: 50,
  },
} as const

export type PlanLimits = typeof PLAN_LIMITS[Plan]

// ==========================================
// Plan Pricing (for display purposes)
// ==========================================

export const PLAN_PRICING = {
  FREE: {
    name: "Free",
    description: "Get started with basic features",
    price: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
  },
  PRO: {
    name: "Pro",
    description: "For professionals who need more",
    price: 9, // $9/month
    priceYearly: 90, // $90/year (save $18)
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  LIFETIME: {
    name: "Lifetime",
    description: "One-time payment, forever access",
    price: 149, // $149 one-time
    priceYearly: null,
    stripePriceIdMonthly: process.env.STRIPE_LIFETIME_PRICE_ID,
    stripePriceIdYearly: null,
  },
} as const

// ==========================================
// Helper Functions
// ==========================================

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function canAccessFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]

  if (typeof value === "boolean") {
    return value
  }

  // For numeric limits, -1 means unlimited, positive means enabled
  if (typeof value === "number") {
    return value === -1 || value > 0
  }

  return false
}

export function isWithinLimit(plan: Plan, feature: keyof PlanLimits, currentCount: number): boolean {
  const limits = getPlanLimits(plan)
  const limit = limits[feature]

  if (typeof limit !== "number") {
    return true
  }

  // -1 means unlimited
  if (limit === -1) {
    return true
  }

  return currentCount < limit
}

export function getRemainingLimit(plan: Plan, feature: keyof PlanLimits, currentCount: number): number {
  const limits = getPlanLimits(plan)
  const limit = limits[feature]

  if (typeof limit !== "number") {
    return 0
  }

  // -1 means unlimited
  if (limit === -1) {
    return -1
  }

  return Math.max(0, limit - currentCount)
}

export function formatLimit(limit: number): string {
  if (limit === -1) {
    return "Unlimited"
  }
  return limit.toLocaleString()
}

// ==========================================
// Plan Comparison (for pricing page)
// ==========================================

export const PLAN_FEATURES = [
  {
    name: "AI Chat Messages",
    free: "50/month",
    pro: "1,000/month",
    lifetime: "Unlimited",
  },
  {
    name: "Projects",
    free: "3",
    pro: "20",
    lifetime: "Unlimited",
  },
  {
    name: "Skill Categories",
    free: "3",
    pro: "10",
    lifetime: "Unlimited",
  },
  {
    name: "Custom AI Provider",
    description: "Use your own OpenAI, Claude, or Gemini API key",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Custom Domain",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Analytics Dashboard",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Remove Watermark",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Priority Support",
    free: false,
    pro: true,
    lifetime: true,
  },
] as const
