import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tool definitions for OpenAI
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "show_projects",
      description: "Show the user's projects when asked about their work, portfolio, or projects",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_skills",
      description: "Show the user's skills and expertise when asked about their abilities or tech stack",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_contact",
      description: "Show contact information when asked how to reach, contact, or connect with the person",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_fun",
      description: "Show fun content, hobbies, or personal interests when asked about personal life or fun facts",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_resume",
      description: "Show or offer to download the resume when asked about CV or resume",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
]

export async function POST(req: Request) {
  try {
    const { portfolioId, message } = await req.json()

    if (!portfolioId || !message) {
      return NextResponse.json(
        { error: "Missing portfolioId or message" },
        { status: 400 }
      )
    }

    // Get portfolio with persona info
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        user: true,
      },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Build persona prompt (cached per portfolio)
    const personaPrompt = buildPersonaPrompt(portfolio)

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
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

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index
                if (!toolCallsBuffer.has(index)) {
                  toolCallsBuffer.set(index, { name: "", arguments: "" })
                }
                const current = toolCallsBuffer.get(index)!
                if (toolCall.function?.name) {
                  current.name = toolCall.function.name
                }
                if (toolCall.function?.arguments) {
                  current.arguments += toolCall.function.arguments
                }
              }
            }

            // Handle text content
            if (delta?.content) {
              const data = JSON.stringify({ type: "text", content: delta.content })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            // Check if we've finished a tool call
            if (chunk.choices[0]?.finish_reason === "tool_calls") {
              for (const [_, tool] of toolCallsBuffer) {
                const data = JSON.stringify({
                  type: "tool",
                  tool: {
                    name: tool.name,
                    data: tool.arguments ? JSON.parse(tool.arguments) : {},
                  },
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }

              // Generate follow-up response after tool call
              const followUp = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                  { role: "system", content: personaPrompt },
                  { role: "user", content: message },
                  {
                    role: "assistant",
                    content: null,
                    tool_calls: Array.from(toolCallsBuffer.entries()).map(
                      ([index, tool]) => ({
                        id: `call_${index}`,
                        type: "function" as const,
                        function: {
                          name: tool.name,
                          arguments: tool.arguments,
                        },
                      })
                    ),
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
          console.error("Stream error:", error)
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
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
- When asked about projects, skills, contact, fun facts, or resume, use the appropriate tool to display rich content
- After using a tool, add a brief friendly comment about what was shown
- Don't repeat information that's already displayed in the tool card

IMPORTANT: You represent ${name}. Speak as if you ARE them when appropriate, using "I" and "my".`
}
