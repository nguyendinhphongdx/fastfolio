import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/lib/subscription"
import { getUserPlan } from "@/lib/subscription-service"

interface RouteParams {
  params: Promise<{ categoryId: string }>
}

// POST - Add a question to a category
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { categoryId } = await params
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 })
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Verify category belongs to user's portfolio
    const category = await prisma.suggestedCategory.findFirst({
      where: {
        id: categoryId,
        portfolioId: portfolio.id,
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check question limit based on plan
    const plan = await getUserPlan(session.user.id)
    const limits = getPlanLimits(plan)
    const maxQuestions = limits.maxQuestions

    const totalQuestions = await prisma.question.count({
      where: { portfolioId: portfolio.id },
    })

    if (maxQuestions !== -1 && totalQuestions >= maxQuestions) {
      return NextResponse.json(
        {
          error: `Question limit exceeded. Your ${plan} plan allows up to ${maxQuestions} questions total.`,
          type: "LIMIT_EXCEEDED",
          limit: maxQuestions,
        },
        { status: 403 }
      )
    }

    // Get max order in category
    const maxOrder = await prisma.question.findFirst({
      where: { categoryId },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    // Create question
    const question = await prisma.question.create({
      data: {
        portfolioId: portfolio.id,
        categoryId,
        text: text.trim(),
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({
      question: {
        id: question.id,
        text: question.text,
        order: question.order,
      },
    })
  } catch (error) {
    console.error("Question create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update questions in a category (bulk update)
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { categoryId } = await params
    const { questions } = await req.json()

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Questions array is required" }, { status: 400 })
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Verify category belongs to user's portfolio
    const category = await prisma.suggestedCategory.findFirst({
      where: {
        id: categoryId,
        portfolioId: portfolio.id,
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check total question limit based on plan
    const plan = await getUserPlan(session.user.id)
    const limits = getPlanLimits(plan)
    const maxQuestions = limits.maxQuestions

    // Count questions in other categories
    const otherQuestionsCount = await prisma.question.count({
      where: {
        portfolioId: portfolio.id,
        categoryId: { not: categoryId },
      },
    })

    const totalAfterUpdate = otherQuestionsCount + questions.length

    if (maxQuestions !== -1 && totalAfterUpdate > maxQuestions) {
      return NextResponse.json(
        {
          error: `Question limit exceeded. Your ${plan} plan allows up to ${maxQuestions} questions total.`,
          type: "LIMIT_EXCEEDED",
          limit: maxQuestions,
          current: otherQuestionsCount,
          requested: questions.length,
        },
        { status: 403 }
      )
    }

    // Delete existing questions in this category
    await prisma.question.deleteMany({
      where: { categoryId },
    })

    // Create new questions
    if (questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map((q: { text: string }, index: number) => ({
          portfolioId: portfolio.id,
          categoryId,
          text: q.text.trim(),
          order: index,
        })),
      })
    }

    // Fetch updated questions
    const updatedQuestions = await prisma.question.findMany({
      where: { categoryId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({
      questions: updatedQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        order: q.order,
      })),
    })
  } catch (error) {
    console.error("Questions update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
