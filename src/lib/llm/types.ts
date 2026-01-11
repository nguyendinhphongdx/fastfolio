// LLM Provider Types and Interfaces

export enum LLMProvider {
  SYSTEM = "SYSTEM", // Default - uses system's OpenAI key
  OPENAI = "OPENAI",
  ANTHROPIC = "ANTHROPIC",
  GOOGLE = "GOOGLE",
}

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface LLMCompletionResult {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface LLMStreamChunk {
  content: string
  done: boolean
}

/**
 * Base interface for all LLM providers
 */
export interface ILLMProvider {
  readonly provider: LLMProvider
  readonly name: string

  /**
   * Generate a chat completion
   */
  chat(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult>

  /**
   * Generate a streaming chat completion
   */
  chatStream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown>

  /**
   * Validate the API key
   */
  validateApiKey(): Promise<boolean>

  /**
   * Get available models for this provider
   */
  getAvailableModels(): LLMModelInfo[]
}

export interface LLMModelInfo {
  id: string
  name: string
  description?: string
  contextWindow: number
  inputPricePerMillion?: number // USD per 1M tokens
  outputPricePerMillion?: number
}

/**
 * Provider configuration from database
 */
export interface LLMSettings {
  provider: LLMProvider
  apiKey?: string | null
  model?: string | null
}

/**
 * Available models per provider
 */
export const PROVIDER_MODELS: Record<LLMProvider, LLMModelInfo[]> = {
  [LLMProvider.SYSTEM]: [
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini (System)",
      description: "Fast and efficient model provided by system",
      contextWindow: 128000,
    },
  ],
  [LLMProvider.OPENAI]: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Most capable OpenAI model",
      contextWindow: 128000,
      inputPricePerMillion: 2.5,
      outputPricePerMillion: 10,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Fast and cost-effective",
      contextWindow: 128000,
      inputPricePerMillion: 0.15,
      outputPricePerMillion: 0.6,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Previous generation flagship",
      contextWindow: 128000,
      inputPricePerMillion: 10,
      outputPricePerMillion: 30,
    },
  ],
  [LLMProvider.ANTHROPIC]: [
    {
      id: "claude-sonnet-4-20250514",
      name: "Claude Sonnet 4",
      description: "Latest balanced model",
      contextWindow: 200000,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
    },
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      description: "Best balance of speed and capability",
      contextWindow: 200000,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      description: "Fastest Claude model",
      contextWindow: 200000,
      inputPricePerMillion: 0.8,
      outputPricePerMillion: 4,
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      description: "Most capable for complex tasks",
      contextWindow: 200000,
      inputPricePerMillion: 15,
      outputPricePerMillion: 75,
    },
  ],
  [LLMProvider.GOOGLE]: [
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      description: "Most capable Gemini model",
      contextWindow: 2000000,
      inputPricePerMillion: 1.25,
      outputPricePerMillion: 5,
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      description: "Fast and efficient",
      contextWindow: 1000000,
      inputPricePerMillion: 0.075,
      outputPricePerMillion: 0.3,
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Latest fast model",
      contextWindow: 1000000,
      inputPricePerMillion: 0.1,
      outputPricePerMillion: 0.4,
    },
  ],
}

/**
 * Provider display info
 */
export const PROVIDER_INFO: Record<
  LLMProvider,
  { name: string; description: string; apiKeyPrefix: string; docsUrl: string }
> = {
  [LLMProvider.SYSTEM]: {
    name: "System Default",
    description: "Uses Fastfolio's built-in AI (no API key required)",
    apiKeyPrefix: "",
    docsUrl: "",
  },
  [LLMProvider.OPENAI]: {
    name: "OpenAI",
    description: "GPT-4o and GPT-4 models",
    apiKeyPrefix: "sk-",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  [LLMProvider.ANTHROPIC]: {
    name: "Anthropic",
    description: "Claude 3.5 and Claude 3 models",
    apiKeyPrefix: "sk-ant-",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  [LLMProvider.GOOGLE]: {
    name: "Google AI",
    description: "Gemini Pro and Flash models",
    apiKeyPrefix: "AIza",
    docsUrl: "https://aistudio.google.com/apikey",
  },
}
