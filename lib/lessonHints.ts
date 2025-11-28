
export type CbtSurveyPayload = {
  emotion?: string;
  distortions?: string[];
  triggers?: string;
  coping?: string[];
  beliefStrength?: number;
  avoidanceLevel?: number;
  readiness?: number;
};

export type LessonHint = { lessonKey: string; focusTag?: string | null };

export function computeLessonHint(input: {
  survey?: CbtSurveyPayload | null;
  intentTags?: string[] | null;
  primaryCategory?: string | null;
}): LessonHint | null {
  const distortions = new Set((input.survey?.distortions ?? []).map((s) => String(s)));
  const emotion = (input.survey?.emotion || '').toLowerCase();
  const tags = (input.intentTags || []).map((t) => t.toLowerCase());
  const cat = (input.primaryCategory || '').toLowerCase();

  // Strong signals by distortion/emotion
  if (distortions.has('catastrofare') || emotion.includes('anx')) {
    return { lessonKey: 'initiation-calm-breath', focusTag: 'emotional_balance' };
  }
  if (distortions.has('alb_negru') || distortions.has('generalizare') || distortions.has('filtru_negativ')) {
    return { lessonKey: 'initiation-clarity-decisions', focusTag: 'focus_clarity' };
  }
  if (distortions.has('citirea_gandurilor') || distortions.has('personalizare') || tags.some((t) => /relat|conflict|limite/.test(t))) {
    return { lessonKey: 'initiation-relationships-conflict', focusTag: 'relationships_communication' };
  }
  // Category/intent tags fallback
  if (cat.includes('energie') || tags.some((t) => /energie|oboseal/.test(t))) {
    return { lessonKey: 'initiation-energy-routine', focusTag: 'energy_body' };
  }
  if (tags.some((t) => /somn|sleep/.test(t))) {
    return { lessonKey: 'initiation-health-sleep', focusTag: 'energy_body' };
  }
  if (cat.includes('perform') || tags.some((t) => /perform/.test(t))) {
    return { lessonKey: 'initiation-performance-flow', focusTag: 'decision_discernment' };
  }
  // Default
  return { lessonKey: 'initiation-stress-clarity', focusTag: 'emotional_balance' };
}
