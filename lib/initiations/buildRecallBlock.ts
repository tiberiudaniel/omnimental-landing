import { INITIATION_RECALL_PROMPTS, GENERIC_RECALL_PROMPTS, type RecallPrompt } from "@/config/content/initiations/recall";
import type { LessonId } from "@/lib/taxonomy/types";

export type RecallBlock = RecallPrompt & {
  source: "lesson" | "generic";
};

export function buildRecallBlock(coreLessonId: LessonId): RecallBlock {
  const prompts = INITIATION_RECALL_PROMPTS[coreLessonId] ?? [];
  const sourcePrompts = prompts.length ? prompts : GENERIC_RECALL_PROMPTS;
  const selected = sourcePrompts[0];
  return {
    ...selected,
    source: prompts.length ? "lesson" : "generic",
  };
}
