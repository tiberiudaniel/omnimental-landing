import test from "node:test";
import assert from "node:assert/strict";
import { INITIATION_LESSONS } from "@/config/content/initiations/lessons.registry";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";

test("resolves WOW lesson metadata", () => {
  const lesson = INITIATION_LESSONS.clarity_01_illusion_of_clarity;
  assert.ok(lesson, "lesson should exist in registry");
  const ref = resolveInitiationLesson("clarity_01_illusion_of_clarity" as never);
  assert.equal(ref.source, "wow");
  assert.equal(ref.refId, "clarity_01_illusion_of_clarity");
  assert.equal(ref.meta.lessonId, lesson.lessonId);
});

test("resolves daily path lesson metadata", () => {
  const ref = resolveInitiationLesson("energy_recovery" as never);
  assert.equal(ref.source, "dailyPath");
  assert.equal(ref.refId, "energy_recovery");
  assert.equal(ref.meta.lessonId, "energy_recovery");
});

test("invalid lesson id throws", () => {
  assert.throws(() => resolveInitiationLesson("unknown_lesson" as never));
});
