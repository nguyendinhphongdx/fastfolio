import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserUsageStats, getUserSubscription } from "@/lib/subscription-service"
import { PLAN_PRICING, PLAN_LIMITS } from "@/lib/subscription"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Get subscription and usage stats
    const [subscription, usageStats] = await Promise.all([
      getUserSubscription(userId),
      getUserUsageStats(userId, portfolio.id),
    ])

    // Get plan details
    const planDetails = PLAN_PRICING[usageStats.plan]
    const planLimits = PLAN_LIMITS[usageStats.plan]

    return NextResponse.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      usage: usageStats,
      planDetails,
      planLimits,
    })
  } catch (error) {
    console.error("Failed to get subscription:", error)
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    )
  }
}
