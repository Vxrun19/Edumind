"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import posthog from "posthog-js";

function ReturnContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const provider = searchParams.get("provider");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    // ─── Razorpay return ──────────────────────────────────
    // Razorpay's modal calls our handler immediately on success, but the
    // webhook (subscription.activated) is the source of truth and may
    // take a couple of seconds to land. Poll /api/subscription for
    // plan='pro' up to ~16 seconds, then bail out to error.
    if (provider === "razorpay") {
      let cancelled = false;
      let attempts = 0;
      const maxAttempts = 8;
      const poll = async () => {
        if (cancelled) return;
        try {
          const res = await fetch("/api/subscription");
          if (res.ok) {
            const data = await res.json();
            if (data.plan === "pro") {
              setStatus("success");
              posthog.capture("upgrade_completed", { provider: "razorpay" });
              return;
            }
          }
        } catch {
          /* ignore — retry */
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setStatus("error");
        }
      };
      poll();
      return () => {
        cancelled = true;
      };
    }

    // ─── Stripe return (existing) ─────────────────────────
    if (!sessionId) {
      router.replace("/pricing");
      return;
    }

    fetch(`/api/stripe/checkout-session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "complete") {
          setStatus("success");
          posthog.capture("upgrade_completed", { provider: "stripe" });
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId, provider, router]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--accent)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="notebook-panel p-12 max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--accent-light, rgba(74, 124, 89, 0.1))" }}
          >
            <CheckCircle size={32} style={{ color: "var(--accent)" }} />
          </div>
          <h1
            className="text-3xl font-serif mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome to Pro.
          </h1>
          <p
            className="text-sm mb-8 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Your account has been upgraded. Unlimited learning starts now.
          </p>
          <Link
            href="/dashboard"
            className="inline-block text-white text-sm font-medium px-8 py-3 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Start Learning &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="notebook-panel p-12 max-w-md w-full text-center">
        <h1
          className="text-2xl font-serif mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Payment not completed
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Your card was not charged.
        </p>
        <Link
          href="/pricing"
          className="text-sm hover:underline"
          style={{ color: "var(--accent)" }}
        >
          &larr; Back to pricing
        </Link>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-base)" }}
        >
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: "var(--accent)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
