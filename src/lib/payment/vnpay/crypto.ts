import crypto from "crypto"

/**
 * Create HMAC-SHA512 hash for VNPay signature
 */
export function createVNPaySignature(
  data: string,
  secretKey: string
): string {
  return crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(data, "utf-8"))
    .digest("hex")
}

/**
 * Verify VNPay callback signature
 */
export function verifyVNPaySignature(
  params: Record<string, string>,
  secretKey: string,
  receivedHash: string
): boolean {
  // Remove hash params before verification
  const sortedParams = { ...params }
  delete sortedParams["vnp_SecureHash"]
  delete sortedParams["vnp_SecureHashType"]

  // Sort params alphabetically
  const sortedKeys = Object.keys(sortedParams).sort()

  // Build query string
  const signData = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(sortedParams[key] || "").replace(/%20/g, "+")}`)
    .join("&")

  // Create hash
  const expectedHash = createVNPaySignature(signData, secretKey)

  return expectedHash.toLowerCase() === receivedHash.toLowerCase()
}

/**
 * Sort object keys alphabetically (required for VNPay)
 */
export function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {}
  const keys = Object.keys(obj).sort()

  for (const key of keys) {
    sorted[key] = obj[key]
  }

  return sorted
}
