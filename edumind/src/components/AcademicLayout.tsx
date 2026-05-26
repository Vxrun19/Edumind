'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/use-subscription'
import {
  LayoutDashboard,
  MessageSquare,
  FileQuestion,
  BarChart2,
  Clock,
  TrendingUp,
  User,
  ClipboardList,
  Tag,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PastDueBanner } from '@/components/PastDueBanner'
import StreakBadge from '@/components/StreakBadge'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

// In-app navigation — order matters; this is the reading order in the
// sidebar (most-used at top, account stuff near the bottom).
const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/chat',       label: 'Chat',       icon: MessageSquare },
  { href: '/quiz',       label: 'Quiz',       icon: FileQuestion },
  { href: '/progress',   label: 'Progress',   icon: BarChart2 },
  { href: '/history',    label: 'History',    icon: Clock },
  { href: '/trending',   label: 'Trending',   icon: TrendingUp },
  { href: '/assessment', label: 'Assessment', icon: ClipboardList },
  { href: '/profile',    label: 'Profile',    icon: User },
  { href: '/pricing',    label: 'Pricing',    icon: Tag },
]

interface AcademicLayoutProps {
  children: ReactNode
  rightPanel?: ReactNode
}

// In-app chrome: top bar (sticky frosted) + left sidebar (sticky panel
// surface) + optional right panel. The calm-premium register — this is
// a tool used for hours, so restraint over drama: cool slate text,
// generous whitespace, violet only on active states + brand moments.
export function AcademicLayout({ children, rightPanel }: AcademicLayoutProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { isPro } = useSubscription()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileRightOpen, setMobileRightOpen] = useState(false)
  const currentPage = navItems.find((n) => pathname.startsWith(n.href))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* ─── Top bar ───────────────────────────────────────────────
       *  Frosted glass over scrolling content. Matches the landing
       *  navbar's scrolled-state visually: --bg-base @ 94% opacity +
       *  12px backdrop blur + 1px --border bottom rule. The old
       *  rgba(249,247,243,...) warm-cream is gone.                    */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-6"
        style={{
          height: 56,
          background: 'rgba(248, 249, 254, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 -ml-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={20} style={{ color: 'var(--text-primary)' }} />
            ) : (
              <Menu size={20} style={{ color: 'var(--text-primary)' }} />
            )}
          </button>

          {/* Wordmark — 20px Lora, matches landing navbar */}
          <Link
            href="/dashboard"
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

          {/* Current page label — ` · Chat` separator pattern */}
          {currentPage && (
            <>
              <span
                className="font-sans text-[14px] mx-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {'·'}
              </span>
              <span
                className="font-sans text-[14px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {currentPage.label}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* StreakBadge — real value, fetches /api/progress (preserved) */}
          <StreakBadge />
          <span
            className="font-sans text-[14px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {'·'}
          </span>
          {/* Avatar — Clerk image if present, else initial-letter pill */}
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.firstName ?? 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full font-sans text-[13px] font-semibold"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              {user?.firstName?.[0] ?? 'S'}
            </div>
          )}
          {/* Mobile right panel toggle (only renders when right panel exists) */}
          {rightPanel && (
            <button
              className="lg:hidden p-1 cursor-pointer"
              onClick={() => setMobileRightOpen(!mobileRightOpen)}
              aria-label="Toggle side panel"
              aria-expanded={mobileRightOpen}
            >
              <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>
      </header>

      {/* PastDueBanner — full-width amber alert, mounted below header.
       *  Renders nothing when subscription is healthy. Preserved as-is. */}
      <PastDueBanner />

      <div className="flex">
        {/* ─── Desktop sidebar ─────────────────────────────────────
         *  Sticky panel on --bg-muted, slightly darker than the main
         *  content area's --bg-base — reads as a different surface,
         *  like the subjects-strip band on the landing.              */}
        <aside
          className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto"
          style={{
            background: 'var(--bg-muted)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div className="px-5 pt-6 pb-4">
            <Link
              href="/dashboard"
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
            <hr className="ruled-line mt-4" />
          </div>

          <nav className="flex-1 px-3 py-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-[10px] h-10 px-3 rounded-lg transition-all duration-150 mb-[2px]"
                  style={{
                    background: isActive
                      ? 'var(--accent-light)'
                      : 'transparent',
                    borderLeft: isActive
                      ? '3px solid var(--accent)'
                      : '3px solid transparent',
                    color: isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <item.icon
                    size={16}
                    style={{
                      color: isActive
                        ? 'var(--accent)'
                        : 'var(--text-tertiary)',
                    }}
                  />
                  <span className="font-sans text-[14px]">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar footer — user + plan tier */}
          <div className="px-5 pb-5">
            <hr className="ruled-line mb-4" />
            <p
              className="font-sans text-[14px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.firstName ?? 'Scholar'}
            </p>
            <p
              className="font-sans text-[12px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </p>
            {!isPro && (
              <Link
                href="/pricing"
                className="font-sans text-[12px] mt-[2px] inline-block transition-opacity duration-200 hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                {'Upgrade →'}
              </Link>
            )}
          </div>
        </aside>

        {/* ─── Mobile sidebar drawer ────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Scrim — dim the page, click to close */}
              <motion.div
                className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: easing }}
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Drawer — slides in from the left */}
              <motion.aside
                className="fixed left-0 top-[56px] bottom-0 z-50 w-60 overflow-y-auto lg:hidden"
                style={{
                  background: 'var(--bg-muted)',
                  borderRight: '1px solid var(--border)',
                }}
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.25, ease: easing }}
              >
                <nav className="px-3 py-4">
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-[10px] h-10 px-3 rounded-lg transition-all duration-150 mb-[2px]"
                        style={{
                          background: isActive
                            ? 'var(--accent-light)'
                            : 'transparent',
                          borderLeft: isActive
                            ? '3px solid var(--accent)'
                            : '3px solid transparent',
                          color: isActive
                            ? 'var(--text-primary)'
                            : 'var(--text-secondary)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        <item.icon
                          size={16}
                          style={{
                            color: isActive
                              ? 'var(--accent)'
                              : 'var(--text-tertiary)',
                          }}
                        />
                        <span className="font-sans text-[14px]">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Center content ──────────────────────────────────────
         *  Page mount fade-up. Structurally compatible with a future
         *  AnimatePresence-based shared page transition wrapping at
         *  the route level (we'll add that as a separate step).      */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[720px] mx-auto px-4 md:px-8 py-10 md:py-12 relative">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: easing }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* ─── Right panel (desktop) ─────────────────────────────── */}
        {rightPanel && (
          <aside
            className="hidden lg:block w-[260px] flex-shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto"
            style={{
              background: 'var(--bg-muted)',
              borderLeft: '1px solid var(--border)',
              padding: '28px 20px',
            }}
          >
            {rightPanel}
          </aside>
        )}

        {/* ─── Mobile right panel drawer ─────────────────────────── */}
        <AnimatePresence>
          {mobileRightOpen && rightPanel && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: easing }}
                onClick={() => setMobileRightOpen(false)}
              />
              <motion.aside
                className="fixed right-0 top-[56px] bottom-0 z-50 w-[260px] overflow-y-auto lg:hidden"
                style={{
                  background: 'var(--bg-muted)',
                  borderLeft: '1px solid var(--border)',
                  padding: '28px 20px',
                }}
                initial={{ x: 260 }}
                animate={{ x: 0 }}
                exit={{ x: 260 }}
                transition={{ duration: 0.25, ease: easing }}
              >
                {rightPanel}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AcademicLayout
