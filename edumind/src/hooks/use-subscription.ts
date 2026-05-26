"use client";

import { useState, useEffect, useCallback } from "react";
import { PLANS, type Plan, type PaymentProvider } from "@/lib/plans";

interface CachedSubscription {
  plan: Plan;
  status: string | null;
  currentPeriodEnd: string | null;
  paymentProvider: PaymentProvider | null;
}

interface SubscriptionData {
  plan: Plan;
  isPro: boolean;
  isLoading: boolean;
  limits: typeof PLANS.free.limits | typeof PLANS.pro.limits;
  status: string | null;
  currentPeriodEnd: string | null;
  paymentProvider: PaymentProvider | null;
  refresh: () => void;
}

let cached: CachedSubscription | null = null;

const defaultData: CachedSubscription = {
  plan: "free",
  status: null,
  currentPeriodEnd: null,
  paymentProvider: null,
};

export function useSubscription(): SubscriptionData {
  const [data, setData] = useState<CachedSubscription>(cached ?? defaultData);
  const [isLoading, setIsLoading] = useState(cached === null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const body = await res.json();
        const next: CachedSubscription = {
          plan: body.plan === "pro" ? "pro" : "free",
          status: body.status ?? null,
          currentPeriodEnd: body.currentPeriodEnd ?? null,
          paymentProvider:
            body.paymentProvider === "razorpay" ||
            body.paymentProvider === "stripe"
              ? body.paymentProvider
              : null,
        };
        cached = next;
        setData(next);
      }
    } catch {
      // default to free on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cached === null) fetchSubscription();
  }, [fetchSubscription]);

  const refresh = useCallback(() => {
    cached = null;
    setIsLoading(true);
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    plan: data.plan,
    isPro: data.plan === "pro",
    isLoading,
    limits: PLANS[data.plan].limits,
    status: data.status,
    currentPeriodEnd: data.currentPeriodEnd,
    paymentProvider: data.paymentProvider,
    refresh,
  };
}
