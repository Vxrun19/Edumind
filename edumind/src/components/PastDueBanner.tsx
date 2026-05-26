"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * Surfaces a warning banner when the current user's subscription is in the
 * "past_due" grace state — i.e. Razorpay payment failed but we have not
 * downgraded the user from Pro yet. Renders nothing for active, free, or
 * loading states.
 *
 * Dismissal is per-mount: a user can hide the banner on the page they're
 * on so it doesn't block their work, but it reappears on the next page
 * load (since AcademicLayout remounts on navigation) until status changes
 * back to active. That's the "dismissible-but-persistent" pattern.
 */
export function PastDueBanner() {
  const { status } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (status !== "past_due" || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: "#FEF3C7", // amber-100 — soft, non-alarming
        borderBottom: "1px solid #FCD34D", // amber-300
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">
        <AlertTriangle
          size={18}
          className="shrink-0"
          style={{ color: "#D97706" /* amber-600 */ }}
          aria-hidden="true"
        />
        <p
          className="font-sans text-[13px] flex-1 min-w-0"
          style={{ color: "#78350F" /* amber-900 */, lineHeight: 1.5 }}
        >
          <span style={{ fontWeight: 600 }}>
            Your last payment didn&apos;t go through.
          </span>{" "}
          Renew your subscription to keep your EduMind Pro access.
        </p>
        <Link
          href="/pricing"
          className="shrink-0 font-sans text-[13px] font-medium px-3 py-1.5 rounded-md text-white transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.97]"
          style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
        >
          {"Update billing →"}
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded transition-colors hover:bg-[#FDE68A]"
          style={{ color: "#92400E" /* amber-800 */ }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
