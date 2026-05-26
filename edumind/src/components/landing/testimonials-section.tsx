'use client'

import React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Three honest reasons. Numerals are Roman to match the editorial /
// printed-magazine character of the design system. Copy is the same
// content as the previous card-grid version — kept truthful, not new
// claims.
const REASONS = [
  {
    numeral: 'I',
    title: 'Two clear tracks',
    body: 'JEE (Physics + Chemistry + Maths) or NEET (Physics + Chemistry + Biology). Pick yours — the tutor knows your syllabus and stays focused on what is on the exam.',
  },
  {
    numeral: 'II',
    title: 'Step-by-step teaching',
    body: 'Concepts broken into clear steps with worked examples. Ask follow-ups until it clicks — no rushing, no judgement, whether it is exam season or 2am.',
  },
  {
    numeral: 'III',
    title: 'Quizzes and weak-topic tracking',
    body: 'Practice questions aligned to JEE and NEET patterns. The tutor remembers which topics give you trouble and helps you revisit them before they cost you marks.',
  },
] as const

export function TestimonialsSection() {
  const prefersReducedMotion = useReducedMotion()

  // Numeral gets its own variant — scale + fade. Title/body use the
  // shared StaggerItem (fade + rise). Together they make the entry feel
  // like the numeral *lands* and the type follows.
  const numeralVariants: Variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        whileInView: {
          opacity: 1,
          transition: { duration: 0.4, ease: easing },
        },
      }
    : {
        initial: { opacity: 0, scale: 0.92 },
        whileInView: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.55, ease: easing },
        },
      }

  return (
    <section
      className="relative px-6 mt-24 md:mt-32"
      aria-labelledby="reasons-heading"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section header — centered. Editorial label sits above an
         *  unhurried serif H2. */}
        <ScrollReveal>
          <div className="text-center">
            <span className="label">Why EduMind</span>
            <h2
              id="reasons-heading"
              className="font-serif font-normal mt-4 mx-auto"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              Built for JEE &amp; NEET aspirants.
            </h2>
          </div>
        </ScrollReveal>

        {/* Three editorial entries — left-aligned, ruled between, generous
         *  vertical breathing room. Each entry is its own stagger group
         *  that triggers when *it* scrolls into view, so the reveal
         *  cascades as the reader moves down the page rather than firing
         *  all at once. */}
        <div className="mt-16 md:mt-20">
          {REASONS.map((reason, i) => (
            <div
              key={reason.numeral}
              className={i > 0 ? 'mt-12 md:mt-16 pt-12 md:pt-16' : ''}
              style={
                i > 0 ? { borderTop: '1px solid var(--border)' } : undefined
              }
            >
              <StaggerContainer stagger={0.1} delayChildren={0.05}>
                {/* Numeral — big Lora display in violet→blue gradient.
                 *  Restrained brand use: three numerals across the section,
                 *  no other gradient text in the entries. */}
                <motion.div
                  variants={numeralVariants}
                  className="font-serif gradient-text"
                  style={{
                    fontSize: 'clamp(48px, 11vw, 112px)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    display: 'inline-block',
                  }}
                >
                  {reason.numeral}
                </motion.div>

                {/* Title — serif h3, slate-primary, smaller than the
                 *  numeral so the hierarchy reads numeral → title → body. */}
                <StaggerItem className="mt-4 md:mt-5">
                  <h3
                    className="font-serif font-normal"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: 'clamp(24px, 3.5vw, 36px)',
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {reason.title}
                  </h3>
                </StaggerItem>

                {/* Body — serif body, slate-secondary, capped at 60ch so
                 *  reading column stays comfortable even when the
                 *  container is wider on big screens. */}
                <StaggerItem className="mt-3 md:mt-4">
                  <p
                    className="font-serif"
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 'clamp(16px, 1.4vw, 18px)',
                      lineHeight: 1.65,
                      maxWidth: '60ch',
                    }}
                  >
                    {reason.body}
                  </p>
                </StaggerItem>
              </StaggerContainer>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
