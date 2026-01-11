import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { checkMessageLimit } from "@/lib/subscription-service"
import { decrypt } from "@/lib/encryption"
import { LLMProvider } from "@/lib/llm"
import { OpenAIProvider } from "@/lib/llm/providers/openai"
import { AnthropicProvider } from "@/lib/llm/providers/anthropic"
import { GoogleProvider } from "@/lib/llm/providers/google"

// Lazy initialize system OpenAI client
let systemOpenAI: OpenAI | null = null
function getSystemOpenAI() {
  if (!systemOpenAI) {
    systemOpenAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return systemOpenAI
}

// Tool definitions for OpenAI
const tools: OpenAI.ChatCompletionTool[] = [
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

// Tool keywords for non-OpenAI providers (prompt-based detection)
const toolKeywords = {
  show_projects: ["project", "work", "portfolio", "built", "created", "developed"],
  show_skills: ["skill", "tech", "technology", "stack", "expertise", "ability", "know"],
  show_contact: ["contact", "reach", "email", "connect", "hire", "message"],
  show_fun: ["fun", "hobby", "hobbies", "personal", "interest", "free time"],
  show_resume: ["resume", "cv", "curriculum"],
}

function detectToolFromMessage(message: string): string | null {
  const lowerMessage = message.toLowerCase()
  for (const [tool, keywords] of Object.entries(toolKeywords)) {
    if (keywords.some((kw) => lowerMessage.includes(kw))) {
      return tool
    }
  }
  return null
}

export async function POST(req: Request) {
  try {
    const { portfolioId, message } = await req.json()

    if (!portfolioId || !message) {
      return NextResponse.json(
        { error: "Missing portfolioId or message" },
        { status: 400 }
      )
    }

    // Get portfolio with persona info and LLM settings
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        user: true,
        llmSettings: true,
      },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Check message limit for portfolio owner
    const limitCheck = await checkMessageLimit(portfolio.userId, portfolioId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Message limit reached",
          type: "LIMIT_REACHED",
          current: limitCheck.current,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        },
        { status: 429 }
      )
    }

    // Determine which provider to use
    const llmSettings = portfolio.llmSettings
    const provider = (llmSettings?.provider as LLMProvider) || LLMProvider.SYSTEM
    const model = llmSettings?.model || null

    // Build persona prompt
    const personaPrompt = buildPersonaPrompt(portfolio)

    // Use OpenAI with tool calling for SYSTEM and OPENAI providers
    if (provider === LLMProvider.SYSTEM || provider === LLMProvider.OPENAI) {
      return handleOpenAIChat(
        provider,
        llmSettings?.apiKey,
        model,
        personaPrompt,
        message
      )
    }

    // Use streaming without tool calling for other providers
    return handleGenericChat(
      provider,
      llmSettings?.apiKey!,
      model,
      personaPrompt,
      message
    )
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleOpenAIChat(
  provider: LLMProvider,
  encryptedApiKey: string | null | undefined,
  model: string | null,
  personaPrompt: string,
  message: string
) {
  // Get OpenAI client (system or custom)
  let client: OpenAI
  if (provider === LLMProvider.SYSTEM) {
    client = getSystemOpenAI()
  } else {
    if (!encryptedApiKey) throw new Error("API key required for OpenAI")
    const apiKey = decrypt(encryptedApiKey)
    client = new OpenAI({ apiKey })
  }

  const modelId = model || (provider === LLMProvider.SYSTEM ? "gpt-4o-mini" : "gpt-4o")

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await client.chat.completions.create({
          model: modelId,
          messages: [
            { role: "system", content: personaPrompt },
            { role: "user", content: message },
          ],
          tools,
          tool_choice: "auto",
          stream: true,
          max_tokens: 500,
        })

        let toolCallsBuffer: Map<number, { name: string; arguments: string }> = new Map()

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta

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

          if (delta?.content) {
            const data = JSON.stringify({ type: "text", content: delta.content })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          if (chunk.choices[0]?.finish_reason === "tool_calls") {
            for (const [, tool] of toolCallsBuffer) {
              const data = JSON.stringify({
                type: "tool",
                tool: { name: tool.name, data: tool.arguments ? JSON.parse(tool.arguments) : {} },
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            // Follow-up response
            const followUp = await client.chat.completions.create({
              model: modelId,
              messages: [
                { role: "system", content: personaPrompt },
                { role: "user", content: message },
                {
                  role: "assistant",
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

            for await (const followUpChunk of followUp) {
              const content = followUpChunk.choices[0]?.delta?.content
              if (content) {
                const data = JSON.stringify({ type: "text", content })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (error) {
        console.error("OpenAI stream error:", error)
        const errorData = JSON.stringify({
          type: "text",
          content: "Sorry, I encountered an error. Please try again.",
        })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

async function handleGenericChat(
  provider: LLMProvider,
  encryptedApiKey: string,
  model: string | null,
  personaPrompt: string,
  message: string
) {
  const apiKey = decrypt(encryptedApiKey)

  // Detect if we should show a tool based on message
  const detectedTool = detectToolFromMessage(message)

  // Add tool instruction to prompt for non-OpenAI providers
  const enhancedPrompt = `${personaPrompt}

IMPORTANT: If the user asks about projects, skills, contact info, fun facts, or resume,
start your response with one of these exact markers on its own line:
[TOOL:show_projects] - for projects
[TOOL:show_skills] - for skills
[TOOL:show_contact] - for contact
[TOOL:show_fun] - for fun/hobbies
[TOOL:show_resume] - for resume
Then continue with your response.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let llmProvider
        const modelId = model || getDefaultModelForProvider(provider)

        if (provider === LLMProvider.ANTHROPIC) {
          llmProvider = new AnthropicProvider(apiKey, modelId)
        } else if (provider === LLMProvider.GOOGLE) {
          llmProvider = new GoogleProvider(apiKey, modelId)
        } else {
          throw new Error("Unsupported provider")
        }

        const chatStream = llmProvider.chatStream(
          [
            { role: "system", content: enhancedPrompt },
            { role: "user", content: message },
          ],
          { model: modelId, maxTokens: 500 }
        )

        let buffer = ""
        let toolSent = false

        for await (const chunk of chatStream) {
          if (!chunk.content) continue

          buffer += chunk.content

          // Check for tool marker at the start
          if (!toolSent && buffer.includes("[TOOL:")) {
            const toolMatch = buffer.match(/\[TOOL:(show_\w+)\]/)
            if (toolMatch) {
              const toolName = toolMatch[1]
              const toolData = JSON.stringify({
                type: "tool",
                tool: { name: toolName, data: {} },
              })
              controller.enqueue(encoder.encode(`data: ${toolData}\n\n`))
              toolSent = true

              // Remove the tool marker from buffer
              buffer = buffer.replace(/\[TOOL:show_\w+\]\n?/, "")
            }
          }

          // Stream the text content
          if (buffer.length > 0 && !buffer.includes("[TOOL:")) {
            const data = JSON.stringify({ type: "text", content: buffer })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            buffer = ""
          }
        }

        // Send any remaining buffer
        if (buffer.length > 0 && !buffer.startsWith("[TOOL:")) {
          const data = JSON.stringify({ type: "text", content: buffer })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (error) {
        console.error("Generic stream error:", error)
        const errorData = JSON.stringify({
          type: "text",
          content: "Sorry, I encountered an error. Please try again.",
        })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

function getDefaultModelForProvider(provider: LLMProvider): string {
  switch (provider) {
    case LLMProvider.ANTHROPIC:
      return "claude-3-5-sonnet-20241022"
    case LLMProvider.GOOGLE:
      return "gemini-1.5-flash"
    default:
      return "gpt-4o-mini"
  }
}

function buildPersonaPrompt(portfolio: {
  personaName: string | null
  personaRole: string | null
  personaTone: string
  personaRules: string | null
  user: { name: string | null }
}): string {
  const name = portfolio.personaName || portfolio.user.name || "the portfolio owner"
  const role = portfolio.personaRole || "a professional"
  const tone = portfolio.personaTone.toLowerCase()

  return `You are an AI assistant representing ${name}, who is ${role}.

PERSONALITY:
- Communication style: ${tone}
- Be helpful and friendly
- Keep responses concise (2-3 sentences max unless more detail is requested)
- Don't make up information - only share what you know about ${name}

RULES:
${portfolio.personaRules || "- Be professional and helpful"}
- When asked about projects, skills, contact, fun facts, or resume, show rich content
- After showing content, add a brief friendly comment
- Don't repeat information that's already displayed

IMPORTANT: You represent ${name}. Speak as if you ARE them when appropriate, using "I" and "my".`
}
