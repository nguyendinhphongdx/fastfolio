import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon, User, Brain, Wrench, HelpCircle } from "lucide-react"

interface QuickAction {
  name: string
  icon: LucideIcon
  href: string
}

const defaultActions: QuickAction[] = [
  { name: "Basic Info", icon: User, href: "/portfolio/basic" },
  { name: "AI Personality", icon: Brain, href: "/portfolio/persona" },
  { name: "Tools", icon: Wrench, href: "/portfolio/content" },
  { name: "Questions", icon: HelpCircle, href: "/portfolio/questions" },
]

interface QuickActionsProps {
  actions?: QuickAction[]
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div>
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <QuickActionCard key={action.name} action={action} />
        ))}
      </div>
    </div>
  )
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon

  return (
    <Link href={action.href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="pt-6 text-center">
          <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <span className="text-sm font-medium">{action.name}</span>
        </CardContent>
      </Card>
    </Link>
  )
}

// Export types for reuse
export type { QuickAction }
