import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { FieldValue, Timestamp } from "firebase/firestore";

export type DailyPracticePathVariant = "soft" | "challenge" | null;

export interface DailyPracticeDoc {
  userId: string;
  date: string; // YYYY-MM-DD
  configId: string;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
  completed: boolean;
  xpEarned: number;
  nodesCompletedCount?: number;
  pathVariant?: DailyPracticePathVariant;
  durationSeconds?: number | null;
  startedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue | null;
  timeAvailableMin?: number | null;
}
