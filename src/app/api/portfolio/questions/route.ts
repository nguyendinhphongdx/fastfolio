import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's portfolio with questions
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: { questions: true },
    })

    if (!portfolio) {
      return NextResponse.json({ questions: [] })
    }

    return NextResponse.json({
      questions: portfolio.questions.map(q => ({
        id: q.id,
        category: q.category,
        text: q.text,
      }))
    })
  } catch (error) {
    console.error("Questions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questions } = await req.json()

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Delete existing questions
    await prisma.question.deleteMany({
      where: { portfolioId: portfolio.id },
    })

    // Create new questions
    if (questions && questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map((q: { category: string; text: string }, index: number) => ({
          portfolioId: portfolio.id,
          category: q.category,
          text: q.text,
          order: index,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Questions update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
