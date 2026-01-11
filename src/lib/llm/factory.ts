import {
  ILLMProvider,
  LLMProvider,
  LLMSettings,
  PROVIDER_MODELS,
} from "./types"
import { OpenAIProvider } from "./providers/openai"
import { AnthropicProvider } from "./providers/anthropic"
import { GoogleProvider } from "./providers/google"

/**
 * Create an LLM provider instance based on settings
 */
export function createLLMProvider(settings: LLMSettings): ILLMProvider {
  const { provider, apiKey, model } = settings

  switch (provider) {
    case LLMProvider.OPENAI:
      if (!apiKey) throw new Error("OpenAI API key is required")
      return new OpenAIProvider(apiKey, model || undefined)

    case LLMProvider.ANTHROPIC:
      if (!apiKey) throw new Error("Anthropic API key is required")
      return new AnthropicProvider(apiKey, model || undefined)

    case LLMProvider.GOOGLE:
      if (!apiKey) throw new Error("Google API key is required")
      return new GoogleProvider(apiKey, model || undefined)

    case LLMProvider.SYSTEM:
    default:
      // System default uses OpenAI with system key
      const systemKey = process.env.OPENAI_API_KEY
      if (!systemKey) throw new Error("System OpenAI API key not configured")
      return new OpenAIProvider(systemKey, "gpt-4o-mini")
  }
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  const models = PROVIDER_MODELS[provider]
  return models[0]?.id || "gpt-4o-mini"
}

/**
 * Validate API key format (basic validation)
 */
export function validateApiKeyFormat(
  provider: LLMProvider,
  apiKey: string
): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim() === "") {
    return { valid: false, error: "API key is required" }
  }

  switch (provider) {
    case LLMProvider.OPENAI:
      if (!apiKey.startsWith("sk-")) {
        return { valid: false, error: "OpenAI API key should start with 'sk-'" }
      }
      break

    case LLMProvider.ANTHROPIC:
      if (!apiKey.startsWith("sk-ant-")) {
        return {
          valid: false,
          error: "Anthropic API key should start with 'sk-ant-'",
        }
      }
      break

    case LLMProvider.GOOGLE:
      if (!apiKey.startsWith("AIza")) {
        return {
          valid: false,
          error: "Google API key should start with 'AIza'",
        }
      }
      break

    case LLMProvider.SYSTEM:
      return { valid: true }
  }

  return { valid: true }
}

/**
 * Test if an API key is valid by making a test request
 */
export async function testApiKey(
  provider: LLMProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  // First validate format
  const formatCheck = validateApiKeyFormat(provider, apiKey)
  if (!formatCheck.valid) {
    return formatCheck
  }

  try {
    const llmProvider = createLLMProvider({ provider, apiKey })
    const isValid = await llmProvider.validateApiKey()

    if (!isValid) {
      return { valid: false, error: "API key is invalid or expired" }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to validate API key",
    }
  }
}
