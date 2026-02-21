'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Atom,
  PenLine,
  Calculator as CalcIcon,
  Dna,
  ChevronRight,
  FlaskConical,
  Landmark,
  Code2,
  Globe,
  DollarSign,
  Leaf,
  Heart,
  Palette,
  Calculator,
} from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import { CountUp, ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations'

const easing = [0.16, 1, 0.3, 1]

function CircularProgress({ value }: { value: number }) {
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width="110" height="110" viewBox="0 0 36 36" className="flex-shrink-0">
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="3"
      />
      <motion.circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        transform="rotate(-90 18 18)"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: easing, delay: 0.3 }}
      />
      <text
        x="18"
        y="17"
        textAnchor="middle"
        className="font-serif"
        style={{ fontSize: '7px', fontWeight: 500, fill: 'var(--text-primary)' }}
      >
        {value}%
      </text>
      <text
        x="18"
        y="22"
        textAnchor="middle"
        className="font-sans"
        style={{ fontSize: '3.5px', fill: 'var(--text-tertiary)' }}
      >
        mastery
      </text>
    </svg>
  )
}

function ProgressBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="w-full h-1 rounded-full" style={{ background: 'var(--bg-muted)' }}>
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

const recentSessions = [
  { icon: Atom, title: 'Entropy and Thermodynamics', subject: 'Physics', time: '2h ago' },
  { icon: PenLine, title: 'Essay Planning: Modernism', subject: 'English', time: 'Yesterday' },
  { icon: CalcIcon, title: 'Integration by Parts', subject: 'Mathematics', time: '3 days ago' },
  { icon: Dna, title: 'DNA Replication Explained', subject: 'Biology', time: '5 days ago' },
]

const subjects = [
  { name: 'Math', icon: Calculator },
  { name: 'Science', icon: FlaskConical },
  { name: 'English', icon: PenLine },
  { name: 'History', icon: Landmark },
  { name: 'Coding', icon: Code2 },
  { name: 'Languages', icon: Globe },
  { name: 'Finance', icon: DollarSign },
  { name: 'Life Skills', icon: Leaf },
  { name: 'Health', icon: Heart },
  { name: 'Art', icon: Palette },
]

function DashboardRightPanel() {
  return (
    <>
      {/* Study Notes */}
      <span className="label-text">STUDY NOTES</span>
      <hr className="ruled-line mt-2 mb-4" />
      <div className="font-sans text-[14px] font-semibold" style={{ color: 'var(--accent)' }}>
        {'🔥 6 day streak'}
      </div>
      <div className="mt-2">
        <ProgressBar value={86} delay={0.5} />
      </div>
      <p className="font-sans text-[12px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
        {'6 of 7 days \u2014 keep going'}
      </p>

      <hr className="ruled-line my-5" />

      {/* AI Insight */}
      <span className="label-text">AI INSIGHT</span>
      <div className="annotation-block mt-3">
        <p className="font-serif text-[13px] italic" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {"You engage more with topics when given real-world examples. Try asking: 'Show me how this applies to...'"}
        </p>
      </div>

      <hr className="ruled-line my-5" />

      {/* Continue */}
      <span className="label-text">CONTINUE</span>
      <div
        className="mt-3 p-[14px] rounded-lg"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="font-sans text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
          Data Structures
        </p>
        <p className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          {'Lesson 5 \u2014 Binary Trees'}
        </p>
        <Link
          href="/courses"
          className="font-sans text-[13px] mt-[6px] inline-block"
          style={{ color: 'var(--accent)' }}
        >
          {'Resume \u2192'}
        </Link>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateStr = today
    .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase()

  return (
    <AcademicLayout rightPanel={<DashboardRightPanel />}>
      {/* Greeting */}
      <div>
        <span className="label-text">{dayName}, {dateStr}</span>
        <h1
          className="font-serif text-[32px] md:text-[38px] font-normal mt-[6px]"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
        >
          Good morning, Varun.
        </h1>
        <hr className="ruled-line mt-4" />
        <p className="font-sans text-[15px] mt-3" style={{ color: 'var(--text-secondary)' }}>
          2 topics are waiting for you today.
        </p>
      </div>

      {/* Today's Focus */}
      <div className="notebook-panel p-7 mt-7">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <span className="label-text">{"TODAY'S FOCUS"}</span>
            <h3
              className="font-sans text-[17px] font-semibold mt-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Quantum Mechanics
            </h3>
            <p className="font-sans text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {'Chapter 4 \u2014 Wave-Particle Duality'}
            </p>

            <div className="mt-5">
              <p className="font-sans text-[13px] mb-[6px]" style={{ color: 'var(--text-tertiary)' }}>
                68% through this chapter
              </p>
              <ProgressBar value={68} delay={0.2} />
            </div>

            <Link
              href="/chat"
              className="inline-block font-sans text-[14px] font-medium mt-5 px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.97]"
              style={{ background: 'var(--accent)' }}
            >
              {'Continue studying \u2192'}
            </Link>
          </div>

          <div className="flex items-center justify-center">
            <CircularProgress value={68} />
          </div>
        </div>
      </div>

      {/* Two column cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        {/* Streak */}
        <div className="notebook-panel p-6">
          <span className="label-text">STUDY STREAK</span>
          <div className="mt-2 font-serif text-[52px]" style={{ color: 'var(--accent)' }}>
            <CountUp value={6} />
          </div>
          <p className="font-sans text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            days in a row
          </p>
          <div className="flex gap-[6px] mt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[10px] h-[10px] rounded-full"
                style={{ background: i < 6 ? 'var(--accent)' : 'var(--bg-muted)' }}
                animate={
                  i === 5
                    ? { scale: [1, 1.15, 1] }
                    : {}
                }
                transition={i === 5 ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
              />
            ))}
          </div>
          <p className="font-sans text-[12px] mt-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            1 more day to your personal best
          </p>
        </div>

        {/* Next up */}
        <div className="notebook-panel p-6">
          <span className="label-text">RECOMMENDED NEXT</span>
          <h3
            className="font-sans text-[17px] font-semibold mt-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Advanced Calculus Review
          </h3>
          <p
            className="font-sans text-[14px] mt-[6px]"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
          >
            You scored 72% on your last quiz here. A focused session could push that to 90%.
          </p>
          <Link
            href="/courses"
            className="inline-block font-sans text-[14px] mt-4 px-4 py-2 rounded-lg transition-all duration-200"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
          >
            {'Open course \u2192'}
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-9">
        <span className="label-text">RECENT SESSIONS</span>
        <hr className="ruled-line mt-2" />
        <StaggerContainer staggerDelay={0.06}>
          {recentSessions.map((session) => (
            <StaggerItem key={session.title}>
              <Link
                href="/history"
                className="flex items-center py-[14px] group cursor-pointer rounded-lg transition-all duration-150"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <session.icon size={16} style={{ color: 'var(--text-tertiary)' }} className="flex-shrink-0" />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-serif text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {session.title}
                  </p>
                  <p className="font-sans text-[12px] mt-[2px]" style={{ color: 'var(--text-tertiary)' }}>
                    {session.subject} {'\u00B7'} {session.time}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Subjects */}
      <div className="mt-9">
        <span className="label-text">OPEN A SUBJECT</span>
        <hr className="ruled-line mt-2 mb-4" />
        <div className="grid grid-cols-5 gap-3">
          {subjects.map((subject) => (
            <Link
              key={subject.name}
              href="/chat"
              className="flex flex-col items-center gap-[6px] p-3 rounded-lg cursor-pointer transition-all duration-150"
              style={{ border: '1px solid var(--border)' }}
            >
              <subject.icon size={20} style={{ color: 'var(--accent)' }} />
              <span
                className="font-sans text-[12px] font-medium text-center"
                style={{ color: 'var(--text-primary)' }}
              >
                {subject.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AcademicLayout>
  )
}
