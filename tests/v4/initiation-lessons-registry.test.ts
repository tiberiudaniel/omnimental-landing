import test from "node:test";
import assert from "node:assert/strict";
import { INITIATION_LESSONS } from "@/config/content/initiations/lessons.registry";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";
import type { LessonId } from "@/lib/taxonomy/types";

const CLARITY_LESSON = "clarity_01_illusion_of_clarity" as LessonId;
const ENERGY_RECOVERY_LESSON = "energy_recovery" as LessonId;

test("resolves WOW lesson metadata", () => {
  const lesson = INITIATION_LESSONS[CLARITY_LESSON];
  assert.ok(lesson, "lesson should exist in registry");
  const ref = resolveInitiationLesson(CLARITY_LESSON);
  assert.equal(ref.source, "wow");
  assert.equal(ref.refId, CLARITY_LESSON);
  assert.equal(ref.meta.lessonId, lesson.lessonId);
});

test("resolves daily path lesson metadata", () => {
  const ref = resolveInitiationLesson(ENERGY_RECOVERY_LESSON);
  assert.equal(ref.source, "dailyPath");
  assert.equal(ref.refId, ENERGY_RECOVERY_LESSON);
  assert.equal(ref.meta.lessonId, ENERGY_RECOVERY_LESSON);
});

test("invalid lesson id throws", () => {
  assert.throws(() => resolveInitiationLesson("unknown_lesson" as LessonId));
});
