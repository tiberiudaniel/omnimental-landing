"use client";

import type { SessionType } from "./recommendation";
import type { IntentCategorySummary, DimensionScores } from "./scoring";

export type CachedRecommendation = {
  intent: {
    categories: IntentCategorySummary[];
    urgency: number;
  };
  recommendation: {
    path: SessionType;
    reasonKey: string;
  };
  selectedPath?: SessionType | null;
  dimensionScores?: DimensionScores | null;
  timestamp: number; // ms epoch
};

const LS_KEY = "omnimental_last_recommendation_v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function saveRecommendationCache(payload: CachedRecommendation) {
  try {
    if (typeof window === "undefined") return;
    const data = JSON.stringify(payload);
    window.localStorage.setItem(LS_KEY, data);
  } catch {}
}

export function readRecommendationCache(): CachedRecommendation | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedRecommendation;
    if (!data || typeof data.timestamp !== "number") return null;
    if (Date.now() - data.timestamp > MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function updateSelectedPath(path: SessionType | null) {
  try {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as CachedRecommendation;
    if (!data) return;
    data.selectedPath = path;
    data.timestamp = Date.now();
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}
