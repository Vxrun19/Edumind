'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, BookOpen, Plus } from 'lucide-react'
import { AcademicLayout } from '@/components/academic-layout'
import Link from 'next/link'

const easing = [0.16, 1, 0.3, 1]

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Explain entropy in simple terms.',
    timestamp: '2:34 PM',
  },
  {
    id: '2',
    role: 'ai',
    content: `Entropy is simply a measure of disorder — or more precisely, the number of possible configurations a system can exist in.

Consider a tidy room. There are very few arrangements that count as 'tidy', but countless ways to be a mess. High entropy means more possible states.

In thermodynamics, entropy in a closed system always increases. This is why your coffee cools but never spontaneously heats back up. Energy naturally spreads out rather than concentrating.

This principle — the **Second Law of Thermodynamics** — governs everything from engines to the arrow of time itself.`,
    timestamp: '2:34 PM',
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you give a real-world example?',
    timestamp: '2:36 PM',
  },
  {
    id: '4',
    role: 'ai',
    content: `Absolutely. Consider an ice cube in a warm glass of water.

The ice has low entropy — its molecules are arranged in a rigid crystal lattice. The warm water has higher entropy — molecules move freely.

When the ice melts, the ordered crystal structure breaks down. The total entropy of the system increases. The reverse — water spontaneously freezing in a warm room — never happens because it would decrease entropy.

This is entropy in action: **systems naturally evolve toward greater disorder**. It's not that order is forbidden, but statistically, disordered states vastly outnumber ordered ones.`,
    timestamp: '2:36 PM',
  },
]

const recentConversations = [
  { id: '1', title: 'Entropy and Thermodynamics', time: '2h ago', subject: 'Physics', active: true },
  { id: '2', title: 'Essay Planning: Modernism', time: '5h ago', subject: 'English', active: false },
  { id: '3', title: 'Integration by Parts', time: 'Yesterday', subject: 'Math', active: false },
  { id: '4', title: 'French Revolution', time: 'Yesterday', subject: 'History', active: false },
]

function ThinkingIndicator() {
  return (
    <div className="annotation-block w-fit">
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
    </div>
  )
}

function formatAIContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-serif font-semibold" style={{ color: 'var(--text-primary)' }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function KnowledgeCanvas() {
  return (
    <>
      <span className="label-text">KNOWLEDGE CANVAS</span>
      <hr className="ruled-line mt-2 mb-4" />

      {/* Definition card */}
      <div className="mb-4" style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 12 }}>
        <p className="font-sans text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Entropy
        </p>
        <p className="font-serif text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          A measure of the number of possible configurations or disorder in a system. Always increases in closed systems.
        </p>
      </div>

      <div className="mb-4" style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 12 }}>
        <p className="font-sans text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Second Law of Thermodynamics
        </p>
        <p className="font-serif text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Entropy of an isolated system always increases over time. Systems naturally tend toward disorder.
        </p>
      </div>

      <hr className="ruled-line my-4" />

      <span className="label-text">KEY POINTS</span>
      <ul className="mt-3 space-y-2">
        {[
          'Low entropy = high order (ice crystal)',
          'High entropy = high disorder (warm water)',
          'Entropy change is irreversible in nature',
        ].map((point) => (
          <li
            key={point}
            className="font-serif text-[13px] flex gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--accent)' }}>{'\u2022'}</span>
            {point}
          </li>
        ))}
      </ul>
    </>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    setTimeout(() => {
      setIsThinking(false)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content:
          "That's a great question. Let me think through this carefully and provide you with a thorough explanation that connects to what we've already discussed about entropy and thermodynamics.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 2000)
  }

  return (
    <AcademicLayout rightPanel={<KnowledgeCanvas />} pageNumber="Page 03">
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Messages area */}
        <div className="flex-1 space-y-5 pb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: msg.role === 'user' ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: easing }}
            >
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[70%] text-right">
                    <p
                      className="font-serif text-[15px]"
                      style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}
                    >
                      {msg.content}
                    </p>
                    <p className="font-sans text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[92%]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="label-text" style={{ color: 'var(--accent)' }}>
                      EDUMIND
                    </span>
                    <span
                      className="font-sans text-[11px] px-2 py-[2px] rounded-full"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      Physics
                    </span>
                  </div>
                  <div className="annotation-block">
                    <div
                      className="font-serif text-[15px] whitespace-pre-line"
                      style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}
                    >
                      {formatAIContent(msg.content)}
                    </div>
                    <hr className="ruled-line mt-4 mb-2" />
                    <div className="flex gap-3">
                      <button
                        className="font-sans text-[12px] transition-all duration-200"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {'Helpful? Yes'}
                      </button>
                      <span style={{ color: 'var(--text-tertiary)' }}>{'\u00B7'}</span>
                      <button
                        className="font-sans text-[12px] transition-all duration-200"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <p className="font-sans text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {msg.timestamp}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          <AnimatePresence>
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ThinkingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Typewriter input */}
        <div
          className="sticky bottom-0 pt-5 pb-4"
          style={{
            background: 'var(--bg-warm)',
            borderTop: '1px solid var(--border)',
            margin: '0 -32px',
            padding: '20px 32px',
          }}
        >
          <label
            className="label-text block mb-2"
            style={{ letterSpacing: '0.10em' }}
          >
            Write your question
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="typewriter-input flex-1"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              onClick={handleSend}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 active:scale-[0.97]"
              style={{
                background: input.trim() ? 'var(--accent)' : 'var(--bg-muted)',
              }}
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <Send size={14} color={input.trim() ? 'white' : 'var(--text-tertiary)'} />
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md"
              style={{ border: '1px solid var(--border-strong)' }}
              aria-label="Voice input"
            >
              <Mic size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
          <p className="font-sans text-[11px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {'Enter to send \u00B7 Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </AcademicLayout>
  )
}
