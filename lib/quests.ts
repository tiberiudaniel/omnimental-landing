"use client";

import { defaultContentScripts, type ContentScript } from "./contentScripts";

export type EvaluationScoreSnapshot = {
  pssTotal: number;
  gseTotal: number;
  maasTotal: number;
  panasPositive: number;
  panasNegative: number;
  svs: number;
};

export type QuestContext = {
  lang: "ro" | "en";
  stageValue: string;
  stageLabel: string;
  scores: EvaluationScoreSnapshot;
  knowledgePercent: number;
  knowledgeGaps: string[];
};

export type QuestSuggestion = {
  id: string;
  scriptId: string;
  type: "learn" | "practice" | "reflect";
  title: string;
  body: string;
  ctaLabel: string;
  priority: number;
  contextSummary: string;
};

type PlaceholderMap = Record<string, string>;

const metricGetters: Record<
  string,
  (context: QuestContext) => number
> = {
  pssTotal: (ctx) => ctx.scores.pssTotal,
  gseTotal: (ctx) => ctx.scores.gseTotal,
  maasTotal: (ctx) => ctx.scores.maasTotal,
  svs: (ctx) => ctx.scores.svs,
  knowledgePercent: (ctx) => ctx.knowledgePercent,
};

const operatorChecks: Record<
  "gte" | "lte",
  (value: number, threshold: number) => boolean
> = {
  gte: (value, threshold) => value >= threshold,
  lte: (value, threshold) => value <= threshold,
};

function matchesScript(script: ContentScript, context: QuestContext): boolean {
  return script.conditions.every((condition) => {
    const getter = metricGetters[condition.metric];
    if (!getter) return false;
    const value = getter(context);
    const check = operatorChecks[condition.operator];
    return check(value, condition.value);
  });
}

function formatPlaceholders(context: QuestContext): PlaceholderMap {
  const gapList =
    context.knowledgeGaps.length > 0
      ? context.knowledgeGaps.join(", ")
      : context.lang === "ro"
        ? "zona principală în care lucrezi"
        : "your main focus area";
  return {
    stageLabel: context.stageLabel,
    stressScore: context.scores.pssTotal.toFixed(0),
    gseScore: context.scores.gseTotal.toFixed(0),
    maasScore: context.scores.maasTotal.toFixed(1),
    svsScore: context.scores.svs.toFixed(1),
    knowledgePercent: context.knowledgePercent.toFixed(0),
    gapList,
  };
}

function renderTemplate(template: string, placeholders: PlaceholderMap) {
  return template.replace(/{{(.*?)}}/g, (_, key) => placeholders[key.trim()] ?? "");
}

function buildContextSummary(scriptId: string, context: QuestContext): string {
  switch (scriptId) {
    case "stress-reset":
      return `PSS ${context.scores.pssTotal.toFixed(0)} @ ${context.stageLabel}`;
    case "knowledge-gap":
      return `OC ${context.knowledgePercent.toFixed(0)}% gaps: ${context.knowledgeGaps.join(", ")}`;
    case "presence-scan":
      return `MAAS ${context.scores.maasTotal.toFixed(1)} @ ${context.stageLabel}`;
    case "vitality-check":
      return `SVS ${context.scores.svs.toFixed(1)}`;
    case "confidence-loop":
      return `GSE ${context.scores.gseTotal.toFixed(0)}`;
    default:
      return `Stage ${context.stageLabel}`;
  }
}

export function generateQuestSuggestions(
  context: QuestContext,
  scripts: ContentScript[] = defaultContentScripts,
  limit = 3,
): QuestSuggestion[] {
  return renderScriptsToQuests(context, scripts
    .filter((script) => matchesScript(script, context))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit));
}

// --- Standardization helpers ---
function clampText(text: string, max: number): string {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function normalizeBody(text: string, min = 180, max = 280): string {
  const t = String(text || "").trim();
  if (t.length > max) return clampText(t, max);
  if (t.length >= min) return t;
  // pad lightly by repeating last sentence fragment if needed
  const pad = (s: string) => (s + (s.endsWith(".") ? "" : "."));
  let out = t;
  while (out.length < min) out = pad(out);
  return out;
}

function renderScriptsToQuests(context: QuestContext, scripts: ContentScript[]): QuestSuggestion[] {
  const placeholders = formatPlaceholders(context);
  return scripts.map((script, index) => {
    const rawTitle = renderTemplate(script.title[context.lang], placeholders);
    const rawBody = renderTemplate(script.template[context.lang], placeholders);
    const ctaLabel = renderTemplate(script.ctaLabel[context.lang], placeholders);
    const title = clampText(rawTitle, 60);
    const body = normalizeBody(rawBody);
    return {
      id: `${script.id}-${Date.now()}-${index}`,
      scriptId: script.id,
      type: script.type,
      title,
      body,
      ctaLabel,
      priority: script.priority,
      contextSummary: buildContextSummary(script.id, context),
    };
  });
}

// --- Weekly distribution: same pool for everyone, personalized order by theme ---
function getIsoWeek(dt: Date): number {
  const date = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function rotate<T>(arr: T[], offset: number): T[] {
  if (!arr.length) return arr;
  const o = ((offset % arr.length) + arr.length) % arr.length;
  return arr.slice(o).concat(arr.slice(0, o));
}

export function getAreasForScript(scriptId: string): string[] {
  const s = defaultContentScripts.find((x) => x.id === scriptId);
  return (s?.areas as string[] | undefined) ?? [];
}

export function generateWeeklyQuests(
  context: QuestContext & { userArea?: string | null },
  limit = 3,
  date: Date = new Date(),
): QuestSuggestion[] {
  // Select a weekly pool by priority, rotated by week number to vary across weeks
  const week = getIsoWeek(date);
  const base = [...defaultContentScripts].sort((a, b) => a.priority - b.priority);
  const pool = rotate(base, week % base.length).slice(0, Math.max(limit, 5));
  // Personalize order by thematic closeness
  const area = (context.userArea || "").toLowerCase();
  const scored = pool
    .map((s) => ({ s, score: (s.areas || []).some((a) => a === area) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score || a.s.priority - b.s.priority)
    .map((x) => x.s)
    .slice(0, limit);
  return renderScriptsToQuests(context, scored);
}
