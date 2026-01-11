import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type AlertVariant = "error" | "warning" | "info" | "success"

interface ErrorAlertProps {
  message: string
  variant?: AlertVariant
  className?: string
  onDismiss?: () => void
}

const variants = {
  error: {
    icon: XCircle,
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900",
    text: "text-red-800 dark:text-red-200",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-800 dark:text-amber-200",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900",
    text: "text-blue-800 dark:text-blue-200",
    iconColor: "text-blue-500",
  },
  success: {
    icon: AlertCircle,
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-800 dark:text-green-200",
    iconColor: "text-green-500",
  },
}

export function ErrorAlert({
  message,
  variant = "error",
  className,
  onDismiss,
}: ErrorAlertProps) {
  const { icon: Icon, bg, border, text, iconColor } = variants[variant]

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        bg,
        border,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
      <p className={cn("text-sm flex-1", text)}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn("shrink-0 hover:opacity-70", text)}
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Simple inline error for form fields
export function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="text-xs text-red-500 mt-1">{message}</p>
  )
}
