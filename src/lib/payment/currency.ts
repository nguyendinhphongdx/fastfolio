"use client"

import type { Currency } from "./types"

// ==========================================
// Currency Detection
// ==========================================

const VIETNAM_COUNTRY_CODES = ["VN", "Vietnam"]

export function detectUserCurrency(): Currency {
  // 1. Check localStorage preference
  if (typeof window !== "undefined") {
    const savedCurrency = localStorage.getItem("preferred_currency")
    if (savedCurrency === "VND" || savedCurrency === "USD") {
      return savedCurrency
    }
  }

  // 2. Check browser locale
  if (typeof navigator !== "undefined") {
    const locale = navigator.language || ""
    if (locale.startsWith("vi") || locale.includes("VN")) {
      return "VND"
    }
  }

  // 3. Check timezone (Vietnam is UTC+7)
  if (typeof Intl !== "undefined") {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone === "Asia/Ho_Chi_Minh" || timezone === "Asia/Saigon") {
      return "VND"
    }
  }

  // 4. Default to USD
  return "USD"
}

export function saveCurrencyPreference(currency: Currency): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("preferred_currency", currency)
  }
}

// ==========================================
// Currency Formatting
// ==========================================

export function formatPrice(amount: number, currency: Currency): string {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // USD - amount is in cents
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100)
}

export function formatPriceShort(amount: number, currency: Currency): string {
  if (currency === "VND") {
    // Format as "199K" or "1.19M"
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2).replace(/\.?0+$/, "")}M đ`
    }
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K đ`
    }
    return `${amount}đ`
  }

  // USD - amount is in cents
  return `$${(amount / 100).toFixed(0)}`
}

// ==========================================
// Currency Conversion (Approximate)
// ==========================================

const USD_TO_VND_RATE = 24500 // Approximate exchange rate

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount

  if (from === "USD" && to === "VND") {
    // amount is in cents, convert to VND
    return Math.round((amount / 100) * USD_TO_VND_RATE)
  }

  if (from === "VND" && to === "USD") {
    // amount is in VND, convert to cents
    return Math.round((amount / USD_TO_VND_RATE) * 100)
  }

  return amount
}

// ==========================================
// Currency Symbol
// ==========================================

export function getCurrencySymbol(currency: Currency): string {
  return currency === "VND" ? "đ" : "$"
}

export function getCurrencyName(currency: Currency): string {
  return currency === "VND" ? "Vietnamese Dong" : "US Dollar"
}
