import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, payment_provider")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return NextResponse.json({ plan: "free" });
  }

  // Pro access if all three hold:
  // 1. plan is 'pro'
  // 2. current_period_end is in the future (so the period they paid for hasn't ended)
  // 3. status is in the active-or-grace set
  //
  // Status semantics:
  //   active     → Pro (normal)
  //   past_due   → Pro (grace — Razorpay payment recovery in progress)
  //   canceled   → Pro UNTIL period_end passes (cancel-at-cycle-end flow)
  //   paused     → Free (deliberate pause, no billing)
  //   completed  → Free (reached Razorpay total_count terminal state)
  const now = new Date();
  const periodEnd = data.current_period_end
    ? new Date(data.current_period_end)
    : null;
  const hasValidPeriod = periodEnd !== null && periodEnd > now;
  const activeOrGrace =
    data.status === "active" ||
    data.status === "past_due" ||
    data.status === "canceled";

  const isPro = data.plan === "pro" && hasValidPeriod && activeOrGrace;

  if (!isPro) {
    return NextResponse.json({ plan: "free" });
  }

  return NextResponse.json({
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    paymentProvider: data.payment_provider,
  });
}
