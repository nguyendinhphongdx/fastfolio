"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  Brain,
  Wrench,
  HelpCircle,
  BarChart3,
  Rocket,
  LogOut,
  Share2,
  ChevronDown,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const mainLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Publish",
    href: "/portfolio/publish",
    icon: Rocket,
  },
]

const configureLinks = [
  {
    title: "Basic Info",
    href: "/portfolio/basic",
    icon: User,
  },
  {
    title: "AI Personality",
    href: "/portfolio/persona",
    icon: Brain,
  },
  {
    title: "Tools",
    href: "/portfolio/content",
    icon: Wrench,
  },
  {
    title: "Questions",
    href: "/portfolio/questions",
    icon: HelpCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  // TODO: Fetch from subscription
  const messagesUsed = 0
  const messagesLimit = 50

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-sm">F</span>
          </div>
          <span className="font-semibold text-lg">Fastfolio</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Main Links */}
        <div className="space-y-1">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.title}
              </Link>
            )
          })}
        </div>

        {/* Configure Section */}
        <div className="pt-4">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configure
          </p>
          <div className="space-y-1">
            {configureLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href + link.title}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.title}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Share Portfolio Button */}
        <div className="pt-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Share2 className="h-4 w-4" />
            Share Portfolio
          </Button>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t p-3 space-y-3">
        {/* Suggest a feature */}
        <Link
          href="#"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Suggest a feature
          <span className="text-xs">↗</span>
        </Link>

        {/* Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">
              {messagesUsed}/{messagesLimit}
            </span>
          </div>
          <Progress value={(messagesUsed / messagesLimit) * 100} className="h-1" />
        </div>

        {/* User Menu */}
        <div className="pt-2 border-t">
          <button
            className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-muted transition-colors"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name?.[0] || user?.email?.[0] || "U"}
              </span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium truncate">
                {user?.name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
