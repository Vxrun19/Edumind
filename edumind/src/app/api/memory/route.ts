import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/memory — get user's learning memories
// query params: ?subject=Math&limit=20
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subject = request.nextUrl.searchParams.get("subject");
  const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;

  let query = supabase
    .from("learning_memory")
    .select("*")
    .eq("user_id", userId)
    .order("confidence_score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (subject) {
    query = query.eq("subject", subject);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memories: data ?? [] });
}

// POST /api/memory — save one or more memories
// body: { memories: Array<{ subject, memory_type, content, confidence_score }> }
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memories } = await request.json();

  if (!Array.isArray(memories) || memories.length === 0) {
    return NextResponse.json(
      { error: "memories array is required" },
      { status: 400 }
    );
  }

  // Deduplicate: if a very similar memory already exists, update it instead
  const results = [];
  for (const mem of memories) {
    // Check for existing similar memory
    const { data: existing } = await supabase
      .from("learning_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("memory_type", mem.memory_type)
      .eq("subject", mem.subject || "General")
      .ilike("content", `%${mem.content.slice(0, 30)}%`)
      .limit(1)
      .single();

    if (existing) {
      // Update confidence and content if the new one is more confident
      if (mem.confidence_score >= existing.confidence_score) {
        const { data } = await supabase
          .from("learning_memory")
          .update({
            content: mem.content,
            confidence_score: mem.confidence_score,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        results.push(data);
      } else {
        results.push(existing);
      }
    } else {
      // Insert new memory
      const { data } = await supabase
        .from("learning_memory")
        .insert({
          user_id: userId,
          subject: mem.subject || "General",
          memory_type: mem.memory_type,
          content: mem.content,
          confidence_score: mem.confidence_score ?? 3,
        })
        .select()
        .single();
      results.push(data);
    }
  }

  return NextResponse.json({ memories: results });
}
