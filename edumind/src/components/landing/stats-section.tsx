'use client'

import { CountUp, ScrollReveal } from '@/components/animations'

export function StatsSection() {
  const stats = [
    { value: 12842, label: 'Active Learners' },
    { value: 94, label: 'Exam Improvement', suffix: '%' },
    { value: 4.9, label: 'Average Rating', display: '4.9 / 5' },
  ]

  return (
    <section className="px-6">
      <div className="max-w-3xl mx-auto">
        <hr className="ruled-line" />
        <ScrollReveal>
          <div className="flex items-center justify-center py-10 gap-0">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                {i > 0 && (
                  <div
                    className="h-12 mx-8 md:mx-12"
                    style={{ borderLeft: '1px solid var(--border)' }}
                  />
                )}
                <div className="text-center">
                  <div className="font-serif text-[36px] md:text-[44px]" style={{ color: 'var(--accent)' }}>
                    {stat.display ? (
                      stat.display
                    ) : (
                      <CountUp value={stat.value} suffix={stat.suffix || ''} />
                    )}
                  </div>
                  <div className="font-sans text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
