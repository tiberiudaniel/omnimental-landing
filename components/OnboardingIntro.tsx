"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { recordIntentProgressFact } from "@/lib/progressFacts";

type Choice = {
  key: string;
  label: string;
  tags: string[];
};

const CHOICES: Choice[] = [
  { key: "calm_clarity", label: "onboarding.intro.choice.calm_clarity", tags: ["calm", "clarity"] },
  { key: "control_balance", label: "onboarding.intro.choice.control_balance", tags: ["control", "balance"] },
  { key: "perform_focus", label: "onboarding.intro.choice.perform_focus", tags: ["performance", "focus"] },
];

export default function OnboardingIntro({ profileId, onDone }: { profileId: string; onDone: () => void }) {
  const { lang, t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    const choice = CHOICES.find((c) => c.key === selected);
    if (!choice) return;
    setSaving(true);
    try {
      const tags = choice.tags;
      const categories = tags.map((t) => ({ category: t, count: 1 }));
      await recordIntentProgressFact(
        {
          tags,
          categories,
          urgency: 6,
          lang: lang === "en" ? "en" : "ro",
          firstExpression: null,
          firstCategory: tags[0] ?? null,
        },
        profileId,
      );
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4" data-testid="onboarding-intro">
      <Card className="rounded-2xl border border-[#E4DAD1] bg-white p-5 shadow-sm">
        <header className="mb-3">
          <h2 className="text-xl font-semibold text-[#1F1F1F]">{getString(t, "onboarding.intro.title", lang === "ro" ? "În diverse perioade, viața ne provoacă la adaptare." : "At times, life asks us to adapt.")}</h2>
          <p className="mt-1 text-sm text-[#4A3A30]">
            {getString(t, "onboarding.intro.body", lang === "ro" ? "Aici începe antrenamentul tău pentru perioade ca aceasta — când ai nevoie de claritate, energie și sens." : "This is your training space for moments like these — when you need clarity, energy and direction.")}
          </p>
        </header>
        <div className="space-y-2">
          {CHOICES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelected(c.key)}
              className={`w-full rounded-[12px] border px-4 py-3 text-left text-sm ${
                selected === c.key ? "border-[#2C2C2C] bg-[#2C2C2C] text-white" : "border-[#E4DAD1] bg-[#FFFBF7] text-[#2C2C2C] hover:border-[#2C2C2C]"
              }`}
              data-testid={`onboarding-choice-${c.key}`}
            >
              {getString(t, c.label, c.key)}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || saving}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="onboarding-continue"
          >
            {getString(t, "onboarding.intro.continue", lang === "ro" ? "Continuă" : "Continue")}
          </button>
        </div>
      </Card>
    </section>
  );
}
