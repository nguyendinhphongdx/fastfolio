import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"
import { verifyMoMoIPN, parseMoMoOrderId } from "@/lib/payment/momo/client"
import type { MoMoIPNParams } from "@/lib/payment/types"

/**
 * MoMo IPN (Instant Payment Notification) Handler
 * This is called server-to-server by MoMo to confirm payment
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as MoMoIPNParams

    // Verify the IPN
    const result = verifyMoMoIPN(body)

    if (!result.isValid) {
      console.error("MoMo IPN invalid signature")
      return NextResponse.json({ resultCode: 97, message: "Invalid signature" })
    }

    const orderId = body.orderId

    // Check if order exists
    const paymentHistory = await prisma.paymentHistory.findUnique({
      where: { transactionId: orderId },
    })

    if (!paymentHistory) {
      console.error("MoMo IPN order not found:", orderId)
      return NextResponse.json({ resultCode: 1, message: "Order not found" })
    }

    // Check if already processed
    if (paymentHistory.status === "SUCCESS") {
      return NextResponse.json({ resultCode: 0, message: "Order already confirmed" })
    }

    // Verify amount
    if (body.amount !== paymentHistory.amount) {
      console.error("MoMo IPN amount mismatch:", body.amount, paymentHistory.amount)
      return NextResponse.json({ resultCode: 4, message: "Invalid amount" })
    }

    // Parse order ID
    const orderInfo = parseMoMoOrderId(orderId)

    if (!orderInfo) {
      return NextResponse.json({ resultCode: 1, message: "Invalid order ID" })
    }

    if (result.isSuccess) {
      // Update payment history
      await prisma.paymentHistory.update({
        where: { transactionId: orderId },
        data: {
          status: "SUCCESS",
          metadata: {
            ...(paymentHistory.metadata as object || {}),
            momoTransId: body.transId,
            ipnConfirmed: true,
          },
        },
      })

      // Update subscription
      const plan = orderInfo.plan as Plan

      await prisma.subscription.upsert({
        where: { userId: orderInfo.userId },
        create: {
          userId: orderInfo.userId,
          plan,
          status: "ACTIVE",
          paymentProvider: "MOMO",
          momoTransactionId: String(body.transId),
          currentPeriodEnd:
            plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan,
          status: "ACTIVE",
          paymentProvider: "MOMO",
          momoTransactionId: String(body.transId),
          currentPeriodEnd:
            plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      return NextResponse.json({ resultCode: 0, message: "Confirm Success" })
    }

    // Payment failed
    await prisma.paymentHistory.update({
      where: { transactionId: orderId },
      data: {
        status: "FAILED",
        metadata: {
          ...(paymentHistory.metadata as object || {}),
          momoTransId: body.transId,
          failureReason: result.message,
          resultCode: body.resultCode,
        },
      },
    })

    return NextResponse.json({ resultCode: 0, message: "Received" })
  } catch (error) {
    console.error("MoMo IPN error:", error)
    return NextResponse.json({ resultCode: 99, message: "Unknown error" })
  }
}
