"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

const AGE_GROUPS = ["Under 10", "10-13", "14-17", "18-25", "25+"];

const GOALS = [
  { id: "homework", label: "School homework", emoji: "📚" },
  { id: "coding", label: "Learn coding", emoji: "💻" },
  { id: "personal", label: "Personal growth", emoji: "🌱" },
  { id: "career", label: "Career skills", emoji: "💼" },
  { id: "curious", label: "Just curious", emoji: "🔍" },
  { id: "other", label: "Other", emoji: "✨" },
];

const LEARNING_STYLES = [
  {
    id: "simple",
    label: "Explain simply with examples",
    desc: "Use analogies and real-life examples",
  },
  {
    id: "theory",
    label: "Give me the theory first",
    desc: "Concepts before examples",
  },
  {
    id: "stepbystep",
    label: "Teach me step by step",
    desc: "Numbered steps, one at a time",
  },
  {
    id: "challenge",
    label: "Challenge me with questions",
    desc: "Ask questions to make me think",
  },
  {
    id: "mix",
    label: "Mix it up",
    desc: "A bit of everything depending on the topic",
  },
];

const LEVELS = [
  "Complete beginner",
  "Some basics",
  "Intermediate",
  "Pretty advanced",
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.firstName || "");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState("");
  const [level, setLevel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function toggleGoal(goalId: string) {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  }

  async function handleFinish() {
    setIsSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || user?.firstName || "Learner",
          age_group: ageGroup,
          goals: selectedGoals,
          learning_style: learningStyle,
          level,
        }),
      });

      posthog.capture("onboarding_completed", {
        age_group: ageGroup,
        goals: selectedGoals,
        learning_style: learningStyle,
        level,
      });

      router.push("/dashboard");
    } catch {
      setIsSaving(false);
    }
  }

  const canProceed = [
    displayName.trim() && ageGroup,
    selectedGoals.length > 0,
    learningStyle,
    level,
  ];

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === step
                  ? "bg-[var(--accent)]"
                  : i < step
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--bg-surface)]"
              }`}
            />
          ))}
        </div>

        {/* ─── Step 0: Name + Age ─── */}
        {step === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Welcome to EduMind!
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Let&apos;s personalize your learning experience.
            </p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  What&apos;s your name?
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  How old are you?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_GROUPS.map((age) => (
                    <button
                      key={age}
                      onClick={() => setAgeGroup(age)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        ageGroup === age
                          ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] shadow-[var(--shadow-sm)]"
                          : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 1: Goals ─── */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Why are you here?
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Pick all that apply — this helps us tailor your experience.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedGoals.includes(goal.id)
                      ? "bg-[var(--accent-light)] border-[var(--accent)] shadow-[var(--shadow-sm)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="text-2xl mb-1">{goal.emoji}</div>
                  <div
                    className={`text-sm font-medium ${selectedGoals.includes(goal.id) ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
                  >
                    {goal.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 2: Learning Style ─── */}
        {step === 2 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              How do you like to learn?
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Pick the style that feels most natural to you.
            </p>

            <div className="space-y-2">
              {LEARNING_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setLearningStyle(style.label)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    learningStyle === style.label
                      ? "bg-[var(--accent-light)] border-[var(--accent)] shadow-[var(--shadow-sm)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${learningStyle === style.label ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
                  >
                    {style.label}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {style.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 3: Level ─── */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-5xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              What&apos;s your current level?
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              This helps us pitch explanations at the right level.
            </p>

            <div className="space-y-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    level === lvl
                      ? "bg-[var(--accent-light)] border-[var(--accent)] shadow-[var(--shadow-sm)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${level === lvl ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
                  >
                    {lvl}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed[step]}
              className="font-medium px-6 py-2.5 rounded-xl transition-all text-sm bg-[var(--accent)] text-[var(--bg-base)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:shadow-none"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!level || isSaving}
              className="font-medium px-8 py-3 rounded-xl transition-all text-sm bg-[var(--accent)] text-[var(--bg-base)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:shadow-none"
            >
              {isSaving ? "Saving..." : "Let's Go! 🚀"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
