"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, XCircle } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { PLANS } from "@/lib/plans";
import AcademicLayout from "@/components/AcademicLayout";
import posthog from "posthog-js";

type Interval = "monthly" | "yearly";

export default function PricingPage() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [loading, setLoading] = useState(false);
  const { isPro } = useSubscription();
  const { isSignedIn } = useUser();
  const router = useRouter();

  const monthlyPrice = PLANS.pro.price;
  const yearlyMonthly = +(PLANS.pro.priceYearly / 12).toFixed(2);
  const displayPrice = interval === "monthly" ? monthlyPrice : yearlyMonthly;
  const billingCaption = interval === "monthly" ? "billed monthly" : `billed $${PLANS.pro.priceYearly}/year`;

  function handleUpgrade() {
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }

    posthog.capture("upgrade_clicked", { interval });

    const priceId =
      interval === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY;

    router.push(`/checkout?priceId=${priceId}`);
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const freeFeatures = [
    { text: "20 messages per day", included: true },
    { text: "3 quizzes per day", included: true },
    { text: "6 free courses", included: true },
    { text: "Progress tracking", included: true },
    { text: "Learning streaks", included: true },
    { text: "Pro courses (6 courses)", included: false },
    { text: "Voice mode", included: false },
    { text: "Full assessment", included: false },
    { text: "Unlimited everything", included: false },
  ];

  const proFeatures = [
    { text: "Unlimited messages", included: true },
    { text: "Unlimited quizzes", included: true },
    { text: "All 12 courses", included: true },
    { text: "Voice mode", included: true },
    { text: "Full assessment", included: true },
    { text: "Priority AI responses", included: true },
    { text: "Everything in Free", included: true },
  ];

  return (
    <AcademicLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3"
          style={{ color: "var(--accent)" }}
        >
          PLANS
        </div>
        <h1
          className="font-serif text-[32px] md:text-[40px] leading-tight mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Simple, honest pricing.
        </h1>
        <p className="text-[var(--text-tertiary)] text-base max-w-md mx-auto">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-10">
        <div
          className="inline-flex items-center rounded-full p-1"
          style={{
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setInterval("monthly")}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: interval === "monthly" ? "var(--accent)" : "transparent",
              color: interval === "monthly" ? "white" : "var(--text-secondary)",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: interval === "yearly" ? "var(--accent)" : "transparent",
              color: interval === "yearly" ? "white" : "var(--text-secondary)",
            }}
          >
            Yearly <span className="text-xs opacity-80">(save 33%)</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* FREE CARD */}
        <div
          className="notebook-panel border border-[var(--border)] rounded-2xl p-6 flex flex-col"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-2">
            Free
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-serif text-4xl font-bold text-[var(--text-primary)]">$0</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-5">forever</p>

          <hr className="ruled-line mb-5" />

          <ul className="space-y-3 flex-1">
            {freeFeatures.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                {f.included ? (
                  <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-tertiary)", opacity: 0.4 }} />
                )}
                <span style={{ color: f.included ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            disabled
            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              color: "var(--text-tertiary)",
              cursor: isPro ? "default" : "not-allowed",
            }}
          >
            {isPro ? "Free Plan" : "Current Plan"}
          </button>
        </div>

        {/* PRO CARD */}
        <div
          className="notebook-panel rounded-2xl p-6 flex flex-col relative"
          style={{
            background: "var(--bg-surface)",
            border: "2px solid var(--accent)",
          }}
        >
          {/* Badge */}
          <div className="absolute -top-3 right-6">
            <span
              className="text-[10px] uppercase tracking-[0.1em] font-bold px-3 py-1 rounded-full text-white"
              style={{ background: "var(--accent)" }}
            >
              Most Popular
            </span>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>
            Pro
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-serif text-4xl font-bold text-[var(--text-primary)]">
              ${displayPrice}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">/mo</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-5">{billingCaption}</p>

          <hr className="ruled-line mb-5" />

          <ul className="space-y-3 flex-1">
            {proFeatures.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{f.text}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <button
              onClick={handleManage}
              disabled={loading}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "white",
              }}
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "white",
              }}
            >
              {loading ? "Loading..." : "Upgrade to Pro \u2192"}
            </button>
          )}
        </div>
      </div>

      {/* Manage link */}
      {isPro && (
        <div className="text-center mt-6">
          <button
            onClick={handleManage}
            className="text-sm transition-all hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            Manage your subscription &rarr;
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-14 max-w-2xl mx-auto">
        <h2 className="font-serif text-xl text-[var(--text-primary)] mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-5">
          <div className="notebook-panel border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Can I cancel anytime?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Yes, absolutely. You can cancel your subscription at any time from the billing portal. No questions asked.
            </p>
          </div>
          <div className="notebook-panel border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              What happens when I downgrade?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              You keep Pro access until the end of your billing period. After that, you&apos;ll be on the free plan with its limits.
            </p>
          </div>
          <div className="notebook-panel border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Is there a student discount?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Email us at hello@edumind.app and we&apos;ll work something out.
            </p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center mt-10">
        <p className="text-xs text-[var(--text-tertiary)]">
          Payments powered by Stripe. Cancel anytime.
        </p>
      </div>
    </AcademicLayout>
  );
}
