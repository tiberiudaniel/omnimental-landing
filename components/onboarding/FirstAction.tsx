"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useI18n } from "@/components/I18nProvider";
import { getDb, areWritesDisabled } from "@/lib/firebase";
import { recordOmniPatch } from "@/lib/progressFacts";

type FirstActionProps = {
  userId?: string | null;
  themeLabel?: string | null;
};

export function FirstAction({ userId, themeLabel }: FirstActionProps) {
  const { lang } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const trimmed = note.trim();
      if (userId && !areWritesDisabled()) {
        const db = getDb();
        const journalRef = doc(db, "userJournals", userId);
        await setDoc(
          journalRef,
          {
            userId,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
        if (trimmed) {
          await addDoc(collection(db, "userJournals", userId, "entries"), {
            text: trimmed,
            theme: themeLabel ?? null,
            source: "initiation.first_action",
            createdAt: serverTimestamp(),
          });
        }
      }
      if (userId) {
        await recordOmniPatch(
          {
            journal: {
              today: {
                status: "completed",
                updatedAt: serverTimestamp() as unknown as Date,
              },
            },
          },
          userId,
        );
      }
    } finally {
      setSaving(false);
      router.push("/progress?from=first-action");
    }
  };

  return (
    <div
      className="relative mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-transparent bg-cover bg-center px-6 py-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      style={{ backgroundImage: "url('/assets/onboarding-welcome.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#210F06]/85 via-[#2F1609]/75 to-[#110703]/85" />
      <div className="relative z-10 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/75">
          {normalizedLang === "ro" ? "Acțiune ghidată" : "Guided action"}
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-snug text-white">
          {normalizedLang === "ro" ? "Prima ta acțiune" : "Your first action"}
        </h2>
        <p className="mt-2 text-sm text-white/90">
          {normalizedLang === "ro"
            ? "Activezi protocolul mental înainte de primul exercițiu. Urmează pașii de respirație și notează ce ți-a rămas din Lecția 0."
            : "Activate your mental protocol before the first exercise. Follow the breathing cues and capture what stayed with you from Lesson 0."}
        </p>
      </div>
      <div className="prose prose-invert mt-6 max-w-none">
        <h3 className="text-white">{normalizedLang === "ro" ? "Respirație" : "Breathing"}</h3>
        <ul className="text-white/90">
          <li>{normalizedLang === "ro" ? "Inspiră 4 secunde adânc." : "Inhale deeply for 4 seconds."}</li>
          <li>{normalizedLang === "ro" ? "Ține aerul 4 secunde, observă tensiunea." : "Hold for 4 seconds and notice the tension."}</li>
          <li>{normalizedLang === "ro" ? "Expiră lent 6 secunde." : "Exhale slowly for 6 seconds."}</li>
          <li>{normalizedLang === "ro" ? "Repetă de 3 ori, fără grabă." : "Repeat three times without rushing."}</li>
        </ul>
      </div>
      <div className="relative z-10 mt-6">
        <label htmlFor="first-action-note" className="text-sm font-semibold text-white/90">
          {normalizedLang === "ro" ? "Mini-jurnal" : "Quick journal"}
        </label>
        <textarea
          id="first-action-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={normalizedLang === "ro" ? "Ce ți-a rămas din această lecție?" : "What stayed with you from this lesson?"}
          className="mt-2 w-full rounded-[14px] border border-white/50 bg-white/90 px-4 py-3 text-sm text-[#2A140A] shadow-inner focus:border-[#C07963] focus:outline-none focus:ring-1 focus:ring-[#C07963]"
          rows={4}
        />
      </div>
      <div className="relative z-10 mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex w-full items-center justify-center rounded-[12px] border border-white/70 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
        >
          {normalizedLang === "ro" ? "Mergi în Dashboard" : "Go to Dashboard"}
        </button>
      </div>
    </div>
  );
}
