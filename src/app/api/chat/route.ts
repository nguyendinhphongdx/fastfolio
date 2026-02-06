import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkMessageLimit } from "@/lib/subscription-service"
import { LLMProvider } from "@/lib/llm"
import {
  createChatProvider,
  ChatChunk,
  PortfolioPersona,
} from "@/lib/chat"

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

    // Create chat provider based on settings
    const llmSettings = portfolio.llmSettings
    const chatProvider = await createChatProvider({
      provider: (llmSettings?.provider as LLMProvider) || LLMProvider.SYSTEM,
      apiKey: llmSettings?.apiKey,
      model: llmSettings?.model,
    })

    // Build persona for system prompt
    const persona: PortfolioPersona = {
      name: portfolio.personaName || portfolio.user.name || "the portfolio owner",
      role: portfolio.personaRole || "a professional",
      tone: portfolio.personaTone,
      rules: portfolio.personaRules,
    }

    const systemPrompt = chatProvider.buildSystemPrompt(persona)

    // Stream the response
    return streamChatResponse(chatProvider, systemPrompt, message)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Stream chat response using Server-Sent Events
 */
function streamChatResponse(
  chatProvider: Awaited<ReturnType<typeof createChatProvider>>,
  systemPrompt: string,
  userMessage: string
): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chatStream = chatProvider.chatWithTools(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          { maxTokens: 500 }
        )

        for await (const chunk of chatStream) {
          const data = formatChunkForSSE(chunk)
          controller.enqueue(encoder.encode(data))
        }

        controller.close()
      } catch (error) {
        console.error("Stream error:", error)
        const errorData = JSON.stringify({
          type: "error",
          error: "Sorry, I encountered an error. Please try again.",
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

/**
 * Format chat chunk for Server-Sent Events
 */
function formatChunkForSSE(chunk: ChatChunk): string {
  switch (chunk.type) {
    case "text":
      return `data: ${JSON.stringify({ type: "text", content: chunk.content })}\n\n`

    case "tool":
      return `data: ${JSON.stringify({ type: "tool", tool: chunk.tool })}\n\n`

    case "done":
      return "data: [DONE]\n\n"

    case "error":
      return `data: ${JSON.stringify({ type: "error", error: chunk.error })}\n\n`

    default:
      return ""
  }
}
