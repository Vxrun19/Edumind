'use client'

import { StaggerContainer, StaggerItem } from '@/components/animations'

const testimonials = [
  {
    quote:
      'I failed calculus twice. With EduMind I passed with a B+ in one semester. It actually explains WHY, not just how.',
    author: 'Priya M.',
    role: 'Pre-med student, University of Toronto',
  },
  {
    quote:
      "I studied for the bar exam using EduMind for 3 months. It found gaps in my knowledge I didn't know existed. Passed first attempt.",
    author: 'James L.',
    role: 'Law graduate, New York',
  },
  {
    quote:
      'As a non-native English speaker, having an AI that adjusts to my level and never makes me feel stupid changed everything.',
    author: 'Anika R.',
    role: 'Engineering student, Berlin',
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
                {/* Stars */}
                <div className="flex gap-0.5 mb-2" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[16px]" style={{ color: 'var(--accent)' }}>
                      {'\u2605'}
                    </span>
                  ))}
                </div>
                {/* Opening quote */}
                <span
                  className="font-serif text-[60px] absolute top-2 left-4 leading-none select-none"
                  style={{ color: 'var(--accent-light)' }}
                  aria-hidden="true"
                >
                  {'\u201C'}
                </span>
                <p
                  className="font-serif text-[16px] italic mt-3 relative z-10"
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
