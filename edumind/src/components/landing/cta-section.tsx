'use client'

import Link from 'next/link'
import { ScrollReveal } from '@/components/animations'

// The closing conversion moment. After seven light sections, this is
// the one DARK band on the page — a deep violet→blue ground with a
// subtle ambient halo. The dark itself is the punctuation; the headline
// + microcopy + button cascade on scroll.
export function CTASection() {
  return (
    <section
      className="relative w-full px-6 py-28 md:py-36 overflow-hidden"
      style={{
        // Layered background:
        //   1. Linear from deep indigo to deep blue — the "night sky"
        //      ground; rich, not flat black.
        //   2. (As an overlay div below) a soft violet halo from the
        //      top center, like an ambient stage light.
        background: 'linear-gradient(180deg, #14122E 0%, #0B1330 100%)',
      }}
      aria-labelledby="cta-heading"
    >
      {/* Ambient radial glow. Sits above the linear ground, below the
       *  content. Pointer-events-none so it never blocks the CTA. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(139, 92, 246, 0.22), transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Headline — confident serif, pure white. Smaller than the
         *  hero's 140px ceiling so the hierarchy reads hero → close. */}
        <ScrollReveal y={20}>
          <h2
            id="cta-heading"
            className="font-serif font-normal mx-auto"
            style={{
              color: '#FFFFFF',
              fontSize: 'clamp(36px, 5vw, 72px)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '18ch',
            }}
          >
            Start your JEE or NEET prep today.
          </h2>
        </ScrollReveal>

        {/* Honest microcopy — preserved verbatim. White at 65% opacity
         *  reads as quiet on the dark ground while staying well above
         *  AA contrast (≈11:1 on #14122E). */}
        <ScrollReveal delay={0.15} y={12}>
          <p
            className="font-serif mt-5 md:mt-6 mx-auto"
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: 'clamp(15px, 1.3vw, 17px)',
              lineHeight: 1.6,
              maxWidth: '48ch',
            }}
          >
            Free to start. No credit card. Cancel anytime.
          </p>
        </ScrollReveal>

        {/* Primary CTA — the brand .btn-primary (violet→blue gradient
         *  pill with glow). On this dark ground the glow becomes much
         *  more visible than it is in the light sections — the button
         *  reads as the obvious next step. Slight inline bump to font
         *  size and padding makes the closing CTA visually heavier
         *  than the inline CTAs earlier on the page. */}
        <ScrollReveal delay={0.3} y={14}>
          <Link
            href="/dashboard"
            className="btn-primary inline-block mt-9 md:mt-10"
            style={{
              fontSize: '16px',
              padding: '14px 28px',
            }}
          >
            Start learning free →
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
