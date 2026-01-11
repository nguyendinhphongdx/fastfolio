// ==========================================
// Application Constants
// ==========================================

export const APP_CONFIG = {
  NAME: "Fastfolio",
  TAGLINE: "AI-Powered Portfolio",
  DESCRIPTION: "Create your AI-powered portfolio and let recruiters talk to it.",
  DOMAIN: "fastfol.io",
  URL: process.env.NEXT_PUBLIC_APP_URL || "https://fastfol.io",
} as const

// ==========================================
// Default Values
// ==========================================

export const DEFAULTS = {
  // Portfolio defaults
  PORTFOLIO: {
    TAGLINE: "Ask me anything",
    CHAT_PLACEHOLDER: "Ask me anything about my work...",
    PERSONA_TONE: "professional",
  },

  // Avatar & uploads
  AVATAR: {
    SIZE: 256,
    MAX_SIZE_MB: 2,
    ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  },

  RESUME: {
    MAX_SIZE_MB: 5,
    ACCEPTED_TYPES: ["application/pdf"],
  },

  // Pagination
  PAGINATION: {
    PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
  },

  // Chat
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_HISTORY: 20,
  },
} as const

// ==========================================
// Validation Rules
// ==========================================

export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },

  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
  },

  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },

  BIO: {
    MAX_LENGTH: 500,
  },

  HEADLINE: {
    MAX_LENGTH: 100,
  },

  TAGLINE: {
    MAX_LENGTH: 200,
  },

  PROJECT: {
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
  },
} as const

// ==========================================
// Reserved Usernames
// ==========================================

export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "settings",
  "portfolio",
  "pricing",
  "upgrade",
  "support",
  "help",
  "about",
  "terms",
  "privacy",
  "blog",
  "docs",
  "app",
  "www",
  "mail",
  "email",
  "ftp",
  "localhost",
  "test",
  "demo",
  "null",
  "undefined",
  "root",
  "system",
] as const

// ==========================================
// Social Platforms
// ==========================================

export const SOCIAL_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", urlPrefix: "https://linkedin.com/in/" },
  { id: "github", name: "GitHub", urlPrefix: "https://github.com/" },
  { id: "twitter", name: "Twitter", urlPrefix: "https://twitter.com/" },
  { id: "website", name: "Website", urlPrefix: "" },
] as const
