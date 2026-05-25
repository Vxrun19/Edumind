import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/progress — get user's full progress + streak data
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [progressRes, streakRes] = await Promise.all([
    supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .order("messages_sent", { ascending: false }),
    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single(),
  ]);

  return NextResponse.json({
    progress: progressRes.data ?? [],
    streak: streakRes.data ?? {
      current_streak: 0,
      longest_streak: 0,
      last_study_date: null,
      total_days_studied: 0,
    },
  });
}

// POST /api/progress — record activity (called when user sends a message)
// body: { subject: string | null, isNewSession: boolean }
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, isNewSession } = await request.json();
  const subjectName = subject || "Free Chat";

  // 1. Upsert user_progress for this subject
  const { data: existing } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("subject", subjectName)
    .single();

  if (existing) {
    await supabase
      .from("user_progress")
      .update({
        messages_sent: existing.messages_sent + 1,
        sessions_count: isNewSession
          ? existing.sessions_count + 1
          : existing.sessions_count,
        last_active: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_progress").insert({
      user_id: userId,
      subject: subjectName,
      messages_sent: 1,
      sessions_count: 1,
      last_active: new Date().toISOString(),
    });
  }

  // 2. Update streak
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (streakRow) {
    const lastDate = streakRow.last_study_date; // YYYY-MM-DD or null
    if (lastDate === todayStr) {
      // Already studied today — no streak change
    } else {
      // Check if yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak: number;
      if (lastDate === yesterdayStr) {
        // Consecutive day
        newStreak = streakRow.current_streak + 1;
      } else {
        // Missed a day (or first time)
        newStreak = 1;
      }

      const newLongest = Math.max(newStreak, streakRow.longest_streak);

      await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_study_date: todayStr,
          total_days_studied: streakRow.total_days_studied + 1,
        })
        .eq("id", streakRow.id);
    }
  } else {
    // First ever activity
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_study_date: todayStr,
      total_days_studied: 1,
    });
  }

  return NextResponse.json({ success: true });
}
