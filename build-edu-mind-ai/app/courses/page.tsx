'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ChevronRight } from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import { StaggerContainer, StaggerItem } from '@/components/animations'
import Link from 'next/link'

const easing = [0.16, 1, 0.3, 1]

const tabs = ['All', 'Free', 'Pro', 'In Progress']

const courses = [
  { subject: 'Mathematics', title: 'Advanced Algebra', tier: 'Free', desc: 'Polynomials, equations, and functions for the rigorous student.', progress: 0 },
  { subject: 'History', title: 'Modern World History', tier: 'Free', desc: 'Industrial Revolution to contemporary geopolitics.', progress: 34 },
  { subject: 'Science', title: 'Organic Chemistry', tier: 'Pro', desc: 'Reaction mechanisms and molecular theory.', progress: 0 },
  { subject: 'Philosophy', title: 'Philosophy of Mind', tier: 'Pro', desc: 'Consciousness, cognition, nature of thought.', progress: 0 },
  { subject: 'Coding', title: 'Data Structures & Algorithms', tier: 'Free', desc: 'Arrays, trees, graphs, complexity.', progress: 68 },
  { subject: 'Physics', title: 'Classical Mechanics', tier: 'Pro', desc: "Newton's laws to Lagrangian dynamics.", progress: 0 },
]

function ProgressBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="w-full h-[3px] rounded-full" style={{ background: 'var(--bg-muted)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'var(--accent)' }}
        initial={{ width: '0%' }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay }}
      />
    </div>
  )
}

function CoursesRightPanel() {
  return (
    <>
      <span className="label-text">RECENTLY VIEWED</span>
      <hr className="ruled-line mt-2 mb-3" />
      {[
        { title: 'Binary Trees', course: 'Data Structures', time: '2h ago' },
        { title: 'Wave Mechanics', course: 'Classical Mechanics', time: 'Yesterday' },
        { title: 'WWII Europe', course: 'Modern World History', time: '3d ago' },
      ].map((item) => (
        <div
          key={item.title}
          className="py-[10px] cursor-pointer group"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="font-serif text-[13px]" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </p>
          <p className="font-sans text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {item.course} {'\u00B7'} {item.time}
          </p>
        </div>
      ))}

      <span className="label-text mt-5 block">SUGGESTED</span>
      <hr className="ruled-line mt-2 mb-3" />
      <div>
        <p className="font-serif text-[14px]" style={{ color: 'var(--text-primary)' }}>
          Personal Finance 101 {'\u00B7'} Free
        </p>
        <p className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          Based on your conversations
        </p>
        <Link
          href="#"
          className="font-sans text-[13px] mt-1 inline-block"
          style={{ color: 'var(--accent)' }}
        >
          {'Browse \u2192'}
        </Link>
      </div>
    </>
  )
}

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const filteredCourses = courses.filter((c) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Free') return c.tier === 'Free'
    if (activeTab === 'Pro') return c.tier === 'Pro'
    if (activeTab === 'In Progress') return c.progress > 0
    return true
  })

  return (
    <AcademicLayout rightPanel={<CoursesRightPanel />} pageNumber="Page 05">
      <span className="label-text">LEARNING PATHS</span>
      <h1
        className="font-serif text-[32px] md:text-[38px] font-normal mt-1"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
      >
        The Curriculum.
      </h1>
      <hr className="ruled-line mt-4" />
      <p className="font-serif text-[16px] italic mt-3" style={{ color: 'var(--text-secondary)' }}>
        Structured courses from beginner to mastery across disciplines.
      </p>

      {/* Tabs */}
      <div className="flex gap-6 mt-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="pb-3 font-sans text-[14px] font-medium transition-all duration-200 cursor-pointer relative"
            style={{
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Course list */}
      <StaggerContainer className="mt-8" staggerDelay={0.06}>
        {filteredCourses.map((course, i) => {
          const isExpanded = expandedIdx === i
          const isPro = course.tier === 'Pro'
          return (
            <StaggerItem key={course.title}>
              <div
                className="py-5 cursor-pointer transition-all duration-150 rounded-lg"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: isExpanded ? 'var(--accent-subtle)' : 'transparent',
                }}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="label-text w-20 flex-shrink-0 pt-[3px]"
                    style={{ fontSize: 11 }}
                  >
                    {course.subject.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {course.title}
                    </p>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p
                            className="font-serif text-[14px] mt-1"
                            style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
                          >
                            {course.desc}
                          </p>
                          {course.progress > 0 && (
                            <div className="mt-3 max-w-[300px]">
                              <ProgressBar value={course.progress} delay={0.1} />
                              <p className="font-sans text-[12px] mt-[6px]" style={{ color: 'var(--text-tertiary)' }}>
                                {course.progress}% complete {'\u00B7'} {Math.ceil((100 - course.progress) / 15)} lessons remaining
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="font-sans text-[11px] font-medium px-2 py-[2px] rounded-full"
                      style={{
                        background: isPro ? 'var(--accent-light)' : 'var(--bg-muted)',
                        color: isPro ? 'var(--accent)' : 'var(--text-tertiary)',
                      }}
                    >
                      {course.tier}
                    </span>
                    {isPro ? (
                      <div className="text-right">
                        <Lock size={14} style={{ color: 'var(--text-tertiary)' }} />
                        <p className="font-sans text-[12px] mt-1" style={{ color: 'var(--accent)' }}>
                          Upgrade
                        </p>
                      </div>
                    ) : (
                      <Link
                        href="/chat"
                        className="font-sans text-[13px]"
                        style={{ color: 'var(--accent)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {course.progress > 0 ? 'Continue \u2192' : 'Begin \u2192'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </AcademicLayout>
  )
}
