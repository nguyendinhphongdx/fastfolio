"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Zap, Lock } from "lucide-react"

type UpgradePromptProps = {
  feature: string
  description?: string
  currentPlan?: string
  variant?: "card" | "inline" | "modal"
}

export function UpgradePrompt({
  feature,
  description,
  currentPlan = "Free",
  variant = "card",
}: UpgradePromptProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Lock className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            {feature} is a Pro feature
          </p>
          {description && (
            <p className="text-xs text-amber-600 mt-0.5">{description}</p>
          )}
        </div>
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="shrink-0">
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock {feature} and more
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {description || `You've reached the ${currentPlan} plan limit for ${feature.toLowerCase()}. Upgrade to Pro to unlock unlimited access.`}
        </p>
        <div className="flex gap-2">
          <Link href="/pricing" className="flex-1">
            <Button className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

type LimitReachedProps = {
  type: "messages" | "projects" | "skills" | "questions"
  current: number
  limit: number
}

export function LimitReached({ type, current, limit }: LimitReachedProps) {
  const typeLabels = {
    messages: "AI chat messages",
    projects: "projects",
    skills: "skill categories",
    questions: "suggested questions",
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-full">
          <Lock className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-red-800">Limit Reached</h4>
          <p className="text-sm text-red-600 mt-1">
            You've used {current} of {limit} {typeLabels[type]} this month.
            Upgrade to Pro for more.
          </p>
          <Link href="/pricing">
            <Button size="sm" className="mt-3">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

type UsageBadgeProps = {
  current: number
  limit: number
  showWarning?: boolean
}

export function UsageBadge({ current, limit, showWarning = true }: UsageBadgeProps) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  if (limit === -1) {
    return (
      <span className="text-xs text-muted-foreground">
        {current} used (Unlimited)
      </span>
    )
  }

  return (
    <span
      className={`text-xs ${
        isAtLimit
          ? "text-red-600 font-medium"
          : isNearLimit && showWarning
          ? "text-amber-600"
          : "text-muted-foreground"
      }`}
    >
      {current}/{limit} used
      {isAtLimit && " (Limit reached)"}
      {isNearLimit && !isAtLimit && showWarning && " (Near limit)"}
    </span>
  )
}
