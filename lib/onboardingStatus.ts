import { getCatProfile } from "@/lib/firebase/cat";
import { hasAdaptivePracticeSession } from "@/lib/firebase/adaptivePractice";
import type { CatProfileDoc } from "@/types/cat";

export interface OnboardingStatus {
  hasCatProfile: boolean;
  pillarsIntroCompleted: boolean;
  pillarsIntroCompletedAt: CatProfileDoc["pillarsIntroCompletedAt"] | null;
  hasAdaptivePracticeSession: boolean;
  hasCompletedOnboarding: boolean;
  catBaselineDone: boolean;
  pillarsDone: boolean;
  adaptivePracticeDone: boolean;
  allDone: boolean;
}

const EMPTY_STATUS: OnboardingStatus = {
  hasCatProfile: false,
  pillarsIntroCompleted: false,
  pillarsIntroCompletedAt: null,
  hasAdaptivePracticeSession: false,
  hasCompletedOnboarding: false,
  catBaselineDone: false,
  pillarsDone: false,
  adaptivePracticeDone: false,
  allDone: false,
};

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  if (!userId) {
    return EMPTY_STATUS;
  }

  const [profile, adaptiveSession] = await Promise.all([
    getCatProfile(userId),
    hasAdaptivePracticeSession(userId),
  ]);

  const catBaselineDone = Boolean(profile);
  const pillarsDone = Boolean(profile?.pillarsIntroCompleted);
  const adaptivePracticeDone = adaptiveSession;
  const allDone = catBaselineDone && pillarsDone && adaptivePracticeDone;

  return {
    hasCatProfile: catBaselineDone,
    pillarsIntroCompleted: pillarsDone,
    pillarsIntroCompletedAt: profile?.pillarsIntroCompletedAt ?? null,
    hasAdaptivePracticeSession: adaptivePracticeDone,
    hasCompletedOnboarding: allDone,
    catBaselineDone,
    pillarsDone,
    adaptivePracticeDone,
    allDone,
  };
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const status = await getOnboardingStatus(userId);
  return status.allDone;
}
