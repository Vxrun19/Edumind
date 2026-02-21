'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Atom,
  PenLine,
  Sigma,
  Landmark,
  Dna,
  Brain,
  Code2,
  BookOpen,
  Search,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const easing = [0.16, 1, 0.3, 1] as const

interface Conversation {
  id: string
  icon: typeof Atom
  title: string
  subject: string
  time: string
}

const conversations: Record<string, Conversation[]> = {
  TODAY: [
    { id: '1', icon: Atom, title: 'Entropy and Thermodynamics', subject: 'Physics', time: '2h ago' },
    { id: '2', icon: PenLine, title: 'Essay Planning: Modernism', subject: 'English', time: '5h ago' },
  ],
  YESTERDAY: [
    { id: '3', icon: Sigma, title: 'Integration by Parts', subject: 'Mathematics', time: '' },
    { id: '4', icon: Landmark, title: 'French Revolution Overview', subject: 'History', time: '' },
  ],
  'THIS WEEK': [
    { id: '5', icon: Dna, title: 'DNA Replication Explained', subject: 'Biology', time: '3d ago' },
    { id: '6', icon: Brain, title: 'Philosophy of Consciousness', subject: 'Philosophy', time: '4d ago' },
    { id: '7', icon: Code2, title: 'Binary Search Trees', subject: 'Coding', time: '5d ago' },
  ],
}

const barData = [
  { day: 'Mon', count: 3 },
  { day: 'Tue', count: 2 },
  { day: 'Wed', count: 4 },
  { day: 'Thu', count: 1 },
  { day: 'Fri', count: 2 },
  { day: 'Sat', count: 0 },
  { day: 'Sun', count: 1 },
]
const maxBar = Math.max(...barData.map((b) => b.count))

function ConversationRow({ conv }: { conv: Conversation }) {
  const [hovered, setHovered] = useState(false)
  const Icon = conv.icon

  return (
    <div
      className="flex items-center py-4 cursor-pointer rounded-lg transition-all duration-150"
      style={{
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--accent-subtle)' : 'transparent',
        paddingLeft: hovered ? 8 : 0,
        paddingRight: hovered ? 8 : 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0 ml-3">
        <p className="font-serif text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>
          {conv.title}
        </p>
        <p className="font-sans text-[12px] mt-[2px]" style={{ color: 'var(--text-tertiary)' }}>
          {conv.subject}
          {conv.time && ` \u00B7 ${conv.time}`}
        </p>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            className="flex items-center gap-3 flex-shrink-0 ml-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="flex items-center gap-1 font-sans text-[12px] transition-opacity"
              style={{ color: 'var(--error)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <ChevronRight size={14} style={{ color: 'var(--accent)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HistoryRightPanel() {
  return (
    <>
      <span className="label-text">THIS WEEK</span>
      <hr className="ruled-line mt-2 mb-3" />
      <p className="font-serif text-[22px]" style={{ color: 'var(--accent)' }}>
        7 conversations
      </p>
      <p className="font-sans text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
        across 3 subjects
      </p>

      {/* Weekly bar chart */}
      <div className="flex items-end gap-[6px] mt-4" style={{ height: 76 }}>
        {barData.map((bar) => (
          <div key={bar.day} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-6 rounded-sm transition-colors duration-150"
              style={{
                background: 'var(--accent-light)',
                minHeight: bar.count > 0 ? 4 : 0,
              }}
              initial={{ height: 0 }}
              animate={{ height: maxBar > 0 ? (bar.count / maxBar) * 60 : 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              whileHover={{ background: 'var(--accent)' }}
            />
            <span className="font-sans text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {bar.day}
            </span>
          </div>
        ))}
      </div>

      <hr className="ruled-line my-5" />

      <span className="label-text">MOST STUDIED</span>
      <p className="font-sans text-[13px] mt-2" style={{ color: 'var(--text-secondary)' }}>
        Mathematics {'\u00B7'} 3 sessions
      </p>
      <div className="mt-2 h-1 rounded-full" style={{ background: 'var(--bg-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          initial={{ width: '0%' }}
          animate={{ width: '60%' }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </>
  )
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = Object.entries(conversations).reduce(
    (acc, [group, convs]) => {
      const filtered = convs.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (filtered.length > 0) acc[group] = filtered
      return acc
    },
    {} as Record<string, Conversation[]>
  )

  const hasResults = Object.keys(filteredConversations).length > 0

  return (
    <AcademicLayout rightPanel={<HistoryRightPanel />} pageNumber="Page 07">
      <span className="label-text">ARCHIVE</span>
      <h1
        className="font-serif text-[32px] md:text-[38px] font-normal mt-1"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
      >
        Conversation History.
      </h1>

      {/* Search */}
      <div className="relative mt-5">
        <Search
          size={16}
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="typewriter-input pl-6"
          placeholder="Search your sessions..."
          style={{ fontStyle: 'italic' }}
        />
      </div>

      <hr className="ruled-line mt-6 mb-2" />

      {hasResults ? (
        <StaggerContainer staggerDelay={0.04}>
          {Object.entries(filteredConversations).map(([group, convs]) => (
            <StaggerItem key={group}>
              <div className="mt-6 mb-2">
                <span className="label-text">{group}</span>
                <hr className="ruled-line mt-2" />
              </div>
              {convs.map((conv) => (
                <ConversationRow key={conv.id} conv={conv} />
              ))}
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center pt-20">
          <BookOpen size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto' }} />
          <p
            className="font-serif text-[22px] mt-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {searchQuery ? 'No matching sessions.' : 'No conversations yet.'}
          </p>
          <p
            className="font-serif text-[15px] mt-2 italic"
            style={{ color: 'var(--text-secondary)' }}
          >
            {searchQuery
              ? 'Try a different search term.'
              : 'Begin a chat to start your record.'}
          </p>
          {!searchQuery && (
            <Link
              href="/chat"
              className="inline-flex items-center justify-center mt-5 px-6 py-[11px] rounded-lg font-sans text-[14px] font-medium transition-all duration-[180ms]"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              {'Start learning \u2192'}
            </Link>
          )}
        </div>
      )}
    </AcademicLayout>
  )
}
