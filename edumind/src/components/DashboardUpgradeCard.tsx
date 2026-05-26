'use client'

import Link from 'next/link'
import { useSubscription } from '@/hooks/use-subscription'

// Small upgrade prompt that renders only for free users. Subtle
// brand-violet left accent stripe + clean panel surface. Tabular-nums
// on the price so "₹399" stays cleanly aligned across re-renders.
export default function DashboardUpgradeCard() {
  const { isPro, isLoading } = useSubscription()

  if (isLoading || isPro) return null

  return (
    <div
      className="p-6"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <span className="label">Upgrade</span>
      <h3
        className="font-serif font-normal mt-2"
        style={{
          color: 'var(--text-primary)',
          fontSize: 18,
          lineHeight: 1.3,
          letterSpacing: '-0.005em',
        }}
      >
        Upgrade to Pro
      </h3>
      <p
        className="font-sans text-[13px] mt-2"
        style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
      >
        Unlock unlimited chats, voice mode, and full personalization from
        your assessment.
      </p>
      <Link
        href="/pricing"
        className="inline-block font-sans text-[13px] font-semibold mt-4 transition-opacity duration-200 hover:opacity-80"
        style={{
          color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ₹399/month → See plans
      </Link>
    </div>
  )
}
