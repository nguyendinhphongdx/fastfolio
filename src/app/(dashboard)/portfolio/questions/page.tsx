"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Trash2,
  GripVertical,
  User,
  Briefcase,
  FolderOpen,
  Lightbulb,
  Smile,
  Mail,
  Code,
  Rocket,
  Star,
  Heart,
  BookOpen,
  Award,
  Globe,
  MessageCircle,
  Zap,
  Target,
  Coffee,
  Music,
  Camera,
  Gamepad2,
  Loader2,
  Pencil,
} from "lucide-react"
import { CATEGORY_ICONS } from "@/constants/suggested-categories"

// Icon map for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Briefcase,
  FolderOpen,
  Lightbulb,
  Smile,
  Mail,
  Code,
  Rocket,
  Star,
  Heart,
  BookOpen,
  Award,
  Globe,
  MessageCircle,
  Zap,
  Target,
  Coffee,
  Music,
  Camera,
  Gamepad2,
}

interface Question {
  id: string
  text: string
  order: number
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  isSystem: boolean
  order: number
  questions: Question[]
}

export default function QuestionsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("FolderOpen")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryIcon, setEditCategoryIcon] = useState("")

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/portfolio/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        if (data.categories?.length > 0 && !activeCategory) {
          setActiveCategory(data.categories[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsAddingCategory(true)
    try {
      const res = await fetch("/api/portfolio/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCategories([...categories, data.category])
        setActiveCategory(data.category.id)
        setShowAddCategory(false)
        setNewCategoryName("")
        setNewCategoryIcon("FolderOpen")
        toast({
          title: "Category created",
          description: "Your new category has been added",
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create category:", error)
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return

    try {
      const res = await fetch(`/api/portfolio/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCategoryName.trim(),
          icon: editCategoryIcon,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCategories(categories.map(c =>
          c.id === editingCategory.id ? { ...c, name: data.category.name, icon: data.category.icon } : c
        ))
        setEditingCategory(null)
        toast({
          title: "Category updated",
          description: "Your category has been updated",
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update category:", error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category || category.isSystem) return

    if (!confirm("Are you sure you want to delete this category? All questions in it will be deleted.")) {
      return
    }

    try {
      const res = await fetch(`/api/portfolio/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        const newCategories = categories.filter(c => c.id !== categoryId)
        setCategories(newCategories)
        if (activeCategory === categoryId && newCategories.length > 0) {
          setActiveCategory(newCategories[0].id)
        }
        toast({
          title: "Category deleted",
          description: "The category has been removed",
        })
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !activeCategory) return

    try {
      const res = await fetch(`/api/portfolio/categories/${activeCategory}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newQuestion.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setCategories(categories.map(c => {
          if (c.id === activeCategory) {
            return {
              ...c,
              questions: [...c.questions, data.question],
            }
          }
          return c
        }))
        setNewQuestion("")
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add question",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to add question:", error)
    }
  }

  const handleRemoveQuestion = (questionId: string) => {
    setCategories(categories.map(c => {
      if (c.id === activeCategory) {
        return {
          ...c,
          questions: c.questions.filter(q => q.id !== questionId),
        }
      }
      return c
    }))
  }

  const handleSaveQuestions = async () => {
    if (!activeCategory) return

    const category = categories.find(c => c.id === activeCategory)
    if (!category) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/portfolio/categories/${activeCategory}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: category.questions.map(q => ({ text: q.text })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCategories(categories.map(c => {
          if (c.id === activeCategory) {
            return { ...c, questions: data.questions }
          }
          return c
        }))
        toast({
          title: "Saved!",
          description: "Your questions have been updated",
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save questions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save questions:", error)
      toast({
        title: "Error",
        description: "Failed to save questions",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const activeData = categories.find(c => c.id === activeCategory)
  const filteredQuestions = activeData?.questions || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suggested Questions</h1>
          <p className="text-muted-foreground">
            Customize the quick questions visitors can ask your AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Categories</CardTitle>
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Category</DialogTitle>
                  <DialogDescription>
                    Create a new category for your suggested questions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Education, Certifications..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_ICONS.map((iconName) => {
                          const Icon = iconMap[iconName]
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center gap-2">
                                {Icon && <Icon className="h-4 w-4" />}
                                {iconName}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory} disabled={isAddingCategory || !newCategoryName.trim()}>
                    {isAddingCategory ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Category"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-2 pb-4">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || FolderOpen
                const count = category.questions.length
                return (
                  <div
                    key={category.id}
                    className={`group flex items-center gap-2 rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <button
                      onClick={() => setActiveCategory(category.id)}
                      className="flex-1 flex items-center justify-between px-3 py-2 text-sm"
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
                    {!category.isSystem && (
                      <div className={`pr-2 flex gap-1 ${activeCategory === category.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingCategory(category)
                            setEditCategoryName(category.name)
                            setEditCategoryIcon(category.icon)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:text-destructive"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle className="text-base">
              {activeData?.name || "Select a Category"} Questions
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
                disabled={!activeCategory}
              />
              <Button onClick={handleAddQuestion} size="icon" disabled={!activeCategory}>
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
        <Button onClick={handleSaveQuestions} disabled={isSaving || !activeCategory}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name and icon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Select value={editCategoryIcon} onValueChange={setEditCategoryIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ICONS.map((iconName) => {
                    const Icon = iconMap[iconName]
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {iconName}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={!editCategoryName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
