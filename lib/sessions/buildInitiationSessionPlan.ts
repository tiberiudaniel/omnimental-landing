import { SESSION_TEMPLATES } from "@/config/sessions/templates";
import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";
import { resolveModuleForMindpacingTag } from "@/lib/mindpacing/moduleMapping";
import type { MindpacingFallbackReason } from "@/lib/mindpacing/moduleMapping";
import type { LessonId, ModuleId, SessionTemplateId } from "@/lib/taxonomy/types";
import type { SessionPlan } from "@/lib/sessionRecommenderEngine";
import { selectElective } from "@/lib/initiations/selectElective";
import { buildRecallBlock, type RecallBlock } from "@/lib/initiations/buildRecallBlock";

type BuildPlanParams = {
  templateId: SessionTemplateId;
  currentModuleId?: ModuleId | null;
  completedLessonIds?: LessonId[];
  mindpacingTag?: string | null;
};

type InitiationSessionDebug = {
  moduleId: ModuleId;
  mindpacingTag: string | null;
  fallbackReason?: MindpacingFallbackReason;
};

export type InitiationSessionPlanResult = {
  plan?: SessionPlan;
  lessons: ReturnType<typeof resolveInitiationLesson>[];
  blocks: InitiationSessionBlock[];
  initiation: {
    moduleId: ModuleId;
    lessonIds: LessonId[];
    recallPromptId: string | null;
    electiveReason?: string | null;
  };
  debug: InitiationSessionDebug;
};

export type InitiationSessionBlock =
  | { kind: "core"; lesson: ReturnType<typeof resolveInitiationLesson> }
  | { kind: "elective"; lesson: ReturnType<typeof resolveInitiationLesson>; reason: string }
  | { kind: "recall"; prompt: RecallBlock };

function pickLessonsForModule(
  moduleId: ModuleId,
  completedLessonIds: LessonId[],
  requiredCount: number,
): LessonId[] {
  const moduleMeta = INITIATION_MODULES[moduleId];
  if (!moduleMeta) {
    throw new Error(`Unknown initiation module "${moduleId}"`);
  }
  const completedSet = new Set(completedLessonIds);
  const lessons: LessonId[] = [];
  while (lessons.length < requiredCount) {
    const next = moduleMeta.lessonIds.find((lesson) => !completedSet.has(lesson));
    if (!next) {
      // Module completed — restart cycle.
      completedSet.clear();
      continue;
    }
    lessons.push(next);
    completedSet.add(next);
  }
  return lessons;
}

export function buildInitiationSessionPlan({
  templateId,
  currentModuleId = null,
  completedLessonIds = [],
  mindpacingTag = null,
}: BuildPlanParams): InitiationSessionPlanResult {
  const template = SESSION_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown session template "${templateId}"`);
  }
  const moduleResolution = mindpacingTag
    ? resolveModuleForMindpacingTag(mindpacingTag)
    : currentModuleId
      ? { moduleId: currentModuleId, normalizedTag: mindpacingTag }
      : resolveModuleForMindpacingTag(null);
  const moduleMeta = INITIATION_MODULES[moduleResolution.moduleId];
  if (!moduleMeta) {
    throw new Error(`Unknown initiation module "${moduleResolution.moduleId}"`);
  }
  const effectiveCompleted =
    currentModuleId && currentModuleId === moduleMeta.moduleId ? completedLessonIds : [];
  const requiresBlocksV2 = template.blocks.some(
    (block) => block.kind === "core_lesson" || block.kind === "elective_practice" || block.kind === "recall",
  );
  const legacyLessonCount = template.blocks.filter((block) => block.kind === "lesson").length;

  const lessonIds = pickLessonsForModule(
    moduleMeta.moduleId,
    effectiveCompleted,
    requiresBlocksV2 ? 1 : Math.max(legacyLessonCount, 1),
  );
  const resolvedLessons = lessonIds.map((lessonId) => resolveInitiationLesson(lessonId));
  const primaryLesson = resolvedLessons[0];
  if (!primaryLesson) {
    throw new Error("No lessons resolved for initiation plan");
  }

  const blocks: InitiationSessionBlock[] = [];
  const initiationLessonIds: LessonId[] = [];
  let recallPromptId: string | null = null;
  let electiveReason: string | null = null;

  if (requiresBlocksV2) {
    blocks.push({ kind: "core", lesson: primaryLesson });
    initiationLessonIds.push(primaryLesson.meta.lessonId);
    const electiveBlockRequested = template.blocks.some((block) => block.kind === "elective_practice");
    if (electiveBlockRequested) {
      const electiveSelection = selectElective({
        coreModuleId: moduleMeta.moduleId,
        completedLessonIds: effectiveCompleted,
        plannedLessonIds: initiationLessonIds,
        coreLessonId: primaryLesson.meta.lessonId,
        coreAxis: primaryLesson.meta.axis ?? null,
      });
      electiveReason = electiveSelection.reason;
      if (electiveSelection.lessonId) {
        const electiveLesson = resolveInitiationLesson(electiveSelection.lessonId);
        blocks.push({ kind: "elective", lesson: electiveLesson, reason: electiveSelection.reason });
        initiationLessonIds.push(electiveLesson.meta.lessonId);
      }
    }
    if (template.blocks.some((block) => block.kind === "recall")) {
      const recallBlock = buildRecallBlock(primaryLesson.meta.lessonId);
      recallPromptId = recallBlock.promptId;
      blocks.push({ kind: "recall", prompt: recallBlock });
    }
  }

  if (!requiresBlocksV2) {
    initiationLessonIds.push(...resolvedLessons.map((lesson) => lesson.meta.lessonId));
  }
  const lessonRefs =
    blocks.length > 0
      ? blocks
          .filter(
            (block): block is Extract<InitiationSessionBlock, { kind: "core" | "elective" }> =>
              block.kind === "core" || block.kind === "elective",
          )
          .map((block) => block.lesson)
      : resolvedLessons;

  const plan: SessionPlan = {
    id: `${templateId}_${moduleMeta.moduleId}_${primaryLesson.meta.lessonId}`,
    type: "daily",
    moduleId: moduleMeta.moduleId,
    title: template.title,
    summary: "Inițiere ghidată pe lecții canonice.",
    expectedDurationMinutes: template.durationMinutes,
    traitPrimary: primaryLesson.meta.axis ?? "clarity",
    traitSecondary: [],
    canonDomain: "decisionalClarity",
    arcId: null,
    arcDayIndex: 0,
    arcLengthDays: null,
  };

  const debug: InitiationSessionDebug = {
    moduleId: moduleResolution.moduleId,
    mindpacingTag: moduleResolution.normalizedTag,
    fallbackReason: moduleResolution.fallbackReason,
  };

  return {
    plan,
    lessons: lessonRefs,
    blocks,
    initiation: {
      moduleId: moduleMeta.moduleId,
      lessonIds: initiationLessonIds,
      recallPromptId,
      electiveReason: electiveReason ?? undefined,
    },
    debug,
  };
}
