"use client";

import { useEffect, useMemo } from "react";
import { hasFoundationCycleCompleted, syncFoundationCompletionFlag } from "@/lib/dailyCompletion";
import { deriveAccessTier } from "@/lib/accessTier";
import { useAuth } from "@/components/AuthProvider";
import { useProgressFacts } from "@/components/useProgressFacts";

export function useUserAccessTier() {
  const { user } = useAuth();
  const { data: progressFacts, loading } = useProgressFacts(user?.uid ?? null);
  const accessTier = useMemo(() => deriveAccessTier({ progress: progressFacts ?? null }), [progressFacts]);

  useEffect(() => {
    if (!user || loading) return;
    if (progressFacts?.stats?.foundationDone) return;
    if (hasFoundationCycleCompleted()) {
      syncFoundationCompletionFlag();
    }
  }, [loading, progressFacts?.stats?.foundationDone, user]);

  return { accessTier, loading };
}
