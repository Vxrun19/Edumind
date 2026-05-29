"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shuffle,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
  Check,
  X as XIcon,
  type LucideIcon,
} from "lucide-react";
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
// QuizType state is preserved (passed to API) but no longer user-selectable
// in the UI. The default "mixed" gives balanced question types.
type QuizType = "multiple_choice" | "true_false" | "fill_blank" | "mixed";

const SUBJECT_CHOICES: ReadonlyArray<{
  name: string;
  label: string;
  Icon: LucideIcon;
}> = [
  { name: "Mixed/Random", label: "Mixed", Icon: Shuffle },
  { name: "Physics", label: "Physics", Icon: Atom },
  { name: "Chemistry", label: "Chemistry", Icon: FlaskConical },
  { name: "Mathematics", label: "Mathematics", Icon: Calculator },
  { name: "Biology", label: "Biology", Icon: Dna },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const NUM_QUESTIONS_OPTIONS = [5, 10, 20];

function getTimerForType(type: string): number {
  return type === "fill_blank" ? 45 : 30;
}

// Performance label (emoji removed — was returned in original but never
// rendered in the JSX anyway; dropped from the return type).
function getPerformanceLabel(pct: number): string {
  if (pct === 100) return "Perfect score";
  if (pct >= 81) return "Excellent";
  if (pct >= 61) return "Well done";
  if (pct >= 41) return "Getting there";
  return "Keep practising";
}

// ─── Main Quiz Content ──────────────────────────────────
function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedSubject = searchParams.get("subject");

  // Setup state
  const [selectedSubject, setSelectedSubject] = useState(
    preselectedSubject || "Mixed/Random"
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("auto");
  // quizType stays "mixed" — the UI no longer exposes a selector
  // (selector was defined as a dead constant in the original), but the
  // value still gets passed to the API to keep balanced question types.
  const [quizType] = useState<QuizType>("mixed");
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
    const weakTopics = [
      ...new Set(
        wrongQs.map((q) => {
          const words = q.question.split(" ").slice(0, 5).join(" ");
          return words.length > 30 ? words.slice(0, 30) + "…" : words;
        })
      ),
    ].slice(0, 5);

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
  const percentage =
    questions.length > 0
      ? Math.round((score / questions.length) * 100)
      : 0;
  const performanceLabel = getPerformanceLabel(percentage);
  const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
  const wrongQuestions = answeredQuestions.filter((a) => !a.is_correct);
  const weakTopics = [
    ...new Set(
      wrongQuestions.map((q) => {
        const words = q.question.split(" ").slice(0, 6).join(" ");
        return words.length > 40 ? words.slice(0, 40) + "…" : words;
      })
    ),
  ].slice(0, 5);

  // ═══════════════════════════════════════════════════════
  // PHASE: SETUP
  // ═══════════════════════════════════════════════════════
  if (phase === "setup") {
    return (
      <AcademicLayout>
        <div className="w-full max-w-[560px] mx-auto">
          {/* Editorial header — outside the card */}
          <div className="text-center mb-8 md:mb-10">
            <span className="label">Quiz</span>
            <h1
              className="font-serif font-normal mt-3"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.15,
                letterSpacing: "-0.015em",
              }}
            >
              Test what you know.
            </h1>
            <p
              className="font-sans text-[14px] mt-3 mx-auto max-w-[420px]"
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.55,
              }}
            >
              Pick a subject, difficulty, and number of questions.
            </p>
          </div>

          {/* Setup form card */}
          <div
            className="p-7 md:p-9"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {error && (
              <div
                className="mb-6 p-3 px-4"
                style={{
                  background: "var(--error-bg)",
                  border: "1px solid var(--error)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p
                  className="font-sans text-[13px]"
                  style={{ color: "var(--error)" }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Subject selector — chips with Lucide icons */}
            <div className="mb-7">
              <p className="label mb-3">Subject</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_CHOICES.map(({ name, label, Icon }) => {
                  const active = selectedSubject === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedSubject(name)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 font-sans text-[13px] font-medium transition-all duration-200"
                      style={{
                        background: active
                          ? "var(--accent-light)"
                          : "var(--bg-surface)",
                        border: active
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        borderRadius: "var(--radius-pill)",
                        color: active
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-7">
              <p className="label mb-3">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map((d) => {
                  const active = difficulty === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDifficulty(d.value)}
                      className="px-4 py-2 font-sans text-[13px] font-medium transition-all duration-200"
                      style={{
                        background: active
                          ? "var(--accent-light)"
                          : "var(--bg-surface)",
                        border: active
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        borderRadius: "var(--radius-pill)",
                        color: active
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question count */}
            <div className="mb-8">
              <p className="label mb-3">Questions</p>
              <div className="flex flex-wrap gap-2">
                {NUM_QUESTIONS_OPTIONS.map((n) => {
                  const active = numQuestions === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumQuestions(n)}
                      className="px-5 py-2 font-sans text-[13px] font-medium transition-all duration-200"
                      style={{
                        background: active
                          ? "var(--accent-light)"
                          : "var(--bg-surface)",
                        border: active
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        borderRadius: "var(--radius-pill)",
                        color: active
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
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
              Start quiz →
            </button>
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
            <span className="label">Quiz</span>
            <p
              className="font-sans text-[14px] mt-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Generating your questions…
            </p>
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

    // Timer state for the small countdown shown under the question
    const timerIsLow = timeLeft <= 5;

    return (
      <AcademicLayout>
        {/* Sticky progress bar at the very top of the viewport, just
         *  under the 56px AcademicLayout header (56 + 1px border = 57). */}
        <div
          className="fixed top-[57px] left-0 right-0 z-50"
          style={{ height: 2, background: "var(--bg-muted)" }}
        >
          <motion.div
            style={{ height: 2, background: "var(--accent)" }}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        <div className="space-y-7 md:space-y-9">
          {/* Question header */}
          <div className="text-center">
            <span
              className="label"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              Question {currentIndex + 1} of {questions.length}
            </span>
            <h1
              className="font-serif font-normal mt-3 mx-auto"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(20px, 3vw, 28px)",
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
                maxWidth: "640px",
              }}
            >
              {q.question}
            </h1>

            {/* Subtle timer indicator — only visible during answer phase */}
            {!showFeedback && (
              <p
                className="font-sans text-[12px] mt-3"
                style={{
                  color: timerIsLow
                    ? "var(--error)"
                    : "var(--text-tertiary)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.05em",
                }}
              >
                {timeLeft}s / {totalTime}s
              </p>
            )}
          </div>

          {/* Answer area */}
          <div className="space-y-3">
            {!showFeedback ? (
              <>
                {q.type === "fill_blank" ? (
                  <div className="flex gap-2 max-w-[640px] mx-auto">
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && currentAnswer.trim()) {
                          submitAnswer(currentAnswer.trim());
                        }
                      }}
                      placeholder="Type your answer…"
                      className="flex-1 font-sans text-[14px] focus:outline-none transition-colors duration-200 focus:border-[color:var(--accent)] focus:[box-shadow:0_0_0_3px_var(--accent-light)]"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "12px 16px",
                        color: "var(--text-primary)",
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (currentAnswer.trim())
                          submitAnswer(currentAnswer.trim());
                      }}
                      disabled={!currentAnswer.trim()}
                      className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ fontSize: 14, padding: "11px 22px" }}
                    >
                      Submit
                    </button>
                  </div>
                ) : (
                  <div className="max-w-[640px] mx-auto space-y-2.5">
                    {options.map((option, idx) => (
                      <motion.button
                        key={option}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeInOut",
                          delay: idx * 0.06,
                        }}
                        onClick={() => submitAnswer(option)}
                        className="w-full text-left transition-all duration-200 hover:-translate-y-[1px]"
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-lg)",
                          padding: "14px 20px",
                          fontSize: 15,
                          color: "var(--text-primary)",
                          boxShadow: "var(--shadow-xs)",
                          fontFamily: "var(--font-serif)",
                          lineHeight: 1.5,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--border)";
                        }}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-3 max-w-[640px] mx-auto"
              >
                {/* Answer options with feedback colors */}
                {q.type === "multiple_choice" && q.options && (
                  <div className="space-y-2.5">
                    {q.options.map((option) => {
                      const answered = answeredQuestions[currentIndex];
                      const isUser = answered?.user_answer === option;
                      const isCorrectOpt =
                        option.trim().toLowerCase() ===
                        q.correct_answer.trim().toLowerCase();
                      const isWrongChoice = isUser && !isCorrectOpt;

                      // Three visual states:
                      // - Correct (whether user picked it or not): success
                      // - User's wrong pick: error
                      // - Other untouched: neutral panel
                      let bg = "var(--bg-surface)";
                      let borderColor = "var(--border)";
                      let textColor = "var(--text-primary)";
                      let icon: React.ReactNode = null;

                      if (isCorrectOpt) {
                        bg = "var(--success-bg)";
                        borderColor = "var(--success)";
                        textColor = "var(--text-primary)";
                        icon = (
                          <Check
                            size={16}
                            style={{
                              color: "var(--success)",
                              flexShrink: 0,
                            }}
                          />
                        );
                      } else if (isWrongChoice) {
                        bg = "var(--error-bg)";
                        borderColor = "var(--error)";
                        textColor = "var(--text-primary)";
                        icon = (
                          <XIcon
                            size={16}
                            style={{
                              color: "var(--error)",
                              flexShrink: 0,
                            }}
                          />
                        );
                      }

                      return (
                        <div
                          key={option}
                          className="flex items-center justify-between gap-3"
                          style={{
                            background: bg,
                            border: `1px solid ${borderColor}`,
                            borderRadius: "var(--radius-lg)",
                            padding: "14px 20px",
                            color: textColor,
                            fontSize: 15,
                            fontFamily: "var(--font-serif)",
                            lineHeight: 1.5,
                          }}
                        >
                          <span>{option}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True/false feedback */}
                {q.type === "true_false" && (
                  <div className="space-y-2.5">
                    {(["True", "False"] as const).map((option) => {
                      const answered = answeredQuestions[currentIndex];
                      const isUser = answered?.user_answer === option;
                      const isCorrectOpt =
                        option.trim().toLowerCase() ===
                        q.correct_answer.trim().toLowerCase();
                      const isWrongChoice = isUser && !isCorrectOpt;

                      let bg = "var(--bg-surface)";
                      let borderColor = "var(--border)";
                      let icon: React.ReactNode = null;

                      if (isCorrectOpt) {
                        bg = "var(--success-bg)";
                        borderColor = "var(--success)";
                        icon = (
                          <Check
                            size={16}
                            style={{
                              color: "var(--success)",
                              flexShrink: 0,
                            }}
                          />
                        );
                      } else if (isWrongChoice) {
                        bg = "var(--error-bg)";
                        borderColor = "var(--error)";
                        icon = (
                          <XIcon
                            size={16}
                            style={{
                              color: "var(--error)",
                              flexShrink: 0,
                            }}
                          />
                        );
                      }

                      return (
                        <div
                          key={option}
                          className="flex items-center justify-between gap-3"
                          style={{
                            background: bg,
                            border: `1px solid ${borderColor}`,
                            borderRadius: "var(--radius-lg)",
                            padding: "14px 20px",
                            fontSize: 15,
                            fontFamily: "var(--font-serif)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <span>{option}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill-blank feedback */}
                {q.type === "fill_blank" && (
                  <div
                    className="flex items-center gap-3"
                    style={{
                      background: currentIsCorrect
                        ? "var(--success-bg)"
                        : "var(--error-bg)",
                      border: `1px solid ${currentIsCorrect ? "var(--success)" : "var(--error)"}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "14px 20px",
                      fontSize: 15,
                      fontFamily: "var(--font-serif)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span className="flex-1">
                      Your answer:{" "}
                      <strong>
                        {answeredQuestions[currentIndex]?.user_answer || "—"}
                      </strong>
                      {!currentIsCorrect && (
                        <>
                          {" · Correct: "}
                          <strong>{q.correct_answer}</strong>
                        </>
                      )}
                    </span>
                    {currentIsCorrect ? (
                      <Check
                        size={16}
                        style={{ color: "var(--success)", flexShrink: 0 }}
                      />
                    ) : (
                      <XIcon
                        size={16}
                        style={{ color: "var(--error)", flexShrink: 0 }}
                      />
                    )}
                  </div>
                )}

                {/* Explanation card */}
                <div
                  className="mt-4 p-5"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid var(--accent)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <span
                    className="label"
                    style={{ color: "var(--accent)" }}
                  >
                    Explanation
                  </span>
                  <p
                    className="font-serif text-[14px] mt-2"
                    style={{
                      color: "var(--text-primary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {q.explanation}
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary"
                    style={{ fontSize: 14, padding: "11px 22px" }}
                  >
                    {currentIndex + 1 >= questions.length
                      ? "See results →"
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
        <div className="space-y-8 md:space-y-10">
          {/* Score hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <span className="label">Result</span>
            <div
              className="font-serif mt-3"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(56px, 9vw, 96px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score}<span style={{ color: "var(--text-tertiary)" }}>/{questions.length}</span>
            </div>
            <p
              className="font-serif text-[18px] md:text-[20px] mt-4"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
              }}
            >
              {performanceLabel}.
            </p>
            <p
              className="font-sans text-[13px] mt-2"
              style={{
                color: "var(--text-tertiary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {percentage}% correct · completed in{" "}
              {minutes > 0 ? `${minutes}m ` : ""}
              {seconds}s
            </p>
          </motion.div>

          {/* Weak areas */}
          {weakTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.12,
              }}
              className="p-6 md:p-7"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-2xl)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <span className="label">Areas to review</span>
              <div className="flex flex-wrap gap-2 mt-4">
                {weakTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="font-sans text-[12px]"
                    style={{
                      background: "var(--bg-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-pill)",
                      padding: "6px 12px",
                      color: "var(--text-secondary)",
                    }}
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
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {weakTopics.length > 0 && (
              <Link
                href={`/chat?subject=${encodeURIComponent(
                  selectedSubject === "Mixed/Random" ? "" : selectedSubject
                )}`}
                className="btn-primary flex-1 min-w-[140px] text-center"
                style={{ fontSize: 14, padding: "12px 22px" }}
              >
                Study weak areas →
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setPhase("setup");
                setQuestions([]);
                setAnsweredQuestions([]);
                setCurrentIndex(0);
                setShowFeedback(false);
                setCurrentAnswer("");
                setError(null);
              }}
              className="btn-secondary flex-1 min-w-[140px]"
              style={{ fontSize: 14, padding: "11px 22px" }}
            >
              Retake quiz
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
        <div
          className="flex items-center justify-center h-[calc(100vh-57px)]"
          style={{ background: "var(--bg-base)" }}
        >
          <div
            className="font-sans text-[13px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Loading…
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
