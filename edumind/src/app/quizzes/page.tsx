"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { SUBJECTS } from "@/lib/subjects";
import type { QuizWithAttempt } from "@/lib/supabase";

function getSubjectEmoji(subject: string): string {
  if (subject === "General") return "📝";
  return SUBJECTS.find((s) => s.name === subject)?.emoji ?? "📝";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizWithAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/quiz");
        const data = await res.json();
        setQuizzes(data.quizzes ?? []);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-[var(--bg-base)]">
        <div className="text-[var(--text-tertiary)]">Loading quizzes...</div>
      </div>
    );
  }

  // Stats
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(
    (q) => q.attempts_count && q.attempts_count > 0
  ).length;
  const avgScore =
    completedQuizzes > 0
      ? Math.round(
          quizzes
            .filter((q) => q.best_score !== undefined)
            .reduce((s, q) => s + (q.best_score ?? 0), 0) / completedQuizzes
        )
      : 0;
  const perfectScores = quizzes.filter((q) => q.best_score === 100).length;

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quizzes</h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Test your knowledge and track your scores
            </p>
          </div>
        </div>

        {/* Stats row */}
        {totalQuizzes > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {totalQuizzes}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Total Quizzes</p>
            </div>
            <div className="bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {completedQuizzes}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Completed</p>
            </div>
            <div className="bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{avgScore}%</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Avg Score</p>
            </div>
            <div className="bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {perfectScores}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Perfect Scores</p>
            </div>
          </div>
        )}

        {/* Quiz list */}
        {quizzes.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-muted)] backdrop-blur-md rounded-xl border border-[var(--border)]">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No quizzes yet
            </h2>
            <p className="text-[var(--text-tertiary)] text-sm mb-4 max-w-sm mx-auto">
              Start a chat conversation, then click the &quot;Quiz Me&quot;
              button to generate a quiz based on what you learned!
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity"
            >
              Start Learning →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => {
              const hasAttempt =
                quiz.attempts_count !== undefined && quiz.attempts_count > 0;
              const scoreColor =
                !hasAttempt
                  ? "text-[var(--text-tertiary)]"
                  : (quiz.best_score ?? 0) >= 80
                    ? "text-[#10b981]"
                    : (quiz.best_score ?? 0) >= 60
                      ? "text-amber-400"
                      : "text-red-400";

              return (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="notebook-panel border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 hover:border-[var(--accent)]/50 transition-colors block"
                >
                  <div className="text-2xl shrink-0">
                    {getSubjectEmoji(quiz.subject)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {quiz.subject}
                      </span>
                      <span className="text-[var(--text-tertiary)]">·</span>
                      <span
                        className={`text-xs font-medium ${
                          quiz.difficulty === "easy"
                            ? "text-[#10b981]"
                            : quiz.difficulty === "hard"
                              ? "text-red-400"
                              : "text-amber-400"
                        }`}
                      >
                        {quiz.difficulty}
                      </span>
                      <span className="text-[var(--text-tertiary)]">·</span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {quiz.total_questions} Qs
                      </span>
                      <span className="text-[var(--text-tertiary)]">·</span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatDate(quiz.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {hasAttempt ? (
                      <div>
                        <p className={`text-lg font-bold ${scoreColor}`}>
                          {quiz.best_score}%
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          {quiz.attempts_count}{" "}
                          {quiz.attempts_count === 1 ? "attempt" : "attempts"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/20 border border-[var(--accent)]/40 px-3 py-1.5 rounded-full">
                        Take Quiz
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
