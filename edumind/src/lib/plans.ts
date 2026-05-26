export const PLANS = {
  free: {
    name: 'Free',
    limits: {
      messagesPerDay: 20,
      quizzesPerDay: 3,
      courses: 'free_only' as const,
      voiceMode: false,
      assessmentFull: false,
    },
  },
  pro: {
    name: 'Pro',
    // INR pricing (India — Razorpay). Razorpay Plan IDs are configured via
    // RAZORPAY_PLAN_ID_MONTHLY / RAZORPAY_PLAN_ID_YEARLY env vars consumed
    // by /api/razorpay/checkout.
    priceInrMonthly: 399,
    priceInrYearly: 2999,
    // USD pricing (International — Stripe). Real Stripe price IDs come from
    // NEXT_PUBLIC_STRIPE_PRICE_MONTHLY / NEXT_PUBLIC_STRIPE_PRICE_YEARLY env
    // vars consumed by src/app/pricing/page.tsx.
    priceUsdMonthly: 9.99,
    priceUsdYearly: 79.99,
    limits: {
      messagesPerDay: 999,
      quizzesPerDay: 999,
      courses: 'all' as const,
      voiceMode: true,
      assessmentFull: true,
    },
  },
} as const;

export type Plan = 'free' | 'pro';
export type Region = 'india' | 'international';
export type PaymentProvider = 'razorpay' | 'stripe';
