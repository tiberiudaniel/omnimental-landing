"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import ScoreCard from "@/components/onboarding/ScoreCard";
import { useI18n } from "@/components/I18nProvider";
import { getDb, areWritesDisabled } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { recordOmniPatch, recordPracticeSession, recordActivityEvent } from "@/lib/progressFacts";
import { applyKunoGamification } from "@/lib/kunoGamification";
import Link from "next/link";
import { useEffect } from "react";

export default function StepMiniTestScore({ answers, score, userId, topicKey, questionsMeta, onContinue }: { answers: number[]; score: { raw: number; max: number }; userId: string | null; topicKey?: string; questionsMeta?: Array<{ id: string; correctIndex: number; style?: string; facet?: string; topicKey?: string; questionText?: string }>; onContinue: () => void }) {
  const { lang } = useI18n();
  useEffect(() => {
    const save = async () => {
      // Compute session percent from graded items when available
      let percent = score.max > 0 ? Math.round((score.raw / score.max) * 100) : 0;
      // Derive simple readiness and signals from known items
      let readiness: number | undefined;
      const signals: Record<string, string> = {};
      let categoryMastery: Record<string, number> = {};
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
        // recompute session percent and per-category from graded items
        const graded: Array<{ id: string; correctIndex: number; sel: number; topic?: string }> = [];
        (questionsMeta || []).forEach((m, idx) => {
          if (typeof m.correctIndex === 'number' && m.correctIndex >= 0) {
            graded.push({ id: m.id, correctIndex: m.correctIndex, sel: answers[idx] ?? -1, topic: m.topicKey });
          }
        });
        if (graded.length) {
          const ok = graded.filter((g) => g.sel === g.correctIndex).length;
          percent = Math.round((ok / graded.length) * 100);
          const agg = new Map<string, { t: number; c: number }>();
          graded.forEach((g) => {
            const cat = (g.topic as string | undefined) ?? (g.id.split('_')[0] || 'general');
            const cur = agg.get(cat) || { t: 0, c: 0 };
            cur.t += 1; if (g.sel === g.correctIndex) cur.c += 1;
            agg.set(cat, cur);
          });
          const out: Record<string, number> = {};
          agg.forEach((v, k) => { out[k] = Math.round((v.c / Math.max(1, v.t)) * 100); });
          categoryMastery = out;
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
        // Log a knowledge activity event (test)
        try {
          const mapTopic: Record<string, string> = {
            relatii: "relationships_communication",
            performanta: "decision_discernment",
            energie: "energy_body",
            identitate: "self_trust",
            calm: "emotional_balance",
            obiceiuri: "energy_body",
            sens: "self_trust",
          };
          const focusTag = topicKey ? (mapTopic[topicKey] || topicKey) : null;
          await recordActivityEvent({
            startedAtMs: Date.now(),
            source: 'omnikuno',
            category: 'knowledge',
            units: 1,
            focusTag,
          }, userId ?? undefined);
        } catch {}
        // Normalize topicKey to dashboard categories for mastery bars
        const mapTopic: Record<string, string> = {
          relatii: "relationships_communication",
          performanta: "decision_discernment",
          energie: "energy_body",
          identitate: "self_trust",
          calm: "emotional_balance",
          obiceiuri: "energy_body",
          sens: "self_trust",
        };
        const normalizedKey = topicKey ? (mapTopic[topicKey] || topicKey) : undefined;
        // Patch omni.kuno: knowledge + mastery (primary + optional secondary estimates)
        await recordOmniPatch({
          kuno: {
            knowledgeIndex: percent,
            completedTests: 1,
            ...(normalizedKey ? { masteryByCategory: (
              () => {
                const base: Record<string, number> = {};
                if (categoryMastery && Object.keys(categoryMastery).length) {
                  // Map raw cat keys to dashboard keys
                  Object.entries(categoryMastery).forEach(([k, v]) => {
                    const dk = (mapTopic[k] || k) as string;
                    base[dk] = Math.round(v);
                  });
                } else {
                  base[normalizedKey] = percent;
                }
                return base;
              }
            )() } : {}),
            ...(typeof readiness === 'number' ? { readinessIndex: readiness } : {}),
            ...(Object.keys(signals).length ? { signals } : {}),
            gamification: applyKunoGamification(undefined, 'onboarding_test'),
          },
        }, userId ?? undefined);
        // If user answered any reflection items, log a reflection activity so dashboard counters pick it up
        try {
          const reflectionsAnswered = (questionsMeta || []).filter((m, idx) => (m?.style === 'reflection') && typeof answers[idx] === 'number' && answers[idx]! >= 0).length;
          if (reflectionsAnswered > 0) {
            const now = Date.now();
            await recordPracticeSession('reflection', now - 60 * reflectionsAnswered * 1000, 45 * reflectionsAnswered, userId ?? undefined);
          }
        } catch {}
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
      <ScoreCard raw={score.raw} max={score.max} title={lang === 'ro' ? 'Scor Omni‑Kuno (cunoștințe)' : 'Omni‑Kuno score (knowledge)'} />
      {(() => {
        // Supportive micro‑message based on percent (pure knowledge quiz)
        try {
          const pct = score.max > 0 ? Math.round((score.raw / score.max) * 100) : 0;
          const msg = (() => {
            if (pct >= 90) return lang === 'ro' ? 'Excelent start — baza ta de cunoștințe este foarte solidă.' : 'Excellent start — very solid knowledge baseline.';
            if (pct >= 70) return lang === 'ro' ? 'Foarte bine — ești pe drumul cel bun.' : 'Great job — you’re on the right track.';
            if (pct >= 40) return lang === 'ro' ? 'Bun început — mini‑lecțiile te vor ajuta să crești repede.' : 'Good start — micro‑lessons will help you grow quickly.';
            return lang === 'ro' ? 'E doar începutul — aici înveți rapid. Continuăm pas cu pas.' : 'It’s just the beginning — you learn fast here. Step by step.';
          })();
          return <p className="-mt-2 text-center text-[12px] text-[#1F3C2F]">{msg}</p>;
        } catch { return null; }
      })()}
      {(() => {
        try {
          return (
            <p className="-mt-2 text-center text-[12px] text-[#7B6B60]">
              {lang === 'ro' ? `${score.raw} / ${score.max} răspunsuri corecte.` : `${score.raw} / ${score.max} correct answers.`}
            </p>
          );
        } catch { return null; }
      })()}
      {/* Keep first contact simple: no extra explanation block */}
      {/* Removed extra facet summary to keep the score view simple for initiation */}
      {topicKey ? (
        <div className="rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4A3A30]">
          {lang === 'ro' ? 'Următorul pas util:' : 'Next useful step:'}{' '}
          <Link href={`/kuno/practice?cat=${topicKey}`} className="underline hover:text-[#C07963]">{lang === 'ro' ? 'exersează în aceeași categorie' : 'practice in the same category'}</Link>.
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <Link href="/progress?from=initiation&step=omnikuno-test-done" className="text-[12px] underline text-[#7B6B60] hover:text-[#2C2C2C]">
          {lang === 'ro' ? 'Mergi acum să vezi progresul' : 'Go see your progress now'}
        </Link>
        <button data-testid="eo-continue" onClick={onContinue} className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]">{lang === 'ro' ? 'Continuă' : 'Continue'}</button>
      </div>
    </section>
  );
}
