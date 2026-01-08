# Fastfolio Clone - AI Portfolio Platform

## Product Vision

**Không bán "AI Portfolio" → Bán giá trị thay thế CV + tiết kiệm thời gian trả lời recruiter**

> "Let recruiters talk to your portfolio."

### Value Proposition
- Portfolio có thể trả lời câu hỏi thay bạn
- Trải nghiệm tương tác vượt CV truyền thống
- Insight: người ta quan tâm điều gì về bạn

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js (Google, GitHub, Credentials) |
| AI | OpenAI API (GPT-4) với Tool Calling |
| Storage | Cloudinary (avatars) |
| Payments | Stripe |
| Fluid Animation | WebGL (desktop only, lazy load) |
| Deploy | Vercel |

---

## MVP Features (CHỐT - KHÔNG CẮT)

### Public Page `/[username]`
- Fluid WebGL background (desktop only, fallback CSS gradient)
- AI chat với streaming
- Tools: Projects, Skills, Contact, Fun content, Resume
- Rate limit theo visitor

### Dashboard
- Basic info (avatar, headline, tagline)
- Persona setup (AI personality)
- Questions preset
- Fun content editor
- Publish / unpublish

### System
- Auth (Google, GitHub, Email)
- Rate limit per visitor
- Prompt caching (3-tier)
- Stripe payments

---

## AI Architecture (QUAN TRỌNG - TIẾT KIỆM CHI PHÍ)

### 3-Tier Prompt System

```
┌─────────────────────────────────────┐
│ (1) Persona Prompt - CACHED         │
│ - Tên, vai trò, tone                │
│ - Rules: không bịa, ngắn gọn        │
│ - Cache theo portfolioId            │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ (2) Conversation Summary - NGẮN     │
│ - Tóm tắt ý chính                   │
│ - Update mỗi ~10 messages           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ (3) User Message - CHỈ MESSAGE MỚI  │
│ - Không load full history           │
└─────────────────────────────────────┘

👉 Mục tiêu: giảm 70-80% token
```

### Tool Calling (LÕI SẢN PHẨM)

AI chỉ được:
1. Trả lời text ngắn
2. Hoặc gọi tool có schema rõ ràng

```typescript
// Ví dụ tool call
{
  "name": "show_projects",
  "arguments": {
    "projectIds": ["p1", "p2"]
  }
}
```

Available Tools:
- `show_projects` - Hiển thị project carousel
- `show_skills` - Hiển thị skill grid by category
- `show_contact` - Hiển thị contact card
- `show_fun` - Hiển thị fun content
- `show_resume` - Hiển thị resume download

### Rate Limit

| Plan | Limit |
|------|-------|
| Free | 10 messages / visitor / day |
| Pro | 100 messages / visitor / day |
| Lifetime | Unlimited (soft limit) |

---

## Fluid WebGL Strategy

```typescript
// Chỉ load khi:
// 1. Desktop
// 2. GPU OK
// 3. FPS ổn định

if (isDesktop && supportsWebGL) {
  import("./fluid-canvas")
}

// Mobile / low-end → CSS gradient fallback
```

---

## Database Schema

```prisma
// ==========================================
// NextAuth.js Required Models
// ==========================================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==========================================
// Core Models
// ==========================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  password      String?
  image         String?
  username      String?   @unique

  accounts      Account[]
  sessions      Session[]
  portfolio     Portfolio?
  subscription  Subscription?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([username])
}

model Portfolio {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Basic Info
  avatar            String?
  avatarStyle       AvatarStyle @default(ROUNDED)
  headline          String?
  tagline           String      @default("AI Portfolio")
  chatPlaceholder   String      @default("Ask me anything...")

  // AI Persona (CACHED for prompt)
  personaName       String?
  personaRole       String?
  personaTone       PersonaTone @default(BALANCED)
  personaRules      String?     @db.Text

  // Contact
  contactEmail      String?
  contactPhone      String?
  linkedinUrl       String?
  githubUrl         String?
  websiteUrl        String?

  // Status
  isPublished       Boolean     @default(false)
  publishedAt       DateTime?

  // Relations
  projects          Project[]
  skills            SkillCategory[]
  funContent        FunContent?
  resume            Resume?
  questions         Question[]
  conversations     Conversation[]
  pageViews         PageView[]

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([userId])
  @@index([isPublished])
}

// ==========================================
// Portfolio Content
// ==========================================

model Project {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  name        String
  description String?   @db.Text
  image       String?
  url         String?
  techStack   String[]
  order       Int       @default(0)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([portfolioId])
}

model SkillCategory {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  name        String
  icon        String?
  skills      String[]
  order       Int       @default(0)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([portfolioId])
}

model FunContent {
  id          String    @id @default(cuid())
  portfolioId String    @unique
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  title       String?
  description String?   @db.Text
  images      FunImage[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model FunImage {
  id           String     @id @default(cuid())
  funContentId String
  funContent   FunContent @relation(fields: [funContentId], references: [id], onDelete: Cascade)

  url          String
  caption      String?
  order        Int        @default(0)

  @@index([funContentId])
}

model Resume {
  id          String    @id @default(cuid())
  portfolioId String    @unique
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  url         String
  fileName    String
  fileSize    Int?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Question {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  category    QuestionCategory
  text        String
  order       Int       @default(0)

  createdAt   DateTime  @default(now())

  @@index([portfolioId])
}

// ==========================================
// Chat & Analytics
// ==========================================

model Conversation {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  visitorId   String    // Anonymous identifier
  summary     String?   @db.Text // Conversation summary for AI context

  messages    Message[]
  messageCount Int      @default(0)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([portfolioId])
  @@index([visitorId])
  @@index([createdAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  role           MessageRole
  content        String       @db.Text
  toolCalls      Json?

  createdAt      DateTime     @default(now())

  @@index([conversationId])
}

model PageView {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  visitorId   String?
  path        String
  referer     String?
  userAgent   String?

  createdAt   DateTime  @default(now())

  @@index([portfolioId])
  @@index([createdAt])
}

// ==========================================
// Billing
// ==========================================

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan                 Plan     @default(FREE)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  stripePriceId        String?

  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd     DateTime?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([stripeCustomerId])
}

// ==========================================
// Enums
// ==========================================

enum Plan {
  FREE
  PRO
  LIFETIME
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
}

enum AvatarStyle {
  ROUNDED
  SQUARED
}

enum PersonaTone {
  FORMAL
  BALANCED
  CASUAL
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum QuestionCategory {
  ABOUT_ME
  PROFESSIONAL
  PROJECTS
  SKILLS
  FUN_PERSONAL
  CONTACT
}
```

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── portfolio/
│   │   │   ├── basic/page.tsx
│   │   │   ├── persona/page.tsx
│   │   │   ├── content/page.tsx
│   │   │   └── publish/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── billing/page.tsx
│   │   └── layout.tsx
│   ├── (marketing)/
│   │   ├── page.tsx (landing)
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── [username]/
│   │   ├── page.tsx (portfolio)
│   │   └── chat/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── chat/route.ts
│   │   ├── portfolio/route.ts
│   │   └── webhook/stripe/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn)
│   ├── portfolio/
│   │   ├── fluid-background.tsx
│   │   ├── chat-interface.tsx
│   │   └── tool-cards/
│   ├── dashboard/
│   │   └── sidebar.tsx
│   └── shared/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── openai.ts
│   ├── stripe.ts
│   └── rate-limit.ts
├── hooks/
└── types/
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Setup Next.js + TypeScript + Tailwind
- [ ] Install shadcn/ui + Prisma + NextAuth
- [ ] Database schema
- [ ] Auth flow (Google, GitHub, Email)
- [ ] Portfolio CRUD
- [ ] Public page `/[username]`
- [ ] Fluid background (desktop + fallback)

### Week 2: AI Core
- [ ] `/api/chat` streaming endpoint
- [ ] Tool calling system
- [ ] 3-tier prompt architecture
- [ ] Rate limiting
- [ ] Fun tool (basic UI)

### Week 3: Monetization
- [ ] Stripe integration
- [ ] Publish gating (paid feature)
- [ ] Analytics dashboard (basic)
- [ ] UX polish
- [ ] **START COLLECTING PAYMENTS**

---

## Recruiter CTA Presets

```typescript
const RECRUITER_CTAS = [
  "Ask about my biggest technical challenge",
  "What architecture decisions have you made?",
  "Tell me about a project you're proud of",
  "What's your tech stack experience?",
  "How do you approach problem solving?"
]
```

## Persona Presets

```typescript
const PERSONA_PRESETS = {
  software_engineer: {
    tone: "BALANCED",
    rules: "Focus on technical skills, code quality, system design"
  },
  designer: {
    tone: "CASUAL",
    rules: "Focus on design process, user research, visual thinking"
  },
  product_manager: {
    tone: "BALANCED",
    rules: "Focus on product strategy, metrics, stakeholder management"
  }
}
```

---

## Key Principles

1. **Ship nhanh** - Week 3 bắt đầu thu tiền
2. **WOW ngay lần đầu** - Fluid WebGL + AI chat
3. **Kiểm soát chi phí AI** - 3-tier prompt, tool calling
4. **Data first** - Thu analytics từ đầu
5. **Không over-engineer** - UI basic, data đầy đủ

---

## Errors to Avoid

1. ❌ Làm Fluid quá đẹp trước khi có user
2. ❌ Parse tool từ text (PHẢI dùng tool calling)
3. ❌ Không cache persona prompt
4. ❌ AI trả lời dài dòng
5. ❌ Không seed example portfolios
