"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useUserAccessTier } from "@/components/useUserAccessTier";

export function AccessGate({ minTier, children, redirectTo = "/today", reason }: { minTier: number; children: ReactNode; redirectTo?: string; reason?: string }) {
  const router = useRouter();
  const { accessTier, loading } = useUserAccessTier();
  const unlocked = accessTier.tier >= minTier;

  useEffect(() => {
    if (!loading && !unlocked) {
      const target = reason ? `${redirectTo}?locked=${encodeURIComponent(reason)}` : redirectTo;
      router.replace(target);
    }
  }, [loading, redirectTo, reason, router, unlocked]);

  if (loading) {
    return null;
  }

  if (!unlocked) {
    return null;
  }

  return <>{children}</>;
}
