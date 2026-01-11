"use client"

import { Button } from "@/components/ui/button"
import type { Currency } from "@/lib/payment/types"

interface CurrencyToggleProps {
  currency: Currency
  onChange: (currency: Currency) => void
}

export function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={currency === "USD" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange("USD")}
      >
        USD
      </Button>
      <Button
        variant={currency === "VND" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange("VND")}
      >
        VND
      </Button>
    </div>
  )
}
