import type { ProgressFact } from "./progressFacts";
import type { QuestSuggestion } from "./quests";
import { computeDirectionMotivationIndex, computeOmniIntelScore } from "./omniIntel";

export function getDemoProgressFacts(locale: "ro" | "en" = "ro", variant: 1 | 2 | 3 = 1): ProgressFact {
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const days = variant === 3 ? 32 : variant === 2 ? 16 : 7;
  const at = (offset: number, h: number, m: number) => {
    const d = new Date(now.getTime() - offset * DAY);
    d.setHours(h, m, 0, 0);
    return d;
  };
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

  // Demo Omni‑Kuno mastery and lessons (populates the Omni‑Kuno card)
  const masteryByCategory: Record<string, number> = (() => {
    if (variant === 2) {
      return { clarity: 62, calm: 54, energy: 41, relationships: 48, performance: 43, health: 35 };
    }
    if (variant === 3) {
      return { clarity: 38, calm: 46, energy: 72, relationships: 33, performance: 51, health: 40 };
    }
    return { clarity: 58, calm: 49, energy: 45, relationships: 37, performance: 42, health: 34 };
  })();
  const lastLessons: string[] = locale === "ro"
    ? ["Respirație 3’", "Claritate: Focus", "Structurare obiective"]
    : ["Breathing 3’", "Clarity: Focus", "Goals structuring"];
  const readinessIndex = variant === 2 ? 66 : variant === 3 ? 61 : 63;

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
        emotional_balance: 2,
        focus_clarity: 4,
        energy_body: 2,
        relationships_communication: 3,
        decision_discernment: 3,
        self_trust: 1,
        willpower_perseverance: 2,
      },
      updatedAt: now,
    },
    recentEntries: (() => {
      const texts = locale === "ro"
        ? [
            "Mi-am clarificat obiectivul pentru săptămâna asta.",
            "Am observat că respirația m-a calmat în 2 minute.",
            "Am setat o limită clară pentru timpul de lucru.",
            "Am făcut o pauză de 5 minute și m-am resetat.",
          ]
        : [
            "Clarified my goal for this week.",
            "Noticed breathing calmed me within 2 minutes.",
            "Set a clear boundary for work time.",
            "Took a 5-minute break and reset.",
          ];
      return texts.map((text, i) => ({ text, timestamp: at(i + 1, 10 + (i % 3), 10) }));
    })(),
    practiceSessions: (() => {
      const sessions: ProgressFact["practiceSessions"] = [];
      for (let i = 0; i < days; i += 1) {
        // Breathing every day (4–6 min)
        sessions.push({
          type: "breathing",
          startedAt: at(i, 13, 0),
          endedAt: at(i, 13, 0),
          durationSec: (4 + (i % 3)) * 60,
        });
        // Reflection every 2nd day (7–10 min)
        if (i % 2 === 0) {
          sessions.push({
            type: "reflection",
            startedAt: at(i, 9, 15),
            endedAt: at(i, 9, 15),
            durationSec: (7 + (i % 4)) * 60,
          });
        }
        // Drill every 3rd day (5–8 min)
        if (i % 3 === 0) {
          sessions.push({
            type: "drill",
            startedAt: at(i, 18, 30),
            endedAt: at(i, 18, 30),
            durationSec: (5 + (i % 4)) * 60,
          });
        }
      }
      return sessions;
    })(),
    omni: {
      scope: { goalDescription: null, mainPain: null, idealDay: null, wordCount: null, tags, directionMotivationIndex: dirMot },
      kuno: { completedTests: 2, totalTestsAvailable: 6, scores: {}, knowledgeIndex, averagePercent: Math.round((knowledgeIndex + 34) / 2), runsCount: 3, masteryByCategory, readinessIndex, signals: { lastLessonsCsv: lastLessons.join('|') } },
      sensei: { unlocked: true, activeQuests: [], completedQuestsCount: 2 },
      abil: { unlocked: true, exercisesCompletedCount: 12, skillsIndex, practiceIndex: Math.round(0.7 * skillsIndex + 0.3 * Math.min(100, 12 * 3)), runsCount: 2 },
      intel: { unlocked: true, evaluationsCount: 1, consistencyIndex },
      flow: { flowIndex: variant === 3 ? 72 : variant === 2 ? 64 : 58, streakCurrent: variant === 3 ? 6 : variant === 2 ? 4 : 3, streakBest: variant === 3 ? 9 : 6 },
      omniIntelScore,
      omniPoints: 24,
    },
  };

  return fact;
}
