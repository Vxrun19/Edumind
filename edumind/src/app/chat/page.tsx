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
import {
  Menu,
  X,
  Plus,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
  Mic,
  Volume2,
  VolumeX,
  Square,
  FileQuestion,
  RefreshCw,
  Loader2,
  ArrowLeft,
  ArrowUp,
  type LucideIcon,
} from "lucide-react";
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

// Lucide icon for each canonical subject. Replaces the old emoji
// indicators in the sidebar list and top-bar subject label.
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Dna,
};

// JEE/NEET starter prompts for the empty state. One per subject pillar
// (P/C/B/M) so the affordance covers all four tracks. Clicking a chip
// pre-fills the input — no new logic, just calls setInput + focuses.
const STARTER_PROMPTS: ReadonlyArray<string> = [
  "Explain projectile motion",
  "Difference between SN1 and SN2 reactions",
  "Mitosis vs meiosis",
  "How do I integrate by parts?",
];

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

// ─── Markdown rendering ────────────────────────────────
// The tutor responds in markdown (bold, lists, inline code, code blocks).
// The original chat page rendered msg.content as plain text — markdown
// syntax leaked into the UI as literal asterisks/backticks. Fixed by
// parsing tutor messages here. User messages stay plain text — humans
// don't type markdown.
//
// Custom parser rather than a dependency (react-markdown / remark) for
// consistency with the existing Knowledge Canvas regex approach in this
// file. Covers the tutor's actual output: paragraphs, **bold**, *italic*,
// `inline code`, ```code blocks```, 1. numbered lists, - bulleted lists.

type MdBlock =
  | { type: "code"; content: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] }
  | { type: "p"; content: string };

function parseBlocks(text: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block: ```...```
    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++; // skip closing fence (or EOF)
      blocks.push({ type: "code", content: body.join("\n") });
      continue;
    }

    // Numbered list: a contiguous run of lines starting "1. " "2. " etc.
    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Bulleted list: lines starting "- " or "* " (but NOT "**" which is
    // bold). The "* " followed by space is the disambiguating signal.
    if (/^\s*-\s/.test(line) || /^\s*\*\s/.test(line)) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (/^\s*-\s/.test(lines[i]) || /^\s*\*\s/.test(lines[i]))
      ) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Blank line — paragraph separator
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph: gather contiguous non-blank lines that aren't a list
    // or code fence start.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !/^\s*\d+\.\s/.test(lines[i]) &&
      !/^\s*-\s/.test(lines[i]) &&
      !/^\s*\*\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "p", content: paraLines.join("\n") });
    }
  }

  return blocks;
}

// Render inline formatting within a chunk of text: **bold**, *italic*,
// `inline code`. Multi-pass via a single combined regex.
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Order: inline code first (so backticks aren't disturbed by bold/italic),
  // then bold (must come before italic because ** would otherwise be
  // greedily matched as italic-italic).
  // Restricted to single line ([^*\n]+) to avoid runaway matches.
  const regex = /(`([^`]+)`)|(\*\*([^*\n]+)\*\*)|(\*([^*\n]+)\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[1]) {
      // `inline code`
      parts.push(
        <code
          key={`${keyBase}-${key++}`}
          className="font-mono"
          style={{
            background: "var(--bg-muted)",
            color: "var(--text-primary)",
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.92em",
          }}
        >
          {match[2]}
        </code>
      );
    } else if (match[3]) {
      // **bold**
      parts.push(
        <strong
          key={`${keyBase}-${key++}`}
          style={{ fontWeight: 600, color: "var(--text-primary)" }}
        >
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      // *italic*
      parts.push(
        <em key={`${keyBase}-${key++}`} style={{ fontStyle: "italic" }}>
          {match[6]}
        </em>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length > 0 ? parts : [text];
}

function MarkdownContent({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        if (block.type === "code") {
          return (
            <pre
              key={key}
              className="font-mono overflow-x-auto"
              style={{
                background: "var(--bg-muted)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              <code>{block.content}</code>
            </pre>
          );
        }
        if (block.type === "ol") {
          return (
            <ol
              key={key}
              className="list-decimal list-outside pl-5 space-y-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              {block.items.map((item, idx) => (
                <li key={idx}>{renderInline(item, `${key}-${idx}`)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "ul") {
          return (
            <ul
              key={key}
              className="list-disc list-outside pl-5 space-y-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              {block.items.map((item, idx) => (
                <li key={idx}>{renderInline(item, `${key}-${idx}`)}</li>
              ))}
            </ul>
          );
        }
        // paragraph: single \n becomes a soft line break via
        // white-space: pre-line (matches the old whitespace-pre-wrap
        // behavior the original chat had).
        return (
          <p
            key={key}
            style={{
              color: "var(--text-primary)",
              whiteSpace: "pre-line",
              margin: 0,
            }}
          >
            {renderInline(block.content, key)}
          </p>
        );
      })}
    </div>
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

  // Pre-fills the input with a starter prompt. Pure UI affordance —
  // user still hits Enter / Send to actually send. No machinery touched.
  function applyStarterPrompt(text: string) {
    setInput(text);
    inputRef.current?.focus();
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
    <div
      className="relative flex h-[calc(100vh-57px)]"
      style={{ background: "var(--bg-base)" }}
    >
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
          background: "var(--bg-muted)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo + back to dashboard */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-serif text-[15px] transition-colors duration-150 text-[color:var(--text-primary)] hover:text-[color:var(--accent)]"
            style={{ letterSpacing: "-0.01em" }}
          >
            <ArrowLeft size={14} />
            EduMind
          </Link>
        </div>

        {/* New Chat */}
        <div className="px-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors duration-150 text-[color:var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Plus size={14} />
            New Chat
          </button>
        </div>

        {/* Subjects label */}
        <div className="px-4 mt-5 mb-2">
          <span className="label">Subjects</span>
        </div>

        {/* Subject list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {SUBJECTS.map((subject) => {
            const active = activeSubject === subject.name;
            const Icon = SUBJECT_ICONS[subject.name];
            return (
              <button
                key={subject.name}
                onClick={() => handleSubjectClick(subject.name)}
                className="w-full text-left px-3 py-2 text-[14px] flex items-center gap-2 transition-all duration-150"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: active ? 500 : 400,
                  borderRadius: "var(--radius-md)",
                  borderLeft: active
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "var(--bg-subtle)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {Icon && (
                  <Icon
                    size={16}
                    style={{
                      color: active
                        ? "var(--accent)"
                        : "var(--text-tertiary)",
                    }}
                  />
                )}
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
              background: "var(--bg-muted)",
              borderRight: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 font-serif text-[15px] text-[color:var(--text-primary)]"
                style={{ letterSpacing: "-0.01em" }}
              >
                <ArrowLeft size={14} />
                EduMind
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-3">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors duration-150 text-[color:var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <Plus size={14} />
                New Chat
              </button>
            </div>
            <div className="px-4 mt-5 mb-2">
              <span className="label">Subjects</span>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
              {SUBJECTS.map((subject) => {
                const active = activeSubject === subject.name;
                const Icon = SUBJECT_ICONS[subject.name];
                return (
                  <button
                    key={subject.name}
                    onClick={() => handleSubjectClick(subject.name)}
                    className="w-full text-left px-3 py-2 text-[14px] flex items-center gap-2 transition-all duration-150"
                    style={{
                      background: active
                        ? "var(--accent-light)"
                        : "transparent",
                      color: active
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                      fontWeight: active ? 500 : 400,
                      borderRadius: "var(--radius-md)",
                      borderLeft: active
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                    }}
                  >
                    {Icon && (
                      <Icon
                        size={16}
                        style={{
                          color: active
                            ? "var(--accent)"
                            : "var(--text-tertiary)",
                        }}
                      />
                    )}
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
        {/* ── TOP BAR ──
         *  Frosted glass over scrolling messages. Uses --bg-base derived
         *  rgba (replaces the old warm-cream rgba). */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: 48,
            background: "rgba(248, 249, 254, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left: mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
            style={{
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
            }}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Center: subject indicator */}
          <div className="flex-1 flex items-center justify-center gap-1.5">
            {activeSubject &&
              (() => {
                const Icon = SUBJECT_ICONS[activeSubject];
                return Icon ? (
                  <Icon
                    size={14}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                ) : null;
              })()}
            <span
              className="font-sans text-[13px] font-medium truncate max-w-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {activeSubject ?? "Free Chat"}
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
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 transition-colors"
                    style={{
                      background: "var(--error-bg)",
                      color: "var(--error)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "var(--radius-md)",
                    }}
                    title="Stop speaking"
                  >
                    <Square size={12} fill="currentColor" />
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
                  className="p-1.5 transition-colors duration-150"
                  style={{
                    background: voice.voiceOutputEnabled
                      ? "var(--accent-light)"
                      : "transparent",
                    color: voice.voiceOutputEnabled
                      ? "var(--accent)"
                      : "var(--text-tertiary)",
                    border: voice.voiceOutputEnabled
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}
                  title={
                    voice.voiceOutputEnabled
                      ? "Voice output ON — click to mute"
                      : "Voice output OFF — click to enable"
                  }
                >
                  {voice.voiceOutputEnabled ? (
                    <Volume2 size={14} />
                  ) : (
                    <VolumeX size={14} />
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
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--error)" }}
                  >
                    Something went wrong
                  </span>
                )}
                <button
                  onClick={handleQuizMe}
                  disabled={isGeneratingQuiz || isLoading}
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 transition-colors duration-150 disabled:opacity-50 text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] hover:border-[color:var(--accent)]"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-pill)",
                  }}
                >
                  {isGeneratingQuiz ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Generating…
                    </>
                  ) : quizGenError ? (
                    <>
                      <RefreshCw size={12} />
                      Retry quiz
                    </>
                  ) : (
                    <>
                      <FileQuestion size={12} />
                      Quiz me
                    </>
                  )}
                </button>
              </>
            )}

            {/* Focus mode */}
            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              className="text-[12px] font-medium px-2.5 py-1 transition-colors duration-150"
              style={{
                color: focusMode ? "var(--accent)" : "var(--text-tertiary)",
                background: focusMode ? "var(--accent-light)" : "transparent",
                borderRadius: "var(--radius-md)",
              }}
              onMouseEnter={(e) => {
                if (!focusMode)
                  e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!focusMode)
                  e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              {focusMode ? "Exit focus" : "Focus"}
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
            <div
              className="flex-1 min-h-0 overflow-y-auto px-6 py-6"
              style={{ background: "var(--bg-base)" }}
            >
              <div className="max-w-[680px] mx-auto space-y-5">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center py-16 md:py-20">
                    <span className="label">Start a session</span>
                    <h2
                      className="font-serif font-normal mt-3"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "clamp(26px, 3.5vw, 36px)",
                        lineHeight: 1.2,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      What do you want to learn today?
                    </h2>
                    <p
                      className="font-sans text-[14px] max-w-md mx-auto mt-3"
                      style={{
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      Pick a subject from the sidebar, type any JEE or NEET
                      question, or try one of these to get started.
                    </p>

                    {/* Starter prompt chips — pre-fill the input on click.
                     *  Pure UI affordance, no machinery change. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 max-w-md mx-auto">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => applyStarterPrompt(prompt)}
                          className="text-left px-4 py-3 text-[13px] transition-all duration-150 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:-translate-y-[1px]"
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "var(--shadow-xs)",
                            lineHeight: 1.4,
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    {voice.speechSupported && (
                      <p
                        className="font-sans text-[12px] mt-6"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Tip: tap the microphone or hold Space to speak.
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
                        <div className="my-4 mx-auto max-w-md">
                          <Link
                            href={`/quiz${
                              activeSubject
                                ? `?subject=${encodeURIComponent(activeSubject)}`
                                : ""
                            }`}
                            className="block px-4 py-3 text-center transition-colors duration-150"
                            style={{
                              background: "var(--accent-light)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-xl)",
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
                            <p
                              className="font-sans text-[13px] font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Ready to test what you&apos;ve learned? Take a
                              quick quiz
                              {activeSubject ? ` on ${activeSubject}` : ""}.
                            </p>
                            <p
                              className="font-sans text-[12px] mt-1"
                              style={{ color: "var(--accent)" }}
                            >
                              Start quiz →
                            </p>
                          </Link>
                        </div>
                      )}

                      {isUser ? (
                        // STUDENT BUBBLE — right-aligned, soft violet tint,
                        // slate-primary text. Matches the product preview
                        // demo on the landing.
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex justify-end"
                        >
                          <div
                            className="font-sans text-[14px] leading-relaxed whitespace-pre-wrap"
                            style={{
                              maxWidth: "78%",
                              background: "var(--accent-light)",
                              color: "var(--text-primary)",
                              padding: "12px 16px",
                              borderRadius: "var(--radius-2xl)",
                              borderTopRightRadius: "var(--radius-sm)",
                            }}
                          >
                            {msg.content}
                          </div>
                        </motion.div>
                      ) : (
                        // TUTOR BUBBLE — left-aligned, clean white surface
                        // with subtle elevation. No avatar — the surface
                        // treatment + alignment differentiate.
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex justify-start"
                        >
                          <div
                            style={{
                              maxWidth: "85%",
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-2xl)",
                              borderTopLeftRadius: "var(--radius-sm)",
                              padding: "14px 18px",
                              boxShadow: "var(--shadow-xs)",
                            }}
                          >
                            <div
                              className="font-serif text-[15px]"
                              style={{
                                color: "var(--text-primary)",
                                lineHeight: 1.65,
                              }}
                            >
                              <MarkdownContent text={msg.content} />
                            </div>
                            {voice.synthSupported && (
                              <div className="mt-2 flex items-center gap-2 text-[11px]">
                                {voice.speakingMessageIndex === i ? (
                                  <button
                                    onClick={voice.stopSpeaking}
                                    className="flex items-center gap-1 font-sans transition-colors"
                                    style={{ color: "var(--error)" }}
                                  >
                                    <Square size={10} fill="currentColor" />
                                    Stop
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => voice.speak(msg.content, i)}
                                    className="flex items-center gap-1 font-sans transition-colors text-[color:var(--text-tertiary)] hover:text-[color:var(--accent)]"
                                  >
                                    <Volume2 size={10} />
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
                      className="px-4 py-3 flex items-center justify-center"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-2xl)",
                        boxShadow: "var(--shadow-xs)",
                      }}
                    >
                      <div
                        className="w-[120px] h-[2px] overflow-hidden"
                        style={{
                          background: "var(--bg-muted)",
                          borderRadius: "var(--radius-pill)",
                        }}
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
                  background: "var(--error-bg)",
                  borderTop: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <p
                  className="text-[12px] text-center font-sans"
                  style={{ color: "var(--error)" }}
                >
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
                  background: "var(--error-bg)",
                  borderTop: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                <div className="max-w-[680px] mx-auto flex items-center justify-center gap-3">
                  <div className="flex items-center gap-[3px] h-4">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="input-wave-bar w-[3px] rounded-full"
                        style={{
                          animationDelay: `${idx * 0.1}s`,
                          background: "var(--error)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="font-sans text-[12px] font-medium"
                    style={{ color: "var(--error)" }}
                  >
                    Listening… speak now
                  </span>
                  <div className="flex items-center gap-[3px] h-4">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="input-wave-bar w-[3px] rounded-full"
                        style={{
                          animationDelay: `${(4 - idx) * 0.1}s`,
                          background: "var(--error)",
                        }}
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
                className="relative mx-auto flex max-w-[680px] items-end gap-2 px-3 py-2 transition-all duration-150 focus-within:border-[color:var(--accent)] focus-within:[box-shadow:0_0_0_3px_var(--accent-light)]"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-2xl)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    voice.isListening ? "Listening…" : "Ask anything…"
                  }
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-none font-sans text-[14px] placeholder:text-[color:var(--text-tertiary)] focus:outline-none py-2"
                  style={{ color: "var(--text-primary)" }}
                />

                {/* Mic button */}
                {voice.speechSupported && (
                  <button
                    type="button"
                    onClick={voice.toggleListening}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
                      voice.isListening ? "mic-active" : ""
                    }`}
                    style={
                      voice.isListening
                        ? {
                            background: "var(--error)",
                            color: "white",
                          }
                        : {
                            background: "var(--bg-muted)",
                            color: "var(--text-secondary)",
                          }
                    }
                    title={
                      voice.isListening
                        ? "Stop listening"
                        : "Start voice input"
                    }
                  >
                    <Mic size={16} />
                  </button>
                )}

                {/* Send button — uses .btn-primary visual (gradient pill
                 *  with glow) for consistency with the rest of the app. */}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    fontSize: 13,
                    padding: "9px 14px",
                  }}
                  aria-label="Send message"
                >
                  <ArrowUp size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Knowledge Canvas (hidden in focus mode) */}
          {!focusMode && (
            <aside
              className="hidden lg:block shrink-0 overflow-y-auto px-4 py-5"
              style={{
                width: 320,
                background: "var(--bg-muted)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              <div className="sticky top-4 space-y-3">
                <span className="label">Knowledge canvas</span>
                {knowledgePanels.length === 0 ? (
                  <p
                    className="font-sans text-[13px] mt-4"
                    style={{
                      color: "var(--text-tertiary)",
                      lineHeight: 1.5,
                    }}
                  >
                    Insights from this conversation will appear here —
                    definitions, steps, and code snippets.
                  </p>
                ) : (
                  <div className="space-y-3 mt-3">
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
                            className="p-3"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-lg)",
                              boxShadow: "var(--shadow-xs)",
                            }}
                          >
                            <div
                              className="font-sans text-[11px] font-semibold mb-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.title}
                            </div>
                            <pre
                              className="text-[11px] font-mono p-3 overflow-x-auto"
                              style={{
                                color: "var(--text-primary)",
                                background: "var(--bg-muted)",
                                borderRadius: "var(--radius-md)",
                              }}
                            >
                              {panel.content}
                            </pre>
                          </div>
                        ) : panel.type === "definition" ? (
                          <div
                            className="p-3"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border)",
                              borderLeft: "3px solid var(--accent)",
                              borderRadius: "var(--radius-lg)",
                              boxShadow: "var(--shadow-xs)",
                            }}
                          >
                            <div
                              className="font-sans text-[11px] font-semibold mb-1"
                              style={{ color: "var(--accent)" }}
                            >
                              {panel.title}
                            </div>
                            <div
                              className="font-serif text-[13px]"
                              style={{
                                color: "var(--text-secondary)",
                                lineHeight: 1.55,
                              }}
                            >
                              {panel.content}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="p-3"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-lg)",
                              boxShadow: "var(--shadow-xs)",
                            }}
                          >
                            <div
                              className="font-sans text-[11px] font-semibold mb-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {panel.title}
                            </div>
                            <ul
                              className="list-decimal list-inside font-sans text-[12px] space-y-0.5"
                              style={{
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                              }}
                            >
                              {panel.content.split("\n").map((line, idx) => (
                                <li key={idx}>
                                  {line.replace(/^\s*\d+\.\s*/, "")}
                                </li>
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

      {/* ─── Local animation keyframes ──────────────────────────
       *  neural-wave: the "thinking" bar gradient sweep
       *  input-wave-bar: the listening indicator bar scale wave
       *  mic-active: the mic button pulsing ring when recording
       *  The latter two were previously referenced as classNames but
       *  never defined anywhere — fixed here.                      */}
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

        @keyframes waveBar {
          0%, 100% {
            transform: scaleY(0.35);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .input-wave-bar {
          height: 100%;
          transform-origin: center;
          animation: waveBar 1s ease-in-out infinite;
        }

        @keyframes micPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }
        .mic-active {
          animation: micPulse 1.5s ease-in-out infinite;
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
          <div
            className="font-sans text-[13px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Loading…
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
