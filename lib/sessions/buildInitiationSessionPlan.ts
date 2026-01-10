import { SESSION_TEMPLATES } from "@/config/sessions/templates";
import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";
import { resolveModuleForMindpacingTag } from "@/lib/mindpacing/moduleMapping";
import type { MindpacingFallbackReason } from "@/lib/mindpacing/moduleMapping";
import type { LessonId, ModuleId, SessionTemplateId } from "@/lib/taxonomy/types";
import type { SessionPlan } from "@/lib/sessionRecommenderEngine";

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
  debug: InitiationSessionDebug;
};

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
  const requiredLessons = template.blocks.filter((block) => block.kind === "lesson").length;
  const lessonIds = pickLessonsForModule(moduleMeta.moduleId, effectiveCompleted, requiredLessons);
  const lessonRefs = lessonIds.map((lessonId) => resolveInitiationLesson(lessonId));
  const primaryLesson = lessonRefs[0];
  if (!primaryLesson) {
    throw new Error("No lessons resolved for initiation plan");
  }

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

  return { plan, lessons: lessonRefs, debug };
}
