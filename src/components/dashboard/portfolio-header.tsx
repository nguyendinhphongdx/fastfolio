"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface PortfolioHeaderProps {
  username: string
  isPublished: boolean
}

export function PortfolioHeader({ username, isPublished }: PortfolioHeaderProps) {
  const [copied, setCopied] = useState(false)
  const portfolioUrl = `https://fastfol.io/${username}`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(portfolioUrl)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Badge
          variant={isPublished ? "default" : "outline"}
          className={
            isPublished
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "text-orange-600 border-orange-300"
          }
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
