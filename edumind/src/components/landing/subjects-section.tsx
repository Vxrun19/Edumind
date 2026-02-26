'use client'

import { ScrollReveal } from '@/components/animations'

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'History', 'Philosophy', 'Computer Science',
  'Literature', 'Economics', 'Psychology',
  'Law', 'Medicine', 'Languages', 'Music Theory',
]

export function SubjectsSection() {
  return (
    <section className="px-6 mt-16">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <span className="label-text">WHAT YOU CAN LEARN</span>
          <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-3xl mx-auto">
            {subjects.map((subject) => (
              <span
                key={subject}
                className="font-sans text-sm px-4 py-1.5 rounded-full transition-colors duration-200 cursor-default"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {subject}
              </span>
            ))}
          </div>
          <p className="font-sans text-sm mt-4" style={{ color: 'var(--text-tertiary)' }}>
            Any subject. Any level. Any pace.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
