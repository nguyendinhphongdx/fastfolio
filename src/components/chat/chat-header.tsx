"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreHorizontal } from "lucide-react"

interface ChatHeaderProps {
  avatar: string | null
  headline: string | null
  username: string
  onBack: () => void
  showMenu?: boolean
  onMenuClick?: () => void
}

export function ChatHeader({
  avatar,
  headline,
  username,
  onBack,
  showMenu = true,
  onMenuClick,
}: ChatHeaderProps) {
  return (
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
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className="text-sm">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">
          {headline || username}
        </p>
      </div>
      {showMenu && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </header>
  )
}
