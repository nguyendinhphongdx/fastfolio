import { VNPAY_CONFIG } from "../config"
import { createVNPaySignature, sortObject } from "./crypto"
import type { VNPayCheckoutParams, VNPayReturnParams } from "../types"

/**
 * VNPay Response Codes
 */
export const VNPAY_RESPONSE_CODES: Record<string, string> = {
  "00": "Giao dịch thành công",
  "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
  "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
  "10": "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
  "11": "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
  "12": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
  "13": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).",
  "24": "Giao dịch không thành công do: Khách hàng hủy giao dịch",
  "51": "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
  "65": "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
  "75": "Ngân hàng thanh toán đang bảo trì.",
  "79": "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.",
  "99": "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
}

/**
 * Create VNPay payment URL
 */
export function createVNPayPaymentUrl(params: VNPayCheckoutParams): string {
  const config = VNPAY_CONFIG

  if (!config.tmnCode || !config.hashSecret) {
    throw new Error("VNPay configuration is missing")
  }

  const date = new Date()
  const createDate = formatVNPayDate(date)
  const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60 * 1000)) // 15 minutes

  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: params.locale || "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(params.amount * 100), // VNPay requires amount * 100
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  }

  if (params.bankCode) {
    vnpParams.vnp_BankCode = params.bankCode
  }

  // Sort params alphabetically
  const sortedParams = sortObject(vnpParams)

  // Build query string for signature
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, "+")}`)
    .join("&")

  // Create signature
  const secureHash = createVNPaySignature(signData, config.hashSecret)

  // Build final URL
  const queryString = `${signData}&vnp_SecureHash=${secureHash}`

  return `${config.url}?${queryString}`
}

/**
 * Verify VNPay return/IPN params
 */
export function verifyVNPayReturn(params: VNPayReturnParams): {
  isValid: boolean
  isSuccess: boolean
  message: string
  transactionNo?: string
  orderId?: string
} {
  const config = VNPAY_CONFIG

  if (!config.hashSecret) {
    return {
      isValid: false,
      isSuccess: false,
      message: "VNPay configuration is missing",
    }
  }

  // Verify signature
  const receivedHash = params.vnp_SecureHash
  const paramsToVerify: Record<string, string> = { ...params } as Record<string, string>

  // Remove hash params
  delete paramsToVerify.vnp_SecureHash
  delete (paramsToVerify as Record<string, string>).vnp_SecureHashType

  // Sort and create signature
  const sortedParams = sortObject(paramsToVerify)
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, "+")}`)
    .join("&")

  const expectedHash = createVNPaySignature(signData, config.hashSecret)

  if (expectedHash.toLowerCase() !== receivedHash.toLowerCase()) {
    return {
      isValid: false,
      isSuccess: false,
      message: "Invalid signature",
    }
  }

  // Check response code
  const responseCode = params.vnp_ResponseCode
  const transactionStatus = params.vnp_TransactionStatus

  const isSuccess = responseCode === "00" && transactionStatus === "00"
  const message = VNPAY_RESPONSE_CODES[responseCode] || "Unknown error"

  return {
    isValid: true,
    isSuccess,
    message,
    transactionNo: params.vnp_TransactionNo,
    orderId: params.vnp_TxnRef,
  }
}

/**
 * Format date for VNPay (yyyyMMddHHmmss)
 */
function formatVNPayDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

/**
 * Parse order ID to extract user and plan info
 * Format: {userId}_{plan}_{timestamp}
 */
export function parseVNPayOrderId(orderId: string): {
  userId: string
  plan: string
  timestamp: string
} | null {
  const parts = orderId.split("_")
  if (parts.length < 3) return null

  return {
    userId: parts[0],
    plan: parts[1],
    timestamp: parts[2],
  }
}

/**
 * Create order ID for VNPay
 */
export function createVNPayOrderId(userId: string, plan: string): string {
  const timestamp = Date.now().toString()
  return `${userId}_${plan}_${timestamp}`
}
