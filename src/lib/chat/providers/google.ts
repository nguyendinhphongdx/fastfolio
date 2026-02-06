import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import {
  IChatProvider,
  ChatMessage,
  ChatOptions,
  ChatChunk,
  PortfolioPersona,
  PortfolioTool,
  TOOL_KEYWORDS,
  buildPersonaPrompt,
} from "../types"

// Google tool definitions
const GOOGLE_TOOLS = [
  {
    name: "show_projects",
    description: "Show the user's projects when asked about their work, portfolio, or projects",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "show_skills",
    description: "Show the user's skills and expertise when asked about their abilities or tech stack",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "show_contact",
    description: "Show contact information when asked how to reach, contact, or connect with the person",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "show_fun",
    description: "Show fun content, hobbies, or personal interests when asked about personal life or fun facts",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "show_resume",
    description: "Show or offer to download the resume when asked about CV or resume",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
]

export class GoogleChatProvider implements IChatProvider {
  readonly name = "Google"
  private genAI: GoogleGenerativeAI
  private defaultModel: string

  constructor(apiKey: string, model: string = "gemini-1.5-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey)
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

    // Extract system message
    const systemMessage = messages.find((m) => m.role === "system")?.content || ""
    const userMessage = messages.find((m) => m.role === "user")?.content || ""

    try {
      const generativeModel = this.genAI.getGenerativeModel({
        model,
        systemInstruction: systemMessage,
        tools: [{ functionDeclarations: GOOGLE_TOOLS }],
      })

      const chat = generativeModel.startChat({
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      })

      const result = await chat.sendMessageStream(userMessage)

      const toolsUsed: Array<{ name: PortfolioTool; data: Record<string, unknown> }> = []

      for await (const chunk of result.stream) {
        const candidates = chunk.candidates || []

        for (const candidate of candidates) {
          for (const part of candidate.content?.parts || []) {
            // Handle text
            if (part.text) {
              yield { type: "text", content: part.text }
            }

            // Handle function call
            if (part.functionCall) {
              const toolName = part.functionCall.name as PortfolioTool
              const toolData = (part.functionCall.args as Record<string, unknown>) || {}

              toolsUsed.push({ name: toolName, data: toolData })

              yield {
                type: "tool",
                tool: { name: toolName, data: toolData },
              }
            }
          }
        }
      }

      // If tools were used, generate follow-up
      if (toolsUsed.length > 0) {
        yield* this.generateFollowUp(chat, toolsUsed)
      }

      yield { type: "done" }
    } catch (error) {
      console.error("Google chat error:", error)

      // Fallback to prompt-based tool detection if function calling fails
      yield* this.fallbackChat(messages, options)
    }
  }

  private async *generateFollowUp(
    chat: ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["startChat"]>,
    toolsUsed: Array<{ name: PortfolioTool; data: Record<string, unknown> }>
  ): AsyncGenerator<ChatChunk, void, unknown> {
    try {
      // Send function response
      const functionResponses = toolsUsed.map((tool) => ({
        functionResponse: {
          name: tool.name,
          response: { displayed: true, message: `Displayed ${tool.name} to the user.` },
        },
      }))

      const result = await chat.sendMessageStream(functionResponses)

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          yield { type: "text", content: text }
        }
      }
    } catch (error) {
      console.error("Google follow-up error:", error)
    }
  }

  /**
   * Fallback method using prompt-based tool detection
   * Used when native function calling isn't available or fails
   */
  private async *fallbackChat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatChunk, void, unknown> {
    const model = options?.model || this.defaultModel
    const maxTokens = options?.maxTokens || 500

    const systemMessage = messages.find((m) => m.role === "system")?.content || ""
    const userMessage = messages.find((m) => m.role === "user")?.content || ""

    // Detect tool from message
    const detectedTool = this.detectTool(userMessage)

    // Enhanced prompt with tool instructions
    const enhancedSystem = `${systemMessage}

IMPORTANT: If the user asks about projects, skills, contact info, fun facts, or resume,
start your response with one of these exact markers on its own line:
[TOOL:show_projects] - for projects
[TOOL:show_skills] - for skills
[TOOL:show_contact] - for contact
[TOOL:show_fun] - for fun/hobbies
[TOOL:show_resume] - for resume
Then continue with your response.`

    try {
      const generativeModel = this.genAI.getGenerativeModel({
        model,
        systemInstruction: enhancedSystem,
      })

      const result = await generativeModel.generateContentStream(userMessage)

      let buffer = ""
      let toolSent = false

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (!text) continue

        buffer += text

        // Check for tool marker
        if (!toolSent && buffer.includes("[TOOL:")) {
          const toolMatch = buffer.match(/\[TOOL:(show_\w+)\]/)
          if (toolMatch) {
            yield {
              type: "tool",
              tool: { name: toolMatch[1] as PortfolioTool, data: {} },
            }
            toolSent = true
            buffer = buffer.replace(/\[TOOL:show_\w+\]\n?/, "")
          }
        }

        // Stream text content
        if (buffer.length > 0 && !buffer.includes("[TOOL:")) {
          yield { type: "text", content: buffer }
          buffer = ""
        }
      }

      // Send remaining buffer
      if (buffer.length > 0 && !buffer.startsWith("[TOOL:")) {
        yield { type: "text", content: buffer }
      }

      yield { type: "done" }
    } catch (error) {
      console.error("Google fallback chat error:", error)
      yield {
        type: "error",
        error: "Sorry, I encountered an error. Please try again.",
      }
    }
  }

  private detectTool(message: string): PortfolioTool | null {
    const lowerMessage = message.toLowerCase()
    for (const [tool, keywords] of Object.entries(TOOL_KEYWORDS)) {
      if (keywords.some((kw) => lowerMessage.includes(kw))) {
        return tool as PortfolioTool
      }
    }
    return null
  }
}
