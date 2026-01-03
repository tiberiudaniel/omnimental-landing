import type {
  AdaptiveCluster,
  DailyPathConfig,
  DailyPathLanguage,
  DailyPathNodeConfig,
} from "@/types/dailyPath";
import { WOW_MODULE_CONTENT } from "./data";
import type { WowModuleContent, WowSectionContent } from "./types";

type ModuleVariantCollections = {
  deep: Record<DailyPathLanguage, DailyPathConfig>;
  short: Record<DailyPathLanguage, DailyPathConfig>;
};

const CTA_LABELS: Record<
  DailyPathLanguage,
  { intro: string; simulator: string; realWorld: string; summary: string; anchor: string }
> = {
  ro: {
    intro: "Încep",
    simulator: "Am făcut exercițiul",
    realWorld: "Îmi iau angajamentul",
    summary: "Vezi progresul tău",
    anchor: "Gata pe azi",
  },
  en: {
    intro: "Start",
    simulator: "Done",
    realWorld: "I commit",
    summary: "See your progress",
    anchor: "Done for today",
  },
};

const SECTION_TITLES: Record<
  DailyPathLanguage,
  { intro: string; learn: string; quiz: string; simulator: string; realWorld: string; summary: string; anchor: string }
> = {
  ro: {
    intro: "Hook + Mirror",
    learn: "Core Insight",
    quiz: "Active Check",
    simulator: "Micro-Simulator",
    realWorld: "Transfer în realitate",
    summary: "Anchor Phrase",
    anchor: "Ancora zilei",
  },
  en: {
    intro: "Hook + Mirror",
    learn: "Core Insight",
    quiz: "Active Check",
    simulator: "Micro-Simulator",
    realWorld: "Real-World Transfer",
    summary: "Anchor Phrase",
    anchor: "Daily Anchor",
  },
};

const XP_VALUES = {
  intro: 0,
  learn: 5,
  quiz: 10,
  simulator: 20,
  realWorld: 25,
  summary: 0,
};

const REAL_WORLD_FIELDS: Record<DailyPathLanguage, NonNullable<DailyPathNodeConfig["fields"]>> = {
  ro: [
    {
      id: "context",
      label: "Contextul real unde aplic regula:",
      placeholder: "ex: înainte să intru în call-ul de la 10:00",
    },
    {
      id: "plan",
      label: "Formulez regula clar în O propoziție:",
      placeholder: "Când ..., fac ... timp de 5 minute.",
    },
  ],
  en: [
    {
      id: "context",
      label: "Real context for applying the rule:",
      placeholder: "e.g. right before the 10:00 stand-up call",
    },
    {
      id: "plan",
      label: "My clear one-sentence rule:",
      placeholder: "When ..., I will ... for 5 minutes.",
    },
  ],
};

const SUMMARY_FALLBACK_BULLETS: Record<DailyPathLanguage, string[]> = {
  ro: [
    "Aplic regula de azi într-un context concret.",
    "Îmi notez ce observ și revin la ancora zilei.",
  ],
  en: [
    "Apply today's rule in one real situation.",
    "Note what you observe and return to the daily anchor.",
  ],
};

const WOW_CONTENT_MAP = new Map(WOW_MODULE_CONTENT.map((entry) => [entry.moduleKey, entry]));

const WOW_MODULE_ORDER: Array<{ cluster: AdaptiveCluster; moduleKey: string }> = [
  { cluster: "clarity_cluster", moduleKey: "clarity_01_illusion_of_clarity" },
  { cluster: "clarity_cluster", moduleKey: "clarity_02_one_real_thing" },
  { cluster: "clarity_cluster", moduleKey: "clarity_03_fog_vs_fatigue" },
  { cluster: "clarity_cluster", moduleKey: "clarity_04_brutal_writing" },
  { cluster: "clarity_cluster", moduleKey: "clarity_05_decisions_without_data" },
  { cluster: "focus_energy_cluster", moduleKey: "focus_energy_01_energy_not_motivation" },
  { cluster: "focus_energy_cluster", moduleKey: "focus_energy_02_cognitive_fragmentation_cost" },
  { cluster: "focus_energy_cluster", moduleKey: "focus_energy_03_entering_state_vs_forcing" },
  { cluster: "focus_energy_cluster", moduleKey: "focus_energy_04_real_signals_of_exhaustion" },
  { cluster: "focus_energy_cluster", moduleKey: "focus_energy_05_minimum_energy_rule" },
  { cluster: "emotional_flex_cluster", moduleKey: "emotional_flex_01_automatic_reaction_amygdala" },
  { cluster: "emotional_flex_cluster", moduleKey: "emotional_flex_02_facts_vs_interpretations" },
  { cluster: "emotional_flex_cluster", moduleKey: "emotional_flex_03_discomfort_tolerance" },
  { cluster: "emotional_flex_cluster", moduleKey: "emotional_flex_04_fast_emotional_reset" },
  { cluster: "emotional_flex_cluster", moduleKey: "emotional_flex_05_choice_of_response" },
];

function combineText(partA?: string, partB?: string): string {
  const pieces = [partA?.trim(), partB?.trim()].filter(Boolean);
  return pieces.join("\n\n");
}

function buildSummaryBullets(content: WowSectionContent, lang: DailyPathLanguage): string[] {
  const bullets: string[] = [];
  if (content.coreInsight) {
    const firstLine = content.coreInsight.split("\n").map((line) => line.trim()).filter(Boolean)[0];
    if (firstLine) {
      bullets.push(firstLine);
    }
  }
  if (content.anchorPhrase) {
    bullets.push(content.anchorPhrase);
  }
  if (!bullets.length) {
    bullets.push(...SUMMARY_FALLBACK_BULLETS[lang]);
  }
  return bullets.slice(0, 3);
}

function buildDeepConfig(module: WowModuleContent, lang: DailyPathLanguage): DailyPathConfig {
  const sections = module.sections.deep[lang];
  if (!sections || !sections.activeCheck || !sections.microSimulator || !sections.realWorld) {
    throw new Error(`WOW module ${module.moduleKey} missing deep content for ${lang}`);
  }
  const localeTitles = SECTION_TITLES[lang];
  const ctas = CTA_LABELS[lang];
  const baseId = `${module.moduleKey}_${lang}_deep`;
  const nodes: DailyPathNodeConfig[] = [
    {
      id: `${baseId}_intro`,
      kind: "INTRO",
      shape: "circle",
      title: localeTitles.intro,
      description: combineText(sections.hook, sections.mirror),
      xp: XP_VALUES.intro,
      ctaLabel: ctas.intro,
    },
    {
      id: `${baseId}_learn`,
      kind: "LEARN",
      shape: "circle",
      title: localeTitles.learn,
      description: sections.coreInsight ?? "",
      xp: XP_VALUES.learn,
    },
    {
      id: `${baseId}_quiz`,
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: localeTitles.quiz,
      description: sections.activeCheck.question,
      quizOptions: sections.activeCheck.options.map((option) => ({
        id: option.id,
        label: option.label,
      })),
      correctOptionIds: [sections.activeCheck.correctOptionId],
      quizFeedback: {
        correct: sections.activeCheck.feedback || "",
        incorrect: sections.activeCheck.feedback || "",
      },
      xp: XP_VALUES.quiz,
    },
    {
      id: `${baseId}_sim`,
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: localeTitles.simulator,
      description: sections.microSimulator,
      xp: XP_VALUES.simulator,
      ctaLabel: ctas.simulator,
    },
    {
      id: `${baseId}_real`,
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: localeTitles.realWorld,
      description: sections.realWorld,
      fields: REAL_WORLD_FIELDS[lang],
      xp: XP_VALUES.realWorld,
      ctaLabel: ctas.realWorld,
    },
    {
      id: `${baseId}_summary`,
      kind: "SUMMARY",
      shape: "circle",
      title: localeTitles.summary,
      description: sections.close ?? "",
      bullets: buildSummaryBullets(sections, lang),
      anchorDescription: sections.anchorPhrase ?? "",
      xp: XP_VALUES.summary,
      ctaLabel: ctas.summary,
    },
    {
      id: `${baseId}_anchor`,
      kind: "ANCHOR",
      shape: "circle",
      title: localeTitles.anchor,
      description: sections.anchorPhrase ?? "",
      xp: 0,
      ctaLabel: ctas.anchor,
    },
  ];
  /**
   * Daily Path WOW V2 module.
   * Follows canonical V2 orchestration:
   * Intro = Hook + Mirror
   * Learn = Core Insight
   * Quiz = Active Check
   * Simulator = Core Experience
   *
   * See DOCS/ARCHITECTURE/DailyPath-Evolution-V1-to-V2.md
   */
  return {
    id: `${module.moduleKey}_${lang}_deep`,
    cluster: module.cluster,
    mode: "deep",
    lang,
    version: 2,
    moduleKey: module.moduleKey,
    skillLabel: module.titles[lang],
    autonomyNodeId: `${baseId}_real`,
    nodes,
  };
}

function buildShortConfig(module: WowModuleContent, lang: DailyPathLanguage): DailyPathConfig {
  const sections = module.sections.short[lang];
  if (!sections) {
    throw new Error(`WOW module ${module.moduleKey} missing short content for ${lang}`);
  }
  const localeTitles = SECTION_TITLES[lang];
  const ctas = CTA_LABELS[lang];
  const baseId = `${module.moduleKey}_${lang}_short`;
  const nodes: DailyPathNodeConfig[] = [
    {
      id: `${baseId}_intro`,
      kind: "INTRO",
      shape: "circle",
      title: localeTitles.intro,
      description: sections.hook ?? "",
      xp: XP_VALUES.intro,
      ctaLabel: ctas.intro,
    },
    {
      id: `${baseId}_sim`,
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: localeTitles.simulator,
      description: sections.microSimulator ?? "",
      xp: XP_VALUES.simulator,
      ctaLabel: ctas.simulator,
    },
    {
      id: `${baseId}_summary`,
      kind: "SUMMARY",
      shape: "circle",
      title: localeTitles.summary,
      description: sections.close ?? "",
      bullets: buildSummaryBullets(sections, lang),
      anchorDescription: sections.anchorPhrase ?? "",
      xp: XP_VALUES.summary,
      ctaLabel: ctas.summary,
    },
    {
      id: `${baseId}_anchor`,
      kind: "ANCHOR",
      shape: "circle",
      title: localeTitles.anchor,
      description: sections.anchorPhrase ?? "",
      xp: 0,
      ctaLabel: ctas.anchor,
    },
  ];
  /**
   * Daily Path WOW V2 module.
   * Follows canonical V2 orchestration:
   * Intro = Hook + Mirror
   * Learn = Core Insight
   * Quiz = Active Check
   * Simulator = Core Experience
   *
   * See DOCS/ARCHITECTURE/DailyPath-Evolution-V1-to-V2.md
   */
  return {
    id: `${module.moduleKey}_${lang}_short`,
    cluster: module.cluster,
    mode: "short",
    lang,
    version: 2,
    moduleKey: module.moduleKey,
    skillLabel: module.titles[lang],
    nodes,
  };
}

function buildModuleVariants(module: WowModuleContent): ModuleVariantCollections {
  return {
    deep: {
      ro: buildDeepConfig(module, "ro"),
      en: buildDeepConfig(module, "en"),
    },
    short: {
      ro: buildShortConfig(module, "ro"),
      en: buildShortConfig(module, "en"),
    },
  };
}

export const WOW_DAY_SEQUENCE = WOW_MODULE_ORDER;

export const WOW_CLUSTER_SEQUENCES: Record<AdaptiveCluster, string[]> = {
  clarity_cluster: WOW_MODULE_ORDER.filter((entry) => entry.cluster === "clarity_cluster").map(
    (entry) => entry.moduleKey,
  ),
  focus_energy_cluster: WOW_MODULE_ORDER.filter(
    (entry) => entry.cluster === "focus_energy_cluster",
  ).map((entry) => entry.moduleKey),
  emotional_flex_cluster: WOW_MODULE_ORDER.filter(
    (entry) => entry.cluster === "emotional_flex_cluster",
  ).map((entry) => entry.moduleKey),
};

export const WOW_CLUSTER_MODULES: Record<AdaptiveCluster, Record<string, ModuleVariantCollections>> =
  {
    clarity_cluster: Object.fromEntries(
      WOW_CLUSTER_SEQUENCES.clarity_cluster.map((moduleKey) => {
        const moduleEntry = WOW_CONTENT_MAP.get(moduleKey);
        if (!moduleEntry) {
          throw new Error(`Missing WOW content for ${moduleKey}`);
        }
        return [moduleKey, buildModuleVariants(moduleEntry)];
      }),
    ),
    focus_energy_cluster: Object.fromEntries(
      WOW_CLUSTER_SEQUENCES.focus_energy_cluster.map((moduleKey) => {
        const moduleEntry = WOW_CONTENT_MAP.get(moduleKey);
        if (!moduleEntry) {
          throw new Error(`Missing WOW content for ${moduleKey}`);
        }
        return [moduleKey, buildModuleVariants(moduleEntry)];
      }),
    ),
    emotional_flex_cluster: Object.fromEntries(
      WOW_CLUSTER_SEQUENCES.emotional_flex_cluster.map((moduleKey) => {
        const moduleEntry = WOW_CONTENT_MAP.get(moduleKey);
        if (!moduleEntry) {
          throw new Error(`Missing WOW content for ${moduleKey}`);
        }
        return [moduleKey, buildModuleVariants(moduleEntry)];
      }),
    ),
  };

export const WOW_MODULE_KEYS = new Set(WOW_MODULE_ORDER.map((entry) => entry.moduleKey));

export function isWowModuleKey(value: string | null | undefined): boolean {
  return Boolean(value && WOW_MODULE_KEYS.has(value));
}

export function getWowDayIndex(moduleKey: string | null | undefined): number | null {
  if (!moduleKey) return null;
  const index = WOW_MODULE_ORDER.findIndex((entry) => entry.moduleKey === moduleKey);
  return index === -1 ? null : index + 1;
}
