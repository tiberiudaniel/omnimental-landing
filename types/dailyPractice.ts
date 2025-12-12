import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { FieldValue, Timestamp } from "firebase/firestore";

export interface DailyPracticeDoc {
  userId: string;
  date: string; // YYYY-MM-DD
  configId: string;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
  completed: boolean;
  xpEarned: number;
  startedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue | null;
}
