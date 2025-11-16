export type IndicatorId = 'mental_clarity' | 'emotional_balance' | 'physical_energy';

export type IndicatorDomain = 'cognitiv' | 'emoțional' | 'somatic' | 'behavioral';
export type IndicatorType = 'state' | 'trait';

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
    id: 'mental_clarity',
    label: 'Claritate mentală',
    shortLabel: 'Claritate mentală',
    domain: 'cognitiv',
    type: 'state',
    range: [0, 10],
    description: 'Cât de limpede îți simți gândirea și direcția în acest moment.',
    dataSources: ['slider', 'actions'],
    usedIn: ['indicatori_interni', 'trendul_actiunilor', 'raport_saptamanal'],
  },
  emotional_balance: {
    id: 'emotional_balance',
    label: 'Echilibru emoțional',
    shortLabel: 'Echilibru emoțional',
    domain: 'emoțional',
    type: 'state',
    range: [0, 10],
    description: 'Nivelul de tensiune/agitatie vs. calm și stabilitate emoțională.',
    dataSources: ['slider', 'actions'],
    usedIn: ['indicatori_interni', 'trendul_actiunilor', 'raport_saptamanal'],
  },
  physical_energy: {
    id: 'physical_energy',
    label: 'Energie fizică',
    shortLabel: 'Energie fizică',
    domain: 'somatic',
    type: 'state',
    range: [0, 10],
    description: 'Senzația de energie/vitalitate vs. oboseală (baterie încărcată vs. descărcată).',
    dataSources: ['slider', 'actions'],
    usedIn: ['indicatori_interni', 'trendul_actiunilor', 'raport_saptamanal'],
  },
};

// Legacy mapping helpers to keep compatibility with existing data shapes
export const LegacyIndicatorKeyById: Record<IndicatorId, 'clarity' | 'calm' | 'energy'> = {
  mental_clarity: 'clarity',
  emotional_balance: 'calm',
  physical_energy: 'energy',
};

export const IndicatorIdByLegacyKey: Record<'clarity' | 'calm' | 'energy', IndicatorId> = {
  clarity: 'mental_clarity',
  calm: 'emotional_balance',
  energy: 'physical_energy',
};

// -----------------------------------------------
// Radar/Chart compatibility (existing components)
// -----------------------------------------------
export type IndicatorChartKey = 'clarity' | 'relationships' | 'calm' | 'energy' | 'performance';
export type IndicatorChartValues = Record<IndicatorChartKey, number>;

// Source keys used by intent expressions/categories; includes legacy alias 'focus' for 'clarity'
export type IndicatorSourceKey = IndicatorChartKey | 'focus';

export const INDICATOR_CHART_KEYS: IndicatorChartKey[] = [
  'clarity',
  'relationships',
  'calm',
  'energy',
  'performance',
];

export const INDICATOR_LABELS: Record<IndicatorChartKey, { ro: string; en: string }> = {
  clarity: { ro: 'Claritate mentală', en: 'Clarity' },
  relationships: { ro: 'Relații', en: 'Relationships' },
  calm: { ro: 'Echilibru emoțional', en: 'Calm' },
  energy: { ro: 'Energie fizică', en: 'Energy' },
  performance: { ro: 'Performanță', en: 'Performance' },
};

// Map intent categories to the 5 radar dimensions
export function intentCategoryToIndicator(categoryRaw: string): IndicatorChartKey | null {
  // Normalize to lowercase and strip diacritics for robust matching (e.g., "încredere" -> "incredere")
  const base = (categoryRaw || '').toLowerCase();
  if (!base) return null;
  const c = (() => {
    try {
      return base.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
    } catch { return base; }
  })();
  // Romanian/English stems
  if (c.includes('relat')) return 'relationships';
  if (c.includes('calm') || c.includes('stres') || c.includes('stress')) return 'calm';
  if (c.includes('clar') || c.includes('focus') || c.includes('ident')) return 'clarity';
  if (c.includes('energ') || c.includes('vital') || c.includes('echilibru')) return 'energy';
  // Map "încredere" (incredere) to performance bucket
  if (c.includes('incredere') || c.includes('perform')) return 'performance';
  // English fallbacks
  if (c.includes('relationship')) return 'relationships';
  if (c.includes('performance') || c.includes('confidence')) return 'performance';
  if (c.includes('clarity')) return 'clarity';
  if (c.includes('energy')) return 'energy';
  if (c.includes('calm')) return 'calm';
  return null;
}

// Build radar summary from intent categories [{ category, count }]
export function buildIndicatorSummary(categories: Array<{ category: string; count: number }>): {
  sourceCounts: Record<string, number>;
  chart: IndicatorChartValues;
  shares: IndicatorChartValues;
} {
  const sourceCounts: Record<string, number> = {};
  const chart: IndicatorChartValues = { clarity: 0, relationships: 0, calm: 0, energy: 0, performance: 0 };
  let total = 0;
  (categories || []).forEach((entry) => {
    const cat = String(entry?.category || '');
    const n = Math.max(0, Number(entry?.count) || 0);
    if (!cat || !n) return;
    sourceCounts[cat] = (sourceCounts[cat] || 0) + n;
    const key = intentCategoryToIndicator(cat);
    if (key) chart[key] += n;
    total += n;
  });
  const denom = total > 0 ? total : 1;
  const shares: IndicatorChartValues = {
    clarity: chart.clarity / denom,
    relationships: chart.relationships / denom,
    calm: chart.calm / denom,
    energy: chart.energy / denom,
    performance: chart.performance / denom,
  };
  return { sourceCounts, chart, shares };
}
