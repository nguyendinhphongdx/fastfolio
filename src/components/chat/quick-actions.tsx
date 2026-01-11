"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
}

interface QuickActionGridProps {
  actions: QuickAction[]
  onAction: (actionId: string) => void
}

export function QuickActionGrid({ actions, onAction }: QuickActionGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group"
        >
          <action.icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}

interface QuickActionPillsProps {
  actions: QuickAction[]
  onAction: (actionId: string) => void
  visible?: boolean
}

export function QuickActionPills({
  actions,
  onAction,
  visible = true,
}: QuickActionPillsProps) {
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        visible ? "max-h-24 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"
      }`}
    >
      <div className="flex gap-2 justify-center flex-wrap">
        {actions.map((action) => (
          <button
            key={action.id}
            onMouseDown={(e) => {
              e.preventDefault()
              onAction(action.id)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all whitespace-nowrap"
          >
            <action.icon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface QuickActionButtonsProps {
  actions: QuickAction[]
  onAction: (actionId: string) => void
}

export function QuickActionButtons({
  actions,
  onAction,
}: QuickActionButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="default"
          className="bg-white/60 backdrop-blur-md hover:bg-white/80 text-gray-700 border-white/50 rounded-xl px-5 py-3 h-auto shadow-sm"
          onClick={() => onAction(action.id)}
        >
          <action.icon className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}
