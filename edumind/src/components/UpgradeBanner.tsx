"use client";

import Link from "next/link";
import { useState } from "react";

interface UpgradeBannerProps {
  messagesUsed: number;
  messagesLimit: number;
}

export default function UpgradeBanner({ messagesUsed, messagesLimit }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="shrink-0 flex items-center justify-center gap-3 px-4"
      style={{
        height: 40,
        background: "var(--accent-light)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className="text-xs" style={{ color: "var(--accent)" }}>
        Free plan: {messagesUsed}/{messagesLimit} messages used today.{" "}
        <Link href="/pricing" className="font-semibold underline hover:no-underline">
          Upgrade for unlimited &rarr;
        </Link>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs ml-2 hover:opacity-70 transition-opacity"
        style={{ color: "var(--accent)" }}
      >
        ✕
      </button>
    </div>
  );
}
