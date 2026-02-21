"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function StreakBadge() {
  const { isSignedIn } = useUser();
  const [streak, setStreak] = useState<number | null>(null);
  const [hasQuizToday, setHasQuizToday] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const [progressRes, quizHistoryRes] = await Promise.all([
          fetch("/api/progress"),
          fetch("/api/quiz-mode/history?limit=5"),
        ]);
        const progressData = await progressRes.json();
        setStreak(progressData.streak?.current_streak ?? 0);

        const quizData = await quizHistoryRes.json();
        const today = new Date().toDateString();
        const quizToday = (quizData.results ?? []).some(
          (r: { created_at: string }) =>
            new Date(r.created_at).toDateString() === today
        );
        setHasQuizToday(quizToday);
      } catch {
        // ignore
      }
    })();
  }, [isSignedIn]);

  if (!isSignedIn || streak === null) return null;

  return (
    <Link
      href="/progress"
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors duration-150 hover:bg-[var(--bg-muted)]"
      style={{ color: "var(--text-secondary)" }}
      title={`${streak} day streak${hasQuizToday ? " + Quiz Bonus!" : ""}`}
    >
      <span>🔥</span>
      <span>{streak}</span>
      {hasQuizToday && (
        <span
          className="ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
          style={{
            background: "var(--accent-light)",
            color: "var(--accent)",
          }}
        >
          🎯
        </span>
      )}
    </Link>
  );
}
