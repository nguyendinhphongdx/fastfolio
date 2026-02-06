/**
 * Chat Provider Types - Interface definitions for portfolio chat
 */

// Tool definitions for rich content display
export const PORTFOLIO_TOOLS = [
  "show_projects",
  "show_skills",
  "show_contact",
  "show_fun",
  "show_resume",
] as const

export type PortfolioTool = (typeof PORTFOLIO_TOOLS)[number]

// Tool keywords for detection (used by providers without native tool calling)
export const TOOL_KEYWORDS: Record<PortfolioTool, string[]> = {
  show_projects: ["project", "work", "portfolio", "built", "created", "developed"],
  show_skills: ["skill", "tech", "technology", "stack", "expertise", "ability", "know"],
  show_contact: ["contact", "reach", "email", "connect", "hire", "message"],
  show_fun: ["fun", "hobby", "hobbies", "personal", "interest", "free time"],
  show_resume: ["resume", "cv", "curriculum"],
}

// Chat message format
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

// Stream chunk types
export interface TextChunk {
  type: "text"
  content: string
}

export interface ToolChunk {
  type: "tool"
  tool: {
    name: PortfolioTool
    data: Record<string, unknown>
  }
}

export interface DoneChunk {
  type: "done"
}

export interface ErrorChunk {
  type: "error"
  error: string
}

export type ChatChunk = TextChunk | ToolChunk | DoneChunk | ErrorChunk

// Chat options
export interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

// Portfolio persona for building system prompt
export interface PortfolioPersona {
  name: string
  role: string
  tone: string
  rules: string | null
}

/**
 * Chat Provider Interface
 * All providers must implement this interface for consistent chat behavior
 */
export interface IChatProvider {
  readonly name: string

  /**
   * Stream chat response with tool calling support
   * Returns an async generator that yields ChatChunks
   */
  chatWithTools(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatChunk, void, unknown>

  /**
   * Build system prompt from persona
   */
  buildSystemPrompt(persona: PortfolioPersona): string
}

/**
 * Detect tool from message using keywords
 */
export function detectToolFromMessage(message: string): PortfolioTool | null {
  const lowerMessage = message.toLowerCase()
  for (const [tool, keywords] of Object.entries(TOOL_KEYWORDS)) {
    if (keywords.some((kw) => lowerMessage.includes(kw))) {
      return tool as PortfolioTool
    }
  }
  return null
}

/**
 * Build base persona prompt
 */
export function buildPersonaPrompt(persona: PortfolioPersona): string {
  return `You are an AI assistant representing ${persona.name}, who is ${persona.role}.

PERSONALITY:
- Communication style: ${persona.tone.toLowerCase()}
- Be helpful and friendly
- Keep responses concise (2-3 sentences max unless more detail is requested)
- Don't make up information - only share what you know about ${persona.name}

RULES:
${persona.rules || "- Be professional and helpful"}
- When asked about projects, skills, contact, fun facts, or resume, show rich content
- After showing content, add a brief friendly comment
- Don't repeat information that's already displayed

IMPORTANT: You represent ${persona.name}. Speak as if you ARE them when appropriate, using "I" and "my".`
}
