import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "EduMind refund and cancellation policy. How subscriptions work, how to cancel, and our refund stance.",
};

export default function RefundPolicyPage() {
  return (
    <main
      className="min-h-screen px-4 py-20"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="font-sans text-sm mb-8 inline-block transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          &larr; Back to home
        </Link>

        <div
          className="notebook-panel p-8 md:p-12"
          style={{ border: "1px solid var(--border)" }}
        >
          <h1
            className="font-serif text-[32px]"
            style={{ color: "var(--text-primary)" }}
          >
            Refund &amp; Cancellation Policy
          </h1>
          <p
            className="font-sans text-sm mt-2 mb-8"
            style={{ color: "var(--text-tertiary)" }}
          >
            Last updated: May 2026
          </p>

          <div className="space-y-8">
            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                1. What you pay for
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                EduMind Pro is a recurring software subscription that gives
                you access to our AI tutoring service for JEE and NEET
                preparation. Indian customers are billed in INR via Razorpay
                (UPI AutoPay, cards, or netbanking) at ₹399/month or
                ₹2,999/year. International customers are billed in USD via
                Stripe. The free plan is available with usage limits and
                requires no payment.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                2. Cancellation
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                You can cancel your subscription at any time from the
                <Link
                  href="/pricing"
                  style={{ color: "var(--accent)" }}
                  className="hover:underline"
                >
                  {" "}
                  Pricing page
                </Link>
                . Cancellation takes effect at the end of your current billing
                period &mdash; you retain full Pro access until then, and you
                will not be charged again. After the period ends, your account
                moves to the free plan automatically. No prior notice or
                customer-service confirmation is required.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                3. Refunds
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Subscription fees are non-refundable for partial billing
                periods. When you cancel, you keep access until the end of the
                period you have already paid for, and no further charges are
                made &mdash; we do not pro-rate refunds for unused days in the
                current period. This is standard practice for online
                subscription software.
              </p>
              <p
                className="font-sans text-sm leading-relaxed mt-3"
                style={{ color: "var(--text-secondary)" }}
              >
                We will, however, review refund requests on a case-by-case
                basis in good faith for clear errors &mdash; for example: an
                accidental duplicate charge, a charge after an attempted
                cancellation that didn&apos;t register, or being billed despite
                never being able to use the service due to a verified outage.
                If approved, the refund is processed back to the original
                payment method (typically 5&ndash;10 working days for UPI /
                card refunds via Razorpay, or 5&ndash;10 business days via
                Stripe).
              </p>
              <p
                className="font-sans text-sm leading-relaxed mt-3"
                style={{ color: "var(--text-secondary)" }}
              >
                To request a refund, email{" "}
                <a
                  href="mailto:varunpatelai@gmail.com"
                  style={{ color: "var(--accent)" }}
                  className="hover:underline"
                >
                  varunpatelai@gmail.com
                </a>{" "}
                from the email address on your account, with the date and
                approximate amount of the charge.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                4. Failed payments
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                If a renewal payment fails &mdash; for example, your UPI
                mandate drops, your card expires, or your bank declines the
                charge &mdash; we&apos;ll keep your account on Pro for a short
                grace period and notify you. If the payment isn&apos;t
                recovered, the account will move to the free plan. You can
                resubscribe at any time without losing your data.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                5. Free plan
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                The free plan is just that &mdash; free. There is nothing to
                cancel or refund. You can use it indefinitely with its usage
                limits.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                6. Contact
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                For any billing or subscription question, email{" "}
                <a
                  href="mailto:varunpatelai@gmail.com"
                  style={{ color: "var(--accent)" }}
                  className="hover:underline"
                >
                  varunpatelai@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
