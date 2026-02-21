'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="px-6 py-10" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="font-serif text-[18px]" style={{ color: 'var(--text-primary)' }}>
              EduMind
            </span>
            <p className="font-sans text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Your personal AI tutor.
            </p>
          </div>
          <nav className="flex items-center gap-6">
            {['About', 'Pricing', 'Privacy', 'Terms'].map((item) => (
              <Link
                key={item}
                href="#"
                className="font-sans text-[14px] transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>
        <p
          className="font-sans text-[12px] mt-8"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {'\u00A9 2025 EduMind'}
        </p>
      </div>
    </footer>
  )
}
