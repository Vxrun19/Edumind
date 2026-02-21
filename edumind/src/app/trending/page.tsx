"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AcademicLayout from "@/components/AcademicLayout";

interface TrendingTopic {
  title: string;
  category: string;
  description: string;
  trend_status: "hot" | "rising" | "new";
  why_relevant: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface SummaryData {
  what_it_is: string;
  why_it_matters: string;
  how_to_start: string;
}

const CATEGORIES = [
  "All",
  "AI & Tech",
  "Science",
  "Business",
  "World Events",
  "Skills & Tools",
];

const TREND_ICONS: Record<string, string> = {
  hot: "\uD83D\uDD25",
  rising: "\uD83D\uDE80",
  new: "\u26A1",
};

const TREND_LABELS: Record<string, string> = {
  hot: "Hot",
  rising: "Rising",
  new: "New",
};

/** Trend badge glow: Hot=red, Rising=purple, New=cyan */
const TREND_GLOW: Record<string, string> = {
  hot: "shadow-sm border-red-200 bg-red-50 text-red-700",
  rising: "shadow-sm border-violet-200 bg-violet-50 text-violet-700",
  new: "shadow-sm border-sky-200 bg-sky-50 text-sky-700",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  intermediate: "bg-sky-50 text-sky-700 border border-sky-200",
  advanced: "bg-violet-50 text-violet-700 border border-violet-200",
};

/** Colored left border per category for topic cards */
const CATEGORY_BORDER_LEFT: Record<string, string> = {
  "AI & Tech": "border-l-violet-400",
  Science: "border-l-emerald-400",
  Business: "border-l-amber-400",
  "World Events": "border-l-rose-400",
  "Skills & Tools": "border-l-sky-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  "AI & Tech": "bg-violet-50 text-violet-700 border border-violet-200",
  Science: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Business: "bg-amber-50 text-amber-700 border border-amber-200",
  "World Events": "bg-rose-50 text-rose-700 border border-rose-200",
  "Skills & Tools": "bg-sky-50 text-sky-700 border border-sky-200",
};

function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
      return value;
    }
  }
  return "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)]";
}

function getCategoryBorderLeft(category: string): string {
  if (CATEGORY_BORDER_LEFT[category]) return CATEGORY_BORDER_LEFT[category];
  for (const [key, value] of Object.entries(CATEGORY_BORDER_LEFT)) {
    if (category.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
      return value;
    }
  }
  return "border-l-sky-400";
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TrendingPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);

  // Summary modal state
  const [summaryModal, setSummaryModal] = useState<{
    open: boolean;
    topic: TrendingTopic | null;
    summary: SummaryData | null;
    loading: boolean;
  }>({ open: false, topic: null, summary: null, loading: false });

  const fetchTopics = useCallback(async (refresh = false) => {
    try {
      const url = refresh ? "/api/trending?refresh=true" : "/api/trending";
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setTopics(data.topics);
      setGeneratedAt(data.generated_at);

      if (data.cooldown) {
        setCooldownMessage(data.message);
        setTimeout(() => setCooldownMessage(null), 5000);
      }
    } catch {
      // Keep existing topics if refresh fails
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchTopics().finally(() => setIsLoading(false));
  }, [fetchTopics]);

  async function handleRefresh() {
    setIsRefreshing(true);
    setCooldownMessage(null);
    await fetchTopics(true);
    setIsRefreshing(false);
  }

  async function handleQuickSummary(topic: TrendingTopic) {
    setSummaryModal({ open: true, topic, summary: null, loading: true });

    try {
      const res = await fetch("/api/trending/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.title,
          description: topic.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummaryModal((prev) => ({
        ...prev,
        summary: data.summary,
        loading: false,
      }));
    } catch {
      setSummaryModal((prev) => ({
        ...prev,
        summary: {
          what_it_is: "Failed to load summary.",
          why_it_matters: "Please try again.",
          how_to_start: "",
        },
        loading: false,
      }));
    }
  }

  function handleLearnThis(topic: TrendingTopic) {
    const message = encodeURIComponent(
      `I want to learn about ${topic.title}. ${topic.why_relevant} Give me a comprehensive introduction.`
    );
    router.push(`/chat?trending=${encodeURIComponent(topic.title)}&msg=${message}`);
  }

  const filteredTopics =
    activeCategory === "All"
      ? topics
      : topics.filter((t) => {
          const cat = t.category.toLowerCase();
          const filter = activeCategory.toLowerCase();
          return (
            cat === filter ||
            cat.includes(filter.split(" ")[0].toLowerCase())
          );
        });

  return (
    <AcademicLayout>
      {/* Header */}
      <div className="mb-8">
        <span className="label-text">DISCOVER</span>
        <h1
          className="font-serif text-[32px] md:text-[38px] font-normal mt-[6px]"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.3px" }}
        >
          What&apos;s Trending 🔥
        </h1>
        <hr className="ruled-line mt-4" />
        <p className="font-sans text-[15px] mt-3" style={{ color: "var(--text-secondary)" }}>
          Learn the latest topics everyone is talking about
        </p>
      </div>

      <div>
        {/* Category filter: glass pill buttons with active gradient state */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "text-white border-transparent shadow-sm"
                  : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
              }`}
              style={activeCategory === cat ? { background: "var(--accent)" } : undefined}
            >
              {cat}
            </button>
          ))}

          <div className="flex-1 min-w-[1rem]" />

          {/* Refresh button with spinning animation while loading */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-70"
          >
            <span className={isRefreshing ? "animate-spin inline-block" : ""}>
              🔄
            </span>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {cooldownMessage && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            {cooldownMessage}
          </div>
        )}

        {/* Loading state - skeleton cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="notebook-panel border border-[var(--border)] rounded-2xl p-5 animate-pulse"
              >
                <div className="h-4 bg-[var(--bg-muted)] rounded w-3/4 mb-3" />
                <div className="h-3 bg-[var(--bg-muted)] rounded w-full mb-2" />
                <div className="h-3 bg-[var(--bg-muted)] rounded w-2/3 mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-[var(--bg-muted)] rounded-full w-16" />
                  <div className="h-6 bg-[var(--bg-muted)] rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Topic cards: glassmorphism, colored left border, stagger animate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopics.map((topic, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`notebook-panel border border-[var(--border)] rounded-2xl p-5 flex flex-col border-l-4 ${getCategoryBorderLeft(topic.category)}`}
                >
                  {/* Header: title + trend badge (glow) */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold leading-snug flex-1 mr-2" style={{ color: "var(--text-primary)" }}>
                      {topic.title}
                    </h3>
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${TREND_GLOW[topic.trend_status] ?? TREND_GLOW.new}`}
                    >
                      {TREND_ICONS[topic.trend_status]}{" "}
                      {TREND_LABELS[topic.trend_status]}
                    </span>
                  </div>

                  {/* Category + Difficulty */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(topic.category)}`}
                    >
                      {topic.category}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[topic.difficulty]}`}
                    >
                      {topic.difficulty}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm mb-4 flex-1" style={{ color: "var(--text-secondary)" }}>
                    {topic.description}
                  </p>

                  {/* Actions: Learn This = gradient, Quick Summary = glass outline */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLearnThis(topic)}
                      className="flex-1 text-sm font-medium text-white px-3 py-2 rounded-xl transition-all hover:-translate-y-[1px]"
                      style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
                    >
                      Learn This
                    </button>
                    <button
                      onClick={() => handleQuickSummary(topic)}
                      className="flex-1 text-sm font-medium border px-3 py-2 rounded-xl transition-colors"
                      style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
                    >
                      Quick Summary
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredTopics.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: "var(--text-tertiary)" }}>
                  No topics found for this category.
                </p>
                <button
                  onClick={() => setActiveCategory("All")}
                  className="mt-3 text-sm font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  Show all topics
                </button>
              </div>
            )}

            {/* Last updated timestamp */}
            {generatedAt && (
              <div className="mt-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                Last updated: {formatTimestamp(generatedAt)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Modal: centered glass card with backdrop blur */}
      {summaryModal.open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() =>
            setSummaryModal({ open: false, topic: null, summary: null, loading: false })
          }
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-strong)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {summaryModal.topic?.title}
                </h3>
                {summaryModal.topic && (
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(summaryModal.topic.category)}`}
                  >
                    {summaryModal.topic.category}
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  setSummaryModal({
                    open: false,
                    topic: null,
                    summary: null,
                    loading: false,
                  })
                }
                className="text-xl leading-none" style={{ color: "var(--text-tertiary)" }}
              >
                ×
              </button>
            </div>

            {/* Summary content */}
            {summaryModal.loading ? (
              <div className="space-y-3 py-4">
                <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-full" />
                <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-5/6" />
                <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-full" />
                <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-4/6" />
                <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-full" />
                <div className="h-4 bg-[var(--bg-muted)] rounded animate-pulse w-3/6" />
              </div>
            ) : summaryModal.summary ? (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-1">
                    What it is
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {summaryModal.summary.what_it_is}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Why it matters
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {summaryModal.summary.why_it_matters}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                    How to get started
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {summaryModal.summary.how_to_start}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Learn More button */}
            {!summaryModal.loading && summaryModal.topic && (
              <button
                onClick={() => {
                  handleLearnThis(summaryModal.topic!);
                  setSummaryModal({
                    open: false,
                    topic: null,
                    summary: null,
                    loading: false,
                  });
                }}
                className="w-full mt-5 text-sm font-medium text-white px-4 py-2.5 rounded-xl transition-all hover:-translate-y-[1px]"
                style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
              >
                Learn More →
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AcademicLayout>
  );
}
