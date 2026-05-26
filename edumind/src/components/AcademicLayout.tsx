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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/quiz', label: 'Quiz', icon: FileQuestion },
  { href: '/progress', label: 'Progress', icon: BarChart2 },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/assessment', label: 'Assessment', icon: ClipboardList },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/pricing', label: 'Pricing', icon: Tag },
]

const pageNumbers: Record<string, string> = {
  '/dashboard': 'Page 02',
  '/chat': 'Page 03',
  '/quiz': 'Page 04',
  '/progress': 'Page 06',
  '/history': 'Page 07',
  '/trending': 'Page 08',
  '/profile': 'Page 09',
  '/assessment': 'Page 10',
  '/pricing': 'Page 11',
}

interface AcademicLayoutProps {
  children: ReactNode
  rightPanel?: ReactNode
  pageNumber?: string
}

export function AcademicLayout({ children, rightPanel, pageNumber }: AcademicLayoutProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { isPro } = useSubscription()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileRightOpen, setMobileRightOpen] = useState(false)
  const currentPage = navItems.find((n) => pathname.startsWith(n.href))
  const displayPageNum = pageNumber || pageNumbers[pathname] || ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* TOP NAVBAR */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-6"
        style={{
          height: 56,
          background: 'rgba(249,247,243,0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={20} style={{ color: 'var(--text-primary)' }} />
            ) : (
              <Menu size={20} style={{ color: 'var(--text-primary)' }} />
            )}
          </button>

          <Link href="/dashboard" className="font-serif text-[19px]" style={{ color: 'var(--text-primary)' }}>
            EduMind
          </Link>
          {currentPage && (
            <>
              <span className="font-sans text-[14px] mx-1" style={{ color: 'var(--text-tertiary)' }}>
                {'\u00B7'}
              </span>
              <span className="font-sans text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
                {currentPage.label}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Streak — real value via StreakBadge (fetches /api/progress) */}
          <StreakBadge />
          <span className="font-sans text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
            {'\u00B7'}
          </span>
          {/* User avatar */}
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.firstName ?? 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full font-sans text-[13px] font-semibold"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {user?.firstName?.[0] ?? 'S'}
            </div>
          )}
          {/* Mobile right panel toggle */}
          {rightPanel && (
            <button
              className="lg:hidden p-1"
              onClick={() => setMobileRightOpen(!mobileRightOpen)}
              aria-label="Toggle side panel"
            >
              <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>
      </header>

      <PastDueBanner />

      <div className="flex">
        {/* LEFT SIDEBAR — Desktop */}
        <aside
          className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto"
          style={{
            background: 'var(--bg-warm)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div className="px-5 pt-6 pb-4">
            <span className="font-serif text-[18px]" style={{ color: 'var(--text-primary)' }}>
              EduMind
            </span>
            <hr className="ruled-line mt-3" />
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
                    background: isActive ? 'var(--accent-light)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <item.icon
                    size={16}
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
                  />
                  <span className="font-sans text-[14px]">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-5 pb-5">
            <hr className="ruled-line mb-4" />
            <p className="font-sans text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.firstName ?? 'Scholar'}
            </p>
            <p className="font-sans text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </p>
            {!isPro && (
              <Link
                href="/pricing"
                className="font-sans text-[12px] mt-[2px] inline-block transition-all duration-200"
                style={{ color: 'var(--accent)' }}
              >
                {'Upgrade \u2192'}
              </Link>
            )}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                className="fixed left-0 top-[56px] bottom-0 z-50 w-60 overflow-y-auto lg:hidden"
                style={{
                  background: 'var(--bg-warm)',
                  borderRight: '1px solid var(--border)',
                }}
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.2 }}
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
                          background: isActive ? 'var(--accent-light)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        <item.icon
                          size={16}
                          style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
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

        {/* CENTER CONTENT */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[720px] mx-auto px-4 md:px-8 py-10 md:py-12 relative">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </div>

          {/* Page number */}
          {displayPageNum && (
            <div
              className="hidden lg:block fixed bottom-6 font-sans text-[11px]"
              style={{
                color: 'var(--text-tertiary)',
                right: rightPanel ? 280 : 32,
              }}
            >
              {displayPageNum}
            </div>
          )}
        </main>

        {/* RIGHT PANEL — Desktop */}
        {rightPanel && (
          <aside
            className="hidden lg:block w-[260px] flex-shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto"
            style={{
              background: 'var(--bg-warm)',
              borderLeft: '1px solid var(--border)',
              padding: '28px 20px',
            }}
          >
            {rightPanel}
          </aside>
        )}

        {/* Mobile right panel overlay */}
        <AnimatePresence>
          {mobileRightOpen && rightPanel && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileRightOpen(false)}
              />
              <motion.aside
                className="fixed right-0 top-[56px] bottom-0 z-50 w-[260px] overflow-y-auto lg:hidden"
                style={{
                  background: 'var(--bg-warm)',
                  borderLeft: '1px solid var(--border)',
                  padding: '28px 20px',
                }}
                initial={{ x: 260 }}
                animate={{ x: 0 }}
                exit={{ x: 260 }}
                transition={{ duration: 0.2 }}
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
