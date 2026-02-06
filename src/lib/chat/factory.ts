/**
 * Chat Provider Factory
 * Creates the appropriate chat provider based on settings
 */

import { IChatProvider } from "./types"
import { OpenAIChatProvider } from "./providers/openai"
import { AnthropicChatProvider } from "./providers/anthropic"
import { GoogleChatProvider } from "./providers/google"
import { LLMProvider } from "@/lib/llm/types"
import { getSystemLLMConfig } from "@/lib/system-settings"
import { decrypt } from "@/lib/encryption"

export interface ChatProviderConfig {
  provider: LLMProvider
  apiKey?: string | null // Encrypted API key for user's custom provider
  model?: string | null
}

/**
 * Create a chat provider based on configuration
 */
export async function createChatProvider(config: ChatProviderConfig): Promise<IChatProvider> {
  const { provider, apiKey: encryptedApiKey, model } = config

  // Handle SYSTEM provider - get settings from database
  if (provider === LLMProvider.SYSTEM) {
    return createSystemChatProvider()
  }

  // Handle custom provider with user's API key
  if (!encryptedApiKey) {
    throw new Error(`API key required for ${provider} provider`)
  }

  const apiKey = decrypt(encryptedApiKey)

  switch (provider) {
    case LLMProvider.OPENAI:
      return new OpenAIChatProvider(apiKey, model || "gpt-4o")

    case LLMProvider.ANTHROPIC:
      return new AnthropicChatProvider(apiKey, model || "claude-3-5-sonnet-20241022")

    case LLMProvider.GOOGLE:
      return new GoogleChatProvider(apiKey, model || "gemini-1.5-flash")

    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

/**
 * Create system chat provider using database settings
 */
export async function createSystemChatProvider(): Promise<IChatProvider> {
  const config = await getSystemLLMConfig()

  if (!config.apiKey) {
    throw new Error("System API key not configured. Please configure in Admin Panel.")
  }

  switch (config.provider) {
    case LLMProvider.OPENAI:
      return new OpenAIChatProvider(config.apiKey, config.model)

    case LLMProvider.ANTHROPIC:
      return new AnthropicChatProvider(config.apiKey, config.model)

    case LLMProvider.GOOGLE:
      return new GoogleChatProvider(config.apiKey, config.model)

    default:
      // Default to OpenAI
      return new OpenAIChatProvider(config.apiKey, config.model)
  }
}

/**
 * Get default model for a provider
 */
export function getDefaultModelForProvider(provider: LLMProvider): string {
  switch (provider) {
    case LLMProvider.OPENAI:
      return "gpt-4o-mini"
    case LLMProvider.ANTHROPIC:
      return "claude-3-5-sonnet-20241022"
    case LLMProvider.GOOGLE:
      return "gemini-1.5-flash"
    default:
      return "gpt-4o-mini"
  }
}
