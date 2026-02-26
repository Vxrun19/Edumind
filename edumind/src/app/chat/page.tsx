"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useState,
  useRef,
  useEffect,
  FormEvent,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { motion } from "framer-motion";
import { SUBJECTS } from "@/lib/subjects";
import { useVoice } from "@/hooks/use-voice";
import VoiceIndicator from "@/components/VoiceIndicator";
import VoiceSettings from "@/components/VoiceSettings";
import UpgradeModal from "@/components/UpgradeModal";
import UpgradeBanner from "@/components/UpgradeBanner";
import { useSubscription } from "@/hooks/use-subscription";
import posthog from "posthog-js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MOTION_TRANSITION = { duration: 0.2, ease: MOTION_EASE };

// ─── helpers ────────────────────────────────────────────
async function createConversation(
  subject: string | null,
  title: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, title }),
    });
    const data = await res.json();
    return data.conversation?.id ?? null;
  } catch {
    return null;
  }
}

async function saveMessage(
  conversationId: string,
  role: string,
  content: string
) {
  try {
    await fetch("/api/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, role, content }),
    });
  } catch {
    // silent — chat still works even if save fails
  }
}

async function trackProgress(subject: string | null, isNewSession: boolean) {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, isNewSession }),
    });
  } catch {
    // silent
  }
}

async function loadMessages(conversationId: string) {
  const res = await fetch(
    `/api/conversations/messages?conversationId=${conversationId}`
  );
  const data = await res.json();
  return (data.messages ?? []) as {
    role: string;
    content: string;
  }[];
}

// Background analysis — fire-and-forget
async function analyzeConversation(
  messages: ChatMessage[],
  subject: string | null,
  conversationId: string | null
) {
  try {
    await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        subject,
        conversationId,
      }),
    });
  } catch {
    // silent — analysis is background work
  }
}

// Generate next-topic suggestions when conversation ends
async function generateSuggestions(
  conversationId: string,
  messages: ChatMessage[],
  subject: string | null
) {
  try {
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, messages, subject }),
    });
  } catch {
    // silent
  }
}

// ─── SVG Icons ──────────────────────────────────────────
function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function SpeakerOnIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path
        d="M15.54 8.46a5 5 0 0 1 0 7.07"
        fill="none"
        strokeWidth="2"
      />
      <path
        d="M19.07 4.93a10 10 0 0 1 0 14.14"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  );
}

function SpeakerOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function StopIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

// ─── main component ─────────────────────────────────────
function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSubject = searchParams.get("subject");
  const conversationParam = searchParams.get("id");
  const trendingParam = searchParams.get("trending");
  const msgParam = searchParams.get("msg");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    conversationParam
  );
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenError, setQuizGenError] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"messages" | "quizzes">("messages");
  const [messagesUsedToday, setMessagesUsedToday] = useState(0);
  const { isPro } = useSubscription();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialSent = useRef(false);
  const conversationLoaded = useRef(false);

  // Track the conversation state for suggestions on exit
  const messagesRef = useRef<ChatMessage[]>([]);
  const conversationIdRef = useRef<string | null>(conversationParam);
  const activeSubjectRef = useRef<string | null>(null);

  // ─── Voice mode ────────────────────────────────────────
  const voice = useVoice();
  const autoSendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spaceHeld = useRef(false);
  const lastTranscriptRef = useRef("");

  // When transcript changes from speech recognition, fill the input
  // and start auto-send timer (1.5s of silence)
  useEffect(() => {
    if (voice.transcript && voice.transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = voice.transcript;
      setInput(voice.transcript);

      // Reset the auto-send timer
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
      autoSendTimer.current = setTimeout(() => {
        // Auto-send if still listening and there's text
        if (voice.transcript.trim()) {
          voice.stopListening();
          // We'll send in the next effect when listening stops
        }
      }, 1500);
    }
  }, [voice.transcript, voice.stopListening]);

  // When listening stops and there's a transcript, auto-send
  useEffect(() => {
    if (
      !voice.isListening &&
      lastTranscriptRef.current.trim() &&
      !isLoading
    ) {
      const text = lastTranscriptRef.current.trim();
      if (text && input.trim() === text) {
        // Small delay so user can see the text first
        const timer = setTimeout(() => {
          sendMessage(text, messagesRef.current, conversationIdRef.current, activeSubjectRef.current);
          lastTranscriptRef.current = "";
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.isListening]);

  // Auto-speak new AI responses if voice output is enabled
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (
      voice.voiceOutputEnabled &&
      messages.length > prevMessageCountRef.current &&
      messages.length > 0
    ) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        voice.speak(lastMsg.content, messages.length - 1);
      }
    }
    prevMessageCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voice.voiceOutputEnabled]);

  // Keyboard shortcut: Hold Space to record (walkie-talkie)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if not focused on an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space" && !e.repeat && !spaceHeld.current) {
        e.preventDefault();
        spaceHeld.current = true;
        if (!voice.isListening) {
          voice.startListening();
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space" && spaceHeld.current) {
        e.preventDefault();
        spaceHeld.current = false;
        if (voice.isListening) {
          voice.stopListening();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [voice.isListening, voice.startListening, voice.stopListening]);

  // Cleanup auto-send timer
  useEffect(() => {
    return () => {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
    };
  }, []);

  // Fetch today's usage for the banner
  useEffect(() => {
    if (!isPro) {
      fetch("/api/subscription/usage")
        .then((r) => r.json())
        .then((d) => setMessagesUsedToday(d.messagesUsed ?? 0))
        .catch(() => {});
    }
  }, [isPro]);

  // Exit focus mode on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFocusMode(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  useEffect(() => {
    activeSubjectRef.current = activeSubject;
  }, [activeSubject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load existing conversation from ?id=
  useEffect(() => {
    if (conversationParam && !conversationLoaded.current) {
      conversationLoaded.current = true;
      (async () => {
        setIsLoading(true);
        try {
          const loaded = await loadMessages(conversationParam);
          const mapped: ChatMessage[] = loaded.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
          setMessages(mapped);

          // Detect subject from first user message
          const first = mapped.find((m) => m.role === "user");
          if (first) {
            const match = SUBJECTS.find((s) =>
              first.content.includes(s.name)
            );
            if (match) setActiveSubject(match.name);
          }
        } catch {
          // ignore load errors
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [conversationParam]);

  const [trendingContext, setTrendingContext] = useState<string | null>(trendingParam);

  const sendMessage = useCallback(
    async (
      text: string,
      allMessages: ChatMessage[],
      currentConvoId: string | null,
      subject: string | null
    ) => {
      const userMessage: ChatMessage = { role: "user", content: text };
      const updatedMessages = [...allMessages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      let convoId = currentConvoId;

      // Create conversation on first message
      if (!convoId) {
        const title = text.slice(0, 50);
        convoId = await createConversation(subject, title);
        if (convoId) {
          setConversationId(convoId);
          router.replace(`/chat?id=${convoId}`, { scroll: false });
        }
      }

      // Save user message + track progress
      if (convoId) {
        await saveMessage(convoId, "user", text);
      }
      trackProgress(subject, !currentConvoId);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            subject,
            messageCount: updatedMessages.length,
            trendingTopic: trendingContext,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.upgradeRequired) {
            setUpgradeReason("messages");
            setUpgradeModalOpen(true);
            // Remove the user message we just added since it wasn't processed
            setMessages(allMessages);
            setIsLoading(false);
            return;
          }
          throw new Error(data.error || "Something went wrong");
        }

        const assistantContent = data.response;
        const finalMessages: ChatMessage[] = [
          ...updatedMessages,
          { role: "assistant", content: assistantContent },
        ];
        setMessages(finalMessages);

        // Save assistant message
        if (convoId) {
          await saveMessage(convoId, "assistant", assistantContent);
        }

        // Update messages used counter
        setMessagesUsedToday((prev) => prev + 1);

        // Analytics
        posthog.capture("message_sent", { subject: subject ?? "free_chat" });

        // ─── Background analysis — fire and forget ─────────
        analyzeConversation(finalMessages, subject, convoId);

        // Clear trending context after first exchange
        if (trendingContext) {
          setTrendingContext(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        const errorContent = `Sorry, I ran into an issue: ${errorMessage}`;
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: errorContent },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [router, trendingContext]
  );

  // Auto-send subject intro if ?subject= is in the URL
  useEffect(() => {
    if (initialSubject && !initialSent.current && !conversationParam) {
      const matched = SUBJECTS.find((s) => s.name === initialSubject);
      if (matched) {
        initialSent.current = true;
        setActiveSubject(matched.name);
        const prompt = `I want to learn about ${matched.name}. Give me a quick intro and ask me what specifically I want to explore.`;
        sendMessage(prompt, [], null, matched.name);
      }
    }
  }, [initialSubject, conversationParam, sendMessage]);

  // Auto-send trending topic message if ?trending= is in the URL
  useEffect(() => {
    if (trendingParam && msgParam && !initialSent.current && !conversationParam) {
      initialSent.current = true;
      const decodedMsg = decodeURIComponent(msgParam);
      sendMessage(decodedMsg, [], null, null);
    }
  }, [trendingParam, msgParam, conversationParam, sendMessage]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    // Stop listening if currently recording
    if (voice.isListening) {
      voice.stopListening();
      lastTranscriptRef.current = "";
    }
    sendMessage(trimmed, messages, conversationId, activeSubject);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleSubjectClick(subjectName: string) {
    if (isLoading) return;

    // Generate suggestions for the conversation being left
    if (
      conversationIdRef.current &&
      messagesRef.current.length >= 2
    ) {
      generateSuggestions(
        conversationIdRef.current,
        messagesRef.current,
        activeSubjectRef.current
      );
    }

    setActiveSubject(subjectName);
    setConversationId(null);
    conversationLoaded.current = false;
    initialSent.current = false;
    const prompt = `I want to learn about ${subjectName}. Give me a quick intro and ask me what specifically I want to explore.`;
    setMessages([]);
    setSidebarOpen(false);
    sendMessage(prompt, [], null, subjectName);
  }

  function handleNewChat() {
    if (isLoading) return;

    // Generate suggestions for the conversation being left
    if (
      conversationIdRef.current &&
      messagesRef.current.length >= 2
    ) {
      generateSuggestions(
        conversationIdRef.current,
        messagesRef.current,
        activeSubjectRef.current
      );
    }

    // Stop any voice activity
    voice.stopListening();
    voice.stopSpeaking();

    setMessages([]);
    setActiveSubject(null);
    setConversationId(null);
    conversationLoaded.current = false;
    initialSent.current = false;
    setSidebarOpen(false);
    router.replace("/chat", { scroll: false });
    inputRef.current?.focus();
  }

  async function handleQuizMe() {
    if (isGeneratingQuiz || !conversationId) return;
    setIsGeneratingQuiz(true);
    setQuizGenError(false);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          subject: activeSubject,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setUpgradeReason("quizzes");
          setUpgradeModalOpen(true);
          return;
        }
        throw new Error(data.error);
      }
      if (data.quiz?.id) {
        router.push(`/quiz/${data.quiz.id}`);
      }
    } catch {
      setQuizGenError(true);
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  // Knowledge Canvas panels derived from assistant messages
  const knowledgePanels = useMemo(() => {
    const panels: {
      id: string;
      type: "code" | "definition" | "list";
      title: string;
      content: string;
    }[] = [];
    messages.forEach((msg, idx) => {
      if (msg.role !== "assistant") return;
      const base = `m-${idx}`;
      const hasCode = msg.content.includes("```");
      const hasBold = msg.content.includes("**");
      const hasList = /^\s*\d+\./m.test(msg.content);

      if (hasCode) {
        const match = msg.content.match(/```[\s\S]*?```/);
        const code = match
          ? match[0].replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "")
          : msg.content;
        panels.push({
          id: `${base}-code`,
          type: "code",
          title: "Code snippet",
          content: code.trim().slice(0, 800),
        });
      }

      if (hasBold) {
        const boldMatch = msg.content.match(/\*\*(.+?)\*\*/);
        const term = boldMatch ? boldMatch[1] : "Definition";
        panels.push({
          id: `${base}-def`,
          type: "definition",
          title: term,
          content: msg.content.replace(/\*\*/g, "").slice(0, 400),
        });
      }

      if (hasList) {
        const lines = msg.content
          .split("\n")
          .filter((l) => /^\s*\d+\./.test(l))
          .slice(0, 6)
          .join("\n");
        if (lines) {
          panels.push({
            id: `${base}-list`,
            type: "list",
            title: "Steps",
            content: lines,
          });
        }
      }
    });
    return panels;
  }, [messages]);

  return (
    <div className="relative flex h-[calc(100vh-57px)]" style={{ background: 'var(--bg-base)' }}>
      {/* Floating voice indicator pill */}
      <VoiceIndicator
        isListening={voice.isListening}
        onStop={voice.stopListening}
      />

      {/* ═══ SIDEBAR (desktop) ═══ */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: 220,
          background: 'var(--bg-warm)',
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo + back */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            href="/dashboard"
            className="text-sm font-bold transition-colors duration-150"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          >
            &larr; EduMind
          </Link>
        </div>

        {/* New Chat */}
        <div className="px-3">
          <button
            onClick={handleNewChat}
            className="w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-[var(--bg-muted)]"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Subjects label */}
        <div className="px-4 mt-4 mb-2">
          <p
            className="text-xs font-medium uppercase"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.08em",
            }}
          >
            Subjects
          </p>
        </div>

        {/* Subject list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {SUBJECTS.map((subject) => {
            const active = activeSubject === subject.name;
            return (
              <button
                key={subject.name}
                onClick={() => handleSubjectClick(subject.name)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-150"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--bg-muted)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span className="text-base">{subject.emoji}</span>
                {subject.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 flex flex-col"
            style={{
              width: 260,
              background: 'var(--bg-warm)',
              borderRight: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <Link
                href="/dashboard"
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                &larr; EduMind
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="transition-colors p-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                ✕
              </button>
            </div>
            <div className="px-3">
              <button
                onClick={handleNewChat}
                className="w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-[var(--bg-muted)]"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                + New Chat
              </button>
            </div>
            <div className="px-4 mt-4 mb-2">
              <p
                className="text-xs font-medium uppercase"
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.08em",
                }}
              >
                Subjects
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
              {SUBJECTS.map((subject) => {
                const active = activeSubject === subject.name;
                return (
                  <button
                    key={subject.name}
                    onClick={() => handleSubjectClick(subject.name)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-150"
                    style={{
                      background: active ? "var(--accent-light)" : "transparent",
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    <span className="text-base">{subject.emoji}</span>
                    {subject.name}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ═══ MAIN AREA (right of sidebar) ═══ */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        {/* ── TOP BAR ── */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: 48,
            background: 'rgba(249,247,243,0.94)',
            backdropFilter: 'blur(10px)',
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left: mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
            style={{ color: "var(--text-primary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Center: subject name */}
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-sm font-medium truncate max-w-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {activeSubject
                ? `${SUBJECTS.find((s) => s.name === activeSubject)?.emoji ?? ""} ${activeSubject}`
                : "Free Chat"}
            </span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {/* Voice output controls */}
            {voice.synthSupported && (
              <div className="flex items-center gap-1">
                {voice.isSpeaking && (
                  <button
                    onClick={voice.stopSpeaking}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg border transition-colors"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      color: "var(--accent-red)",
                      borderColor: "rgba(239,68,68,0.2)",
                    }}
                    title="Stop speaking"
                  >
                    <StopIcon />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    voice.toggleVoiceOutput();
                    if (!voice.voiceOutputEnabled) {
                      posthog.capture("voice_mode_enabled");
                    }
                  }}
                  className="p-1.5 rounded-lg transition-colors duration-150"
                  style={{
                    background: voice.voiceOutputEnabled ? "var(--accent-light)" : "transparent",
                    color: voice.voiceOutputEnabled ? "var(--accent)" : "var(--text-tertiary)",
                    border: voice.voiceOutputEnabled
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                  }}
                  title={
                    voice.voiceOutputEnabled
                      ? "Voice output ON — click to mute"
                      : "Voice output OFF — click to enable"
                  }
                >
                  {voice.voiceOutputEnabled ? (
                    <SpeakerOnIcon />
                  ) : (
                    <SpeakerOffIcon />
                  )}
                </button>

                <VoiceSettings
                  speed={voice.voiceSettings.speed}
                  voiceURI={voice.voiceSettings.voiceURI}
                  availableVoices={voice.availableVoices}
                  onSpeedChange={voice.setSpeed}
                  onVoiceChange={voice.setVoiceURI}
                />
              </div>
            )}

            {/* Quiz Me button */}
            {conversationId && messages.length >= 4 && (
              <>
                {quizGenError && (
                  <span className="text-xs" style={{ color: "var(--accent-red)" }}>
                    Something went wrong
                  </span>
                )}
                <button
                  onClick={handleQuizMe}
                  disabled={isGeneratingQuiz || isLoading}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors duration-150 disabled:opacity-50"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {isGeneratingQuiz ? (
                    <>
                      <span className="animate-spin">⏳</span> Generating...
                    </>
                  ) : quizGenError ? (
                    <>🔄 Retry Quiz</>
                  ) : (
                    <>📝 Quiz Me</>
                  )}
                </button>
              </>
            )}

            {/* Focus mode */}
            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              className="text-xs px-2 py-1 rounded-lg transition-colors duration-150"
              style={{
                color: focusMode ? "var(--accent)" : "var(--text-tertiary)",
                background: focusMode ? "var(--accent-light)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!focusMode) e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!focusMode) e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              {focusMode ? "Exit Focus" : "Focus"}
            </button>
          </div>
        </div>

        {/* ── UPGRADE BANNER (free plan only) ── */}
        {!isPro && messagesUsedToday > 0 && (
          <UpgradeBanner messagesUsed={messagesUsedToday} messagesLimit={20} />
        )}

        {/* ── CONTENT: messages + canvas split ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT: conversation thread */}
          <div className="flex flex-1 flex-col min-w-0 min-h-0">
            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6" style={{ background: 'var(--bg-base)' }}>
              <div className="max-w-[680px] mx-auto space-y-5">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center py-20">
                    <div className="text-5xl mb-4">🎓</div>
                    <h2
                      className="font-serif text-[26px] font-normal mb-2"
                      style={{ color: "var(--text-primary)", letterSpacing: "-0.3px" }}
                    >
                      Welcome to EduMind
                    </h2>
                    <p
                      className="max-w-md mx-auto"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Pick a subject from the sidebar, or just ask me anything you
                      want to learn.
                    </p>
                    {voice.speechSupported && (
                      <p
                        className="text-sm mt-4"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        🎤 You can also tap the microphone or hold Space to speak
                      </p>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={i}>
                      {/* Quick Quiz banner — every 10 messages */}
                      {i > 0 && i % 10 === 0 && msg.role === "user" && (
                        <div className="my-3 mx-auto max-w-md">
                          <Link
                            href={`/quiz${
                              activeSubject
                                ? `?subject=${encodeURIComponent(activeSubject)}`
                                : ""
                            }`}
                            className="block rounded-2xl px-4 py-3 text-center transition-colors duration-150"
                            style={{
                              background: "var(--accent-light)",
                              border: "1px solid var(--border)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--accent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)";
                            }}
                          >
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Ready to test what you&apos;ve learned? Take a quick quiz
                              {activeSubject ? ` on ${activeSubject}` : ""}!
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--accent)" }}
                            >
                              Click here to start &rarr;
                            </p>
                          </Link>
                        </div>
                      )}

                      {isUser ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex justify-end"
                        >
                          <div
                            className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-white"
                            style={{ background: "var(--accent)" }}
                          >
                            {msg.content}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex justify-start gap-2.5"
                        >
                          {/* EM badge */}
                          <div
                            className="mt-1 shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{
                              width: 24,
                              height: 24,
                              background: "var(--accent)",
                            }}
                          >
                            EM
                          </div>
                          <div
                            className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3"
                            style={{ background: "var(--bg-muted)" }}
                          >
                            <div
                              className="whitespace-pre-wrap text-sm leading-relaxed"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {msg.content}
                            </div>
                            {voice.synthSupported && (
                              <div className="mt-2 flex items-center gap-2 text-[11px]">
                                {voice.speakingMessageIndex === i ? (
                                  <button
                                    onClick={voice.stopSpeaking}
                                    className="flex items-center gap-1 transition-colors"
                                    style={{ color: "var(--accent-red)" }}
                                  >
                                    <StopIcon className="w-3 h-3" />
                                    Stop
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => voice.speak(msg.content, i)}
                                    className="flex items-center gap-1 transition-colors"
                                    style={{ color: "var(--text-tertiary)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                                  >
                                    <SpeakerOnIcon className="w-3 h-3" />
                                    Listen
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}

                {/* Neural wave when AI is thinking */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={MOTION_TRANSITION}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-full px-3 py-3 flex items-center justify-center"
                      style={{
                        background: "var(--bg-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="w-[120px] h-[2px] rounded-full overflow-hidden"
                        style={{ background: "var(--border)" }}
                      >
                        <div className="neural-wave h-full w-1/2 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Mic error banner */}
            {voice.micError && (
              <div
                className="px-4 py-2"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  borderTop: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <p className="text-xs text-center" style={{ color: "var(--accent-red)" }}>
                  {voice.micError}
                  <button
                    onClick={() => voice.toggleListening()}
                    className="ml-2 underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </p>
              </div>
            )}

            {/* Listening indicator above input */}
            {voice.isListening && (
              <div
                className="px-4 py-2"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  borderTop: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                <div className="max-w-[680px] mx-auto flex items-center justify-center gap-3">
                  <div className="flex items-center gap-[3px] h-4">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="input-wave-bar w-[3px] rounded-full"
                        style={{ animationDelay: `${idx * 0.1}s`, background: "var(--accent-red)" }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--accent-red)" }}>
                    Listening... speak now
                  </span>
                  <div className="flex items-center gap-[3px] h-4">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="input-wave-bar w-[3px] rounded-full"
                        style={{ animationDelay: `${(4 - idx) * 0.1}s`, background: "var(--accent-red)" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── INPUT BAR ── */}
            <div
              className="shrink-0 px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <form
                onSubmit={handleSubmit}
                className="relative mx-auto flex max-w-[680px] items-center gap-2 rounded-2xl px-4 py-2"
                style={{
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                }}
                onFocus={(e) => {
                  const form = e.currentTarget;
                  form.style.borderColor = "var(--accent)";
                  form.style.boxShadow = "0 0 0 2px var(--accent-light)";
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    const form = e.currentTarget;
                    form.style.borderColor = "var(--border)";
                    form.style.boxShadow = "none";
                  }
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    voice.isListening ? "Listening..." : "Ask me anything..."
                  }
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-none text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none"
                  style={{ color: "var(--text-primary)" }}
                />

                {/* Mic button */}
                {voice.speechSupported && (
                  <button
                    type="button"
                    onClick={voice.toggleListening}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
                      voice.isListening
                        ? "bg-red-500 text-white mic-active"
                        : ""
                    }`}
                    style={
                      !voice.isListening
                        ? {
                            background: "var(--bg-subtle)",
                            color: "var(--text-secondary)",
                          }
                        : undefined
                    }
                    title={
                      voice.isListening ? "Stop listening" : "Start voice input"
                    }
                  >
                    <MicIcon
                      className={voice.isListening ? "text-white" : ""}
                    />
                  </button>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 rounded-xl px-4 py-2 text-xs font-medium text-white transition-all duration-150 disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.background = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--accent)";
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Knowledge Canvas (hidden in focus mode) */}
          {!focusMode && (
            <aside
              className="hidden lg:block shrink-0 overflow-y-auto px-4 py-4"
              style={{
                width: 320,
                background: "var(--bg-muted)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              <div className="sticky top-4 space-y-3">
                <div
                  className="text-xs font-medium uppercase"
                  style={{
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Knowledge Canvas
                </div>
                {knowledgePanels.length === 0 ? (
                  <div
                    className="text-sm mt-6"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Insights will appear here as you learn.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {knowledgePanels.map((panel) => (
                      <motion.div
                        key={panel.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={MOTION_TRANSITION}
                      >
                        {panel.type === "code" ? (
                          <div
                            className="rounded-xl p-3"
                            style={{ background: 'var(--bg-base)', border: "1px solid var(--border)" }}
                          >
                            <div
                              className="text-[11px] font-medium mb-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.title}
                            </div>
                            <pre
                              className="text-[11px] font-mono rounded-lg p-3 overflow-x-auto"
                              style={{
                                color: "var(--text-primary)",
                                background: "var(--bg-muted)",
                              }}
                            >
                              {panel.content}
                            </pre>
                          </div>
                        ) : panel.type === "definition" ? (
                          <div
                            className="rounded-xl p-3"
                            style={{
                              background: 'var(--bg-base)',
                              border: "1px solid var(--border)",
                              borderLeftColor: "var(--accent)",
                              borderLeftWidth: 3,
                            }}
                          >
                            <div
                              className="text-[11px] font-medium mb-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.title}
                            </div>
                            <div
                              className="text-xs leading-relaxed"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.content}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="rounded-xl p-3"
                            style={{ background: 'var(--bg-base)', border: "1px solid var(--border)" }}
                          >
                            <div
                              className="text-[11px] font-medium mb-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.title}
                            </div>
                            <ul
                              className="list-decimal list-inside text-xs space-y-0.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.content.split("\n").map((line, idx) => (
                                <li key={idx}>{line.replace(/^\s*\d+\.\s*/, "")}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Focus mode overlay */}
      {focusMode && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-[rgba(0,0,0,0.15)]" />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        reason={upgradeReason}
      />

      {/* Neural wave keyframes */}
      <style jsx global>{`
        @keyframes neuralWave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .neural-wave {
          background: linear-gradient(
            90deg,
            var(--accent),
            transparent
          );
          animation: neuralWave 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center h-[calc(100vh-57px)]"
          style={{ background: "var(--bg-base)" }}
        >
          <div style={{ color: "var(--text-tertiary)" }}>Loading...</div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
