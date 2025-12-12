"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { recordQuickAssessment } from "@/lib/progressFacts";

type SliderKey = "energy" | "stress" | "sleep" | "clarity" | "confidence" | "focus";

export default function MiniSelfAssessment({ onDone }: { onDone: () => void }) {
  const { t, lang } = useI18n();
  const [values, setValues] = useState<Record<SliderKey, number>>({
    energy: 6,
    stress: 5,
    sleep: 6,
    clarity: 6,
    confidence: 5,
    focus: 6,
  });
  const [saving, setSaving] = useState(false);

  const label = (k: SliderKey) => {
    const map: Record<SliderKey, string> = {
      energy: getString(t, "selfAssessment.energy", lang === "ro" ? "Energie fizică" : "Energy"),
      stress: getString(t, "selfAssessment.stress", lang === "ro" ? "Stres" : "Stress"),
      sleep: getString(t, "selfAssessment.sleep", lang === "ro" ? "Somn" : "Sleep"),
      clarity: getString(t, "selfAssessment.clarity", lang === "ro" ? "Claritate mentală" : "Clarity"),
      confidence: getString(t, "selfAssessment.confidence", lang === "ro" ? "Încredere" : "Confidence"),
      focus: getString(t, "selfAssessment.focus", lang === "ro" ? "Focus" : "Focus"),
    };
    return map[k];
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await recordQuickAssessment(values);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4" data-testid="onboarding-self">
      <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-5">
        <header className="mb-3">
          <h2 className="text-xl font-semibold text-[var(--omni-ink)]">{getString(t, "selfAssessment.title", lang === "ro" ? "Mini auto‑evaluare" : "Mini self‑assessment")}</h2>
          <p className="mt-1 text-sm text-[var(--omni-ink-soft)]">{getString(t, "selfAssessment.instructions", lang === "ro" ? "Alege rapid un nivel 1–10 pentru fiecare axă. Se salvează instant pentru personalizare." : "Pick a quick 1–10 level for each axis. It saves instantly for personalization.")}</p>
        </header>
        <div className="space-y-3">
          {(Object.keys(values) as SliderKey[]).map((k) => (
            <div key={k} className="grid grid-cols-[110px_1fr_auto] items-center gap-3">
              <label className="text-sm text-[var(--omni-ink)]" htmlFor={`s-${k}`}>{label(k)}</label>
              <input
                id={`s-${k}`}
                type="range"
                min={1}
                max={10}
                step={1}
                value={values[k]}
                onChange={(e) => setValues((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="w-10 text-right text-sm font-semibold text-[var(--omni-energy-soft)]">{values[k]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="onboarding-self-continue"
          >
            {getString(t, "selfAssessment.save", lang === "ro" ? "Continuă" : "Continue")}
          </button>
        </div>
      </Card>
    </section>
  );
}
