'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import {
  CountUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations'
import DashboardUpgradeCard from '@/components/DashboardUpgradeCard'
import { SUBJECTS } from '@/lib/subjects'
import type {
  Conversation,
  Quiz,
  TrendingTopic,
} from '@/lib/supabase'

interface Suggestion {
  topic: string
  fromSubject: string | null
  fromConversation: string
}

export interface DashboardContentProps {
  timeGreeting: string
  displayName: string
  currentStreak: number
  recentConversations: Conversation[]
  recentQuizzes: (Quiz & { best_score?: number })[]
  trendingTopics: TrendingTopic[]
}

// Lucide icon map for the canonical 4 subjects. Replaces the old
// emoji-prefixed subject indicators in Recent Sessions.
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Dna,
}

// Picks an icon for a conversation's subject. Conversations may have
// freeform subjects ("General", null, "Astronomy") that don't match the
// four canonical ones — those fall back to a neutral chat icon.
function getSubjectIcon(subject: string | null): LucideIcon {
  if (!subject) return MessageSquare
  const canonical = SUBJECTS.find(
    (s) => s.name.toLowerCase() === subject.toLowerCase()
  )?.name
  return canonical ? (SUBJECT_ICONS[canonical] ?? MessageSquare) : MessageSquare
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return `${Math.floor(diffDays / 7)}w ago`
}

/* ─── Right panel (Study Notes) ─────────────────────────────── */

function DashboardRightPanel({
  currentStreak,
  suggestions,
}: {
  currentStreak: number
  suggestions: Suggestion[]
}) {
  const streakDays = Math.min(currentStreak, 7)
  const streakPct = Math.round((streakDays / 7) * 100)

  return (
    <>
      <span className="label">Study notes</span>
      <hr className="ruled-line mt-2 mb-4" />

      {/* Streak summary — no emoji, just text. Number renders
       *  tabular-nums so single-digit and double-digit streaks
       *  align cleanly when the value changes. */}
      <div
        className="font-sans text-[14px] font-semibold"
        style={{
          color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentStreak} day{currentStreak === 1 ? '' : 's'} in a row
      </div>
      <div className="mt-2">
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-muted)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'var(--accent)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${streakPct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
          />
        </div>
      </div>
      <p
        className="font-sans text-[12px] mt-2"
        style={{
          color: 'var(--text-tertiary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {streakDays} of 7 days — keep going
      </p>

      <hr className="ruled-line my-5" />

      {/* Suggestions list — plain links, hover violet. No annotation-
       *  block container; the section label + ruled line above is
       *  enough visual structure on the sidebar surface. */}
      <span className="label">
        {suggestions.length > 0 ? 'Suggested next' : 'AI insight'}
      </span>
      <div className="mt-3">
        {suggestions.length > 0 ? (
          <ul className="space-y-3">
            {suggestions.map((s, i) => (
              <li key={i}>
                <Link
                  href={`/chat?msg=Teach me about ${encodeURIComponent(s.topic)}`}
                  className="block font-serif text-[13px] transition-colors duration-150 text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]"
                  style={{ lineHeight: 1.6 }}
                >
                  {s.topic}
                  {s.fromSubject && (
                    <span
                      className="font-sans text-[11px] ml-1"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      · {s.fromSubject}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="font-serif text-[13px] italic"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
          >
            Start conversations to unlock personalized topic suggestions.
            Try asking: &quot;Teach me about…&quot;
          </p>
        )}
      </div>
    </>
  )
}

/* ─── Main content ─────────────────────────────────────────── */

export function DashboardContent({
  timeGreeting,
  displayName,
  currentStreak,
  recentConversations,
  recentQuizzes,
  trendingTopics,
}: DashboardContentProps) {
  const today = new Date()
  const dayName = today
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase()
  const dateStr = today
    .toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  // Best recent quiz to surface as "review topic" target. Below 80 = weak.
  const weakQuiz = recentQuizzes.find(
    (q) => q.best_score !== undefined && q.best_score < 80
  )

  const hasConversations = recentConversations.length > 0
  const focusTitle = hasConversations
    ? recentConversations[0].title
    : 'Start your first session'

  return (
    <>
      {/* ─── Greeting ───────────────────────────────────────── */}
      <div>
        <span className="label">
          {dayName}, {dateStr}
        </span>
        <h1
          className="font-serif font-normal mt-2"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
          }}
        >
          {timeGreeting}, {displayName}.
        </h1>
        <p
          className="font-sans text-[14px] mt-2"
          style={{
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hasConversations
            ? `You have ${recentConversations.length} recent conversation${recentConversations.length !== 1 ? 's' : ''}.`
            : 'Start a conversation to begin learning.'}
        </p>
      </div>

      {/* ─── Today's Focus (HERO) ───────────────────────────────
       *  The day's primary action — visually heaviest card on the
       *  page so the eye lands here first. Soft elevation
       *  (--shadow-md) + generous padding + .btn-primary CTA.       */}
      <div
        className="mt-8 md:mt-10 p-7 md:p-9"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <span className="label">Today&apos;s focus</span>
        <h2
          className="font-serif font-normal mt-3"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {focusTitle}
        </h2>
        {hasConversations && (
          <p
            className="font-sans text-[13px] mt-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {recentConversations[0].subject ?? 'General'} ·{' '}
            {relativeTime(recentConversations[0].updated_at)}
          </p>
        )}
        <Link
          href="/chat"
          className="btn-primary inline-block mt-6"
          style={{ fontSize: 14, padding: '11px 22px' }}
        >
          {hasConversations ? 'Continue studying →' : 'Start studying →'}
        </Link>
      </div>

      {/* ─── Streak + Recommended (secondary, two-column) ─────
       *  Same surface as the hero but quieter elevation
       *  (--shadow-xs) and tighter padding — they support the
       *  hero, they don't compete with it. */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {/* Streak */}
        <div
          className="p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span className="label">Study streak</span>
          <div
            className="mt-2 font-serif"
            style={{
              color: 'var(--accent)',
              fontSize: 52,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <CountUp value={currentStreak} />
          </div>
          <p
            className="font-sans text-[14px] mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            day{currentStreak === 1 ? '' : 's'} in a row
          </p>
          {/* 7-dot week marker — the most-recently-filled dot keeps
           *  a slow pulse as an earned-delight cue. */}
          <div className="flex gap-[6px] mt-4">
            {Array.from({ length: 7 }).map((_, i) => {
              const filled = i < Math.min(currentStreak, 7)
              const isLast =
                i === Math.min(currentStreak, 7) - 1 && currentStreak > 0
              return (
                <motion.div
                  key={i}
                  className="w-[10px] h-[10px] rounded-full"
                  style={{
                    background: filled ? 'var(--accent)' : 'var(--bg-muted)',
                  }}
                  animate={isLast ? { scale: [1, 1.15, 1] } : {}}
                  transition={
                    isLast
                      ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                      : {}
                  }
                />
              )
            })}
          </div>
          {currentStreak > 0 && (
            <p
              className="font-sans text-[12px] mt-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Keep it going.
            </p>
          )}
        </div>

        {/* Recommended Next */}
        <div
          className="p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span className="label">Recommended next</span>
          {weakQuiz ? (
            <>
              <h3
                className="font-serif font-normal mt-2"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 17,
                  lineHeight: 1.3,
                  letterSpacing: '-0.005em',
                }}
              >
                {weakQuiz.title}
              </h3>
              <p
                className="font-sans text-[13px] mt-2"
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                You scored {weakQuiz.best_score}% on this quiz. A focused
                session could push it higher.
              </p>
              <Link
                href={`/chat?msg=Help me review ${encodeURIComponent(weakQuiz.title)}`}
                className="inline-block font-sans text-[13px] font-medium mt-4 transition-opacity duration-200 hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                Review topic →
              </Link>
            </>
          ) : trendingTopics.length > 0 ? (
            <>
              <h3
                className="font-serif font-normal mt-2"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 17,
                  lineHeight: 1.3,
                  letterSpacing: '-0.005em',
                }}
              >
                {trendingTopics[0].title}
              </h3>
              <p
                className="font-sans text-[13px] mt-2"
                style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
              >
                {trendingTopics[0].description}
              </p>
              <Link
                href={`/chat?trending=${encodeURIComponent(trendingTopics[0].title)}&msg=Teach me about ${encodeURIComponent(trendingTopics[0].title)}`}
                className="inline-block font-sans text-[13px] font-medium mt-4 transition-opacity duration-200 hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                Learn this →
              </Link>
            </>
          ) : (
            <>
              <h3
                className="font-serif font-normal mt-2"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 17,
                  lineHeight: 1.3,
                  letterSpacing: '-0.005em',
                }}
              >
                Explore a subject
              </h3>
              <p
                className="font-sans text-[13px] mt-2"
                style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
              >
                Pick a topic below and start a conversation to get
                personalized recommendations.
              </p>
              <Link
                href="/chat"
                className="inline-block font-sans text-[13px] font-medium mt-4 transition-opacity duration-200 hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                Start chatting →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ─── Upgrade card (free users only) ──────────────────
       *  Moved BELOW the secondary cards so it doesn't compete
       *  with Today's Focus at the top of the page. Still
       *  above-the-fold for most viewports.                       */}
      <div className="mt-6">
        <DashboardUpgradeCard />
      </div>

      {/* ─── Recent Sessions ──────────────────────────────────
       *  Hairline-divided list with Lucide subject icons (the
       *  emoji-prefixed indicators are gone). Chevron is always
       *  visible at 40% opacity, brightens on hover — usable on
       *  touch devices without hover.                           */}
      {hasConversations && (
        <div className="mt-10">
          <span className="label">Recent sessions</span>
          <hr className="ruled-line mt-2" />
          <StaggerContainer stagger={0.06}>
            {recentConversations.map((convo) => {
              const Icon = getSubjectIcon(convo.subject)
              return (
                <StaggerItem key={convo.id}>
                  <Link
                    href={`/chat?id=${convo.id}`}
                    className="flex items-center py-4 group cursor-pointer transition-all duration-150"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <Icon
                      size={18}
                      style={{
                        color: 'var(--text-tertiary)',
                        flexShrink: 0,
                      }}
                    />
                    <div className="ml-3 flex-1 min-w-0">
                      <p
                        className="font-serif text-[15px] truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {convo.title}
                      </p>
                      <p
                        className="font-sans text-[12px] mt-[2px]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {convo.subject ?? 'General'} ·{' '}
                        {relativeTime(convo.updated_at)}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      )}

      {/* ─── Subjects Grid ─────────────────────────────────── */}
      <div className="mt-10">
        <span className="label">Open a subject</span>
        <hr className="ruled-line mt-2 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((subject) => {
            const Icon = SUBJECT_ICONS[subject.name]
            return (
              <Link
                key={subject.name}
                href={`/chat?msg=Teach me about ${encodeURIComponent(subject.name)}`}
                className="flex flex-col items-center gap-2 p-4 cursor-pointer transition-all duration-150 hover:-translate-y-[1px]"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                {Icon && <Icon size={22} style={{ color: 'var(--accent)' }} />}
                <span
                  className="font-sans text-[12px] font-medium text-center"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {subject.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

/* ─── Right panel wrapper exported for the server page ───── */
export function DashboardRightPanelWrapper(props: {
  currentStreak: number
  suggestions: Suggestion[]
}) {
  return <DashboardRightPanel {...props} />
}
