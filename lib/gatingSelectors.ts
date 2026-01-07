import type { ProgressFact } from "@/lib/progressFacts";
import type { UserProfileSnapshot } from "@/lib/profileEngine";
import { GATING } from "./gatingConfig";
import { CAT_LITE_EXTENDED_AXES } from "@/lib/catLite";

function getStats(facts: ProgressFact | null | undefined) {
  return facts?.stats ?? null;
}

export function getTotalDailySessionsCompleted(facts: ProgressFact | null | undefined): number {
  return Number(getStats(facts)?.dailySessionsCompleted ?? 0);
}

export function getTotalActionsCompleted(facts: ProgressFact | null | undefined): number {
  return Number(getStats(facts)?.actionsCompleted ?? 0);
}

export function canAccessWizard(facts: ProgressFact | null | undefined): boolean {
  return getTotalDailySessionsCompleted(facts) >= GATING.wizardMinDailySessions;
}

export function canAccessOmniKuno(facts: ProgressFact | null | undefined): boolean {
  return getTotalDailySessionsCompleted(facts) >= GATING.omniKunoMinDailySessions;
}

export function canInviteBuddy(facts: ProgressFact | null | undefined): boolean {
  return (
    getTotalDailySessionsCompleted(facts) >= GATING.buddyMinDailySessions &&
    getTotalActionsCompleted(facts) >= GATING.buddyMinActionSuccesses
  );
}

export function needsStyleProfile(
  profile: UserProfileSnapshot | null | undefined,
  facts: ProgressFact | null | undefined,
): boolean {
  if (profile?.style) return false;
  return getTotalDailySessionsCompleted(facts) >= 3;
}

export function needsCatLitePart2(
  profile: UserProfileSnapshot | null | undefined,
  facts: ProgressFact | null | undefined,
): boolean {
  if (!profile?.catProfile) return true;
  return CAT_LITE_EXTENDED_AXES.some((axis) => typeof profile.catProfile?.axes?.[axis]?.score !== "number");
}
