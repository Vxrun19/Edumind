"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { SUBJECTS } from "@/lib/subjects";
import type { Conversation } from "@/lib/supabase";
import AcademicLayout from "@/components/AcademicLayout";

function getSubjectEmoji(subject: string | null): string {
  if (!subject) return "💬";
  const found = SUBJECTS.find((s) => s.name === subject);
  return found?.emoji ?? "💬";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

type DateGroupKey = "Today" | "Yesterday" | "This Week" | "Earlier";

function getDateGroup(dateStr: string): DateGroupKey {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfThisWeek) return "This Week";
  return "Earlier";
}

function groupConversationsByDate(conversations: Conversation[]): Map<DateGroupKey, Conversation[]> {
  const groups = new Map<DateGroupKey, Conversation[]>();
  const order: DateGroupKey[] = ["Today", "Yesterday", "This Week", "Earlier"];
  for (const key of order) groups.set(key, []);
  for (const c of conversations) {
    const key = getDateGroup(c.updated_at);
    groups.get(key)!.push(c);
  }
  return groups;
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations?limit=50");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations]
  );
  const groupOrder: DateGroupKey[] = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <AcademicLayout>
      <div>
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <span className="label-text">ARCHIVE</span>
          <h1 className="font-serif text-[32px] md:text-[38px] font-normal mt-[6px] text-[var(--text-primary)]" style={{ letterSpacing: '-0.3px' }}>
            Learning History
          </h1>
          <hr className="ruled-line mt-4" />
        </motion.header>

        {isLoading && (
          <div className="py-16 text-center text-[var(--text-secondary)] text-sm">
            Loading conversations...
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl text-[var(--text-tertiary)] mb-4">—</div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Your learning history will appear here
            </p>
            <Link
              href="/chat"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
            >
              Start a conversation →
            </Link>
          </div>
        )}

        {!isLoading && conversations.length > 0 && (
          <div className="space-y-8">
            {groupOrder.map((groupKey, groupIdx) => {
              const items = grouped.get(groupKey) ?? [];
              if (items.length === 0) return null;

              return (
                <motion.section
                  key={groupKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: groupIdx * 0.05 }}
                >
                  <div className="text-[12px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] mb-3">
                    {groupKey}
                  </div>
                  <div className="border-t border-[var(--border)]" />
                  <div>
                    {items.map((convo, idx) => (
                      <motion.div
                        key={convo.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 }}
                      >
                        <div className="flex items-stretch">
                          <Link
                            href={`/chat?id=${convo.id}`}
                            className="flex-1 group flex items-center gap-4 py-4 cursor-pointer hover:bg-[var(--bg-surface)] rounded-lg px-3 transition-colors"
                          >
                            <div className="w-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)] mb-0.5">
                                <span>{getSubjectEmoji(convo.subject)}</span>
                                <span className="truncate">
                                  {convo.subject || "General"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm text-[var(--text-primary)] truncate">
                                  {convo.title}
                                </div>
                                <div className="text-[11px] text-[var(--text-tertiary)] shrink-0">
                                  {formatDate(convo.updated_at)}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(convo.id);
                              }}
                              disabled={deletingId === convo.id}
                              aria-label={`Delete conversation: ${convo.title}`}
                              className="ml-3 text-[11px] text-[var(--text-tertiary)] opacity-60 hover:opacity-100 hover:text-[var(--text-secondary)] transition-opacity disabled:opacity-30"
                            >
                              {deletingId === convo.id ? "Deleting..." : "Delete"}
                            </button>
                          </Link>
                        </div>
                        {idx < items.length - 1 && (
                          <div className="h-px bg-[var(--border)]" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </AcademicLayout>
  );
}
