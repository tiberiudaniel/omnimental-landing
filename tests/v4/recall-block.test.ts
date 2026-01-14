import test from "node:test";
import assert from "node:assert/strict";
import { buildRecallBlock } from "@/lib/initiations/buildRecallBlock";
import { GENERIC_RECALL_PROMPTS } from "@/config/content/initiations/recall";
import type { LessonId } from "@/lib/taxonomy/types";

const CLARITY_FIRST = "clarity_01_illusion_of_clarity" as LessonId;

test("buildRecallBlock returns lesson-specific prompt when available", () => {
  const block = buildRecallBlock(CLARITY_FIRST);
  assert.equal(block.source, "lesson");
  assert.equal(block.promptId, "clarity_01_focus_question");
  assert.match(block.question, /claritate/i);
});

test("buildRecallBlock falls back to generic prompt when lesson has none", () => {
  const block = buildRecallBlock("unknown_lesson" as LessonId);
  assert.equal(block.source, "generic");
  assert.ok(block.promptId);
  assert.ok(block.question.length > 0);
});

test("buildRecallBlock uses emergency prompt when generic registry empty", () => {
  const original = GENERIC_RECALL_PROMPTS.splice(0, GENERIC_RECALL_PROMPTS.length);
  try {
    const block = buildRecallBlock("unknown_lesson" as LessonId);
    assert.equal(block.source, "generic");
    assert.equal(block.promptId, "initiation_recall_emergency");
  } finally {
    GENERIC_RECALL_PROMPTS.splice(0, 0, ...original);
  }
});
