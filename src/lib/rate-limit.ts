import { prisma } from "./prisma"

interface RateLimitConfig {
  FREE: number
  PRO: number
  LIFETIME: number
}

const RATE_LIMITS: RateLimitConfig = {
  FREE: 10, // 10 messages per visitor per day
  PRO: 100, // 100 messages per visitor per day
  LIFETIME: 1000, // 1000 messages per visitor per day (soft limit)
}

export async function checkRateLimit(
  portfolioId: string,
  visitorId: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Get portfolio owner's plan
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!portfolio) {
    return { allowed: false, remaining: 0, limit: 0 }
  }

  const plan = portfolio.user.subscription?.plan || "FREE"
  const limit = RATE_LIMITS[plan]

  // Count messages in the last 24 hours for this visitor
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const conversation = await prisma.conversation.findFirst({
    where: {
      portfolioId,
      visitorId,
      createdAt: { gte: oneDayAgo },
    },
    include: {
      _count: {
        select: {
          messages: {
            where: {
              role: "USER",
              createdAt: { gte: oneDayAgo },
            },
          },
        },
      },
    },
  })

  const messageCount = conversation?._count.messages || 0
  const remaining = Math.max(0, limit - messageCount)
  const allowed = messageCount < limit

  return { allowed, remaining, limit }
}

export async function incrementMessageCount(
  portfolioId: string,
  visitorId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      portfolioId,
      visitorId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        portfolioId,
        visitorId,
      },
    })
  }

  // Add messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: "USER",
        content: userMessage,
      },
      {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: assistantMessage,
      },
    ],
  })

  // Update message count
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: {
        increment: 2,
      },
    },
  })
}
