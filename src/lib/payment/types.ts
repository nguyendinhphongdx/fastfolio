import { Plan, PaymentProvider, PaymentStatus } from "@prisma/client"

// ==========================================
// Currency Types
// ==========================================

export type Currency = "USD" | "VND"

export interface PriceAmount {
  USD: number // In cents
  VND: number // In VND (smallest unit)
}

// ==========================================
// Payment Method Types
// ==========================================

export interface PaymentMethod {
  id: PaymentProvider
  name: string
  description?: string
  icon: string
  currencies: Currency[]
  supportedPlans: Plan[]
  supportsRecurring: boolean
}

// ==========================================
// Checkout Types
// ==========================================

export interface CheckoutRequest {
  plan: Plan
  provider: PaymentProvider
  currency: Currency
  billingCycle?: "monthly" | "yearly" // For PRO plan
}

export interface CheckoutResponse {
  success: boolean
  url?: string
  error?: string
  transactionId?: string
}

// ==========================================
// Callback/Webhook Types
// ==========================================

export interface PaymentCallbackResult {
  success: boolean
  transactionId: string
  amount: number
  currency: Currency
  plan: Plan
  userId: string
  provider: PaymentProvider
  metadata?: Record<string, unknown>
}

// ==========================================
// VNPay Types
// ==========================================

export interface VNPayConfig {
  tmnCode: string
  hashSecret: string
  url: string
  apiUrl: string
  returnUrl: string
  ipnUrl: string
}

export interface VNPayCheckoutParams {
  orderId: string
  amount: number // In VND
  orderInfo: string
  ipAddr: string
  locale?: "vn" | "en"
  bankCode?: string
}

export interface VNPayReturnParams {
  vnp_TmnCode: string
  vnp_Amount: string
  vnp_BankCode: string
  vnp_BankTranNo?: string
  vnp_CardType?: string
  vnp_PayDate: string
  vnp_OrderInfo: string
  vnp_TransactionNo: string
  vnp_ResponseCode: string
  vnp_TransactionStatus: string
  vnp_TxnRef: string
  vnp_SecureHash: string
}

// ==========================================
// MoMo Types
// ==========================================

export interface MoMoConfig {
  partnerCode: string
  accessKey: string
  secretKey: string
  apiEndpoint: string
  returnUrl: string
  ipnUrl: string
}

export interface MoMoCheckoutParams {
  orderId: string
  amount: number // In VND
  orderInfo: string
  requestId: string
  extraData?: string
}

export interface MoMoCheckoutResponse {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  responseTime: number
  message: string
  resultCode: number
  payUrl: string
  shortLink?: string
}

export interface MoMoIPNParams {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  orderInfo: string
  orderType: string
  transId: number
  resultCode: number
  message: string
  payType: string
  responseTime: number
  extraData: string
  signature: string
}

// ==========================================
// Plan Pricing Types
// ==========================================

export interface PlanPricing {
  monthly?: PriceAmount
  yearly?: PriceAmount
  oneTime?: PriceAmount
}

export type PlanPricingConfig = {
  [key in Exclude<Plan, "FREE">]: PlanPricing
}
