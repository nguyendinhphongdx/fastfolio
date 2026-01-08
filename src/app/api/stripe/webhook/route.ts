import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as "PRO" | "LIFETIME"

        if (!userId || !plan) {
          console.error("Missing metadata in checkout session")
          break
        }

        // Update or create subscription
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string | null,
            status: "ACTIVE",
            currentPeriodEnd: plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string | null,
            status: "ACTIVE",
            currentPeriodEnd: plan === "LIFETIME"
              ? new Date("2099-12-31")
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })

        console.log(`Subscription updated for user ${userId} to ${plan}`)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const stripeSubscriptionId = subscription.id

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId },
          data: {
            status: subscription.status === "active" ? "ACTIVE" : "CANCELED",
            currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const stripeSubscriptionId = subscription.id

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId },
          data: {
            status: "CANCELED",
            plan: "FREE",
          },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            status: "PAST_DUE",
          },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
