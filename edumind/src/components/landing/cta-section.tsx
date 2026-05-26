'use client'

import Link from 'next/link'
import { ScrollReveal } from '@/components/animations'

export function CTASection() {
  return (
    <section
      className="px-6 mt-[100px]"
      style={{
        background: 'var(--bg-warm)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <ScrollReveal>
        <div className="max-w-3xl mx-auto py-20 text-center">
          {/* Small ruled ornament */}
          <div
            className="w-12 h-[1px] mx-auto mb-6"
            style={{ background: 'var(--border-accent)' }}
          />

          <h2
            className="font-serif text-[30px] font-normal"
            style={{ color: 'var(--text-primary)' }}
          >
            Start your JEE or NEET prep today.
          </h2>
          <p
            className="font-serif text-[16px] mt-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Free to start. No credit card. Cancel anytime.
          </p>
          <Link
            href="/dashboard"
            className="inline-block font-sans text-[14px] font-medium px-6 py-[11px] rounded-lg text-white mt-7 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.97]"
            style={{ background: 'var(--accent)' }}
          >
            {'Open your notebook \u2192'}
          </Link>
        </div>
      </ScrollReveal>
    </section>
  )
}
