import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PortfolioView } from "@/components/portfolio/portfolio-view"

interface PortfolioPageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PortfolioPageProps) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      portfolio: true,
    },
  })

  if (!user?.portfolio?.isPublished) {
    return {
      title: "Portfolio Not Found",
    }
  }

  return {
    title: `${user.portfolio.headline || user.name} - AI Portfolio`,
    description: user.portfolio.tagline || "AI Portfolio",
  }
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      portfolio: {
        include: {
          projects: {
            orderBy: { order: "asc" },
          },
          skills: {
            orderBy: { order: "asc" },
          },
          funContent: {
            include: {
              images: {
                orderBy: { order: "asc" },
              },
            },
          },
          resume: true,
          questions: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!user?.portfolio?.isPublished) {
    notFound()
  }

  // Track page view
  await prisma.pageView.create({
    data: {
      portfolioId: user.portfolio.id,
      path: `/${username}`,
    },
  })

  return (
    <PortfolioView
      portfolio={user.portfolio}
      username={username}
    />
  )
}
