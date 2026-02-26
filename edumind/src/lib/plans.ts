export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
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
    price: 9.99,
    priceYearly: 79.99,
    stripePriceIdMonthly: 'price_placeholder_monthly',
    stripePriceIdYearly: 'price_placeholder_yearly',
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
