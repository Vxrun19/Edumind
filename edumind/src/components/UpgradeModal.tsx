"use client";

import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "messages" | "quizzes" | "courses" | "voice";
}

const REASONS = {
  messages: {
    emoji: "💬",
    title: "Daily message limit reached",
    description: "You've used all 20 daily messages on the Free plan.",
  },
  quizzes: {
    emoji: "📝",
    title: "Daily quiz limit reached",
    description: "You've used all 3 daily quizzes on the Free plan.",
  },
  courses: {
    emoji: "📚",
    title: "This course is for Pro members",
    description: "Unlock all courses and learn without limits.",
  },
  voice: {
    emoji: "🎤",
    title: "Voice mode is a Pro feature",
    description: "Upgrade to Pro for voice input and output.",
  },
};

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const router = useRouter();
  const info = REASONS[reason];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(249,247,243,0.85)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative notebook-panel border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="text-5xl mb-4">{info.emoji}</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-serif">
          {info.title}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          {info.description}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/pricing")}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Upgrade to Pro — $9.99/mo
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-[var(--bg-muted)]"
            style={{
              color: "var(--text-tertiary)",
              border: "1px solid var(--border)",
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
