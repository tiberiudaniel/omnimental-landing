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
  assert.equal(result.blocks.length, 0);
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
  assert.equal(result.blocks.length, 0);
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

test("initiation_v2_12min builds core, elective and recall blocks", () => {
  const result = buildInitiationSessionPlan({
    templateId: "initiation_v2_12min" as SessionTemplateId,
    currentModuleId: CLARITY_MODULE,
    completedLessonIds: [],
  });
  assert.ok(result.plan);
  assert.equal(result.blocks.length, 3);
  const coreBlock = result.blocks[0];
  assert.equal(coreBlock.kind, "core");
  if (coreBlock.kind === "core") {
    assert.equal(coreBlock.lesson.meta.lessonId, CLARITY_FIRST_LESSON);
  }
  const electiveBlock = result.blocks.find((block) => block.kind === "elective");
  assert.ok(electiveBlock);
  if (electiveBlock && electiveBlock.kind === "elective") {
    assert.equal(electiveBlock.lesson.meta.lessonId, "clarity_single_intent");
  }
  const recallBlock = result.blocks.find((block) => block.kind === "recall");
  assert.ok(recallBlock);
  if (recallBlock && recallBlock.kind === "recall") {
    assert.equal(recallBlock.prompt.promptId, "clarity_01_focus_question");
  }
  assert.equal(result.initiation.recallPromptId, "clarity_01_focus_question");
});

test("initiation_v2_12min returns null elective when safe pool exhausted", () => {
  const result = buildInitiationSessionPlan({
    templateId: "initiation_v2_12min" as SessionTemplateId,
    currentModuleId: CLARITY_MODULE,
    completedLessonIds: ["clarity_single_intent", "clarity_one_important_thing"] as LessonId[],
  });
  const electiveBlock = result.blocks.find((block) => block.kind === "elective");
  assert.equal(electiveBlock, undefined);
});
