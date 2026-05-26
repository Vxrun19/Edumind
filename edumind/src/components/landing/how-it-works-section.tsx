'use client'

import { User, ClipboardList, MessageSquare } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const steps = [
  {
    num: '01',
    icon: User,
    title: 'Pick your track',
    desc: 'Tell us if you are prepping for JEE or NEET, and where you are in your prep.',
  },
  {
    num: '02',
    icon: ClipboardList,
    title: 'Find your weak topics',
    desc: 'A quick assessment shows where you are confident and where you need more time.',
  },
  {
    num: '03',
    icon: MessageSquare,
    title: 'Start solving exam-style problems',
    desc: 'Ask the tutor anything. Get step-by-step explanations and practice questions for your syllabus.',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-6 mt-[100px] py-20"
      style={{ background: 'var(--bg-muted)' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <span className="label-text">THE PROCESS</span>
        <h2
          className="font-serif text-[26px] font-medium mt-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {"Three steps. That's it."}
        </h2>

        <StaggerContainer className="grid md:grid-cols-3 gap-8 mt-12 relative" staggerDelay={0.1}>
          {steps.map((step, i) => (
            <StaggerItem key={step.num}>
              <div className="flex flex-col items-center text-center relative">
                {/* Dashed connecting line */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-5 left-[calc(50%+28px)] right-[calc(-50%+28px)]"
                    style={{
                      borderTop: '1px dashed var(--border-strong)',
                    }}
                  />
                )}
                {/* Number circle */}
                <div
                  className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-muted)' }}
                >
                  <span className="font-serif text-[18px]" style={{ color: 'var(--accent)' }}>
                    {step.num}
                  </span>
                </div>
                <step.icon
                  size={20}
                  className="mt-4"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <h3
                  className="font-sans text-[17px] font-semibold mt-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="font-serif text-[15px] mt-2 max-w-[200px]"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
                >
                  {step.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
