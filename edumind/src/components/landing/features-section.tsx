'use client'

import { BookOpen, Target, TrendingUp } from 'lucide-react'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations'

const features = [
  {
    icon: BookOpen,
    title: 'Adaptive AI Tutor',
    description:
      'Learns how you think. Adapts explanations to match your style. Gets better every session.',
  },
  {
    icon: Target,
    title: 'Precision Quizzes',
    description:
      'AI-generated questions that target exactly where your knowledge has gaps.',
  },
  {
    icon: TrendingUp,
    title: 'Visible Progress',
    description:
      'Streaks, mastery levels, and session history that make growth feel real and motivating.',
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
            Scholarship, made personal.
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-3 gap-5 mt-10" staggerDelay={0.07}>
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
