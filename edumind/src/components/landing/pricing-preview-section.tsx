'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations'

const freeFeatures = [
  '20 AI tutor messages per day',
  '3 quizzes per day',
  'All 4 subjects (PCM + Biology)',
  'Progress tracking',
]

const proFeatures = [
  'Unlimited AI tutor messages',
  'Unlimited quizzes',
  'Voice mode for hands-free study',
  'Full personalization from assessment',
]

export function PricingPreviewSection() {
  return (
    <section className="px-6 mt-[100px]">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center">
            <span className="label-text">PRICING</span>
            <h2
              className="font-serif text-[26px] font-medium mt-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Start free. No catch.
            </h2>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-2 gap-5 mt-10" staggerDelay={0.07}>
          {/* Free */}
          <StaggerItem>
            <div className="notebook-panel p-7 h-full flex flex-col">
              <span
                className="font-sans text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Free
              </span>
              <p
                className="font-serif text-[28px] mt-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Free forever
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
                    <span className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center font-sans text-sm font-semibold px-6 py-3 rounded-xl mt-6 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {'Start free \u2192'}
              </Link>
            </div>
          </StaggerItem>

          {/* Pro */}
          <StaggerItem>
            <div
              className="notebook-panel p-7 h-full flex flex-col relative"
              style={{ border: '2px solid var(--accent)' }}
            >
              <div className="absolute -top-3 right-6">
                <span
                  className="text-[10px] uppercase tracking-[0.1em] font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  Most popular
                </span>
              </div>
              <span
                className="font-sans text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--accent)' }}
              >
                Pro
              </span>
              <p
                className="font-serif text-[28px] mt-2"
                style={{ color: 'var(--text-primary)' }}
              >
                ₹399{' '}
                <span className="text-base" style={{ color: 'var(--text-tertiary)' }}>
                  / month
                </span>
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
                    <span className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center font-sans text-sm font-semibold px-6 py-3 rounded-xl mt-6 text-white transition-all duration-200 hover:-translate-y-[1px] hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                {'Upgrade to Pro \u2192'}
              </Link>
            </div>
          </StaggerItem>
        </StaggerContainer>

        <div className="text-center mt-6">
          <Link
            href="/pricing"
            className="font-sans text-sm transition-colors duration-200 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {'Full pricing details \u2192'}
          </Link>
        </div>
      </div>
    </section>
  )
}
