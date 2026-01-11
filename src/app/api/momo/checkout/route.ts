import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"
import { createMoMoPayment, createMoMoOrderId } from "@/lib/payment/momo/client"
import { generateRequestId } from "@/lib/payment/momo/crypto"
import { getPlanPrice } from "@/lib/payment/config"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan, billingCycle } = await req.json()

    // Validate plan
    if (!["PRO", "LIFETIME"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Get price in VND
    const amount = getPlanPrice(plan as Exclude<Plan, "FREE">, "VND", billingCycle)

    if (!amount) {
      return NextResponse.json({ error: "Invalid pricing" }, { status: 400 })
    }

    // Create order ID with user info
    const orderId = createMoMoOrderId(session.user.id, plan)
    const requestId = generateRequestId()

    // Create payment history record
    await prisma.paymentHistory.create({
      data: {
        userId: session.user.id,
        provider: "MOMO",
        transactionId: orderId,
        amount,
        currency: "VND",
        status: "PENDING",
        plan: plan as Plan,
        metadata: { billingCycle, requestId },
      },
    })

    // Create MoMo payment
    const result = await createMoMoPayment({
      orderId,
      amount,
      orderInfo: `Fastfolio ${plan} Plan`,
      requestId,
      extraData: Buffer.from(JSON.stringify({ userId: session.user.id, plan })).toString("base64"),
    })

    if (result.resultCode !== 0) {
      // Update payment history with failure
      await prisma.paymentHistory.update({
        where: { transactionId: orderId },
        data: {
          status: "FAILED",
          metadata: { error: result.message, resultCode: result.resultCode },
        },
      })

      return NextResponse.json(
        { error: result.message || "Failed to create MoMo payment" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      url: result.payUrl,
      shortLink: result.shortLink,
    })
  } catch (error) {
    console.error("MoMo checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}
