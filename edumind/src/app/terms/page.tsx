import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "EduMind terms of service. Rules of use and legal terms.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p
            className="font-sans text-sm mt-2 mb-8"
            style={{ color: "var(--text-tertiary)" }}
          >
            Last updated: February 2026
          </p>

          <div className="space-y-8">
            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                1. Acceptance of Terms
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                By accessing or using EduMind, you agree to be bound by these terms.
                If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                2. Use of Service
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                EduMind is an AI-powered educational tool. You must be at least 13
                years old to use the service. You are responsible for maintaining the
                security of your account credentials. You agree not to misuse the
                service, attempt to bypass usage limits, or use automated systems to
                access the platform.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                3. AI-Generated Content
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                EduMind uses artificial intelligence to generate educational content.
                While we strive for accuracy, AI responses may contain errors. EduMind
                is a supplementary learning tool and should not replace professional
                instruction, medical advice, legal counsel, or other professional
                guidance.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                4. Subscriptions and Payments
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Free accounts are available with usage limits. Pro subscriptions are
                billed monthly or yearly through Stripe. You may cancel at any time
                and retain access through the end of your billing period. Refunds are
                handled on a case-by-case basis.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                5. Limitation of Liability
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                EduMind is provided &ldquo;as is&rdquo; without warranty of any kind.
                We are not liable for any damages arising from your use of the
                service, including but not limited to academic outcomes, reliance on
                AI-generated content, or service interruptions.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                6. Governing Law
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                These terms are governed by and construed in accordance with the laws
                of the Province of Ontario, Canada, without regard to conflict of law
                principles.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                7. Contact
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                For questions about these terms, contact us at hello@edumind.app.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
