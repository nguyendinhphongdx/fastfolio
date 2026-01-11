"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plan, PaymentProvider } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Loader2, Zap, Crown, Sparkles, CheckCircle2, XCircle } from "lucide-react"
import { CurrencyToggle, PlanCard, PaymentDialog, PlanComparison } from "@/components/payment"
import { detectUserCurrency, saveCurrencyPreference } from "@/lib/payment/currency"
import type { Currency } from "@/lib/payment/types"

export default function BillingPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [currentPlan, setCurrentPlan] = useState<Plan>("FREE")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<Plan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Exclude<Plan, "FREE"> | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // Check for success/error from payment callbacks
  const success = searchParams.get("success")
  const error = searchParams.get("error")
  const errorMessage = searchParams.get("message")

  useEffect(() => {
    // Detect user currency on mount
    const detectedCurrency = detectUserCurrency()
    setCurrency(detectedCurrency)

    // Fetch current subscription
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

  function handleCurrencyChange(newCurrency: Currency) {
    setCurrency(newCurrency)
    saveCurrencyPreference(newCurrency)
  }

  function handleUpgrade(plan: Plan) {
    if (plan === "FREE") return
    setSelectedPlan(plan as Exclude<Plan, "FREE">)
    setShowPaymentDialog(true)
  }

  async function handlePaymentConfirm(provider: PaymentProvider) {
    if (!selectedPlan || !session) return

    setLoading(selectedPlan)
    setShowPaymentDialog(false)

    try {
      // Determine API endpoint based on provider
      const endpoint =
        provider === "STRIPE"
          ? "/api/stripe/checkout"
          : provider === "VNPAY"
          ? "/api/vnpay/checkout"
          : "/api/momo/checkout"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle: selectedPlan === "PRO" ? billingCycle : undefined,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.shortLink) {
        // MoMo sometimes returns shortLink
        window.location.href = data.shortLink
      } else {
        console.error("No checkout URL received:", data.error)
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoading(null)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </div>
        <CurrencyToggle currency={currency} onChange={handleCurrencyChange} />
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Payment successful! Your subscription has been updated.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error === "payment_failed"
              ? errorMessage || "Payment failed. Please try again."
              : error === "invalid_signature"
              ? "Invalid payment signature. Please contact support."
              : "An error occurred. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPlan === "FREE" && <Zap className="h-5 w-5" />}
            {currentPlan === "PRO" && <Sparkles className="h-5 w-5" />}
            {currentPlan === "LIFETIME" && <Crown className="h-5 w-5" />}
            Current Plan: {currentPlan}
          </CardTitle>
          <CardDescription>
            {currentPlan === "FREE" && "Upgrade to unlock more features"}
            {currentPlan === "PRO" && "You have access to all Pro features"}
            {currentPlan === "LIFETIME" &&
              "You have lifetime access to all features"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Billing Cycle Toggle (for Pro plan) */}
      <div className="flex justify-center">
        <Tabs
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
        >
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Save 17%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {(["FREE", "PRO", "LIFETIME"] as Plan[]).map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            currency={currency}
            currentPlan={currentPlan}
            isLoading={loading === plan}
            onUpgrade={handleUpgrade}
            billingCycle={billingCycle}
          />
        ))}
      </div>

      {/* Plan Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Plans</CardTitle>
          <CardDescription>
            See what's included in each plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanComparison />
        </CardContent>
      </Card>

      {/* Payment Method Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            We accept multiple payment methods for your convenience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v2h16V6H4zm0 4v8h16v-8H4z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Credit/Debit Card</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, AMEX</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">VNPay</span>
              </div>
              <div>
                <p className="font-medium">VNPay</p>
                <p className="text-xs text-muted-foreground">ATM, Visa, QR Pay</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <span className="text-pink-600 font-bold text-sm">MoMo</span>
              </div>
              <div>
                <p className="font-medium">MoMo</p>
                <p className="text-xs text-muted-foreground">Ví điện tử MoMo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel my subscription?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel anytime. Your access will continue until the
              end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept credit/debit cards via Stripe, VNPay (for Vietnamese
              bank cards and QR), and MoMo e-wallet.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Is Lifetime really forever?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! One payment, lifetime access. No recurring fees.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Can I pay in VND?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! Switch to VND using the currency toggle at the top. VNPay and
              MoMo payments are processed in VND.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {selectedPlan && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          plan={selectedPlan}
          currency={currency}
          billingCycle={billingCycle}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  )
}
