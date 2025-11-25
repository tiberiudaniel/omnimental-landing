"use client";

import { useState } from "react";
import Image from "next/image";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { getDb, areWritesDisabled, ensureAuth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { recordPracticeSession, recordRecentEntry } from "@/lib/progressFacts";
import journalHero from "@/public/assets/onboarding-journal-hero.jpg";

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
          // Update progress facts timeline so dashboard reflects activity
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
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Jurnal – Inițiere' : 'Journal – Initiation'}</div>
        <Typewriter text={lang === 'ro' ? "Notează în câteva rânduri cum te simți acum și ce ți-ai propus să schimbi în perioada următoare." : "Capture a few lines about how you feel now and what you intend to change in the coming period."} />
      </div>
      <div className="mb-3 flex justify-center">
        <Image
          src={journalHero}
          alt={lang === 'ro' ? 'Jurnal lângă un drum sinuos' : 'Journal near a winding path'}
          width={420}
          height={280}
          className="rounded-[18px] border border-[#E4DAD1] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          priority={false}
        />
      </div>
      <GuideCard title={lang === 'ro' ? 'Jurnal scurt' : 'Short journal'}>
        <textarea data-testid="eo-journal-text" value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-[10px] border border-[#D8C6B6] p-3 text-sm text-[#2C2C2C] focus:border-[#E60012] focus:outline-none" rows={4} placeholder={lang === 'ro' ? "Ce simți acum legat de tema ta în focus?" : "What do you feel right now about your focus theme?"} />
        <div className="mt-3 flex gap-2">
          <button disabled={!text || busy} onClick={save} className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]">{lang === 'ro' ? 'Salvează' : 'Save'}</button>
          <button onClick={onSkip} className="rounded-[10px] border border-[#D8C6B6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]">{lang === 'ro' ? 'Sari peste' : 'Skip'}</button>
        </div>
      </GuideCard>
    </section>
  );
}
