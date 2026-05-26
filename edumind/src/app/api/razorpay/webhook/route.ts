import crypto from "crypto";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// ─── Signature verification ─────────────────────────────────
// Razorpay signs the raw request body with HMAC-SHA256 using the webhook
// secret and sends the hex digest in the x-razorpay-signature header.
function verifySignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Types ──────────────────────────────────────────────────
interface RazorpaySubscriptionEntity {
  id: string;
  customer_id?: string;
  status: string;
  current_end: number | null; // unix epoch seconds
  notes?: Record<string, string>;
}

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: { entity: { id: string; subscription_id?: string } };
  };
}

// ─── Handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── Idempotency ──────────────────────────────────────────
  // Razorpay can redeliver the same event on retry. The x-razorpay-event-id
  // header is unique per event; we insert it into razorpay_webhook_events
  // first. If it conflicts (PK violation, code 23505), we've already
  // processed it and return success immediately.
  const eventId = req.headers.get("x-razorpay-event-id");
  if (!eventId) {
    return NextResponse.json(
      { error: "Missing x-razorpay-event-id" },
      { status: 400 }
    );
  }

  const { error: dedupeError } = await supabase
    .from("razorpay_webhook_events")
    .insert({ event_id: eventId, event_type: event.event });

  if (dedupeError) {
    if ((dedupeError as { code?: string }).code === "23505") {
      return NextResponse.json({ received: true, deduped: true });
    }
    console.error("Razorpay webhook dedupe insert failed:", dedupeError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // ─── Event dispatch ───────────────────────────────────────
  const subscription = event.payload.subscription?.entity;
  if (!subscription) {
    // Non-subscription event (e.g. raw payment.* webhooks if configured).
    // Acknowledge and move on.
    return NextResponse.json({ received: true });
  }

  const userId = subscription.notes?.userId;
  if (!userId) {
    console.warn(
      `Razorpay webhook ${event.event} for ${subscription.id} has no userId in notes — skipping`
    );
    return NextResponse.json({ received: true });
  }

  const periodEndIso = subscription.current_end
    ? new Date(subscription.current_end * 1000).toISOString()
    : null;
  const now = new Date().toISOString();

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.resumed": {
      // First successful charge OR subsequent renewal OR resume-after-pause.
      // Upsert: user enters or stays in Pro, status active, extend period_end.
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          razorpay_customer_id: subscription.customer_id,
          razorpay_subscription_id: subscription.id,
          payment_provider: "razorpay",
          plan: "pro",
          status: "active",
          current_period_end: periodEndIso ?? now,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "subscription.cancelled": {
      // User cancelled. Keep current_period_end intact so /api/subscription
      // continues returning Pro until that date passes.
      const update: Record<string, string> = {
        status: "canceled",
        updated_at: now,
      };
      if (periodEndIso) update.current_period_end = periodEndIso;
      await supabase
        .from("subscriptions")
        .update(update)
        .eq("user_id", userId);
      break;
    }

    case "subscription.completed": {
      // Reached total_count (5 years of monthly / 10 years of yearly).
      // Final terminal state — downgrade.
      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled",
          updated_at: now,
        })
        .eq("user_id", userId);
      break;
    }

    case "subscription.halted": {
      // Payment / mandate failure, retries exhausted. GRACE policy:
      // keep plan='pro', mark status='past_due'. Frontend surfaces a
      // banner asking the student to update their payment method.
      // We do NOT instantly downgrade — UPI mandates drop for transient
      // reasons constantly in India.
      await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: now,
        })
        .eq("user_id", userId);
      break;
    }

    case "subscription.paused": {
      await supabase
        .from("subscriptions")
        .update({
          status: "paused",
          updated_at: now,
        })
        .eq("user_id", userId);
      break;
    }

    case "subscription.authenticated": {
      // Mandate set up, no charge yet. subscription.activated will follow
      // shortly. We could pre-insert a 'pending' row here but it's not
      // strictly needed — the activated handler does the upsert.
      break;
    }

    default:
      // Other events (payment.* etc.) — ignored for now.
      break;
  }

  return NextResponse.json({ received: true });
}
