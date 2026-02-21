'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import { CountUp } from '@/components/animations'
import Link from 'next/link'

const easing = [0.16, 1, 0.3, 1]

const subjectOptions = ['Math', 'Science', 'English', 'History', 'Coding', 'Languages', 'Finance', 'Life Skills']
const difficultyOptions = ['Foundation', 'Practitioner', 'Scholar']
const questionCountOptions = [5, 10, 15, 20]

const quizQuestions = [
  {
    question: 'What is the derivative of x\u00B2?',
    options: ['2x', 'x', 'x\u00B2', '1'],
    correct: 0,
    explanation: 'The power rule: d/dx(x\u207F) = nx\u207F\u207B\u00B9. For x\u00B2, n=2, giving us 2x\u00B9 = 2x.',
  },
  {
    question: 'Which law states that energy cannot be created or destroyed?',
    options: ['Second Law', 'First Law of Thermodynamics', 'Third Law', 'Zeroth Law'],
    correct: 1,
    explanation: 'The First Law of Thermodynamics (conservation of energy) states that energy can be transformed but cannot be created or destroyed in an isolated system.',
  },
  {
    question: 'What is the Big O notation for binary search?',
    options: ['O(n)', 'O(log n)', 'O(n\u00B2)', 'O(1)'],
    correct: 1,
    explanation: 'Binary search halves the search space with each step, resulting in logarithmic time complexity O(log n).',
  },
  {
    question: 'Who wrote "The Republic"?',
    options: ['Aristotle', 'Socrates', 'Plato', 'Homer'],
    correct: 2,
    explanation: 'Plato wrote The Republic around 375 BC, exploring justice, the ideal state, and the philosopher-king concept.',
  },
  {
    question: 'What is the integral of 1/x?',
    options: ['x\u00B2', 'ln|x| + C', '1/x\u00B2', 'e\u02E3'],
    correct: 1,
    explanation: 'The integral of 1/x is the natural logarithm: \u222B(1/x)dx = ln|x| + C.',
  },
]

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (seconds / total) * circumference

  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="var(--border-strong)" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      <text
        x="22"
        y="24"
        textAnchor="middle"
        className="font-sans"
        style={{ fontSize: '14px', fontWeight: 600, fill: 'var(--text-primary)' }}
      >
        {seconds}
      </text>
    </svg>
  )
}

function QuizRightPanel({ subject, difficulty, questionCount, timeElapsed, bestScore }: {
  subject: string; difficulty: string; questionCount: number; timeElapsed: string; bestScore: string
}) {
  return (
    <>
      <span className="label-text">SESSION</span>
      <hr className="ruled-line mt-2 mb-3" />
      <div className="space-y-3">
        {[
          ['Subject', subject || '-'],
          ['Difficulty', difficulty || '-'],
          ['Questions', String(questionCount)],
          ['Time elapsed', timeElapsed],
          ['Your best score', bestScore],
          ['Quizzes this week', '3'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between">
            <span className="font-sans text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
            <span className="font-sans text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{val}</span>
          </div>
        ))}
      </div>
    </>
  )
}

type QuizState = 'setup' | 'loading' | 'question' | 'results'

export default function QuizPage() {
  const [state, setState] = useState<QuizState>('setup')
  const [subject, setSubject] = useState('Math')
  const [difficulty, setDifficulty] = useState('Practitioner')
  const [questionCount, setQuestionCount] = useState(10)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(30)
  const [results, setResults] = useState<boolean[]>([])
  const [elapsed, setElapsed] = useState(0)

  // Timer
  useEffect(() => {
    if (state !== 'question' || answered) return
    if (timer <= 0) {
      handleAnswer(-1)
      return
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, state, answered])

  // Elapsed time
  useEffect(() => {
    if (state !== 'question') return
    const t = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => clearInterval(t)
  }, [state])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleBegin = () => {
    setState('loading')
    setTimeout(() => {
      setState('question')
      setCurrentQ(0)
      setScore(0)
      setResults([])
      setTimer(30)
      setElapsed(0)
    }, 1500)
  }

  const handleAnswer = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const correct = idx === quizQuestions[currentQ % quizQuestions.length].correct
    if (correct) setScore((p) => p + 1)
    setResults((p) => [...p, correct])
  }

  const handleNext = () => {
    const totalQ = Math.min(questionCount, quizQuestions.length)
    if (currentQ >= totalQ - 1) {
      setState('results')
      return
    }
    setCurrentQ((p) => p + 1)
    setSelected(null)
    setAnswered(false)
    setTimer(30)
  }

  const totalQ = Math.min(questionCount, quizQuestions.length)
  const q = quizQuestions[currentQ % quizQuestions.length]

  return (
    <AcademicLayout
      rightPanel={
        <QuizRightPanel
          subject={subject}
          difficulty={difficulty}
          questionCount={totalQ}
          timeElapsed={formatTime(elapsed)}
          bestScore="9/10"
        />
      }
      pageNumber="Page 04"
    >
      <AnimatePresence mode="wait">
        {/* SETUP */}
        {state === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: easing }}
            className="max-w-[500px] mx-auto pt-10"
          >
            <span className="label-text">ASSESSMENT MODE</span>
            <h2 className="font-serif text-[30px] mt-2" style={{ color: 'var(--text-primary)' }}>
              Test your understanding.
            </h2>
            <p className="font-serif text-[16px] mt-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              AI-generated questions calibrated to your level and history.
            </p>

            <hr className="ruled-line my-7" />

            {/* Subject */}
            <span className="label-text">SUBJECT</span>
            <hr className="ruled-line mt-1 mb-3" />
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className="font-sans text-[13px] px-4 py-2 rounded-full transition-all duration-150 cursor-pointer"
                  style={{
                    border: `1px solid ${s === subject ? 'var(--border-accent)' : 'var(--border)'}`,
                    background: s === subject ? 'var(--accent-light)' : 'transparent',
                    color: s === subject ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: s === subject ? 500 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <span className="label-text mt-6 block">DIFFICULTY</span>
            <hr className="ruled-line mt-1 mb-3" />
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="font-sans text-[13px] px-4 py-2 rounded-full transition-all duration-150 cursor-pointer"
                  style={{
                    border: `1px solid ${d === difficulty ? 'var(--border-accent)' : 'var(--border)'}`,
                    background: d === difficulty ? 'var(--accent-light)' : 'transparent',
                    color: d === difficulty ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: d === difficulty ? 500 : 400,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Questions */}
            <span className="label-text mt-6 block">QUESTIONS</span>
            <hr className="ruled-line mt-1 mb-3" />
            <div className="flex flex-wrap gap-2">
              {questionCountOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className="font-sans text-[13px] px-4 py-2 rounded-full transition-all duration-150 cursor-pointer"
                  style={{
                    border: `1px solid ${n === questionCount ? 'var(--border-accent)' : 'var(--border)'}`,
                    background: n === questionCount ? 'var(--accent-light)' : 'transparent',
                    color: n === questionCount ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: n === questionCount ? 500 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={handleBegin}
              className="w-full font-sans text-[14px] font-medium mt-8 px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.97] cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              {'Begin Assessment \u2192'}
            </button>
          </motion.div>
        )}

        {/* LOADING */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center pt-32"
          >
            <div className="flex gap-[6px]">
              {[0, 200, 400].map((delay) => (
                <motion.div
                  key={delay}
                  className="w-[7px] h-[7px] rounded-full"
                  style={{ background: 'var(--accent-light)' }}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: delay / 1000 }}
                />
              ))}
            </div>
            <p className="font-serif text-[15px] italic mt-4" style={{ color: 'var(--text-secondary)' }}>
              Preparing your questions...
            </p>
          </motion.div>
        )}

        {/* QUESTION */}
        {state === 'question' && (
          <motion.div
            key={`question-${currentQ}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: easing }}
          >
            {/* Progress */}
            <div className="mb-2">
              <div className="w-full h-[3px] rounded-full" style={{ background: 'var(--bg-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--accent)' }}
                  animate={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  Question {currentQ + 1} of {totalQ}
                </span>
                <TimerRing seconds={timer} total={30} />
              </div>
            </div>

            {/* Question card */}
            <div className="notebook-panel p-9 mt-3">
              <span className="label-text">QUESTION {currentQ + 1} OF {totalQ}</span>
              <h3
                className="font-serif text-[19px] font-medium mt-3"
                style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}
              >
                {q.question}
              </h3>

              {/* Options */}
              <div className="mt-6">
                {q.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx)
                  const isCorrect = answered && idx === q.correct
                  const isWrong = answered && idx === selected && idx !== q.correct
                  const isSelected = idx === selected && !answered

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={answered}
                      className="w-full flex items-center py-[14px] px-1 cursor-pointer transition-all duration-150 text-left"
                      style={{
                        borderBottom: `1px solid ${isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--border)'}`,
                        background: isCorrect
                          ? 'var(--success-bg)'
                          : isWrong
                            ? 'var(--error-bg)'
                            : isSelected
                              ? 'var(--accent-light)'
                              : 'transparent',
                      }}
                      animate={
                        isWrong
                          ? { x: [0, -4, 4, -2, 0] }
                          : isCorrect
                            ? { x: [0, 2, 0] }
                            : {}
                      }
                      transition={{ duration: isWrong ? 0.3 : 0.2 }}
                    >
                      <div
                        className="flex items-center justify-center w-[26px] h-[26px] rounded-full flex-shrink-0 font-sans text-[13px] font-semibold"
                        style={{
                          border: `1px solid ${isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : isSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                          background: isSelected && !answered ? 'var(--accent)' : isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : 'transparent',
                          color: isSelected || isCorrect || isWrong ? 'white' : 'var(--text-secondary)',
                        }}
                      >
                        {letter}
                      </div>
                      <span
                        className="font-serif text-[15px] ml-3 flex-1"
                        style={{
                          color: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--text-primary)',
                        }}
                      >
                        {opt}
                      </span>
                      {isCorrect && <CheckCircle size={14} style={{ color: 'var(--success)' }} />}
                      {isWrong && <XCircle size={14} style={{ color: 'var(--error)' }} />}
                    </motion.button>
                  )
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <div className="annotation-block">
                      <p className="font-serif text-[14px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {q.explanation}
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={handleNext}
                        className="font-sans text-[14px] px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer"
                        style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                      >
                        {currentQ >= totalQ - 1 ? 'See Results \u2192' : 'Next Question \u2192'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {state === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easing }}
            className="text-center pt-10"
          >
            <span className="label-text">SESSION COMPLETE</span>
            <hr className="ruled-line mt-2 mb-6 max-w-[200px] mx-auto" />

            <div className="flex items-baseline justify-center gap-1">
              <span className="font-serif text-[96px]" style={{ color: 'var(--accent)' }}>
                <CountUp value={score} />
              </span>
              <span className="font-serif text-[40px]" style={{ color: 'var(--text-tertiary)' }}>
                / {totalQ}
              </span>
            </div>

            <h3 className="font-serif text-[24px] mt-2" style={{ color: 'var(--text-primary)' }}>
              {score / totalQ >= 0.8 ? 'Distinction' : score / totalQ >= 0.6 ? 'Merit' : score / totalQ >= 0.5 ? 'Pass' : 'Keep studying'}
            </h3>

            <p className="font-serif text-[16px] italic mt-3 max-w-[400px] mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Strong work. Your understanding of core concepts is clearly developing.
            </p>

            <hr className="ruled-line my-6 max-w-[400px] mx-auto" />

            {/* Breakdown */}
            <div className="notebook-panel p-6 max-w-[500px] mx-auto text-left">
              <span className="label-text">QUESTION BREAKDOWN</span>
              {results.map((correct, i) => (
                <div
                  key={i}
                  className="flex items-center py-[10px] font-sans text-[13px]"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>Q{i + 1}</span>
                  <span className="flex-1 ml-3 truncate" style={{ color: 'var(--text-primary)' }}>
                    {quizQuestions[i % quizQuestions.length].question}
                  </span>
                  {correct ? (
                    <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle size={14} style={{ color: 'var(--error)' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Weak areas */}
            {results.some((r) => !r) && (
              <div
                className="max-w-[500px] mx-auto mt-5 p-5 rounded-sm text-left"
                style={{
                  background: 'var(--error-bg)',
                  borderLeft: '3px solid var(--error)',
                }}
              >
                <p className="font-sans text-[13px]" style={{ color: 'var(--error)' }}>
                  To revisit:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Chain rule', 'Implicit differentiation'].map((topic) => (
                    <span
                      key={topic}
                      className="font-sans text-[12px] px-[10px] py-1 rounded-full"
                      style={{ border: '1px solid var(--error)', color: 'var(--error)' }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-6">
              <Link
                href="/chat"
                className="font-sans text-[14px] font-medium px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px]"
                style={{ background: 'var(--accent)' }}
              >
                {'Study these topics \u2192'}
              </Link>
              <button
                onClick={() => {
                  setState('setup')
                  setCurrentQ(0)
                  setScore(0)
                  setResults([])
                  setSelected(null)
                  setAnswered(false)
                }}
                className="font-sans text-[14px] px-4 py-2 rounded-lg cursor-pointer"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                New assessment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AcademicLayout>
  )
}
