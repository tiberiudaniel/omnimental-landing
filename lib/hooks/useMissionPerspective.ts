"use client";

import { useMemo } from "react";

export type MissionSummary = {
  id: string;
  title: string;
  description?: string;
  category?: string;
};

export type ResourceMetricKey =
  | "energie"
  | "somn"
  | "respiratie"
  | "emotii"
  | "miscare"
  | "intuitie";

export type ResourceMetric = {
  key: ResourceMetricKey;
  label: string;
  description: string;
  score: number;
};

export type MentalMetricKey = "scop" | "kuno" | "abil" | "flex";

export type MentalMetric = {
  key: MentalMetricKey;
  label: string;
  description: string;
  score: number;
};

export type MissionPerspective = {
  mission: MissionSummary | null;
  resources: ResourceMetric[];
  mental: MentalMetric[];
};

type Options = {
  missionId?: string;
  mission?: MissionSummary | null;
};

type MetricAdjustment<T extends string> = Partial<Record<T, number>>;

const RESOURCE_BLUEPRINT: Array<ResourceMetric & { score: number }> = [
  {
    key: "energie",
    label: "Energie",
    description: "Cât de des simți că ai energie utilă de-a lungul zilei, nu doar vârfuri și prăbușiri.",
    score: 70,
  },
  {
    key: "somn",
    label: "Somn",
    description: "Cât de recuperator simți somnul tău, nu doar numărul de ore.",
    score: 45,
  },
  {
    key: "respiratie",
    label: "Respirație",
    description: "Cât de ușor îți este să revii la calm doar din respirație când crește tensiunea.",
    score: 35,
  },
  {
    key: "emotii",
    label: "Emoții",
    description: "Cât de repede revii din stări de stres sau iritare.",
    score: 55,
  },
  {
    key: "miscare",
    label: "Mișcare",
    description: "Cât de constant îți pui corpul în mișcare (nu doar sport intens, ci și micro-mișcări).",
    score: 50,
  },
  {
    key: "intuitie",
    label: "Intuiție corporală",
    description: "Cât de mult îți asculți „senzația din stomac” și semnalele de oboseală / overload.",
    score: 30,
  },
];

const MENTAL_BLUEPRINT: Array<MentalMetric & { score: number }> = [
  {
    key: "scop",
    label: "Scop",
    description: "Cât de clar ai formulat ce vrei să obții, de ce e important și cum arată o versiune reușită a misiunii.",
    score: 60,
  },
  {
    key: "kuno",
    label: "Kuno",
    description: "Cât ai înțeles până acum despre mecanismele reale din spatele misiunii tale.",
    score: 25,
  },
  {
    key: "abil",
    label: "Abil",
    description: "Cât de des ai aplicat exercițiile sau protocoalele, în situații reale, nu doar teoretic.",
    score: 15,
  },
  {
    key: "flex",
    label: "Flex",
    description: "Cât de mult ai ajustat abordarea când ceva nu a mers, în loc să abandonezi sau să repeți aceeași strategie.",
    score: 20,
  },
];

type MissionPreset = MissionSummary & {
  resourceAdjust?: MetricAdjustment<ResourceMetricKey>;
  mentalAdjust?: MetricAdjustment<MentalMetricKey>;
};

const MISSION_LIBRARY: Record<string, MissionPreset> = {
  "relationship-balance": {
    id: "relationship-balance",
    title: "Relația de cuplu",
    description: "Vrei să reduci tensiunea, să comunici mai clar și să simți din nou conexiune autentică.",
    category: "relatii",
    resourceAdjust: { somn: -5, respiratie: -10 },
    mentalAdjust: { kuno: -5, abil: -5 },
  },
  "optimal-weight": {
    id: "optimal-weight",
    title: "Greutate optimă",
    description: "Stabilizezi energia, obiceiurile alimentare și modul în care te raportezi la corpul tău.",
    category: "energie",
    resourceAdjust: { energie: -10, miscare: -5, intuitie: -5 },
    mentalAdjust: { flex: 5 },
  },
  "focus-performance": {
    id: "focus-performance",
    title: "Claritate & performanță",
    description: "Prioritizezi focusul mental și execuția fără epuizare cronică.",
    category: "performanta",
    resourceAdjust: { energie: -5, emotii: 5, intuitie: 10 },
    mentalAdjust: { scop: 10, kuno: 5 },
  },
};

function cloneResourceMetrics(adjust?: MetricAdjustment<ResourceMetricKey>): ResourceMetric[] {
  return RESOURCE_BLUEPRINT.map((metric) => ({
    key: metric.key,
    label: metric.label,
    description: metric.description,
    score: normalizeScore(metric.score + (adjust?.[metric.key] ?? 0)),
  }));
}

function cloneMentalMetrics(adjust?: MetricAdjustment<MentalMetricKey>): MentalMetric[] {
  return MENTAL_BLUEPRINT.map((metric) => ({
    key: metric.key,
    label: metric.label,
    description: metric.description,
    score: normalizeScore(metric.score + (adjust?.[metric.key] ?? 0)),
  }));
}

function normalizeScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function useMissionPerspective(options?: Options): MissionPerspective {
  const missionOverride = options?.mission ?? null;
  const requestedMissionId = options?.missionId;

  const mission = useMemo(() => {
    if (missionOverride) return missionOverride;
    if (requestedMissionId) {
      return MISSION_LIBRARY[requestedMissionId] ?? {
        id: requestedMissionId,
        title: "Misiunea ta principală",
        description: "Selectează această misiune din onboarding pentru a vedea o hartă completă.",
      };
    }
    return null;
  }, [missionOverride, requestedMissionId]);

  return useMemo(() => {
    if (!mission) {
      return { mission: null, resources: [], mental: [] };
    }
    const preset = MISSION_LIBRARY[mission.id];
    const resources = cloneResourceMetrics(preset?.resourceAdjust);
    const mental = cloneMentalMetrics(preset?.mentalAdjust);
    return { mission, resources, mental };
  }, [mission]);
}
