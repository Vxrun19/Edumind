import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "EduMind privacy policy. How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
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
                1. Information We Collect
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                We collect information you provide when creating an account (name,
                email address), your learning preferences, conversation history with
                the AI tutor, quiz results, and progress data. We also collect
                standard usage data such as device type and browser information.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                2. How We Use Your Data
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Your data is used to personalize your learning experience, adapt the
                AI tutor to your level and style, track your progress, generate
                relevant quizzes, and improve our service. We do not sell your
                personal data to third parties.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                3. Data Storage and Security
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Your data is stored securely using industry-standard encryption.
                We use Supabase for data storage and Clerk for authentication, both
                of which maintain SOC 2 compliance. Payment information is processed
                by Stripe and never stored on our servers.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                4. Third-Party Services
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                We use Anthropic (Claude) for AI tutoring, Clerk for authentication,
                Supabase for data storage, Stripe for payments, and Vercel for
                hosting. Each service has its own privacy policy governing how they
                handle data.
              </p>
            </section>

            <section>
              <h2
                className="font-sans text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                5. Your Rights
              </h2>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                You may request access to, correction of, or deletion of your
                personal data at any time by contacting us at hello@edumind.app.
                You can delete your account and all associated data from your
                profile settings.
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
                For questions about this privacy policy, contact us at
                hello@edumind.app.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
