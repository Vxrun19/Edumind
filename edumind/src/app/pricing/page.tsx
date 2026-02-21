"use client";

import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with AI-powered learning",
    features: [
      "5 AI conversations per day",
      "Basic learning assessment",
      "Access to trending topics",
      "Progress tracking",
    ],
    cta: "Get Started",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "Unlock the full EduMind experience",
    features: [
      "Unlimited AI conversations",
      "Full learning assessment",
      "All courses & lessons",
      "Advanced quiz generation",
      "Personalized insights",
      "Voice input & output",
      "Priority support",
    ],
    cta: "Coming Soon",
    href: "#",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$8",
    period: "/user/month",
    description: "For classrooms and study groups",
    features: [
      "Everything in Pro",
      "Team dashboard",
      "Shared courses",
      "Teacher analytics",
      "Bulk onboarding",
    ],
    cta: "Coming Soon",
    href: "#",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[40px] leading-tight font-semibold text-[var(--text-primary)] mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-[var(--text-tertiary)] text-lg max-w-md mx-auto">
            Start learning for free. Upgrade when you need more.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-[var(--accent)] bg-[var(--accent-light)] shadow-[var(--shadow-sm)]"
                  : "border-[var(--border)] bg-[var(--bg-surface)]"
              }`}
            >
              {plan.highlighted && (
                <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[var(--accent)] mb-4">
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                <span className="text-sm text-[var(--text-tertiary)]">{plan.period}</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">{plan.description}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--accent)] mt-0.5 shrink-0">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-[var(--accent)] text-[var(--bg-base)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)]"
                    : "bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ or note */}
        <div className="text-center mt-12">
          <p className="text-sm text-[var(--text-tertiary)]">
            Payments powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </main>
  );
}
