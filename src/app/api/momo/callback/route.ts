import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"
import { parseMoMoOrderId, MOMO_RESULT_CODES } from "@/lib/payment/momo/client"

/**
 * MoMo redirect callback (user return URL)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())

    const orderId = params.orderId
    const resultCode = parseInt(params.resultCode || "99")
    const message = params.message || MOMO_RESULT_CODES[resultCode] || "Unknown error"

    if (!orderId) {
      return NextResponse.redirect(
        new URL("/billing?error=invalid_order", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // Parse order ID
    const orderInfo = parseMoMoOrderId(orderId)

    if (!orderInfo) {
      return NextResponse.redirect(
        new URL("/billing?error=invalid_order", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // Check payment status
    const paymentHistory = await prisma.paymentHistory.findUnique({
      where: { transactionId: orderId },
    })

    if (!paymentHistory) {
      return NextResponse.redirect(
        new URL("/billing?error=order_not_found", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // If IPN already processed successfully, redirect to success
    if (paymentHistory.status === "SUCCESS") {
      return NextResponse.redirect(
        new URL("/billing?success=true", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // Payment successful via return URL (backup for IPN)
    if (resultCode === 0) {
      const transId = params.transId

      // Update payment history
      await prisma.paymentHistory.update({
        where: { transactionId: orderId },
        data: {
          status: "SUCCESS",
          metadata: {
            ...(paymentHistory.metadata as object || {}),
            momoTransId: transId,
            returnCallback: true,
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
          momoTransactionId: transId,
          currentPeriodEnd:
            plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan,
          status: "ACTIVE",
          paymentProvider: "MOMO",
          momoTransactionId: transId,
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
    await prisma.paymentHistory.update({
      where: { transactionId: orderId },
      data: {
        status: "FAILED",
        metadata: {
          ...(paymentHistory.metadata as object || {}),
          failureReason: message,
          resultCode,
        },
      },
    })

    return NextResponse.redirect(
      new URL(`/billing?error=payment_failed&message=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL!)
    )
  } catch (error) {
    console.error("MoMo callback error:", error)
    return NextResponse.redirect(
      new URL("/billing?error=server_error", process.env.NEXT_PUBLIC_APP_URL!)
    )
  }
}
