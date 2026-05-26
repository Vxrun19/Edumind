"use client";

import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";

export default function DashboardUpgradeCard() {
  const { isPro, isLoading } = useSubscription();

  if (isLoading || isPro) return null;

  return (
    <div
      className="notebook-panel rounded-2xl p-5 mb-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--accent)",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">✦</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Upgrade to Pro
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
            Unlock unlimited chats, voice mode and full personalization.
          </p>
          <Link
            href="/pricing"
            className="text-xs font-semibold transition-all hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            ₹399/month &rarr; See plans
          </Link>
        </div>
      </div>
    </div>
  );
}
