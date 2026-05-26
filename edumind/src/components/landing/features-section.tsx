'use client'

import { BookOpen, Target, TrendingUp } from 'lucide-react'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations'

const features = [
  {
    icon: BookOpen,
    title: 'Concept clarity',
    description:
      'From first principles to exam-level problems. The tutor builds intuition first, then layers in formulas, mechanisms, and shortcuts.',
  },
  {
    icon: Target,
    title: 'Doubts cleared anytime',
    description:
      'Stuck on a Chemistry mechanism at midnight? Ask. The tutor explains, re-explains, and takes follow-ups until it clicks.',
  },
  {
    icon: TrendingUp,
    title: 'Tracks your weak topics',
    description:
      'It remembers which topics give you trouble, then brings them back in quizzes and practice — before they cost you marks.',
  },
]

export function FeaturesSection() {
  return (
    <section className="px-6 mt-[100px]">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <span className="label-text">WHAT YOU GET</span>
          <h2
            className="font-serif text-[26px] font-medium mt-3 text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            Personal tutoring, exam-focused.
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-3 gap-5 mt-10" stagger={0.07}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div
                className="notebook-panel p-7 h-full group transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md"
              >
                <feature.icon
                  size={20}
                  style={{ color: 'var(--accent)' }}
                />
                <h3
                  className="font-sans text-[17px] font-semibold mt-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="font-serif text-[15px] mt-2"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
                >
                  {feature.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
