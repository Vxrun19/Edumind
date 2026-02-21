import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// POST /api/suggestions — generate next-topic suggestions when a conversation ends
// body: { conversationId: string, messages: ChatMessage[], subject: string | null }
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, messages, subject } = await request.json();

  if (!conversationId || !messages || messages.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const subjectName = subject || "General";

  // Get recent memories to inform suggestions
  const { data: memories } = await supabase
    .from("learning_memory")
    .select("memory_type, content, subject")
    .eq("user_id", userId)
    .order("confidence_score", { ascending: false })
    .limit(10);

  const memoryContext =
    memories && memories.length > 0
      ? memories
          .map((m) => `[${m.memory_type}] ${m.content} (${m.subject})`)
          .join("\n")
      : "No prior learning history.";

  // Summarize the conversation for the prompt
  const lastMessages = messages.slice(-8);
  const conversationSummary = lastMessages
    .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content.slice(0, 200)}`)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: `You suggest the next 3 learning topics for a student based on what they just studied and what they're ready for. Be specific and actionable. Return ONLY a valid JSON array of 3 strings (no markdown, no backticks). Each string should be a specific topic suggestion like "Introduction to Quadratic Equations" or "Python List Comprehensions". Keep each under 50 characters.`,
      messages: [
        {
          role: "user",
          content: `Subject area: ${subjectName}

Recent conversation:
${conversationSummary}

Student's learning history:
${memoryContext}

Based on what was just covered and what the student seems ready for, suggest 3 specific next topics they should learn. Return a JSON array of 3 strings:`,
        },
      ],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "[]";

    let suggestions: string[] = [];
    try {
      const cleaned = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      suggestions = JSON.parse(cleaned);
      // Ensure we have exactly 3 valid strings
      suggestions = suggestions
        .filter((s) => typeof s === "string" && s.length > 0)
        .slice(0, 3);
    } catch {
      console.error("Failed to parse suggestions:", responseText);
      suggestions = [];
    }

    // Save suggestions to the conversation
    if (suggestions.length > 0) {
      await supabase
        .from("conversations")
        .update({ next_topics: suggestions })
        .eq("id", conversationId)
        .eq("user_id", userId);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}

// GET /api/suggestions — get latest suggestions from recent conversations
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get conversations that have suggestions, most recent first
  const { data } = await supabase
    .from("conversations")
    .select("id, subject, title, next_topics, updated_at")
    .eq("user_id", userId)
    .not("next_topics", "eq", "{}")
    .order("updated_at", { ascending: false })
    .limit(3);

  // Flatten into a list of suggestion objects
  const suggestions: Array<{
    topic: string;
    fromSubject: string | null;
    fromConversation: string;
  }> = [];

  if (data) {
    for (const convo of data) {
      if (convo.next_topics && convo.next_topics.length > 0) {
        for (const topic of convo.next_topics) {
          if (suggestions.length < 6) {
            suggestions.push({
              topic,
              fromSubject: convo.subject,
              fromConversation: convo.title,
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
}
