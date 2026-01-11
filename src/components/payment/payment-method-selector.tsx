"use client"

import { useState } from "react"
import { PaymentProvider } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Currency } from "@/lib/payment/types"
import { PAYMENT_METHODS, getPaymentMethodsForCurrency } from "@/lib/payment/config"

interface PaymentMethodSelectorProps {
  currency: Currency
  selectedMethod: PaymentProvider | null
  onSelect: (method: PaymentProvider) => void
}

export function PaymentMethodSelector({
  currency,
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  const availableMethods = getPaymentMethodsForCurrency(currency)

  // If currency is USD, show Stripe. If VND, show VNPay and MoMo
  const methods = currency === "USD"
    ? PAYMENT_METHODS.filter(m => m.id === "STRIPE")
    : PAYMENT_METHODS.filter(m => m.id !== "STRIPE")

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        Select payment method
      </p>
      <div className="grid gap-3">
        {methods.map((method) => (
          <Card
            key={method.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              selectedMethod === method.id && "border-primary bg-primary/5"
            )}
            onClick={() => onSelect(method.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <PaymentMethodIcon method={method.id} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{method.name}</p>
                {method.description && (
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-colors",
                  selectedMethod === method.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedMethod === method.id && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PaymentMethodIcon({ method }: { method: PaymentProvider }) {
  switch (method) {
    case "STRIPE":
      return <CreditCard className="h-5 w-5" />
    case "VNPAY":
      return <VNPayIcon />
    case "MOMO":
      return <MoMoIcon />
    default:
      return <Wallet className="h-5 w-5" />
  }
}

function VNPayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V9h2v2z" />
    </svg>
  )
}

function MoMoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="#A50064" />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        M
      </text>
    </svg>
  )
}
