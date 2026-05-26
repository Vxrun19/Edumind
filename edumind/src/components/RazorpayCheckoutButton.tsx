"use client";

import { useCallback, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

// ─── Razorpay Checkout window globals ──────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    callback: (response: { error?: { description?: string } }) => void
  ) => void;
}

// ─── Component ─────────────────────────────────────────────
interface Props {
  interval: "monthly" | "yearly";
  label: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function RazorpayCheckoutButton({
  interval,
  label,
  disabled,
  className,
  style,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (loading || !scriptReady) return;
    setLoading(true);
    setError(null);

    posthog.capture("razorpay_upgrade_clicked", { interval });

    try {
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start checkout");
      }

      const data = await res.json();

      const rzp = new window.Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: data.name,
        description: data.description,
        prefill: data.prefill,
        // Match brand --accent (#4A7C59) — Razorpay needs a literal hex
        theme: { color: "#4A7C59" },
        handler: () => {
          // Payment succeeded client-side; the webhook is the source of
          // truth, but redirect to /checkout/return for the success UX.
          router.push(
            `/checkout/return?provider=razorpay&subscription_id=${data.subscription_id}`
          );
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rzp.on("payment.failed", (response) => {
        const description = response.error?.description ?? "Payment failed";
        console.error("Razorpay payment failed:", description);
        setError(description);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }, [interval, loading, scriptReady, router]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !scriptReady}
        className={className}
        style={style}
      >
        {loading ? "Loading..." : label}
      </button>
      {error && (
        <p
          className="text-xs mt-2"
          style={{ color: "#dc2626" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </>
  );
}
