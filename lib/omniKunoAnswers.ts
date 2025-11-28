// Mapping of OmniKuno question IDs to the correct option id (e.g., 'A', 'B').
// Only knowledge-type items should be included here. For others, omit mapping.

export const KUNO_CORRECT_BY_ID: Record<string, string> = {
  // Relații (knowledge)
  relatii_q2_conflict_research: 'B',
  relatii_q4_limite: 'B',
  // Calm (knowledge)
  calm_q1_breath_rate: 'A',
  calm_q2_exhale_longer: 'A',
  calm_q3_break_type: 'A',
  // Claritate / Identitate (knowledge)
  clar_q1_priorities: 'A',
  clar_q2_journal: 'A',
  // Performanță (knowledge)
  perf_q1_flow_def: 'A',
  perf_q2_challenge_match: 'A',
  // Energie (knowledge)
  ener_q1_light: 'A',
  ener_q2_posture: 'A',
  // Claritate / identitate (example; extend as bank grows)
  // Add further mappings as we expand the banks
};

export function getCorrectIndexFor(questionId: string, optionIds: string[]): number {
  const correctId = KUNO_CORRECT_BY_ID[questionId];
  if (!correctId) return -1;
  const idx = optionIds.findIndex((id) => id === correctId);
  return idx >= 0 ? idx : -1;
}
