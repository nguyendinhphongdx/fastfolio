"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plan } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Crown, Sparkles, Zap, CheckCircle2, ShieldAlert } from "lucide-react"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState<Plan | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // null = loading, true/false = checked

  const checkAdminAndFetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/set-plan")
      if (res.status === 403) {
        // Not admin
        setIsAdmin(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(true)
        setCurrentPlan(data.user?.subscription?.plan || "FREE")
      } else {
        setIsAdmin(false)
      }
    } catch {
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      checkAdminAndFetchPlan()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, checkAdminAndFetchPlan, router])

  async function handleSetPlan(plan: Plan) {
    setLoading(plan)
    setSuccess(null)

    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (data.success) {
        setCurrentPlan(plan)
        setSuccess(`Plan updated to ${plan}!`)
      }
    } catch (error) {
      console.error("Failed to set plan:", error)
    } finally {
      setLoading(null)
    }
  }

  // Show loading while checking auth or admin status
  if (status === "loading" || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show access denied for non-admin users
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  const plans: { plan: Plan; icon: typeof Zap; color: string }[] = [
    { plan: "FREE", icon: Zap, color: "bg-gray-100 text-gray-600" },
    { plan: "PRO", icon: Sparkles, color: "bg-blue-100 text-blue-600" },
    { plan: "LIFETIME", icon: Crown, color: "bg-yellow-100 text-yellow-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin - Plan Switcher</h1>
        <p className="text-muted-foreground">
          Quickly switch your account plan for testing purposes
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {session?.user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan && (
            <Badge
              variant="outline"
              className={
                currentPlan === "PRO"
                  ? "bg-blue-100 text-blue-700"
                  : currentPlan === "LIFETIME"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {currentPlan}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map(({ plan, icon: Icon, color }) => (
          <Card
            key={plan}
            className={currentPlan === plan ? "border-primary" : ""}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {plan}
              </CardTitle>
              <CardDescription>
                {plan === "FREE" && "Basic features"}
                {plan === "PRO" && "All premium features"}
                {plan === "LIFETIME" && "Forever access"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleSetPlan(plan)}
                disabled={loading !== null || currentPlan === plan}
                variant={currentPlan === plan ? "outline" : "default"}
                className="w-full"
              >
                {loading === plan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Switching...
                  </>
                ) : currentPlan === plan ? (
                  "Current"
                ) : (
                  `Switch to ${plan}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>
            You can also use the API directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`// Set plan via API
fetch('/api/admin/set-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan: 'PRO' }) // FREE, PRO, or LIFETIME
})`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
