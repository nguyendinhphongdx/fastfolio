import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Circle, ChevronUp, LucideIcon } from "lucide-react"

export interface ChecklistItem {
  name: string
  completed: boolean
  icon: LucideIcon
  href: string
  tasks?: string[]
  count?: number
}

interface SetupChecklistProps {
  items: ChecklistItem[]
}

export function SetupChecklist({ items }: SetupChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Portfolio Checklist</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount === totalCount
                ? "All sections completed!"
                : `Complete ${totalCount - completedCount} more sections`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {completedCount}/{totalCount}
            </span>
            <ChevronUp className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <ChecklistRow key={item.name} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.completed ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-orange-500" />
          )}
          <span className="font-medium">{item.name}</span>
          {item.count && (
            <Badge variant="secondary" className="text-xs">
              {item.count}
            </Badge>
          )}
        </div>
        {!item.completed && (
          <Link href={item.href}>
            <Button variant="outline" size="sm">
              Complete
            </Button>
          </Link>
        )}
      </div>
      {item.tasks && item.tasks.length > 0 && (
        <div className="ml-7 space-y-1">
          {item.tasks.map((task, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              • {task}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
