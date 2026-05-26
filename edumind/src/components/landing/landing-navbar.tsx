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
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

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
        // At the top of the page the navbar is transparent so the hero's
        // atmospheric radial gradient bleeds through. Once the user
        // scrolls past 20px, the navbar fills with --bg-base at 92%
        // opacity + a 12px backdrop blur, plus a hairline bottom rule.
        //
        // The rgba is hard-coded from --bg-base (#F8F9FE = 248,249,254)
        // because rgba() can't read CSS custom properties directly.
        // Replaces the old warm-cream rgba(249,247,243,...) the audit
        // flagged as stale brand language.
        background: scrolled
          ? 'rgba(248, 249, 254, 0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--border)'
          : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-between h-full px-6 lg:px-10">
        {/* Wordmark — Lora serif, clickable back to home. Slightly
         *  smaller than the footer wordmark (20px vs 22px) for navbar
         *  density, same character. */}
        <Link
          href="/"
          className="font-serif"
          style={{
            color: 'var(--text-primary)',
            fontSize: 20,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          EduMind
        </Link>

        {/* Center tagline — desktop only (lg+), quiet sans tertiary.
         *  Hidden below lg so tablets get a cleaner 2-element layout. */}
        <span
          className="hidden lg:block font-sans"
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 13,
          }}
        >
          AI tutor for JEE &amp; NEET
        </span>

        {/* Desktop auth — Sign in as quiet text (hovers violet),
         *  Start learning free as the brand .btn-primary pill (matches
         *  hero, pricing Pro card, and closing CTA). */}
        <div className="hidden md:flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="font-sans text-[14px] text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] transition-colors duration-200 cursor-pointer"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="btn-primary cursor-pointer"
                style={{
                  fontSize: 14,
                  padding: '10px 20px',
                }}
              >
                Start learning free →
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="btn-primary"
              style={{
                fontSize: 14,
                padding: '10px 20px',
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
          className="flex items-center justify-center w-9 h-9 rounded-lg md:hidden cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
        >
          {mobileOpen ? (
            <X size={20} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          )}
        </button>
      </div>

      {/* Mobile menu — slides down smoothly via framer-motion
       *  AnimatePresence (height:0 → auto, fade). Gated by
       *  useReducedMotion → falls back to instant show/hide. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-menu"
            key="mobile-menu"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { height: 'auto', opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.15 : 0.25,
              ease: easing,
            }}
            className="md:hidden"
            style={{
              overflow: 'hidden',
              // Slightly more opaque than the scrolled navbar (98% vs
              // 92%) — menu surface should feel solid when open.
              background: 'rgba(248, 249, 254, 0.98)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="px-6 pb-5 pt-3 flex flex-col gap-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="block w-full font-sans text-[14px] text-left px-3 py-3 cursor-pointer text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] transition-colors duration-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="btn-primary block w-full text-center cursor-pointer"
                    style={{ fontSize: 15 }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Start learning free →
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="btn-primary block w-full text-center"
                  style={{ fontSize: 15 }}
                  onClick={() => setMobileOpen(false)}
                >
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
