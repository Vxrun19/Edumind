import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

export async function GET(request: NextRequest) {
  const stripe = getStripe();

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 }
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return NextResponse.json({
    status: session.status,
    customerEmail: session.customer_details?.email,
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await request.json();
  if (!priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  // Check if user already has a Stripe customer ID
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  let customerId = existing?.stripe_customer_id;

  if (!customerId) {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    ui_mode: "embedded",
    return_url: `${appUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return NextResponse.json({ clientSecret: session.client_secret });
}
