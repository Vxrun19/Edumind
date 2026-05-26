import Link from 'next/link'

// Single source of truth for footer nav. All hrefs are honest — they
// each map to a real page in /app.
const LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refunds', href: '/refund-policy' },
  { label: 'Contact', href: 'mailto:varunpatelai@gmail.com' },
] as const

// Quiet, calm footer. After the dark CTA section above, the page
// returns to its light base — the CTA stays a discrete dramatic
// moment; the footer is the editorial colophon, not a flashy element.
export function Footer() {
  return (
    <footer
      className="relative px-6 py-12 md:py-16"
      style={{
        background: 'var(--bg-base)',
        // A thin --border line at the top closes the dark CTA above and
        // opens the footer — visible as a pale edge against the dark.
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Top band — brand block on the left, link nav on the right.
         *  Stacks vertically on mobile, single row on desktop. */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
          {/* Brand block — Lora wordmark + serif tagline. Reads like a
           *  magazine masthead in miniature. */}
          <div>
            <span
              className="font-serif"
              style={{
                color: 'var(--text-primary)',
                fontSize: 22,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              EduMind
            </span>
            <p
              className="font-serif mt-1"
              style={{
                color: 'var(--text-tertiary)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              AI tutor for JEE &amp; NEET aspirants.
            </p>
          </div>

          {/* Link nav. flex-wrap so it never overflows on narrow viewports;
           *  each link uses Tailwind arbitrary-value colors (not inline
           *  style) so the :hover violet shift can override the default
           *  via normal CSS cascade. */}
          <nav className="flex flex-wrap items-center gap-x-6 md:gap-x-7 gap-y-2">
            {LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-sans text-[14px] text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright — sits a generous gap below the brand/nav band as
         *  the colophon. No bottom rule; the whitespace is the rhythm. */}
        <p
          className="font-sans mt-10 md:mt-12"
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 12,
            letterSpacing: '0.02em',
          }}
        >
          {'© 2025 EduMind'}
        </p>
      </div>
    </footer>
  )
}
