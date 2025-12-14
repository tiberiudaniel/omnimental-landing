export type Plan = "monthly" | "annual";

const priceMap: Record<Plan, string | undefined> = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
  annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
};

const reversePriceMap: Record<string, Plan> = Object.entries(priceMap).reduce<Record<string, Plan>>((acc, [planKey, priceId]) => {
  if (priceId) {
    acc[priceId] = planKey as Plan;
  }
  return acc;
}, {});

export function getPriceIdForPlan(plan: Plan): string {
  const priceId = priceMap[plan];
  if (!priceId) {
    throw new Error(`Stripe price ID missing for plan "${plan}"`);
  }
  return priceId;
}

export function getSupportedPlans(): Plan[] {
  return Object.keys(priceMap).filter((plan) => Boolean(priceMap[plan as Plan])) as Plan[];
}

export function getPlanForPriceId(priceId?: string | null): Plan | null {
  if (!priceId) {
    return null;
  }
  return reversePriceMap[priceId] ?? null;
}
