import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/quiz-mode/save — save quiz results
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, difficulty, score, total_questions, percentage, weak_topics, answers, time_taken } =
    await request.json();

  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      user_id: userId,
      subject: subject || "Mixed/Random",
      difficulty: difficulty || "intermediate",
      score: score ?? 0,
      total_questions: total_questions ?? 0,
      percentage: percentage ?? 0,
      weak_topics: weak_topics ?? [],
      answers: answers ?? [],
      time_taken: time_taken ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Save quiz result error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result: data });
}
