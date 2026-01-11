import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"
import { verifyVNPayReturn, parseVNPayOrderId } from "@/lib/payment/vnpay/client"
import type { VNPayReturnParams } from "@/lib/payment/types"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries()) as unknown as VNPayReturnParams

    // Verify the return params
    const result = verifyVNPayReturn(params)

    if (!result.isValid) {
      console.error("VNPay return invalid:", result.message)
      return NextResponse.redirect(
        new URL("/billing?error=invalid_signature", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    const orderId = result.orderId || params.vnp_TxnRef

    // Parse order ID to get user info
    const orderInfo = parseVNPayOrderId(orderId)

    if (!orderInfo) {
      console.error("VNPay invalid order ID:", orderId)
      return NextResponse.redirect(
        new URL("/billing?error=invalid_order", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // Update payment history
    await prisma.paymentHistory.update({
      where: { transactionId: orderId },
      data: {
        status: result.isSuccess ? "SUCCESS" : "FAILED",
        metadata: {
          vnpayTransactionNo: result.transactionNo,
          responseMessage: result.message,
        },
      },
    })

    if (result.isSuccess) {
      // Update or create subscription
      const plan = orderInfo.plan as Plan

      await prisma.subscription.upsert({
        where: { userId: orderInfo.userId },
        create: {
          userId: orderInfo.userId,
          plan,
          status: "ACTIVE",
          paymentProvider: "VNPAY",
          vnpayTransactionNo: result.transactionNo,
          currentPeriodEnd:
            plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        update: {
          plan,
          status: "ACTIVE",
          paymentProvider: "VNPAY",
          vnpayTransactionNo: result.transactionNo,
          currentPeriodEnd:
            plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      return NextResponse.redirect(
        new URL("/billing?success=true", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // Payment failed
    return NextResponse.redirect(
      new URL(`/billing?error=payment_failed&message=${encodeURIComponent(result.message)}`, process.env.NEXT_PUBLIC_APP_URL!)
    )
  } catch (error) {
    console.error("VNPay return error:", error)
    return NextResponse.redirect(
      new URL("/billing?error=server_error", process.env.NEXT_PUBLIC_APP_URL!)
    )
  }
}
