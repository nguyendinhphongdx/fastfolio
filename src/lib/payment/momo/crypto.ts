import crypto from "crypto"

/**
 * Create HMAC-SHA256 signature for MoMo
 */
export function createMoMoSignature(
  data: string,
  secretKey: string
): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("hex")
}

/**
 * Verify MoMo IPN signature
 */
export function verifyMoMoSignature(
  rawSignature: string,
  secretKey: string,
  receivedSignature: string
): boolean {
  const expectedSignature = createMoMoSignature(rawSignature, secretKey)
  return expectedSignature === receivedSignature
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}
