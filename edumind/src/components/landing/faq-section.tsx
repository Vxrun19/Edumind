'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScrollReveal } from '@/components/animations'

const faqs = [
  {
    q: 'Is it really free to start?',
    a: 'Yes. No credit card required. Free plan includes 20 AI messages per day, 3 quizzes, and 3 full courses. Upgrade anytime if you want more.',
  },
  {
    q: 'What subjects can I learn?',
    a: 'Anything. Our AI tutor covers mathematics, sciences, humanities, law, medicine, computer science, languages, and more. If you can ask a question about it, EduMind can teach it.',
  },
  {
    q: 'How is this different from ChatGPT?',
    a: "EduMind is built specifically for learning. It remembers your knowledge gaps, tracks your progress, generates targeted quizzes, and adapts to your learning style over time. ChatGPT just answers questions. EduMind teaches.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel with one click, no questions asked. You keep access until the end of your billing period.',
  },
  {
    q: 'Does it work for university-level content?',
    a: 'Yes. Many of our users are university students, grad students, and professionals. The AI adjusts its depth and complexity to your level automatically.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span
          className="font-sans text-[15px] font-medium pr-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {q}
        </span>
        <ChevronDown
          size={18}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-tertiary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? '200px' : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <p
          className="font-sans text-[14px] pb-5 pr-8"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          {a}
        </p>
      </div>
    </div>
  )
}

export function FAQSection() {
  return (
    <section className="px-6 mt-[100px]">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <div className="text-center">
            <span className="label-text">QUESTIONS</span>
            <h2
              className="font-serif text-[26px] font-medium mt-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Answered.
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-10" style={{ borderTop: '1px solid var(--border)' }}>
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
