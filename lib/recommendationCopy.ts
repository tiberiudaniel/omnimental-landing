export const RECOMMENDATION_REASON_MESSAGES = {
  reason_high_urgency: {
    ro: "Este un context presant, iar progresul rapid cere atenție individuală.",
    en: "The situation feels urgent, so the fastest progress comes with individual focus.",
  },
  reason_relationships: {
    ro: "Subiectele de relații și limite se lucrează mai eficient într-o sesiune 1-la-1.",
    en: "Relationship and boundaries themes benefit from a 1:1 container.",
  },
  reason_performance_group: {
    ro: "Tema dominantă este performanța, iar grupul oferă ritm și responsabilitate.",
    en: "Performance is dominant and the group adds rhythm plus accountability.",
  },
  reason_low_urgency: {
    ro: "Nu e o urgență mare, așa că grupul oferă spațiu sigur și constant.",
    en: "There’s no high urgency, so the group provides steady support.",
  },
  reason_default: {
    ro: "Ținem cont de urgență, resurse și confort pentru a calibra recomandarea.",
    en: "We balance urgency, resources, and comfort to tune the recommendation.",
  },
} as const;

export type RecommendationReasonKey = keyof typeof RECOMMENDATION_REASON_MESSAGES;

export function getRecommendationReasonCopy(
  key: string | null | undefined,
  lang: "ro" | "en",
) {
  if (!key) {
    return RECOMMENDATION_REASON_MESSAGES.reason_default[lang];
  }
  const record =
    RECOMMENDATION_REASON_MESSAGES[key as RecommendationReasonKey] ??
    RECOMMENDATION_REASON_MESSAGES.reason_default;
  return record[lang];
}
