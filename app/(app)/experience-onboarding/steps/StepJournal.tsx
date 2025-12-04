"use client";

import { useState } from "react";
import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { getDb, areWritesDisabled, ensureAuth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { recordPracticeSession, recordRecentEntry } from "@/lib/progressFacts";
import journalHero from "@/public/assets/onboarding-journal-hero.jpg";
import IllustratedStep from "@/components/onboarding/IllustratedStep";
import { NeutralCtaButton } from "@/components/ui/cta/NeutralCtaButton";

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
    <IllustratedStep
      image={journalHero}
      imageAlt={lang === 'ro' ? 'Jurnal lângă un drum sinuos' : 'Journal near a winding path'}
      label={lang === 'ro' ? 'Jurnal – Inițiere' : 'Journal – Initiation'}
      title={lang === 'ro' ? 'Deschide jurnalul de început' : 'Open your initiation journal'}
      body={
        <Typewriter
          text={
            lang === 'ro'
              ? "Notează în câteva rânduri cum te simți acum și ce ți-ai propus să schimbi în perioada următoare."
              : "Capture a few lines about how you feel now and what you intend to shift in the coming days."
          }
        />
      }
      orientation="imageRight"
    >
      <textarea
        data-testid="eo-journal-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="theme-input w-full rounded-[12px] p-3 text-sm"
        rows={4}
        placeholder={lang === 'ro' ? "Ce simți acum legat de tema ta în focus?" : "What do you feel right now about your focus theme?"}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <NeutralCtaButton
          disabled={!text || busy}
          onClick={save}
          size="sm"
          className="text-[11px]"
          data-testid="eo-journal-save"
        >
          {lang === "ro" ? "Salvează" : "Save"}
        </NeutralCtaButton>
        <NeutralCtaButton type="button" onClick={onSkip} size="sm" className="text-[11px]">
          {lang === "ro" ? "Sari peste" : "Skip"}
        </NeutralCtaButton>
      </div>
    </IllustratedStep>
  );
}
