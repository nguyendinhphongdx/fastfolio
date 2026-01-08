import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's portfolio
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { portfolio: true },
    })

    if (!user?.portfolio) {
      return NextResponse.json({
        totalMessages: 0,
        totalConversations: 0,
        totalPageViews: 0,
        messagesThisWeek: 0,
        topQuestions: [],
        messagesByDay: [],
      })
    }

    const portfolioId = user.portfolio.id
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get total messages count
    const totalMessages = await prisma.message.count({
      where: {
        conversation: {
          portfolioId,
        },
        role: "USER",
      },
    })

    // Get total conversations count
    const totalConversations = await prisma.conversation.count({
      where: { portfolioId },
    })

    // Get total page views
    const totalPageViews = await prisma.pageView.count({
      where: { portfolioId },
    })

    // Get messages this week
    const messagesThisWeek = await prisma.message.count({
      where: {
        conversation: {
          portfolioId,
        },
        role: "USER",
        createdAt: { gte: oneWeekAgo },
      },
    })

    // Get top questions (most common user messages)
    const recentMessages = await prisma.message.findMany({
      where: {
        conversation: {
          portfolioId,
        },
        role: "USER",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { content: true },
    })

    // Group and count messages
    const questionCounts = recentMessages.reduce((acc, msg) => {
      const content = msg.content.slice(0, 100) // Truncate for grouping
      acc[content] = (acc[content] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }))

    // Get messages by day for the last 7 days
    const messagesByDay = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const count = await prisma.message.count({
        where: {
          conversation: {
            portfolioId,
          },
          role: "USER",
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      messagesByDay.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      })
    }

    return NextResponse.json({
      totalMessages,
      totalConversations,
      totalPageViews,
      messagesThisWeek,
      topQuestions,
      messagesByDay,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
