'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Scope statement: the four subjects the tutor actually covers.
// Order matches how the JEE/NEET overlap reads — Physics & Chemistry are
// shared, then Maths (JEE-only), then Biology (NEET-only).
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'] as const

export function SubjectsStrip() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      // Full-bleed band — subtly darker / more saturated than the hero's
      // --bg-base, with hairline rules top and bottom to define it as
      // its own surface. min-h 30vh gives the band air on tall viewports
      // while content padding keeps mobile honest.
      className="relative w-full px-6 py-16 md:py-20 flex flex-col items-center justify-center"
      style={{
        background: 'var(--bg-muted)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        minHeight: '30vh',
      }}
      aria-labelledby="subjects-heading"
    >
      <h2 id="subjects-heading" className="sr-only">
        Subjects covered
      </h2>

      {/* Subjects row.
       *  Desktop (md+): single horizontal row with thin middle-dot dividers
       *                 between each subject, baseline-aligned.
       *  Mobile:        stacked vertically, dots hidden — at 360px width
       *                 a four-subject row at display sizes will not fit
       *                 legibly, so we let them breathe one-per-line.
       *  Motion:        left-to-right reveal on scroll-in, fades + rise.
       *                 Stagger drops to zero under reduced-motion.       */}
      <StaggerContainer
        className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-y-3 md:gap-y-0"
        stagger={0.07}
        delayChildren={0.05}
      >
        {SUBJECTS.map((subject, idx) => (
          <StaggerItem key={subject} className="inline-flex items-baseline">
            {/* Leading middle-dot, attached to the item so it reveals
             *  together with its subject. Hidden on mobile. */}
            {idx > 0 && (
              <span
                aria-hidden="true"
                className="hidden md:inline-block font-serif mx-4 lg:mx-6 select-none"
                style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 'clamp(28px, 5vw, 72px)',
                  lineHeight: 1.1,
                }}
              >
                ·
              </span>
            )}
            <span
              // Default state — solid slate. Hover picks up the brand
              // violet, but only on subjects (not on the structural dots).
              className="font-serif transition-colors duration-200 text-[color:var(--text-primary)] hover:text-[color:var(--accent)]"
              style={{
                fontSize: 'clamp(32px, 6vw, 88px)',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              {subject}
            </span>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Editorial label line — grounds the four subjects in which exam
       *  uses which combo. Uses the .label utility from the design system
       *  (sans, 11px, uppercase, tracked 0.12em, tertiary text). */}
      <motion.p
        className="label text-center mt-8 md:mt-10"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{
          duration: 0.4,
          delay: prefersReducedMotion ? 0 : 0.4,
          ease: easing,
        }}
      >
        JEE: Physics + Chemistry + Maths
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        NEET: Physics + Chemistry + Biology
      </motion.p>
    </section>
  )
}
