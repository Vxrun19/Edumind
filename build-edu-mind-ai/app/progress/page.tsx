'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import { CountUp, StaggerContainer, StaggerItem } from '@/components/animations'
import Link from 'next/link'

const easing = [0.16, 1, 0.3, 1]

function ProgressBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="w-[180px] h-1 rounded-full flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
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

const subjects = [
  { name: 'English', level: 'Master', progress: 91, levelStyle: { background: '#FEF3C7', color: '#92400E' } },
  { name: 'Mathematics', level: 'Advanced', progress: 78, levelStyle: { background: 'var(--accent-light)', color: 'var(--accent)' } },
  { name: 'Science', level: 'Learner', progress: 62, levelStyle: { background: '#DCFCE7', color: '#166534' } },
  { name: 'Coding', level: 'Learner', progress: 55, levelStyle: { background: '#DCFCE7', color: '#166534' } },
  { name: 'Finance', level: 'Explorer', progress: 40, levelStyle: { background: '#DBEAFE', color: '#1E40AF' } },
]

const quizHistory = [
  { date: 'Feb 15', subject: 'Mathematics', score: '9/10', result: 'Distinction', highlight: true },
  { date: 'Feb 12', subject: 'History', score: '7/10', result: 'Merit', highlight: false },
  { date: 'Feb 10', subject: 'Calculus', score: '8/10', result: 'Distinction', highlight: true },
  { date: 'Feb 8', subject: 'Physics', score: '6/10', result: 'Pass', highlight: false },
  { date: 'Feb 5', subject: 'Chemistry', score: '10/10', result: 'Perfect', highlight: true },
]

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const streakDays = [true, true, true, true, true, true, false]

const topicTags = [
  'Entropy', 'Calculus', 'WWII', 'DNA', 'Algorithms',
  'Derivatives', 'Thermodynamics', 'Eigenvalues', 'Philosophy', 'Integration',
]

function ProgressRightPanel() {
  return (
    <>
      <span className="label-text">LEARNING DNA</span>
      <hr className="ruled-line mt-2 mb-3" />
      <p className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        {"Topics you've explored:"}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {topicTags.map((tag) => (
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

      <span className="label-text">CERTIFICATES</span>
      <div className="mt-3">
        <p className="font-serif text-[14px]" style={{ color: 'var(--text-primary)' }}>
          Data Structures {'\u00B7'} Completed
        </p>
        <p className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          February 14, 2025
        </p>
        <Link
          href="#"
          className="font-sans text-[13px] mt-1 inline-block"
          style={{ color: 'var(--accent)' }}
        >
          {'View certificate \u2192'}
        </Link>
      </div>
    </>
  )
}

export default function ProgressPage() {
  return (
    <AcademicLayout rightPanel={<ProgressRightPanel />} pageNumber="Page 06">
      <span className="label-text">YOUR RECORD</span>
      <h1
        className="font-serif text-[32px] md:text-[38px] font-normal mt-1"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
      >
        {'Progress & Mastery.'}
      </h1>
      <hr className="ruled-line mt-4" />

      {/* Stats row */}
      <div className="flex items-center justify-center py-7 gap-0 mt-7">
        {[
          { value: 84, label: 'hours of study' },
          { value: 32, label: 'assessments taken' },
          { value: 87, label: 'average score', suffix: '%' },
        ].map((stat, i) => (
          <div key={stat.label} className="flex items-center">
            {i > 0 && (
              <div className="h-[60px] mx-6 md:mx-10" style={{ borderLeft: '1px solid var(--border)' }} />
            )}
            <div className="text-center">
              <div className="font-serif text-[40px] md:text-[52px]" style={{ color: 'var(--accent)' }}>
                <CountUp value={stat.value} suffix={stat.suffix || ''} />
              </div>
              <p className="font-sans text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <hr className="ruled-line my-7" />

      {/* Streak section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-7">
        <div>
          <span className="text-[28px]">{'🔥'}</span>
          <h3 className="font-serif text-[28px] mt-1" style={{ color: 'var(--accent)' }}>
            6 Day Streak
          </h3>
          <p className="font-sans text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Personal best: 14 days
          </p>
        </div>
        <div className="flex gap-2">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="font-sans text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {day}
              </span>
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: streakDays[i] ? 'var(--accent)' : 'var(--bg-muted)',
                  border: streakDays[i] ? 'none' : '1px solid var(--border)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <hr className="ruled-line my-7" />

      {/* Subject Mastery */}
      <h3 className="font-sans text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Subject Mastery
      </h3>
      <hr className="ruled-line mt-2 mb-4" />

      <StaggerContainer staggerDelay={0.08}>
        {subjects.map((s, i) => (
          <StaggerItem key={s.name}>
            <div
              className="flex items-center py-4 gap-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="font-serif text-[15px] w-[120px] flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                {s.name}
              </span>
              <span
                className="font-sans text-[11px] px-[10px] py-[3px] rounded-full flex-shrink-0"
                style={s.levelStyle}
              >
                {s.level}
              </span>
              <ProgressBar value={s.progress} delay={i * 0.1} />
              <span className="font-sans text-[13px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                {s.progress}%
              </span>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <hr className="ruled-line my-7" />

      {/* Quiz history */}
      <h3 className="font-sans text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Assessment Record
      </h3>
      <hr className="ruled-line mt-2 mb-2" />

      {/* Header */}
      <div
        className="flex items-center py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {['Date', 'Subject', 'Score', 'Result'].map((h) => (
          <span
            key={h}
            className="label-text flex-1"
            style={{ minWidth: h === 'Date' ? 70 : h === 'Score' ? 60 : 'auto' }}
          >
            {h}
          </span>
        ))}
      </div>

      {quizHistory.map((row) => (
        <div
          key={`${row.date}-${row.subject}`}
          className="flex items-center py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="font-sans text-[13px] flex-1" style={{ color: 'var(--text-secondary)', minWidth: 70 }}>
            {row.date}
          </span>
          <span className="font-sans text-[13px] flex-1" style={{ color: 'var(--text-secondary)' }}>
            {row.subject}
          </span>
          <span className="font-serif text-[14px] flex-1" style={{ color: 'var(--text-primary)', minWidth: 60 }}>
            {row.score}
          </span>
          <span
            className="font-sans text-[13px] flex-1"
            style={{
              color: row.highlight ? 'var(--accent)' : row.result === 'Pass' ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            }}
          >
            {row.result} {row.result === 'Perfect' && '\u2726\u2726'}
            {row.result === 'Distinction' && '\u2726'}
          </span>
        </div>
      ))}
    </AcademicLayout>
  )
}
