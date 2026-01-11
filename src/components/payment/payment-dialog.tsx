"use client"

import { useState } from "react"
import { Plan, PaymentProvider } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { PaymentMethodSelector } from "./payment-method-selector"
import type { Currency } from "@/lib/payment/types"
import { formatPrice, getPlanPrice } from "@/lib/payment"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Exclude<Plan, "FREE">
  currency: Currency
  billingCycle?: "monthly" | "yearly"
  onConfirm: (provider: PaymentProvider) => Promise<void>
}

export function PaymentDialog({
  open,
  onOpenChange,
  plan,
  currency,
  billingCycle = "monthly",
  onConfirm,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentProvider | null>(
    currency === "USD" ? "STRIPE" : "VNPAY"
  )
  const [isLoading, setIsLoading] = useState(false)

  const price = getPlanPrice(plan, currency, billingCycle)
  const priceDisplay = formatPrice(price, currency)
  const period = plan === "LIFETIME" ? "" : billingCycle === "yearly" ? "/year" : "/month"

  async function handleConfirm() {
    if (!selectedMethod) return

    setIsLoading(true)
    try {
      await onConfirm(selectedMethod)
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to {plan}</DialogTitle>
          <DialogDescription>
            {priceDisplay}
            {period}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PaymentMethodSelector
            currency={currency}
            selectedMethod={selectedMethod}
            onSelect={setSelectedMethod}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMethod || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
