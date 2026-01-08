"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, GripVertical, User, Briefcase, FolderOpen, Lightbulb, Smile, Mail } from "lucide-react"

interface Question {
  id: string
  category: string
  text: string
}

const categories = [
  { id: "about", name: "About Me", icon: User },
  { id: "professional", name: "Professional", icon: Briefcase },
  { id: "projects", name: "Projects", icon: FolderOpen },
  { id: "skills", name: "Skills", icon: Lightbulb },
  { id: "fun", name: "Fun & Personal", icon: Smile },
  { id: "contact", name: "Contact", icon: Mail },
]

const defaultQuestions: Record<string, string[]> = {
  about: [
    "Tell me about yourself",
    "What's your background?",
    "Where are you from?",
  ],
  professional: [
    "What do you do for work?",
    "What's your experience?",
    "What are you working on?",
  ],
  projects: [
    "Show me your projects",
    "What have you built?",
    "What's your best work?",
  ],
  skills: [
    "What are your skills?",
    "What technologies do you use?",
    "What are you good at?",
  ],
  fun: [
    "What do you do for fun?",
    "What are your hobbies?",
    "Tell me something interesting about yourself",
  ],
  contact: [
    "How can I contact you?",
    "What's your email?",
    "Can I see your resume?",
  ],
}

export default function QuestionsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeCategory, setActiveCategory] = useState("about")
  const [newQuestion, setNewQuestion] = useState("")

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/portfolio/questions")
        if (res.ok) {
          const data = await res.json()
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions)
          } else {
            // Initialize with default questions
            const initialQuestions: Question[] = []
            Object.entries(defaultQuestions).forEach(([category, texts]) => {
              texts.forEach((text) => {
                initialQuestions.push({
                  id: Math.random().toString(36).substr(2, 9),
                  category,
                  text,
                })
              })
            })
            setQuestions(initialQuestions)
          }
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error)
      }
    }
    fetchQuestions()
  }, [])

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return

    const question: Question = {
      id: Math.random().toString(36).substr(2, 9),
      category: activeCategory,
      text: newQuestion.trim(),
    }

    setQuestions([...questions, question])
    setNewQuestion("")
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/portfolio/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      })

      if (res.ok) {
        toast({
          title: "Saved!",
          description: "Your questions have been updated",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save questions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToDefaults = () => {
    const initialQuestions: Question[] = []
    Object.entries(defaultQuestions).forEach(([category, texts]) => {
      texts.forEach((text) => {
        initialQuestions.push({
          id: Math.random().toString(36).substr(2, 9),
          category,
          text,
        })
      })
    })
    setQuestions(initialQuestions)
  }

  const filteredQuestions = questions.filter((q) => q.category === activeCategory)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suggested Questions</h1>
          <p className="text-muted-foreground">
            Customize the quick questions visitors can ask your AI
          </p>
        </div>
        <Button variant="outline" onClick={handleResetToDefaults}>
          Reset to Defaults
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-2 pb-4">
              {categories.map((category) => {
                const Icon = category.icon
                const count = questions.filter((q) => q.category === category.id).length
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </div>
                    <span className={`text-xs ${
                      activeCategory === category.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle className="text-base">
              {categories.find((c) => c.id === activeCategory)?.name} Questions
            </CardTitle>
            <CardDescription>
              These questions will appear as quick suggestions for visitors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new question */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
              />
              <Button onClick={handleAddQuestion} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Questions list */}
            <div className="space-y-2">
              {filteredQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No questions in this category yet
                </p>
              ) : (
                filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="flex-1 text-sm">{question.text}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
