import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Plan } from "@prisma/client"
import { verifyVNPayReturn, parseVNPayOrderId } from "@/lib/payment/vnpay/client"
import type { VNPayReturnParams } from "@/lib/payment/types"

/**
 * VNPay IPN (Instant Payment Notification) Handler
 * This is called server-to-server by VNPay to confirm payment
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries()) as unknown as VNPayReturnParams

    // Verify the IPN params
    const result = verifyVNPayReturn(params)

    if (!result.isValid) {
      console.error("VNPay IPN invalid signature")
      return NextResponse.json({ RspCode: "97", Message: "Invalid signature" })
    }

    const orderId = result.orderId || params.vnp_TxnRef

    // Check if order exists
    const paymentHistory = await prisma.paymentHistory.findUnique({
      where: { transactionId: orderId },
    })

    if (!paymentHistory) {
      console.error("VNPay IPN order not found:", orderId)
      return NextResponse.json({ RspCode: "01", Message: "Order not found" })
    }

    // Check if already processed
    if (paymentHistory.status === "SUCCESS") {
      return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" })
    }

    // Verify amount
    const vnpAmount = parseInt(params.vnp_Amount) / 100 // VNPay sends amount * 100
    if (vnpAmount !== paymentHistory.amount) {
      console.error("VNPay IPN amount mismatch:", vnpAmount, paymentHistory.amount)
      return NextResponse.json({ RspCode: "04", Message: "Invalid amount" })
    }

    // Parse order ID
    const orderInfo = parseVNPayOrderId(orderId)

    if (!orderInfo) {
      return NextResponse.json({ RspCode: "01", Message: "Invalid order ID" })
    }

    if (result.isSuccess) {
      // Update payment history
      await prisma.paymentHistory.update({
        where: { transactionId: orderId },
        data: {
          status: "SUCCESS",
          metadata: {
            ...(paymentHistory.metadata as object || {}),
            vnpayTransactionNo: result.transactionNo,
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
          paymentProvider: "VNPAY",
          vnpayTransactionNo: result.transactionNo,
          currentPeriodEnd:
            plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" })
    }

    // Payment failed
    await prisma.paymentHistory.update({
      where: { transactionId: orderId },
      data: {
        status: "FAILED",
        metadata: {
          ...(paymentHistory.metadata as object || {}),
          vnpayTransactionNo: result.transactionNo,
          failureReason: result.message,
        },
      },
    })

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" })
  } catch (error) {
    console.error("VNPay IPN error:", error)
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" })
  }
}
