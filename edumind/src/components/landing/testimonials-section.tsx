'use client'

import { GitFork, ListChecks, BarChart3 } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const reasons = [
  {
    icon: GitFork,
    title: 'Two clear tracks',
    description:
      'JEE (Physics + Chemistry + Maths) or NEET (Physics + Chemistry + Biology). Pick yours — the tutor knows your syllabus and stays focused on what is on the exam.',
  },
  {
    icon: ListChecks,
    title: 'Step-by-step teaching',
    description:
      'Concepts broken into clear steps with worked examples. Ask follow-ups until it clicks — no rushing, no judgement, whether it is exam season or 2am.',
  },
  {
    icon: BarChart3,
    title: 'Quizzes and weak-topic tracking',
    description:
      'Practice questions aligned to JEE and NEET patterns. The tutor remembers which topics give you trouble and helps you revisit them before they cost you marks.',
  },
]

export function TestimonialsSection() {
  return (
    <section className="px-6 mt-[100px]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <span className="label-text">WHY EDUMIND</span>
          <h2
            className="font-serif text-[26px] font-medium mt-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Built for JEE &amp; NEET aspirants.
          </h2>
        </div>

        <StaggerContainer className="grid md:grid-cols-3 gap-5 mt-10" staggerDelay={0.07}>
          {reasons.map((reason) => (
            <StaggerItem key={reason.title}>
              <div
                className="notebook-panel p-7 h-full transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md"
              >
                <reason.icon
                  size={20}
                  style={{ color: 'var(--accent)' }}
                />
                <h3
                  className="font-sans text-[17px] font-semibold mt-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {reason.title}
                </h3>
                <p
                  className="font-serif text-[15px] mt-2"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
                >
                  {reason.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
