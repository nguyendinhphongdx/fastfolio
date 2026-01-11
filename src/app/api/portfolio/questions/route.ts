import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureCategoriesExist } from "@/lib/suggested-categories"

/**
 * @deprecated Use /api/portfolio/categories instead
 * This endpoint is kept for backward compatibility
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ questions: [] })
    }

    // Ensure categories exist and get them with questions
    const categories = await ensureCategoriesExist(portfolio.id)

    // Flatten questions with category info for backward compatibility
    const questions = categories.flatMap(cat =>
      cat.questions.map(q => ({
        id: q.id,
        categoryId: cat.id,
        categorySlug: cat.slug,
        categoryName: cat.name,
        text: q.text,
      }))
    )

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Questions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
