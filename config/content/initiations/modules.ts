import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

export type InitiationModuleMeta = {
  moduleId: ModuleId;
  title: string;
  lessonIds: LessonId[];
};

type ModuleRegistry = Record<ModuleId, InitiationModuleMeta>;

export const INITIATION_MODULES: ModuleRegistry = {
  init_clarity_foundations: {
    moduleId: "init_clarity_foundations",
    title: "Clarity Foundations",
    lessonIds: [
      "clarity_01_illusion_of_clarity",
      "clarity_02_one_real_thing",
      "clarity_03_fog_vs_fatigue",
      "clarity_04_brutal_writing",
      "clarity_05_decisions_without_data",
    ],
  },
  init_energy_foundations: {
    moduleId: "init_energy_foundations",
    title: "Energy Foundations",
    lessonIds: [
      "focus_energy_01_energy_not_motivation",
      "focus_energy_02_cognitive_fragmentation_cost",
      "focus_energy_03_entering_state_vs_forcing",
      "focus_energy_04_real_signals_of_exhaustion",
      "focus_energy_05_minimum_energy_rule",
    ],
  },
  init_emoflex_foundations: {
    moduleId: "init_emoflex_foundations",
    title: "Emotional Flex Foundations",
    lessonIds: [
      "emotional_flex_01_automatic_reaction_amygdala",
      "emotional_flex_02_facts_vs_interpretations",
      "emotional_flex_03_discomfort_tolerance",
      "emotional_flex_04_fast_emotional_reset",
      "emotional_flex_05_choice_of_response",
    ],
  },
  init_wow_foundations: {
    moduleId: "init_wow_foundations",
    title: "WOW Mix Foundations",
    lessonIds: [
      "clarity_01_illusion_of_clarity",
      "focus_energy_01_energy_not_motivation",
      "emotional_flex_01_automatic_reaction_amygdala",
      "energy_recovery",
      "clarity_single_intent",
    ],
  },
};
