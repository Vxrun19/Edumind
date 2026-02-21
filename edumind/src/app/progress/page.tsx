"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { SUBJECTS } from "@/lib/subjects";
import Link from "next/link";
import type {
  UserProgress,
  UserStreak,
  LearningMemory,
  LearningInsight,
  QuizWithAttempt,
  LearningAssessment,
  QuizResult,
  CourseProgress,
} from "@/lib/supabase";
import { COURSES } from "@/lib/courses";
import AcademicLayout from "@/components/AcademicLayout";

function getSubjectEmoji(subject: string): string {
  if (subject === "Free Chat") return "💬";
  return SUBJECTS.find((s) => s.name === subject)?.emoji ?? "💬";
}

function getLevel(msgs: number): { label: string; color: string } {
  if (msgs > 100) return { label: "Master", color: "text-amber-400" };
  if (msgs > 60) return { label: "Advanced", color: "text-purple-400" };
  if (msgs > 30) return { label: "Learner", color: "text-green-400" };
  if (msgs > 10) return { label: "Explorer", color: "text-blue-400" };
  return { label: "Beginner", color: "text-gray-400" };
}

/** Level badge gradient classes: Beginner=gray, Explorer=blue, Learner=green, Advanced=purple, Master=gold */
function getLevelBadgeGradient(label: string): string {
  switch (label) {
    case "Master": return "from-amber-400 to-yellow-500 text-[var(--text-primary)]";
    case "Advanced": return "from-purple-400 to-violet-500 text-[var(--text-primary)]";
    case "Learner": return "from-green-400 to-emerald-500 text-[var(--text-primary)]";
    case "Explorer": return "from-blue-400 to-cyan-400 text-[var(--text-primary)]";
    default: return "from-gray-400 to-gray-500 text-[var(--text-primary)]";
  }
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start studying today to begin your streak!";
  if (streak === 1) return "Great start! Come back tomorrow to keep it going!";
  if (streak < 3) return "You're building momentum. Keep it up!";
  if (streak < 7) return "Impressive consistency! You're on a roll!";
  if (streak < 14) return "A week-long streak — you're unstoppable!";
  if (streak < 30) return "Two weeks strong! Learning is becoming a habit!";
  return "Incredible dedication! You're a true scholar!";
}

// Derive a learning personality from behavior patterns
function deriveLearningPersonality(
  memories: LearningMemory[],
  insight: LearningInsight | null
): { label: string; emoji: string; description: string } {
  const behaviors = memories
    .filter((m) => m.memory_type === "behavior")
    .map((m) => m.content.toLowerCase());
  const preferences = memories
    .filter((m) => m.memory_type === "preference")
    .map((m) => m.content.toLowerCase());
  const all = [...behaviors, ...preferences].join(" ");

  const asksQuestions =
    all.includes("question") || all.includes("curious") || all.includes("why");
  const wantsExamples =
    all.includes("example") || all.includes("visual") || all.includes("show");
  const goesDeep =
    all.includes("detail") ||
    all.includes("deep") ||
    all.includes("thorough") ||
    all.includes("long");
  const likesSimple =
    all.includes("simple") ||
    all.includes("short") ||
    all.includes("brief") ||
    all.includes("concise");
  const isExcited =
    all.includes("excited") ||
    all.includes("cool") ||
    all.includes("wow") ||
    all.includes("interest");

  if (asksQuestions && goesDeep)
    return {
      label: "Deep Diver",
      emoji: "🤿",
      description:
        "You love asking questions and going deep into topics. Curiosity is your superpower!",
    };
  if (asksQuestions)
    return {
      label: "Question Asker",
      emoji: "❓",
      description:
        "You learn by asking great questions. Keep challenging ideas!",
    };
  if (wantsExamples)
    return {
      label: "Visual Learner",
      emoji: "👁️",
      description:
        "You learn best through examples and visuals. Seeing is understanding for you!",
    };
  if (goesDeep)
    return {
      label: "Deep Thinker",
      emoji: "🧠",
      description:
        "You love understanding things thoroughly. You don't settle for surface-level knowledge!",
    };
  if (likesSimple)
    return {
      label: "Efficient Learner",
      emoji: "⚡",
      description:
        "You prefer clear, concise explanations. You value efficiency and clarity!",
    };
  if (isExcited)
    return {
      label: "Enthusiastic Explorer",
      emoji: "🚀",
      description:
        "You bring energy and excitement to learning. Your enthusiasm is contagious!",
    };

  if (insight?.attention_span === "long")
    return {
      label: "Marathon Learner",
      emoji: "🏃",
      description:
        "You have excellent focus and can learn for long stretches. Stay hydrated!",
    };
  if (insight?.attention_span === "short")
    return {
      label: "Sprint Learner",
      emoji: "💨",
      description:
        "You learn in quick, focused bursts. Short and powerful study sessions are your strength!",
    };

  return {
    label: "Curious Mind",
    emoji: "✨",
    description:
      "You're building your learning identity. Keep exploring and your style will emerge!",
  };
}

export default function ProgressPage() {
  const { user } = useUser();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [memories, setMemories] = useState<LearningMemory[]>([]);
  const [insight, setInsight] = useState<LearningInsight | null>(null);
  const [quizzes, setQuizzes] = useState<QuizWithAttempt[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [assessment, setAssessment] = useState<LearningAssessment | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [progressRes, memoryRes, insightRes, quizRes, assessmentRes, quizHistoryRes, courseProgressRes] =
          await Promise.all([
            fetch("/api/progress"),
            fetch("/api/memory?limit=50"),
            fetch("/api/insights"),
            fetch("/api/quiz"),
            fetch("/api/assessment"),
            fetch("/api/quiz-mode/history?limit=20"),
            fetch("/api/courses/progress"),
          ]);
        const progressData = await progressRes.json();
        const memoryData = await memoryRes.json();
        const insightData = await insightRes.json();
        const quizData = await quizRes.json();
        const assessmentData = await assessmentRes.json();
        const quizHistoryData = await quizHistoryRes.json();
        const courseProgressData = await courseProgressRes.json();

        setProgress(progressData.progress ?? []);
        setStreak(progressData.streak ?? null);
        setMemories(memoryData.memories ?? []);
        setInsight(insightData.insight ?? null);
        setQuizzes(quizData.quizzes ?? []);
        setAssessment(assessmentData.assessment ?? null);
        setQuizHistory(quizHistoryData.results ?? []);
        setCourseProgress(courseProgressData.progress ?? []);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const totalMessages = progress.reduce((s, p) => s + p.messages_sent, 0);
  const totalSessions = progress.reduce((s, p) => s + p.sessions_count, 0);
  const totalSubjects = progress.length;

  // Quiz stats
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(
    (q) => q.attempts_count && q.attempts_count > 0
  ).length;
  const avgQuizScore =
    completedQuizzes > 0
      ? Math.round(
          quizzes
            .filter((q) => q.best_score !== undefined)
            .reduce((s, q) => s + (q.best_score ?? 0), 0) / completedQuizzes
        )
      : 0;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  // Categorize memories for Learning DNA
  const mastered = memories.filter((m) => m.memory_type === "topic_mastered");
  const struggling = memories.filter(
    (m) => m.memory_type === "topic_struggling"
  );
  const interests = memories.filter((m) => m.memory_type === "interest");
  const personality = deriveLearningPersonality(memories, insight);

  // Build a timeline from progress data (subjects explored and when)
  const timeline = progress
    .filter((p) => p.last_active)
    .sort(
      (a, b) =>
        new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    )
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-[var(--bg-base)]">
        <div className="text-[var(--text-tertiary)]">Loading progress...</div>
      </div>
    );
  }

  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;

  return (
    <AcademicLayout>
      <div>
        {/* ─── Streak Hero: large gradient orange-to-amber, fire emoji with CSS pulse ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-[var(--text-primary)] mb-8 shadow-sm border border-[var(--border)]"
        >
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <span
                className="text-6xl animate-pulse"
                style={{ animationDuration: "1.5s" }}
                aria-hidden
              >
                🔥
              </span>
              <div>
                <p className="text-4xl font-bold tracking-tight">
                  {currentStreak} Day Streak!
                </p>
                <p className="text-orange-100 text-sm mt-1">
                  {getStreakMessage(currentStreak)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-200/90 text-xs uppercase tracking-wider">
                Longest Streak
              </p>
              <p className="text-3xl font-bold">{longestStreak} days</p>
            </div>
          </div>
          <div className="mt-5 flex gap-6 text-sm text-orange-100">
            <span>
              📅 {streak?.total_days_studied ?? 0} total days studied
            </span>
          </div>
        </motion.div>

        {/* ─── Learning DNA: colored topic tags ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            🧬 Your Learning DNA
          </h2>

          {/* Personality card */}
          <div className="notebook-panel border border-[var(--border)] rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{personality.emoji}</span>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {personality.label}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {personality.description}
                </p>
              </div>
            </div>

            {/* Insight pills - colored tags */}
            {insight && (
              <div className="flex flex-wrap gap-2 mt-3">
                {insight.attention_span !== "medium" && (
                  <span className="text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full">
                    {insight.attention_span === "short" ? "⚡" : "🏔️"}{" "}
                    {insight.attention_span} attention span
                  </span>
                )}
                {insight.preferred_time_of_day !== "unknown" && (
                  <span className="text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full">
                    {insight.preferred_time_of_day === "morning"
                      ? "🌅"
                      : insight.preferred_time_of_day === "afternoon"
                        ? "☀️"
                        : "🌙"}{" "}
                    {insight.preferred_time_of_day} studier
                  </span>
                )}
                {insight.most_active_subject !== "General" && (
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                    📚 Loves {insight.most_active_subject}
                  </span>
                )}
                {insight.avg_session_length > 0 && (
                  <span className="text-xs font-medium bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                    💬 ~{insight.avg_session_length} msgs/session
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interests discovered - colored tags */}
          {interests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                ❤️ Interests Discovered
              </h3>
              <div className="flex flex-wrap gap-2">
                {interests.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-500/40 px-3 py-1.5 rounded-full"
                  >
                    {m.content}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics mastered - colored tags */}
          {mastered.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                ✅ Topics Mastered
              </h3>
              <div className="flex flex-wrap gap-2">
                {mastered.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full"
                  >
                    {m.content}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics to work on - colored tags */}
          {struggling.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                🔄 Topics to Work On
              </h3>
              <div className="flex flex-wrap gap-2">
                {struggling.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full"
                  >
                    {m.content}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning timeline - clean with colored dots */}
          {timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                📅 Learning Journey Timeline
              </h3>
              <div className="relative pl-6 border-l-2 border-[var(--border-strong)] space-y-4">
                {timeline.map((p) => {
                  const date = new Date(p.last_active);
                  const dateStr = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <div key={p.id} className="relative">
                      <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-[var(--bg-base)] bg-[var(--accent)]" />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getSubjectEmoji(p.subject)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {p.subject}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {dateStr} at {timeStr} · {p.messages_sent} messages
                            · {p.sessions_count} sessions
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state for Learning DNA */}
          {memories.length === 0 && (
            <div className="text-center py-8 notebook-panel rounded-2xl border border-[var(--border)]">
              <div className="text-4xl mb-3">🧬</div>
              <p className="text-[var(--text-tertiary)] text-sm">
                Your Learning DNA is being built! Have a few conversations and
                EduMind will learn your style, interests, and strengths.
              </p>
            </div>
          )}
        </motion.div>

        {/* ─── Assessment-Based Learning DNA ─────────────── */}
        {assessment && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                🧬 Your Learning DNA (Assessment)
              </h2>
              <Link
                href="/assessment"
                className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
              >
                Retake →
              </Link>
            </div>

            {/* Persona banner - glass */}
            <div className="notebook-panel border border-violet-200 rounded-2xl p-6 mb-4">
              <p className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider mb-1">Your Learning Persona</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{assessment.learning_persona}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {assessment.personality_words.map((word) => (
                  <span
                    key={word}
                    className="text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Assessment detail cards - glass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-1">Learner Type</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                  {assessment.learner_type.replace("_", " ")}
                </p>
              </div>
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-1">Attention Span</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {assessment.cognitive_style?.attention_span || "—"}
                </p>
              </div>
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-1">Motivated By</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{assessment.motivation_type}</p>
              </div>
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-1">Preferred Session</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{assessment.study_habits?.session_length || "—"}</p>
              </div>
            </div>

            {/* Subject confidence from assessment */}
            {assessment.subject_levels && Object.keys(assessment.subject_levels).length > 0 && (
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4 mb-4">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-3">Self-Rated Subject Confidence</p>
                <div className="space-y-2.5">
                  {Object.entries(assessment.subject_levels)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([subj, val]) => {
                      const numVal = val as number;
                      const barColor = numVal >= 70 ? "bg-emerald-500" : numVal >= 40 ? "bg-amber-400" : "bg-red-400";
                      return (
                        <div key={subj}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">{subj}</span>
                            <span className="text-xs font-bold text-[var(--text-tertiary)]">{numVal}%</span>
                          </div>
                          <div className="w-full bg-[var(--bg-muted)] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${numVal}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Wants to improve</p>
                    <p className="text-xs font-semibold text-[var(--accent)]">{assessment.subject_most_improve}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Finds hardest</p>
                    <p className="text-xs font-semibold text-red-400">{assessment.subject_hardest}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Enjoys most</p>
                    <p className="text-xs font-semibold text-emerald-600">{assessment.subject_most_enjoyed}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Goal */}
            {assessment.goals?.main_goal && (
              <div className="notebook-panel border border-[var(--accent)] rounded-xl p-4">
                <p className="text-xs text-[var(--accent)] font-medium uppercase tracking-wider mb-1">Main Learning Goal</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{assessment.goals.main_goal}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Daily commitment: {assessment.goals.daily_time}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Subject Mastery: bars animate 0→value, level badge gradients ───── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Subject Mastery
          </h2>

          {progress.length === 0 ? (
            <div className="text-center py-12 notebook-panel rounded-2xl border border-[var(--border)]">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-[var(--text-tertiary)]">
                No subjects explored yet. Start a chat to track your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {progress.map((p, idx) => {
                const level = getLevel(p.messages_sent);
                const barWidth = Math.min(100, p.messages_sent);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    className="notebook-panel border border-[var(--border)] rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xl">
                          {getSubjectEmoji(p.subject)}
                        </span>
                        <span className="font-medium text-[var(--text-primary)] text-sm">
                          {p.subject}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${getLevelBadgeGradient(level.label)}`}
                        >
                          {level.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                        <span>{p.sessions_count} sessions</span>
                        <span>{p.messages_sent} messages</span>
                      </div>
                    </div>

                    {/* Progress bar - animates from 0 to value on load */}
                    <div className="w-full bg-[var(--bg-muted)] rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-sky-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + idx * 0.05, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-[var(--text-tertiary)]">0</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {p.messages_sent >= 100
                          ? "100+ (Master)"
                          : `${p.messages_sent}/100`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ─── Quiz Performance ─────────────────────────── */}
        {totalQuizzes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              📝 Quiz Performance
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalQuizzes}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Quizzes Created</p>
              </div>
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{completedQuizzes}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Completed</p>
              </div>
              <div className="notebook-panel border border-[var(--border)] rounded-xl p-4 text-center">
                <p
                  className={`text-2xl font-bold ${
                    avgQuizScore >= 80
                      ? "text-emerald-600"
                      : avgQuizScore >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {avgQuizScore}%
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Avg Score</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Quiz History: clean timeline with colored dots ─────────────────────────────── */}
        {quizHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                🎯 Quiz History
              </h2>
              <Link
                href="/quiz"
                className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
              >
                Take New Quiz →
              </Link>
            </div>

            {/* Bar chart - last 10 quizzes - glass */}
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-4 mb-4">
              <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-3">
                Recent Performance
              </p>
              <div className="flex items-end gap-1.5 h-24">
                {quizHistory.slice(0, 10).reverse().map((qr, i) => {
                  const barColor =
                    qr.percentage >= 80
                      ? "bg-emerald-500"
                      : qr.percentage >= 60
                        ? "bg-amber-400"
                        : "bg-red-400";
                  return (
                    <div
                      key={qr.id || i}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${qr.subject}: ${qr.percentage}%`}
                    >
                      <span className="text-[9px] text-[var(--text-tertiary)] font-medium">
                        {qr.percentage}%
                      </span>
                      <div
                        className={`w-full rounded-t ${barColor} transition-all duration-500`}
                        style={{ height: `${Math.max(qr.percentage * 0.8, 4)}px` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-subject stats - glass */}
            {(() => {
              const subjectMap: Record<string, { scores: number[]; best: number }> = {};
              for (const qr of quizHistory) {
                if (!subjectMap[qr.subject]) subjectMap[qr.subject] = { scores: [], best: 0 };
                subjectMap[qr.subject].scores.push(qr.percentage);
                subjectMap[qr.subject].best = Math.max(subjectMap[qr.subject].best, qr.percentage);
              }
              const subjects = Object.entries(subjectMap);
              if (subjects.length === 0) return null;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {subjects.map(([subj, data]) => {
                    const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
                    return (
                      <div key={subj} className="notebook-panel border border-[var(--border)] rounded-xl p-3 text-center">
                        <p className="text-xs font-medium text-[var(--text-tertiary)] truncate">{subj}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{avg}%</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">avg · best {data.best}%</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Quiz history timeline - clean with colored dots */}
            <div className="relative pl-6 border-l-2 border-[var(--border-strong)] space-y-4">
              {quizHistory.slice(0, 10).map((qr, i) => {
                const dotColor =
                  qr.percentage >= 80
                    ? "bg-emerald-500"
                    : qr.percentage >= 60
                      ? "bg-amber-400"
                      : "bg-red-400";
                const date = new Date(qr.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div key={qr.id || i} className="relative">
                    <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-[var(--bg-base)] ${dotColor}`} />
                    <div className="notebook-panel border border-[var(--border)] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${qr.percentage >= 80 ? "text-emerald-600" : qr.percentage >= 60 ? "text-amber-400" : "text-red-400"}`}>
                          {qr.percentage}%
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{qr.subject}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {date} · {qr.difficulty} · {qr.total_questions} Qs
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {(qr.answers || []).slice(0, 20).map((a, j) => (
                          <div
                            key={j}
                            className={`w-1.5 h-4 rounded-full ${a.is_correct ? "bg-emerald-500" : "bg-red-500/60"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Course Progress ─────────────────────────────── */}
        {courseProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                🎯 Course Progress
              </h2>
              <Link
                href="/courses"
                className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
              >
                Browse Courses →
              </Link>
            </div>
            <div className="space-y-3">
              {courseProgress.map((cp) => {
                const courseInfo = COURSES.find((c) => c.id === cp.course_id);
                if (!courseInfo) return null;
                const isComplete = cp.percentage >= 100;
                return (
                  <Link
                    key={cp.id}
                    href={`/courses/${cp.course_id}`}
                    className="block notebook-panel border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{courseInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{courseInfo.title}</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {courseInfo.subject} · {courseInfo.difficulty} · {(cp.completed_lessons || []).length}/{courseInfo.totalLessons} lessons
                        </p>
                      </div>
                      {isComplete && (
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Done</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--bg-muted)] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-[var(--accent)]"}`}
                          style={{ width: `${cp.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-tertiary)]">{cp.percentage}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Certificates Earned: glass cards with gold border ──────────────────────────── */}
        {(() => {
          const completedCourses = courseProgress.filter((cp) => cp.percentage >= 100);
          if (completedCourses.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mb-10"
            >
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                🏆 Certificates Earned
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completedCourses.map((cp) => {
                  const courseInfo = COURSES.find((c) => c.id === cp.course_id);
                  if (!courseInfo) return null;
                  return (
                    <div
                      key={cp.id}
                      className="notebook-panel border-2 border-amber-400/60 rounded-2xl p-5 text-center shadow-sm"
                    >
                      <div className="text-4xl mb-2">🎓</div>
                      <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-1">
                        Certificate of Completion
                      </p>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{courseInfo.title}</h3>
                      <p className="text-xs text-[var(--text-tertiary)] mb-2">{courseInfo.emoji} {courseInfo.subject}</p>
                      {cp.completed_at && (
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          Completed {new Date(cp.completed_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {cp.certificate_name && (
                        <div className="mt-3 pt-3 border-t border-amber-400/30">
                          <p className="text-[10px] text-amber-300 font-medium">
                            Awarded to: {user?.fullName || user?.firstName || "Student"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}

        {/* ─── Total Stats: 4 glassmorphism cards ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Total Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--accent)]">{totalSubjects}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Subjects Explored</p>
            </div>
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{totalMessages}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Messages Sent</p>
            </div>
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{totalSessions}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Study Sessions</p>
            </div>
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{quizHistory.length}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Quizzes Taken</p>
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">Member since {memberSince}</p>
        </motion.div>
      </div>
    </AcademicLayout>
  );
}
