"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { saveCatLiteSnapshot, type CatAxisId } from "@/lib/profileEngine";

type AxisConfig = {
  id: CatAxisId;
  label: string;
  description: string;
};

const CAT_LITE_AXES: AxisConfig[] = [
  {
    id: "clarity",
    label: "Claritate cognitivă",
    description: "Cât de clar poți defini problema și separa semnalul de zgomot.",
  },
  {
    id: "energy",
    label: "Energie și recuperare",
    description: "Câtă energie mentală simți că ai disponibilă acum.",
  },
  {
    id: "emotionalStability",
    label: "Stabilitate emoțională",
    description: "Cât de repede revii la calm după momente tensionate.",
  },
  {
    id: "focus",
    label: "Focus și continuitate",
    description: "Cât de ușor rămâi pe un singur fir fără să abandonezi.",
  },
];

const SLIDER_MIN = 0;
const SLIDER_MAX = 10;

type Props = {
  onComplete: () => void;
};

export default function OnboardingCatLite({ onComplete }: Props) {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<CatAxisId, number>>(() =>
    CAT_LITE_AXES.reduce((acc, axis) => {
      acc[axis.id] = 5;
      return acc;
    }, {} as Record<CatAxisId, number>),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !authReady || !user || saving;

  const handleChange = (axisId: CatAxisId, rawValue: number) => {
    setValues((prev) => ({ ...prev, [axisId]: rawValue }));
  };

  const handleSubmit = async () => {
    if (!user || !authReady || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveCatLiteSnapshot(user.uid, values);
      onComplete();
    } catch (err) {
      console.error("saveCatLiteSnapshot failed", err);
      setError("Nu am reușit să salvăm măsurarea. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--omni-ink-soft)]">Se pregătește spațiul tău…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-[var(--omni-ink)]">Ai nevoie de un cont (poate fi și anonim) pentru a continua.</p>
        <OmniCtaButton onClick={() => router.push("/auth")} variant="primary">
          Creează cont
        </OmniCtaButton>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_8px_28px_rgba(0,0,0,0.15)]">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pasul 1 din 3</p>
        <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">Mini evaluare: semnale interne</h1>
        <p className="text-sm text-[var(--omni-ink-soft)]">
          Mută fiecare slider în funcție de cum te simți în ultimele 7 zile. 0 = foarte scăzut, 10 = foarte stabil.
        </p>
      </header>

      <div className="space-y-6">
        {CAT_LITE_AXES.map((axis) => (
          <div
            key={axis.id}
            className="space-y-2 rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4"
            data-testid={`cat-lite-card-${axis.id}`}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <strong className="text-[var(--omni-ink)]">{axis.label}</strong>
                <span className="text-sm font-mono text-[var(--omni-ink-soft)]">{values[axis.id]}</span>
              </div>
              <p className="text-sm text-[var(--omni-ink-soft)]">{axis.description}</p>
            </div>
            <input
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={1}
              value={values[axis.id]}
              onChange={(event) => handleChange(axis.id, Number(event.target.value))}
              className="w-full accent-[var(--omni-energy)]"
              aria-label={axis.label}
              data-testid={`cat-lite-slider-${axis.id}`}
            />
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <OmniCtaButton
          type="button"
          variant="primary"
          disabled={disabled}
          onClick={handleSubmit}
          data-testid="cat-lite-continue"
        >
          {saving ? "Se salvează…" : "Continuă"}
        </OmniCtaButton>
      </div>
    </section>
  );
}
