"use client"

import { forwardRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { QuickActionPills, type QuickAction } from "./quick-actions"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onQuickAction?: (actionId: string) => void
  placeholder?: string
  disabled?: boolean
  quickActions?: QuickAction[]
  showQuickActions?: boolean
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  function ChatInput(
    {
      value,
      onChange,
      onSubmit,
      onQuickAction,
      placeholder = "Ask me anything...",
      disabled = false,
      quickActions = [],
      showQuickActions = true,
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false)

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit()
      }
    }

    return (
      <footer className="bg-white px-4 py-4">
        <div
          className={`mx-auto transition-all duration-300 ease-out ${
            isFocused ? "max-w-2xl" : "max-w-md"
          }`}
        >
          {showQuickActions && quickActions.length > 0 && onQuickAction && (
            <QuickActionPills
              actions={quickActions}
              onAction={onQuickAction}
              visible={isFocused}
            />
          )}

          <form onSubmit={handleSubmit}>
            <div
              className={`flex items-center gap-3 rounded-2xl border bg-gray-50 px-4 transition-all duration-300 ${
                isFocused
                  ? "border-gray-300 bg-white shadow-lg py-3"
                  : "border-gray-200 hover:border-gray-300 py-2"
              }`}
            >
              <Input
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="shadow-none bg-none flex-1 border-0 bg-transparent p-0 h-auto text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={disabled}
              />
              <Button
                type="submit"
                size="icon"
                disabled={disabled || !value.trim()}
                className={`shrink-0 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-300 ${
                  isFocused ? "h-10 w-10" : "h-9 w-9"
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </footer>
    )
  }
)
