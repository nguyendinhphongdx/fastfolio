import Anthropic from "@anthropic-ai/sdk"
import {
  IChatProvider,
  ChatMessage,
  ChatOptions,
  ChatChunk,
  PortfolioPersona,
  PortfolioTool,
  buildPersonaPrompt,
} from "../types"

// Anthropic tool definitions using their native format
const ANTHROPIC_TOOLS: Anthropic.Tool[] = [
  {
    name: "show_projects",
    description: "Show the user's projects when asked about their work, portfolio, or projects",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "show_skills",
    description: "Show the user's skills and expertise when asked about their abilities or tech stack",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "show_contact",
    description: "Show contact information when asked how to reach, contact, or connect with the person",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "show_fun",
    description: "Show fun content, hobbies, or personal interests when asked about personal life or fun facts",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "show_resume",
    description: "Show or offer to download the resume when asked about CV or resume",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
]

export class AnthropicChatProvider implements IChatProvider {
  readonly name = "Anthropic"
  private client: Anthropic
  private defaultModel: string

  constructor(apiKey: string, model: string = "claude-3-5-sonnet-20241022") {
    this.client = new Anthropic({ apiKey })
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

    // Extract system message and user messages
    const systemMessage = messages.find((m) => m.role === "system")?.content || ""
    const userMessages = messages.filter((m) => m.role !== "system")

    try {
      const stream = this.client.messages.stream({
        model,
        max_tokens: maxTokens,
        system: systemMessage,
        tools: ANTHROPIC_TOOLS,
        messages: userMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      })

      let currentToolUse: { name: string; input: string } | null = null
      const toolsUsed: Array<{ name: PortfolioTool; data: Record<string, unknown> }> = []

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          if (event.content_block.type === "tool_use") {
            currentToolUse = { name: event.content_block.name, input: "" }
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            yield { type: "text", content: event.delta.text }
          } else if (event.delta.type === "input_json_delta" && currentToolUse) {
            currentToolUse.input += event.delta.partial_json
          }
        } else if (event.type === "content_block_stop") {
          if (currentToolUse) {
            const toolData = currentToolUse.input ? JSON.parse(currentToolUse.input) : {}
            toolsUsed.push({
              name: currentToolUse.name as PortfolioTool,
              data: toolData,
            })
            yield {
              type: "tool",
              tool: {
                name: currentToolUse.name as PortfolioTool,
                data: toolData,
              },
            }
            currentToolUse = null
          }
        }
      }

      // If tools were used, generate follow-up response
      if (toolsUsed.length > 0) {
        yield* this.generateFollowUp(systemMessage, userMessages, toolsUsed, model)
      }

      yield { type: "done" }
    } catch (error) {
      console.error("Anthropic chat error:", error)
      yield {
        type: "error",
        error: "Sorry, I encountered an error. Please try again.",
      }
    }
  }

  private async *generateFollowUp(
    systemMessage: string,
    userMessages: ChatMessage[],
    toolsUsed: Array<{ name: PortfolioTool; data: Record<string, unknown> }>,
    model: string
  ): AsyncGenerator<ChatChunk, void, unknown> {
    try {
      // Build tool use and result messages
      const toolUseBlocks = toolsUsed.map((tool, index) => ({
        type: "tool_use" as const,
        id: `tool_${index}`,
        name: tool.name,
        input: tool.data,
      }))

      const toolResultBlocks = toolsUsed.map((tool, index) => ({
        type: "tool_result" as const,
        tool_use_id: `tool_${index}`,
        content: `Displayed ${tool.name} to the user.`,
      }))

      const stream = this.client.messages.stream({
        model,
        max_tokens: 200,
        system: systemMessage,
        messages: [
          ...userMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          {
            role: "assistant" as const,
            content: toolUseBlocks,
          },
          {
            role: "user" as const,
            content: toolResultBlocks,
          },
        ],
      })

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text", content: event.delta.text }
        }
      }
    } catch (error) {
      console.error("Anthropic follow-up error:", error)
    }
  }
}
