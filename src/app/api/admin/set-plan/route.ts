import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"

// Lấy danh sách admin emails từ env
function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS || ""
  return emails.split(",").map((e) => e.trim()).filter(Boolean)
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email)
}

// Simple admin endpoint to set user plan
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { plan, userId } = body

    // Validate plan
    if (!plan || !["FREE", "PRO", "LIFETIME"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be FREE, PRO, or LIFETIME" },
        { status: 400 }
      )
    }

    // Use provided userId or current user's id
    const targetUserId = userId || session.user.id

    // Update user's subscription
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        subscription: {
          upsert: {
            create: {
              plan: plan as Plan,
              status: "ACTIVE",
            },
            update: {
              plan: plan as Plan,
              status: "ACTIVE",
            },
          },
        },
      },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Plan updated to ${plan}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscription: updatedUser.subscription,
      },
    })
  } catch (error) {
    console.error("Set plan error:", error)
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    )
  }
}

// GET current user's plan
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json({
      user: {
        id: user?.id,
        email: user?.email,
        subscription: user?.subscription,
      },
    })
  } catch (error) {
    console.error("Get plan error:", error)
    return NextResponse.json(
      { error: "Failed to get plan" },
      { status: 500 }
    )
  }
}
