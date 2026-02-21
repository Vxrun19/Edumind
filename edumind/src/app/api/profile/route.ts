import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/profile — get the student's profile (or null)
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({ profile: data ?? null });
}

// POST /api/profile — create or update the student's profile
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { display_name, age_group, goals, learning_style, level } = body;

  // Check if profile exists
  const { data: existing } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("student_profiles")
      .update({
        display_name,
        age_group,
        goals,
        learning_style,
        level,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ profile: data });
  } else {
    // Insert
    const { data, error } = await supabase
      .from("student_profiles")
      .insert({
        user_id: userId,
        display_name,
        age_group,
        goals,
        learning_style,
        level,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ profile: data });
  }
}
