"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ToolCard } from "./tool-card"
import {
  ChatHeader,
  MessageList,
  ChatInput,
  QuickActionGrid,
  type Message,
  type QuickAction,
} from "@/components/chat"
import {
  FolderKanban,
  Sparkles,
  PartyPopper,
  Mail,
  FileText,
} from "lucide-react"

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

const quickActions: QuickAction[] = [
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

  function handleQuickAction(actionId: string) {
    handleSend(`Show me your ${actionId}`)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-screen bg-white">
      <ChatHeader
        avatar={portfolio.avatar}
        headline={portfolio.headline}
        username={username}
        onBack={onBack}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {!hasMessages ? (
            <EmptyState
              portfolio={portfolio}
              username={username}
              onQuickAction={handleQuickAction}
            />
          ) : (
            <MessageList
              ref={messagesEndRef}
              messages={messages}
              avatar={portfolio.avatar}
              username={username}
              isLoading={isLoading}
              renderToolCard={(tool) => (
                <ToolCard
                  name={tool.name}
                  data={tool.data}
                  portfolio={portfolio}
                />
              )}
            />
          )}
        </div>
      </main>

      <ChatInput
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={() => handleSend(input)}
        onQuickAction={handleQuickAction}
        placeholder={portfolio.chatPlaceholder}
        disabled={isLoading}
        quickActions={quickActions}
      />
    </div>
  )
}

function EmptyState({
  portfolio,
  username,
  onQuickAction,
}: {
  portfolio: ChatInterfaceProps["portfolio"]
  username: string
  onQuickAction: (actionId: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Avatar className="h-16 w-16 mb-4">
        <AvatarImage src={portfolio.avatar || undefined} />
        <AvatarFallback className="text-xl">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        {portfolio.headline || `Chat with ${username}`}
      </h2>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
        {portfolio.tagline}
      </p>
      <QuickActionGrid actions={quickActions} onAction={onQuickAction} />
    </div>
  )
}
