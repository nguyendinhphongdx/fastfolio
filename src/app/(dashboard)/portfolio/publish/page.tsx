"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Globe, Lock, ExternalLink, Copy, Check } from "lucide-react"
import Link from "next/link"

export default function PublishPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [username, setUsername] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio")
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setIsPublished(data.isPublished || false)
            setUsername(data.user?.username || "")
          }
        }
      } catch (error) {
        console.error("Failed to fetch portfolio:", error)
      }
    }
    fetchPortfolio()
  }, [])

  const handlePublishToggle = async () => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      })

      if (res.ok) {
        setIsPublished(!isPublished)
        toast({
          title: isPublished ? "Portfolio Unpublished" : "Portfolio Published!",
          description: isPublished
            ? "Your portfolio is now private"
            : "Your portfolio is now live and accessible to everyone",
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const portfolioUrl = `https://fastfol.io/${username}`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(portfolioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied!",
      description: "Portfolio URL copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Publish</h1>
        <p className="text-muted-foreground">
          Control the visibility of your portfolio
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPublished ? (
              <>
                <Globe className="h-5 w-5 text-green-500" />
                Published
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-orange-500" />
                Draft Mode
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isPublished
              ? "Your portfolio is live and accessible to everyone"
              : "Your portfolio is private and only visible to you"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="publish-toggle">Portfolio Visibility</Label>
              <p className="text-sm text-muted-foreground">
                {isPublished
                  ? "Anyone with the link can view your portfolio"
                  : "Only you can see your portfolio"}
              </p>
            </div>
            <Switch
              id="publish-toggle"
              checked={isPublished}
              onCheckedChange={handlePublishToggle}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Portfolio URL */}
      <Card>
        <CardHeader>
          <CardTitle>Your Portfolio URL</CardTitle>
          <CardDescription>
            Share this link with recruiters, clients, or anyone you want to impress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-4 py-2 rounded-lg text-sm">
              {portfolioUrl}
            </code>
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Link href={`/${username}`} target="_blank">
              <Button variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your portfolio looks to visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${username}`} target="_blank">
            <Button className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Portfolio Preview
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Before You Publish</CardTitle>
          <CardDescription>
            Make sure you&apos;ve completed these steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Add your basic information (name, headline, avatar)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Configure your AI personality
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Add at least one project or skill
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Test the chat functionality
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
