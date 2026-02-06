import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption"
import { LLMProvider, PROVIDER_MODELS, PROVIDER_INFO } from "@/lib/llm/types"
import { validateApiKeyFormat, testApiKey } from "@/lib/llm/factory"

// List of admin emails (you can move this to env or database)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || []

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user?.email) return false

  // Check if user email is in admin list
  return ADMIN_EMAILS.includes(user.email)
}

/**
 * GET /api/admin/settings
 * Get current system settings (admin only)
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin access
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get or create system settings
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "system" },
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "system",
          defaultProvider: "OPENAI",
          defaultModel: "gpt-4o-mini",
        },
      })
    }

    // Mask the API key for display
    let maskedApiKey: string | null = null
    if (settings.defaultApiKey) {
      try {
        const decryptedKey = decrypt(settings.defaultApiKey)
        maskedApiKey = maskApiKey(decryptedKey)
      } catch {
        maskedApiKey = "Invalid key (decryption failed)"
      }
    }

    // Build providers list with models
    const providers = Object.values(LLMProvider)
      .filter((p) => p !== LLMProvider.SYSTEM)
      .map((providerId) => ({
        id: providerId,
        ...PROVIDER_INFO[providerId],
        models: PROVIDER_MODELS[providerId],
      }))

    return NextResponse.json({
      settings: {
        defaultProvider: settings.defaultProvider,
        defaultModel: settings.defaultModel,
        hasApiKey: !!settings.defaultApiKey,
        maskedApiKey,
        maxMessagesPerMinute: settings.maxMessagesPerMinute,
        maxTokensPerRequest: settings.maxTokensPerRequest,
      },
      providers,
    })
  } catch (error) {
    console.error("GET /api/admin/settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/settings
 * Test API key (admin only)
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { provider, apiKey } = await req.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      )
    }

    // Validate format first
    const formatResult = validateApiKeyFormat(provider, apiKey)
    if (!formatResult.valid) {
      return NextResponse.json(formatResult)
    }

    // Test the API key
    const testResult = await testApiKey(provider, apiKey)
    return NextResponse.json(testResult)
  } catch (error) {
    console.error("POST /api/admin/settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/settings
 * Update system settings (admin only)
 */
export async function PUT(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      defaultProvider,
      defaultModel,
      apiKey,
      maxMessagesPerMinute,
      maxTokensPerRequest,
    } = await req.json()

    // Validate provider
    if (defaultProvider && !Object.values(LLMProvider).includes(defaultProvider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    // Encrypt API key if provided
    let encryptedApiKey: string | undefined
    if (apiKey) {
      encryptedApiKey = encrypt(apiKey)
    }

    // Update or create settings
    const settings = await prisma.systemSettings.upsert({
      where: { id: "system" },
      create: {
        id: "system",
        defaultProvider: defaultProvider || "OPENAI",
        defaultModel: defaultModel || "gpt-4o-mini",
        defaultApiKey: encryptedApiKey,
        maxMessagesPerMinute: maxMessagesPerMinute ?? 20,
        maxTokensPerRequest: maxTokensPerRequest ?? 500,
      },
      update: {
        ...(defaultProvider && { defaultProvider }),
        ...(defaultModel && { defaultModel }),
        ...(encryptedApiKey && { defaultApiKey: encryptedApiKey }),
        ...(maxMessagesPerMinute !== undefined && { maxMessagesPerMinute }),
        ...(maxTokensPerRequest !== undefined && { maxTokensPerRequest }),
      },
    })

    // Mask the API key for response
    let maskedApiKey: string | null = null
    if (settings.defaultApiKey) {
      try {
        const decryptedKey = decrypt(settings.defaultApiKey)
        maskedApiKey = maskApiKey(decryptedKey)
      } catch {
        maskedApiKey = null
      }
    }

    return NextResponse.json({
      settings: {
        defaultProvider: settings.defaultProvider,
        defaultModel: settings.defaultModel,
        hasApiKey: !!settings.defaultApiKey,
        maskedApiKey,
        maxMessagesPerMinute: settings.maxMessagesPerMinute,
        maxTokensPerRequest: settings.maxTokensPerRequest,
      },
    })
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
