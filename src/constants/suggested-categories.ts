// Default system categories for suggested questions
// These are created automatically when a new portfolio is created

export interface DefaultCategory {
  name: string
  slug: string
  icon: string
  order: number
  defaultQuestions: string[]
}

export const DEFAULT_SUGGESTED_CATEGORIES: DefaultCategory[] = [
  {
    name: "About Me",
    slug: "about-me",
    icon: "User",
    order: 0,
    defaultQuestions: [
      "Tell me about yourself",
      "What's your background?",
      "Where are you based?",
    ],
  },
  {
    name: "Professional",
    slug: "professional",
    icon: "Briefcase",
    order: 1,
    defaultQuestions: [
      "What do you do for work?",
      "What's your experience?",
      "Are you available for hire?",
    ],
  },
  {
    name: "Projects",
    slug: "projects",
    icon: "FolderOpen",
    order: 2,
    defaultQuestions: [
      "What projects have you worked on?",
      "What's your favorite project?",
      "Can you show me your work?",
    ],
  },
  {
    name: "Skills",
    slug: "skills",
    icon: "Lightbulb",
    order: 3,
    defaultQuestions: [
      "What technologies do you use?",
      "What are your main skills?",
      "What's your tech stack?",
    ],
  },
  {
    name: "Fun & Personal",
    slug: "fun-personal",
    icon: "Smile",
    order: 4,
    defaultQuestions: [
      "What are your hobbies?",
      "What do you do for fun?",
      "Tell me something interesting about you",
    ],
  },
  {
    name: "Contact",
    slug: "contact",
    icon: "Mail",
    order: 5,
    defaultQuestions: [
      "How can I contact you?",
      "What's your email?",
      "Are you on social media?",
    ],
  },
]

// Available icons for custom categories
export const CATEGORY_ICONS = [
  "User",
  "Briefcase",
  "FolderOpen",
  "Lightbulb",
  "Smile",
  "Mail",
  "Code",
  "Rocket",
  "Star",
  "Heart",
  "BookOpen",
  "Award",
  "Globe",
  "MessageCircle",
  "Zap",
  "Target",
  "Coffee",
  "Music",
  "Camera",
  "Gamepad2",
] as const

export type CategoryIcon = (typeof CATEGORY_ICONS)[number]
