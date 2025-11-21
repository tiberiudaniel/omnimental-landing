import type { MicroLesson } from '@/lib/lessonTypes';
import { microLesson as initiationStressClarityRo } from './initiation-stress-clarity.ro';
import { microLesson as initiationStressClarityEn } from './initiation-stress-clarity.en';
import { microLesson as initiationClarityDecisionsRo } from './initiation-clarity-decisions.ro';
import { microLesson as initiationCalmBreathRo } from './initiation-calm-breath.ro';
import { microLesson as initiationCalmGroundingRo } from './initiation-calm-grounding.ro';
import { microLesson as initiationCalmEmotionLabelRo } from './initiation-calm-emotion-label.ro';
import { microLesson as initiationCalmEveningResetRo } from './initiation-calm-evening-reset.ro';
import { microLesson as initiationEnergyRoutineRo } from './initiation-energy-routine.ro';
import { microLesson as initiationRelationshipsConflictRo } from './initiation-relationships-conflict.ro';
import { microLesson as initiationPerformanceFlowRo } from './initiation-performance-flow.ro';
import { microLesson as initiationHealthSleepRo } from './initiation-health-sleep.ro';

const key = (id: string, locale: string | undefined) => `${id}|${locale || 'ro'}`;
const microLessons: Record<string, MicroLesson> = {
  [key(initiationStressClarityRo.id, initiationStressClarityRo.locale)]: initiationStressClarityRo,
  [key(initiationStressClarityEn.id, initiationStressClarityEn.locale)]: initiationStressClarityEn,
  [key(initiationClarityDecisionsRo.id, initiationClarityDecisionsRo.locale)]: initiationClarityDecisionsRo,
  [key(initiationCalmBreathRo.id, initiationCalmBreathRo.locale)]: initiationCalmBreathRo,
  [key(initiationCalmGroundingRo.id, initiationCalmGroundingRo.locale)]: initiationCalmGroundingRo,
  [key(initiationCalmEmotionLabelRo.id, initiationCalmEmotionLabelRo.locale)]: initiationCalmEmotionLabelRo,
  [key(initiationCalmEveningResetRo.id, initiationCalmEveningResetRo.locale)]: initiationCalmEveningResetRo,
  [key(initiationEnergyRoutineRo.id, initiationEnergyRoutineRo.locale)]: initiationEnergyRoutineRo,
  [key(initiationRelationshipsConflictRo.id, initiationRelationshipsConflictRo.locale)]: initiationRelationshipsConflictRo,
  [key(initiationPerformanceFlowRo.id, initiationPerformanceFlowRo.locale)]: initiationPerformanceFlowRo,
  [key(initiationHealthSleepRo.id, initiationHealthSleepRo.locale)]: initiationHealthSleepRo,
};

export function getMicroLesson(id: string, locale: 'ro' | 'en' = 'ro'): MicroLesson | null {
  const chosen = microLessons[key(id, locale)];
  if (chosen) return chosen;
  // Fallback to ro if EN missing
  return microLessons[key(id, 'ro')] ?? null;
}

export function listMicroLessons(filter?: { level?: string; category?: string; domain?: string; locale?: 'ro' | 'en' }): MicroLesson[] {
  const all = Object.values(microLessons);
  if (!filter) return all;
  return all.filter((m) => {
    if (filter.level && m.level !== filter.level) return false;
    if (filter.category && m.taxonomy.category !== filter.category) return false;
    if (filter.domain && m.taxonomy.domain !== filter.domain) return false;
    if (filter.locale && m.locale && m.locale !== filter.locale) return false;
    return true;
  });
}
