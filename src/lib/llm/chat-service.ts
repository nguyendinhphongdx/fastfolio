import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { createLLMProvider, getDefaultModel } from "./factory"
import {
  LLMProvider,
  LLMMessage,
  LLMSettings,
  ILLMProvider,
} from "./types"

/**
 * Get the LLM provider for a portfolio
 * Returns system default if no custom settings
 */
export async function getPortfolioLLMProvider(
  portfolioId: string
): Promise<ILLMProvider> {
  // Get LLM settings for portfolio
  const llmSettings = await prisma.lLMSettings.findUnique({
    where: { portfolioId },
  })

  // If no settings or SYSTEM, use default
  if (!llmSettings || llmSettings.provider === "SYSTEM") {
    return createLLMProvider({
      provider: LLMProvider.SYSTEM,
    })
  }

  // Decrypt API key and create provider
  const settings: LLMSettings = {
    provider: llmSettings.provider as LLMProvider,
    apiKey: llmSettings.apiKey ? decrypt(llmSettings.apiKey) : null,
    model: llmSettings.model,
  }

  return createLLMProvider(settings)
}

/**
 * Get the model to use for a portfolio
 */
export async function getPortfolioModel(portfolioId: string): Promise<string> {
  const llmSettings = await prisma.lLMSettings.findUnique({
    where: { portfolioId },
  })

  if (!llmSettings || llmSettings.provider === "SYSTEM") {
    return "gpt-4o-mini"
  }

  return llmSettings.model || getDefaultModel(llmSettings.provider as LLMProvider)
}

/**
 * Generate a chat response using the portfolio's configured LLM
 */
export async function generateChatResponse(
  portfolioId: string,
  messages: LLMMessage[],
  options?: {
    maxTokens?: number
    temperature?: number
  }
): Promise<string> {
  const provider = await getPortfolioLLMProvider(portfolioId)
  const model = await getPortfolioModel(portfolioId)

  const result = await provider.chat(messages, {
    model,
    maxTokens: options?.maxTokens || 500,
    temperature: options?.temperature || 0.7,
  })

  return result.content
}

/**
 * Stream a chat response using the portfolio's configured LLM
 */
export async function* streamChatResponse(
  portfolioId: string,
  messages: LLMMessage[],
  options?: {
    maxTokens?: number
    temperature?: number
  }
): AsyncGenerator<string, void, unknown> {
  const provider = await getPortfolioLLMProvider(portfolioId)
  const model = await getPortfolioModel(portfolioId)

  const stream = provider.chatStream(messages, {
    model,
    maxTokens: options?.maxTokens || 500,
    temperature: options?.temperature || 0.7,
  })

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content
    }
  }
}
