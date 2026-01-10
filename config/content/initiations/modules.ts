import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

const moduleId = (value: string) => value as ModuleId;
const lessonId = (value: string) => value as LessonId;

export type InitiationModuleMeta = {
  moduleId: ModuleId;
  title: string;
  lessonIds: LessonId[];
};

type ModuleRegistry = Record<ModuleId, InitiationModuleMeta>;

export const INITIATION_MODULES: ModuleRegistry = {
  [moduleId("init_clarity_foundations")]: {
    moduleId: moduleId("init_clarity_foundations"),
    title: "Clarity Foundations",
    lessonIds: [
      lessonId("clarity_01_illusion_of_clarity"),
      lessonId("clarity_02_one_real_thing"),
      lessonId("clarity_03_fog_vs_fatigue"),
      lessonId("clarity_04_brutal_writing"),
      lessonId("clarity_05_decisions_without_data"),
    ],
  },
  [moduleId("init_energy_foundations")]: {
    moduleId: moduleId("init_energy_foundations"),
    title: "Energy Foundations",
    lessonIds: [
      lessonId("focus_energy_01_energy_not_motivation"),
      lessonId("focus_energy_02_cognitive_fragmentation_cost"),
      lessonId("focus_energy_03_entering_state_vs_forcing"),
      lessonId("focus_energy_04_real_signals_of_exhaustion"),
      lessonId("focus_energy_05_minimum_energy_rule"),
    ],
  },
  [moduleId("init_emoflex_foundations")]: {
    moduleId: moduleId("init_emoflex_foundations"),
    title: "Emotional Flex Foundations",
    lessonIds: [
      lessonId("emotional_flex_01_automatic_reaction_amygdala"),
      lessonId("emotional_flex_02_facts_vs_interpretations"),
      lessonId("emotional_flex_03_discomfort_tolerance"),
      lessonId("emotional_flex_04_fast_emotional_reset"),
      lessonId("emotional_flex_05_choice_of_response"),
    ],
  },
  [moduleId("init_wow_foundations")]: {
    moduleId: moduleId("init_wow_foundations"),
    title: "WOW Mix Foundations",
    lessonIds: [
      lessonId("clarity_01_illusion_of_clarity"),
      lessonId("focus_energy_01_energy_not_motivation"),
      lessonId("emotional_flex_01_automatic_reaction_amygdala"),
      lessonId("energy_recovery"),
      lessonId("clarity_single_intent"),
    ],
  },
};
