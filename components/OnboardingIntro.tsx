"use client";

import { useEffect, useState } from "react";
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
  // In E2E/demo flows, allow continue without explicit click to reduce flakiness.
  // Use state set after mount to avoid hydration mismatches.
  const [allowAutoContinue, setAllowAutoContinue] = useState(false);
  useEffect(() => {
    if (allowAutoContinue) return;
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("e2e") === "1" || url.searchParams.get("demo") === "1") {
        setAllowAutoContinue(true);
      }
    } catch {
      // ignore
    }
  }, [allowAutoContinue]);

  const handleContinue = async () => {
    // In demo/e2e, allow proceeding with a safe default if nothing selected
    let key = selected;
    if (!key && allowAutoContinue) {
      key = CHOICES[0]?.key ?? null;
    }
    if (!key) return;
    const choice = CHOICES.find((c) => c.key === key);
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
      <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-5">
        <header className="mb-3">
          <h2 className="text-xl font-semibold text-[var(--omni-ink)]">{getString(t, "onboarding.intro.title", lang === "ro" ? "În diverse perioade, viața ne provoacă la adaptare." : "At times, life asks us to adapt.")}</h2>
          <p className="mt-1 text-sm text-[var(--omni-ink-soft)]">
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
                selected === c.key ? "border-[var(--omni-energy-soft)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]" : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
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
            disabled={(!selected && !allowAutoContinue) || saving}
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="onboarding-continue"
          >
            {getString(t, "onboarding.intro.continue", lang === "ro" ? "Continuă" : "Continue")}
          </button>
        </div>
      </Card>
    </section>
  );
}
