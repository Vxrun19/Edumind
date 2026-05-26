'use client'

import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations'

// A representative sample of the tutor's actual teaching style:
// projectile motion broken into clear steps with worked math. Chosen
// because it's instantly recognizable as a JEE/NEET physics problem
// and demonstrates BOTH conceptual decomposition (why we only need
// vertical motion) AND calculation. Not aspirational — this is the
// same calibrated, step-by-step pattern the live tutor actually
// produces under the current system prompt.
const STUDENT_QUESTION =
  'A ball is thrown at 20 m/s at 30° above the horizontal. How long until it lands?'

type Step = {
  label: string
  body: string
  equation?: string
  answer?: boolean
}

const TUTOR_STEPS: ReadonlyArray<Step> = [
  {
    label: 'Step 1',
    body:
      'Split the launch velocity into vertical and horizontal components. ' +
      'For time of flight, only the vertical matters — horizontal velocity ' +
      "doesn't affect when it lands.",
  },
  {
    label: 'Step 2',
    body:
      'Vertical at launch: 20·sin 30° = 10 m/s. At the peak, vertical ' +
      'velocity is 0. Using v = u − gt:',
    equation: '0 = 10 − 9.8 t  →  t ≈ 1.02 s  (time to peak)',
  },
  {
    label: 'Step 3',
    body:
      'Path is symmetric, so total flight time is twice the time to the peak:',
    equation: 'T = 2 t ≈ 2.04 s',
    answer: true,
  },
]

export function ProductPreviewSection() {
  return (
    <section
      className="relative px-6 mt-24 md:mt-32"
      aria-labelledby="preview-heading"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section header — editorial label + serif H2. Honest, no hype:
         *  the H2 literally describes what the visitor is about to see. */}
        <ScrollReveal>
          <div className="text-center">
            <span className="label">See it teach</span>
            <h2
              id="preview-heading"
              className="font-serif font-normal mt-4"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              One answer, broken into steps.
            </h2>
          </div>
        </ScrollReveal>

        {/* The exchange.
         *  Two distinct surfaces — a violet-tinted student bubble and an
         *  elevated white tutor card — rather than a faux chat UI. No
         *  chrome, no URL bar, no avatars. The design system carries the
         *  meaning; the reader sees a question and a structured reply. */}
        <div className="mt-12 md:mt-16">
          {/* Student message — right-aligned, soft violet bubble.
           *  The asymmetric top-right corner is a subtle "from above"
           *  cue without literal chat-tail decoration. */}
          <ScrollReveal delay={0.05} y={12}>
            <div className="flex justify-end">
              <div
                className="font-serif"
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-2xl)',
                  borderTopRightRadius: 'var(--radius-sm)',
                  padding: '16px 22px',
                  maxWidth: '85%',
                  fontSize: 'clamp(15px, 1.3vw, 17px)',
                  lineHeight: 1.55,
                }}
              >
                {STUDENT_QUESTION}
              </div>
            </div>
          </ScrollReveal>

          {/* Tutor reply — white surface, soft elevation, steps stagger
           *  in line-by-line. Mirrors the student bubble's asymmetric
           *  corner on the top-left so the two surfaces "face" each
           *  other. */}
          <ScrollReveal delay={0.18} y={16}>
            <div
              className="mt-5 md:mt-6 md:px-8 md:py-9"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-2xl)',
                borderTopLeftRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-lg)',
                padding: '28px 24px',
              }}
            >
              <StaggerContainer stagger={0.1} delayChildren={0.2}>
                {TUTOR_STEPS.map((step, i) => (
                  <StaggerItem
                    key={step.label}
                    className={i > 0 ? 'mt-5 md:mt-6' : ''}
                  >
                    <span
                      className="label"
                      style={{ color: 'var(--accent)' }}
                    >
                      {step.label}
                    </span>
                    <p
                      className="font-serif mt-1.5"
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 'clamp(15px, 1.3vw, 17px)',
                        lineHeight: 1.65,
                      }}
                    >
                      {step.body}
                    </p>
                    {step.equation && (
                      <p
                        className="font-serif mt-2"
                        style={{
                          color: step.answer
                            ? 'var(--text-primary)'
                            : 'var(--text-secondary)',
                          fontSize: 'clamp(15px, 1.3vw, 17px)',
                          lineHeight: 1.7,
                          fontWeight: step.answer ? 600 : 400,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {step.equation}
                      </p>
                    )}
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </ScrollReveal>

          {/* Marginalia caption — italic editorial annotation. Names
           *  what just happened without selling it. */}
          <ScrollReveal delay={0.5}>
            <p
              className="font-serif italic mt-6 text-center"
              style={{
                color: 'var(--text-tertiary)',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              ↑ Breaks it into steps, not just the answer.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
