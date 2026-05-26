'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: 56,
        background: scrolled ? 'rgba(249,247,243,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-between h-full px-6 lg:px-10">
        <span className="font-serif text-[19px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
          EduMind
        </span>

        <span className="hidden md:block font-sans text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          AI tutor for JEE &amp; NEET
        </span>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="font-sans text-[14px] px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer"
                style={{
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                }}
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="font-sans text-[14px] px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
                style={{
                  background: 'var(--accent)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                Start for free
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="font-sans text-[14px] px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                background: 'var(--accent)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Dashboard
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <X size={20} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="px-6 pb-5 pt-3 md:hidden"
          style={{
            background: 'rgba(249,247,243,0.98)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="block w-full font-sans text-[14px] rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="mt-2 block w-full font-sans text-[14px] rounded-lg px-5 py-2.5 text-center font-medium text-white cursor-pointer"
                style={{ background: 'var(--accent)' }}
                onClick={() => setMobileOpen(false)}
              >
                Start for free
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="block w-full font-sans text-[14px] rounded-lg px-5 py-2.5 text-center font-medium text-white"
              style={{ background: 'var(--accent)' }}
              onClick={() => setMobileOpen(false)}
            >
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      )}
    </nav>
  )
}
