'use client'

import React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { FadeUp } from '@/components/animations'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Headline structured as lines of words. Words flagged `highlight: true`
// render with the violet→blue gradient-text treatment (via .gradient-text).
// Each word — highlighted or not — animates with the same per-word stagger.
type Word = { text: string; highlight?: boolean }
const HEADLINE: ReadonlyArray<ReadonlyArray<Word>> = [
  [
    { text: 'Master' },
    { text: 'JEE', highlight: true },
    { text: '&', highlight: true },
    { text: 'NEET', highlight: true },
    { text: 'concepts.' },
  ],
  [
    { text: 'One' },
    { text: 'step' },
    { text: 'at' },
    { text: 'a' },
    { text: 'time.' },
  ],
]

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  // ─── Motion choreography — total ~1.25s ──────────────────────
  // Word stagger 40ms apart, each word reveals over 450ms.
  // Cascade after H1 settles: subtitle → CTAs → trust line.
  // Reduced-motion path: opacity-only fades, no stagger, no translate.

  const wordVariants: Variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.25, ease: easing } },
      }
    : {
        initial: { opacity: 0, y: '45%' },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: easing },
        },
      }

  const headlineContainerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.04,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  // Underline draws under the last line once words have nearly landed.
  const underlineDelay = prefersReducedMotion ? 0 : 0.6
  const underlineDuration = prefersReducedMotion ? 0.25 : 0.35

  // After-H1 cascade. Each step ~100ms apart.
  const postHeadlineDelay = (extra: number) =>
    prefersReducedMotion ? 0 : 0.65 + extra

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 md:pt-32 pb-16 md:pb-24 text-center overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
      aria-labelledby="hero-headline"
    >
      {/* Atmospheric violet/blue light source from the top — purely
       *  decorative. `pointer-events-none` so clicks fall through to
       *  content beneath, `aria-hidden` so screen readers skip it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-radial)' }}
      />

      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Small editorial label */}
        <FadeUp delay={0}>
          <span
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] inline-block"
            style={{ color: 'var(--accent)' }}
          >
            AI TUTOR FOR JEE &amp; NEET
          </span>
        </FadeUp>

        {/* H1 — massive responsive Lora display, word-by-word stagger.
         *  "JEE & NEET" words render as violet→blue gradient text via
         *  the .gradient-text utility. */}
        <motion.h1
          id="hero-headline"
          className="font-serif font-normal mt-8 md:mt-10 max-w-[1400px] mx-auto"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(48px, 9vw, 140px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
          initial="initial"
          animate="animate"
          variants={headlineContainerVariants}
        >
          {HEADLINE.map((line, lineIdx) => {
            const isLastLine = lineIdx === HEADLINE.length - 1
            return (
              <span key={lineIdx} className="block relative">
                {line.map((word, wordIdx) => (
                  <React.Fragment key={`${lineIdx}-${wordIdx}`}>
                    {/* Clipping wrapper — words rise from below the baseline */}
                    <span
                      className="inline-block overflow-hidden align-baseline"
                      style={{ paddingBottom: '0.06em' }}
                    >
                      <motion.span
                        className={
                          word.highlight
                            ? 'inline-block gradient-text'
                            : 'inline-block'
                        }
                        variants={wordVariants}
                      >
                        {word.text}
                      </motion.span>
                    </span>
                    {wordIdx < line.length - 1 && ' '}
                  </React.Fragment>
                ))}

                {/* Ruled underline under "One step at a time." line.
                 *  Soft violet, draws left-to-right once the last word
                 *  has nearly landed. */}
                {isLastLine && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute left-0 right-0 origin-left mx-auto"
                    style={{
                      background: 'var(--accent)',
                      opacity: 0.35,
                      height: '3px',
                      bottom: '0.06em',
                      width: '100%',
                      maxWidth: 'fit-content',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: underlineDuration,
                      delay: underlineDelay,
                      ease: easing,
                    }}
                  />
                )}
              </span>
            )
          })}
        </motion.h1>

        {/* Editorial subtitle */}
        <FadeUp delay={postHeadlineDelay(0)}>
          <p
            className="font-serif mt-8 md:mt-10 mx-auto max-w-[560px]"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(16px, 1.4vw, 19px)',
              lineHeight: 1.55,
            }}
          >
            An AI tutor that breaks down Physics, Chemistry, Mathematics, and
            Biology &mdash; step-by-step, available 24/7.
          </p>
        </FadeUp>

        {/* CTAs — primary uses .btn-primary (violet→blue gradient + glow),
         *  secondary uses .btn-secondary (outlined, hovers violet). */}
        <FadeUp delay={postHeadlineDelay(0.1)}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 md:mt-10">
            <Link href="/dashboard" className="btn-primary">
              Start learning free →
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See how it works
            </a>
          </div>
        </FadeUp>

        {/* Honest trust line — middle-dot separated bullets */}
        <FadeUp delay={postHeadlineDelay(0.2)}>
          <p
            className="font-sans mt-8 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Free to start
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            No credit card
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            Cancel anytime
          </p>
        </FadeUp>
      </div>
    </section>
  )
}
