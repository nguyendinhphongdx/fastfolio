"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Eye, TrendingUp } from "lucide-react"

interface Analytics {
  totalMessages: number
  totalConversations: number
  totalPageViews: number
  messagesThisWeek: number
  topQuestions: Array<{ question: string; count: number }>
  messagesByDay: Array<{ date: string; count: number }>
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics")
        if (res.ok) {
          const data = await res.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Loading your analytics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Messages",
      value: analytics?.totalMessages || 0,
      icon: MessageSquare,
      description: "All-time messages received",
    },
    {
      title: "Conversations",
      value: analytics?.totalConversations || 0,
      icon: Users,
      description: "Unique visitors who chatted",
    },
    {
      title: "Page Views",
      value: analytics?.totalPageViews || 0,
      icon: Eye,
      description: "Total portfolio views",
    },
    {
      title: "This Week",
      value: analytics?.messagesThisWeek || 0,
      icon: TrendingUp,
      description: "Messages in last 7 days",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track how visitors are engaging with your portfolio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Top Questions</CardTitle>
          <CardDescription>
            What visitors are asking about most
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.topQuestions && analytics.topQuestions.length > 0 ? (
            <div className="space-y-4">
              {analytics.topQuestions.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm">{item.question}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.count} times
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No questions yet. Share your portfolio to start collecting data!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Message Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Message Activity</CardTitle>
          <CardDescription>
            Messages received over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.messagesByDay && analytics.messagesByDay.length > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {analytics.messagesByDay.map((day, index) => {
                const maxCount = Math.max(
                  ...analytics.messagesByDay.map((d) => d.count),
                  1
                )
                const height = (day.count / maxCount) * 100
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("en", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity yet. Messages will appear here once visitors start chatting.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
