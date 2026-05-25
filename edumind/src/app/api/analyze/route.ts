import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// POST /api/analyze — background analysis after every AI response
// body: { messages: [last 3 exchanges], subject: string | null, conversationId: string }
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, subject, conversationId } = await request.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages to analyze" }, { status: 400 });
  }

  const subjectName = subject || "General";

  // Take only the last 6 messages (3 exchanges = 3 user + 3 assistant)
  const recentMessages = messages.slice(-6);
  const conversationExcerpt = recentMessages
    .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  try {
    // ─── Silent analysis call to Anthropic ───────────────
    const analysisResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are a learning analytics engine. You analyze student-tutor conversations to extract actionable learning insights. Be specific and concise. Only include meaningful insights, not obvious ones.

Return ONLY a valid JSON array (no markdown, no backticks, no explanation). Each element must have:
- memory_type: one of "topic_mastered", "topic_struggling", "interest", "behavior", "correction", "preference"
- content: a specific, concise observation (e.g. "Understands basic algebra but struggles with word problems")
- confidence_score: integer 1-5 (5 = very confident)
- subject: the relevant subject area

If there are no meaningful insights to extract, return an empty array [].`,
      messages: [
        {
          role: "user",
          content: `Analyze this conversation excerpt and extract learning insights about the student. The current subject is "${subjectName}".

Conversation:
${conversationExcerpt}

Look for:
1. Did the student understand? (look for "I get it", "that makes sense", asking to move on)
2. Did the student struggle? (look for "I dont understand", "can you explain again", short confused replies)
3. What specific topics came up?
4. Did the student show excitement about something? (look for "thats cool", "wow", "interesting")
5. Did the student correct the AI or disagree?
6. What was the student's message length and engagement level?
7. Did the student ask for simpler explanations or more detail?

Return a JSON array of memories:`,
        },
      ],
    });

    const analysisText =
      analysisResponse.content[0].type === "text"
        ? analysisResponse.content[0].text
        : "[]";

    // Parse the JSON response
    let memories: Array<{
      memory_type: string;
      content: string;
      confidence_score: number;
      subject: string;
    }> = [];

    try {
      // Strip any markdown code fences if present
      const cleaned = analysisText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      memories = JSON.parse(cleaned);
    } catch {
      // If parsing fails, skip saving memories
      console.error("Failed to parse analysis response:", analysisText);
    }

    // Validate and save memories
    const validTypes = [
      "topic_mastered",
      "topic_struggling",
      "interest",
      "behavior",
      "correction",
      "preference",
    ];

    const validMemories = memories.filter(
      (m) =>
        validTypes.includes(m.memory_type) &&
        m.content &&
        m.content.length > 5 &&
        m.confidence_score >= 1 &&
        m.confidence_score <= 5
    );

    if (validMemories.length > 0) {
      // Save memories via batch insert + dedup
      for (const mem of validMemories) {
        const { data: existing } = await supabase
          .from("learning_memory")
          .select("id, confidence_score")
          .eq("user_id", userId)
          .eq("memory_type", mem.memory_type)
          .eq("subject", mem.subject || subjectName)
          .ilike("content", `%${mem.content.slice(0, 25)}%`)
          .limit(1)
          .single();

        if (existing) {
          if (mem.confidence_score >= existing.confidence_score) {
            await supabase
              .from("learning_memory")
              .update({
                content: mem.content,
                confidence_score: mem.confidence_score,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
          }
        } else {
          await supabase.from("learning_memory").insert({
            user_id: userId,
            subject: mem.subject || subjectName,
            memory_type: mem.memory_type,
            content: mem.content,
            confidence_score: mem.confidence_score,
          });
        }
      }
    }

    // ─── Update insights every 5th analysis ──────────────
    // Count total memories to decide if we should re-calculate insights
    const { count } = await supabase
      .from("learning_memory")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count ?? 0) % 5 === 0) {
      // Trigger insights recalculation (fire-and-forget via internal fetch)
      // We do it inline here to avoid circular calls
      await recalculateInsights(userId);
    }

    return NextResponse.json({
      success: true,
      memoriesExtracted: validMemories.length,
      conversationId,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    // Don't fail the user experience — analysis is background
    return NextResponse.json({ success: false, memoriesExtracted: 0 });
  }
}

// ─── Inline insights recalculation ───────────────────────
async function recalculateInsights(userId: string) {
  try {
    // 1. Average session length
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId);

    let avgSessionLength = 0;
    if (conversations && conversations.length > 0) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in(
          "conversation_id",
          conversations.map((c) => c.id)
        );
      avgSessionLength = Math.round(
        (count ?? 0) / conversations.length
      );
    }

    // 2. Preferred time of day
    const convoIds = (conversations ?? []).map((c) => c.id);
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("created_at")
      .in("conversation_id", convoIds.length > 0 ? convoIds : ["__none__"])
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(50);

    let preferredTime = "unknown";
    if (recentMessages && recentMessages.length > 0) {
      const hours = recentMessages.map(
        (m) => new Date(m.created_at).getHours()
      );
      const morning = hours.filter((h) => h >= 5 && h < 12).length;
      const afternoon = hours.filter((h) => h >= 12 && h < 18).length;
      const evening = hours.filter((h) => h >= 18 || h < 5).length;
      if (morning >= afternoon && morning >= evening) preferredTime = "morning";
      else if (afternoon >= evening) preferredTime = "afternoon";
      else preferredTime = "evening";
    }

    // 3. Most active subject
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("subject, messages_sent")
      .eq("user_id", userId)
      .order("messages_sent", { ascending: false })
      .limit(1);
    const mostActiveSubject = progressData?.[0]?.subject ?? "General";

    // 4. Attention span
    const { data: userMsgs } = await supabase
      .from("messages")
      .select("content")
      .in("conversation_id", convoIds.length > 0 ? convoIds : ["__none__"])
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(30);

    let attentionSpan = "medium";
    if (userMsgs && userMsgs.length > 0) {
      const avgLen =
        userMsgs.reduce((s, m) => s + m.content.length, 0) / userMsgs.length;
      if (avgLen < 30) attentionSpan = "short";
      else if (avgLen > 120) attentionSpan = "long";
    }

    // 5. Response style feedback from behavior memories
    const { data: behaviorMems } = await supabase
      .from("learning_memory")
      .select("content")
      .eq("user_id", userId)
      .in("memory_type", ["behavior", "preference"])
      .order("confidence_score", { ascending: false })
      .limit(5);

    const responseStyleFeedback =
      behaviorMems && behaviorMems.length > 0
        ? behaviorMems.map((m) => m.content).join("; ")
        : "";

    // Upsert
    const insightData = {
      avg_session_length: avgSessionLength,
      preferred_time_of_day: preferredTime,
      most_active_subject: mostActiveSubject,
      response_style_feedback: responseStyleFeedback,
      attention_span: attentionSpan,
      last_analyzed: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("learning_insights")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabase
        .from("learning_insights")
        .update(insightData)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("learning_insights")
        .insert({ user_id: userId, ...insightData });
    }
  } catch (error) {
    console.error("Insights recalculation error:", error);
  }
}
