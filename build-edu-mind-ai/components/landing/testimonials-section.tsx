'use client'

import { StaggerContainer, StaggerItem } from '@/components/animations'

const testimonials = [
  {
    quote:
      'EduMind explained integration in a way no teacher ever could. I finally get calculus.',
    author: 'Priya Mehta',
    role: 'Medical Student',
  },
  {
    quote:
      "I've used every app. Nothing adapts to me the way EduMind does. It knows when I'm stuck.",
    author: 'James Lin',
    role: 'Law Student',
  },
  {
    quote:
      "Found gaps I didn't know I had. 22-point exam improvement in four weeks.",
    author: 'Anika Rao',
    role: 'Engineering, Toronto',
  },
]

export function TestimonialsSection() {
  return (
    <section className="px-6 mt-[100px]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <span className="label-text">STUDENT VOICES</span>
          <h2
            className="font-serif text-[26px] font-medium mt-3"
            style={{ color: 'var(--text-primary)' }}
          >
            In their own words.
          </h2>
        </div>

        <StaggerContainer className="grid md:grid-cols-3 gap-5 mt-10" staggerDelay={0.07}>
          {testimonials.map((t) => (
            <StaggerItem key={t.author}>
              <div
                className="notebook-panel p-7 h-full transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md relative"
              >
                {/* Opening quote */}
                <span
                  className="font-serif text-[60px] absolute top-2 left-4 leading-none select-none"
                  style={{ color: 'var(--accent-light)' }}
                  aria-hidden="true"
                >
                  {'\u201C'}
                </span>
                <p
                  className="font-serif text-[16px] italic mt-6 relative z-10"
                  style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}
                >
                  {t.quote}
                </p>
                <p
                  className="font-sans text-[14px] font-semibold mt-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {'\u2014 '}{t.author}
                </p>
                <p
                  className="font-sans text-[13px] mt-[2px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t.role}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
