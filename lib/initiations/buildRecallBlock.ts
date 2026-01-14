import {
  INITIATION_RECALL_PROMPTS,
  GENERIC_RECALL_PROMPTS,
  type RecallPrompt,
} from "@/config/content/initiations/recall";
import type { LessonId } from "@/lib/taxonomy/types";

export type RecallBlock = RecallPrompt & {
  source: "lesson" | "generic";
};

const EMERGENCY_PROMPT: RecallPrompt = {
  promptId: "initiation_recall_emergency",
  question: "Care este o frază scurtă care rezumă lecția de azi?",
  microAction: "Scrie fraza ca NOTIFICARE și setează un reminder în 2 ore.",
};

export function buildRecallBlock(coreLessonId: LessonId): RecallBlock {
  const prompts = INITIATION_RECALL_PROMPTS[coreLessonId] ?? [];
  if (prompts.length > 0) {
    return {
      ...prompts[0],
      source: "lesson",
    };
  }
  const genericPrompt = GENERIC_RECALL_PROMPTS[0] ?? EMERGENCY_PROMPT;
  return {
    ...genericPrompt,
    source: "generic",
  };
}
