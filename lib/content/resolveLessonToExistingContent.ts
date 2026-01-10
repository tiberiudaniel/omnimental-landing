import { INITIATION_LESSONS, type LessonMeta } from "@/config/content/initiations/lessons.registry";
import type { LessonId } from "@/lib/taxonomy/types";

export type InitiationLessonReference =
  | {
      source: "wow";
      refId: string;
      meta: LessonMeta;
    }
  | {
      source: "dailyPath";
      refId: string;
      meta: LessonMeta;
    };

export function resolveInitiationLesson(lessonId: LessonId): InitiationLessonReference {
  const lesson = INITIATION_LESSONS[lessonId];
  if (!lesson) {
    throw new Error(`Unknown initiation lesson "${lessonId}"`);
  }

  if (lesson.source === "wow") {
    return {
      source: "wow",
      refId: lesson.refs.wowModuleKey,
      meta: lesson,
    };
  }

  return {
    source: "dailyPath",
    refId: lesson.refs.dailyPathModuleKey,
    meta: lesson,
  };
}
