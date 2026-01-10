import test from "node:test";
import assert from "node:assert/strict";
import { getNextLessonInModule } from "@/lib/content/getNextLessonInModule";
import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

const CLARITY_MODULE = "init_clarity_foundations" as ModuleId;
const clarityLessons: LessonId[] = INITIATION_MODULES[CLARITY_MODULE].lessonIds;

test("returns first lesson when no completions", () => {
  const next = getNextLessonInModule(CLARITY_MODULE, []);
  assert.equal(next, clarityLessons[0]);
});

test("skips completed lessons and returns next", () => {
  const completed = clarityLessons.slice(0, 2);
  const next = getNextLessonInModule(CLARITY_MODULE, completed);
  assert.equal(next, clarityLessons[2]);
});

test("returns null when module fully completed", () => {
  const next = getNextLessonInModule(CLARITY_MODULE, clarityLessons);
  assert.equal(next, null);
});

test("throws on unknown module id", () => {
  assert.throws(() => getNextLessonInModule("unknown_module" as ModuleId, []));
});
