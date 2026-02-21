'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations'

const easing = [0.16, 1, 0.3, 1] as const

const tabs = ['All', 'AI & Tech', 'Science', 'Philosophy', 'Business', 'Mathematics']

interface Topic {
  id: string
  category: string
  title: string
  description: string
  trend: string
  trendLabel: string
  tab: string
}

const heroTopic = {
  title: 'The Mathematics of Artificial Intelligence',
  description:
    'Machine learning is founded on linear algebra, calculus, and probability. Understanding the math behind AI systems unlocks not just how they work, but why they work \u2014 and where they fail.',
}

const topics: Topic[] = [
  {
    id: '1',
    category: 'Philosophy',
    title: 'Stoicism in Modern Life',
    description: 'Ancient wisdom applied to contemporary challenges of focus, resilience, and purpose.',
    trend: '\uD83D\uDE80',
    trendLabel: 'Rising',
    tab: 'Philosophy',
  },
  {
    id: '2',
    category: 'Science',
    title: 'Black Hole Thermodynamics',
    description: 'Hawking radiation and the information paradox at the frontier of theoretical physics.',
    trend: '\u26A1',
    trendLabel: 'New',
    tab: 'Science',
  },
  {
    id: '3',
    category: 'Psychology',
    title: 'The Science of Deep Work',
    description: "Cal Newport\u2019s framework for achieving peak intellectual performance through deliberate focus.",
    trend: '\uD83D\uDD25',
    trendLabel: 'Trending',
    tab: 'All',
  },
  {
    id: '4',
    category: 'Technology',
    title: 'Quantum Computing Basics',
    description: 'Qubits, superposition, and the implications for computation and cryptography.',
    trend: '\uD83D\uDE80',
    trendLabel: 'Rising',
    tab: 'AI & Tech',
  },
  {
    id: '5',
    category: 'Philosophy',
    title: 'Philosophy of Language',
    description: 'How words shape thought \u2014 from Wittgenstein to modern cognitive linguistics.',
    trend: '\u26A1',
    trendLabel: 'New',
    tab: 'Philosophy',
  },
  {
    id: '6',
    category: 'Finance',
    title: 'Options Trading Mathematics',
    description: 'The Black-Scholes model and probability theory underlying derivatives pricing.',
    trend: '\uD83D\uDD25',
    trendLabel: 'Trending',
    tab: 'Business',
  },
]

const interestTags = ['Entropy', 'Calculus', 'Algorithms', 'Philosophy', 'Thermodynamics']

function TopicRow({ topic }: { topic: Topic }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex items-start py-5 cursor-pointer rounded-lg transition-all duration-150"
      style={{
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--accent-subtle)' : 'transparent',
        paddingLeft: hovered ? 12 : 0,
        paddingRight: hovered ? 12 : 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="label-text flex-shrink-0 mt-1"
        style={{ width: 100 }}
      >
        {topic.category}
      </span>
      <div className="flex-1 min-w-0 mx-4">
        <p className="font-serif text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {topic.title}
        </p>
        <p
          className="font-serif text-[14px] mt-1 leading-relaxed line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {topic.description}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span
          className="font-sans text-[11px] font-medium px-[10px] py-[3px] rounded-full"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
        >
          {topic.trend} {topic.trendLabel}
        </span>
        <span className="font-sans text-[13px]" style={{ color: 'var(--accent)' }}>
          {'Learn \u2192'}
        </span>
      </div>
    </div>
  )
}

function TrendingRightPanel() {
  return (
    <>
      <span className="label-text">YOUR INTERESTS</span>
      <hr className="ruled-line mt-2 mb-3" />
      <div className="flex flex-wrap gap-2">
        {interestTags.map((tag) => (
          <span
            key={tag}
            className="font-sans text-[12px] px-[10px] py-1 rounded-full cursor-pointer transition-all duration-150"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      <hr className="ruled-line my-5" />

      <span className="label-text">SUGGESTED FOR YOU</span>
      <hr className="ruled-line mt-2 mb-3" />

      {[
        { title: 'Neural Network Architecture', category: 'AI & Tech' },
        { title: 'Game Theory Fundamentals', category: 'Mathematics' },
      ].map((item) => (
        <div
          key={item.title}
          className="py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="font-serif text-[14px]" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </p>
          <p className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            {item.category}
          </p>
          <Link
            href="/chat"
            className="font-sans text-[13px] inline-block mt-1"
            style={{ color: 'var(--accent)' }}
          >
            {'Explore \u2192'}
          </Link>
        </div>
      ))}
    </>
  )
}

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [modalTopic, setModalTopic] = useState<Topic | null>(null)

  const filteredTopics =
    activeTab === 'All'
      ? topics
      : topics.filter((t) => t.tab === activeTab || t.category === activeTab)

  return (
    <AcademicLayout rightPanel={<TrendingRightPanel />} pageNumber="Page 08">
      <span className="label-text">THE INTELLECTUAL PULSE</span>
      <h1
        className="font-serif text-[32px] md:text-[38px] font-normal mt-1"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
      >
        What scholars are learning.
      </h1>
      <p
        className="font-serif text-[16px] mt-3 italic leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Curated topics gaining momentum {'\u2014'} updated every 24 hours.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-0 mt-5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-sans text-[14px] font-medium pb-2 px-3 transition-all duration-150 whitespace-nowrap"
            style={{
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom:
                activeTab === tab
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <hr className="ruled-line mt-0 mb-6" />

      {/* Hero Topic */}
      <ScrollReveal>
        <div
          className="notebook-panel p-6 md:p-9"
          style={{ borderLeftWidth: 4 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="label-text">MOST DISCUSSED THIS WEEK</span>
            <span
              className="font-sans text-[11px] font-medium px-[10px] py-[3px] rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {'\uD83D\uDD25'} Trending
            </span>
          </div>
          <h2
            className="font-serif text-[24px] md:text-[28px] font-normal"
            style={{ color: 'var(--text-primary)' }}
          >
            {heroTopic.title}
          </h2>
          <p
            className="font-serif text-[16px] mt-3 leading-[1.7]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {heroTopic.description}
          </p>
          <div className="flex items-center justify-between mt-5">
            <span className="font-sans text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              Updated today
            </span>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center px-6 py-[11px] rounded-lg font-sans text-[14px] font-medium transition-all duration-[180ms]"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {'Begin studying \u2192'}
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Topic list */}
      <div className="mt-5">
        <StaggerContainer staggerDelay={0.06}>
          {filteredTopics.map((topic) => (
            <StaggerItem key={topic.id}>
              <TopicRow topic={topic} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {filteredTopics.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-[18px]" style={{ color: 'var(--text-secondary)' }}>
              No topics in this category yet.
            </p>
            <p className="font-serif text-[14px] mt-2 italic" style={{ color: 'var(--text-tertiary)' }}>
              Check back soon for new content.
            </p>
          </div>
        )}
      </div>

      {/* Quick Summary Modal */}
      <AnimatePresence>
        {modalTopic && (
          <>
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(249,247,243,0.85)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalTopic(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: easing }}
            >
              <div
                className="notebook-panel max-w-[480px] w-full p-9 relative"
                style={{ boxShadow: '0 8px 32px rgba(26,23,20,0.12)' }}
              >
                <button
                  className="absolute top-4 right-4 p-1"
                  onClick={() => setModalTopic(null)}
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={18} />
                </button>
                <h3 className="font-serif text-[22px]" style={{ color: 'var(--text-primary)' }}>
                  {modalTopic.title}
                </h3>
                <hr className="ruled-line my-4" />
                <p
                  className="font-serif text-[15px] leading-[1.7]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {modalTopic.description}
                </p>
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center mt-6 px-6 py-[11px] rounded-lg font-sans text-[14px] font-medium w-full text-center transition-all duration-[180ms]"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  {'Start learning \u2192'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AcademicLayout>
  )
}
