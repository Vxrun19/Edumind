"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { COURSES, LESSONS } from "@/lib/courses";
import type { CourseProgress } from "@/lib/supabase";
import AcademicLayout from "@/components/AcademicLayout";
import posthog from "posthog-js";

type FilterType = "All" | "Free" | "Premium" | "Pro" | string;

const SUBJECT_FILTERS = ["All", "Free", "Pro", "Coding", "Math", "English", "Tech", "Finance", "Life Skills", "Business", "Coding/AI"];

/** Gradient top band and hover shadow per subject */
function getSubjectGradient(subject: string): { band: string; shadow: string } {
  const map: Record<string, { band: string; shadow: string }> = {
    Coding: { band: "from-purple-500 to-violet-500", shadow: "rgba(139,92,246,0.35)" },
    "Coding/AI": { band: "from-violet-500 to-fuchsia-500", shadow: "rgba(192,132,252,0.35)" },
    Math: { band: "from-blue-500 to-cyan-500", shadow: "rgba(0,212,255,0.35)" },
    English: { band: "from-orange-500 to-amber-500", shadow: "rgba(251,191,36,0.35)" },
    Tech: { band: "from-cyan-500 to-teal-500", shadow: "rgba(20,184,166,0.35)" },
    Finance: { band: "from-yellow-500 to-amber-500", shadow: "rgba(245,158,11,0.35)" },
    "Life Skills": { band: "from-teal-500 to-emerald-500", shadow: "rgba(16,185,129,0.35)" },
    Business: { band: "from-indigo-500 to-purple-500", shadow: "rgba(99,102,241,0.35)" },
  };
  return map[subject] ?? { band: "from-violet-500 to-sky-500", shadow: "rgba(139,92,246,0.3)" };
}

function getDifficultyColor(d: string): string {
  if (d === "Beginner") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (d === "Intermediate") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

export default function CoursesPage() {
  const [filter, setFilter] = useState<FilterType>("All");
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses/progress");
        const data = await res.json();
        const map: Record<string, CourseProgress> = {};
        for (const p of data.progress ?? []) {
          map[p.course_id] = p;
        }
        setProgressMap(map);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredCourses = COURSES.filter((c) => {
    if (filter === "All") return true;
    if (filter === "Free") return c.isFree;
    if (filter === "Pro" || filter === "Premium") return !c.isFree;
    return c.subject === filter;
  });

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  const activeCourse =
    filteredCourses.find((c) => c.id === activeCourseId) ?? filteredCourses[0];
  const activeProgress = activeCourse ? progressMap[activeCourse.id] : undefined;
  const activePct = activeProgress?.percentage ?? 0;

  return (
    <AcademicLayout>
      <div className="flex gap-8">
        {/* LEFT PANEL: Learning Paths */}
        <aside className="w-[260px] md:w-[280px] shrink-0">
          <div className="mb-4 text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
            Learning Paths
          </div>
          {isLoading ? (
            <div className="text-xs text-[var(--text-secondary)]">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-xs text-[var(--text-tertiary)]">
              No courses match this filter.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCourses.map((course) => {
                const progress = progressMap[course.id];
                const pct = progress?.percentage ?? 0;
                const isActive = course.id === activeCourse?.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setActiveCourseId(course.id);
                      posthog.capture("course_opened", {
                        course_id: course.id,
                        course_title: course.title,
                      });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 border-l-4 transition-colors ${
                      isActive
                        ? "border-l-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        : "border-l-transparent hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-[var(--text-primary)]">
                        {course.title}
                      </span>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {course.totalLessons} lessons · {pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] uppercase text-[var(--text-tertiary)]">
                        {course.isFree ? "FREE" : "PRO"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* RIGHT PANEL: Active Course Detail */}
        <section className="flex-1 min-w-0">
          {activeCourse ? (
            <>
              <div className="mb-6">
                <h1 className="font-serif text-[32px] sm:text-[38px] font-normal text-[var(--text-primary)] mb-1" style={{ letterSpacing: '-0.3px' }}>
                  {activeCourse.title}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Follow this path to master the topic step by step.
                </p>
              </div>

              {/* Progress line + CTA */}
              <div className="mb-8 space-y-3">
                <div className="w-full h-[4px] rounded-full bg-[var(--bg-surface)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${activePct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {activePct}% complete · {activeCourse.totalLessons} lessons
                  </span>
                  <Link
                    href={`/courses/${activeCourse.id}`}
                    className="text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-[1px]"
                    style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    Continue Learning →
                  </Link>
                </div>
              </div>

              {/* Lessons List */}
              <div className="space-y-1">
                {(LESSONS[activeCourse.id] ?? []).map((lesson, idx) => {
                  const padded = (idx + 1).toString().padStart(2, "0");
                  const completedLessons = activeProgress?.completed_lessons ?? [];
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isCurrent = !isCompleted && idx === completedLessons.length;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${activeCourse.id}/${lesson.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 text-xs transition-colors ${
                        isCurrent
                          ? "border-l-[var(--accent)] bg-[var(--bg-surface)]"
                          : "border-l-transparent hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <span className="w-8 text-[11px] font-mono text-[var(--text-tertiary)]">
                        {padded}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`truncate ${
                            isCompleted
                              ? "text-[var(--text-tertiary)] line-through"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {lesson.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {lesson.estimatedMinutes} min
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                        {isCurrent && <span className="text-[var(--accent)]">●</span>}
                        {isCompleted && <span className="text-[#10b981]">✓</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No course selected.
            </p>
          )}
        </section>
      </div>
    </AcademicLayout>
  );
}
