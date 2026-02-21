# PHASE 1 — globals.css comparison

## Project A (edumind) — current `src/app/globals.css`

- **Theme**: Dark academic (#0F172A base, #1E293B secondary), blue primary (#3B82F6).
- **Fonts**: Playfair Display (serif), Inter (sans) via CSS vars.
- **Structure**: Single `:root` only; no `@theme inline`, no `@layer base`.
- **Imports**: `@import "tailwindcss"` only (no tw-animate-css).
- **Custom classes**: `.panel`, `.btn-primary`, `.bg-academic`, typography (h1–h3, p, .label), scrollbar, selection.
- **No**: design tokens for shadcn/sidebar, keyframe animations, glass/gradient utilities.

## Project B (v0-extracted) — `app/globals.css` (new design)

- **Theme**: Dark (#0a0f1e background), cyan primary (#00d4ff), purple secondary (#8b5cf6). Matches `.cursor/rules` EduMind redesign.
- **Fonts**: Space Grotesk (sans, via `--font-space-grotesk`), Geist Mono in `@theme inline`.
- **Structure**: `:root` + `.dark` (same values), `@theme inline` (Tailwind 4 theme), `@layer base` (body, scrollbar, border/ring).
- **Imports**: `@import 'tailwindcss'`, `@import 'tw-animate-css'`, `@custom-variant dark`.
- **Custom classes**: `.glass`, `.glass-strong`, `.gradient-text`, `.glow-cyan`, `.glow-purple`, `.animated-mesh-bg`, `.typing-dot`, plus keyframes: float, pulse-glow, shimmer, typing, blink, fade-in-up, slide-in-right, gradient-mesh, wave.
- **Design tokens**: Full set for card, popover, sidebar, chart, radius, border, input, ring (shadcn/ui compatible).

## Summary of changes when replacing A with B

| Aspect        | Project A (old)     | Project B (new)                          |
|---------------|---------------------|------------------------------------------|
| Background    | #0F172A             | #0a0f1e                                  |
| Primary       | #3B82F6 (blue)      | #00d4ff (cyan)                           |
| Secondary     | #64748B             | #8b5cf6 (purple)                         |
| Font (sans)   | Inter               | Space Grotesk                            |
| Font (serif)  | Playfair Display    | Not in B’s globals (theme uses Geist Mono)|
| Animations    | None                | float, shimmer, fade-in-up, etc.        |
| Utilities     | .panel, .btn-primary | .glass, .gradient-text, .glow-*, etc.     |
| Tailwind theme| No                  | Yes (@theme inline)                      |

Project A’s layout will keep Clerk and NavbarWrapper; we only add Space Grotesk from B so the new design system (which references `--font-space-grotesk`) works.
