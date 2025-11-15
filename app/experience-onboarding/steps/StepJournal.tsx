"use client";

import { useState } from "react";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { getDb, areWritesDisabled, ensureAuth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { recordPracticeEvent, recordPracticeSession, recordRecentEntry } from "@/lib/progressFacts";

export default function StepJournal({ userId, onSaved, onSkip }: { userId: string | null; onSaved: () => void; onSkip: () => void }) {
  const { lang } = useI18n();
  const [text, setText] = useState("");
  const startedAt = Date.now();
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      if (!areWritesDisabled()) {
        // Fallback: allow anonymous auth UID when profile/userId is not yet created
        const authUser = await ensureAuth();
        const effectiveUserId = userId || authUser?.uid || null;
        if (effectiveUserId) {
          const db = getDb();
          await addDoc(collection(db, "journals"), {
            userId: effectiveUserId,
            text,
            ts: serverTimestamp(),
            source: "experience-onboarding",
          });
          // Update progress facts counters and timeline so dashboard reflects activity
          await recordPracticeEvent("reflection", effectiveUserId);
          await recordPracticeSession(
            "reflection",
            startedAt,
            Math.max(60, Math.round(text.length / 2)), // rough duration
            effectiveUserId,
          );
          await recordRecentEntry(text, undefined, effectiveUserId);
        }
      }
    } catch (e) {
      console.warn("journal save error", e);
    } finally {
      setBusy(false);
      onSaved();
    }
  };
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Pas 5/7 — Pas 1/2' : 'Step 5/7 — Step 1/2'}</div>
        <Typewriter text={lang === 'ro' ? "Scrie două‑trei rânduri despre starea ta acum. Asta ne ajută să calibrăm recomandările." : "Write a couple of lines about how you feel now. This helps calibrate recommendations."} />
      </div>
      <GuideCard title={lang === 'ro' ? 'Jurnal scurt' : 'Short journal'}>
        <textarea data-testid="eo-journal-text" value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-[10px] border border-[#D8C6B6] p-3 text-sm text-[#2C2C2C] focus:border-[#E60012] focus:outline-none" rows={4} placeholder={lang === 'ro' ? "Ce observi în corp și minte chiar acum?" : "What do you notice in body and mind right now?"} />
        <div className="mt-3 flex gap-2">
          <button disabled={!text || busy} onClick={save} className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]">{lang === 'ro' ? 'Salvează' : 'Save'}</button>
          <button onClick={onSkip} className="rounded-[10px] border border-[#D8C6B6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]">{lang === 'ro' ? 'Sari peste' : 'Skip'}</button>
        </div>
      </GuideCard>
    </section>
  );
}
