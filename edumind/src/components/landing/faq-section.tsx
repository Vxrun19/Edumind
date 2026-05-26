'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Honest Q&A preserved verbatim from prior version — these are real
// claims grounded in how the product actually behaves. Do NOT modify
// copy here; this is a visual reskin only.
const FAQS = [
  {
    q: 'Is it really free to start?',
    a: 'Yes. No credit card required. The free plan includes 20 AI tutor messages per day and 3 quizzes per day, with full access to all four subjects (Physics, Chemistry, Maths, Biology) and progress tracking. Upgrade anytime if you want more.',
  },
  {
    q: 'Does it cover JEE Advanced as well as JEE Main? And the full NEET syllabus?',
    a: 'The tutor handles concepts and problems across the JEE (Main and Advanced) and NEET (UG) syllabi for Physics, Chemistry, Mathematics, and Biology. Depth scales with what you ask — a definition gets a clear short answer, a tough mechanics problem gets a worked solution step by step.',
  },
  {
    q: 'Is it aligned to NCERT?',
    a: 'The tutor treats NCERT as the foundation — since JEE and NEET both build on it — and goes deeper where the exams demand. It will not restrict answers to NCERT-only when a richer explanation actually helps you understand the concept.',
  },
  {
    q: 'Can I ask questions in Hindi or Hinglish?',
    a: 'Yes. The tutor responds in whichever feels natural to you — English, Hindi, or a mix. Equations and chemical formulas are shown in standard notation either way.',
  },
  {
    q: 'How is this different from ChatGPT?',
    a: 'EduMind is built specifically for JEE and NEET prep. It remembers which topics give you trouble, generates practice questions in the exam pattern, and tracks your progress over time. ChatGPT is general-purpose; EduMind is a tutor for your exam.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel with one click, no questions asked. You keep access until the end of your billing period.',
  },
] as const

// Individual FAQ row. Owns its own open/closed state. The full button
// row is tappable (44px+ tap target on mobile), with the chevron
// rotating and the answer sliding open via framer-motion's height:auto
// (no hardcoded maxHeight to cut off long answers).
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        className="w-full flex items-start justify-between gap-4 py-6 md:py-7 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span
          className="font-serif transition-colors duration-200"
          style={{
            color: open ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: 'clamp(17px, 1.4vw, 19px)',
            lineHeight: 1.4,
            letterSpacing: '-0.005em',
            fontWeight: 400,
          }}
        >
          {q}
        </span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.25,
            ease: easing,
          }}
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            paddingTop: '2px',
          }}
        >
          <ChevronDown
            size={20}
            className="transition-colors duration-200"
            style={{
              color: open ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          />
        </motion.span>
      </button>

      {/* Expand/collapse with framer-motion's height:auto — handles
       *  variable answer lengths without hardcoded maxHeight cutoffs. */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { height: 'auto', opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.3,
              ease: easing,
            }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="font-serif pb-6 md:pb-7 pr-8"
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(15px, 1.3vw, 17px)',
                lineHeight: 1.7,
                maxWidth: '60ch',
              }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  return (
    <section
      className="relative px-6 mt-24 md:mt-32"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-2xl mx-auto">
        {/* Section header — editorial label + serif H2 */}
        <ScrollReveal>
          <div className="text-center">
            <span className="label">Questions</span>
            <h2
              id="faq-heading"
              className="font-serif font-normal mt-4"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              Answered.
            </h2>
          </div>
        </ScrollReveal>

        {/* Q&A list — top hairline starts the divider rhythm, each item
         *  closes with its own bottom hairline. Questions fade in on
         *  scroll with a tight stagger; expand/collapse is per-item.   */}
        <StaggerContainer
          className="mt-12 md:mt-16 border-t border-[color:var(--border)]"
          stagger={0.06}
          delayChildren={0.05}
        >
          {FAQS.map((faq) => (
            <StaggerItem key={faq.q}>
              <FAQItem q={faq.q} a={faq.a} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
