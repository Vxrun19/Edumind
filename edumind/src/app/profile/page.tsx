"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { StudentProfile } from "@/lib/supabase";

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
  "Explain simply with examples",
  "Give me the theory first",
  "Teach me step by step",
  "Challenge me with questions",
  "Mix it up",
];

const LEVELS = [
  "Complete beginner",
  "Some basics",
  "Intermediate",
  "Pretty advanced",
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.profile) {
          const p = data.profile as StudentProfile;
          setProfile(p);
          setDisplayName(p.display_name);
          setAgeGroup(p.age_group);
          setSelectedGoals(p.goals || []);
          setLearningStyle(p.learning_style);
          setLevel(p.level);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function toggleGoal(goalId: string) {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          age_group: ageGroup,
          goals: selectedGoals,
          learning_style: learningStyle,
          level,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-[var(--bg-base)]">
        <div className="text-[var(--text-tertiary)]">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    router.push("/onboarding");
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Learning Preferences
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            Update your profile to personalize how EduMind teaches you.
          </p>
        </div>

        <div className="space-y-8">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Age Group
            </label>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((age) => (
                <button
                  key={age}
                  onClick={() => setAgeGroup(age)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    ageGroup === age
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Learning Goals
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    selectedGoals.includes(goal.id)
                      ? "bg-[var(--accent-light)] border-[var(--accent)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <span className="text-lg">{goal.emoji}</span>
                  <span
                    className={`text-xs font-medium ml-2 ${selectedGoals.includes(goal.id) ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}
                  >
                    {goal.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Learning Style */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Learning Style
            </label>
            <div className="space-y-2">
              {LEARNING_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setLearningStyle(style)}
                  className={`w-full p-3 rounded-xl border text-left text-sm transition-colors ${
                    learningStyle === style
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)] font-medium"
                      : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Current Level
            </label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    level === lvl
                      ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--bg-base)] font-medium px-8 py-3 rounded-xl transition-colors text-sm"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Saved successfully!
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
