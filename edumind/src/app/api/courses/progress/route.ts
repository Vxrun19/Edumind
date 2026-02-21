import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch user's course progress (all or specific course)
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get("courseId");

  if (courseId) {
    const { data, error } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ progress: data });
  }

  const { data, error } = await supabase
    .from("course_progress")
    .select("*")
    .eq("user_id", userId)
    .order("last_accessed", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data ?? [] });
}

// POST: Update course progress (mark lesson complete)
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, lessonId, totalLessons, certificateName } = await request.json();

  if (!courseId || !lessonId) {
    return NextResponse.json({ error: "courseId and lessonId required" }, { status: 400 });
  }

  // Check if progress record exists
  const { data: existing } = await supabase
    .from("course_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  if (existing) {
    // Add lesson to completed list if not already there
    const completedLessons: string[] = existing.completed_lessons || [];
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }
    const total = totalLessons || completedLessons.length;
    const percentage = Math.round((completedLessons.length / total) * 100);
    const isComplete = percentage >= 100;

    const updateData: Record<string, unknown> = {
      completed_lessons: completedLessons,
      percentage,
      last_accessed: new Date().toISOString(),
    };

    if (isComplete && !existing.completed_at) {
      updateData.completed_at = new Date().toISOString();
      if (certificateName) {
        updateData.certificate_name = certificateName;
      }
    }

    const { data, error } = await supabase
      .from("course_progress")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ progress: data, justCompleted: isComplete && !existing.completed_at });
  } else {
    // Create new progress record
    const completedLessons = [lessonId];
    const total = totalLessons || 1;
    const percentage = Math.round((1 / total) * 100);
    const isComplete = percentage >= 100;

    const insertData: Record<string, unknown> = {
      user_id: userId,
      course_id: courseId,
      completed_lessons: completedLessons,
      percentage,
      started_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    };

    if (isComplete) {
      insertData.completed_at = new Date().toISOString();
      if (certificateName) {
        insertData.certificate_name = certificateName;
      }
    }

    const { data, error } = await supabase
      .from("course_progress")
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ progress: data, justCompleted: isComplete });
  }
}
