"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { COURSES, LESSONS } from "@/lib/courses";
import type { CourseProgress } from "@/lib/supabase";

function getDifficultyColor(d: string) {
  if (d === "Beginner") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (d === "Intermediate") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const course = COURSES.find((c) => c.id === courseId);
  const lessons = LESSONS[courseId] ?? [];
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/courses/progress?courseId=${courseId}`);
        const data = await res.json();
        setProgress(data.progress ?? null);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [courseId]);

  if (!course) {
    return (
      <main className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">{"\uD83D\uDE15"}</div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Course not found</h1>
          <Link href="/courses" className="text-[var(--accent)] hover:text-[var(--accent)]/80 text-sm font-medium">
            {"\u2190"} Back to Courses
          </Link>
        </div>
      </main>
    );
  }

  const completedLessons = progress?.completed_lessons ?? [];
  const pct = progress?.percentage ?? 0;
  const isComplete = pct >= 100;

  // Find the current lesson (first incomplete)
  const currentLessonIndex = lessons.findIndex((l) => !completedLessons.includes(l.id));
  const currentLesson = currentLessonIndex >= 0 ? lessons[currentLessonIndex] : null;

  return (
    <main className="min-h-[calc(100vh-57px)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/courses" className="text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 font-medium">
            {"\u2190"} All Courses
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Course Header */}
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-5xl">{course.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-[var(--text-tertiary)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                      {course.subject}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    {course.isFree ? (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">Free</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full uppercase">Pro</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{course.title}</h1>
                  <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">{course.description}</p>
                </div>
              </div>

              {/* What You'll Learn */}
              <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl p-4 mt-4">
                <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">{"\uD83C\uDF93"} What you will learn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.whatYouWillLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5">{"\u2713"}</span>
                      <span className="text-sm text-[var(--text-secondary)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lesson List */}
            <div className="notebook-panel border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {"\uD83D\uDCD6"} Lessons ({lessons.length})
              </h2>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-[var(--text-tertiary)] text-sm">Loading progress...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, i) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const isCurrent = currentLesson?.id === lesson.id;
                    const isLocked = !course.isFree && !isCompleted && i > 0 && !completedLessons.includes(lessons[i - 1]?.id);

                    return (
                      <Link
                        key={lesson.id}
                        href={isLocked ? "#" : `/courses/${courseId}/${lesson.id}`}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-[var(--accent)]/10 border-2 border-[var(--accent)]/30"
                            : isCompleted
                              ? "bg-[#10b981]/10 border border-[#10b981]/20 hover:border-[#10b981]/40"
                              : isLocked
                                ? "bg-[var(--bg-muted)] border border-[var(--border)] opacity-60 cursor-not-allowed"
                                : "bg-[var(--bg-muted)] border border-[var(--border)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5"
                        }`}
                        onClick={(e) => isLocked && e.preventDefault()}
                      >
                        {/* Lesson Number / Status */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                          isCompleted
                            ? "bg-[#10b981] text-[var(--text-primary)]"
                            : isCurrent
                              ? "bg-[var(--accent)] text-[var(--bg-base)]"
                              : isLocked
                                ? "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
                                : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                        }`}>
                          {isCompleted ? "\u2713" : isLocked ? "\uD83D\uDD12" : lesson.lessonNumber}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-medium ${isCompleted ? "text-[#10b981]" : "text-[var(--text-primary)]"} truncate`}>
                              {lesson.title}
                            </h3>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-[var(--accent)] text-[var(--bg-base)] px-2 py-0.5 rounded-full uppercase shrink-0">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {lesson.estimatedMinutes} min
                          </p>
                        </div>

                        {/* Arrow */}
                        {!isLocked && (
                          <svg className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Progress Card */}
              <div className="notebook-panel border border-[var(--border)] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Your Progress</h3>

                {/* Circular Progress */}
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={isComplete ? "#10b981" : "var(--accent)"}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${isComplete ? "text-[#10b981]" : "text-[var(--text-primary)]"}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                {currentLesson && !isComplete && (
                  <Link
                    href={`/courses/${courseId}/${currentLesson.id}`}
                    className="block w-full text-center bg-[var(--accent)] hover:opacity-90 text-[var(--bg-base)] font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    {progress ? "Continue Learning" : "Start Course"}
                  </Link>
                )}
                {isComplete && (
                  <div className="text-center bg-[#10b981]/10 text-[#10b981] font-semibold py-3 rounded-xl text-sm">
                    {"\uD83C\uDF89"} Course Complete!
                  </div>
                )}
              </div>

              {/* Course Stats */}
              <div className="notebook-panel border border-[var(--border)] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Course Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-tertiary)]">{"\uD83D\uDCD6"} Lessons</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{course.totalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-tertiary)]">{"\u23F1\uFE0F"} Duration</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{course.estimatedHours} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-tertiary)]">{"\uD83D\uDCCA"} Difficulty</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-tertiary)]">{"\u2705"} Completed</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {completedLessons.length}/{course.totalLessons}
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Preview */}
              <div className="notebook-panel border border-[var(--border)] rounded-2xl p-5 relative overflow-hidden">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{"\uD83C\uDFC6"} Certificate</h3>
                <div className={`${!isComplete ? "blur-sm" : ""} transition-all`}>
                  <div className="border-2 border-dashed border-[var(--border-strong)] rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">{"\uD83C\uDF93"}</div>
                    <p className="text-xs font-bold text-[var(--text-secondary)]">Certificate of Completion</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{course.title}</p>
                    {isComplete && progress?.completed_at && (
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                        {new Date(progress.completed_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {!isComplete && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/60">
                    <p className="text-xs font-medium text-[var(--text-tertiary)] text-center px-4">
                      {"\uD83D\uDD12"} Complete all lessons to earn your certificate
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
