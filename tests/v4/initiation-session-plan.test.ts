import test from "node:test";
import assert from "node:assert/strict";
import { buildInitiationSessionPlan } from "@/lib/sessions/buildInitiationSessionPlan";
import type { LessonId, ModuleId, SessionTemplateId } from "@/lib/taxonomy/types";

const CLARITY_MODULE = "init_clarity_foundations" as ModuleId;
const CLARITY_FIRST_LESSON = "clarity_01_illusion_of_clarity" as LessonId;
const CLARITY_SECOND_LESSON = "clarity_02_one_real_thing" as LessonId;

test("initiation_10min derives single lesson from module progress", () => {
  const result = buildInitiationSessionPlan({
    templateId: "initiation_10min" as SessionTemplateId,
    currentModuleId: CLARITY_MODULE,
    completedLessonIds: [],
    mindpacingTag: "brain_fog",
  });
  const plan = result.plan;
  assert.ok(plan);
  assert.equal(plan.expectedDurationMinutes, 10);
  assert.equal(plan.moduleId, CLARITY_MODULE);
  assert.equal(result.lessons.length, 1);
  assert.equal(result.debug.moduleId, CLARITY_MODULE);
  assert.equal(result.debug.fallbackReason, undefined);
});

test("completed lessons are skipped when deriving sequence", () => {
  const result = buildInitiationSessionPlan({
    templateId: "initiation_12min_deep" as SessionTemplateId,
    currentModuleId: CLARITY_MODULE,
    completedLessonIds: [CLARITY_FIRST_LESSON],
  });
  const plan = result.plan;
  assert.ok(plan);
  assert.equal(plan.expectedDurationMinutes, 12);
  assert.equal(result.lessons.length, 2);
  assert.equal(result.lessons[0].meta.lessonId, CLARITY_SECOND_LESSON);
});

test("unknown template id throws", () => {
  assert.throws(() =>
    buildInitiationSessionPlan({
      templateId: "unknown_template" as SessionTemplateId,
      currentModuleId: CLARITY_MODULE,
      completedLessonIds: [],
    }),
  );
});

test("unknown mindpacing tag falls back to clarity foundations", () => {
  const result = buildInitiationSessionPlan({
    templateId: "initiation_10min" as SessionTemplateId,
    currentModuleId: CLARITY_MODULE,
    completedLessonIds: [],
    mindpacingTag: "mystery_tag",
  });
  assert.equal(result.debug.moduleId, "init_clarity_foundations");
  assert.equal(result.debug.fallbackReason, "unknown_mindpacing_tag");
});
