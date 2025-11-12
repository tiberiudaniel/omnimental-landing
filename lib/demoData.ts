import type { ProgressFact } from "./progressFacts";
import type { QuestSuggestion } from "./quests";
import { computeDirectionMotivationIndex, computeOmniIntelScore } from "./omniIntel";

export function getDemoProgressFacts(locale: "ro" | "en" = "ro", variant: 1 | 2 | 3 = 1): ProgressFact {
  const now = new Date();
  const variants = {
    1: {
      tags: ["claritate", "granițe", "energie", "somn", "productivitate"],
      categories: [
        { category: "clarity", count: 3 },
        { category: "relationships", count: 2 },
        { category: "calm", count: 1 },
        { category: "energy", count: 2 },
        { category: "performance", count: 2 },
      ],
    },
    2: {
      tags: ["încredere", "obiective", "limite", "relaxare", "somn"],
      categories: [
        { category: "clarity", count: 2 },
        { category: "relationships", count: 3 },
        { category: "calm", count: 2 },
        { category: "energy", count: 1 },
        { category: "performance", count: 1 },
      ],
    },
    3: {
      tags: ["energie", "vitalitate", "focalizare", "ordine", "disciplină"],
      categories: [
        { category: "clarity", count: 1 },
        { category: "relationships", count: 1 },
        { category: "calm", count: 2 },
        { category: "energy", count: 3 },
        { category: "performance", count: 2 },
      ],
    },
  } as const;
  const sel = variants[variant] ?? variants[1];
  const tags: string[] = Array.from(sel.tags);
  const categories = sel.categories.map((c) => ({ category: c.category, count: c.count }));
  const urgency = 7;
  const lang = locale;

  const motivation = {
    urgency,
    timeHorizon: "weeks" as const,
    determination: 4,
    hoursPerWeek: 3,
    budgetLevel: "medium" as const,
    goalType: "few" as const,
    emotionalState: "fluctuating" as const,
    groupComfort: 6,
    learnFromOthers: 7,
    scheduleFit: 7,
    formatPreference: "unsure" as const,
    cloudFocusCount: 7,
    updatedAt: now,
  };

  const dirMot = computeDirectionMotivationIndex({ urgency, determination: motivation.determination, hoursPerWeek: motivation.hoursPerWeek });
  const knowledgeIndex = variant === 2 ? 34 : variant === 3 ? 26 : 28;
  const skillsIndex = variant === 2 ? 18 : variant === 3 ? 30 : 22;
  const consistencyIndex = variant === 2 ? 42 : variant === 3 ? 31 : 35;
  const omniIntelScore = computeOmniIntelScore({ knowledgeIndex, skillsIndex, directionMotivationIndex: dirMot, consistencyIndex });

  const fact: ProgressFact = {
    updatedAt: now,
    intent: {
      tags,
      categories,
      urgency,
      lang,
      firstExpression: locale === "ro" ? "Vreau mai multă claritate" : "I want more clarity",
      firstCategory: "clarity",
      updatedAt: now,
    },
    motivation,
    evaluation: {
      scores: {
        pssTotal: 21,
        gseTotal: 26,
        maasTotal: 72,
        panasPositive: 28,
        panasNegative: 15,
        svs: 18,
      },
      stageValue: "t1",
      lang,
      updatedAt: now,
    },
    quests: {
      generatedAt: now,
      items: [
        // Minimal QuestSuggestion-like objects for demo
        { id: "q1", scriptId: "demo", type: "reflect", title: locale === "ro" ? "Notează 3 clarificări azi" : "Write 3 clarifiers today", body: "", ctaLabel: "OK", priority: 1, contextSummary: "demo" },
        { id: "q2", scriptId: "demo", type: "practice", title: locale === "ro" ? "O pauză de respirație 3x" : "Do 3x breathing breaks", body: "", ctaLabel: "OK", priority: 2, contextSummary: "demo" },
      ] as Array<QuestSuggestion & { completed?: boolean }>,
    },
    recommendation: {
      suggestedPath: "group",
      reasonKey: "reason_relationships",
      selectedPath: null,
      acceptedRecommendation: null,
      dimensionScores: {
        calm: 2,
        focus: 4,
        energy: 2,
        relationships: 3,
        performance: 3,
        health: 1,
      },
      updatedAt: now,
    },
    omni: {
      scope: { goalDescription: null, mainPain: null, idealDay: null, wordCount: null, tags, directionMotivationIndex: dirMot },
      kuno: { completedTests: 1, totalTestsAvailable: 6, scores: {}, knowledgeIndex },
      sensei: { unlocked: true, activeQuests: [], completedQuestsCount: 2 },
      abil: { unlocked: true, exercisesCompletedCount: 3, skillsIndex },
      intel: { unlocked: true, evaluationsCount: 1, consistencyIndex },
      omniIntelScore,
      omniPoints: 24,
    },
  };

  return fact;
}
