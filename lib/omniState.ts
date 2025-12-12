import { getTodayKey } from "./dailyReset";
import type { ProgressFact } from "./progressFacts";

export type OmniDimension =
  | "energy"
  | "stress"
  | "clarity"
  | "sleep"
  | "confidence"
  | "focus";

export type OmniStateVector = {
  energy: number;
  stress: number;
  clarity: number;
  sleep: number;
  confidence: number;
  focus: number;
};

export type OmniAxes = {
  mentalClarity: number;
  emotionalBalance: number;
  physicalEnergy: number;
};

export type OmniDailySnapshot = {
  date: string;
  state: OmniStateVector;
  axes: OmniAxes;
  baseline: OmniStateVector;
  baselineAxes: OmniAxes;
  deltas: OmniAxes;
  streakDays: number;
  trend7d?: {
    mentalClarityDelta: number;
    emotionalBalanceDelta: number;
    physicalEnergyDelta: number;
  };
};

export type OmniGuidanceInput = {
  lang: "ro" | "en";
  daily: OmniDailySnapshot | null;
  abilHistory?: Array<Record<string, unknown>> | null;
  activityEvents?: Array<Record<string, unknown>> | null;
};

export type OmniGuidance = {
  badge: "focus" | "recovery" | "light" | "normal";
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: { pathname: string; query?: Record<string, string | number | undefined> };
  xpEstimate?: number | null;
};

const DIMENSION_KEYS: OmniDimension[] = [
  "energy",
  "stress",
  "clarity",
  "sleep",
  "confidence",
  "focus",
];

const DEFAULT_VECTOR: OmniStateVector = {
  energy: 6,
  stress: 4,
  clarity: 6,
  sleep: 6,
  confidence: 6,
  focus: 6,
};

type PartialVector = Partial<Record<OmniDimension, number>>;

type DimensionScores = Record<string, unknown> | undefined;

type RawDailyEntry = Partial<{
  energy: number;
  stress: number;
  clarity: number;
  sleep?: number;
  confidence?: number;
  focus?: number;
}>;

type RawDailyHistory = Record<string, RawDailyEntry | undefined> | null | undefined;

type RawDailyBlock =
  | {
      lastCheckinDate?: string;
      streakDays?: number;
      today?: RawDailyEntry | null;
      history?: RawDailyHistory;
    }
  | undefined
  | null;

export function aggregateAxes(state: OmniStateVector): OmniAxes {
  const invertedStress = 10 - state.stress;
  const mentalClarity = (state.clarity + state.focus + state.confidence) / 3;
  const emotionalBalance = (invertedStress + state.confidence) / 2;
  const physicalEnergy = (state.energy + state.sleep) / 2;
  return {
    mentalClarity,
    emotionalBalance,
    physicalEnergy,
  };
}

export function computeDeltas(current: OmniAxes, baseline: OmniAxes): OmniAxes {
  return {
    mentalClarity: current.mentalClarity - baseline.mentalClarity,
    emotionalBalance: current.emotionalBalance - baseline.emotionalBalance,
    physicalEnergy: current.physicalEnergy - baseline.physicalEnergy,
  };
}

export function buildOmniDailySnapshot({
  progress,
  facts,
}: {
  progress: ProgressFact | null | undefined;
  facts: ProgressFact | null | undefined;
}): OmniDailySnapshot | null {
  if (!progress && !facts) {
    return null;
  }
  const baseline = deriveBaselineVector(progress, facts);
  const baselineAxes = aggregateAxes(baseline);
  const todayKey = getTodayKey();
  const dailyBlock = extractDailyBlock(progress, facts);
  const qaPatch = mapQuickAssessment(progress?.quickAssessment ?? facts?.quickAssessment);

  const todayPatch = (() => {
    if (!dailyBlock?.lastCheckinDate) return null;
    if (dailyBlock.lastCheckinDate !== todayKey) return null;
    if (dailyBlock.today) return dailyBlock.today;
    if (dailyBlock.history?.[todayKey]) return dailyBlock.history[todayKey] ?? null;
    return null;
  })();

  let stateVector = baseline;
  if (todayPatch) {
    stateVector = applyStatePatch(baseline, todayPatch);
  } else if (qaPatch) {
    stateVector = applyStatePatch(baseline, qaPatch);
  }

  const axes = aggregateAxes(stateVector);
  const deltas = computeDeltas(axes, baselineAxes);
  const date = todayPatch ? todayKey : dailyBlock?.lastCheckinDate ?? todayKey;
  const streakDays = dailyBlock?.streakDays ?? 0;
  const trend7d = computeTrendFromHistory(dailyBlock?.history, baseline, baselineAxes);

  return {
    date,
    state: stateVector,
    axes,
    baseline,
    baselineAxes,
    deltas,
    streakDays,
    trend7d: trend7d ?? undefined,
  };
}

function deriveBaselineVector(progress: ProgressFact | null | undefined, facts: ProgressFact | null | undefined): OmniStateVector {
  let vector = { ...DEFAULT_VECTOR };
  const dimsSource = (progress?.recommendation?.dimensionScores ??
    facts?.recommendation?.dimensionScores) as DimensionScores;
  if (dimsSource) {
    const clarityAxis = readDimensionScore(dimsSource, ["focus_clarity", "focus"]);
    if (clarityAxis !== null) {
      vector.clarity = clarityAxis;
      vector.focus = clarityAxis;
    }
    const emotionalAxis = readDimensionScore(dimsSource, ["emotional_balance", "calm"]);
    if (emotionalAxis !== null) {
      vector.confidence = Math.max(vector.confidence, emotionalAxis);
      vector.stress = clampScore(10 - emotionalAxis, vector.stress);
    }
    const energyAxis = readDimensionScore(dimsSource, ["energy_body", "energy"]);
    if (energyAxis !== null) {
      vector.energy = energyAxis;
      vector.sleep = Math.max(vector.sleep, energyAxis);
    }
  }

  const evaluationPatch = mapEvaluation(progress?.evaluation ?? facts?.evaluation);
  if (evaluationPatch) {
    vector = applyStatePatch(vector, evaluationPatch);
  }

  const historyPatch = mapScopeHistory(facts) ?? mapScopeHistory(progress);
  if (historyPatch) {
    vector = applyStatePatch(vector, historyPatch);
  }

  const qaPatch = mapQuickAssessment(progress?.quickAssessment ?? facts?.quickAssessment);
  if (qaPatch) {
    vector = applyStatePatch(vector, qaPatch);
  }

  return vector;
}

function mapEvaluation(evaluation: ProgressFact["evaluation"]): PartialVector | null {
  if (!evaluation?.scores) return null;
  const patch: PartialVector = {};
  const scores = evaluation.scores as Record<string, unknown>;
  const gse = normalizeScore(scores.gseTotal ?? scores.gse, 40);
  if (gse !== null) {
    patch.clarity = gse;
    patch.confidence = gse;
  }
  const maas = normalizeScore(scores.maasTotal ?? scores.maas, 90);
  if (maas !== null) {
    const calm = maas;
    patch.confidence = Math.max(patch.confidence ?? 0, calm);
    patch.stress = clampScore(10 - calm, patch.stress ?? 5);
  }
  const svs = normalizeScore(scores.svs ?? scores.svsTotal, 24);
  if (svs !== null) {
    patch.energy = svs;
    patch.sleep = Math.max(patch.sleep ?? 0, svs);
  }
  return Object.keys(patch).length ? patch : null;
}

function normalizeScore(value: unknown, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (!Number.isFinite(max) || max <= 0) return null;
  const ratio = Math.max(0, Math.min(1, n / max));
  return Math.round(ratio * 100) / 10;
}

function readDimensionScore(source: DimensionScores, keys: string[]): number | null {
  if (!source) return null;
  for (const key of keys) {
    if (key in source! && source![key] !== undefined) {
      const value = Number(source![key]);
      if (Number.isFinite(value)) {
        const ratio = Math.max(0, Math.min(1, value / 5));
        return Math.round(ratio * 100) / 10;
      }
    }
  }
  return null;
}

function mapQuickAssessment(entry: ProgressFact["quickAssessment"]): PartialVector | null {
  if (!entry) return null;
  const patch: PartialVector = {};
  DIMENSION_KEYS.forEach((key) => {
    const raw = (entry as Record<string, unknown>)[key];
    if (raw !== undefined) {
      patch[key] = clampScore(raw, patch[key] ?? DEFAULT_VECTOR[key]);
    }
  });
  return Object.keys(patch).length ? patch : null;
}

function mapScopeHistory(fact: ProgressFact | null | undefined): PartialVector | null {
  const history = (fact as unknown as { omni?: { scope?: { history?: Record<string, Record<string, unknown>> } } } | null)?.omni?.scope?.history;
  if (!history || typeof history !== "object") return null;
  const entries = Object.entries(history)
    .filter(([key]) => /^[d]?\d{8}$/.test(key) || /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort(([a], [b]) => (a > b ? 1 : -1));
  if (!entries.length) return null;
  const recent = entries.slice(-5);
  const avg = (prop: string): number | null => {
    const values = recent
      .map(([, value]) => Number((value ?? {})[prop]))
      .filter((n) => Number.isFinite(n));
    if (!values.length) return null;
    return values.reduce((sum, num) => sum + num, 0) / values.length;
  };
  const patch: PartialVector = {};
  const clarity = avg("clarity");
  if (clarity !== null) patch.clarity = clarity;
  const energy = avg("energy");
  if (energy !== null) patch.energy = energy;
  const calm = avg("calm");
  if (calm !== null) patch.stress = clampScore(10 - calm, patch.stress ?? DEFAULT_VECTOR.stress);
  return Object.keys(patch).length ? patch : null;
}

function extractDailyBlock(progress: ProgressFact | null | undefined, facts: ProgressFact | null | undefined): RawDailyBlock {
  const fromFacts = (facts as { omni?: { daily?: RawDailyBlock } } | null)?.omni?.daily;
  if (fromFacts) return fromFacts;
  return (progress as { omni?: { daily?: RawDailyBlock } } | null)?.omni?.daily;
}

export function applyStatePatch(base: OmniStateVector, patch?: PartialVector | null): OmniStateVector {
  if (!patch) return base;
  const next: OmniStateVector = { ...base };
  DIMENSION_KEYS.forEach((key) => {
    if (patch[key] === undefined) return;
    next[key] = clampScore(patch[key], next[key]);
  });
  return next;
}

function clampScore(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 10) return 10;
  return n;
}

function computeTrendFromHistory(
  history: RawDailyHistory,
  baseline: OmniStateVector,
  baselineAxes: OmniAxes,
): OmniDailySnapshot["trend7d"] | null {
  if (!history || typeof history !== "object") return null;
  const entries = Object.entries(history)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-7);
  if (!entries.length) return null;
  const axesList = entries.map(([, entry]) => aggregateAxes(applyStatePatch(baseline, entry)));
  if (!axesList.length) return null;
  const avgAxes = axesList.reduce(
    (acc, axis) => ({
      mentalClarity: acc.mentalClarity + axis.mentalClarity,
      emotionalBalance: acc.emotionalBalance + axis.emotionalBalance,
      physicalEnergy: acc.physicalEnergy + axis.physicalEnergy,
    }),
    { mentalClarity: 0, emotionalBalance: 0, physicalEnergy: 0 },
  );
  const count = axesList.length || 1;
  const normalized = {
    mentalClarity: avgAxes.mentalClarity / count,
    emotionalBalance: avgAxes.emotionalBalance / count,
    physicalEnergy: avgAxes.physicalEnergy / count,
  };
  return {
    mentalClarityDelta: normalized.mentalClarity - baselineAxes.mentalClarity,
    emotionalBalanceDelta: normalized.emotionalBalance - baselineAxes.emotionalBalance,
    physicalEnergyDelta: normalized.physicalEnergy - baselineAxes.physicalEnergy,
  };
}

export function buildOmniGuidance({
  lang,
  daily,
  activityEvents,
}: OmniGuidanceInput): OmniGuidance {
  const locale: "ro" | "en" = lang === "ro" ? "ro" : "en";
  if (!daily) {
    return {
      badge: "light",
      title: locale === "ro" ? "Începe cu o verificare" : "Start with a quick check",
      description:
        locale === "ro"
          ? "Completează sliderele de astăzi ca să-ți calibrăm ghidarea și să pornim ritualul."
          : "Log today’s sliders so we can calibrate guidance and kick off your ritual.",
      ctaLabel: locale === "ro" ? "Deschide ritualul" : "Open ritual",
      ctaHref: { pathname: "/progress", query: { highlight: "daily-reset" } },
    };
  }
  const { axes, deltas } = daily;
  const energyLow = axes.physicalEnergy < 4.5 || deltas.physicalEnergy < -0.8;
  const emotionDrop = axes.emotionalBalance < 4.8 || deltas.emotionalBalance < -0.7;
  const clarityHigh = axes.mentalClarity >= 6.2 && deltas.mentalClarity >= -0.2;
  const recentActivityMin = getMinutesSinceLastActivity(activityEvents);
  const hasRecentActivity = recentActivityMin !== null && recentActivityMin < 240;

  if (energyLow) {
    return {
      badge: "recovery",
      title: locale === "ro" ? "Reset ușor + respirație" : "Light reset + breathing",
      description:
        locale === "ro"
          ? "Energia e mai jos decât media ta. Recomandăm 3 cicluri 4-6 și o plimbare scurtă."
          : "Energy trends below your baseline. Take 3 x 4-6 breathing cycles and a short walk.",
      ctaLabel: locale === "ro" ? "Pornește exercițiul" : "Start exercise",
      ctaHref: { pathname: "/antrenament", query: { tab: "ose" } },
      xpEstimate: 12,
    };
  }

  if (emotionDrop) {
    return {
      badge: "light",
      title: locale === "ro" ? "Descărcare emoțională rapidă" : "Quick emotional release",
      description:
        locale === "ro"
          ? "Emoțiile sunt agitate. Scrie 3 rânduri sau folosește ghidajul de jurnal."
          : "Emotions run high. Write three lines or use the guided journal.",
      ctaLabel: locale === "ro" ? "Deschide jurnalul" : "Open journal",
      ctaHref: { pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } },
      xpEstimate: 6,
    };
  }

  if (clarityHigh) {
    return {
      badge: "focus",
      title: locale === "ro" ? "Fereastră bună: OmniKuno" : "Great window: OmniKuno",
      description:
        locale === "ro"
          ? "Claritatea e peste medie. Profită și continuă lecția ta prioritară."
          : "Clarity is above baseline. Use it to tackle your next OmniKuno lesson.",
      ctaLabel: locale === "ro" ? "Continuă lecția" : "Continue lesson",
      ctaHref: { pathname: "/antrenament", query: { tab: "oc" } },
      xpEstimate: 10,
    };
  }

  if (!hasRecentActivity) {
    return {
      badge: "normal",
      title: locale === "ro" ? "Mini-acțiune Omni-Abil" : "Mini Omni-Abil action",
      description:
        locale === "ro"
          ? "Nu ai activitate azi. Bifează un task rapid pentru a păstra inerția."
          : "No activity logged yet. Mark a quick Omni-Abil task to keep momentum.",
      ctaLabel: locale === "ro" ? "Vezi task-urile" : "View tasks",
      ctaHref: { pathname: "/progress", query: { highlight: "omniabil" } },
      xpEstimate: 5,
    };
  }

  return {
    badge: "normal",
    title: locale === "ro" ? "Continuă ritmul" : "Keep the cadence",
    description:
      locale === "ro"
        ? "Indicatorii sunt stabili. Reia secțiunea OmniKuno sau jurnalul scurt."
        : "Indicators stay stable. Continue your OmniKuno section or a brief journal.",
    ctaLabel: locale === "ro" ? "Continuă OmniKuno" : "Continue OmniKuno",
    ctaHref: { pathname: "/antrenament", query: { tab: "oc" } },
  };
}

function getMinutesSinceLastActivity(events: OmniGuidanceInput["activityEvents"]): number | null {
  if (!Array.isArray(events) || !events.length) return null;
  const latest = events
    .map((event) => toMs((event ?? {}).startedAt ?? (event ?? {}).endedAt ?? null))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  if (!latest) return null;
  return (Date.now() - latest) / 60000;
}

function toMs(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const fire = value as { toDate?: () => Date };
  if (fire && typeof fire.toDate === "function") {
    try {
      return fire.toDate().getTime();
    } catch {
      return null;
    }
  }
  return null;
}
