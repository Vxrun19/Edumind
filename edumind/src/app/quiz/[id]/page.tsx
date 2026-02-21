"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Quiz, QuizQuestion } from "@/lib/supabase";

interface GradedAnswer {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  ai_feedback?: string;
}

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gradedAnswers, setGradedAnswers] = useState<GradedAnswer[]>([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function loadQuiz() {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/quiz/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setQuiz(data.quiz ?? null);
      setQuestions(data.questions ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleSelectAnswer(questionId: string, answer: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (isSubmitting || submitted) return;

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(
        `Please answer all questions. You have ${unanswered.length} unanswered.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/quiz/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(
            ([question_id, user_answer]) => ({
              question_id,
              user_answer,
            })
          ),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setGradedAnswers(data.gradedAnswers);
      setScore(data.score);
      setTotal(data.total);
      setPercentage(data.percentage);
      setSubmitted(true);

      // Scroll to top to see results
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(
        "Something went wrong grading your quiz. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)]">
        <div className="text-[var(--text-tertiary)]">Loading quiz...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] gap-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Something went wrong
        </h2>
        <p className="text-[var(--text-secondary)] text-sm text-center max-w-sm">
          We couldn&apos;t load this quiz. This might be a temporary issue — please try again.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={loadQuiz}
            className="bg-[var(--accent)] hover:opacity-90 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all"
          >
            Try Again
          </button>
          <Link
            href="/quizzes"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] gap-4">
        <div className="text-4xl">😵</div>
        <p className="text-[var(--text-secondary)]">Quiz not found</p>
        <Link href="/quizzes" className="text-[var(--accent)] hover:underline text-sm">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  const scoreColor =
    percentage >= 80
      ? "text-[#10b981]"
      : percentage >= 60
        ? "text-amber-400"
        : "text-red-400";

  const scoreEmoji =
    percentage === 100
      ? "🏆"
      : percentage >= 80
        ? "🎉"
        : percentage >= 60
          ? "👍"
          : percentage >= 40
            ? "💪"
            : "📚";

  const scoreMessage =
    percentage === 100
      ? "Perfect score! You've mastered this material!"
      : percentage >= 80
        ? "Great job! You really know this stuff!"
        : percentage >= 60
          ? "Good effort! A little more practice and you'll nail it."
          : percentage >= 40
            ? "Keep going! Review the explanations below to improve."
            : "Don't worry — learning takes time. Review the material and try again!";

  return (
    <main className="min-h-[calc(100vh-57px)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/quizzes"
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            ← All Quizzes
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-2">
            {quiz.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 rounded-full">
              {quiz.subject}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                quiz.difficulty === "easy"
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : quiz.difficulty === "hard"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {quiz.difficulty}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {quiz.total_questions} questions
            </span>
          </div>
        </div>

        {/* Score banner (after submit) */}
        {submitted && (
          <div
            className={`rounded-2xl p-6 mb-8 shadow-[var(--shadow-sm)] ${
              percentage >= 80
                ? "bg-gradient-to-r from-[#10b981] to-emerald-500"
                : percentage >= 60
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-red-500 to-pink-500"
            } text-white`}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{scoreEmoji}</span>
              <div>
                <p className={`text-3xl font-bold`}>
                  {score}/{total} ({percentage}%)
                </p>
                <p className="text-white/80 text-sm mt-1">{scoreMessage}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setGradedAnswers([]);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                Retry Quiz
              </button>
              <button
                onClick={() => router.push("/quizzes")}
                className="text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                All Quizzes
              </button>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, qi) => {
            const graded = gradedAnswers.find(
              (g) => g.question_id === q.id
            );
            const userAnswer = answers[q.id] || "";

            return (
              <div
                key={q.id}
                className={`notebook-panel border rounded-xl p-5 transition-all ${
                  submitted
                    ? graded?.is_correct
                      ? "border-[#10b981]/40 bg-[#10b981]/5"
                      : "border-red-500/40 bg-red-500/5"
                    : "border-[var(--border)]"
                }`}
              >
                {/* Question header */}
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      submitted
                        ? graded?.is_correct
                          ? "bg-[#10b981] text-white"
                          : "bg-red-500 text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {submitted ? (graded?.is_correct ? "✓" : "✗") : qi + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase">
                        {q.question_type === "multiple_choice"
                          ? "Multiple Choice"
                          : "Open Ended"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {q.question_text}
                    </p>
                  </div>
                </div>

                {/* Answer area */}
                {q.question_type === "multiple_choice" ? (
                  <div className="space-y-2 ml-10">
                    {q.options.map((option) => {
                      const optionLetter = option.charAt(0);
                      const isSelected = userAnswer === optionLetter;
                      const isCorrectOption =
                        submitted &&
                        optionLetter ===
                          graded?.correct_answer?.charAt(0);
                      const isWrongSelection =
                        submitted && isSelected && !graded?.is_correct;

                      return (
                        <button
                          key={option}
                          onClick={() =>
                            handleSelectAnswer(q.id, optionLetter)
                          }
                          disabled={submitted}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all border ${
                            submitted
                              ? isCorrectOption
                                ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] font-medium"
                                : isWrongSelection
                                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                                  : "border-[var(--border)] text-[var(--text-tertiary)]"
                              : isSelected
                                ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                                : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ml-10">
                    <textarea
                      value={userAnswer}
                      onChange={(e) =>
                        handleSelectAnswer(q.id, e.target.value)
                      }
                      disabled={submitted}
                      placeholder="Type your answer here..."
                      rows={3}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-tertiary)]"
                    />
                  </div>
                )}

                {/* Explanation (after submit) */}
                {submitted && graded && (
                  <div className="ml-10 mt-3 p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]">
                    {graded.ai_feedback && (
                      <p className="text-sm text-[var(--text-secondary)] mb-2">
                        <span className="font-semibold">Feedback:</span>{" "}
                        {graded.ai_feedback}
                      </p>
                    )}
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold">Explanation:</span>{" "}
                      {graded.explanation}
                    </p>
                    {q.question_type === "open_ended" && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        <span className="font-semibold">Expected answer:</span>{" "}
                        {graded.correct_answer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitted && (
          <div className="mt-8 text-center">
            {submitError && (
              <div className="mb-4 mx-auto max-w-md bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--text-primary)] rounded-xl px-8 py-3 text-sm font-medium transition-all"
            >
              {isSubmitting ? "Grading..." : submitError ? "Try Again" : "Submit Quiz"}
            </button>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              {Object.keys(answers).length}/{questions.length} questions
              answered
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
