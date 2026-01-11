import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/lib/subscription"
import { getUserPlan, checkProjectLimit, checkSkillCategoryLimit } from "@/lib/subscription-service"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's portfolio with projects and skills
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: {
        projects: {
          orderBy: { order: "asc" },
        },
        skills: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!portfolio) {
      return NextResponse.json({ projects: [], skills: [] })
    }

    return NextResponse.json({
      projects: portfolio.projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        url: p.url,
        techStack: p.techStack,
      })),
      skills: portfolio.skills.map((s) => ({
        id: s.id,
        name: s.name,
        skills: s.skills,
      })),
    })
  } catch (error) {
    console.error("Content fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Get user's plan limits
    const plan = await getUserPlan(session.user.id)
    const limits = getPlanLimits(plan)

    // Check project limit
    if (projects && projects.length > 0) {
      const maxProjects = limits.maxProjects
      if (maxProjects !== -1 && projects.length > maxProjects) {
        return NextResponse.json(
          {
            error: `Project limit exceeded. Your ${plan} plan allows up to ${maxProjects} projects.`,
            type: "LIMIT_EXCEEDED",
            limit: maxProjects,
            requested: projects.length,
          },
          { status: 403 }
        )
      }
    }

    // Check skill category limit
    if (skills && skills.length > 0) {
      const maxSkills = limits.maxSkillCategories
      if (maxSkills !== -1 && skills.length > maxSkills) {
        return NextResponse.json(
          {
            error: `Skill category limit exceeded. Your ${plan} plan allows up to ${maxSkills} skill categories.`,
            type: "LIMIT_EXCEEDED",
            limit: maxSkills,
            requested: skills.length,
          },
          { status: 403 }
        )
      }
    }

    // Delete existing projects and skills
    await prisma.project.deleteMany({
      where: { portfolioId: portfolio.id },
    })

    await prisma.skillCategory.deleteMany({
      where: { portfolioId: portfolio.id },
    })

    // Create new projects
    if (projects && projects.length > 0) {
      await prisma.project.createMany({
        data: projects.map((project: { name: string; description: string; url?: string; techStack: string[] }, index: number) => ({
          portfolioId: portfolio.id,
          name: project.name,
          description: project.description,
          url: project.url || null,
          techStack: project.techStack || [],
          order: index,
        })),
      })
    }

    // Create new skill categories
    if (skills && skills.length > 0) {
      await prisma.skillCategory.createMany({
        data: skills.map((skill: { name: string; skills: string[] }, index: number) => ({
          portfolioId: portfolio.id,
          name: skill.name,
          skills: skill.skills || [],
          order: index,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Content update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
