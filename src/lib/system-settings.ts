import { prisma } from "./prisma"
import { decrypt } from "./encryption"
import { LLMProvider, PROVIDER_MODELS } from "./llm/types"

/**
 * Get or create system settings (singleton)
 */
export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "system" },
  })

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: "system",
        defaultProvider: "OPENAI",
        defaultModel: "gpt-4o-mini",
      },
    })
  }

  return settings
}

/**
 * Get decrypted system API key
 */
export async function getSystemApiKey(): Promise<string | null> {
  const settings = await getSystemSettings()

  if (!settings.defaultApiKey) {
    // Fallback to env variable
    return process.env.OPENAI_API_KEY || null
  }

  try {
    return decrypt(settings.defaultApiKey)
  } catch {
    return null
  }
}

/**
 * Get system LLM configuration for chat
 */
export async function getSystemLLMConfig() {
  const settings = await getSystemSettings()
  const apiKey = await getSystemApiKey()

  return {
    provider: settings.defaultProvider as LLMProvider,
    model: settings.defaultModel,
    apiKey,
  }
}

/**
 * Get available models for a provider
 */
export function getModelsForProvider(provider: LLMProvider) {
  return PROVIDER_MODELS[provider] || PROVIDER_MODELS[LLMProvider.OPENAI]
}
