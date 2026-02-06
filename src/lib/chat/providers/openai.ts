import OpenAI from "openai"
import {
  IChatProvider,
  ChatMessage,
  ChatOptions,
  ChatChunk,
  PortfolioPersona,
  buildPersonaPrompt,
} from "../types"

// OpenAI tool definitions
const OPENAI_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "show_projects",
      description: "Show the user's projects when asked about their work, portfolio, or projects",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "show_skills",
      description: "Show the user's skills and expertise when asked about their abilities or tech stack",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "show_contact",
      description: "Show contact information when asked how to reach, contact, or connect with the person",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "show_fun",
      description: "Show fun content, hobbies, or personal interests when asked about personal life or fun facts",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "show_resume",
      description: "Show or offer to download the resume when asked about CV or resume",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
]

export class OpenAIChatProvider implements IChatProvider {
  readonly name = "OpenAI"
  private client: OpenAI
  private defaultModel: string

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey })
    this.defaultModel = model
  }

  buildSystemPrompt(persona: PortfolioPersona): string {
    return buildPersonaPrompt(persona)
  }

  async *chatWithTools(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatChunk, void, unknown> {
    const model = options?.model || this.defaultModel
    const maxTokens = options?.maxTokens || 500

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: OPENAI_TOOLS,
        tool_choice: "auto",
        stream: true,
        max_tokens: maxTokens,
      })

      const toolCallsBuffer = new Map<number, { name: string; arguments: string }>()

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index
            if (!toolCallsBuffer.has(index)) {
              toolCallsBuffer.set(index, { name: "", arguments: "" })
            }
            const current = toolCallsBuffer.get(index)!
            if (toolCall.function?.name) current.name = toolCall.function.name
            if (toolCall.function?.arguments) current.arguments += toolCall.function.arguments
          }
        }

        // Handle text content
        if (delta?.content) {
          yield { type: "text", content: delta.content }
        }

        // Handle tool calls completion
        if (chunk.choices[0]?.finish_reason === "tool_calls") {
          // Emit tool chunks
          for (const [, tool] of toolCallsBuffer) {
            yield {
              type: "tool",
              tool: {
                name: tool.name as ChatChunk extends { type: "tool" } ? ChatChunk["tool"]["name"] : never,
                data: tool.arguments ? JSON.parse(tool.arguments) : {},
              },
            }
          }

          // Generate follow-up response after tool calls
          yield* this.generateFollowUp(messages, toolCallsBuffer, model)
        }
      }

      yield { type: "done" }
    } catch (error) {
      console.error("OpenAI chat error:", error)
      yield {
        type: "error",
        error: "Sorry, I encountered an error. Please try again.",
      }
    }
  }

  private async *generateFollowUp(
    originalMessages: ChatMessage[],
    toolCallsBuffer: Map<number, { name: string; arguments: string }>,
    model: string
  ): AsyncGenerator<ChatChunk, void, unknown> {
    try {
      const followUp = await this.client.chat.completions.create({
        model,
        messages: [
          ...originalMessages.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          })),
          {
            role: "assistant" as const,
            content: null,
            tool_calls: Array.from(toolCallsBuffer.entries()).map(([index, tool]) => ({
              id: `call_${index}`,
              type: "function" as const,
              function: { name: tool.name, arguments: tool.arguments },
            })),
          },
          ...Array.from(toolCallsBuffer.entries()).map(([index, tool]) => ({
            role: "tool" as const,
            tool_call_id: `call_${index}`,
            content: `Displayed ${tool.name} to the user.`,
          })),
        ],
        stream: true,
        max_tokens: 200,
      })

      for await (const chunk of followUp) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield { type: "text", content }
        }
      }
    } catch (error) {
      console.error("OpenAI follow-up error:", error)
    }
  }
}
