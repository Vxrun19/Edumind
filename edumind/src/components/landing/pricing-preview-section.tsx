'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Honest feature lists — preserved verbatim from prior version. These
// were already audited in the earlier bug-fix pass (₹399, no fake "11
// courses" claim, no aspirational features). Do NOT change copy here.
const FREE_FEATURES = [
  '20 AI tutor messages per day',
  '3 quizzes per day',
  'All 4 subjects (PCM + Biology)',
  'Progress tracking',
] as const

const PRO_FEATURES = [
  'Unlimited AI tutor messages',
  'Unlimited quizzes',
  'Voice mode for hands-free study',
  'Full personalization from assessment',
] as const

export function PricingPreviewSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="relative px-6 mt-24 md:mt-32"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center">
            <span className="label">Pricing</span>
            <h2
              id="pricing-heading"
              className="font-serif font-normal mt-4"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              Start free. No catch.
            </h2>
          </div>
        </ScrollReveal>

        {/* Cards grid.
         *  JSX order is [Pro, Free] so the Pro card animates first and
         *  stacks first on mobile (where it should be top — it's the
         *  hero). On desktop, `md:order-*` flips visual order so Free
         *  sits on the left and Pro on the right, with Pro still
         *  animating first to pull the eye.                              */}
        <StaggerContainer
          className="grid md:grid-cols-2 gap-6 md:gap-8 mt-12 md:mt-16 items-stretch"
          stagger={0.1}
          delayChildren={0.1}
        >
          {/* ─── PRO — visual hero ───────────────────────────────── */}
          <StaggerItem className="md:order-2">
            <div
              className="h-full flex flex-col relative p-8 md:p-10"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-subtle)',
                borderRadius: 'var(--radius-2xl)',
                // Stacked shadow: base elevation (xl) + violet halo
                // (glow). Together they advance the card from the page
                // and signal "this is the premium choice."
                boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
              }}
            >
              {/* "Most popular" pill — independent motion so it lands
               *  AFTER the card body, like a stamp at the end. */}
              <motion.div
                className="absolute -top-3 left-1/2 font-sans"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0, x: '-50%' }
                    : { opacity: 0, x: '-50%', scale: 0.85 }
                }
                whileInView={
                  prefersReducedMotion
                    ? { opacity: 1, x: '-50%' }
                    : { opacity: 1, x: '-50%', scale: 1 }
                }
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: prefersReducedMotion ? 0.3 : 0.4,
                  ease: easing,
                  delay: prefersReducedMotion ? 0 : 0.65,
                }}
                style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'nowrap',
                }}
              >
                Most popular
              </motion.div>

              <span className="label" style={{ color: 'var(--accent)' }}>
                Pro
              </span>
              <p
                className="font-serif font-normal mt-3"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 'clamp(36px, 4.5vw, 48px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ₹399
                <span
                  className="font-sans font-normal"
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 16,
                    marginLeft: 6,
                  }}
                >
                  / month
                </span>
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      size={18}
                      strokeWidth={2.5}
                      style={{
                        color: 'var(--accent)',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <span
                      className="font-sans"
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 15,
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="btn-primary mt-7 block w-full text-center"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </StaggerItem>

          {/* ─── FREE — intentionally quieter ────────────────────── */}
          <StaggerItem className="md:order-1">
            <div
              className="h-full flex flex-col p-7 md:p-8"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-2xl)',
                // No shadow — the card sits nearly flat against the
                // page background so the eye is pulled to the Pro card.
              }}
            >
              <span className="label" style={{ color: 'var(--text-tertiary)' }}>
                Free
              </span>
              <p
                className="font-serif font-normal mt-3"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 'clamp(28px, 3.5vw, 36px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                }}
              >
                Free forever
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      size={18}
                      strokeWidth={2.5}
                      style={{
                        color: 'var(--text-tertiary)',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <span
                      className="font-sans"
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 15,
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="btn-secondary mt-7 block w-full text-center"
              >
                Start free →
              </Link>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Quiet "full pricing" link below the cards */}
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-8 md:mt-10">
            <Link
              href="/pricing"
              className="font-sans transition-opacity duration-200 hover:opacity-70"
              style={{ color: 'var(--accent)', fontSize: 14 }}
            >
              Full pricing details →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
