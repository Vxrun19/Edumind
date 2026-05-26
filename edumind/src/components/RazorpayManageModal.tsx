"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  currentPeriodEnd: string | null;
  onCancelled: () => void;
}

export function RazorpayManageModal({
  open,
  onClose,
  currentPeriodEnd,
  onCancelled,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const periodEndDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/razorpay/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel subscription");
      }
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-md w-full rounded-2xl p-6"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1 rounded transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X size={18} />
        </button>

        <h2
          className="font-serif text-[22px] mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Manage subscription
        </h2>

        <p
          className="text-sm mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          You&apos;re on{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            EduMind Pro
          </span>
          , billed via Razorpay (UPI / card / netbanking).
        </p>
        {periodEndDate && (
          <p
            className="text-sm mb-5"
            style={{ color: "var(--text-tertiary)" }}
          >
            Next billing date: {periodEndDate}
          </p>
        )}

        <hr className="ruled-line my-5" />

        {!confirming ? (
          <>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              You can cancel anytime. Your access continues until the end of
              the current billing period.
            </p>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-strong)",
              }}
            >
              Cancel subscription
            </button>
          </>
        ) : (
          <>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Are you sure? You&apos;ll keep Pro access until
              {periodEndDate ? ` ${periodEndDate}` : " the end of your current period"},
              then move to the free plan.
            </p>
            {error && (
              <p
                className="text-sm mb-3"
                style={{ color: "#dc2626" }}
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: "transparent",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                Keep Pro
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#dc2626", color: "white" }}
              >
                {loading ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
