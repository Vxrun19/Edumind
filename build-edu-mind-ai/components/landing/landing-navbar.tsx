'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 transition-all duration-300"
      style={{
        height: 56,
        background: scrolled ? 'rgba(249,247,243,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <span className="font-serif text-[19px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
        EduMind
      </span>

      <span className="hidden md:block font-sans text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        Your personal AI tutor
      </span>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="font-sans text-[14px] px-4 py-2 rounded-lg transition-all duration-200"
          style={{
            border: '1px solid var(--border-strong)',
            color: 'var(--text-secondary)',
          }}
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="font-sans text-[14px] px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            background: 'var(--accent)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Start for free
        </Link>
      </div>
    </nav>
  )
}
