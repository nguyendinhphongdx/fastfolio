import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // If key is hex-encoded (64 chars), decode it
  if (key.length === 64) {
    return Buffer.from(key, "hex")
  }

  // If key is base64-encoded
  if (key.length === 44) {
    return Buffer.from(key, "base64")
  }

  // Otherwise, hash the key to get 32 bytes
  return crypto.createHash("sha256").update(key).digest()
}

/**
 * Encrypt a plaintext string
 * Returns: iv:authTag:ciphertext (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`
}

/**
 * Decrypt an encrypted string
 * Input format: iv:authTag:ciphertext (all base64 encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()

  const parts = encryptedData.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format")
  }

  const iv = Buffer.from(parts[0], "base64")
  const authTag = Buffer.from(parts[1], "base64")
  const ciphertext = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Mask an API key for display (e.g., sk-...xxxx)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return "****"
  }

  const prefix = apiKey.slice(0, 7)
  const suffix = apiKey.slice(-4)

  return `${prefix}...${suffix}`
}

/**
 * Generate a new encryption key (for setup)
 * Run: npx ts-node -e "import { generateKey } from './src/lib/encryption'; console.log(generateKey())"
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("hex")
}
