"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TypingIndicatorProps {
  avatar?: string | null
  username: string
}

export function TypingIndicator({ avatar, username }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <Avatar className="h-7 w-7 mr-2 mt-1 shrink-0">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className="text-xs">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex gap-1 py-3">
        <span
          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  )
}
