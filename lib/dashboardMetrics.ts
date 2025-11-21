import { computeConsistencyIndexFromDates } from "./omniIntel";
import { computeDistribution, type PracticeSessionLite } from "./progressAnalytics";
import { normalizeKunoFacts } from "./kunoFacts";

export type KunoAggregate = {
  lastPercent: number;
  runsCount: number;
  mean: number;
  ewma: number; // alpha-weighted (latest-weighted)
};

export function computeKunoAggregate(percs: number[], alpha = 0.4): KunoAggregate {
  const filtered = percs.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 0);
  const runsCount = filtered.length;
  const lastPercent = runsCount ? filtered[filtered.length - 1] : 0;
  const mean = runsCount ? Math.round(filtered.reduce((a, b) => a + b, 0) / runsCount) : 0;
  let ewma = 0;
  if (runsCount) {
    let agg = filtered[0];
    for (let i = 1; i < filtered.length; i += 1) {
      agg = alpha * filtered[i] + (1 - alpha) * agg;
    }
    ewma = Math.round(agg);
  }
  return { lastPercent, runsCount, mean, ewma };
}

export function computeKunoComposite(params: {
  percents: number[]; // knowledge quiz percents over time
  masteryByCategory?: Record<string, number> | null; // EWMA per category
  lessonsCompleted?: number; // optional signal from EDU micro-lessons
  alpha?: number; // ewma alpha for percents
}): { generalIndex: number; components: { ewma: number; masteryMean: number; lessonSignal: number } } {
  const { percents, masteryByCategory, lessonsCompleted = 0, alpha = 0.4 } = params;
  const agg = computeKunoAggregate(percents, alpha);
  const ewma = agg.ewma || agg.mean || 0;
  let masteryMean = 0;
  if (masteryByCategory && Object.keys(masteryByCategory).length) {
    const vals = Object.values(masteryByCategory)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));
    masteryMean = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  const lessonSignal = Math.min(100, Math.max(0, Math.round(lessonsCompleted * 5))); // each lesson adds 5 up to 100
  // Composite: emphasize knowledge EWMA, then mastery breadth, then EDU activity
  const composite = Math.round(0.7 * ewma + 0.25 * masteryMean + 0.05 * lessonSignal);
  return { generalIndex: composite, components: { ewma, masteryMean, lessonSignal } };
}

export function computeAbilityIndex(
  assessments: Array<{
    total?: number;
    probes?: Record<string, { raw?: number; scaled?: number; maxRaw?: number }>;
  }>,
  exercisesCompletedCount: number,
): { runsCount: number; assessMean: number; practiceIndex: number } {
  const points: number[] = [];
  assessments.forEach((a) => {
    // Prefer averaged scaled percent per probe; else derive from raw/maxRaw
    const probes = a?.probes || {};
    const keys = Object.keys(probes);
    if (keys.length) {
      const percs = keys.map((k) => {
        const p = probes[k] || {};
        if (typeof p.scaled === "number") return Math.max(0, Math.min(100, Math.round(p.scaled)));
        const raw = Number(p.raw);
        const maxRaw = Number(p.maxRaw);
        if (Number.isFinite(raw) && Number.isFinite(maxRaw) && maxRaw > 0) {
          return Math.max(0, Math.min(100, Math.round((raw / maxRaw) * 100)));
        }
        return 0;
      });
      const mean = percs.length ? Math.round(percs.reduce((a, b) => a + b, 0) / percs.length) : 0;
      points.push(mean);
    } else if (typeof a?.total === "number" && Number.isFinite(a.total)) {
      // If only a total numeric is provided, clamp 0..100
      points.push(Math.max(0, Math.min(100, Math.round(a.total))));
    }
  });
  const runsCount = points.length;
  const assessMean = runsCount ? Math.round(points.reduce((a, b) => a + b, 0) / runsCount) : 0;
  const practiceBoost = Math.min(100, Math.max(0, exercisesCompletedCount * 3));
  const practiceIndex = Math.round(0.7 * assessMean + 0.3 * practiceBoost);
  return { runsCount, assessMean, practiceIndex };
}

export function computeMotivationIndexEnhanced(input: {
  urgency?: number;
  determination?: number;
  hoursPerWeek?: number;
  learnFromOthers?: number;
  scheduleFit?: number;
  budgetLevel?: string;
}): number {
  const urg = clamp01((input.urgency ?? 0) / 10);
  const det = clamp01((input.determination ?? 0) / 5);
  const hrs = clamp01((input.hoursPerWeek ?? 0) / 8);
  let base = 0.5 * urg + 0.3 * det + 0.2 * hrs; // 0..1
  const learn = clamp01((input.learnFromOthers ?? 0) / 10);
  const fit = clamp01((input.scheduleFit ?? 0) / 10);
  base = base * (1 + 0.05 * learn + 0.05 * fit);
  if ((input.budgetLevel ?? "").toLowerCase() === "low" && (input.hoursPerWeek ?? 0) <= 1) {
    base = Math.max(0, base - 0.05);
  }
  return Math.round(Math.max(0, Math.min(1, base)) * 100);
}

// Omni-Scop composite: blends motivation with intent alignment, preparedness/plan, knowledge baseline and consistency
// Weights are adjustable; default emphasizes motivation at ~45% per request
type FactLike = {
  motivation?: {
    urgency?: number; determination?: number; hoursPerWeek?: number; learnFromOthers?: number; scheduleFit?: number; budgetLevel?: string;
  };
  omni?: {
    scope?: { learnFromOthers?: number; scheduleFit?: number };
    kuno?: { masteryByCategory?: Record<string, number>; knowledgeIndex?: number; generalIndex?: number; averagePercent?: number };
  };
  intent?: { tags?: string[]; categories?: Array<{ category: string; count: number }>; selectionTotal?: number; topShare?: number };
  practiceSessions?: PracticeSessionLite[];
  recentEntries?: Array<{ text?: string; timestamp?: unknown; tabId?: string }>;
};

export function computeOmniScope(fact: Record<string, unknown> | null | undefined, weights = {
  motivation: 0.45,
  intent: 0.25,
  prepared: 0.20,
  knowledge: 0.05,
  consistency: 0.05,
}): { score: number; components: { motivation: number; intent: number; prepared: number; knowledge: number; consistency: number } } {
  const f = (fact || {}) as FactLike;
  // 1) Motivation (enhanced)
  const motSrc = (f?.motivation ?? (f?.omni?.scope as unknown) ?? {}) as Partial<FactLike['motivation']>;
  const motivation = computeMotivationIndexEnhanced({
    urgency: Number(motSrc?.urgency ?? 0),
    determination: Number(motSrc?.determination ?? 0),
    hoursPerWeek: Number(motSrc?.hoursPerWeek ?? 0),
    learnFromOthers: Number(motSrc?.learnFromOthers ?? 0),
    scheduleFit: Number(motSrc?.scheduleFit ?? 0),
    budgetLevel: String((motSrc as { budgetLevel?: string } | undefined)?.budgetLevel ?? (f?.motivation?.budgetLevel ?? '')),
  });

  // 2) Intent alignment (richness + clarity)
  const intent = (f?.intent ?? {}) as Partial<FactLike['intent']>;
  const cats = Array.isArray(intent?.categories) ? intent.categories! : [];
  const tags = Array.isArray(intent?.tags) ? intent.tags! : [];
  const totalSel = Number(intent?.selectionTotal ?? 0) || (cats.length ? cats.reduce((a, c) => a + Math.max(0, Number(c.count ?? 0)), 0) : tags.length);
  const richness = Math.round(clamp01(totalSel / 10) * 100); // 10+ selections saturate
  const topShare = (() => {
    if (typeof intent?.topShare === 'number') return Math.max(0, Math.min(1, intent.topShare));
    if (cats.length) {
      const total = cats.reduce((a, c) => a + Math.max(0, Number(c.count ?? 0)), 0);
      const maxC = cats.reduce((m, c) => Math.max(m, Math.max(0, Number(c.count ?? 0))), 0);
      return total > 0 ? maxC / total : 0;
    }
    return 0;
  })();
  const clarity = Math.round(clamp01(topShare) * 100);
  const intentScore = Math.round(0.6 * clarity + 0.4 * richness);

  // 3) Preparedness / plan (journal entries in PLAN_RECOMANDARI + supportive sliders)
  const recent = Array.isArray(f?.recentEntries) ? (f.recentEntries as NonNullable<FactLike['recentEntries']>) : [];
  const planEntries = recent.filter((e) => String((e.tabId ?? '')).toUpperCase() === 'PLAN_RECOMANDARI');
  const planLen = planEntries.length ? Math.round(planEntries.map((e) => String(e.text ?? '').length).reduce((a, b) => a + b, 0) / planEntries.length) : 0;
  const planLenScore = Math.round(Math.max(0, Math.min(1, planLen / 180)) * 100); // ~180 chars saturate
  const latestPlanMs = planEntries.length ? Math.max(...planEntries.map((e) => toMs(e.timestamp))) : 0;
  const recencyBoost = (() => {
    if (!latestPlanMs) return 0;
    const days = (Date.now() - latestPlanMs) / (24 * 60 * 60 * 1000);
    if (days <= 2) return 100;
    if (days <= 7) return 70;
    return 40;
  })();
  const support = Math.round((clamp01((motSrc?.learnFromOthers ?? 0) / 10) * 100 + clamp01((motSrc?.scheduleFit ?? 0) / 10) * 100) / 2);
  const prepared = Math.round(0.6 * planLenScore + 0.3 * recencyBoost + 0.1 * support);

  // 4) Knowledge baseline (Omni Kuno)
  const kunoFacts = normalizeKunoFacts(f?.omni?.kuno);
  const knowledge = Math.round(Math.max(0, Math.min(100, Number(kunoFacts.primaryScore ?? 0))));

  // 5) Consistency (last 7 days sessions count)
  const sessions = Array.isArray(f?.practiceSessions) ? (f.practiceSessions as PracticeSessionLite[]) : [];
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const count7 = sessions.filter((s) => toMs(s.startedAt) >= weekAgo).length;
  const consistency = Math.round(Math.max(0, Math.min(1, count7 / 10)) * 100); // 10 sessions/7 days ~ 100

  const score = Math.round(
    weights.motivation * motivation +
    weights.intent * intentScore +
    weights.prepared * prepared +
    weights.knowledge * knowledge +
    weights.consistency * consistency,
  );
  return { score: Math.max(0, Math.min(100, score)), components: { motivation, intent: intentScore, prepared, knowledge, consistency } };
}

// Omni-Flex: psychological flexibility (ACT-aligned)
// 25% Cognitive flexibility (breadth of mastery + intent richness/clarity)
// 25% Behavioral flexibility (variety across practice types)
// 25% Adaptation/update (plan notes length + recency)
// 25% Openness/willingness (learnFromOthers + scheduleFit)
export function computeOmniFlex(fact: Record<string, unknown> | null | undefined, weights = {
  cognitive: 0.25,
  behavioral: 0.25,
  adaptation: 0.25,
  openness: 0.25,
}): { score: number; components: { cognitive: number; behavioral: number; adaptation: number; openness: number } } {
  const f = (fact || {}) as FactLike;
  // Cognitive: Kuno mastery breadth + intent richness/clarity
  const kunoFacts = normalizeKunoFacts(f?.omni?.kuno);
  const mastery = kunoFacts.masteryByCategory ?? {};
  const masteryVals = Object.values(mastery).map((v) => Number(v)).filter((v) => Number.isFinite(v));
  const breadth = (() => {
    if (!masteryVals.length) return 0;
    const above = masteryVals.filter((v) => v >= 30).length; // categories with meaningful mastery
    const norm = Math.max(0, Math.min(1, above / 6)); // 6+ cats saturate
    return Math.round(norm * 100);
  })();
  const intent = (f?.intent ?? {}) as Partial<FactLike['intent']>;
  const cats2 = Array.isArray(intent?.categories) ? intent.categories! : [];
  const tags2 = Array.isArray(intent?.tags) ? intent.tags! : [];
  const totalSel = Number(intent?.selectionTotal ?? 0) || (cats2.length ? cats2.reduce((a, c) => a + Math.max(0, Number(c.count ?? 0)), 0) : tags2.length);
  const richness = Math.round(clamp01(totalSel / 10) * 100);
  const topShare = (() => {
    if (typeof intent?.topShare === 'number') return Math.max(0, Math.min(1, intent.topShare));
    if (cats2.length) {
      const total = cats2.reduce((a, c) => a + Math.max(0, Number(c.count ?? 0)), 0);
      const maxC = cats2.reduce((m, c) => Math.max(m, Math.max(0, Number(c.count ?? 0))), 0);
      return total > 0 ? maxC / total : 0;
    }
    return 0;
  })();
  const clarity = Math.round(clamp01(topShare) * 100);
  const cognitive = Math.round(0.55 * breadth + 0.45 * Math.round(0.6 * clarity + 0.4 * richness));

  // Behavioral: distribution entropy over last 14 days (already available via flow calc idea)
  const sessions = Array.isArray(f?.practiceSessions) ? (f.practiceSessions as PracticeSessionLite[]) : [];
  const dist = computeDistribution(sessions);
  const total = dist.total;
  let behavioral = 0;
  if (total > 0) {
    const shares = [dist.reflection, dist.breathing, dist.drill].map((v) => (v > 0 ? v / total : 0));
    const entropy = -shares.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0);
    behavioral = Math.round((entropy / Math.log2(3)) * 100);
  }

  // Adaptation: plan notes length + recency
  const toMs = (v: unknown): number => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.getTime();
    try {
      const maybe = v as { toDate?: () => Date };
      const t = typeof maybe?.toDate === 'function' ? maybe.toDate() : undefined;
      return t ? t.getTime() : 0;
    } catch { return 0; }
  };
  const recent = Array.isArray(f?.recentEntries) ? (f.recentEntries as Array<{ text?: string; timestamp?: unknown; tabId?: string }>) : [];
  const plans = recent.filter((e) => String((e.tabId ?? '')).toUpperCase() === 'PLAN_RECOMANDARI');
  const planLen = plans.length ? Math.round(plans.map((e) => String(e.text ?? '').length).reduce((a, b) => a + b, 0) / plans.length) : 0;
  const planLenScore = Math.round(Math.max(0, Math.min(1, planLen / 180)) * 100);
  const latestPlanMs = plans.length ? Math.max(...plans.map((e) => toMs(e.timestamp))) : 0;
  const recency = (() => {
    if (!latestPlanMs) return 0;
    const days = (Date.now() - latestPlanMs) / (24 * 60 * 60 * 1000);
    if (days <= 2) return 100;
    if (days <= 7) return 70;
    return 40;
  })();
  const adaptation = Math.round(0.7 * planLenScore + 0.3 * recency);

  // Openness: learnFromOthers + scheduleFit
  const learn = clamp01((Number(f?.motivation?.learnFromOthers ?? f?.omni?.scope?.learnFromOthers ?? 0)) / 10);
  const fit = clamp01((Number(f?.motivation?.scheduleFit ?? f?.omni?.scope?.scheduleFit ?? 0)) / 10);
  const openness = Math.round(((learn + fit) / 2) * 100);

  const score = Math.round(
    weights.cognitive * cognitive +
    weights.behavioral * behavioral +
    weights.adaptation * adaptation +
    weights.openness * openness,
  );
  return { score: Math.max(0, Math.min(100, score)), components: { cognitive, behavioral, adaptation, openness } };
}

export function computeFlowIndex(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { flowIndex: number; streakCurrent: number; streakBest: number } {
  const dates: Date[] = [];
  const minutes: number[] = [];
  sessions.forEach((s) => {
    const started = toDate(s.startedAt);
    if (started) dates.push(started);
    minutes.push(Math.max(0, Math.round((s.durationSec ?? 0) / 60)));
  });
  const consistency14 = computeConsistencyIndexFromDates(dates);
  const streak = computeStreakCompat(sessions, referenceMs);
  const dist = computeDistribution(sessions);
  const shares = dist.total > 0 ? [dist.reflection, dist.breathing, dist.drill].map((v) => v / dist.total) : [1, 0, 0];
  const entropy = -shares.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0); // 0..log2(3)
  const balance = Math.round((entropy / Math.log2(3)) * 100);
  const recency = computeRecencyScore(dates);
  const flow = 0.4 * consistency14 + 0.3 * streak.current * (100 / 14) + 0.2 * recency + 0.1 * balance;
  return { flowIndex: Math.round(Math.max(0, Math.min(100, flow))), streakCurrent: streak.current, streakBest: streak.best };
}

function computeStreakCompat(sessions: PracticeSessionLite[], referenceMs: number): { current: number; best: number } {
  // lightweight inline variant: import computeStreak if needed, but avoid circular deps
  const DAY = 24 * 60 * 60 * 1000;
  const end = startOfDay(referenceMs);
  const start = end - (30 - 1) * DAY;
  const map: Record<number, number> = {};
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    const day = startOfDay(ms);
    if (day < start || day > end) return;
    map[day] = (map[day] || 0) + Math.max(0, Math.round((s.durationSec ?? 0) / 60));
  });
  let best = 0;
  let cur = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = start + i * DAY;
    const ok = (map[day] || 0) >= 3;
    if (ok) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  let current = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = end - i * DAY;
    if ((map[day] || 0) >= 3) current += 1;
    else break;
  }
  return { current, best };
}

function computeRecencyScore(dates: Date[]): number {
  if (!dates.length) return 0;
  const now = Date.now();
  const last = Math.max(...dates.map((d) => d.getTime()));
  const diff = now - last;
  const dayMs = 24 * 60 * 60 * 1000;
  if (diff <= dayMs) return 100;
  if (diff <= 3 * dayMs) return 80;
  if (diff <= 7 * dayMs) return 60;
  return 30;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  const maybe = v as { toDate?: () => Date };
  if (maybe && typeof maybe.toDate === "function") return maybe.toDate();
  return null;
}

function toMs(v: unknown): number {
  const d = toDate(v);
  return d ? d.getTime() : 0;
}

function startOfDay(ms: number): number {
  const d = new Date(ms || Date.now());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
