"use client"

import { Check, X, Minus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type FeatureValue = boolean | string | number

interface Feature {
  name: string
  category?: string
  free: FeatureValue
  pro: FeatureValue
  lifetime: FeatureValue
}

const COMPARISON_FEATURES: Feature[] = [
  // Usage Limits
  {
    name: "AI Chat Messages",
    category: "Usage Limits",
    free: "50/month",
    pro: "1,000/month",
    lifetime: "Unlimited",
  },
  {
    name: "Projects",
    category: "Usage Limits",
    free: 3,
    pro: 20,
    lifetime: "Unlimited",
  },
  {
    name: "Skill Categories",
    category: "Usage Limits",
    free: 3,
    pro: 10,
    lifetime: "Unlimited",
  },
  {
    name: "Suggested Questions",
    category: "Usage Limits",
    free: 5,
    pro: 50,
    lifetime: "Unlimited",
  },
  // Features
  {
    name: "Custom Domain",
    category: "Features",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Analytics Dashboard",
    category: "Features",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Remove Watermark",
    category: "Features",
    free: false,
    pro: true,
    lifetime: true,
  },
  {
    name: "Priority Support",
    category: "Features",
    free: false,
    pro: true,
    lifetime: true,
  },
  // Storage
  {
    name: "Avatar Size",
    category: "Storage",
    free: "2 MB",
    pro: "10 MB",
    lifetime: "20 MB",
  },
  {
    name: "Resume Size",
    category: "Storage",
    free: "5 MB",
    pro: "20 MB",
    lifetime: "50 MB",
  },
]

export function PlanComparison() {
  // Group features by category
  const categories = COMPARISON_FEATURES.reduce((acc, feature) => {
    const category = feature.category || "Other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(feature)
    return acc
  }, {} as Record<string, Feature[]>)

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[40%]">Feature</TableHead>
            <TableHead className="text-center">Free</TableHead>
            <TableHead className="text-center bg-primary/5">Pro</TableHead>
            <TableHead className="text-center">Lifetime</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(categories).map(([category, features]) => (
            <>
              {/* Category Header */}
              <TableRow key={category} className="bg-muted/30">
                <TableCell
                  colSpan={4}
                  className="font-semibold text-sm text-muted-foreground py-2"
                >
                  {category}
                </TableCell>
              </TableRow>
              {/* Features in Category */}
              {features.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell className="text-center">
                    <FeatureCell value={feature.free} />
                  </TableCell>
                  <TableCell className="text-center bg-primary/5">
                    <FeatureCell value={feature.pro} highlight />
                  </TableCell>
                  <TableCell className="text-center">
                    <FeatureCell value={feature.lifetime} />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FeatureCell({
  value,
  highlight = false,
}: {
  value: FeatureValue
  highlight?: boolean
}) {
  if (typeof value === "boolean") {
    return value ? (
      <Check
        className={cn(
          "h-5 w-5 mx-auto",
          highlight ? "text-primary" : "text-green-500"
        )}
      />
    ) : (
      <X className="h-5 w-5 mx-auto text-muted-foreground/40" />
    )
  }

  if (value === "Unlimited") {
    return (
      <span
        className={cn(
          "text-sm font-medium",
          highlight ? "text-primary" : "text-green-600"
        )}
      >
        Unlimited
      </span>
    )
  }

  return <span className="text-sm text-muted-foreground">{value}</span>
}
