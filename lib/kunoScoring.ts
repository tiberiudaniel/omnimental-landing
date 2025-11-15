import type { KunoAttempt, KunoCategory, KunoQuestion } from './kunoTypes';

export function scoreAttempts(attempts: KunoAttempt[]) {
  const max = attempts.length;
  const raw = attempts.filter((a) => a.correct).length;
  const percent = max ? Math.round((raw / max) * 100) : 0;
  const byCategory: Record<KunoCategory, { raw: number; max: number; percent: number }> = {} as Record<KunoCategory, { raw: number; max: number; percent: number }>;
  for (const a of attempts) {
    const bucket = byCategory[a.category] ?? { raw: 0, max: 0, percent: 0 };
    bucket.max += 1;
    if (a.correct) bucket.raw += 1;
    byCategory[a.category] = bucket;
  }
  (Object.keys(byCategory) as KunoCategory[]).forEach((k) => {
    const b = byCategory[k];
    b.percent = b.max ? Math.round((b.raw / b.max) * 100) : 0;
  });
  return { raw, max, percent, byCategory };
}

export function pickNext(questions: KunoQuestion[], seen: Set<string>, last?: KunoAttempt): KunoQuestion | null {
  const pool = questions.filter((q) => !seen.has(q.id));
  if (!pool.length) return null;
  // simple heuristic: after a correct answer, increase difficulty; after an incorrect, decrease (stay in bounds)
  if (!last) return pool[0];
  const targetDiff = ((): number => {
    if (last.correct) return Math.min(3, last.difficulty + 1);
    return Math.max(1, last.difficulty - 1);
  })();
  const sameCat = pool.filter((q) => q.category === last.category);
  const byDiff = sameCat.filter((q) => q.difficulty === targetDiff);
  return byDiff[0] ?? sameCat[0] ?? pool[0];
}

// Adaptive pick that prefers low-mastery categories and adjusts difficulty based on last outcome.
export function pickNextAdaptive(
  questions: KunoQuestion[],
  seen: Set<string>,
  last?: KunoAttempt,
  mastery?: Partial<Record<KunoCategory, number>>,
): KunoQuestion | null {
  let pool = questions.filter((q) => !seen.has(q.id));
  if (!pool.length) return null;
  // Prefer categories with mastery < 50 when available
  if (mastery) {
    const lowCats = new Set(
      (Object.keys(mastery) as KunoCategory[]).filter((c) => {
        const v = mastery[c];
        return typeof v === 'number' && v < 50;
      }),
    );
    const prioritized = pool.filter((q) => lowCats.has(q.category));
    if (prioritized.length) pool = prioritized;
  }
  if (!last) return pool[0];
  const targetDiff = last.correct ? Math.min(3, last.difficulty + 1) : Math.max(1, last.difficulty - 1);
  const sameCat = pool.filter((q) => q.category === last.category);
  const byDiff = sameCat.filter((q) => q.difficulty === (targetDiff as 1 | 2 | 3));
  return byDiff[0] ?? sameCat[0] ?? pool.find((q) => (q.difficulty as 1 | 2 | 3) === targetDiff) ?? pool[0];
}
