"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolCard } from "./tool-card"
import {
  ArrowLeft,
  Send,
  FolderKanban,
  Sparkles,
  PartyPopper,
  Mail,
  FileText,
  MoreHorizontal,
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
  const inputRef = useRef<HTMLInputElement>(null)

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

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header - minimal */}
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={portfolio.avatar || undefined} />
          <AvatarFallback className="text-sm">{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">
            {portfolio.headline || username}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {!hasMessages ? (
            // Empty state - centered content
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Avatar className="h-16 w-16 mb-4">
                <AvatarImage src={portfolio.avatar || undefined} />
                <AvatarFallback className="text-xl">{username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {portfolio.headline || `Chat with ${username}`}
              </h2>
              <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
                {portfolio.tagline}
              </p>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group"
                  >
                    <action.icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages list
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-7 w-7 mr-2 mt-1 shrink-0">
                      <AvatarImage src={portfolio.avatar || undefined} />
                      <AvatarFallback className="text-xs">{username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] ${
                      message.role === "user"
                        ? "bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2.5"
                        : "text-gray-900"
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
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <Avatar className="h-7 w-7 mr-2 mt-1 shrink-0">
                    <AvatarImage src={portfolio.avatar || undefined} />
                    <AvatarFallback className="text-xs">{username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 py-3">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area - Fixed at bottom */}
      <footer className="bg-white px-4 py-4">
        <div className={`mx-auto transition-all duration-300 ease-out ${isFocused ? "max-w-2xl" : "max-w-md"}`}>
          {/* Quick Actions - Only show when focused (animate in) */}
          <div className={`overflow-hidden transition-all duration-300 ease-out ${isFocused ? "max-h-24 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}>
            <div className="flex gap-2 justify-center flex-wrap">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleQuickAction(action.id)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all whitespace-nowrap"
                >
                  <action.icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}>
            <div className={`flex items-center gap-3 rounded-2xl border bg-gray-50 px-4 transition-all duration-300 ${isFocused ? "border-gray-300 bg-white shadow-lg py-3" : "border-gray-200 hover:border-gray-300 py-2"}`}>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={portfolio.chatPlaceholder}
                className="shadow-none bg-none flex-1 border-0 bg-transparent p-0 h-auto text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className={`shrink-0 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-300 ${isFocused ? "h-10 w-10" : "h-9 w-9"}`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  )
}
