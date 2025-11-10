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
  const placeholders = formatPlaceholders(context);
  const suggestions: QuestSuggestion[] = [];

  scripts
    .filter((script) => matchesScript(script, context))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit)
    .forEach((script, index) => {
      const title = renderTemplate(script.title[context.lang], placeholders);
      const body = renderTemplate(script.template[context.lang], placeholders);
      const ctaLabel = renderTemplate(script.ctaLabel[context.lang], placeholders);
      suggestions.push({
        id: `${script.id}-${Date.now()}-${index}`,
        scriptId: script.id,
        type: script.type,
        title,
        body,
        ctaLabel,
        priority: script.priority,
        contextSummary: buildContextSummary(script.id, context),
      });
    });

  return suggestions;
}
