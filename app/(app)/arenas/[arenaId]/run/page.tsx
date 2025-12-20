"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QuickStroopTask from "@/components/onboarding/QuickStroopTask";
import { ARENA_TASKS } from "@/config/arenas";
import { useAuth } from "@/components/AuthProvider";
import { getUserProfileSnapshot, type UserSubscription } from "@/lib/profileEngine";
import { FREE_LIMITS } from "@/lib/gatingRules";
import { getArenaRunsById } from "@/lib/usageStats";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export default function ArenaRunPage() {
  const router = useRouter();
  const params = useParams<{ arenaId: string }>();
  const { user } = useAuth();
  const arena = useMemo(() => {
    const arenaId = params?.arenaId;
    return arenaId ? ARENA_TASKS[arenaId as keyof typeof ARENA_TASKS] : undefined;
  }, [params]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getUserProfileSnapshot(user.uid)
      .then((snapshot) => {
        if (!cancelled) setSubscription(snapshot?.subscription ?? null);
      })
      .catch(() => {
        if (!cancelled) setSubscription(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getArenaRunsById(user.uid)
      .then((counts) => {
        if (!cancelled) setRunCount(counts[arena?.id ?? ""] ?? 0);
      })
      .catch(() => {
        if (!cancelled) setRunCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user, arena]);

  if (!arena) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-center text-[var(--omni-ink)]">
        <p className="text-sm">Arena nu există încă.</p>
      </div>
    );
  }

  const isPremium = subscription?.status === "premium";
  const limitReached = !isPremium && runCount >= FREE_LIMITS.arenaRunsPerArena;

  if (limitReached) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-center text-[var(--omni-ink)]">
        <div className="mx-auto max-w-lg rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Arena</p>
          <h1 className="mt-2 text-2xl font-semibold">Acces limitat</h1>
          <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
            Ai folosit runda gratuită pentru această Arenă. Rulările nelimitate sunt incluse în OmniMental Premium.
          </p>
          <OmniCtaButton className="mt-4 justify-center" onClick={() => router.replace("/upgrade")}>Upgrade</OmniCtaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <QuickStroopTask
          arenaId={arena.id as keyof typeof ARENA_TASKS}
          sessionType="arena"
          flowTag="arena"
          onComplete={() => {
            router.replace("/arenas");
          }}
        />
      </div>
    </div>
  );
}
