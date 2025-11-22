import { OMNIKUNO_MODULES, resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";

export type IntentCategorySummary = {
  category: string;
  count: number;
};

export type DimensionScores = Record<OmniKunoModuleId, number>;

const MODULE_IDS: OmniKunoModuleId[] = OMNIKUNO_MODULES.map((meta) => meta.id as OmniKunoModuleId);

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; moduleId: OmniKunoModuleId }> = [
  { pattern: /relat|limi|famil|boundar|partner|social/i, moduleId: "relationships_communication" },
  { pattern: /calm|stres|stress|anx|panic|control|emo/i, moduleId: "emotional_balance" },
  { pattern: /clar|focus|product|decis|orient|direction|vision/i, moduleId: "focus_clarity" },
  { pattern: /energ|oboseal|burnout|sleep|somn|habit|health|corp|body/i, moduleId: "energy_body" },
  { pattern: /perform|career|money|decis|discern|impact|strategie/i, moduleId: "decision_discernment" },
  { pattern: /incredere|trust|identity|identitate|meaning|purpose|valo|sense/i, moduleId: "self_trust" },
];

function createZeroScores(): DimensionScores {
  return MODULE_IDS.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {} as DimensionScores);
}

function mapCategoryToModule(category: string): OmniKunoModuleId | null {
  const direct = resolveModuleId(category);
  if (direct) return direct;
  const normalized = (() => {
    const base = (category || "").toLowerCase();
    try {
      return base.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
    } catch {
      return base;
    }
  })();
  const alias = resolveModuleId(normalized);
  if (alias) return alias;
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.pattern.test(normalized)) {
      return rule.moduleId;
    }
  }
  return null;
}

export function computeDimensionScores(categories: IntentCategorySummary[], urgency: number): DimensionScores {
  const base = createZeroScores();
  for (const { category, count } of categories) {
    const moduleId = mapCategoryToModule(category);
    if (!moduleId) continue;
    base[moduleId] += count;
  }
  const factor = 0.5 + urgency / 10;
  MODULE_IDS.forEach((moduleId) => {
    base[moduleId] = Math.round(base[moduleId] * factor);
  });
  return base;
}
