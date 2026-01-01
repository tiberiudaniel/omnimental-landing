"use client";

import { useEffect, useMemo, useState } from "react";
import { hasFoundationCycleCompleted, syncFoundationCompletionFlag } from "@/lib/dailyCompletion";
import {
  deriveAccessTier,
  deriveAccessFlags,
  deriveNavLinksForTier,
  type MembershipTier,
  type ProgressTier,
} from "@/lib/accessTier";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";

const MEMBERSHIP_KEY = "e2e_membership_override";
const PROGRESS_TIER_KEY = "e2e_progress_tier_override";

export function useUserAccessTier() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: progressFacts, loading: progressLoading } = useProgressFacts(user?.uid ?? null);
  const [membershipOverride, setMembershipOverride] = useState<MembershipTier | null>(null);
  const [tierOverride, setTierOverride] = useState<ProgressTier | null>(null);

  const readMembershipOverride = () => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(MEMBERSHIP_KEY);
    if (raw === "premium" || raw === "free") {
      return raw;
    }
    return null;
  };

  const readTierOverride = () => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PROGRESS_TIER_KEY);
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    if (value < 0 || value > 5) return null;
    return value as ProgressTier;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncOverrides = () => {
      setMembershipOverride(readMembershipOverride());
      setTierOverride(readTierOverride());
    };
    const raf = window.requestAnimationFrame(syncOverrides);
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || (event.key !== MEMBERSHIP_KEY && event.key !== PROGRESS_TIER_KEY && event.key !== "e2e_progress_override")) {
        return;
      }
      syncOverrides();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const baseAccessTier = useMemo(() => deriveAccessTier({ progress: progressFacts ?? null }), [progressFacts]);
  const derivedMembership: MembershipTier = useMemo(
    () => (profile?.isPremium ? "premium" : "free"),
    [profile?.isPremium],
  );
  const membershipTier = membershipOverride ?? derivedMembership;

  const accessTier = useMemo(() => {
    if (tierOverride == null) {
      return baseAccessTier;
    }
    return {
      tier: tierOverride,
      flags: deriveAccessFlags(tierOverride),
      navLinks: deriveNavLinksForTier(tierOverride),
    };
  }, [baseAccessTier, tierOverride]);

  useEffect(() => {
    if (!user || progressLoading) return;
    if (progressFacts?.stats?.foundationDone) return;
    if (hasFoundationCycleCompleted()) {
      syncFoundationCompletionFlag();
    }
  }, [progressLoading, progressFacts?.stats?.foundationDone, user]);

  const loading = progressLoading || profileLoading;
  return { accessTier, membershipTier, loading };
}
