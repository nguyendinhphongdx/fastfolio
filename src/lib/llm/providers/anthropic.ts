import Anthropic from "@anthropic-ai/sdk"
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

export class AnthropicProvider implements ILLMProvider {
  readonly provider = LLMProvider.ANTHROPIC
  readonly name = "Anthropic"

  private client: Anthropic
  private defaultModel: string

  constructor(apiKey: string, defaultModel?: string) {
    this.client = new Anthropic({ apiKey })
    this.defaultModel = defaultModel || "claude-3-5-sonnet-20241022"
  }

  async chat(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === "system")
    const chatMessages = messages.filter((m) => m.role !== "system")

    const response = await this.client.messages.create({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens || 4096,
      system: systemMessage?.content,
      messages: chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    })

    const textContent = response.content.find((c) => c.type === "text")

    return {
      content: textContent?.type === "text" ? textContent.text : "",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    }
  }

  async *chatStream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const systemMessage = messages.find((m) => m.role === "system")
    const chatMessages = messages.filter((m) => m.role !== "system")

    const stream = this.client.messages.stream({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens || 4096,
      system: systemMessage?.content,
      messages: chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    })

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { content: event.delta.text, done: false }
      }
      if (event.type === "message_stop") {
        yield { content: "", done: true }
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Make a minimal request to validate the key
      await this.client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      })
      return true
    } catch {
      return false
    }
  }

  getAvailableModels(): LLMModelInfo[] {
    return PROVIDER_MODELS[LLMProvider.ANTHROPIC]
  }
}
