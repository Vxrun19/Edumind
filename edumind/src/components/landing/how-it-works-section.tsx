'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Three honest steps — copy preserved verbatim from the previous version.
// These describe what actually happens when a user signs up: pick a track
// in onboarding, take the assessment to surface weak topics, then chat
// with the tutor for explanations and practice. No new claims.
const STEPS = [
  {
    num: '01',
    title: 'Pick your track',
    body: 'Tell us if you are prepping for JEE or NEET, and where you are in your prep.',
  },
  {
    num: '02',
    title: 'Find your weak topics',
    body: 'A quick assessment shows where you are confident and where you need more time.',
  },
  {
    num: '03',
    title: 'Start solving exam-style problems',
    body: 'Ask the tutor anything. Get step-by-step explanations and practice questions for your syllabus.',
  },
] as const

export function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion()

  // Number gets a scale+fade; title and body use the standard StaggerItem
  // fade+rise. The number lands first as the "station" of the step, then
  // the type follows.
  const numberVariants: Variants = prefersReducedMotion
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
      id="how-it-works"
      className="relative px-6 mt-24 md:mt-32 py-20 md:py-28"
      style={{
        background: 'var(--bg-muted)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section header — centered editorial label + serif H2 */}
        <ScrollReveal>
          <div className="text-center">
            <span className="label">The process</span>
            <h2
              id="how-it-works-heading"
              className="font-serif font-normal mt-4"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              {"Three steps. That's it."}
            </h2>
          </div>
        </ScrollReveal>

        {/* Steps.
         *  A single continuous hairline runs down the left side, threading
         *  the three giant numbers together. This is the section's
         *  distinguishing move vs. "Why EduMind" — there the entries are
         *  parallel reasons separated by rules; here they're a SEQUENCE
         *  connected by a line. The numbers are "stations" on the line;
         *  the eye flows 01 → 02 → 03 down the page.                     */}
        <div className="relative mt-16 md:mt-20">
          {/* The connecting line. Pure-decorative hairline, full height of
           *  the steps container. Sits at the left edge of the editorial
           *  column (not the screen edge). */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0"
            style={{
              left: '0',
              width: '1px',
              background: 'var(--border)',
            }}
          />

          {/* Steps content — indented right of the line so the line stays
           *  unobstructed and clearly carries the eye downward. */}
          <div className="pl-10 md:pl-16">
            {STEPS.map((step, i) => (
              <div key={step.num} className={i > 0 ? 'mt-20 md:mt-24' : ''}>
                <StaggerContainer stagger={0.08} delayChildren={0.05}>
                  {/* Giant numeral — gradient violet→blue, Lora display.
                   *  Anchors each step as a distinct "moment" on the line. */}
                  <motion.div
                    variants={numberVariants}
                    className="font-serif gradient-text"
                    style={{
                      fontSize: 'clamp(48px, 10vw, 96px)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                      display: 'inline-block',
                    }}
                  >
                    {step.num}
                  </motion.div>

                  {/* Title — serif h3, slate-primary, smaller than the
                   *  number so hierarchy reads number → title → body. */}
                  <StaggerItem className="mt-4 md:mt-5">
                    <h3
                      className="font-serif font-normal"
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 'clamp(22px, 3vw, 32px)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {step.title}
                    </h3>
                  </StaggerItem>

                  {/* Body — serif, slate-secondary, capped at 56ch for
                   *  comfortable reading column on wide screens. */}
                  <StaggerItem className="mt-3 md:mt-4">
                    <p
                      className="font-serif"
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'clamp(16px, 1.4vw, 18px)',
                        lineHeight: 1.65,
                        maxWidth: '56ch',
                      }}
                    >
                      {step.body}
                    </p>
                  </StaggerItem>
                </StaggerContainer>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
