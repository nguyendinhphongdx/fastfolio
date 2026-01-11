import { GoogleGenerativeAI } from "@google/generative-ai"
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

export class GoogleProvider implements ILLMProvider {
  readonly provider = LLMProvider.GOOGLE
  readonly name = "Google AI"

  private client: GoogleGenerativeAI
  private defaultModel: string

  constructor(apiKey: string, defaultModel?: string) {
    this.client = new GoogleGenerativeAI(apiKey)
    this.defaultModel = defaultModel || "gemini-1.5-flash"
  }

  async chat(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    const model = this.client.getGenerativeModel({
      model: options?.model || this.defaultModel,
    })

    // Extract system instruction and convert messages to Gemini format
    const systemMessage = messages.find((m) => m.role === "system")
    const chatMessages = messages.filter((m) => m.role !== "system")

    // Build history for multi-turn conversation
    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const lastMessage = chatMessages[chatMessages.length - 1]

    const chat = model.startChat({
      history: history as Array<{
        role: "user" | "model"
        parts: Array<{ text: string }>
      }>,
      systemInstruction: systemMessage?.content,
    })

    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response

    return {
      content: response.text(),
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    }
  }

  async *chatStream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const model = this.client.getGenerativeModel({
      model: options?.model || this.defaultModel,
    })

    const systemMessage = messages.find((m) => m.role === "system")
    const chatMessages = messages.filter((m) => m.role !== "system")

    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const lastMessage = chatMessages[chatMessages.length - 1]

    const chat = model.startChat({
      history: history as Array<{
        role: "user" | "model"
        parts: Array<{ text: string }>
      }>,
      systemInstruction: systemMessage?.content,
    })

    const result = await chat.sendMessageStream(lastMessage.content)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      yield { content: text, done: false }
    }
    yield { content: "", done: true }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" })
      await model.generateContent("hi")
      return true
    } catch {
      return false
    }
  }

  getAvailableModels(): LLMModelInfo[] {
    return PROVIDER_MODELS[LLMProvider.GOOGLE]
  }
}
