import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data || data.status === "canceled") {
    return NextResponse.json({ plan: "free" });
  }

  return NextResponse.json({
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
  });
}
