"use client"

import { useState, useEffect, useCallback } from "react"
import { Plan } from "@prisma/client"
import type { UsageStats } from "@/lib/subscription-service"
import type { PlanLimits } from "@/lib/subscription"

type SubscriptionData = {
  subscription: {
    plan: Plan
    status: string
    currentPeriodEnd: string | null
  }
  usage: UsageStats
  planDetails: {
    name: string
    description: string
    price: number
    priceYearly: number | null
  }
  planLimits: PlanLimits
}

type UseSubscriptionReturn = {
  data: SubscriptionData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  // Convenience helpers
  plan: Plan | null
  isPro: boolean
  isLifetime: boolean
  isFree: boolean
  canUseFeature: (feature: keyof PlanLimits) => boolean
  isWithinLimit: (type: "messages" | "projects" | "skillCategories" | "questions") => boolean
  getRemainingCount: (type: "messages" | "projects" | "skillCategories" | "questions") => number
}

export function useSubscription(): UseSubscriptionReturn {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch("/api/subscription")

      if (!res.ok) {
        throw new Error("Failed to fetch subscription")
      }

      const subscriptionData = await res.json()
      setData(subscriptionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const plan = data?.subscription.plan ?? null
  const isPro = plan === "PRO"
  const isLifetime = plan === "LIFETIME"
  const isFree = plan === "FREE"

  const canUseFeature = useCallback(
    (feature: keyof PlanLimits): boolean => {
      if (!data) return false
      const value = data.planLimits[feature]
      if (typeof value === "boolean") return value
      // For numeric limits, -1 means unlimited, positive means enabled
      if (typeof value === "number") return value === -1 || value > 0
      return false
    },
    [data]
  )

  const isWithinLimit = useCallback(
    (type: "messages" | "projects" | "skillCategories" | "questions"): boolean => {
      if (!data) return false
      return data.usage[type].allowed
    },
    [data]
  )

  const getRemainingCount = useCallback(
    (type: "messages" | "projects" | "skillCategories" | "questions"): number => {
      if (!data) return 0
      return data.usage[type].remaining
    },
    [data]
  )

  return {
    data,
    isLoading,
    error,
    refetch: fetchSubscription,
    plan,
    isPro,
    isLifetime,
    isFree,
    canUseFeature,
    isWithinLimit,
    getRemainingCount,
  }
}
