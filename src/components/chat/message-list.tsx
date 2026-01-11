"use client"

import { forwardRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TypingIndicator } from "./typing-indicator"

export interface Message {
  role: "user" | "assistant"
  content: string
  toolCalls?: Array<{
    name: string
    data: unknown
  }>
}

interface MessageListProps {
  messages: Message[]
  avatar?: string | null
  username: string
  isLoading?: boolean
  renderToolCard?: (tool: { name: string; data: unknown }) => React.ReactNode
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList(
    { messages, avatar, username, isLoading, renderToolCard },
    ref
  ) {
    return (
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
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[75%] ${
                message.role === "user"
                  ? "bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2.5"
                  : "text-gray-900"
              }`}
            >
              {message.toolCalls?.map((tool, toolIndex) => (
                <div key={toolIndex} className="mb-3">
                  {renderToolCard?.(tool)}
                </div>
              ))}
              {message.content && (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {message.content}
                </p>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <TypingIndicator avatar={avatar} username={username} />
        )}
        <div ref={ref} />
      </div>
    )
  }
)
