import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Count today's messages
  const { data: userConvos } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);

  let messagesUsed = 0;
  if (userConvos && userConvos.length > 0) {
    const convoIds = userConvos.map((c: { id: string }) => c.id);
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convoIds)
      .eq("role", "user")
      .gte("created_at", `${today}T00:00:00.000Z`);
    messagesUsed = count ?? 0;
  }

  // Count today's quizzes
  const { count: quizzesCount } = await supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00.000Z`);

  return NextResponse.json({
    messagesUsed,
    quizzesUsed: quizzesCount ?? 0,
  });
}
