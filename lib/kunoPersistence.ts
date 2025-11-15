import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDb, areWritesDisabled } from './firebase';
import type { KunoAttempt } from './kunoTypes';
import { recordOmniPatch } from './progressFacts';
import { scoreAttempts } from './kunoScoring';
import { applyKunoGamification } from './kunoGamification';

export async function saveKunoAttempts(profileId: string | null | undefined, attempts: KunoAttempt[], percent: number) {
  try {
    const sessionScore = scoreAttempts(attempts);
    const masteryByCategory: Record<string, number> = {};
    Object.entries(sessionScore.byCategory).forEach(([cat, v]) => {
      masteryByCategory[cat] = v.percent;
    });

    // If writes are disabled or missing profile, store local demo fallback
    if (!profileId || areWritesDisabled()) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('omnimental_kuno_guest_percent', String(Math.round(percent)));
          window.localStorage.setItem('omnimental_kuno_guest_mastery', JSON.stringify(masteryByCategory));
        }
      } catch {}
      return;
    }

    const db = getDb();
    const batch = attempts.map((a) =>
      addDoc(collection(db, 'kunoAttempts'), {
        profileId,
        ...a,
        timestamp: serverTimestamp(),
      }),
    );
    await Promise.all(batch);
    // Optionally smooth with previous mastery (EWMA)
    let ewmaMastery: Record<string, number> | null = null;
    try {
      const snap = await getDoc(doc(db, 'userProfiles', profileId));
      const prev = (snap.exists() ? ((snap.data()?.progressFacts?.omni?.kuno?.masteryByCategory as Record<string, number> | undefined) ?? undefined) : undefined);
      if (prev) {
        const alpha = 0.6;
        ewmaMastery = {};
        const cats = new Set([...Object.keys(prev), ...Object.keys(sessionScore.byCategory)]);
        cats.forEach((k) => {
          const prevV = typeof prev[k] === 'number' ? Math.max(0, Math.min(100, Math.round(prev[k]!))) : undefined;
          const curV = (sessionScore.byCategory as Record<string, { percent: number }>)[k]?.percent;
          const next = typeof curV === 'number' ? Math.round(alpha * curV + (1 - alpha) * (prevV ?? curV)) : prevV;
          if (typeof next === 'number') ewmaMastery![k] = next;
        });
      }
    } catch {}

    await setDoc(
      doc(db, 'cunoTests', profileId),
      { lastSession: { percent, ts: serverTimestamp() }, lastByCategory: sessionScore.byCategory },
      { merge: true },
    );
    // Persist overall knowledge + per-category mastery + gamification (simple overwrite/merge)
    await recordOmniPatch({
      kuno: {
        knowledgeIndex: Math.round(percent),
        completedTests: 1,
        masteryByCategory: ewmaMastery ?? masteryByCategory,
        gamification: applyKunoGamification(undefined, 'practice'),
      },
    }, profileId);
    // Also set local fallback so UI reflects changes immediately even if reads lag
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('omnimental_kuno_guest_percent', String(Math.round(percent)));
        window.localStorage.setItem('omnimental_kuno_guest_mastery', JSON.stringify(ewmaMastery ?? masteryByCategory));
      }
    } catch {}
  } catch (e) {
    console.warn('saveKunoAttempts failed', e);
  }
}
