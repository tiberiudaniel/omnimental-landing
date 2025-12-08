import { getCatProfile } from "@/lib/firebase/cat";
import { hasAdaptivePracticeSession } from "@/lib/firebase/adaptivePractice";
import type { CatProfileDoc } from "@/types/cat";

export interface OnboardingStatus {
  hasCatProfile: boolean;
  pillarsIntroCompleted: boolean;
  pillarsIntroCompletedAt: CatProfileDoc["pillarsIntroCompletedAt"] | null;
  hasAdaptivePracticeSession: boolean;
  hasCompletedOnboarding: boolean;
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  if (!userId) {
    return {
      hasCatProfile: false,
      pillarsIntroCompleted: false,
      pillarsIntroCompletedAt: null,
      hasAdaptivePracticeSession: false,
      hasCompletedOnboarding: false,
    };
  }

  const [profile, adaptiveSession] = await Promise.all([
    getCatProfile(userId),
    hasAdaptivePracticeSession(userId),
  ]);

  const pillarsCompleted = Boolean(profile?.pillarsIntroCompleted);

  return {
    hasCatProfile: Boolean(profile),
    pillarsIntroCompleted: pillarsCompleted,
    pillarsIntroCompletedAt: profile?.pillarsIntroCompletedAt ?? null,
    hasAdaptivePracticeSession: adaptiveSession,
    hasCompletedOnboarding: Boolean(profile && pillarsCompleted && adaptiveSession),
  };
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const status = await getOnboardingStatus(userId);
  return status.hasCompletedOnboarding;
}
