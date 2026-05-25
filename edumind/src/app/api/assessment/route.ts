import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type { LearningAssessment } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET — fetch the user's assessment (if it exists)
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assessment: (data as LearningAssessment) ?? null });
}

// POST — create or update the assessment
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const row = {
    user_id: userId,
    grade_level: body.grade_level ?? "",
    learner_type: body.learner_type ?? "",
    cognitive_style: body.cognitive_style ?? {},
    reasoning_score: body.reasoning_score ?? 0,
    reasoning_speed: body.reasoning_speed ?? [],
    subject_levels: body.subject_levels ?? {},
    subject_most_improve: body.subject_most_improve ?? "",
    subject_hardest: body.subject_hardest ?? "",
    subject_most_enjoyed: body.subject_most_enjoyed ?? "",
    goals: body.goals ?? {},
    challenge_behavior: body.challenge_behavior ?? {},
    study_habits: body.study_habits ?? {},
    personality_words: body.personality_words ?? [],
    motivation_type: body.motivation_type ?? "",
    personal_note: body.personal_note ?? "",
    learning_persona: body.learning_persona ?? "",
    completed_at: new Date().toISOString(),
  };

  // Upsert pattern
  const { data: existing } = await supabase
    .from("assessments")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("assessments")
      .update(row)
      .eq("id", existing.id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("assessments").insert(row);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
