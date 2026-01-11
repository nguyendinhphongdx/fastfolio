import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface StatsGridProps {
  messagesUsed: number
  messagesLimit: number
  messagesToday: number
  pageViews: number
  plan: string
}

export function StatsGrid({
  messagesUsed,
  messagesLimit,
  messagesToday,
  pageViews,
  plan,
}: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        value={messagesUsed}
        limit={messagesLimit}
        label="Total messages used"
      />
      <StatCard value={messagesToday} label="Messages today" />
      {plan === "FREE" ? (
        <UpgradeCard />
      ) : (
        <StatCard value={pageViews} label="Page views" />
      )}
    </div>
  )
}

interface StatCardProps {
  value: number
  limit?: number
  label: string
}

function StatCard({ value, limit, label }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{value}</span>
          {limit !== undefined && (
            <span className="text-muted-foreground">/{limit}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function UpgradeCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Link href="/billing">
          <div className="flex items-center gap-2 text-primary">
            <span className="font-medium">Unlock Analytics</span>
            <ExternalLink className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">Upgrade to access</p>
        </Link>
      </CardContent>
    </Card>
  )
}
