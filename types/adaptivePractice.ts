import type { FieldValue, Timestamp } from "firebase/firestore";
import type { CatAxisId } from "@/config/catEngine";
import type { AdaptiveCluster } from "@/types/dailyPath";

export type BehaviorSuggestionType = "clarity_7_words" | "breath_before_react" | "two_min_no_phone";

export interface AdaptivePracticeSessionDoc {
  userId: string;
  cluster: AdaptiveCluster;
  primaryAxis: CatAxisId;
  microExerciseCompleted: boolean;
  behaviorSuggestionType: BehaviorSuggestionType;
  source: string;
  createdAt: Timestamp | FieldValue;
}
