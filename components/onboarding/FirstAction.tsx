"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { serverTimestamp } from "firebase/firestore";
import { useI18n } from "@/components/I18nProvider";
import { areWritesDisabled } from "@/lib/firebase";
import { recordOmniPatch } from "@/lib/progressFacts";

type FirstActionProps = {
  userId?: string | null;
  themeLabel?: string | null;
  onComplete?: () => void;
};

export function FirstAction({ userId, themeLabel, onComplete }: FirstActionProps) {
  const { lang } = useI18n();
  const router = useRouter();
  const [actionText, setActionText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";

  const persistAction = async (text: string) => {
    if (userId && !areWritesDisabled()) {
      await recordOmniPatch(
        {
          initiation: {
            firstAction: {
              text,
              theme: themeLabel ?? null,
              savedAt: serverTimestamp() as unknown as Date,
            },
          },
        },
        userId,
      );
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    const trimmed = actionText.trim();
    if (!trimmed) {
      setError(normalizedLang === "ro" ? "Descrie acțiunea înainte să continui." : "Describe the action before continuing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await persistAction(trimmed);
    } finally {
      setSaving(false);
      if (onComplete) onComplete();
      else router.push("/progress?from=first-action");
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[24px] border border-[#E4DAD1] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "url('/assets/onboarding-path-arrow.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="relative z-10 space-y-5 text-left text-[#3D1C10]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
          {normalizedLang === "ro" ? "Acțiune ghidată" : "Guided action"}
        </p>
        <div>
          <h2 className="text-2xl font-semibold leading-snug text-[#2A140A]">
            {normalizedLang === "ro" ? "Prima ta acțiune" : "Your first action"}
          </h2>
          <p className="mt-2 text-sm text-[#4A3A30]">
            {normalizedLang === "ro"
              ? "Activezi protocolul mental înainte de primul exercițiu real. Stabilim o singură acțiune clară pe care o vei face în următoarele 24 de ore."
              : "Activate the mental protocol before your first real exercise. Decide on one clear action you’ll do in the next 24 hours."}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#E4DAD1] bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
            {normalizedLang === "ro" ? "Respirație (opțional, 3 cicluri)" : "Breathing (optional, 3 cycles)"}
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#4A3A30]">
            <li>{normalizedLang === "ro" ? "Inspiră 4 secunde adânc." : "Inhale deeply for 4 seconds."}</li>
            <li>{normalizedLang === "ro" ? "Ține aerul 4 secunde și observă tensiunea." : "Hold for 4 seconds and notice the tension."}</li>
            <li>{normalizedLang === "ro" ? "Expiră lent 6 secunde." : "Exhale slowly for 6 seconds."}</li>
          </ul>
        </div>
        <div>
          <label htmlFor="first-action-plan" className="text-sm font-semibold text-[#3D1C10]">
            {normalizedLang === "ro" ? "Ce acțiune concretă vrei să faci în următoarele 24 de ore?" : "What concrete action will you take in the next 24 hours?"}
          </label>
          <textarea
            id="first-action-plan"
            data-testid="first-action-plan"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            className="mt-2 w-full rounded-[12px] border border-[#D8C6B6] bg-white/95 px-4 py-3 text-sm text-[#2A140A] shadow-inner focus:border-[#C07963] focus:outline-none focus:ring-1 focus:ring-[#C07963]"
            rows={3}
            placeholder={normalizedLang === "ro" ? "Ex: trimit mesajul de clarificare către colegul X." : "Ex: send the clarification message to my colleague."}
          />
          {error ? <p className="mt-2 text-sm text-[#B3261E]">{error}</p> : null}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            data-testid="first-action-submit"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[12px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {normalizedLang === "ro" ? "Salvează acțiunea" : "Save action"}
          </button>
        </div>
      </div>
    </div>
  );
}
