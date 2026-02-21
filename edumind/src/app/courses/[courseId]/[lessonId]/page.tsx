"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { COURSES, LESSONS } from "@/lib/courses";

// ─── Simple markdown renderer for lesson content ────────
function renderMarkdown(text: string) {
  // Split into lines and process
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-xl font-bold text-gray-900 mt-8 mb-3 first:mt-0">
          {line.replace("## ", "")}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-lg font-semibold text-gray-800 mt-6 mb-2">
          {line.replace("### ", "")}
        </h3>
      );
      i++;
      continue;
    }

    // Code blocks
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={key++} className="bg-gray-900 text-green-400 rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono leading-relaxed">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-3 text-gray-700">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed">{formatInlineText(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-3 text-gray-700">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed">{formatInlineText(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote / tip boxes
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote key={key++} className="border-l-4 border-blue-400 bg-blue-50 rounded-r-xl p-4 my-4 text-sm text-blue-800">
          {quoteLines.map((ql, j) => (
            <p key={j} className="leading-relaxed">{formatInlineText(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-gray-700 leading-relaxed my-2">
        {formatInlineText(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Format inline bold, italic, code
function formatInlineText(text: string): React.ReactNode {
  // Very simple: handle **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Code
    const codeMatch = remaining.match(/`(.+?)`/);

    // Collect candidates
    const candidates: { index: number; length: number; element: React.ReactNode }[] = [];

    if (boldMatch && boldMatch.index !== undefined) {
      candidates.push({ index: boldMatch.index, length: boldMatch[0].length, element: <strong key={`b${k++}`} className="font-semibold text-gray-900">{boldMatch[1]}</strong> });
    }
    if (codeMatch && codeMatch.index !== undefined) {
      candidates.push({ index: codeMatch.index, length: codeMatch[0].length, element: <code key={`c${k++}`} className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">{codeMatch[1]}</code> });
    }

    // Pick the earliest match
    candidates.sort((a, b) => a.index - b.index);
    const firstMatch = candidates.length > 0 ? candidates[0] : null;

    if (firstMatch) {
      if (firstMatch.index > 0) {
        parts.push(remaining.substring(0, firstMatch.index));
      }
      parts.push(firstMatch.element);
      remaining = remaining.substring(firstMatch.index + firstMatch.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ─── Chat Message Component ───────────────────────────────
function ChatMessage({ role, content }: { role: string; content: string }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        role === "user"
          ? "bg-[var(--accent)] text-white"
          : "bg-white border border-gray-200 text-gray-800"
      }`}>
        {content}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function LessonPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const course = COURSES.find((c) => c.id === courseId);
  const lessons = LESSONS[courseId] ?? [];
  const lesson = lessons.find((l) => l.id === lessonId);
  const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const [content, setContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [courseJustCompleted, setCourseJustCompleted] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load lesson content
  useEffect(() => {
    if (!course || !lesson) return;

    setIsLoadingContent(true);
    setContent("");
    setChatMessages([]);
    setChatOpen(false);
    setIsCompleted(false);
    setCourseJustCompleted(false);
    setShowCelebration(false);

    // Fetch progress first
    fetch(`/api/courses/progress?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.progress?.completed_lessons?.includes(lessonId)) {
          setIsCompleted(true);
        }
      })
      .catch(() => {});

    // Generate lesson content
    fetch("/api/courses/lesson-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonTitle: lesson.title,
        courseName: course.title,
        courseSubject: course.subject,
        lessonNumber: lesson.lessonNumber,
        totalLessons: course.totalLessons,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content || "Failed to load lesson content.");
      })
      .catch(() => {
        setContent("Failed to load lesson content. Please refresh to try again.");
      })
      .finally(() => {
        setIsLoadingContent(false);
      });
  }, [courseId, lessonId, course, lesson]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleMarkComplete = useCallback(async () => {
    if (!course) return;
    setIsMarking(true);
    try {
      const res = await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId,
          totalLessons: course.totalLessons,
          certificateName: course.title,
        }),
      });
      const data = await res.json();
      setIsCompleted(true);

      if (data.justCompleted) {
        setCourseJustCompleted(true);
        setShowCelebration(true);
      }
    } catch {
      // ignore
    } finally {
      setIsMarking(false);
    }
  }, [courseId, lessonId, course]);

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/courses/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          lessonTitle: lesson?.title,
          courseName: course?.title,
          lessonContent: content.substring(0, 2000),
        }),
      });
      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.response }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, chatMessages, isChatLoading, lesson, course, content]);

  if (!course || !lesson) {
    return (
      <main className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">{"\uD83D\uDE15"}</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lesson not found</h1>
          <Link href="/courses" className="text-[var(--accent)] hover:text-[var(--accent)] text-sm font-medium">
            {"\u2190"} Back to Courses
          </Link>
        </div>
      </main>
    );
  }

  // Estimate read time from content
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl relative overflow-hidden">
            {/* Confetti animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    backgroundColor: ["#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#22c55e", "#ec4899"][i % 6],
                    animation: `confetti-fall ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              ))}
            </div>

            <div className="text-6xl mb-4">{"\uD83C\uDF89"}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Congratulations!
            </h2>
            <p className="text-gray-500 mb-4">
              You completed <strong>{course.title}</strong>!
            </p>

            {/* Certificate */}
            <div className="border-2 border-gray-200 rounded-xl p-6 mb-6 bg-gradient-to-br from-yellow-50 to-amber-50">
              <div className="text-4xl mb-2">{"\uD83C\uDF93"}</div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Certificate of Completion</p>
              <p className="text-lg font-bold text-gray-900">{course.title}</p>
              <p className="text-sm text-gray-500 mt-2">
                Completed on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCelebration(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Close
              </button>
              <Link
                href="/progress"
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent)] text-white font-medium py-3 rounded-xl transition-colors text-sm text-center"
              >
                View Certificate
              </Link>
            </div>
          </div>

          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] px-4 py-10">
        <div className="max-w-[720px] mx-auto">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6 text-xs text-[var(--text-tertiary)]">
            <Link
              href={`/courses/${courseId}`}
              className="hover:text-[var(--text-secondary)] transition-colors"
            >
              ← {course.title}
            </Link>
            <span>
              Lesson {lesson.lessonNumber} of {course.totalLessons}
            </span>
          </div>

          {/* Lesson Header */}
          <header className="mb-6">
            <h1 className="text-[32px] sm:text-[40px] font-semibold text-[var(--text-primary)] mb-2">
              {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
              <span>⏱ {lesson.estimatedMinutes} min lesson</span>
              {!isLoadingContent && <span>📖 ~{readTime} min read</span>}
              {isCompleted && (
                <span className="text-[11px] text-emerald-600">
                  ✓ Completed
                </span>
              )}
            </div>
          </header>

          {/* Lesson Content */}
          <section className="mb-8">
            {isLoadingContent ? (
              <div className="text-center py-16 text-sm text-[var(--text-secondary)]">
                Generating your personalized lesson...
              </div>
            ) : (
              <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
                {renderMarkdown(content)}
              </div>
            )}
          </section>

          {/* Mark Complete */}
          {!isLoadingContent && (
            <div className="mb-8 flex items-center justify-center">
              {isCompleted ? (
                <div className="text-xs text-emerald-600">
                  ✓ Lesson Complete
                </div>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  disabled={isMarking}
                  className="px-6 py-2 rounded-full text-xs font-medium text-[var(--bg-base)] bg-[var(--accent)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)] transition-shadow"
                >
                  {isMarking ? "Saving..." : "Mark Complete"}
                </button>
              )}
            </div>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-10">
            {prevLesson ? (
              <Link href={`/courses/${courseId}/${prevLesson.id}`}>
                ← Prev
              </Link>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <Link href={`/courses/${courseId}/${nextLesson.id}`}>
                Next →
              </Link>
            ) : (
              <Link href={`/courses/${courseId}`}>Back to course →</Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
