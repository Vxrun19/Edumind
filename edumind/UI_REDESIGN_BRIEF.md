# EduMind — Complete UI Redesign Brief

> **Purpose:** Hand this document to any AI tool or designer so they know every page, component, file path, current state, and what needs to change.

---

## Project Overview

| Field | Value |
|-------|-------|
| **App Name** | EduMind |
| **Type** | AI-powered education platform (dark academic theme) |
| **Framework** | Next.js 16.1.6 (App Router) |
| **React** | 19.2.3 |
| **Styling** | Tailwind CSS 4 + CSS custom properties (design tokens) |
| **UI Library** | Shadcn/ui (Radix UI primitives) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Auth** | Clerk |
| **Database** | Supabase |
| **AI** | Anthropic SDK |
| **Fonts** | Playfair Display (serif headings), Inter (sans body/UI) |
| **Theme** | Dark mode only — dark blue/slate base |
| **Root Dir** | `C:/project/edumind/` |
| **Path Alias** | `@/*` → `./src/*` |

---

## Design Philosophy (Must Preserve)

| Principle | Description |
|-----------|-------------|
| **Calm** | No neon, no pulsing, no confetti. Transitions 250–350ms ease-in-out |
| **Intelligent** | Serif headings (Playfair Display), clear hierarchy, scholarly tone |
| **Institutional** | Feels like a digital private academy — 3-column layout, fixed nav |
| **Premium** | Consistent tokens, 32–40px spacing, matte surfaces, thin borders |
| **Timeless** | No trend-heavy effects. Subtle radial light only |

**Banned:** SaaS-dashboard feel, futuristic/gamified aesthetics, neon, glow, spring animations, bounce, confetti, glassmorphism overload.

---

## Design Tokens (CSS Variables)

**File:** `src/app/globals.css`

### Currently Defined Tokens
```css
:root {
  /* Backgrounds */
  --bg-base: #0F172A;
  --bg-secondary: #1E293B;
  --bg-panel: rgba(255, 255, 255, 0.04);
  --bg-panel-border: rgba(255, 255, 255, 0.08);

  /* Accents */
  --primary: #3B82F6;
  --secondary: #64748B;
  --achievement: #EAB308;

  /* Text */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);

  /* Typography */
  --font-serif: 'Playfair Display', serif;
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Spacing */
  --spacing-section: 40px;
  --spacing-large: 32px;

  /* Border radius */
  --radius: 16px;
  --radius-button: 12px;

  /* Motion */
  --motion-duration: 300ms;
  --motion-easing: ease-in-out;
}
```

### Missing Tokens (Must Add)
These are referenced in components but not defined — causing broken/invisible styles:

| Token | Recommended Value | Usage |
|-------|-------------------|-------|
| `--border` | `rgba(255, 255, 255, 0.08)` | Default borders |
| `--border-strong` | `rgba(255, 255, 255, 0.12)` | Emphasized borders (outline buttons) |
| `--bg-muted` | `rgba(255, 255, 255, 0.06)` | Hover states, secondary surfaces |
| `--bg-surface` | `rgba(255, 255, 255, 0.04)` | Cards, inputs |
| `--primary-light` | `rgba(59, 130, 246, 0.15)` | Selected state, primary tint |
| `--primary-dark` | `#2563EB` | Primary button hover |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.2)` | Subtle elevation |
| `--accent-red` | `rgba(239, 68, 68, 0.9)` | Errors, destructive, incorrect |
| `--accent-green` | `rgba(34, 197, 94, 0.9)` | Success, correct |
| `--bg-subtle` | `rgba(255, 255, 255, 0.02)` | Very subtle backgrounds |

---

## Typography Rules

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page title (h1) | Playfair Display (serif) | 40px | 400 | 1.2 |
| Section heading (h2) | Playfair Display (serif) | 28px | 400 | 1.3 |
| Subheading (h3) | Inter (sans) | 20px | 500 | 1.4 |
| Body (p) | Inter (sans) | 16px | 400 | 1.7 |
| Labels | Inter (sans) | 12px | 500 | — (uppercase, letter-spacing 0.08em) |
| Captions | Inter (sans) | 14px/12px | 400 | 1.5 |

---

## Layout Architecture

### Desktop (1440px target)
```
┌────────────────────────────────────────────────────────────────────┐
│  TOP NAVBAR  (56px height, sticky, --bg-secondary)                │
├──────────┬─────────────────────────────────┬───────────────────────┤
│          │                                 │                       │
│  LEFT    │       CENTER CONTENT            │  RIGHT PANEL          │
│  NAV     │       (max 720px, centered)     │  (320px, optional)    │
│  (240px) │       padding: 40px vert,       │  "Scholarly           │
│  fixed   │       24px horiz                │   Commentary"         │
│          │                                 │                       │
│  Items:  │                                 │                       │
│  - Dash  │                                 │                       │
│  - Chat  │                                 │                       │
│  - Course│                                 │                       │
│  - Quiz  │                                 │                       │
│  - Prog  │                                 │                       │
│          │                                 │                       │
└──────────┴─────────────────────────────────┴───────────────────────┘
```

### Mobile
- Left nav → collapses to drawer or top dropdown
- Right panel → stacks below content or hides behind toggle
- Touch targets → minimum 44px
- Full-width content

---

## Global Files to Modify

| # | File | Role | What to Change |
|---|------|------|---------------|
| 1 | `src/app/globals.css` | Design tokens, global styles | Add missing tokens, review all base styles |
| 2 | `src/app/layout.tsx` | Root layout (ClerkProvider, fonts, NavbarWrapper) | Review font loading, body classes |
| 3 | `src/components/Navbar.tsx` | Top navigation bar with auth | Switch to `--bg-secondary`, use tokens, remove any `bg-white` |
| 4 | `src/components/NavbarWrapper.tsx` | Conditional navbar visibility | Minor — ensure consistent behavior |
| 5 | `src/components/AcademicLayout.tsx` | 3-column layout shell | Audit token usage, ensure responsive behavior |
| 6 | `src/middleware.ts` | Auth route protection | No UI changes needed |

---

## Pages to Redesign (18 total)

### PAGE 1: Landing Page
| Field | Value |
|-------|-------|
| **Route** | `/` |
| **File** | `src/app/page.tsx` |
| **Components Used** | 12 landing-specific components (see below) |
| **Layout** | Custom (no AcademicLayout — this is public marketing) |
| **Current State** | Standalone marketing page with cyan accent, custom cursor, particle background |
| **Redesign Scope** | Full redesign of all 12 sections. Can have its own marketing palette but shared elements (auth buttons) must use app tokens |

**Landing Sub-Components (all in `src/components/landing/`):**

| # | File | Purpose | Notes |
|---|------|---------|-------|
| 1 | `landing-navbar.tsx` | Landing-specific navbar | Different from app Navbar — has Sign In / Sign Up CTAs |
| 2 | `hero-section.tsx` | Hero banner with headline + CTA | Main visual impact area |
| 3 | `features-section.tsx` | Feature cards grid | Highlight platform capabilities |
| 4 | `how-it-works-section.tsx` | Step-by-step process | Onboarding flow explanation |
| 5 | `testimonials-section.tsx` | User testimonials | Social proof |
| 6 | `subjects-section.tsx` | Subject list showcase | Shows available topics |
| 7 | `chat-mockup.tsx` | AI chat preview/demo | Interactive demo element |
| 8 | `cta-section.tsx` | Call to action banner | Conversion section |
| 9 | `footer.tsx` | Page footer | Links, copyright |
| 10 | `stats-bar.tsx` | Stats/metrics display | Numbers/achievements bar |
| 11 | `particle-background.tsx` | Animated background effect | Review if it fits calm principle |
| 12 | `custom-cursor.tsx` | Custom cursor effect | Consider removing (may violate timeless principle) |

---

### PAGE 2: Dashboard
| Field | Value |
|-------|-------|
| **Route** | `/dashboard` |
| **File** | `src/app/dashboard/page.tsx` |
| **Components Used** | `DashboardContent.tsx`, `AcademicLayout` |
| **Layout** | AcademicLayout (already using) |
| **Current State** | Has "Architecture of Rational Thought" heading, progress sphere with gold ring |
| **Redesign Scope** | Ensure all elements use tokens. Add right panel with "Suggested next" or streak. Unify card styles with `.panel` |

**Dashboard Sub-Components:**
| File | Purpose |
|------|---------|
| `src/components/dashboard/DashboardContent.tsx` | Main dashboard content area |

---

### PAGE 3: Chat (Scholarly Dialogue)
| Field | Value |
|-------|-------|
| **Route** | `/chat` |
| **File** | `src/app/chat/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout — must switch) |
| **Current State** | Uses undefined tokens (`--border`, `--bg-muted`, `--primary-light`). Has Knowledge Canvas feature |
| **Redesign Scope** | **Major.** Wrap in AcademicLayout. Map Knowledge Canvas to right panel. Replace all undefined tokens. Unify input bar + message bubbles with `.panel` and tokens |

**Key UI Elements:**
- Message bubbles (user + AI)
- Input bar with send button
- Knowledge Canvas sidebar
- Conversation header
- Voice input indicator

---

### PAGE 4: Assessment (Learning Questionnaire)
| Field | Value |
|-------|-------|
| **Route** | `/assessment` |
| **File** | `src/app/assessment/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout) |
| **Current State** | Multi-step form, uses old/undefined tokens |
| **Redesign Scope** | Wrap in AcademicLayout (no right panel). All inputs/option rows use `.panel`. Serif for question headings. Replace undefined tokens |

**Key UI Elements:**
- Multi-step question flow
- Option selection cards
- Progress indicator
- Subject selection grid

---

### PAGE 5: Progress
| Field | Value |
|-------|-------|
| **Route** | `/progress` |
| **File** | `src/app/progress/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout — must switch) |
| **Current State** | Level badges with gradients, custom layout |
| **Redesign Scope** | Wrap in AcademicLayout. Level badges: solid colors/subtle tints (`--achievement` for Master, `--primary` for Explorer). Progress bars: track `--bg-muted`, fill `--primary` |

**Key UI Elements:**
- Level/rank badges
- Progress bars per subject
- Statistics cards
- Streak display
- Activity timeline

---

### PAGE 6: History
| Field | Value |
|-------|-------|
| **Route** | `/history` |
| **File** | `src/app/history/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout — must switch) |
| **Current State** | List of past conversations |
| **Redesign Scope** | Wrap in AcademicLayout. Rows use `.panel` or bordered rows. Label style for dates. Text buttons for "Delete" |

**Key UI Elements:**
- Conversation list rows
- Date group headers
- Delete/action buttons
- Empty state

---

### PAGE 7: Profile
| Field | Value |
|-------|-------|
| **Route** | `/profile` |
| **File** | `src/app/profile/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout — must switch) |
| **Current State** | Profile settings page |
| **Redesign Scope** | Wrap in AcademicLayout. Forms and sections in `.panel`. Use design tokens throughout |

**Key UI Elements:**
- User info display
- Settings form fields
- Avatar section
- Preference toggles

---

### PAGE 8: Pricing
| Field | Value |
|-------|-------|
| **Route** | `/pricing` |
| **File** | `src/app/pricing/page.tsx` |
| **Layout** | Custom |
| **Current State** | Uses undefined tokens |
| **Redesign Scope** | Add missing tokens. Use `.panel` for plan cards. Primary button for CTA. Consistent with dark theme |

**Key UI Elements:**
- Plan comparison cards (Free vs Pro)
- Feature lists per plan
- CTA buttons
- Toggle (monthly/yearly)

---

### PAGE 9: Onboarding
| Field | Value |
|-------|-------|
| **Route** | `/onboarding` |
| **File** | `src/app/onboarding/page.tsx` |
| **Layout** | Standalone (acceptable) |
| **Current State** | Likely standalone welcome flow |
| **Redesign Scope** | Use same tokens and typography. Single column centered. Primary CTA with `.btn-primary` |

**Key UI Elements:**
- Welcome/intro screens
- Subject selection
- Experience level picker
- Goal setting
- Progress steps

---

### PAGE 10: Trending
| Field | Value |
|-------|-------|
| **Route** | `/trending` |
| **File** | `src/app/trending/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout — must switch) |
| **Current State** | Topic cards |
| **Redesign Scope** | Wrap in AcademicLayout. Cards use `.panel`, no gradient. Optional left border `--primary` for emphasis |

**Key UI Elements:**
- Trending topic cards
- Category filters
- Summary sections
- External link indicators

---

### PAGE 11: Quiz
| Field | Value |
|-------|-------|
| **Route** | `/quiz` |
| **File** | `src/app/quiz/page.tsx` |
| **Layout** | AcademicLayout (already using) |
| **Current State** | "Assessment Mode" with gold/red underlines |
| **Redesign Scope** | Keep layout. Ensure timer and progress bar use `--primary` and no neon. Results: serif for score, panels for breakdown |

**Key UI Elements:**
- Quiz question display (large serif text)
- Answer option rows (`.panel` style)
- Timer bar
- Progress indicator
- Correct/incorrect feedback (gold/red underlines)

---

### PAGE 12: Quiz Detail (Dynamic)
| Field | Value |
|-------|-------|
| **Route** | `/quiz/[id]` |
| **File** | `src/app/quiz/[id]/page.tsx` |
| **Layout** | Should use AcademicLayout |
| **Redesign Scope** | Same design language as quiz page. Consistent answer feedback, scoring, review mode |

---

### PAGE 13: Quizzes (List)
| Field | Value |
|-------|-------|
| **Route** | `/quizzes` |
| **File** | `src/app/quizzes/page.tsx` |
| **Layout** | Should use AcademicLayout |
| **Redesign Scope** | Quiz list/browse page. Use `.panel` for quiz cards, consistent styling |

---

### PAGE 14: Courses (Browse)
| Field | Value |
|-------|-------|
| **Route** | `/courses` |
| **File** | `src/app/courses/page.tsx` |
| **Layout** | Custom (NOT using AcademicLayout — must switch) |
| **Current State** | Full-width custom layout, subject-specific gradients |
| **Redesign Scope** | **Major.** Wrap in AcademicLayout. Replace gradients with subtle left border or label in `--primary`/`--secondary`. Use `.panel` for course cards. Progress bar with `--primary` fill |

**Key UI Elements:**
- Course cards grid
- Category/subject filters
- Progress indicators per course
- Free vs Pro badges
- Search/filter bar

---

### PAGE 15: Course Detail (Dynamic)
| Field | Value |
|-------|-------|
| **Route** | `/courses/[courseId]` |
| **File** | `src/app/courses/[courseId]/page.tsx` |
| **Layout** | Should use AcademicLayout |
| **Redesign Scope** | Course overview with lesson list. Use `.panel` for lesson rows. Progress tracking |

**Key UI Elements:**
- Course header/title
- Lesson list with completion status
- Progress bar
- Start/continue button

---

### PAGE 16: Lesson Detail (Dynamic)
| Field | Value |
|-------|-------|
| **Route** | `/courses/[courseId]/[lessonId]` |
| **File** | `src/app/courses/[courseId]/[lessonId]/page.tsx` |
| **Layout** | Should use AcademicLayout (potentially with right panel for AI chat) |
| **Redesign Scope** | Lesson content display. Markdown rendering. Course-specific AI chat integration |

**Key UI Elements:**
- Lesson content (markdown rendered)
- Navigation (prev/next lesson)
- AI chat for questions
- Completion button

---

### PAGE 17: Sign In
| Field | Value |
|-------|-------|
| **Route** | `/sign-in` |
| **File** | `src/app/sign-in/[[...sign-in]]/page.tsx` |
| **Layout** | Clerk catch-all (limited customization) |
| **Redesign Scope** | Style the wrapper/container to match dark theme. Clerk components have limited styling but the surrounding page should match |

---

### PAGE 18: Sign Up
| Field | Value |
|-------|-------|
| **Route** | `/sign-up` |
| **File** | `src/app/sign-up/[[...sign-up]]/page.tsx` |
| **Layout** | Clerk catch-all (limited customization) |
| **Redesign Scope** | Same as Sign In — style wrapper to match dark theme |

---

## Shared UI Component Library (50+ components)

**Location:** `src/components/ui/`

These are Shadcn/ui components (Radix UI wrappers). They control the look of ALL reusable UI primitives. Restyling these propagates across the entire app.

### High-Impact Components (Restyle First)
| # | File | Component | Impact |
|---|------|-----------|--------|
| 1 | `button.tsx` | Button (CVA variants) | Used everywhere — primary, secondary, ghost, outline variants |
| 2 | `card.tsx` | Card | Panels, content blocks |
| 3 | `input.tsx` | Input | All form fields |
| 4 | `textarea.tsx` | Textarea | Chat input, long form fields |
| 5 | `dialog.tsx` | Dialog/Modal | Confirmation dialogs, settings |
| 6 | `tabs.tsx` | Tabs | Navigation within pages |
| 7 | `badge.tsx` | Badge | Status indicators, tags |
| 8 | `progress.tsx` | Progress bar | Course/quiz progress |
| 9 | `select.tsx` | Select dropdown | Subject pickers, filters |
| 10 | `form.tsx` | Form wrapper | All forms (react-hook-form) |
| 11 | `dropdown-menu.tsx` | Dropdown menu | User menu, actions |
| 12 | `sheet.tsx` | Sheet/Slide-over | Mobile nav, settings panels |
| 13 | `avatar.tsx` | Avatar | User profile images |
| 14 | `skeleton.tsx` | Skeleton loader | Loading states |
| 15 | `toast.tsx` + `toaster.tsx` + `sonner.tsx` | Notifications | Toast messages |

### Medium-Impact Components
| # | File | Component |
|---|------|-----------|
| 16 | `accordion.tsx` | Expandable sections |
| 17 | `alert.tsx` | Alert messages |
| 18 | `alert-dialog.tsx` | Confirmation dialogs |
| 19 | `breadcrumb.tsx` | Navigation breadcrumbs |
| 20 | `calendar.tsx` | Date picker |
| 21 | `carousel.tsx` | Content carousel |
| 22 | `chart.tsx` | Chart wrapper (Recharts) |
| 23 | `checkbox.tsx` | Checkbox input |
| 24 | `command.tsx` | Command palette (cmdk) |
| 25 | `drawer.tsx` | Bottom drawer (vaul) |
| 26 | `hover-card.tsx` | Hover preview card |
| 27 | `label.tsx` | Form labels |
| 28 | `navigation-menu.tsx` | Complex nav menus |
| 29 | `pagination.tsx` | Page navigation |
| 30 | `popover.tsx` | Popover content |
| 31 | `radio-group.tsx` | Radio button groups |
| 32 | `scroll-area.tsx` | Custom scroll container |
| 33 | `separator.tsx` | Visual dividers |
| 34 | `slider.tsx` | Range slider |
| 35 | `switch.tsx` | Toggle switch |
| 36 | `table.tsx` | Data tables |
| 37 | `toggle.tsx` | Toggle buttons |
| 38 | `toggle-group.tsx` | Grouped toggles |
| 39 | `tooltip.tsx` | Hover tooltips |

### Utility Components
| # | File | Component |
|---|------|-----------|
| 40 | `aspect-ratio.tsx` | Aspect ratio container |
| 41 | `button-group.tsx` | Grouped buttons |
| 42 | `collapsible.tsx` | Collapsible sections |
| 43 | `context-menu.tsx` | Right-click menu |
| 44 | `empty.tsx` | Empty state display |
| 45 | `field.tsx` | Form field wrapper |
| 46 | `input-group.tsx` | Input with addons |
| 47 | `input-otp.tsx` | OTP code input |
| 48 | `item.tsx` | List item |
| 49 | `kbd.tsx` | Keyboard shortcut display |
| 50 | `menubar.tsx` | Menu bar |
| 51 | `resizable.tsx` | Resizable panels |
| 52 | `sidebar.tsx` | Sidebar component |
| 53 | `spinner.tsx` | Loading spinner |
| 54 | `use-mobile.tsx` | Mobile detection hook wrapper |

---

## Feature Components

| # | File | Purpose | Notes |
|---|------|---------|-------|
| 1 | `src/components/StreakBadge.tsx` | Learning streak display | Uses `--achievement` color |
| 2 | `src/components/VoiceIndicator.tsx` | Voice recording indicator | Audio visualization |
| 3 | `src/components/VoiceSettings.tsx` | Voice preferences panel | Speed, voice selection |

---

## Custom Hooks (UI-Related)

| File | Hook | Purpose |
|------|------|---------|
| `src/hooks/use-mobile.ts` | `useIsMobile()` | Returns boolean at 768px breakpoint |
| `src/hooks/use-toast.ts` | `useToast()`, `toast()` | Toast notification state |
| `src/hooks/use-voice.ts` | `useVoice()` | Speech recognition + synthesis |

---

## Data Files (UI Feeds From These)

| File | Content | UI Impact |
|------|---------|-----------|
| `src/lib/courses.ts` | 11 courses (6 free, 5 pro) + lessons | Course cards, lesson lists |
| `src/lib/subjects.ts` | 10 subjects with emojis | Subject picker, filters |
| `src/lib/supabase.ts` | DB types: Conversation, Message, UserProgress, UserStreak, StudentProfile, Quiz, CourseProgress, etc. | Shapes all data displayed in UI |

---

## API Routes (No UI Changes — Reference Only)

These are backend routes. No visual changes needed, but helpful for understanding data flow:

| Route | Purpose |
|-------|---------|
| `/api/chat` | AI chat streaming |
| `/api/analyze` | Content analysis |
| `/api/assessment` | Assessment submission/results |
| `/api/profile` | User profile CRUD |
| `/api/progress` | Learning progress |
| `/api/memory` | Learning memory |
| `/api/insights` | Learning insights |
| `/api/suggestions` | Content suggestions |
| `/api/trending` | Trending topics |
| `/api/trending/summary` | Topic summaries |
| `/api/quiz` | Quiz CRUD |
| `/api/quiz/[id]` | Single quiz |
| `/api/quiz/generate` | AI quiz generation |
| `/api/quiz-mode/generate` | Quiz mode generation |
| `/api/quiz-mode/history` | Quiz history |
| `/api/quiz-mode/save` | Save quiz results |
| `/api/conversations` | Conversation list |
| `/api/conversations/messages` | Messages in conversation |
| `/api/courses/chat` | Course-specific AI chat |
| `/api/courses/lesson-content` | Lesson content |
| `/api/courses/progress` | Course progress tracking |

---

## Redesign Priority Order

### Phase 1: Foundation (Do First)
1. **`globals.css`** — Add all missing design tokens
2. **`Navbar.tsx`** — Switch to dark theme + tokens
3. **`AcademicLayout.tsx`** — Audit and polish the 3-column shell
4. **`button.tsx`** + **`card.tsx`** + **`input.tsx`** — Core UI primitives

### Phase 2: Core Pages
5. **Dashboard** (`dashboard/page.tsx` + `DashboardContent.tsx`)
6. **Chat** (`chat/page.tsx`) — Wrap in AcademicLayout, fix tokens
7. **Courses** (`courses/page.tsx`, `[courseId]/page.tsx`, `[courseId]/[lessonId]/page.tsx`)
8. **Quiz** (`quiz/page.tsx`, `quiz/[id]/page.tsx`, `quizzes/page.tsx`)

### Phase 3: Secondary Pages
9. **Progress** (`progress/page.tsx`)
10. **History** (`history/page.tsx`)
11. **Trending** (`trending/page.tsx`)
12. **Assessment** (`assessment/page.tsx`)

### Phase 4: Support Pages
13. **Profile** (`profile/page.tsx`)
14. **Pricing** (`pricing/page.tsx`)
15. **Onboarding** (`onboarding/page.tsx`)
16. **Sign In / Sign Up** (wrapper styling)

### Phase 5: Landing Page
17. **Landing** (`page.tsx` + all 12 landing components)

### Phase 6: Polish
18. Remaining UI components in `src/components/ui/`
19. Loading states (skeletons)
20. Empty states
21. Error states
22. Mobile responsive pass on all pages

---

## Key Consistency Rules

1. **Every app page** (post-login) must use `AcademicLayout` — exceptions only for onboarding/auth
2. **Every card/surface** must use the `.panel` class or equivalent token-based styling
3. **Every heading** must use Playfair Display (serif); every body/UI text must use Inter (sans)
4. **Every button** must follow: primary = `--primary` bg, secondary = outline with `--border-strong`, ghost = no border
5. **Every color** must come from CSS variables — no hardcoded hex in component files
6. **Every transition** must be 250–350ms ease-in-out
7. **Every interactive element** must have visible focus ring (`2px outline --primary`)
8. **No gradients** in the app (except the subtle `bg-academic` radial). Landing page is the exception
9. **Mobile breakpoint** at 768px (matches `use-mobile.ts` hook)

---

## File Count Summary

| Category | Count | Location |
|----------|-------|----------|
| Page routes | 18 | `src/app/**/page.tsx` |
| API routes | 21 | `src/app/api/**/route.ts` |
| UI components | 54 | `src/components/ui/*.tsx` |
| Landing components | 12 | `src/components/landing/*.tsx` |
| Feature components | 6 | `src/components/*.tsx` |
| Dashboard components | 1 | `src/components/dashboard/*.tsx` |
| Hooks | 3 | `src/hooks/*.ts` |
| Lib/utils | 4 | `src/lib/*.ts` |
| CSS files | 1 | `src/app/globals.css` |
| Config files | 3 | `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` |
| **Total UI-relevant files** | **~100** | |

---

## Existing Design Reference

The project already has a detailed design spec at `DESIGN_SPECIFICATION.md` in the project root. It contains the same token system, typography rules, and page-by-page recommendations described here. Use both documents together — this brief focuses on the "what files to change" while the spec focuses on "how things should look."
