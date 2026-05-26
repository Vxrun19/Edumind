import { auth } from "@clerk/nextjs/server";
import { razorpay } from "@/lib/razorpay";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = await supabase
      .from("subscriptions")
      .select("razorpay_subscription_id, payment_provider, status")
      .eq("user_id", userId)
      .single();

    if (
      !data?.razorpay_subscription_id ||
      data.payment_provider !== "razorpay"
    ) {
      return NextResponse.json(
        { error: "No active Razorpay subscription found" },
        { status: 404 }
      );
    }

    if (data.status === "canceled") {
      return NextResponse.json(
        { error: "Subscription is already cancelled" },
        { status: 400 }
      );
    }

    // cancel_at_cycle_end=true → subscription stays active until the current
    // billing period ends. Razorpay will fire subscription.cancelled at
    // cycle end; the webhook handler is idempotent so this is safe.
    await razorpay.subscriptions.cancel(data.razorpay_subscription_id, true);

    // Mirror the cancellation locally for immediate UI feedback. The
    // /api/subscription endpoint correctly keeps returning plan='pro'
    // until current_period_end passes, even with status='canceled'.
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Razorpay cancel error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
