import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ExternalLink,
  Copy,
  Check,
  Circle,
  User,
  Brain,
  Wrench,
  HelpCircle,
  ChevronUp,
} from "lucide-react"

export default async function DashboardPage() {
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

  const portfolio = user.portfolio
  const plan = user.subscription?.plan || "FREE"
  const username = user.username || "yourname"
  const portfolioUrl = `https://fastfol.io/${username}`

  // Calculate checklist completion
  const checklist = [
    {
      name: "Basic Information",
      completed: !!(portfolio.headline && portfolio.avatar),
      icon: User,
      href: "/portfolio/basic",
      tasks: !portfolio.headline || !portfolio.avatar
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
      href: "/portfolio/persona",
      count: 8,
    },
  ]

  const completedCount = checklist.filter((item) => item.completed).length
  const totalCount = checklist.length

  // Usage stats
  const messagesLimit = plan === "FREE" ? 50 : plan === "PRO" ? 100 : 1000
  const messagesUsed = 0 // TODO: Fetch from DB

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Badge
            variant={portfolio.isPublished ? "default" : "outline"}
            className={
              portfolio.isPublished
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "text-orange-600 border-orange-300"
            }
          >
            {portfolio.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${username}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View portfolio
            </Button>
          </Link>
          <Link href="/portfolio/publish">
            <Button size="sm">Publish</Button>
          </Link>
        </div>
      </div>

      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Hello {username}!</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <code className="text-sm bg-muted px-2 py-1 rounded">{portfolioUrl}</code>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Portfolio Checklist */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Portfolio Checklist</h3>
              <p className="text-sm text-muted-foreground">
                Complete {totalCount - completedCount} more sections
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {completedCount}/{totalCount}
              </span>
              <ChevronUp className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            {checklist.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.completed ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-orange-500" />
                    )}
                    <span className="font-medium">{item.name}</span>
                    {item.count && (
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </div>
                  {!item.completed && (
                    <Link href={item.href}>
                      <Button variant="outline" size="sm">
                        Complete
                      </Button>
                    </Link>
                  )}
                </div>
                {item.tasks && item.tasks.length > 0 && (
                  <div className="ml-7 space-y-1">
                    {item.tasks.map((task, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        • {task}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Draft Mode Card */}
      {!portfolio.isPublished && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold mb-2">Portfolio in Draft Mode</h3>
            <p className="text-muted-foreground mb-4">
              Your portfolio is not published yet. Publish to make it accessible
              to everyone.
            </p>
            <Link href={`/${username}`} target="_blank">
              <Button variant="outline">
                Try it <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{messagesUsed}</span>
              <span className="text-muted-foreground">/{messagesLimit}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total messages used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Messages today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {plan === "FREE" ? (
              <Link href="/billing">
                <div className="flex items-center gap-2 text-primary">
                  <span className="font-medium">Unlock Analytics</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upgrade to access
                </p>
              </Link>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {portfolio._count.pageViews}
                </div>
                <p className="text-sm text-muted-foreground">Page views</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Questions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Recent Visitor Questions</h3>
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">No questions yet</p>
            <p className="text-sm text-muted-foreground">
              Share your portfolio to start receiving visitor questions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/portfolio/basic">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">Basic Info</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/portfolio/persona">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">AI Personality</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/portfolio/content">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">Tools</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/portfolio/persona">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">Questions</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
