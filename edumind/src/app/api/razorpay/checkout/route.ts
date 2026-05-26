import { auth, currentUser } from "@clerk/nextjs/server";
import { razorpay, razorpayKeyId } from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

// Razorpay Plan IDs are created once in the Razorpay dashboard (or via API)
// and referenced here by env var. See README / setup instructions.
const PLAN_IDS: Record<"monthly" | "yearly", string | undefined> = {
  monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY,
  yearly: process.env.RAZORPAY_PLAN_ID_YEARLY,
};

// total_count = max number of billing cycles. Set high enough that users
// don't bump into it in practice (most cancel or change plans long before).
const TOTAL_COUNT: Record<"monthly" | "yearly", number> = {
  monthly: 60, // ~5 years of monthly cycles
  yearly: 10, // 10 years
};

// Display amounts (in paise). For Razorpay, these are derived from the Plan
// itself — we include them in the response only so the client can show the
// charge amount in the Razorpay Checkout modal description.
const AMOUNTS_PAISE: Record<"monthly" | "yearly", number> = {
  monthly: 39900, // ₹399
  yearly: 299900, // ₹2,999
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const interval: "monthly" | "yearly" =
      body.interval === "yearly" ? "yearly" : "monthly";

    const planId = PLAN_IDS[interval];
    if (!planId) {
      console.error(
        `Razorpay plan id for ${interval} is not configured. ` +
          `Set RAZORPAY_PLAN_ID_${interval.toUpperCase()} in the environment.`
      );
      return NextResponse.json(
        { error: "Subscription plan is not configured" },
        { status: 500 }
      );
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const fullName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined;
    const contact = user?.primaryPhoneNumber?.phoneNumber;

    // Create the subscription on Razorpay. The customer is implicitly created
    // by Razorpay during checkout from the prefill / form fields; we capture
    // customer_id from the subscription.activated webhook payload.
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: TOTAL_COUNT[interval],
      customer_notify: 1,
      notes: {
        userId,
        interval,
      },
    });

    return NextResponse.json({
      subscription_id: subscription.id,
      key_id: razorpayKeyId,
      amount: AMOUNTS_PAISE[interval],
      currency: "INR",
      name: "EduMind Pro",
      description:
        interval === "monthly"
          ? "EduMind Pro — Monthly subscription"
          : "EduMind Pro — Yearly subscription",
      prefill: {
        name: fullName,
        email,
        contact,
      },
    });
  } catch (err) {
    console.error("Razorpay subscription create error:", err);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
