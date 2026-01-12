import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

type ElectiveRegistry = {
  byModule: Record<ModuleId, LessonId[]>;
  genericWow: LessonId[];
};

const lessonId = (value: string) => value as LessonId;
const moduleId = (value: string) => value as ModuleId;

export const INITIATION_ELECTIVES: ElectiveRegistry = {
  byModule: {
    [moduleId("init_clarity_foundations")]: [
      lessonId("clarity_single_intent"),
      lessonId("clarity_one_important_thing"),
    ],
    [moduleId("init_energy_foundations")]: [
      lessonId("energy_recovery"),
      lessonId("energy_congruence"),
    ],
    [moduleId("init_emoflex_foundations")]: [
      lessonId("emotional_flex_pause"),
      lessonId("emotional_flex_naming"),
    ],
    [moduleId("init_wow_foundations")]: [
      lessonId("clarity_single_intent"),
      lessonId("energy_recovery"),
      lessonId("emotional_flex_pause"),
    ],
  },
  genericWow: [
    lessonId("clarity_single_intent"),
    lessonId("energy_recovery"),
    lessonId("emotional_flex_pause"),
  ],
};
