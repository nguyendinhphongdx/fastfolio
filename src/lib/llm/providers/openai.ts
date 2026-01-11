import OpenAI from "openai"
import {
  ILLMProvider,
  LLMProvider,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMStreamChunk,
  LLMModelInfo,
  PROVIDER_MODELS,
} from "../types"

export class OpenAIProvider implements ILLMProvider {
  readonly provider = LLMProvider.OPENAI
  readonly name = "OpenAI"

  private client: OpenAI
  private defaultModel: string

  constructor(apiKey: string, defaultModel?: string) {
    this.client = new OpenAI({ apiKey })
    this.defaultModel = defaultModel || "gpt-4o-mini"
  }

  async chat(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    })

    return {
      content: response.choices[0]?.message?.content || "",
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }

  async *chatStream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ""
      const done = chunk.choices[0]?.finish_reason === "stop"
      yield { content, done }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }

  getAvailableModels(): LLMModelInfo[] {
    return PROVIDER_MODELS[LLMProvider.OPENAI]
  }
}
