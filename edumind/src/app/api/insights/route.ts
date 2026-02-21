import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/insights — get user's learning insights
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("learning_insights")
    .select("*")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({
    insight: data ?? {
      avg_session_length: 0,
      preferred_time_of_day: "unknown",
      most_active_subject: "General",
      response_style_feedback: "",
      attention_span: "medium",
    },
  });
}

// POST /api/insights — update user's learning insights (called by analysis)
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Calculate insights from user data

  // 1. Average session length — count messages per conversation
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
    avgSessionLength = Math.round((count ?? 0) / conversations.length);
  }

  // 2. Preferred time of day — analyze message timestamps
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("created_at")
    .in(
      "conversation_id",
      (conversations ?? []).map((c) => c.id)
    )
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(50);

  let preferredTime = "unknown";
  if (recentMessages && recentMessages.length > 0) {
    const hours = recentMessages.map(
      (m) => new Date(m.created_at).getHours()
    );
    const morningCount = hours.filter((h) => h >= 5 && h < 12).length;
    const afternoonCount = hours.filter((h) => h >= 12 && h < 18).length;
    const eveningCount = hours.filter((h) => h >= 18 || h < 5).length;

    if (morningCount >= afternoonCount && morningCount >= eveningCount) {
      preferredTime = "morning";
    } else if (afternoonCount >= eveningCount) {
      preferredTime = "afternoon";
    } else {
      preferredTime = "evening";
    }
  }

  // 3. Most active subject
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("subject, messages_sent")
    .eq("user_id", userId)
    .order("messages_sent", { ascending: false })
    .limit(1);

  const mostActiveSubject =
    progressData?.[0]?.subject ?? "General";

  // 4. Attention span — based on avg message length of user messages
  const { data: userMessages } = await supabase
    .from("messages")
    .select("content")
    .in(
      "conversation_id",
      (conversations ?? []).map((c) => c.id)
    )
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(30);

  let attentionSpan = "medium";
  if (userMessages && userMessages.length > 0) {
    const avgLen =
      userMessages.reduce((s, m) => s + m.content.length, 0) /
      userMessages.length;
    if (avgLen < 30) attentionSpan = "short";
    else if (avgLen > 120) attentionSpan = "long";
    else attentionSpan = "medium";
  }

  // 5. Response style feedback — analyze behavior memories
  const { data: behaviorMemories } = await supabase
    .from("learning_memory")
    .select("content")
    .eq("user_id", userId)
    .in("memory_type", ["behavior", "preference"])
    .order("confidence_score", { ascending: false })
    .limit(5);

  const responseStyleFeedback =
    behaviorMemories && behaviorMemories.length > 0
      ? behaviorMemories.map((m) => m.content).join("; ")
      : "";

  // Upsert insights
  const { data: existing } = await supabase
    .from("learning_insights")
    .select("id")
    .eq("user_id", userId)
    .single();

  const insightData = {
    avg_session_length: avgSessionLength,
    preferred_time_of_day: preferredTime,
    most_active_subject: mostActiveSubject,
    response_style_feedback: responseStyleFeedback,
    attention_span: attentionSpan,
    last_analyzed: new Date().toISOString(),
  };

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

  return NextResponse.json({ insight: insightData });
}
