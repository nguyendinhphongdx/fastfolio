"use client"

import { Plan } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Zap, Crown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Currency } from "@/lib/payment/types"
import { formatPrice, getPlanPrice } from "@/lib/payment"

interface PlanCardProps {
  plan: Plan
  currency: Currency
  currentPlan: Plan
  isLoading: boolean
  onUpgrade: (plan: Plan) => void
  billingCycle?: "monthly" | "yearly"
}

const PLAN_DETAILS = {
  FREE: {
    name: "Free",
    description: "Perfect for getting started",
    features: ["50 AI chats/month", "3 projects", "Basic analytics"],
    icon: Zap,
  },
  PRO: {
    name: "Pro",
    description: "For professionals who need more",
    features: [
      "1,000 AI chats/month",
      "20 projects",
      "Custom AI Provider (OpenAI, Claude, Gemini)",
      "Advanced analytics",
      "Custom domain",
      "Priority support",
    ],
    icon: Sparkles,
    popular: true,
  },
  LIFETIME: {
    name: "Lifetime",
    description: "One-time payment, forever access",
    features: [
      "Unlimited AI chats",
      "Unlimited projects",
      "Custom AI Provider (OpenAI, Claude, Gemini)",
      "All Pro features",
      "Lifetime updates",
    ],
    icon: Crown,
  },
}

export function PlanCard({
  plan,
  currency,
  currentPlan,
  isLoading,
  onUpgrade,
  billingCycle = "monthly",
}: PlanCardProps) {
  const details = PLAN_DETAILS[plan]
  const Icon = details.icon
  const isCurrentPlan = currentPlan === plan
  const isPopular = "popular" in details && details.popular

  // Get price
  const price = plan === "FREE" ? 0 : getPlanPrice(plan, currency, billingCycle)
  const priceDisplay = plan === "FREE" ? formatPrice(0, currency) : formatPrice(price, currency)
  const period = plan === "FREE" ? "" : plan === "LIFETIME" ? "" : billingCycle === "yearly" ? "/year" : "/month"

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-primary shadow-md",
        isCurrentPlan && "bg-muted/50"
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {details.name}
        </CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{priceDisplay}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <CardDescription>{details.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <ul className="space-y-2">
          {details.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="pt-4">
          {isCurrentPlan ? (
            <Button disabled className="w-full">
              Current Plan
            </Button>
          ) : plan === "FREE" ? (
            <Button variant="outline" disabled className="w-full">
              Free Forever
            </Button>
          ) : (
            <Button
              onClick={() => onUpgrade(plan)}
              disabled={isLoading}
              className="w-full"
              variant={isPopular ? "default" : "outline"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Upgrade to ${details.name}`
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
