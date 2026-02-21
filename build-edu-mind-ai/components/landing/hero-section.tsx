'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FadeUp } from '@/components/animations'

const easing = [0.16, 1, 0.3, 1]

export function HeroSection() {
  return (
    <section className="pt-[120px] pb-20 px-6 text-center" style={{ background: 'var(--bg-base)' }}>
      {/* Label */}
      <FadeUp delay={0}>
        <span
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] inline-block"
          style={{ color: 'var(--accent)' }}
        >
          PRIVATE AI TUTORING
        </span>
      </FadeUp>

      {/* H1 */}
      <FadeUp delay={0.1}>
        <h1
          className="font-serif text-[42px] md:text-[60px] font-normal mx-auto mt-5 max-w-[660px]"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}
        >
          Learn anything.
          <br />
          <span className="relative inline-block">
            Actually understand it.
            <motion.span
              className="absolute bottom-[2px] left-0 h-[2px] w-full origin-left"
              style={{ background: 'var(--accent)', opacity: 0.5 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: easing }}
            />
          </span>
        </h1>
      </FadeUp>

      {/* Subtitle */}
      <FadeUp delay={0.25}>
        <p
          className="font-serif text-[17px] mx-auto mt-5 max-w-[420px]"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          Your personal AI tutor that adapts to how you think. Any subject, any pace, no judgment.
        </p>
      </FadeUp>

      {/* Buttons */}
      <FadeUp delay={0.35}>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/dashboard"
            className="font-sans text-[14px] font-medium px-6 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.97]"
            style={{ background: 'var(--accent)', letterSpacing: '0.01em' }}
          >
            {'Start learning free \u2192'}
          </Link>
          <a
            href="#how-it-works"
            className="font-sans text-[14px] px-5 py-[11px] rounded-lg transition-all duration-200"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
          >
            See how it works
          </a>
        </div>
      </FadeUp>

      {/* Trust line */}
      <FadeUp delay={0.45}>
        <div className="flex items-center justify-center mt-4 gap-2">
          <div className="flex -space-x-2">
            {[
              'linear-gradient(135deg, #C9A96E, #8B7038)',
              'linear-gradient(135deg, #A6836B, #7C5C4A)',
              'linear-gradient(135deg, #D4B896, #A88E6C)',
              'linear-gradient(135deg, #B8956C, #8D6B42)',
              'linear-gradient(135deg, #C2A878, #967C4E)',
            ].map((bg, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2"
                style={{ background: bg, borderColor: 'var(--bg-base)' }}
              />
            ))}
          </div>
          <span className="font-sans text-[13px] ml-2" style={{ color: 'var(--text-tertiary)' }}>
            Trusted by 12,000+ learners
          </span>
        </div>
      </FadeUp>
    </section>
  )
}
