import type { ModuleId } from "@/lib/taxonomy/types";
import type { MindPacingSignalTag } from "@/lib/mindPacingSignals";

export type MindpacingFallbackReason = "missing_mindpacing_tag" | "unknown_mindpacing_tag";

export type MindpacingModuleResolution = {
  moduleId: ModuleId;
  normalizedTag: string | null;
  fallbackReason?: MindpacingFallbackReason;
};

const DEFAULT_MODULE: ModuleId = "init_clarity_foundations" as ModuleId;

const SIGNAL_TO_MODULE: Record<MindPacingSignalTag, ModuleId> = {
  brain_fog: "init_clarity_foundations" as ModuleId,
  overthinking: "init_clarity_foundations" as ModuleId,
  task_switching: "init_clarity_foundations" as ModuleId,
  somatic_tension: "init_energy_foundations" as ModuleId,
};

const TAG_TO_MODULE: Record<string, ModuleId> = {
  clarity_fog: "init_clarity_foundations" as ModuleId,
  clarity_story_strip: "init_clarity_foundations" as ModuleId,
  focus_scattered: "init_clarity_foundations" as ModuleId,
  emo_tense: "init_emoflex_foundations" as ModuleId,
};

export function resolveModuleForMindpacingTag(tag?: string | null): MindpacingModuleResolution {
  if (!tag) {
    return {
      moduleId: DEFAULT_MODULE,
      normalizedTag: null,
      fallbackReason: "missing_mindpacing_tag",
    };
  }

  const normalized = tag.toLowerCase();
  const tagModule = TAG_TO_MODULE[normalized];
  if (tagModule) {
    return { moduleId: tagModule, normalizedTag: normalized };
  }

  const signalModule = SIGNAL_TO_MODULE[normalized as MindPacingSignalTag];
  if (signalModule) {
    return { moduleId: signalModule, normalizedTag: normalized };
  }

  return {
    moduleId: DEFAULT_MODULE,
    normalizedTag: normalized,
    fallbackReason: "unknown_mindpacing_tag",
  };
}
