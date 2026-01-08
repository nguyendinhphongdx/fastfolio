"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Briefcase, Code } from "lucide-react"

interface Project {
  id?: string
  title: string
  description: string
  url?: string
  technologies: string
}

interface Skill {
  id?: string
  name: string
  level: string
}

export default function ContentPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/portfolio")
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setProjects(data.projects || [])
            setSkills(data.skills || [])
          }
        }
      } catch (error) {
        console.error("Failed to fetch content:", error)
      }
    }
    fetchContent()
  }, [])

  const addProject = () => {
    setProjects([
      ...projects,
      { title: "", description: "", url: "", technologies: "" },
    ])
  }

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const addSkill = () => {
    setSkills([...skills, { name: "", level: "INTERMEDIATE" }])
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updated = [...skills]
    updated[index] = { ...updated[index], [field]: value }
    setSkills(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/portfolio/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects, skills }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Content saved successfully!",
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
        <h1 className="text-2xl font-bold">Tools & Content</h1>
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
                      <Label>Project Title</Label>
                      <Input
                        placeholder="e.g., E-commerce Platform"
                        value={project.title}
                        onChange={(e) =>
                          updateProject(index, "title", e.target.value)
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
                    <Input
                      placeholder="React, Node.js, PostgreSQL..."
                      value={project.technologies}
                      onChange={(e) =>
                        updateProject(index, "technologies", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skills
                </CardTitle>
                <CardDescription>
                  List your technical and professional skills
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No skills yet. Add your skills to let visitors know what you&apos;re good at.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 border rounded-lg p-3"
                  >
                    <Input
                      placeholder="Skill name"
                      value={skill.name}
                      onChange={(e) =>
                        updateSkill(index, "name", e.target.value)
                      }
                      className="flex-1"
                    />
                    <select
                      value={skill.level}
                      onChange={(e) =>
                        updateSkill(index, "level", e.target.value)
                      }
                      className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSkill(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
