"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

/* ─── Question options ─────────────────────────────────────── */

const TRACKS = [
  {
    id: "jee",
    title: "JEE",
    subtitle: "Physics, Chemistry, Mathematics",
    emoji: "🛠️",
  },
  {
    id: "neet",
    title: "NEET",
    subtitle: "Physics, Chemistry, Biology",
    emoji: "🧬",
  },
  {
    id: "both",
    title: "Still deciding",
    subtitle: "Between JEE and NEET",
    emoji: "🤔",
  },
] as const;

type TrackId = (typeof TRACKS)[number]["id"];

const YEARS = [
  { id: "2026", label: "2026" },
  { id: "2027", label: "2027" },
  { id: "2028", label: "2028" },
  { id: "unsure", label: "Not sure yet" },
] as const;

type YearId = (typeof YEARS)[number]["id"];

/* Builds the goal string stored in the StudentProfile. The chat
 * system prompt reads this back as exam-prep context. */
function buildGoal(track: TrackId, year: YearId): string {
  const examLabel =
    track === "jee" ? "JEE" : track === "neet" ? "NEET" : "JEE or NEET (still deciding)";
  if (year === "unsure") {
    return `Preparing for ${examLabel} (target year not set yet)`;
  }
  return `Preparing for ${examLabel} ${year}`;
}

/* ─── Component ────────────────────────────────────────────── */

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [displayName, setDisplayName] = useState(user?.firstName || "");
  const [track, setTrack] = useState<TrackId | "">("");
  const [year, setYear] = useState<YearId | "">("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleFinish() {
    if (!track || !year) return;
    setIsSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || user?.firstName || "Aspirant",
          // Defaults for legacy profile fields the chat system prompt still
          // reads; chosen to match the JEE/NEET audience without re-asking.
          age_group: "16-19",
          goals: [buildGoal(track, year)],
          learning_style: "Explain simply with examples",
          level: "Some basics",
        }),
      });

      posthog.capture("onboarding_completed", {
        track,
        target_year: year,
      });

      router.push("/dashboard");
    } catch {
      setIsSaving(false);
    }
  }

  const canProceed: Record<0 | 1 | 2, boolean> = {
    0: displayName.trim().length > 0,
    1: track !== "",
    2: year !== "",
  };

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        {/* Progress dots — 3 steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i <= step ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>

        {/* ─── Step 0: Welcome + name ───────────────────────── */}
        {step === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Welcome to EduMind.
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Three quick questions and the tutor will know how to help you.
            </p>

            <div className="text-left">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* ─── Step 1: Track ────────────────────────────────── */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Which exam are you preparing for?
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Both share Physics and Chemistry. JEE adds Maths; NEET adds Biology.
            </p>

            <div className="space-y-2.5">
              {TRACKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTrack(t.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    track === t.id
                      ? "bg-[var(--accent-light)] border-[var(--accent)] shadow-[var(--shadow-sm)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="flex-1">
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color:
                          track === t.id
                            ? "var(--accent)"
                            : "var(--text-primary)",
                      }}
                    >
                      {t.title}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {t.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 2: Target year ──────────────────────────── */}
        {step === 2 && (
          <div className="text-center">
            <div className="text-5xl mb-4">📅</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              When&apos;s your exam?
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              We&apos;ll pace your study around your target.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {YEARS.map((y) => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => setYear(y.id)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    year === y.id
                      ? "bg-[var(--accent-light)] border-[var(--accent)] shadow-[var(--shadow-sm)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div
                    className="text-sm font-semibold"
                    style={{
                      color:
                        year === y.id
                          ? "var(--accent)"
                          : "var(--text-primary)",
                    }}
                  >
                    {y.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Navigation ───────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep((step - 1) as 0 | 1 | 2)}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              onClick={() => setStep((step + 1) as 0 | 1 | 2)}
              disabled={!canProceed[step]}
              className="font-medium px-6 py-2.5 rounded-xl transition-all text-sm bg-[var(--accent)] text-white shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:shadow-none"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canProceed[2] || isSaving}
              className="font-medium px-8 py-3 rounded-xl transition-all text-sm bg-[var(--accent)] text-white shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:shadow-none"
            >
              {isSaving ? "Saving..." : "Start studying →"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
