"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { SUBJECTS } from "@/lib/subjects";
import AcademicLayout from "@/components/AcademicLayout";
import posthog from "posthog-js";

// ─── Types ──────────────────────────────────────────────
interface GeneratedQuestion {
  question: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface AnsweredQuestion extends GeneratedQuestion {
  user_answer: string;
  is_correct: boolean;
  timed_out: boolean;
}

type Phase = "setup" | "loading" | "quiz" | "results";
type Difficulty = "auto" | "beginner" | "intermediate" | "advanced";
type QuizType = "multiple_choice" | "true_false" | "fill_blank" | "mixed";

const SUBJECT_OPTIONS = [
  { name: "Mixed/Random", emoji: "🎲" },
  ...SUBJECTS,
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: "auto", label: "Auto", desc: "Based on your assessment" },
  { value: "beginner", label: "Beginner", desc: "Easy and approachable" },
  { value: "intermediate", label: "Intermediate", desc: "Moderate challenge" },
  { value: "advanced", label: "Advanced", desc: "Push your limits" },
];

const QUIZ_TYPE_OPTIONS: { value: QuizType; label: string; emoji: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice", emoji: "🔘" },
  { value: "true_false", label: "True or False", emoji: "✅" },
  { value: "fill_blank", label: "Fill in the Blank", emoji: "✏️" },
  { value: "mixed", label: "Mixed (All Types)", emoji: "🎯" },
];

const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20];

function getTimerForType(type: string): number {
  return type === "fill_blank" ? 45 : 30;
}

function getPerformanceLabel(pct: number): { label: string; emoji: string } {
  if (pct === 100) return { label: "Perfect Score!", emoji: "🏆" };
  if (pct >= 81) return { label: "Excellent!", emoji: "🌟" };
  if (pct >= 61) return { label: "Well Done!", emoji: "⭐" };
  if (pct >= 41) return { label: "Getting There", emoji: "📈" };
  return { label: "Keep Practicing", emoji: "💪" };
}

function getEncouragingMessage(): string {
  const msgs = [
    "Awesome! You nailed it! 🎉",
    "Brilliant work! Keep it up! 💫",
    "That's the way! You're on fire! 🔥",
    "Excellent thinking! 🧠",
    "You're crushing it! 💪",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ─── Countdown Ring SVG (cyan) ──────────────────────────
function CountdownRing({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const offset = circumference * (1 - progress);
  const isLow = timeLeft <= 5;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={isLow ? "#ef4444" : "var(--accent)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className={`absolute text-sm font-bold ${isLow ? "text-red-400" : "text-[var(--accent)]"}`}>
        {timeLeft}
      </span>
    </div>
  );
}

// ─── Main Quiz Content ──────────────────────────────────
function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedSubject = searchParams.get("subject");

  // Setup state
  const [selectedSubject, setSelectedSubject] = useState(preselectedSubject || "Mixed/Random");
  const [difficulty, setDifficulty] = useState<Difficulty>("auto");
  const [quizType, setQuizType] = useState<QuizType>("mixed");
  const [numQuestions, setNumQuestions] = useState(10);

  // Phase state
  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentIsCorrect, setCurrentIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [effectiveDifficulty, setEffectiveDifficulty] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackShownRef = useRef(false);

  // ─── Timer logic ──────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (feedbackShownRef.current) return;
    feedbackShownRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const q = questions[currentIndex];
    setCurrentIsCorrect(false);
    setShowFeedback(true);
    setAnsweredQuestions((prev) => [
      ...prev,
      { ...q, user_answer: "", is_correct: false, timed_out: true },
    ]);
  }, [questions, currentIndex]);

  useEffect(() => {
    if (phase !== "quiz" || showFeedback) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentIndex];
    if (!q) return;
    const totalSec = getTimerForType(q.type);
    setTotalTime(totalSec);
    setTimeLeft(totalSec);
    feedbackShownRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex, showFeedback, questions, handleTimeUp]);

  // ─── Start Quiz ───────────────────────────────────────
  async function handleStartQuiz() {
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/quiz-mode/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          difficulty,
          quizType,
          numQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuestions(data.questions);
      setEffectiveDifficulty(data.difficulty);
      setCurrentIndex(0);
      setAnsweredQuestions([]);
      setCurrentAnswer("");
      setShowFeedback(false);
      setQuizStartTime(Date.now());
      setPhase("quiz");

      posthog.capture("quiz_generated", {
        subject: selectedSubject,
        difficulty,
        num_questions: numQuestions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
      setPhase("setup");
    }
  }

  // ─── Answer submission ────────────────────────────────
  function submitAnswer(answer: string) {
    if (showFeedback || feedbackShownRef.current) return;
    feedbackShownRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const q = questions[currentIndex];
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = q.correct_answer.trim().toLowerCase();
    const isCorrect = normalizedAnswer === normalizedCorrect;

    setCurrentAnswer(answer);
    setCurrentIsCorrect(isCorrect);
    setShowFeedback(true);
    setAnsweredQuestions((prev) => [
      ...prev,
      { ...q, user_answer: answer, is_correct: isCorrect, timed_out: false },
    ]);
  }

  // ─── Next question / finish ───────────────────────────
  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setCurrentAnswer("");
      setShowFeedback(false);
      setCurrentIsCorrect(false);
    }
  }

  async function finishQuiz() {
    setPhase("results");
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
    const score = answeredQuestions.filter((a) => a.is_correct).length;
    const percentage = Math.round((score / questions.length) * 100);

    posthog.capture("quiz_completed", {
      subject: selectedSubject,
      score,
      total: questions.length,
      percentage,
      time_taken: timeTaken,
    });

    // Detect weak topics from wrong answers
    const wrongQs = answeredQuestions.filter((a) => !a.is_correct);
    const weakTopics = [...new Set(wrongQs.map((q) => {
      const words = q.question.split(" ").slice(0, 5).join(" ");
      return words.length > 30 ? words.slice(0, 30) + "..." : words;
    }))].slice(0, 5);

    // Save to Supabase (fire-and-forget)
    try {
      await fetch("/api/quiz-mode/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          difficulty: effectiveDifficulty,
          score,
          total_questions: questions.length,
          percentage,
          weak_topics: weakTopics,
          answers: answeredQuestions.map((a) => ({
            question: a.question,
            type: a.type,
            user_answer: a.user_answer,
            correct_answer: a.correct_answer,
            is_correct: a.is_correct,
            explanation: a.explanation,
            timed_out: a.timed_out,
          })),
          time_taken: timeTaken,
        }),
      });
    } catch {
      // silent — results shown even if save fails
    }
  }

  // ─── Results calculations ─────────────────────────────
  const score = answeredQuestions.filter((a) => a.is_correct).length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const performance = getPerformanceLabel(percentage);
  const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
  const wrongQuestions = answeredQuestions.filter((a) => !a.is_correct);
  const weakTopics = [...new Set(wrongQuestions.map((q) => {
    const words = q.question.split(" ").slice(0, 6).join(" ");
    return words.length > 40 ? words.slice(0, 40) + "..." : words;
  }))].slice(0, 5);

  // ═══════════════════════════════════════════════════════
  // PHASE: SETUP
  // ═══════════════════════════════════════════════════════
  if (phase === "setup") {
    return (
      <AcademicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-[480px]">
            <div className="panel p-10">
              <div className="mb-8">
                <p className="label mb-2">Assessment Mode</p>
                <h1>Test Your Knowledge</h1>
              </div>

              {error && (
                <div className="mb-6 panel p-4" style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}>
                  <p className="text-sm" style={{ color: "rgba(239, 68, 68, 0.9)" }}>{error}</p>
                </div>
              )}

              {/* Subject selector */}
              <div className="mb-8">
                <p className="label mb-3">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((s) => {
                    const active = selectedSubject === s.name;
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setSelectedSubject(s.name)}
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-[300ms] ease-in-out ${
                          active
                            ? "border-[var(--accent)] text-[var(--text-primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                        }`}
                        style={active ? { background: "var(--accent-light)" } : {}}
                      >
                        <span className="mr-1.5">{s.emoji}</span>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty selector */}
              <div className="mb-8">
                <p className="label mb-3">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => {
                    const active = difficulty === d.value;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDifficulty(d.value)}
                        className={`px-5 py-2 rounded-full text-xs font-medium border transition-all duration-[300ms] ease-in-out ${
                          active
                            ? "border-[var(--accent)] text-[var(--text-primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                        }`}
                        style={active ? { background: "var(--accent-light)" } : {}}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question count */}
              <div className="mb-8">
                <p className="label mb-3">Question Count</p>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 20].map((n) => {
                    const active = numQuestions === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNumQuestions(n)}
                        className={`px-5 py-2 rounded-full text-xs font-medium border transition-all duration-[300ms] ease-in-out ${
                          active
                            ? "border-[var(--accent)] text-[var(--text-primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                        }`}
                        style={active ? { background: "var(--accent-light)" } : {}}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartQuiz}
                className="btn-primary w-full"
              >
                Begin Session →
              </button>
            </div>
          </div>
        </div>
      </AcademicLayout>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PHASE: LOADING
  // ═══════════════════════════════════════════════════════
  if (phase === "loading") {
    return (
      <AcademicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="label mb-2">Assessment Mode</p>
            <p className="text-[var(--text-secondary)]">Preparing your session</p>
          </div>
        </div>
      </AcademicLayout>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PHASE: QUIZ (one question at a time)
  // ═══════════════════════════════════════════════════════
  if (phase === "quiz") {
    const q = questions[currentIndex];
    if (!q) return null;

    const progressPct = ((currentIndex + 1) / questions.length) * 100;

    const options =
      q.type === "multiple_choice" && q.options
        ? q.options
        : q.type === "true_false"
          ? ["True", "False"]
          : [];

    return (
      <AcademicLayout>
        {/* Thin progress line at very top */}
        <div className="fixed top-[57px] left-0 right-0 h-[2px] bg-[var(--bg-muted)] z-50">
          <motion.div
            className="h-[2px] bg-[var(--accent)]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <p className="label mb-2">Question {currentIndex + 1} of {questions.length}</p>
            <h1 className="text-center">{q.question}</h1>
          </div>

          <div className="space-y-3">

            {!showFeedback ? (
              <>
                {q.type === "fill_blank" ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && currentAnswer.trim()) {
                          submitAnswer(currentAnswer.trim());
                        }
                      }}
                      placeholder="Type your answer..."
                      className="flex-1 panel px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (currentAnswer.trim()) submitAnswer(currentAnswer.trim());
                      }}
                      disabled={!currentAnswer.trim()}
                      className="btn-primary disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                ) : (
                  <>
                    {options.map((option, idx) => (
                      <motion.button
                        key={option}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut", delay: idx * 0.08 }}
                        onClick={() => submitAnswer(option)}
                        className="w-full text-left panel px-6 py-4 transition-all duration-[300ms] ease-in-out hover:border-[var(--accent)]"
                      >
                        {option}
                      </motion.button>
                    ))}
                  </>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Answer options with underline animations */}
                {q.type === "multiple_choice" && q.options && (
                  <div className="space-y-3">
                    {q.options.map((option) => {
                      const answered = answeredQuestions[currentIndex];
                      const isUser = answered?.user_answer === option;
                      const isCorrect =
                        option.trim().toLowerCase() ===
                        q.correct_answer.trim().toLowerCase();
                      const isWrongChoice = isUser && !isCorrect;
                      
                      return (
                        <div
                          key={option}
                          className="relative"
                        >
                          <div className="panel px-6 py-4">
                            {option}
                          </div>
                          {isCorrect && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="absolute bottom-0 left-0 h-[2px] bg-[var(--accent)]"
                            />
                          )}
                          {isWrongChoice && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="absolute bottom-0 left-0 h-[2px] bg-[rgba(239,68,68,0.6)]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                <div className="panel p-6 mt-6">
                  <p className="text-sm mb-2">
                    {!currentIsCorrect && (
                      <span className="text-[rgba(239,68,68,0.8)]">
                        Correct answer: {q.correct_answer}
                      </span>
                    )}
                  </p>
                  <p>{q.explanation}</p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[300ms] ease-in-out"
                  >
                    {currentIndex + 1 >= questions.length
                      ? "See Results →"
                      : "Next →"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </AcademicLayout>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PHASE: RESULTS
  // ═══════════════════════════════════════════════════════
  if (phase === "results") {
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    return (
      <AcademicLayout>
        <div className="space-y-[40px]">
          {/* Score Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-center"
          >
            <h1 className="text-5xl mb-2">{score}/{questions.length}</h1>
            <p className="text-[var(--text-secondary)] mb-1">{performance.label}</p>
            <p className="text-sm text-[var(--text-tertiary)]">
              {percentage}% correct · Completed in {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
            </p>
          </motion.div>

          {/* Weak areas */}
          {weakTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
              className="panel p-6"
            >
              <h3 className="mb-4">Areas to Review</h3>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="panel px-3 py-1.5 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut", delay: 0.15 }}
            className="flex flex-wrap gap-3"
          >
            {weakTopics.length > 0 && (
              <Link
                href={`/chat?subject=${encodeURIComponent(selectedSubject === "Mixed/Random" ? "" : selectedSubject)}`}
                className="btn-primary flex-1 min-w-[140px] text-center"
              >
                Study Weak Areas →
              </Link>
            )}
            <button
              onClick={() => {
                setPhase("setup");
                setQuestions([]);
                setAnsweredQuestions([]);
                setCurrentIndex(0);
                setShowFeedback(false);
                setCurrentAnswer("");
                setError(null);
              }}
              className="btn-primary flex-1 min-w-[140px]"
            >
              Retake Quiz
            </button>
          </motion.div>
        </div>
      </AcademicLayout>
    );
  }

  return null;
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-[var(--bg-base)]">
          <div style={{ color: "var(--text-tertiary)" }}>Loading...</div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
