# EduMind — Full Design Specification

This document provides a **fully detailed design information** for the EduMind website to make it consistent, accessible, and premium. Use it as the single source of truth for visual and interaction design.

---

## 1. Design Philosophy & Principles

| Principle | Description |
|-----------|-------------|
| **Calm** | No neon, no pulsing, no confetti. Transitions are 250–350ms, ease-in-out. |
| **Intelligent** | Editorial typography (serif for headings), clear hierarchy, scholarly tone. |
| **Institutional** | Feels like a digital private academy: three-column layout, fixed nav, “Scholarly Commentary” panel. |
| **Premium** | Consistent tokens, ample spacing (32–40px between sections), matte surfaces, thin borders. |
| **Timeless** | No trend-heavy effects (glassmorphism overload, gradients everywhere). Subtle radial light only. |

**Out of scope (do not use):** SaaS-dashboard feel, futuristic/gamified aesthetics, neon colors, glow effects, spring animations, bounce, confetti.

---

## 2. Design Tokens (Single Source of Truth)

### 2.1 Current tokens in `globals.css`

These are already defined and must be used everywhere inside the app (post-login):

```css
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
```

### 2.2 Missing tokens (used in code but not defined)

Many components reference variables that **do not exist** in `globals.css`. Add these for consistency and to fix “invisible” or wrong styles:

| Token | Recommended value | Use |
|-------|-------------------|-----|
| `--border` | `rgba(255, 255, 255, 0.08)` | Default borders (same as panel border). |
| `--border-strong` | `rgba(255, 255, 255, 0.12)` | Emphasized borders (e.g. outline buttons). |
| `--bg-muted` | `rgba(255, 255, 255, 0.06)` | Hover states, secondary surfaces. |
| `--bg-surface` | Same as `--bg-panel` or `rgba(255,255,255,0.04)` | Cards, inputs. |
| `--primary-light` | `rgba(59, 130, 246, 0.15)` | Selected state, primary tint. |
| `--primary-dark` | `#2563EB` | Primary button hover. |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.2)` | Subtle elevation. |
| `--accent-red` | `rgba(239, 68, 68, 0.9)` | Errors, destructive, “incorrect” (e.g. assessment). |
| `--accent-green` | `rgba(34, 197, 94, 0.9)` | Success, “correct” (use sparingly). |
| `--bg-subtle` | `rgba(255, 255, 255, 0.02)` | Very subtle backgrounds. |

**Action:** Add the missing tokens to `:root` in `globals.css` so Navbar, Chat, StreakBadge, pricing, app shell, and assessment no longer rely on undefined variables.

---

## 3. Typography

| Element | Font | Size | Weight | Line height | Notes |
|---------|------|------|--------|-------------|-------|
| **Main heading (page title)** | Serif (Playfair Display) | 40px | 400 | 1.2 | One per page. |
| **Section heading** | Serif | 28px | 400 | 1.3 | e.g. “Academic Progress”. |
| **Subheading** | Sans (Inter) | 20px | 500 | 1.4 | e.g. “Scholarly Commentary”. |
| **Body** | Sans | 16px | 400 | 1.7 | Default for paragraphs. |
| **Labels / small caps** | Sans | 12px | 500 | — | Uppercase, letter-spacing 0.08em, tertiary color. |
| **Small / captions** | Sans | 14px or 12px | 400 | 1.5 | Tertiary color. |

- **Serif** = editorial, scholarly. Use for: page titles, section titles, key quote-like content.
- **Sans** = UI, body, labels. Use for: nav, buttons, forms, lists, commentary.

---

## 4. Layout Architecture

### 4.1 Target structure (desktop 1440px)

- **Top bar:** Global navbar, height 57px (or 56px), sticky. Background: `--bg-secondary`, border-bottom: `--bg-panel-border`.
- **Left nav:** 240px fixed, background `--bg-secondary`, border-right `--bg-panel-border`. Items: Dashboard, Scholarly Dialogue, Courses, Assessments, Progress. Active: 3px left border `--primary`.
- **Center content:** Max-width 720px, centered. Padding vertical 40px (or 32px), horizontal 24px. Use `--spacing-section` between major sections.
- **Right panel (optional):** 320px fixed, “Scholarly Commentary” title (label style), content in a single `.panel` with 24px padding.

### 4.2 Current inconsistency

- **Using AcademicLayout:** Dashboard, Quiz only.
- **Not using AcademicLayout:** Chat, Courses, Progress, History, Trending, Assessment (learning questionnaire), Onboarding, Profile, Pricing.

**Recommendation:** Use `AcademicLayout` for all main app routes (dashboard, chat, courses, quiz, progress, history, trending). Use it **without** right panel by default; pass `rightPanel` only where needed (e.g. chat for “Knowledge Canvas” or future commentary). For Assessment (multi-step questionnaire), either wrap in AcademicLayout with no right panel or use a minimal full-width layout that still uses the same tokens and typography.

### 4.3 Mobile / responsive

- Left nav: Collapse to a drawer or top dropdown; center content full width.
- Right panel: Stack below main content or hide behind a toggle.
- Touch targets: minimum 44px. Spacing and font sizes from tokens remain; only layout and visibility change.

---

## 5. Components & Patterns

### 5.1 Panels and cards

- **Class:** `.panel` (already in globals.css).
- **Usage:** All card-like surfaces: content blocks, forms, commentary, list containers.
- **Do not:** Add extra gradients or glow. Optional: very subtle inner shadow for “matte” feel.

### 5.2 Buttons

- **Primary:** `.btn-primary` — background `--primary`, white text, radius 12px, padding 12px 20px. Hover: darken (`#2563EB`), translateY(-2px), light shadow. No gradient, no glow.
- **Secondary / outline:** Same padding and radius; background transparent; border `1px solid var(--border-strong)`; text `--text-primary`. Hover: `--bg-muted`, border `--primary`.
- **Text / ghost:** No border, no background. Hover: `--bg-muted`. Use for “Back”, “Next →”, “See all”.

### 5.3 Form controls

- **Inputs / textareas:** Background `--bg-panel`, border `--bg-panel-border`, radius `--radius`. Focus: border `--primary`, no heavy glow. Padding ~12px 16px.
- **Selects / dropdowns:** Same as inputs; dropdown list uses `.panel` and same borders.
- **Radio / checkbox:** Prefer custom styling with `--primary` for checked state; avoid neon.

### 5.4 Links

- Default: `--text-secondary`. Hover: `--text-primary` or `--primary`.
- In body text: underline on hover, color `--primary`.

### 5.5 Lists and rows

- **Navigation items:** Vertical list, padding 12px 16px, hover `--bg-muted`, active 3px left border `--primary`.
- **Data rows (e.g. history, course list):** Full-width row, padding 16px; divider `1px solid var(--border)`. Hover: background `--bg-muted`. No alternating strong colors.

### 5.6 Assessment / Quiz specific

- **Question text:** Large serif (e.g. 28px or 40px), centered.
- **Answer options:** Contained bordered rows (`.panel`-style), one per row. Hover: border `--primary`.
- **Correct:** Thin gold underline (`--achievement`), 2px, animate in 250–350ms.
- **Incorrect:** Thin muted red underline (e.g. `--accent-red` at 60% opacity), same duration.
- **No:** Confetti, bounce, or spring animations.

---

## 6. Motion

- **Duration:** 250–350ms (use `--motion-duration`).
- **Easing:** ease-in-out (`--motion-easing`). No spring for UI.
- **Use for:** Page/section fade-in, hover (color, border, translateY), answer feedback underline, modal open/close.
- **Avoid:** Bounce, elastic, long loops, flashing.

---

## 7. Page-by-Page Design Notes

| Page | Current state | Recommendations |
|------|----------------|-----------------|
| **Dashboard** | Uses AcademicLayout; heading “Architecture of Rational Thought”; progress sphere with gold ring. | Add optional right panel with “Suggested next” or streak. Ensure all links/buttons use design tokens. |
| **Chat (Scholarly Dialogue)** | Own layout; uses undefined tokens (`--border`, `--bg-muted`, `--primary-light`, etc.). | Wrap in AcademicLayout. Map Knowledge Canvas to right panel. Replace all undefined tokens with defined ones. Unify input bar and message bubbles with `.panel` and tokens. |
| **Courses** | Full-width custom layout; gradients per subject. | Wrap in AcademicLayout. Replace gradients with subtle left border or label in `--primary`/`--secondary`. Use `.panel` for course cards; progress bar with `--primary` fill. |
| **Quiz (Assessments)** | Uses AcademicLayout; “Assessment Mode”; gold/red underlines. | Keep; ensure timer and progress bar use `--primary` and no neon. Results: use serif for score, panels for breakdown. |
| **Progress** | Custom layout; level badges with gradients. | Wrap in AcademicLayout. Level badges: solid colors or very subtle tints (e.g. `--achievement` for Master, `--primary` for Explorer). Bars: track `--bg-muted`, fill `--primary`. |
| **History** | List of conversations. | Use AcademicLayout. Rows: `.panel` or bordered rows; label style for dates; text buttons for “Delete”. |
| **Trending** | Topic cards. | Use AcademicLayout. Cards: `.panel`, no gradient; optional left border `--primary` for emphasis. |
| **Assessment (questionnaire)** | Long multi-step form; uses old tokens. | Use AcademicLayout (no right panel) or minimal layout. All inputs and option rows: `.panel`, borders, `--primary` for selected. Replace `--primary-soft` etc. with defined tokens. |
| **Onboarding** | Likely standalone. | Use same tokens and typography; single column centered; primary CTA with `.btn-primary`. |
| **Profile** | — | Use AcademicLayout; forms and sections in `.panel`. |
| **Pricing** | Uses undefined tokens. | Add missing tokens; use `.panel` for plan cards; primary button for CTA. |
| **Landing** | Separate marketing style (e.g. cyan accent). | Can stay distinct for marketing; ensure “Sign In” / “Sign Up” and any shared components use tokens where they cross into app. |

---

## 8. Navbar (Top Bar)

- **Background:** `--bg-secondary` (not white). So that it matches the dark academic theme.
- **Height:** 56–57px.
- **Border:** 1px bottom `--bg-panel-border`.
- **Logo:** Serif or sans, `--text-primary`, weight 600.
- **Links:** `--text-secondary`, hover/active `--text-primary`. Active indicator: 2px bottom border `--primary` or small dot.
- **Sign In:** Text button, `--text-secondary` → hover `--text-primary`.
- **Sign Up:** `.btn-primary`.
- **Signed-in:** Streak + avatar. Streak: `--text-secondary`; icon or badge can use `--achievement` sparingly. Avatar: 40px circle; border optional `--bg-panel-border`.

**Action:** Update `Navbar.tsx` to use `--bg-secondary` and the token set above; remove `bg-white` and any reference to undefined variables.

---

## 9. Accessibility

- **Contrast:** All text on `--bg-base` / `--bg-secondary` / `--bg-panel` must meet WCAG AA (e.g. `--text-primary` and `--text-secondary` on dark backgrounds).
- **Focus:** Visible focus ring (e.g. 2px outline `--primary`) on all interactive elements; do not remove outline without a replacement.
- **Labels:** All form fields have visible labels; use `.label` class for consistency.
- **Motion:** Prefer `prefers-reduced-motion: reduce` to disable or shorten animations (e.g. 0ms or 100ms).

---

## 10. Implementation Priority

1. **Tokens:** Add all missing CSS variables to `globals.css`.
2. **Navbar:** Switch to dark theme and defined tokens.
3. **Layout:** Use AcademicLayout on Chat, Courses, Progress, History, Trending.
4. **Chat:** Replace undefined tokens; align message bubbles and input with `.panel` and tokens; optional right panel for Knowledge Canvas.
5. **Assessment:** Replace old tokens; use `.panel` and serif for headings; optional AcademicLayout.
6. **Courses & Progress:** Remove or soften gradients; use panels and tokens; optional right panel where it adds value.
7. **Pricing & Profile:** Use tokens and `.panel`; ensure CTAs use `.btn-primary`.
8. **Landing:** If needed, align only shared elements (e.g. header CTA) with tokens; marketing palette can stay separate.

---

## 11. File Reference

| File | Role |
|------|------|
| `src/app/globals.css` | Design tokens, typography, `.panel`, `.btn-primary`, scrollbar, selection. |
| `src/app/layout.tsx` | Font loading (Playfair Display, Inter), body class. |
| `src/components/AcademicLayout.tsx` | Three-column shell: left nav, center (720px), optional right panel. |
| `src/components/Navbar.tsx` | Top bar; should use tokens and dark background. |
| `src/components/NavbarWrapper.tsx` | Conditionally renders Navbar (e.g. hide on landing). |

Using this spec consistently across the codebase will make the site feel **calm, intelligent, institutional, premium, and timeless**, and easier to maintain and extend.
