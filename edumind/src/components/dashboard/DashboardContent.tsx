"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
} from "lucide-react";
import { CountUp, StaggerContainer, StaggerItem } from "@/components/animations";
import DashboardUpgradeCard from "@/components/DashboardUpgradeCard";
import { SUBJECTS } from "@/lib/subjects";
import type {
  Conversation,
  StudentProfile,
  Quiz,
  TrendingTopic,
  LearningAssessment,
  CourseProgress,
} from "@/lib/supabase";

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Suggestion {
  topic: string;
  fromSubject: string | null;
  fromConversation: string;
}

export interface DashboardContentProps {
  timeGreeting: string;
  displayName: string;
  profile: StudentProfile;
  currentStreak: number;
  assessment: LearningAssessment | null;
  recentConversations: Conversation[];
  recentQuizzes: (Quiz & { best_score?: number })[];
  trendingTopics: TrendingTopic[];
  suggestions: Suggestion[];
  myCourseProgress: CourseProgress[];
}

/* ─── Icons for subject grid ─── */
const subjectIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Dna,
};

/* ─── Sub-components ─── */

function CircularProgress({ value }: { value: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width="110" height="110" viewBox="0 0 36 36" className="flex-shrink-0">
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="3"
      />
      <motion.circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        transform="rotate(-90 18 18)"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: easing, delay: 0.3 }}
      />
      <text
        x="18"
        y="17"
        textAnchor="middle"
        className="font-serif"
        style={{ fontSize: "7px", fontWeight: 500, fill: "var(--text-primary)" }}
      >
        {value}%
      </text>
      <text
        x="18"
        y="22"
        textAnchor="middle"
        className="font-sans"
        style={{ fontSize: "3.5px", fill: "var(--text-tertiary)" }}
      >
        mastery
      </text>
    </svg>
  );
}

function ProgressBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="w-full h-1 rounded-full" style={{ background: "var(--bg-muted)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: "var(--accent)" }}
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay }}
      />
    </div>
  );
}

/* ─── Emoji for subject conversations ─── */
function subjectEmoji(subject: string | null): string {
  if (!subject) return "💬";
  const found = SUBJECTS.find(
    (s) => s.name.toLowerCase() === subject.toLowerCase()
  );
  return found?.emoji ?? "💬";
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

/* ─── Right Panel ─── */
function DashboardRightPanel({
  currentStreak,
  suggestions,
  myCourseProgress,
}: {
  currentStreak: number;
  suggestions: Suggestion[];
  myCourseProgress: CourseProgress[];
}) {
  const streakDays = Math.min(currentStreak, 7);

  return (
    <>
      {/* Streak notes */}
      <span className="label-text">STUDY NOTES</span>
      <hr className="ruled-line mt-2 mb-4" />
      <div
        className="font-sans text-[14px] font-semibold"
        style={{ color: "var(--accent)" }}
      >
        {`🔥 ${currentStreak} day streak`}
      </div>
      <div className="mt-2">
        <ProgressBar value={Math.round((streakDays / 7) * 100)} delay={0.5} />
      </div>
      <p
        className="font-sans text-[12px] mt-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {`${streakDays} of 7 days — keep going`}
      </p>

      <hr className="ruled-line my-5" />

      {/* Suggestions / AI Insight */}
      <span className="label-text">
        {suggestions.length > 0 ? "SUGGESTED NEXT" : "AI INSIGHT"}
      </span>
      <div className="annotation-block mt-3">
        {suggestions.length > 0 ? (
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i}>
                <Link
                  href={`/chat?msg=Teach me about ${encodeURIComponent(s.topic)}`}
                  className="font-serif text-[13px] block transition-colors"
                  style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
                >
                  {s.topic}
                  <span
                    className="font-sans text-[11px] ml-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {s.fromSubject ? `· ${s.fromSubject}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="font-serif text-[13px] italic"
            style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
          >
            {
              "Start conversations to unlock personalized topic suggestions. Try asking: 'Teach me about...'"
            }
          </p>
        )}
      </div>

    </>
  );
}

/* ─── Main component ─── */
export function DashboardContent({
  timeGreeting,
  displayName,
  profile,
  currentStreak,
  assessment,
  recentConversations,
  recentQuizzes,
  trendingTopics,
  suggestions,
  myCourseProgress,
}: DashboardContentProps) {
  const today = new Date();
  const dayName = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const dateStr = today
    .toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

  // Overall progress: average percentage across courses
  const overallProgress =
    myCourseProgress.length > 0
      ? Math.round(
          myCourseProgress.reduce((sum, c) => sum + (c.percentage ?? 0), 0) /
            myCourseProgress.length
        )
      : 0;

  // Best recent quiz for "Recommended Next"
  const weakQuiz = recentQuizzes.find(
    (q) => q.best_score !== undefined && q.best_score < 80
  );

  return (
    <>
      {/* Pass right panel via parent — we export a helper for this */}
      <div>
        {/* Greeting */}
        <span className="label-text">
          {dayName}, {dateStr}
        </span>
        <h1
          className="font-serif text-[32px] md:text-[38px] font-normal mt-[6px]"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.3px" }}
        >
          {timeGreeting}, {displayName}.
        </h1>
        <hr className="ruled-line mt-4" />
        <p
          className="font-sans text-[15px] mt-3"
          style={{ color: "var(--text-secondary)" }}
        >
          {recentConversations.length > 0
            ? `You have ${recentConversations.length} recent conversation${recentConversations.length !== 1 ? "s" : ""}.`
            : "Start a conversation to begin learning."}
        </p>
      </div>

      {/* Upgrade Card */}
      <div className="mt-6">
        <DashboardUpgradeCard />
      </div>

      {/* Today's Focus */}
      <div className="notebook-panel p-7 mt-7">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <span className="label-text">{"TODAY'S FOCUS"}</span>
            {recentConversations.length > 0 ? (
              <>
                <h3
                  className="font-sans text-[17px] font-semibold mt-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {recentConversations[0].title}
                </h3>
                <p
                  className="font-sans text-[13px] mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {recentConversations[0].subject ?? "General"} ·{" "}
                  {relativeTime(recentConversations[0].updated_at)}
                </p>
              </>
            ) : (
              <h3
                className="font-sans text-[17px] font-semibold mt-2"
                style={{ color: "var(--text-primary)" }}
              >
                Start your first session
              </h3>
            )}

            {overallProgress > 0 && (
              <div className="mt-5">
                <p
                  className="font-sans text-[13px] mb-[6px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {overallProgress}% overall course progress
                </p>
                <ProgressBar value={overallProgress} delay={0.2} />
              </div>
            )}

            <Link
              href="/chat"
              className="inline-block font-sans text-[14px] font-medium mt-5 px-5 py-[11px] rounded-lg text-white transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.97]"
              style={{ background: "var(--accent)" }}
            >
              {recentConversations.length > 0
                ? "Continue studying →"
                : "Start studying →"}
            </Link>
          </div>

          <div className="flex items-center justify-center">
            <CircularProgress value={overallProgress} />
          </div>
        </div>
      </div>

      {/* Two column cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        {/* Streak */}
        <div className="notebook-panel p-6">
          <span className="label-text">STUDY STREAK</span>
          <div
            className="mt-2 font-serif text-[52px]"
            style={{ color: "var(--accent)" }}
          >
            <CountUp value={currentStreak} />
          </div>
          <p
            className="font-sans text-[14px]"
            style={{ color: "var(--text-secondary)" }}
          >
            days in a row
          </p>
          <div className="flex gap-[6px] mt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[10px] h-[10px] rounded-full"
                style={{
                  background:
                    i < Math.min(currentStreak, 7)
                      ? "var(--accent)"
                      : "var(--bg-muted)",
                }}
                animate={
                  i === Math.min(currentStreak, 7) - 1 && currentStreak > 0
                    ? { scale: [1, 1.15, 1] }
                    : {}
                }
                transition={
                  i === Math.min(currentStreak, 7) - 1 && currentStreak > 0
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
              />
            ))}
          </div>
          {currentStreak > 0 && (
            <p
              className="font-sans text-[12px] mt-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Keep it going!
            </p>
          )}
        </div>

        {/* Recommended Next */}
        <div className="notebook-panel p-6">
          <span className="label-text">RECOMMENDED NEXT</span>
          {weakQuiz ? (
            <>
              <h3
                className="font-sans text-[17px] font-semibold mt-2"
                style={{ color: "var(--text-primary)" }}
              >
                {weakQuiz.title}
              </h3>
              <p
                className="font-sans text-[14px] mt-[6px]"
                style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}
              >
                You scored {weakQuiz.best_score}% on this quiz. A focused
                session could push it higher.
              </p>
              <Link
                href={`/chat?msg=Help me review ${encodeURIComponent(weakQuiz.title)}`}
                className="inline-block font-sans text-[14px] mt-4 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                {"Review topic →"}
              </Link>
            </>
          ) : trendingTopics.length > 0 ? (
            <>
              <h3
                className="font-sans text-[17px] font-semibold mt-2"
                style={{ color: "var(--text-primary)" }}
              >
                {trendingTopics[0].title}
              </h3>
              <p
                className="font-sans text-[14px] mt-[6px]"
                style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}
              >
                {trendingTopics[0].description}
              </p>
              <Link
                href={`/chat?trending=${encodeURIComponent(trendingTopics[0].title)}&msg=Teach me about ${encodeURIComponent(trendingTopics[0].title)}`}
                className="inline-block font-sans text-[14px] mt-4 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                {"Learn this →"}
              </Link>
            </>
          ) : (
            <>
              <h3
                className="font-sans text-[17px] font-semibold mt-2"
                style={{ color: "var(--text-primary)" }}
              >
                Explore a subject
              </h3>
              <p
                className="font-sans text-[14px] mt-[6px]"
                style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}
              >
                Pick a topic below and start a conversation to get personalized
                recommendations.
              </p>
              <Link
                href="/chat"
                className="inline-block font-sans text-[14px] mt-4 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                {"Start chatting →"}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      {recentConversations.length > 0 && (
        <div className="mt-9">
          <span className="label-text">RECENT SESSIONS</span>
          <hr className="ruled-line mt-2" />
          <StaggerContainer staggerDelay={0.06}>
            {recentConversations.map((convo) => (
              <StaggerItem key={convo.id}>
                <Link
                  href={`/chat?id=${convo.id}`}
                  className="flex items-center py-[14px] group cursor-pointer rounded-lg transition-all duration-150"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span className="flex-shrink-0 text-[16px]">
                    {subjectEmoji(convo.subject)}
                  </span>
                  <div className="ml-3 flex-1 min-w-0">
                    <p
                      className="font-serif text-[15px] truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {convo.title}
                    </p>
                    <p
                      className="font-sans text-[12px] mt-[2px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {convo.subject ?? "General"} · {relativeTime(convo.updated_at)}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="mt-9">
        <span className="label-text">OPEN A SUBJECT</span>
        <hr className="ruled-line mt-2 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((subject) => {
            const Icon = subjectIcons[subject.name];
            return (
              <Link
                key={subject.name}
                href={`/chat?msg=Teach me about ${encodeURIComponent(subject.name)}`}
                className="flex flex-col items-center gap-[6px] p-3 rounded-lg cursor-pointer transition-all duration-150"
                style={{ border: "1px solid var(--border)" }}
              >
                {Icon ? (
                  <Icon size={20} style={{ color: "var(--accent)" }} />
                ) : (
                  <span className="text-[20px]">{subject.emoji}</span>
                )}
                <span
                  className="font-sans text-[12px] font-medium text-center"
                  style={{ color: "var(--text-primary)" }}
                >
                  {subject.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* Export the right panel builder for the server page */
export function DashboardRightPanelWrapper(props: {
  currentStreak: number;
  suggestions: Suggestion[];
  myCourseProgress: CourseProgress[];
}) {
  return <DashboardRightPanel {...props} />;
}
