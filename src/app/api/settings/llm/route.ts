import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption"
import { getUserPlan } from "@/lib/subscription-service"
import {
  LLMProvider,
  PROVIDER_MODELS,
  PROVIDER_INFO,
} from "@/lib/llm"
import { testApiKey, validateApiKeyFormat } from "@/lib/llm/factory"

// GET - Fetch current LLM settings
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has PRO plan
    const plan = await getUserPlan(session.user.id)
    if (plan === "FREE") {
      return NextResponse.json(
        { error: "Custom LLM settings require a PRO plan" },
        { status: 403 }
      )
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: { llmSettings: true },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    const settings = portfolio.llmSettings

    return NextResponse.json({
      settings: settings
        ? {
            provider: settings.provider,
            model: settings.model,
            hasApiKey: !!settings.apiKey,
            maskedApiKey: settings.apiKey
              ? maskApiKey(decrypt(settings.apiKey))
              : null,
          }
        : {
            provider: "SYSTEM",
            model: null,
            hasApiKey: false,
            maskedApiKey: null,
          },
      providers: Object.entries(PROVIDER_INFO).map(([key, info]) => ({
        id: key,
        ...info,
        models: PROVIDER_MODELS[key as LLMProvider],
      })),
    })
  } catch (error) {
    console.error("GET /api/settings/llm error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update LLM settings
export async function PUT(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has PRO plan
    const plan = await getUserPlan(session.user.id)
    if (plan === "FREE") {
      return NextResponse.json(
        { error: "Custom LLM settings require a PRO plan" },
        { status: 403 }
      )
    }

    const { provider, apiKey, model } = await req.json()

    // Validate provider
    if (!Object.values(LLMProvider).includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // If not SYSTEM provider, validate API key
    if (provider !== LLMProvider.SYSTEM) {
      if (!apiKey) {
        return NextResponse.json(
          { error: "API key is required for custom providers" },
          { status: 400 }
        )
      }

      // Validate key format
      const formatCheck = validateApiKeyFormat(provider, apiKey)
      if (!formatCheck.valid) {
        return NextResponse.json({ error: formatCheck.error }, { status: 400 })
      }
    }

    // Validate model if provided
    if (model && provider !== LLMProvider.SYSTEM) {
      const validModels = PROVIDER_MODELS[provider as LLMProvider]
      if (!validModels.some((m) => m.id === model)) {
        return NextResponse.json({ error: "Invalid model for provider" }, { status: 400 })
      }
    }

    // Upsert LLM settings
    const settings = await prisma.lLMSettings.upsert({
      where: { portfolioId: portfolio.id },
      create: {
        portfolioId: portfolio.id,
        provider: provider,
        apiKey: apiKey ? encrypt(apiKey) : null,
        model: model || null,
      },
      update: {
        provider: provider,
        apiKey: apiKey ? encrypt(apiKey) : null,
        model: model || null,
      },
    })

    return NextResponse.json({
      settings: {
        provider: settings.provider,
        model: settings.model,
        hasApiKey: !!settings.apiKey,
        maskedApiKey: settings.apiKey
          ? maskApiKey(decrypt(settings.apiKey))
          : null,
      },
    })
  } catch (error) {
    console.error("PUT /api/settings/llm error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Test API key
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has PRO plan
    const plan = await getUserPlan(session.user.id)
    if (plan === "FREE") {
      return NextResponse.json(
        { error: "Custom LLM settings require a PRO plan" },
        { status: 403 }
      )
    }

    const { provider, apiKey } = await req.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      )
    }

    // Test the API key
    const result = await testApiKey(provider as LLMProvider, apiKey)

    return NextResponse.json({
      valid: result.valid,
      error: result.error,
    })
  } catch (error) {
    console.error("POST /api/settings/llm error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
