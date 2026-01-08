"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FluidBackground } from "./fluid-background"
import { ChatInterface } from "./chat-interface"
import {
  FolderKanban,
  Sparkles,
  PartyPopper,
  Mail,
  FileText,
  Send
} from "lucide-react"
import Link from "next/link"

interface PortfolioViewProps {
  portfolio: {
    id: string
    avatar: string | null
    headline: string | null
    tagline: string
    chatPlaceholder: string
    contactEmail: string | null
    contactPhone: string | null
    linkedinUrl: string | null
    githubUrl: string | null
    websiteUrl: string | null
    projects: Array<{
      id: string
      name: string
      description: string | null
      image: string | null
      url: string | null
    }>
    skills: Array<{
      id: string
      name: string
      icon: string | null
      skills: string[]
    }>
    funContent: {
      title: string | null
      description: string | null
      images: Array<{ url: string; caption: string | null }>
    } | null
    resume: {
      url: string
      fileName: string
    } | null
  }
  username: string
}

const quickActions = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "fun", label: "Fun", icon: PartyPopper },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "resume", label: "Resume", icon: FileText },
]

export function PortfolioView({ portfolio, username }: PortfolioViewProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showChat, setShowChat] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setShowChat(true)
    }
  }

  function handleQuickAction(action: string) {
    setQuery(`Show me your ${action}`)
    setShowChat(true)
  }

  if (showChat) {
    return (
      <ChatInterface
        portfolio={portfolio}
        username={username}
        initialQuery={query}
        onBack={() => {
          setShowChat(false)
          setQuery("")
        }}
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <FluidBackground />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 text-gray-600">
          @{username}
        </Badge>
        <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
          Fastfolio
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            isFocused ? "scale-95" : "scale-100"
          }`}
        >
          {/* Headline */}
          <h2 className="text-lg md:text-xl text-gray-600 text-center mb-2">
            {portfolio.headline || `Hey, I'm ${username}`}
          </h2>

          {/* Tagline - Large */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 text-center mb-8">
            {portfolio.tagline}
          </h1>

          {/* Avatar */}
          <Avatar className="h-40 w-40 border-4 border-white shadow-xl mb-10">
            <AvatarImage src={portfolio.avatar || undefined} />
            <AvatarFallback className="text-5xl bg-gray-100 text-gray-600">
              {portfolio.headline?.charAt(0) || username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Chat Input */}
          <form
            onSubmit={handleSubmit}
            className={`w-full max-w-xl transition-all duration-300 ${
              isFocused ? "scale-95" : "scale-100"
            }`}
          >
            <div
              className={`relative flex items-center bg-white rounded-full shadow-lg border transition-all duration-300 ${
                isFocused ? "border-gray-900 shadow-xl" : "border-gray-200"
              }`}
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={portfolio.chatPlaceholder}
                className="flex-1 border-0 bg-transparent rounded-full py-6 px-6 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
              />
              <Button
                type="submit"
                size="icon"
                className={`mr-2 rounded-full transition-colors ${
                  isFocused ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Quick Actions */}
          <div
            className={`flex flex-wrap justify-center gap-3 mt-8 transition-all duration-300 ${
              isFocused ? "scale-95 opacity-80" : "scale-100 opacity-100"
            }`}
          >
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="default"
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 rounded-xl px-4 py-2 h-auto"
                onClick={() => handleQuickAction(action.id)}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </main>

      {/* Powered by badge */}
      <div className="absolute bottom-4 right-4 z-10">
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 transition-colors"
        >
          Powered by Fastfolio
        </Link>
      </div>
    </div>
  )
}
