import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// GET /api/quiz — list user's quizzes with best scores
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all quizzes
  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch all attempts for these quizzes
  const quizIds = (quizzes ?? []).map((q) => q.id);
  let attempts: Array<{
    quiz_id: string;
    percentage: number;
  }> = [];

  if (quizIds.length > 0) {
    const { data: attemptsData } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, percentage")
      .in("quiz_id", quizIds);
    attempts = attemptsData ?? [];
  }

  // Merge best scores + attempt counts
  const quizzesWithScores = (quizzes ?? []).map((quiz) => {
    const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id);
    const bestScore =
      quizAttempts.length > 0
        ? Math.max(...quizAttempts.map((a) => a.percentage))
        : undefined;
    return {
      ...quiz,
      best_score: bestScore,
      attempts_count: quizAttempts.length,
    };
  });

  return NextResponse.json({ quizzes: quizzesWithScores });
}
