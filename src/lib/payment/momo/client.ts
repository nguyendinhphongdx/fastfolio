import { MOMO_CONFIG } from "../config"
import { createMoMoSignature, verifyMoMoSignature, generateRequestId } from "./crypto"
import type { MoMoCheckoutParams, MoMoCheckoutResponse, MoMoIPNParams } from "../types"

/**
 * MoMo Result Codes
 */
export const MOMO_RESULT_CODES: Record<number, string> = {
  0: "Thành công",
  9000: "Giao dịch được cấp quyền (authorization) thành công",
  8000: "Giao dịch đang ở trạng thái cần được người dùng xác nhận thanh toán lại",
  7000: "Giao dịch đang được xử lý",
  1000: "Hệ thống đang được bảo trì",
  1001: "Tài khoản của bạn không đủ số dư để thực hiện giao dịch",
  1002: "Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán",
  1003: "Giao dịch bị đã bị hủy",
  1004: "Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của bạn",
  1005: "Giao dịch thất bại do url hoặc QR code đã hết hạn",
  1006: "Giao dịch thất bại do bạn đã từ chối xác nhận thanh toán",
  1007: "Giao dịch bị từ chối vì tài khoản không tồn tại hoặc tạm thời bị khóa",
  1017: "Giao dịch bị hủy bởi người dùng",
  1026: "Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi",
  1080: "Giao dịch hoàn tiền bị từ chối. Giao dịch gốc không được tìm thấy",
  1081: "Giao dịch hoàn tiền bị từ chối. Giao dịch gốc có thể đã được hoàn",
  2019: "Yêu cầu bị từ chối vì requestId bị trùng",
  4001: "Giao dịch bị hạn chế do người dùng chưa hoàn tất xác thực tài khoản",
  4010: "Giao dịch bị từ chối do quá trình xác minh OTP thất bại",
  4015: "Giao dịch bị từ chối do quá trình xác minh 3DS thất bại",
  4100: "Giao dịch thất bại do người dùng không đăng nhập thành công",
  10: "Hệ thống đang được bảo trì",
  99: "Lỗi không xác định",
}

/**
 * Create MoMo payment request
 */
export async function createMoMoPayment(
  params: MoMoCheckoutParams
): Promise<MoMoCheckoutResponse> {
  const config = MOMO_CONFIG

  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    throw new Error("MoMo configuration is missing")
  }

  const requestId = params.requestId || generateRequestId()
  const orderInfo = params.orderInfo
  const redirectUrl = config.returnUrl
  const ipnUrl = config.ipnUrl
  const requestType = "payWithMethod"
  const extraData = params.extraData || ""
  const autoCapture = true
  const lang = "vi"

  // Create raw signature string (order matters!)
  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `amount=${params.amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${params.orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${config.partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&")

  const signature = createMoMoSignature(rawSignature, config.secretKey)

  const requestBody = {
    partnerCode: config.partnerCode,
    partnerName: "Fastfolio",
    storeId: config.partnerCode,
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture,
    extraData,
    signature,
  }

  const response = await fetch(`${config.apiEndpoint}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()

  return data as MoMoCheckoutResponse
}

/**
 * Verify MoMo IPN callback
 */
export function verifyMoMoIPN(params: MoMoIPNParams): {
  isValid: boolean
  isSuccess: boolean
  message: string
} {
  const config = MOMO_CONFIG

  if (!config.secretKey) {
    return {
      isValid: false,
      isSuccess: false,
      message: "MoMo configuration is missing",
    }
  }

  // Create raw signature for verification (order matters!)
  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `amount=${params.amount}`,
    `extraData=${params.extraData}`,
    `message=${params.message}`,
    `orderId=${params.orderId}`,
    `orderInfo=${params.orderInfo}`,
    `orderType=${params.orderType}`,
    `partnerCode=${params.partnerCode}`,
    `payType=${params.payType}`,
    `requestId=${params.requestId}`,
    `responseTime=${params.responseTime}`,
    `resultCode=${params.resultCode}`,
    `transId=${params.transId}`,
  ].join("&")

  const isValid = verifyMoMoSignature(
    rawSignature,
    config.secretKey,
    params.signature
  )

  if (!isValid) {
    return {
      isValid: false,
      isSuccess: false,
      message: "Invalid signature",
    }
  }

  const isSuccess = params.resultCode === 0
  const message = MOMO_RESULT_CODES[params.resultCode] || "Unknown error"

  return {
    isValid: true,
    isSuccess,
    message,
  }
}

/**
 * Parse order ID to extract user and plan info
 * Format: {userId}_{plan}_{timestamp}
 */
export function parseMoMoOrderId(orderId: string): {
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
 * Create order ID for MoMo
 */
export function createMoMoOrderId(userId: string, plan: string): string {
  const timestamp = Date.now().toString()
  return `${userId}_${plan}_${timestamp}`
}
