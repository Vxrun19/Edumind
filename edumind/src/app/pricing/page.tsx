"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, XCircle } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { PLANS } from "@/lib/plans";
import AcademicLayout from "@/components/AcademicLayout";
import { RazorpayCheckoutButton } from "@/components/RazorpayCheckoutButton";
import { RazorpayManageModal } from "@/components/RazorpayManageModal";
import posthog from "posthog-js";

type Interval = "monthly" | "yearly";
type Region = "india" | "international";

export default function PricingPage() {
  const [region, setRegion] = useState<Region>("india");
  const [interval, setInterval] = useState<Interval>("monthly");
  const [loading, setLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const { isPro, paymentProvider, currentPeriodEnd, refresh } =
    useSubscription();
  const { isSignedIn } = useUser();
  const router = useRouter();

  // ─── Prices ─────────────────────────────────────────────
  const inrMonthly = PLANS.pro.priceInrMonthly;
  const inrYearly = PLANS.pro.priceInrYearly;
  const usdMonthly = PLANS.pro.priceUsdMonthly;
  const usdYearly = PLANS.pro.priceUsdYearly;

  // Display value (price-per-month) for the selected region + interval
  const displayCurrency = region === "india" ? "₹" : "$";
  const displayPrice =
    region === "india"
      ? interval === "monthly"
        ? inrMonthly
        : Math.round(inrYearly / 12)
      : interval === "monthly"
        ? usdMonthly
        : +(usdYearly / 12).toFixed(2);
  const billingCaption =
    region === "india"
      ? interval === "monthly"
        ? "billed monthly"
        : `billed ₹${inrYearly}/year`
      : interval === "monthly"
        ? "billed monthly"
        : `billed $${usdYearly}/year`;

  // ─── Stripe upgrade flow (International) ───────────────
  function handleStripeUpgrade() {
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }
    posthog.capture("upgrade_clicked", { interval, region });
    const priceId =
      interval === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY;
    router.push(`/checkout?priceId=${priceId}`);
  }

  // ─── Manage subscription (branch on provider) ──────────
  async function handleManage() {
    if (paymentProvider === "razorpay") {
      setManageOpen(true);
      return;
    }
    // Default to Stripe portal (covers explicit 'stripe' and legacy null
    // rows for pre-existing Stripe subscribers).
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // ─── Feature lists (unchanged) ─────────────────────────
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

  // ─── Pro card CTA button ───────────────────────────────
  const proButtonBaseClass =
    "mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50";
  const proButtonStyle = { background: "var(--accent)", color: "white" };

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

      {/* Region toggle */}
      <div className="flex justify-center mb-4">
        <div
          className="inline-flex items-center rounded-full p-1"
          style={{
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setRegion("india")}
            className="px-5 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: region === "india" ? "var(--accent)" : "transparent",
              color: region === "india" ? "white" : "var(--text-secondary)",
            }}
          >
            India (INR)
          </button>
          <button
            onClick={() => setRegion("international")}
            className="px-5 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background:
                region === "international" ? "var(--accent)" : "transparent",
              color:
                region === "international" ? "white" : "var(--text-secondary)",
            }}
          >
            International (USD)
          </button>
        </div>
      </div>

      {/* Interval toggle */}
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
              background:
                interval === "monthly" ? "var(--accent)" : "transparent",
              color: interval === "monthly" ? "white" : "var(--text-secondary)",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background:
                interval === "yearly" ? "var(--accent)" : "transparent",
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
            <span className="font-serif text-4xl font-bold text-[var(--text-primary)]">
              {displayCurrency}0
            </span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-5">forever</p>

          <hr className="ruled-line mb-5" />

          <ul className="space-y-3 flex-1">
            {freeFeatures.map((f) => (
              <li
                key={f.text}
                className="flex items-start gap-2.5 text-sm"
              >
                {f.included ? (
                  <CheckCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                ) : (
                  <XCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--text-tertiary)", opacity: 0.4 }}
                  />
                )}
                <span
                  style={{
                    color: f.included
                      ? "var(--text-secondary)"
                      : "var(--text-tertiary)",
                  }}
                >
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

          <div
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: "var(--accent)" }}
          >
            Pro
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-serif text-4xl font-bold text-[var(--text-primary)]">
              {displayCurrency}
              {displayPrice}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">/mo</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-5">
            {billingCaption}
          </p>

          <hr className="ruled-line mb-5" />

          <ul className="space-y-3 flex-1">
            {proFeatures.map((f) => (
              <li
                key={f.text}
                className="flex items-start gap-2.5 text-sm"
              >
                <CheckCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <span style={{ color: "var(--text-secondary)" }}>{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Pro CTA */}
          {isPro ? (
            <button
              onClick={handleManage}
              disabled={loading}
              className={proButtonBaseClass}
              style={proButtonStyle}
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
          ) : !isSignedIn ? (
            <button
              onClick={() => router.push("/sign-up")}
              className={proButtonBaseClass}
              style={proButtonStyle}
            >
              {"Sign up to upgrade →"}
            </button>
          ) : region === "india" ? (
            <RazorpayCheckoutButton
              interval={interval}
              label={"Upgrade to Pro →"}
              className={proButtonBaseClass}
              style={proButtonStyle}
            />
          ) : (
            <button
              onClick={handleStripeUpgrade}
              disabled={loading}
              className={proButtonBaseClass}
              style={proButtonStyle}
            >
              {"Upgrade to Pro →"}
            </button>
          )}
        </div>
      </div>

      {/* Manage link (Pro only) */}
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

      {/* Razorpay manage modal — only opens for Razorpay-billed Pro users */}
      <RazorpayManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        currentPeriodEnd={currentPeriodEnd}
        onCancelled={refresh}
      />

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
              Yes, absolutely. Cancel from this page (or the billing portal for
              Stripe customers) and your access continues until the end of your
              billing period.
            </p>
          </div>
          <div className="notebook-panel border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              What payment methods are supported?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              In India: UPI AutoPay, cards, and netbanking via Razorpay.
              Internationally: cards via Stripe. Choose your region above.
            </p>
          </div>
          <div className="notebook-panel border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              What happens when I downgrade?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              You keep Pro access until the end of your billing period. After
              that, you&apos;ll be on the free plan with its limits.
            </p>
          </div>
          <div className="notebook-panel border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Is there a student discount?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Email us at varunpatelai@gmail.com and we&apos;ll work something out.
            </p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center mt-10">
        <p className="text-xs text-[var(--text-tertiary)]">
          Payments powered by Razorpay (India) and Stripe (international).
          Cancel anytime.
        </p>
      </div>
    </AcademicLayout>
  );
}
