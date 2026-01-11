import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ categoryId: string }>
}

// PUT - Update a category
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { categoryId } = await params
    const { name, icon, order } = await req.json()

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

    // Update category
    const updatedCategory = await prisma.suggestedCategory.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        icon: updatedCategory.icon,
        isSystem: updatedCategory.isSystem,
        order: updatedCategory.order,
        questions: updatedCategory.questions.map((q) => ({
          id: q.id,
          text: q.text,
          order: q.order,
        })),
      },
    })
  } catch (error) {
    console.error("Category update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a custom category (only non-system categories can be deleted)
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { categoryId } = await params

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

    // System categories cannot be deleted, but their questions can be modified
    if (category.isSystem) {
      return NextResponse.json(
        { error: "System categories cannot be deleted" },
        { status: 403 }
      )
    }

    // Delete category (this will cascade delete questions)
    await prisma.suggestedCategory.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Category delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
