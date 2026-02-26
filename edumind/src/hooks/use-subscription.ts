"use client";

import { useState, useEffect, useCallback } from "react";
import { PLANS, type Plan } from "@/lib/plans";

interface SubscriptionData {
  plan: Plan;
  isPro: boolean;
  isLoading: boolean;
  limits: typeof PLANS.free.limits | typeof PLANS.pro.limits;
  refresh: () => void;
}

let cachedPlan: Plan | null = null;

export function useSubscription(): SubscriptionData {
  const [plan, setPlan] = useState<Plan>(cachedPlan ?? "free");
  const [isLoading, setIsLoading] = useState(cachedPlan === null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        const p = data.plan === "pro" ? "pro" : "free";
        cachedPlan = p;
        setPlan(p);
      }
    } catch {
      // default to free
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedPlan === null) {
      fetchSubscription();
    }
  }, [fetchSubscription]);

  const refresh = useCallback(() => {
    cachedPlan = null;
    setIsLoading(true);
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    plan,
    isPro: plan === "pro",
    isLoading,
    limits: PLANS[plan].limits,
    refresh,
  };
}
