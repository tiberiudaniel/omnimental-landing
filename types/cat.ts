import type { FieldValue, Timestamp } from "firebase/firestore";
import type { CatAxisId } from "@/config/catEngine";

export type CatScores = Record<CatAxisId, number>;

export type CatSubAxisId = string;

export type CatSubScores = Partial<Record<CatSubAxisId, number | null>>;

export type CatAnswerMap = Record<string, number>;

export type SelfInsightAgreement = "yes" | "partial" | "no";

export interface CatProfileDoc {
  userId: string;
  version: "cat-v2";
  axisScores: CatScores;
  subScores: CatSubScores;
  answers: CatAnswerMap;
  completedAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  strongestAxis?: CatAxisId;
  weakestAxis?: CatAxisId;
  selfInsightAgreement?: SelfInsightAgreement | null;
  selfInsightNote?: string | null;
  pillarsIntroCompleted: boolean;
  pillarsIntroCompletedAt?: Timestamp | FieldValue | null;
}

export interface CatHistoryEntry {
  userId: string;
  entryType: "baseline" | "recalibration";
  axisScores: CatScores;
  subScores: CatSubScores;
  answers: CatAnswerMap;
  createdAt: Timestamp | FieldValue;
  selfInsightAgreement?: SelfInsightAgreement | null;
  selfInsightNote?: string | null;
}
