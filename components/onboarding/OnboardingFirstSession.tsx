"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getUserProfileSnapshot, advanceArcProgress, addTraitXp, getTraitLabel } from "@/lib/profileEngine";
import { getFirstSessionPlan, type SessionPlan } from "@/lib/sessionRecommenderEngine";
import WowLessonShell, { type WowCompletionPayload } from "@/components/wow/WowLessonShell";
import { getWowLessonDefinition, resolveTraitPrimaryForModule } from "@/config/wowLessonsV2";
import { recordSessionTelemetry } from "@/lib/telemetry";
import { buildPlanKpiEvent } from "@/lib/sessionTelemetry";

type Props = {
  onComplete: () => void;
};

export default function OnboardingFirstSession({ onComplete }: Props) {
  const { user, authReady } = useAuth();
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPlan = useCallback(
    async (userId: string, cancelToken: { cancelled: boolean }) => {
      setLoading(true);
      try {
        const snapshot = await getUserProfileSnapshot(userId);
        if (cancelToken.cancelled) return;
        setPlan(getFirstSessionPlan(snapshot));
      } catch {
        if (cancelToken.cancelled) return;
        setPlan(getFirstSessionPlan(null));
      } finally {
        if (!cancelToken.cancelled) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!authReady || !user) return;
    const token = { cancelled: false };
    void loadPlan(user.uid, token);
    return () => {
      token.cancelled = true;
    };
  }, [authReady, user, loadPlan]);

  const handleLessonComplete = useCallback(
    async (payload: WowCompletionPayload) => {
      if (!user || !plan) {
        onComplete();
        return;
      }
      const kpiEvent = buildPlanKpiEvent(
        {
          userId: user.uid,
          moduleId: plan.moduleId,
          canonDomain: plan.canonDomain,
          traitPrimary: plan.traitPrimary,
          traitSecondary: plan.traitSecondary,
        },
        { source: "daily", difficultyFeedback: payload.difficultyFeedback },
      );
      try {
        await recordSessionTelemetry({
          sessionId: `onboarding-first-session-${Date.now()}`,
          userId: user.uid,
          sessionType: "daily",
          arcId: plan.arcId,
          moduleId: plan.moduleId,
          traitSignals: payload.traitSignals,
          kpiEvents: [kpiEvent],
          difficultyFeedback: payload.difficultyFeedback,
          origin: "real",
          flowTag: "onboarding",
        });
      } catch (error) {
        console.warn("recordSessionTelemetry failed", error);
      }
      if (plan.arcId) {
        try {
          await advanceArcProgress(user.uid, plan.arcId, { completedToday: true });
        } catch (error) {
          console.warn("advanceArcProgress failed", error);
        }
      }
      const moduleTraitPrimary = resolveTraitPrimaryForModule(plan.moduleId, plan.traitPrimary);
      if (moduleTraitPrimary) {
        try {
          await addTraitXp(user.uid, moduleTraitPrimary, 10);
        } catch (error) {
          console.warn("addTraitXp failed", error);
        }
      }
      onComplete();
    },
    [user, plan, onComplete],
  );

  if (!authReady) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--omni-ink-soft)]">
        Se pregătește prima sesiune...
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--omni-ink)]">
        Ai nevoie de un cont (anonim sau complet) pentru a continua.
      </section>
    );
  }

  if (loading || !plan) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--omni-ink-soft)]">
        Personalizăm sesiunea…
      </section>
    );
  }

  const definition = getWowLessonDefinition(plan.moduleId);
  if (!definition) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--omni-ink)]">
        Modulul nu este disponibil momentan.
      </section>
    );
  }

  const xpTraitLabel = definition?.traitPrimary ?? plan?.traitPrimary ?? null;
  const xpLabel = xpTraitLabel ? `+10 XP ${getTraitLabel(xpTraitLabel)}` : undefined;

  return <WowLessonShell lesson={definition} sessionType="daily" xpRewardLabel={xpLabel} onComplete={handleLessonComplete} />;
}
