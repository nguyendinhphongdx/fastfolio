import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projects, skills } = await req.json()

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Delete existing projects and skills
    await prisma.project.deleteMany({
      where: { portfolioId: portfolio.id },
    })

    await prisma.skill.deleteMany({
      where: { portfolioId: portfolio.id },
    })

    // Create new projects
    if (projects && projects.length > 0) {
      await prisma.project.createMany({
        data: projects.map((project: { title: string; description: string; url?: string; technologies: string }) => ({
          portfolioId: portfolio.id,
          title: project.title,
          description: project.description,
          url: project.url || null,
          technologies: project.technologies,
        })),
      })
    }

    // Create new skills
    if (skills && skills.length > 0) {
      await prisma.skill.createMany({
        data: skills.map((skill: { name: string; level: string }) => ({
          portfolioId: portfolio.id,
          name: skill.name,
          level: skill.level,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Content update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
