"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FluidBackground } from "./fluid-background"
import { ToolCard } from "./tool-card"
import {
  ArrowLeft,
  Send,
  FolderKanban,
  Sparkles,
  PartyPopper,
  Mail,
  FileText,
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  toolCalls?: Array<{
    name: string
    data: unknown
  }>
}

interface ChatInterfaceProps {
  portfolio: {
    id: string
    avatar: string | null
    headline: string | null
    tagline: string
    chatPlaceholder: string
    contactEmail: string | null
    contactPhone: string | null
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
  initialQuery: string
  onBack: () => void
}

const quickActions = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "fun", label: "Fun", icon: PartyPopper },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "resume", label: "Resume", icon: FileText },
]

export function ChatInterface({
  portfolio,
  username,
  initialQuery,
  onBack,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend(query: string) {
    if (!query.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: query }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: portfolio.id,
          message: query,
          conversationHistory: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let assistantMessage: Message = { role: "assistant", content: "", toolCalls: [] }
      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === "tool") {
              assistantMessage = {
                ...assistantMessage,
                toolCalls: [...(assistantMessage.toolCalls || []), parsed.tool],
              }
            } else if (parsed.type === "text") {
              assistantMessage = {
                ...assistantMessage,
                content: assistantMessage.content + parsed.content,
              }
            }

            setMessages((prev) => [...prev.slice(0, -1), assistantMessage])
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSend(input)
  }

  function handleQuickAction(action: string) {
    handleSend(`Show me your ${action}`)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <FluidBackground />

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-4 p-4 bg-black/10 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 border-2 border-white">
          <AvatarImage src={portfolio.avatar || undefined} />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-white">
            {portfolio.headline || username}
          </p>
          <p className="text-sm text-white/80">{portfolio.tagline}</p>
        </div>
      </header>

      {/* Messages */}
      <main className="relative z-10 flex flex-col min-h-[calc(100vh-140px)] p-4">
        <div className="flex-1 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-white text-gray-900"
                    : "bg-white/20 text-white backdrop-blur-sm"
                }`}
              >
                {/* Tool Cards */}
                {message.toolCalls?.map((tool, toolIndex) => (
                  <div key={toolIndex} className="mb-3">
                    <ToolCard
                      name={tool.name}
                      data={tool.data}
                      portfolio={portfolio}
                    />
                  </div>
                ))}
                {/* Text Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-white/20 text-white backdrop-blur-sm rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 z-20 p-4 bg-black/10 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <div
            className={`relative flex items-center bg-white rounded-full shadow-lg transition-all ${
              isFocused ? "ring-2 ring-black" : ""
            }`}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={portfolio.chatPlaceholder}
              className="flex-1 border-0 bg-transparent rounded-full py-5 px-6 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className={`mr-2 rounded-full ${
                isFocused ? "bg-primary" : "bg-gray-700"
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Quick Actions - Show when focused */}
        {isFocused && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0"
                onClick={() => handleQuickAction(action.id)}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </footer>
    </div>
  )
}
