import test from "node:test";
import assert from "node:assert/strict";
import { selectElective } from "@/lib/initiations/selectElective";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

const CLARITY_MODULE = "init_clarity_foundations" as ModuleId;
const CORE_LESSON = "clarity_01_illusion_of_clarity" as LessonId;

test("selectElective skips core lesson and picks first module pool entry", () => {
  const result = selectElective({
    coreModuleId: CLARITY_MODULE,
    coreLessonId: CORE_LESSON,
    plannedLessonIds: [CORE_LESSON],
  });
  assert.equal(result.reason, "module_pool");
  assert.equal(result.lessonId, "clarity_single_intent");
});

test("selectElective falls back to generic pool when module pool exhausted or duplicated", () => {
  const result = selectElective({
    coreModuleId: CLARITY_MODULE,
    completedLessonIds: ["clarity_single_intent", "clarity_one_important_thing"] as LessonId[],
    plannedLessonIds: [CORE_LESSON],
    coreLessonId: CORE_LESSON,
  });
  assert.equal(result.reason, "generic_pool");
  assert.equal(result.lessonId, "energy_recovery");
});

test("selectElective returns none when all options are excluded", () => {
  const result = selectElective({
    coreModuleId: CLARITY_MODULE,
    completedLessonIds: [
      "clarity_single_intent",
      "clarity_one_important_thing",
      "energy_recovery",
      "emotional_flex_pause",
    ] as LessonId[],
    plannedLessonIds: [CORE_LESSON],
    coreLessonId: CORE_LESSON,
  });
  assert.equal(result.reason, "none_available");
  assert.equal(result.lessonId, null);
});
