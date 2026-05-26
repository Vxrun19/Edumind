// SERVER-ONLY Razorpay client.
// Uses the secret key — must never be imported from a "use client" component
// or any code that ships to the browser.

if (typeof window !== "undefined") {
  throw new Error(
    "razorpay imported in browser context — this module is server-only " +
      "and exposes RAZORPAY_KEY_SECRET. Use a fetch to an /api route instead."
  );
}

import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId) {
  throw new Error("RAZORPAY_KEY_ID is not set");
}
if (!keySecret) {
  throw new Error("RAZORPAY_KEY_SECRET is not set");
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// Exported separately so authenticated API routes can include it in their
// response payload for the client-side Checkout modal. The key_id is
// public-safe by design (Razorpay's analogue of Stripe's pk_).
export const razorpayKeyId = keyId;
