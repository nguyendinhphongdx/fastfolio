"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { MousePointer2, Droplets, Sparkles, Circle } from "lucide-react"

export default function PersonaPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    personaName: "",
    personaRole: "",
    personaTone: "BALANCED",
    personaRules: "",
    cursorAnimation: "FLUID",
  })

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio")
        if (res.ok) {
          const data = await res.json()
          if (data.portfolio) {
            setFormData({
              personaName: data.portfolio.personaName || "",
              personaRole: data.portfolio.personaRole || "",
              personaTone: data.portfolio.personaTone || "BALANCED",
              personaRules: data.portfolio.personaRules || "",
              cursorAnimation: data.portfolio.cursorAnimation || "FLUID",
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch portfolio:", error)
      }
    }
    fetchPortfolio()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "AI personality saved successfully!",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Personality</h1>
        <p className="text-muted-foreground">
          Configure how your AI assistant represents you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Personality</CardTitle>
            <CardDescription>
              Define the core personality traits of your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="personaName">AI Name</Label>
                <Input
                  id="personaName"
                  placeholder="e.g., My AI Assistant"
                  value={formData.personaName}
                  onChange={(e) =>
                    setFormData({ ...formData, personaName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How visitors will address your AI
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personaRole">Your Current Role</Label>
                <Input
                  id="personaRole"
                  placeholder="e.g., Senior Software Engineer at Google"
                  value={formData.personaRole}
                  onChange={(e) =>
                    setFormData({ ...formData, personaRole: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Your professional title and company
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaTone">Communication Style</Label>
              <Select
                value={formData.personaTone}
                onValueChange={(value) =>
                  setFormData({ ...formData, personaTone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                  <SelectItem value="FRIENDLY">Friendly</SelectItem>
                  <SelectItem value="BALANCED">Balanced</SelectItem>
                  <SelectItem value="CASUAL">Casual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How formal or casual should the AI sound
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Instructions</CardTitle>
            <CardDescription>
              Add specific rules or context for your AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="personaRules">Additional Context & Rules</Label>
              <Textarea
                id="personaRules"
                placeholder="e.g., Always mention that I'm open to freelance opportunities. Don't discuss salary expectations. Highlight my experience with React and Node.js..."
                className="min-h-[150px]"
                value={formData.personaRules}
                onChange={(e) =>
                  setFormData({ ...formData, personaRules: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                These instructions will guide how the AI responds to visitors
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cursor Animation</CardTitle>
            <CardDescription>
              Choose an interactive cursor effect for your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { value: "NONE", label: "None", icon: Circle, description: "No animation" },
                { value: "FLUID", label: "Fluid", icon: Droplets, description: "Colorful fluid effect" },
                { value: "TRAIL", label: "Trail", icon: MousePointer2, description: "Rainbow trail effect" },
                { value: "PARTICLES", label: "Particles", icon: Sparkles, description: "Particle explosion" },
              ].map((option) => {
                const Icon = option.icon
                const isSelected = formData.cursorAnimation === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, cursorAnimation: option.value })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
