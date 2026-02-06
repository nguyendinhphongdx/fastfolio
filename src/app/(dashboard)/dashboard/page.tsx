import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Brain, Wrench, HelpCircle } from "lucide-react"
import {
  PortfolioHeader,
  SetupChecklist,
  StatsGrid,
  QuickActions,
  RecentQuestions,
  DraftBanner,
  type ChecklistItem,
} from "@/components/dashboard"

export default async function DashboardPage(): Promise<React.ReactNode> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      portfolio: {
        include: {
          projects: true,
          skills: true,
          _count: {
            select: {
              conversations: true,
              pageViews: true,
            },
          },
        },
      },
      subscription: true,
    },
  })

  // If no portfolio, show onboarding
  if (!user?.portfolio) {
    return <OnboardingView />
  }

  const portfolio = user.portfolio
  const plan = user.subscription?.plan || "FREE"
  const username = user.username || "yourname"

  // Build checklist items
  const checklist: ChecklistItem[] = [
    {
      name: "Basic Information",
      completed: !!(portfolio.headline && portfolio.avatar),
      icon: User,
      href: "/portfolio/basic",
      tasks:
        !portfolio.headline || !portfolio.avatar
          ? ["Add your headline", "Upload your avatar"]
          : [],
    },
    {
      name: "AI Personality",
      completed: !!(portfolio.personaName && portfolio.personaRole),
      icon: Brain,
      href: "/portfolio/persona",
      tasks:
        !portfolio.personaName || !portfolio.personaRole
          ? [
              "Add your current role (required)",
              "Add what drives you (required)",
              "Add your communication style (required)",
            ]
          : [],
    },
    {
      name: "Tools",
      completed: portfolio.projects.length > 0 || portfolio.skills.length > 0,
      icon: Wrench,
      href: "/portfolio/content",
      tasks:
        portfolio.projects.length === 0 && portfolio.skills.length === 0
          ? ["Enable at least one tool"]
          : [],
    },
    {
      name: "Suggested Questions",
      completed: true,
      icon: HelpCircle,
      href: "/portfolio/questions",
      count: 8,
    },
  ]

  // Usage stats
  const messagesLimit = plan === "FREE" ? 50 : plan === "PRO" ? 1000 : -1
  const messagesUsed = 0 // TODO: Fetch from DB

  return (
    <div className="space-y-6">
      <PortfolioHeader username={username} isPublished={portfolio.isPublished} />

      <SetupChecklist items={checklist} />

      {!portfolio.isPublished && <DraftBanner username={username} />}

      <StatsGrid
        messagesUsed={messagesUsed}
        messagesLimit={messagesLimit}
        messagesToday={0}
        pageViews={portfolio._count.pageViews}
        plan={plan}
      />

      <RecentQuestions questions={[]} />

      <QuickActions />
    </div>
  )
}

function OnboardingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to Fastfolio</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Create your AI-powered portfolio and let recruiters talk to it.
      </p>
      <Link href="/portfolio/basic">
        <Button size="lg">Create Your Portfolio</Button>
      </Link>
    </div>
  )
}
