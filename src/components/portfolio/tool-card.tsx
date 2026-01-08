"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Download, Mail, Phone, Copy } from "lucide-react"
import { toast } from "sonner"

interface ToolCardProps {
  name: string
  data: unknown
  portfolio: {
    contactEmail: string | null
    contactPhone: string | null
    projects: Array<{
      id: string
      name: string
      description: string | null
      image: string | null
      url: string | null
    }>
    skills: Array<{
      id: string
      name: string
      icon: string | null
      skills: string[]
    }>
    funContent: {
      title: string | null
      description: string | null
      images: Array<{ url: string; caption: string | null }>
    } | null
    resume: {
      url: string
      fileName: string
    } | null
  }
}

export function ToolCard({ name, portfolio }: ToolCardProps) {
  switch (name) {
    case "show_projects":
      return <ProjectsCard projects={portfolio.projects} />
    case "show_skills":
      return <SkillsCard skills={portfolio.skills} />
    case "show_contact":
      return (
        <ContactCard
          email={portfolio.contactEmail}
          phone={portfolio.contactPhone}
        />
      )
    case "show_fun":
      return <FunCard funContent={portfolio.funContent} />
    case "show_resume":
      return <ResumeCard resume={portfolio.resume} />
    default:
      return null
  }
}

function ProjectsCard({
  projects,
}: {
  projects: Array<{
    id: string
    name: string
    description: string | null
    image: string | null
    url: string | null
  }>
}) {
  if (!projects.length) {
    return (
      <Card className="bg-white/90">
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm">No projects added yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {projects.map((project) => (
        <Card key={project.id} className="bg-white/90 min-w-[200px] flex-shrink-0">
          {project.image && (
            <div className="h-32 overflow-hidden rounded-t-lg">
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-3">
            <h4 className="font-medium text-sm">{project.name}</h4>
            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary mt-2"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SkillsCard({
  skills,
}: {
  skills: Array<{
    id: string
    name: string
    icon: string | null
    skills: string[]
  }>
}) {
  if (!skills.length) {
    return (
      <Card className="bg-white/90">
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm">No skills added yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {skills.map((category) => (
        <Card key={category.id} className="bg-white/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              {category.icon && <span>{category.icon}</span>}
              {category.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex flex-wrap gap-1">
              {category.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ContactCard({
  email,
  phone,
}: {
  email: string | null
  phone: string | null
}) {
  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  if (!email && !phone) {
    return (
      <Card className="bg-white/90">
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm">No contact info added yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90">
      <CardContent className="py-4 space-y-3">
        {email && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToClipboard(email)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
        {phone && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{phone}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToClipboard(phone)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FunCard({
  funContent,
}: {
  funContent: {
    title: string | null
    description: string | null
    images: Array<{ url: string; caption: string | null }>
  } | null
}) {
  if (!funContent) {
    return (
      <Card className="bg-white/90">
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm">No fun content added yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90">
      <CardContent className="py-4">
        {funContent.title && (
          <h4 className="font-medium mb-2">{funContent.title}</h4>
        )}
        {funContent.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {funContent.description}
          </p>
        )}
        {funContent.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {funContent.images.slice(0, 6).map((image, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.caption || ""}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResumeCard({
  resume,
}: {
  resume: {
    url: string
    fileName: string
  } | null
}) {
  if (!resume) {
    return (
      <Card className="bg-white/90">
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm">No resume uploaded yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90">
      <CardContent className="py-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{resume.fileName}</p>
          <p className="text-xs text-muted-foreground">PDF Document</p>
        </div>
        <Button asChild size="sm">
          <a href={resume.url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
