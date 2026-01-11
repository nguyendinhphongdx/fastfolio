import { Plan } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getPlanLimits, isWithinLimit, getRemainingLimit } from "@/lib/subscription"

// ==========================================
// Get User Subscription
// ==========================================

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  // If no subscription exists, user is on FREE plan
  if (!subscription) {
    return {
      plan: "FREE" as Plan,
      status: "ACTIVE" as const,
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    }
  }

  return subscription
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await getUserSubscription(userId)
  return subscription.plan
}

// ==========================================
// Usage Tracking
// ==========================================

export async function getMonthlyMessageCount(portfolioId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await prisma.message.count({
    where: {
      conversation: {
        portfolioId,
      },
      role: "ASSISTANT", // Count AI responses
      createdAt: {
        gte: startOfMonth,
      },
    },
  })

  return count
}

export async function getProjectCount(portfolioId: string): Promise<number> {
  return prisma.project.count({
    where: { portfolioId },
  })
}

export async function getSkillCategoryCount(portfolioId: string): Promise<number> {
  return prisma.skillCategory.count({
    where: { portfolioId },
  })
}

export async function getQuestionCount(portfolioId: string): Promise<number> {
  return prisma.question.count({
    where: { portfolioId },
  })
}

// ==========================================
// Limit Checking
// ==========================================

export type LimitCheckResult = {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  plan: Plan
}

export async function checkMessageLimit(userId: string, portfolioId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  const current = await getMonthlyMessageCount(portfolioId)
  const limit = limits.messagesPerMonth

  return {
    allowed: isWithinLimit(plan, "messagesPerMonth", current),
    current,
    limit,
    remaining: getRemainingLimit(plan, "messagesPerMonth", current),
    plan,
  }
}

export async function checkProjectLimit(userId: string, portfolioId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  const current = await getProjectCount(portfolioId)
  const limit = limits.maxProjects

  return {
    allowed: isWithinLimit(plan, "maxProjects", current),
    current,
    limit,
    remaining: getRemainingLimit(plan, "maxProjects", current),
    plan,
  }
}

export async function checkSkillCategoryLimit(userId: string, portfolioId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  const current = await getSkillCategoryCount(portfolioId)
  const limit = limits.maxSkillCategories

  return {
    allowed: isWithinLimit(plan, "maxSkillCategories", current),
    current,
    limit,
    remaining: getRemainingLimit(plan, "maxSkillCategories", current),
    plan,
  }
}

export async function checkQuestionLimit(userId: string, portfolioId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  const current = await getQuestionCount(portfolioId)
  const limit = limits.maxQuestions

  return {
    allowed: isWithinLimit(plan, "maxQuestions", current),
    current,
    limit,
    remaining: getRemainingLimit(plan, "maxQuestions", current),
    plan,
  }
}

export async function canUseCustomDomain(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  return limits.customDomain
}

export async function canAccessAnalytics(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  return limits.analytics
}

// ==========================================
// Get All Usage Stats
// ==========================================

export type UsageStats = {
  plan: Plan
  messages: LimitCheckResult
  projects: LimitCheckResult
  skillCategories: LimitCheckResult
  questions: LimitCheckResult
  features: {
    customDomain: boolean
    analytics: boolean
    removeWatermark: boolean
    prioritySupport: boolean
  }
}

export async function getUserUsageStats(userId: string, portfolioId: string): Promise<UsageStats> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)

  const [messages, projects, skillCategories, questions] = await Promise.all([
    checkMessageLimit(userId, portfolioId),
    checkProjectLimit(userId, portfolioId),
    checkSkillCategoryLimit(userId, portfolioId),
    checkQuestionLimit(userId, portfolioId),
  ])

  return {
    plan,
    messages,
    projects,
    skillCategories,
    questions,
    features: {
      customDomain: limits.customDomain,
      analytics: limits.analytics,
      removeWatermark: limits.removeWatermark,
      prioritySupport: limits.prioritySupport,
    },
  }
}
