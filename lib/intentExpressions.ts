"use client";

import type { IndicatorSourceKey } from "./indicators";
import roDb from "@/data/expressions_db.ro.json" assert { type: "json" };
import enDb from "@/data/expressions_db.en.json" assert { type: "json" };

export type Locale = "ro" | "en";

export type IntentPrimaryCategory =
  | "clarity"
  | "relationships"
  | "stress"
  | "confidence"
  | "balance"
  | "willpower_perseverance"
  | "optimal_weight_management";

export type IntentExpression = {
  id: string;
  category: IntentPrimaryCategory;
  indicator: IndicatorSourceKey;
  text: Record<Locale, string>;
};

export type LocalizedIntentExpression = IntentExpression & { label: string };
export type IntentCloudWord = {
  id: string;
  label: string;
  category: IntentPrimaryCategory;
};

const CATEGORY_METADATA: Record<
  IntentPrimaryCategory,
  { indicator: IndicatorSourceKey; label: Record<Locale, string> }
> = {
  clarity: {
    indicator: "focus_clarity",
    label: { ro: "Claritate & direcție", en: "Clarity & direction" },
  },
  relationships: {
    indicator: "relationships_communication",
    label: { ro: "Relații & limite", en: "Relationships & boundaries" },
  },
  stress: {
    indicator: "emotional_balance",
    label: { ro: "Stres & control", en: "Stress & control" },
  },
  confidence: {
    indicator: "decision_discernment",
    label: { ro: "Încredere & performanță", en: "Confidence & performance" },
  },
  balance: {
    indicator: "energy_body",
    label: { ro: "Energie & echilibru interior", en: "Energy & inner balance" },
  },
  willpower_perseverance: {
    indicator: "willpower_perseverance",
    label: { ro: "Voință & Perseverență", en: "Willpower & Perseverance" },
  },
  optimal_weight_management: {
    indicator: "optimal_weight_management",
    label: { ro: "Greutate optimă", en: "Optimal weight" },
  },
};

const BASE_EXPRESSIONS: Record<IntentPrimaryCategory, Array<{ id: string; ro: string; en: string }>> =
  {
    clarity: [
      { id: "clarity_blocked", ro: "Mă simt blocat.", en: "I feel stuck." },
      { id: "clarity_uncertain", ro: "Nu știu ce vreau cu adevărat.", en: "I don’t know what I truly want." },
      { id: "clarity_need", ro: "Vreau claritate.", en: "I want clarity." },
      { id: "clarity_losing_control", ro: "Simt că pierd controlul.", en: "I feel like I’m losing control." },
      { id: "clarity_direction", ro: "Vreau să-mi găsesc direcția.", en: "I want to find direction." },
      { id: "clarity_overthinking", ro: "Am prea multe gânduri și nu pot decide.", en: "Too many thoughts, I can’t decide." },
      { id: "clarity_loop", ro: "Simt că merg în cerc.", en: "I feel like I’m going in circles." },
      { id: "clarity_fear_choice", ro: "Mi-e teamă să fac o alegere greșită.", en: "I fear making the wrong choice." },
      { id: "clarity_meaning", ro: "Vreau să înțeleg ce e important pentru mine.", en: "I want to know what truly matters to me." },
      { id: "clarity_vision", ro: "Nu mai am o viziune clară asupra vieții.", en: "My life vision feels blurry." },
    ],
    relationships: [
      { id: "rel_no", ro: "Nu știu să spun nu.", en: "I don’t know how to say no." },
      { id: "rel_unheard", ro: "Mă simt neînțeles.", en: "I feel misunderstood." },
      { id: "rel_conflict_partner", ro: "Mă cert des cu partenerul.", en: "I argue a lot with my partner." },
      { id: "rel_guilt", ro: "Mă simt vinovat când refuz.", en: "I feel guilty when I refuse." },
      { id: "rel_authentic", ro: "Vreau relații mai autentice.", en: "I want more authentic relationships." },
      { id: "rel_overgive", ro: "Simt că dau prea mult și primesc prea puțin.", en: "I give too much and receive too little." },
      { id: "rel_draining", ro: "Mă epuizează relațiile din jur.", en: "Relationships around me drain me." },
      { id: "rel_trust", ro: "Îmi este greu să am încredere în oameni.", en: "It’s hard to trust people." },
      { id: "rel_lonely", ro: "Mă simt singur chiar și între oameni.", en: "I feel alone even among people." },
      { id: "rel_boundaries", ro: "Vreau să pun limite sănătoase.", en: "I want to set healthy boundaries." },
    ],
    stress: [
      { id: "stress_pressure", ro: "Sunt sub presiune constantă.", en: "I’m under constant pressure." },
      { id: "stress_relax", ro: "Nu pot să mă relaxez.", en: "I can’t relax." },
      { id: "stress_overwhelmed", ro: "Totul e prea mult.", en: "Everything feels too much." },
      { id: "stress_fear_fail", ro: "Mi-e teamă să greșesc.", en: "I’m afraid to make mistakes." },
      { id: "stress_release", ro: "Vreau să scap de stres.", en: "I want to release stress." },
      { id: "stress_responsibilities", ro: "Mă simt copleșit de responsabilități.", en: "Responsibilities overwhelm me." },
      { id: "stress_control", ro: "Simt că trebuie să controlez totul.", en: "I feel I must control everything." },
      { id: "stress_tired", ro: "Mă simt obosit tot timpul.", en: "I’m tired all the time." },
      { id: "stress_cant_keep_up", ro: "Nu mai pot ține pasul.", en: "I can’t keep up anymore." },
      { id: "stress_swirl", ro: "Mă simt prins într-un vârtej.", en: "I feel caught in a vortex." },
    ],
    confidence: [
      { id: "conf_more_confidence", ro: "Vreau să am mai multă încredere în mine.", en: "I want more self-confidence." },
      { id: "conf_doubt", ro: "Mă îndoiesc de propriile decizii.", en: "I doubt my decisions." },
      { id: "conf_not_enough", ro: "Simt că nu sunt suficient de bun.", en: "I feel I’m not good enough." },
      { id: "conf_compare", ro: "Mă compar prea mult cu alții.", en: "I compare myself too much to others." },
      { id: "conf_productive", ro: "Vreau să fiu mai productiv.", en: "I want to be more productive." },
      { id: "conf_motivation", ro: "Îmi pierd motivația ușor.", en: "I lose motivation easily." },
      { id: "conf_goals", ro: "Nu reușesc să-mi ating obiectivele.", en: "I’m not reaching my goals." },
      { id: "conf_disappoint", ro: "Mă tem că o să dezamăgesc.", en: "I fear disappointing others." },
      { id: "conf_courage", ro: "Vreau să am curaj să acționez.", en: "I want courage to act." },
      { id: "conf_capable", ro: "Vreau să mă simt capabil și stabil.", en: "I want to feel capable and steady." },
    ],
    balance: [
      { id: "balance_energy", ro: "Nu mai am energie.", en: "I’ve run out of energy." },
      { id: "balance_exhausted", ro: "Mă simt epuizat.", en: "I feel exhausted." },
      { id: "balance_calm", ro: "Vreau liniște.", en: "I want calm." },
      { id: "balance_focus", ro: "Nu pot să mă concentrez.", en: "I can’t focus." },
      { id: "balance_sleep", ro: "Vreau să dorm mai bine.", en: "I want better sleep." },
      { id: "balance_empty", ro: "Mă simt gol pe dinăuntru.", en: "I feel empty inside." },
      { id: "balance_equilibrium", ro: "Vreau mai mult echilibru.", en: "I want more balance." },
      { id: "balance_disconnected", ro: "Simt că m-am deconectat de mine.", en: "I feel disconnected from myself." },
      { id: "balance_patience", ro: "Vreau să am mai multă răbdare.", en: "I want more patience." },
      { id: "balance_inner_calm", ro: "Vreau să-mi regăsesc calmul interior.", en: "I want to regain inner calm." },
    ],
    willpower_perseverance: [
      { id: "willpower_daily", ro: "Vreau să am voință zi de zi.", en: "I want daily willpower." },
      { id: "willpower_motivation_drop", ro: "Îmi pierd motivația când devine greu.", en: "I lose motivation once it gets hard." },
      { id: "willpower_habits", ro: "Îmi este greu să mențin obiceiurile.", en: "It’s hard to keep habits going." },
      { id: "willpower_procrastinate", ro: "Amân lucrurile importante.", en: "I postpone the things that matter." },
      { id: "willpower_abandon", ro: "Pornez tare și abandonez rapid.", en: "I start strong and abandon quickly." },
      { id: "willpower_finish_projects", ro: "Vreau să duc proiectele până la capăt.", en: "I want to finish the projects I begin." },
      { id: "willpower_self_promises", ro: "Îmi calc promisiunile față de mine.", en: "I break the promises I make to myself." },
      { id: "willpower_swings", ro: "Oscilez între disciplină și haos.", en: "I oscillate between discipline and chaos." },
      { id: "willpower_comeback", ro: "Vreau să revin după pauze și eșecuri.", en: "I want to bounce back after breaks or failures." },
      { id: "willpower_runs_out", ro: "Simt că voința se termină prea repede.", en: "My willpower feels depleted too fast." },
    ],
    optimal_weight_management: [
      { id: "ow_1", ro: "Vreau să ajung la o greutate mai sănătoasă.", en: "I want to reach a healthier weight." },
      {
        id: "ow_2",
        ro: "Oscilez cu greutatea și nu reușesc să mă stabilizez.",
        en: "My weight swings and I can’t seem to stabilise it.",
      },
      {
        id: "ow_3",
        ro: "Mănânc haotic când sunt stresat(ă) sau obosit(ă).",
        en: "I eat chaotically when I’m stressed or tired.",
      },
      {
        id: "ow_4",
        ro: "Mi-e greu să îmi controlez porțiile la masă.",
        en: "It’s hard for me to control my portions at meals.",
      },
      {
        id: "ow_5",
        ro: "Mănânc repede și abia după îmi dau seama că am exagerat.",
        en: "I eat fast and only notice I overdid it afterwards.",
      },
      {
        id: "ow_6",
        ro: "Aș vrea să am o relație mai relaxată cu mâncarea.",
        en: "I want a more relaxed relationship with food.",
      },
      {
        id: "ow_7",
        ro: "Îmi lipsesc energia și cheful de mișcare.",
        en: "I’m missing the energy and desire to move.",
      },
      {
        id: "ow_8",
        ro: "Am încercat multe diete, dar nu reușesc să mențin rezultatele.",
        en: "I tried many diets but can’t maintain the results.",
      },
      {
        id: "ow_9",
        ro: "Vreau să îmi creez obiceiuri alimentare mai stabile.",
        en: "I want more stable eating habits.",
      },
      {
        id: "ow_10",
        ro: "Vreau să slăbesc fără să simt că sunt mereu la dietă.",
        en: "I want to lose weight without feeling permanently on a diet.",
      },
    ],
  };

export const intentExpressions: IntentExpression[] = Object.entries(BASE_EXPRESSIONS).flatMap(
  ([category, entries]) =>
    entries.map((entry) => ({
      id: entry.id,
      category: category as IntentPrimaryCategory,
      indicator: CATEGORY_METADATA[category as IntentPrimaryCategory].indicator,
      text: {
        ro: entry.ro,
        en: entry.en,
      },
    })),
);

export function getIntentExpressions(locale: Locale = "ro"): LocalizedIntentExpression[] {
  // Prefer JSON dataset for RO/EN if available (authoritative content), fallback to base list
  if (locale === "ro") {
    const mapRoToPrimary: Record<string, IntentPrimaryCategory | undefined> = {
      claritate: "clarity",
      relatii: "relationships",
      stres: "stress",
      incredere: "confidence",
      echilibru: "balance",
      disciplina: "willpower_perseverance",
      greutate: "optimal_weight_management",
      greutate_optima: "optimal_weight_management",
      alimentatie: "optimal_weight_management",
    };
    const records: LocalizedIntentExpression[] = [];
    for (const [cat, items] of Object.entries(roDb as Record<string, string[]>)) {
      const primary = mapRoToPrimary[cat];
      if (!primary) continue;
      const indicator = CATEGORY_METADATA[primary].indicator;
      for (const text of items) {
        const id = `${primary}_${text.toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 48)}`;
        records.push({
          id,
          category: primary,
          indicator,
          text: { ro: text, en: text },
          label: text,
        });
      }
    }
    return records;
  }
  if (locale === "en") {
    const records: LocalizedIntentExpression[] = [];
    const allowed = [
      "clarity",
      "relationships",
      "stress",
      "confidence",
      "balance",
      "willpower_perseverance",
      "optimal_weight_management",
    ] as const;
    for (const [primary, items] of Object.entries(enDb as Record<string, string[]>)) {
      if (!allowed.includes(primary as typeof allowed[number])) continue;
      const cat = primary as IntentPrimaryCategory;
      const indicator = CATEGORY_METADATA[cat].indicator;
      for (const text of items) {
        const id = `${cat}_${text.toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 48)}`;
        records.push({
          id,
          category: cat,
          indicator,
          text: { ro: text, en: text },
          label: text,
        });
      }
    }
    return records;
  }
  return intentExpressions.map((expression) => ({
    ...expression,
    label: expression.text[locale] ?? expression.text.ro,
  }));
}

export function findExpressionById(id: string) {
  return intentExpressions.find((entry) => entry.id === id) ?? null;
}

export function detectCategoryFromRawInput(input: string): IntentPrimaryCategory | null {
  const normalized = input.toLowerCase();
  const match = intentExpressions.find((expression) =>
    expression.text.ro.toLowerCase().includes(normalized) ||
    expression.text.en.toLowerCase().includes(normalized),
  );
  return match?.category ?? null;
}

export const intentCategoryLabels = Object.fromEntries(
  Object.entries(CATEGORY_METADATA).map(([key, meta]) => [key, meta.label]),
) as Record<IntentPrimaryCategory, Record<Locale, string>>;

const CATEGORY_ORDER: IntentPrimaryCategory[] = [
  "clarity",
  "relationships",
  "stress",
  "confidence",
  "balance",
  "willpower_perseverance",
  "optimal_weight_management",
];

export const INTENT_PRIMARY_CATEGORIES: IntentPrimaryCategory[] = [...CATEGORY_ORDER];

function shuffleArray<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sampleUnique<T extends { id: string }>(pool: T[], count: number, excludeIds: Set<string>) {
  const available = pool.filter((item) => !excludeIds.has(item.id));
  if (count >= available.length) {
    available.forEach((item) => excludeIds.add(item.id));
    return available;
  }
  const shuffled = shuffleArray(available);
  const result = shuffled.slice(0, count);
  result.forEach((item) => excludeIds.add(item.id));
  return result;
}

type AdaptiveCloudOptions = {
  locale: Locale;
  primaryCategory?: IntentPrimaryCategory | null;
  itemsPerCategory?: number;
  excludeIds?: readonly string[];
};

export function generateAdaptiveIntentCloudWords({
  locale,
  primaryCategory = null,
  itemsPerCategory = 5,
  excludeIds = [],
}: AdaptiveCloudOptions): IntentCloudWord[] {
  const expressions = getIntentExpressions(locale);
  const wordsByCategory = CATEGORY_ORDER.reduce<Record<IntentPrimaryCategory, LocalizedIntentExpression[]>>(
    (acc, category) => {
      acc[category] = expressions.filter((entry) => entry.category === category);
      return acc;
    },
    {
      clarity: [],
      relationships: [],
      stress: [],
      confidence: [],
      balance: [],
      willpower_perseverance: [],
      optimal_weight_management: [],
    },
  );

  const perCategory = Math.max(1, Math.floor(itemsPerCategory));
  const selectionIds = new Set<string>(excludeIds ?? []);

  const buckets = CATEGORY_ORDER.map((category) => {
    const pool = wordsByCategory[category];
    if (!pool.length) {
      return { category, entries: [] as LocalizedIntentExpression[] };
    }
    const sampled = sampleUnique(pool, perCategory, selectionIds);
    return { category, entries: sampled };
  });

  const desiredTotal = perCategory * CATEGORY_ORDER.length;

  // Dacă o categorie are mai puține expresii disponibile, completează din fallback global
  if (buckets.some((bucket) => bucket.entries.length < perCategory)) {
    const fallbackPool = expressions.filter((entry) => !selectionIds.has(entry.id));
    buckets.forEach((bucket) => {
      while (bucket.entries.length < perCategory && fallbackPool.length) {
        const [extra] = sampleUnique(fallbackPool, 1, selectionIds);
        if (!extra) break;
        bucket.entries.push(extra);
      }
    });
  }

  const orderedCategories = primaryCategory
    ? [primaryCategory, ...CATEGORY_ORDER.filter((category) => category !== primaryCategory)]
    : CATEGORY_ORDER;

  const flattened: LocalizedIntentExpression[] = [];
  orderedCategories.forEach((category) => {
    const bucket = buckets.find((item) => item.category === category);
    if (bucket) {
      flattened.push(...bucket.entries);
    }
  });

  if (flattened.length < desiredTotal) {
    const fallbackPool = expressions.filter((entry) => !selectionIds.has(entry.id));
    flattened.push(...sampleUnique(fallbackPool, desiredTotal - flattened.length, selectionIds));
  }

  return flattened.slice(0, desiredTotal).map((entry) => ({
    id: entry.id,
    label: entry.label,
    category: entry.category,
  }));
}
