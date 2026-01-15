import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createDefaultCategories } from "@/lib/suggested-categories"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        portfolio: true,
      },
    })

    return NextResponse.json({
      user: {
        id: user?.id,
        username: user?.username,
        name: user?.name,
        email: user?.email,
      },
      portfolio: user?.portfolio,
    })
  } catch (error) {
    console.error("GET /api/portfolio error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const {
      username,
      headline,
      tagline,
      chatPlaceholder,
      avatar,
      avatarStyle,
      contactEmail,
      contactPhone,
      linkedinUrl,
      githubUrl,
      websiteUrl,
      personaName,
      personaRole,
      personaTone,
      personaRules,
      cursorAnimation,
      isPublished,
    } = data

    // Validate username if provided
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        )
      }
    }

    // Update user username
    if (username !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { username },
      })
    }

    // Check if portfolio already exists
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    // Upsert portfolio
    const portfolio = await prisma.portfolio.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        headline,
        tagline,
        chatPlaceholder,
        avatar,
        avatarStyle,
        contactEmail,
        contactPhone,
        linkedinUrl,
        githubUrl,
        websiteUrl,
        personaName,
        personaRole,
        personaTone,
        personaRules,
        cursorAnimation,
        isPublished: isPublished || false,
      },
      update: {
        ...(headline !== undefined && { headline }),
        ...(tagline !== undefined && { tagline }),
        ...(chatPlaceholder !== undefined && { chatPlaceholder }),
        ...(avatar !== undefined && { avatar }),
        ...(avatarStyle !== undefined && { avatarStyle }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(personaName !== undefined && { personaName }),
        ...(personaRole !== undefined && { personaRole }),
        ...(personaTone !== undefined && { personaTone }),
        ...(personaRules !== undefined && { personaRules }),
        ...(cursorAnimation !== undefined && { cursorAnimation }),
        ...(isPublished !== undefined && { isPublished }),
      },
    })

    // If this is a new portfolio, create default suggested categories
    if (!existingPortfolio) {
      await createDefaultCategories(portfolio.id)
    }

    return NextResponse.json({ portfolio })
  } catch (error) {
    console.error("PUT /api/portfolio error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
