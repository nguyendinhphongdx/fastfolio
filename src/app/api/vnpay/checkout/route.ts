import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"
import { createVNPayPaymentUrl, createVNPayOrderId } from "@/lib/payment/vnpay/client"
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

    // Get client IP
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1"

    // Create order ID with user info
    const orderId = createVNPayOrderId(session.user.id, plan)

    // Create payment history record
    await prisma.paymentHistory.create({
      data: {
        userId: session.user.id,
        provider: "VNPAY",
        transactionId: orderId,
        amount,
        currency: "VND",
        status: "PENDING",
        plan: plan as Plan,
        metadata: { billingCycle },
      },
    })

    // Create VNPay payment URL
    const paymentUrl = createVNPayPaymentUrl({
      orderId,
      amount,
      orderInfo: `Fastfolio ${plan} Plan`,
      ipAddr: ip,
      locale: "vn",
    })

    return NextResponse.json({ url: paymentUrl })
  } catch (error) {
    console.error("VNPay checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}
