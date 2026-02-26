"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get("priceId");
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!priceId) {
      router.replace("/pricing");
      return;
    }

    fetch("/api/stripe/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch(() => setError("Something went wrong"))
      .finally(() => setLoading(false));
  }, [priceId, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Preparing secure checkout...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="notebook-panel p-8 max-w-md text-center">
          <p className="mb-4" style={{ color: "var(--error, #dc2626)" }}>
            {error}
          </p>
          <button
            onClick={() => router.replace("/pricing")}
            className="text-sm hover:underline"
            style={{ color: "var(--accent)" }}
          >
            &larr; Back to pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-2"
            style={{ color: "var(--accent)" }}
          >
            UPGRADE
          </p>
          <h1
            className="text-3xl font-serif"
            style={{ color: "var(--text-primary)" }}
          >
            EduMind Pro
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>

        {/* Embedded Stripe Form */}
        <div
          className="notebook-panel overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          {clientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <button
            onClick={() => router.replace("/pricing")}
            className="text-sm transition-colors hover:opacity-70"
            style={{ color: "var(--text-tertiary)" }}
          >
            &larr; Back to pricing
          </button>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-base)" }}
        >
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
