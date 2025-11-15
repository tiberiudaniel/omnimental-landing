"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import ScoreCard from "@/components/onboarding/ScoreCard";
import { useI18n } from "@/components/I18nProvider";
import { getDb, areWritesDisabled } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { recordOmniPatch } from "@/lib/progressFacts";
import { applyKunoGamification } from "@/lib/kunoGamification";
import Link from "next/link";
import { useEffect } from "react";

export default function StepMiniTestScore({ answers, score, userId, topicKey, questionsMeta, onContinue }: { answers: number[]; score: { raw: number; max: number }; userId: string | null; topicKey?: string; questionsMeta?: Array<{ id: string; correctIndex: number; style?: string }>; onContinue: () => void }) {
  const { lang } = useI18n();
  useEffect(() => {
    const save = async () => {
      const percent = score.max > 0 ? Math.round((score.raw / score.max) * 100) : 0;
      // Derive simple readiness and signals from known items
      let readiness: number | undefined;
      const signals: Record<string, string> = {};
      try {
        const byId = new Map<string, number>();
        (questionsMeta || []).forEach((m, idx) => byId.set(m.id, answers[idx]));
        // readiness mappings (example ids)
        const rid = ['relatii_q6_disponibilitate_experiment', 'calm_q5_readiness', 'clar_q5_readiness'].find((k) => byId.has(k));
        if (rid) {
          const a = byId.get(rid)!; // 0..3 or 0..2
          readiness = ['relatii_q6_disponibilitate_experiment'].includes(rid) ? [10, 40, 75, 25][a] ?? 0 : [10, 45, 75][a] ?? 0;
        }
        // simple signal for conflict style
        if (byId.has('relatii_q3_mod_reactie_conflict')) {
          const a = byId.get('relatii_q3_mod_reactie_conflict')!;
          signals['relatii.conflict_style'] = ['expressive', 'avoidant', 'yielding', 'variable'][a] ?? 'unknown';
        }
      } catch {}
      // Guest/demo fallback: persist locally so dashboard can pick up
      if (!userId || areWritesDisabled()) {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('omnimental_kuno_guest_percent', String(percent));
            if (topicKey) {
              const raw = window.localStorage.getItem('omnimental_kuno_guest_mastery');
              const map = raw ? JSON.parse(raw) : {};
              map[topicKey] = percent;
              window.localStorage.setItem('omnimental_kuno_guest_mastery', JSON.stringify(map));
            }
          }
        } catch {}
        return;
      }
      try {
        const db = getDb();
        await setDoc(
          doc(db, "cunoTests", userId),
          { initialTest: { answers, raw: score.raw, max: score.max, percent, ts: serverTimestamp() } },
          { merge: true },
        );
        // Normalize topicKey to dashboard categories for mastery bars
        const mapTopic: Record<string, string> = {
          relatii: 'relationships',
          performanta: 'performance',
          energie: 'energy',
          identitate: 'clarity',
          calm: 'calm',
          obiceiuri: 'general',
          sens: 'general',
        };
        const normalizedKey = topicKey ? (mapTopic[topicKey] || topicKey) : undefined;
        // Patch omni.kuno: knowledge + mastery (single topic for now)
        await recordOmniPatch({
          kuno: {
            knowledgeIndex: percent,
            completedTests: 1,
            ...(normalizedKey ? { masteryByCategory: { [normalizedKey]: percent } } : {}),
            ...(typeof readiness === 'number' ? { readinessIndex: readiness } : {}),
            ...(Object.keys(signals).length ? { signals } : {}),
            gamification: applyKunoGamification(undefined, 'onboarding_test'),
          },
        }, userId ?? undefined);
      } catch (e) {
        // ignore for onboarding demo
        console.warn("mini-test save failed", e);
      } finally {
        // no-op
      }
    };
    void save();
  }, [answers, score.raw, score.max, userId, questionsMeta, topicKey]);
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Pas 3/7' : 'Step 3/7'}</div>
        <Typewriter text={lang === 'ro' ? "Ai terminat mini‑testul. Iată scorul tău." : "You’ve finished the mini-test. Here is your score."} />
      </div>
      <ScoreCard raw={score.raw} max={score.max} title={lang === 'ro' ? 'Scor Mini‑Cuno' : 'Mini‑Cuno Score'} />
      {topicKey ? (
        <div className="rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4A3A30]">
          {lang === 'ro' ? 'Următorul pas util:' : 'Next useful step:'}{' '}
          <Link href={`/kuno/practice?cat=${topicKey}`} className="underline hover:text-[#C07963]">{lang === 'ro' ? 'exersează în aceeași categorie' : 'practice in the same category'}</Link>.
        </div>
      ) : null}
      <div className="flex justify-end">
        <button data-testid="eo-continue" onClick={onContinue} className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]">{lang === 'ro' ? 'Continuă' : 'Continue'}</button>
      </div>
    </section>
  );
}
