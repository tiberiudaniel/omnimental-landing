"use client";

import BreathAnimation from "@/components/onboarding/BreathAnimation";
import Typewriter from "@/components/onboarding/Typewriter";
import { getDb, areWritesDisabled } from "@/lib/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import { recordPracticeEvent, recordPracticeSession } from "@/lib/progressFacts";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/I18nProvider";

export default function StepBreathPractice({ userId, onDone, onSkip }: { userId?: string | null; onDone: () => void; onSkip: () => void }) {
  const { lang } = useI18n();
  const startRef = useRef<number>(0);
  useEffect(() => {
    startRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
  }, []);
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Pas 6/7 — Pas 2/2' : 'Step 6/7 — Step 2/2'}</div>
        <Typewriter text={lang === 'ro' ? "Exercițiu de respirație ghidată — 2 minute. Inspiră, ține, expiră, ține. Observă cum se schimbă starea." : "Guided breathing — 2 minutes. Inhale, hold, exhale, hold. Notice the shift."} />
      </div>
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white p-6 text-center shadow-sm">
        <BreathAnimation seconds={120} />
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={async () => {
              try {
                if (userId && !areWritesDisabled()) {
                  const db = getDb();
                  await setDoc(
                    doc(db, "userProfiles", userId),
                    { experienceOnboardingCompleted: true, experienceOnboardingCycles: increment(1) },
                    { merge: true },
                  );
                }
                if (typeof window !== 'undefined') {
                  try {
                    window.localStorage.setItem('omnimental_exp_onb_completed', '1');
                    const raw = window.localStorage.getItem('omnimental_exp_onb_cycles');
                    const n = raw ? Number(raw) : 0;
                    const next = Number.isFinite(n) ? n + 1 : 1;
                    window.localStorage.setItem('omnimental_exp_onb_cycles', String(next));
                  } catch {}
                }
                // Record breathing practice so dashboard counters/timeline update
                await recordPracticeEvent("breathing");
                await recordPracticeSession("breathing", startRef.current, 120);
              } catch {
                // ignore
              }
              onDone();
            }}
            className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          >
            {lang === 'ro' ? 'Am terminat' : 'Done'}
          </button>
          <button onClick={onSkip} className="rounded-[10px] border border-[#D8C6B6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]">{lang === 'ro' ? 'Sari peste' : 'Skip'}</button>
        </div>
      </div>
    </section>
  );
}
