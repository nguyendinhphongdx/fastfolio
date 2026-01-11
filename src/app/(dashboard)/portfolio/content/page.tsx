"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Briefcase, Code, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Project {
  id?: string
  name: string
  description: string
  url?: string
  techStack: string[]
}

interface SkillCategory {
  id?: string
  name: string
  skills: string[]
}

export default function ContentPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [newTech, setNewTech] = useState<Record<number, string>>({})
  const [newSkill, setNewSkill] = useState<Record<number, string>>({})

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/portfolio/content")
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects || [])
          setSkillCategories(data.skills || [])
        }
      } catch (error) {
        console.error("Failed to fetch content:", error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchContent()
  }, [])

  const addProject = () => {
    setProjects([
      ...projects,
      { name: "", description: "", url: "", techStack: [] },
    ])
  }

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const updateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const addTechToProject = (projectIndex: number) => {
    const tech = newTech[projectIndex]?.trim()
    if (!tech) return

    const updated = [...projects]
    if (!updated[projectIndex].techStack.includes(tech)) {
      updated[projectIndex].techStack = [...updated[projectIndex].techStack, tech]
      setProjects(updated)
    }
    setNewTech({ ...newTech, [projectIndex]: "" })
  }

  const removeTechFromProject = (projectIndex: number, techIndex: number) => {
    const updated = [...projects]
    updated[projectIndex].techStack = updated[projectIndex].techStack.filter((_, i) => i !== techIndex)
    setProjects(updated)
  }

  const addSkillCategory = () => {
    setSkillCategories([...skillCategories, { name: "", skills: [] }])
  }

  const removeSkillCategory = (index: number) => {
    setSkillCategories(skillCategories.filter((_, i) => i !== index))
  }

  const updateSkillCategory = (index: number, field: keyof SkillCategory, value: string | string[]) => {
    const updated = [...skillCategories]
    updated[index] = { ...updated[index], [field]: value }
    setSkillCategories(updated)
  }

  const addSkillToCategory = (categoryIndex: number) => {
    const skill = newSkill[categoryIndex]?.trim()
    if (!skill) return

    const updated = [...skillCategories]
    if (!updated[categoryIndex].skills.includes(skill)) {
      updated[categoryIndex].skills = [...updated[categoryIndex].skills, skill]
      setSkillCategories(updated)
    }
    setNewSkill({ ...newSkill, [categoryIndex]: "" })
  }

  const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
    const updated = [...skillCategories]
    updated[categoryIndex].skills = updated[categoryIndex].skills.filter((_, i) => i !== skillIndex)
    setSkillCategories(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/portfolio/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: projects.map(p => ({
            name: p.name,
            description: p.description,
            url: p.url,
            techStack: p.techStack,
          })),
          skills: skillCategories.map(s => ({
            name: s.name,
            skills: s.skills,
          })),
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Content saved successfully!",
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save changes",
          variant: "destructive",
        })
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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects & Skills</h1>
        <p className="text-muted-foreground">
          Add projects and skills that your AI can share with visitors
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Projects
                </CardTitle>
                <CardDescription>
                  Showcase your work and achievements
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addProject}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects yet. Add your first project to showcase your work.
              </p>
            ) : (
              projects.map((project, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-4 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProject(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        placeholder="e.g., E-commerce Platform"
                        value={project.name}
                        onChange={(e) =>
                          updateProject(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project URL</Label>
                      <Input
                        placeholder="https://..."
                        value={project.url || ""}
                        onChange={(e) =>
                          updateProject(index, "url", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your project..."
                      value={project.description}
                      onChange={(e) =>
                        updateProject(index, "description", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technologies</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.techStack.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="gap-1">
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechFromProject(index, techIndex)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add technology..."
                        value={newTech[index] || ""}
                        onChange={(e) => setNewTech({ ...newTech, [index]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTechToProject(index)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addTechToProject(index)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Skill Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skill Categories
                </CardTitle>
                <CardDescription>
                  Organize your skills by category
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSkillCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No skill categories yet. Add categories to organize your skills.
              </p>
            ) : (
              skillCategories.map((category, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-4 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSkillCategory(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      placeholder="e.g., Frontend, Backend, DevOps..."
                      value={category.name}
                      onChange={(e) =>
                        updateSkillCategory(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {category.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillFromCategory(index, skillIndex)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add skill..."
                        value={newSkill[index] || ""}
                        onChange={(e) => setNewSkill({ ...newSkill, [index]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkillToCategory(index)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addSkillToCategory(index)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </div>
  )
}
