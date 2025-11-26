"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { serverTimestamp } from "firebase/firestore";
import { useI18n } from "@/components/I18nProvider";
import { areWritesDisabled } from "@/lib/firebase";
import { recordOmniPatch } from "@/lib/progressFacts";
import IllustratedStep from "@/components/onboarding/IllustratedStep";
import onboardingPathArrow from "@/public/assets/onboarding-path-arrow.jpg";

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
  const trimmedText = actionText.trim();
  const isActionValid = trimmedText.length >= 10;

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
    if (!isActionValid) {
      setError(normalizedLang === "ro" ? "Descrie acțiunea înainte să continui." : "Describe the action before continuing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await persistAction(trimmedText);
    } finally {
      setSaving(false);
      if (onComplete) onComplete();
      else router.push("/progress?from=first-action");
    }
  };

  return (
    <IllustratedStep
      image={onboardingPathArrow}
      imageAlt={normalizedLang === "ro" ? "Drum cu săgeată către următorul pas" : "Path with arrow toward next step"}
      label={normalizedLang === "ro" ? "Acțiune ghidată" : "Guided action"}
      title={normalizedLang === "ro" ? "Prima ta acțiune" : "Your first action"}
      body={
        <p className="text-sm md:text-base leading-relaxed">
          {normalizedLang === "ro"
            ? "Stabilești o singură acțiune clară pe care o vei face în următoarele 24 de ore. Nu trebuie să fie perfectă, doar concretă și realistă."
            : "Choose one clear action you’ll do in the next 24 hours. It doesn’t have to be perfect—just concrete and realistic."}
        </p>
      }
      orientation="imageRight"
    >
      <div className="space-y-4 text-sm text-[#4A3A30]">
        <div>
          <p className="font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
            {normalizedLang === "ro" ? "Respirație (opțional, 3 cicluri)" : "Breathing (optional, 3 cycles)"}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{normalizedLang === "ro" ? "Inspiră 4 secunde adânc." : "Inhale deeply for 4 seconds."}</li>
            <li>{normalizedLang === "ro" ? "Ține aerul 4 secunde și observă tensiunea." : "Hold for 4 seconds and notice the tension."}</li>
            <li>{normalizedLang === "ro" ? "Expiră lent 6 secunde." : "Exhale slowly for 6 seconds."}</li>
          </ul>
        </div>
        <div>
          <label htmlFor="first-action-plan" className="text-[13px] font-semibold text-[#7B6B60]">
            {normalizedLang === "ro" ? "Ce acțiune concretă vrei să faci în următoarele 24 de ore?" : "What concrete action will you take in the next 24 hours?"}
          </label>
          <textarea
            id="first-action-plan"
            data-testid="first-action-plan"
            value={actionText}
            onChange={(e) => {
              setActionText(e.target.value);
              if (error && e.target.value.trim().length > 0) {
                setError(null);
              }
            }}
            rows={3}
            className="mt-2 w-full rounded-[12px] border border-[#E4DAD1] bg-white px-4 py-2 text-sm text-[#2C2C2C] outline-none transition focus:border-[#C07963] focus:ring-1 focus:ring-[#C07963]"
            placeholder={normalizedLang === "ro" ? "Ex.: Trimit mesajul de clarificare către colegul X." : "Ex: Send the clarification note to my teammate."}
          />
          {error ? <p className="mt-2 text-xs text-[#B3261E]">{error}</p> : null}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            data-testid="first-action-submit"
            onClick={handleSubmit}
            disabled={saving || !isActionValid}
            className="inline-flex items-center justify-center rounded-[999px] border border-[#2C2C2C] px-6 py-2 text-[13px] font-semibold tracking-[0.18em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {normalizedLang === "ro" ? "Salvează acțiunea" : "Save action"}
          </button>
        </div>
      </div>
    </IllustratedStep>
  );
}
