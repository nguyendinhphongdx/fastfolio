// ==========================================
// Application Routes
// ==========================================

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  RESET_PASSWORD: "/reset-password",
  PRICING: "/pricing",

  // Dashboard routes
  DASHBOARD: "/dashboard",
  PORTFOLIO_BASIC: "/portfolio/basic",
  PORTFOLIO_PERSONA: "/portfolio/persona",
  PORTFOLIO_CONTENT: "/portfolio/content",
  PORTFOLIO_QUESTIONS: "/portfolio/questions",
  SETTINGS: "/settings",
  ANALYTICS: "/analytics",
  UPGRADE: "/upgrade",

  // API routes
  API: {
    CHAT: "/api/chat",
    PORTFOLIO: "/api/portfolio",
    PORTFOLIO_CONTENT: "/api/portfolio/content",
    PORTFOLIO_QUESTIONS: "/api/portfolio/questions",
    ANALYTICS: "/api/analytics",
    SUBSCRIPTION: "/api/subscription",
    UPLOAD: "/api/upload",
    AUTH: {
      SIGNIN: "/api/auth/signin",
      SIGNOUT: "/api/auth/signout",
      SESSION: "/api/auth/session",
    },
  },
} as const

// ==========================================
// External Links
// ==========================================

export const EXTERNAL_LINKS = {
  DOCS: "https://docs.fastfol.io",
  SUPPORT: "mailto:support@fastfol.io",
  TWITTER: "https://twitter.com/fastfolio",
  GITHUB: "https://github.com/fastfolio",
} as const
