import { OMNIKUNO_MODULES, resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";

export type IndicatorId = "mental_clarity" | "emotional_balance" | "physical_energy";

export type IndicatorDomain = "cognitiv" | "emoțional" | "somatic" | "behavioral";
export type IndicatorType = "state" | "trait";

export type IndicatorDef = {
  id: IndicatorId;
  label: string; // public, long label (e.g., "Claritate mentală")
  shortLabel?: string; // compact UI label (e.g., "Claritate")
  domain: IndicatorDomain;
  type: IndicatorType;
  range: [number, number];
  description: string;
  dataSources?: string[]; // e.g., ["slider", "test:PIPS", "HRV", "actions"]
  usedIn?: string[]; // e.g., ["indicatori_interni", "trendul_actiunilor", "raport_saptamanal"]
};

export const INDICATORS: Record<IndicatorId, IndicatorDef> = {
  mental_clarity: {
    id: "mental_clarity",
    label: "Claritate mentală",
    shortLabel: "Claritate mentală",
    domain: "cognitiv",
    type: "state",
    range: [0, 10],
    description: "Cât de limpede îți simți gândirea și direcția în acest moment.",
    dataSources: ["slider", "actions"],
    usedIn: ["indicatori_interni", "trendul_actiunilor", "raport_saptamanal"],
  },
  emotional_balance: {
    id: "emotional_balance",
    label: "Echilibru emoțional",
    shortLabel: "Echilibru emoțional",
    domain: "emoțional",
    type: "state",
    range: [0, 10],
    description: "Nivelul de tensiune/agitatie vs. calm și stabilitate emoțională.",
    dataSources: ["slider", "actions"],
    usedIn: ["indicatori_interni", "trendul_actiunilor", "raport_saptamanal"],
  },
  physical_energy: {
    id: "physical_energy",
    label: "Energie fizică",
    shortLabel: "Energie fizică",
    domain: "somatic",
    type: "state",
    range: [0, 10],
    description: "Senzația de energie/vitalitate vs. oboseală (baterie încărcată vs. descărcată).",
    dataSources: ["slider", "actions"],
    usedIn: ["indicatori_interni", "trendul_actiunilor", "raport_saptamanal"],
  },
};

// Legacy mapping helpers to keep compatibility with existing data shapes
export const LegacyIndicatorKeyById: Record<IndicatorId, "clarity" | "calm" | "energy"> = {
  mental_clarity: "clarity",
  emotional_balance: "calm",
  physical_energy: "energy",
};

export const IndicatorIdByLegacyKey: Record<"clarity" | "calm" | "energy", IndicatorId> = {
  clarity: "mental_clarity",
  calm: "emotional_balance",
  energy: "physical_energy",
};

// -----------------------------------------------
// Radar/Chart compatibility (existing components)
// -----------------------------------------------
export type IndicatorChartKey = OmniKunoModuleId;
export type IndicatorChartValues = Record<IndicatorChartKey, number>;

export type IndicatorSourceKey = IndicatorChartKey;

export const INDICATOR_CHART_KEYS: IndicatorChartKey[] = OMNIKUNO_MODULES.map(
  (meta) => meta.id as OmniKunoModuleId,
);

export const INDICATOR_LABELS: Record<IndicatorChartKey, { ro: string; en: string }> = OMNIKUNO_MODULES.reduce(
  (acc, meta) => {
    acc[meta.id as OmniKunoModuleId] = { ro: meta.label.ro, en: meta.label.en };
    return acc;
  },
  {} as Record<IndicatorChartKey, { ro: string; en: string }>,
);

const KEYWORD_RULES: Array<{ pattern: RegExp; moduleId: OmniKunoModuleId }> = [
  { pattern: /relat|limi|relationship|boundar|comunic/i, moduleId: "relationships_communication" },
  { pattern: /calm|stres|stress|anx|panic|emo/i, moduleId: "emotional_balance" },
  { pattern: /clar|focus|direc|vision|deciz|ident/i, moduleId: "focus_clarity" },
  { pattern: /energ|vital|oboseal|sleep|somn|habit|health|corp/i, moduleId: "energy_body" },
  { pattern: /perform|decis|discern|obiectiv|career|carier|money/i, moduleId: "decision_discernment" },
  { pattern: /incredere|trust|sense|meaning|purpose|valo|identitate|identity/i, moduleId: "self_trust" },
  { pattern: /voin|willpower|disciplin|persever|rezilien|consisten|ritual/i, moduleId: "willpower_perseverance" },
  {
    pattern: /greutat|weight|diet|aliment|nutrition|metabol|portion|ghid|mancare|food|slab/i,
    moduleId: "optimal_weight_management",
  },
];

export function intentCategoryToIndicator(categoryRaw: string): IndicatorChartKey | null {
  if (!categoryRaw) return null;
  const direct = resolveModuleId(categoryRaw);
  if (direct) return direct;
  const normalized = (() => {
    const base = categoryRaw.toLowerCase();
    try {
      return base.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
    } catch {
      return base;
    }
  })();
  const alias = resolveModuleId(normalized);
  if (alias) return alias;
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.moduleId;
    }
  }
  return null;
}

// Build radar summary from intent categories [{ category, count }]
export function buildIndicatorSummary(categories: Array<{ category: string; count: number }>): {
  sourceCounts: Record<string, number>;
  chart: IndicatorChartValues;
  shares: IndicatorChartValues;
} {
  const sourceCounts: Record<string, number> = {};
  const chart: IndicatorChartValues = INDICATOR_CHART_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as IndicatorChartValues);
  let total = 0;
  (categories || []).forEach((entry) => {
    const cat = String(entry?.category || "");
    const n = Math.max(0, Number(entry?.count) || 0);
    if (!cat || !n) return;
    sourceCounts[cat] = (sourceCounts[cat] || 0) + n;
    const key = intentCategoryToIndicator(cat);
    if (key) {
      chart[key] += n;
      total += n;
    }
  });
  const denom = total > 0 ? total : 1;
  const shares: IndicatorChartValues = INDICATOR_CHART_KEYS.reduce((acc, key) => {
    acc[key] = chart[key] / denom;
    return acc;
  }, {} as IndicatorChartValues);
  return { sourceCounts, chart, shares };
}
