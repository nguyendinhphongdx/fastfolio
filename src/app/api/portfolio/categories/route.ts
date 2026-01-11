import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureCategoriesExist, getCategoriesWithQuestions } from "@/lib/suggested-categories"
import { getPlanLimits } from "@/lib/subscription"
import { getUserPlan } from "@/lib/subscription-service"

// GET - Fetch all categories with questions
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
      return NextResponse.json({ categories: [] })
    }

    // Ensure categories exist (creates defaults if needed)
    const categories = await ensureCategoriesExist(portfolio.id)

    return NextResponse.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        isSystem: cat.isSystem,
        order: cat.order,
        questions: cat.questions.map((q) => ({
          id: q.id,
          text: q.text,
          order: q.order,
        })),
      })),
    })
  } catch (error) {
    console.error("Categories fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new custom category
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, icon } = await req.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Check category limit based on plan
    const plan = await getUserPlan(session.user.id)
    const limits = getPlanLimits(plan)
    const maxCategories = limits.maxSkillCategories // Reusing skill categories limit

    const existingCount = await prisma.suggestedCategory.count({
      where: { portfolioId: portfolio.id },
    })

    if (maxCategories !== -1 && existingCount >= maxCategories) {
      return NextResponse.json(
        {
          error: `Category limit exceeded. Your ${plan} plan allows up to ${maxCategories} categories.`,
          type: "LIMIT_EXCEEDED",
          limit: maxCategories,
        },
        { status: 403 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Check if slug already exists
    const existingSlug = await prisma.suggestedCategory.findUnique({
      where: {
        portfolioId_slug: {
          portfolioId: portfolio.id,
          slug,
        },
      },
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      )
    }

    // Get max order
    const maxOrder = await prisma.suggestedCategory.findFirst({
      where: { portfolioId: portfolio.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    // Create category
    const category = await prisma.suggestedCategory.create({
      data: {
        portfolioId: portfolio.id,
        name: name.trim(),
        slug,
        icon: icon || "FolderOpen",
        isSystem: false,
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        questions: true,
      },
    })

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        isSystem: category.isSystem,
        order: category.order,
        questions: [],
      },
    })
  } catch (error) {
    console.error("Category create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
