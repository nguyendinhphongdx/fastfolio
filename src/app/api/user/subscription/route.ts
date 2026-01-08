import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      plan: user.subscription?.plan || "FREE",
      status: user.subscription?.status || "ACTIVE",
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
    })
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
