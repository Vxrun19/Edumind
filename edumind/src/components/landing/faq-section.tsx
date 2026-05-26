'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScrollReveal } from '@/components/animations'

const faqs = [
  {
    q: 'Is it really free to start?',
    a: 'Yes. No credit card required. The free plan includes 20 AI tutor messages per day and 3 quizzes per day, plus access to several full courses. Upgrade anytime if you want more.',
  },
  {
    q: 'Does it cover JEE Advanced as well as JEE Main? And the full NEET syllabus?',
    a: 'The tutor handles concepts and problems across the JEE (Main and Advanced) and NEET (UG) syllabi for Physics, Chemistry, Mathematics, and Biology. Depth scales with what you ask — a definition gets a clear short answer, a tough mechanics problem gets a worked solution step by step.',
  },
  {
    q: 'Is it aligned to NCERT?',
    a: 'The tutor treats NCERT as the foundation — since JEE and NEET both build on it — and goes deeper where the exams demand. It will not restrict answers to NCERT-only when a richer explanation actually helps you understand the concept.',
  },
  {
    q: 'Can I ask questions in Hindi or Hinglish?',
    a: 'Yes. The tutor responds in whichever feels natural to you — English, Hindi, or a mix. Equations and chemical formulas are shown in standard notation either way.',
  },
  {
    q: 'How is this different from ChatGPT?',
    a: 'EduMind is built specifically for JEE and NEET prep. It remembers which topics give you trouble, generates practice questions in the exam pattern, and tracks your progress over time. ChatGPT is general-purpose; EduMind is a tutor for your exam.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel with one click, no questions asked. You keep access until the end of your billing period.',
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
