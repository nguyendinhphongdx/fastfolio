"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Zap, Crown, Sparkles } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Perfect for getting started",
    features: ["10 AI chats/day", "Basic analytics", "Custom username"],
    planKey: "FREE" as const,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/mo",
    description: "For professionals who need more",
    features: ["100 AI chats/day", "Advanced analytics", "Priority support"],
    planKey: "PRO" as const,
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$49",
    period: "",
    description: "One-time payment, forever access",
    features: ["Unlimited AI chats", "All Pro features", "One-time payment"],
    planKey: "LIFETIME" as const,
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const [currentPlan, setCurrentPlan] = useState<string>("FREE")
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    // Fetch current subscription status
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/user/subscription")
        if (res.ok) {
          const data = await res.json()
          setCurrentPlan(data.plan || "FREE")
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error)
      }
    }
    fetchSubscription()
  }, [])

  const handleUpgrade = async (plan: "PRO" | "LIFETIME") => {
    if (!session) return

    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("No checkout URL received")
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoading(null)
    }
  }

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case "FREE":
        return <Zap className="h-5 w-5" />
      case "PRO":
        return <Sparkles className="h-5 w-5" />
      case "LIFETIME":
        return <Crown className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPlanIcon(currentPlan)}
            Current Plan: {currentPlan}
          </CardTitle>
          <CardDescription>
            {currentPlan === "FREE" && "Upgrade to unlock more features"}
            {currentPlan === "PRO" && "You have access to all Pro features"}
            {currentPlan === "LIFETIME" && "You have lifetime access to all features"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.planKey}
            className={`relative ${
              plan.popular ? "border-primary shadow-md" : ""
            } ${currentPlan === plan.planKey ? "bg-muted/50" : ""}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Popular
              </span>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(plan.planKey)}
                {plan.name}
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {currentPlan === plan.planKey ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : plan.planKey === "FREE" ? (
                <Button variant="outline" disabled className="w-full">
                  Free Forever
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade(plan.planKey)}
                  disabled={loading !== null}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loading === plan.planKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel my subscription?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel anytime. Your access will continue until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards via Stripe.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Is Lifetime really forever?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! One payment, lifetime access. No recurring fees.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
