"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { saveCatLiteSnapshot, getTraitLabel, type CatAxisId } from "@/lib/profileEngine";
import OnboardingProgressBar, { type OnboardingProgressMeta } from "@/components/onboarding/OnboardingProgressBar";
import { track } from "@/lib/telemetry/track";
import { CAT_LITE_CORE_AXES } from "@/lib/catLite";
import CatRadarChart from "@/components/cat/CatRadarChart";
import type { CatAxisId as RadarAxisId } from "@/config/catEngine";
import VocabChip from "@/components/vocab/VocabChip";
import VocabCard from "@/components/vocab/VocabCard";
import { useI18n } from "@/components/I18nProvider";
import { getDefaultVocabForAxis } from "@/config/catVocabulary";
import { getUnlockedVocabIds, unlockVocab } from "@/lib/vocabProgress";

type CoreAxisId = (typeof CAT_LITE_CORE_AXES)[number];

type CatLiteItemId =
  | "clarity_1"
  | "clarity_2"
  | "focus_1"
  | "focus_2"
  | "energy_1"
  | "energy_2"
  | "emotionalStability_1"
  | "emotionalStability_2";

type CatLiteQuestion = {
  id: CatLiteItemId;
  axisId: CatAxisId;
  label: string;
};

const CAT_LITE_PART1_QUESTIONS: CatLiteQuestion[] = [
  {
    id: "clarity_1",
    axisId: "clarity",
    label:
      "În ultimele 7–10 zile, cât de ușor ți-a fost să îți clarifici ce ai de făcut într-o zi (fără să te simți pierdut)?",
  },
  {
    id: "clarity_2",
    axisId: "clarity",
    label:
      "Cât de des ai știut exact care este următorul pas concret, fără să tot amâni pentru că nu era clar?",
  },
  {
    id: "focus_1",
    axisId: "focus",
    label:
      "Cât de des ai reușit să rămâi concentrat pe un singur lucru, fără să tot verifici telefonul, mailul sau alte distrageri?",
  },
  {
    id: "focus_2",
    axisId: "focus",
    label:
      "Când ai avut de finalizat o sarcină importantă, cât de bine ai reușit să o duci până la capăt, fără să sari la altceva între timp?",
  },
  {
    id: "energy_1",
    axisId: "energy",
    label:
      "În ultimele zile, cât de des te-ai simțit cu bateriile suficient de pline ca să duci la capăt ce ți-ai propus?",
  },
  {
    id: "energy_2",
    axisId: "energy",
    label:
      "Când ai terminat o zi de lucru, câtă energie ți-a mai rămas pentru tine (fără să te simți complet stors)?",
  },
  {
    id: "emotionalStability_1",
    axisId: "emotionalStability",
    label: "Cât de ușor ți-a fost să revii la un nivel ok după ce te-ai enervat, stresat sau frustrat?",
  },
  {
    id: "emotionalStability_2",
    axisId: "emotionalStability",
    label:
      "În ultimele 7–10 zile, cât de mult simți că emoțiile tale au fost în zona funcțională, fără să explodezi sau să te blochezi complet?",
  },
];

const CORE_AXIS_LABELS: Partial<Record<CatAxisId, string>> = {
  clarity: "Claritate cognitivă",
  focus: "Focus și continuitate",
  energy: "Energie funcțională",
  emotionalStability: "Stabilitate emoțională",
};

const RADAR_AXIS_MAP: Partial<Record<CatAxisId, { radarId: RadarAxisId; label: string }>> = {
  clarity: { radarId: "clarity", label: "Claritate" },
  focus: { radarId: "focus", label: "Focus" },
  energy: { radarId: "energy", label: "Energie" },
  emotionalStability: { radarId: "emo_stab", label: "Stabilitate emoțională" },
};

const SLIDER_MIN = 0;
const SLIDER_MAX = 10;

type Props = {
  onComplete: () => void;
  progress: OnboardingProgressMeta;
};

export default function OnboardingCatLite({ onComplete, progress }: Props) {
  const { user, authReady } = useAuth();
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const [values, setValues] = useState<Record<CatLiteItemId, number>>(() =>
    CAT_LITE_PART1_QUESTIONS.reduce((acc, question) => {
      acc[question.id] = 5;
      return acc;
    }, {} as Record<CatLiteItemId, number>),
  );
  const [touched, setTouched] = useState<Record<CatLiteItemId, boolean>>(() =>
    CAT_LITE_PART1_QUESTIONS.reduce((acc, question) => {
      acc[question.id] = false;
      return acc;
    }, {} as Record<CatLiteItemId, boolean>),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = useMemo(() => CAT_LITE_PART1_QUESTIONS.every((question) => touched[question.id]), [touched]);
  const disabled = !authReady || !user || saving || !allAnswered;
  const averagedScores = useMemo<Record<CoreAxisId, number>>(
    () =>
      CAT_LITE_CORE_AXES.reduce((acc, axisId) => {
        const axisItems = CAT_LITE_PART1_QUESTIONS.filter((question) => question.axisId === axisId);
        const sum = axisItems.reduce((total, item) => total + (values[item.id] ?? 0), 0);
        const avg = axisItems.length ? sum / axisItems.length : 0;
        acc[axisId] = Number(avg.toFixed(2));
        return acc;
      }, {} as Record<CoreAxisId, number>),
    [values],
  );
  const radarData = useMemo(() => {
    if (!allAnswered) return [];
    return CAT_LITE_CORE_AXES.map((axisId) => {
      const config =
        RADAR_AXIS_MAP[axisId] ?? {
          radarId: axisId as RadarAxisId,
          label: CORE_AXIS_LABELS[axisId] ?? axisId,
        };
      const value = Math.max(0, Math.min(10, averagedScores[axisId] ?? 0));
      return {
        id: config.radarId,
        label: config.label,
        value: value * 10,
      };
    });
  }, [allAnswered, averagedScores]);
  const weakestAxis = useMemo(() => {
    if (!allAnswered) return null;
    return CAT_LITE_CORE_AXES.reduce<CoreAxisId | null>((lowest, axis) => {
      if (!lowest) return axis;
      return (averagedScores[axis] ?? 0) < (averagedScores[lowest] ?? 0) ? axis : lowest;
    }, null);
  }, [allAnswered, averagedScores]);

  const handleChange = (questionId: CatLiteItemId, rawValue: number) => {
    setValues((prev) => ({ ...prev, [questionId]: rawValue }));
    setTouched((prev) => ({ ...prev, [questionId]: true }));
  };

  const startTrackedRef = useRef(false);
  useEffect(() => {
    if (!authReady || startTrackedRef.current) return;
    track("cat_lite_started", { phase: 1 });
    startTrackedRef.current = true;
  }, [authReady]);

  const handleSubmit = async () => {
    if (!user || !authReady || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveCatLiteSnapshot(user.uid, averagedScores);
      track("cat_lite_completed", {
        phase: 1,
        clarity: averagedScores.clarity ?? null,
        focus: averagedScores.focus ?? null,
        energy: averagedScores.energy ?? null,
        emotionalStability: averagedScores.emotionalStability ?? null,
      });
      onComplete();
    } catch (err) {
      console.error("saveCatLiteSnapshot failed", err);
      setError("Nu am reușit să salvăm măsurarea. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const [unlockedVocabIds, setUnlockedVocabIds] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setUnlockedVocabIds(getUnlockedVocabIds());
  }, []);

  const axisDefaultVocabMap = useMemo(() => {
    const map: Partial<Record<CatAxisId, string>> = {};
    CAT_LITE_CORE_AXES.forEach((axisId) => {
      map[axisId] = getDefaultVocabForAxis(axisId).id;
    });
    return map;
  }, []);

  const weakestVocab = useMemo(() => {
    if (!weakestAxis) return null;
    return getDefaultVocabForAxis(weakestAxis);
  }, [weakestAxis]);

  const weakestUnlocked = weakestVocab ? unlockedVocabIds.includes(weakestVocab.id) : false;

  if (!authReady) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--omni-ink-soft)]">Se pregătește spațiul tău…</p>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  const coreWordLabel = locale === "en" ? "Core word:" : "Cuvânt de bază:";
  const reflexIntro =
    locale === "en"
      ? "Today you learn a reflex-word. Not theory. A button."
      : "Astăzi înveți un „cuvânt-reflex”. Nu e teorie. E buton.";

  const handleWeakestUnlock = () => {
    if (!weakestVocab) return;
    const updated = unlockVocab(weakestVocab.id);
    setUnlockedVocabIds(updated);
    track("vocab_unlocked", {
      vocabId: weakestVocab.id,
      axisId: weakestVocab.axisId,
      surface: "onboarding_result",
    });
  };

  const handleWeakestSkip = () => {
    if (!weakestVocab) return;
    track("vocab_skipped", {
      vocabId: weakestVocab.id,
      axisId: weakestVocab.axisId,
      surface: "onboarding_result",
    });
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_8px_28px_rgba(0,0,0,0.15)]">
      <OnboardingProgressBar {...progress} />
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">Mini-profil CAT – Partea 1 (4 trăsături de bază)</h1>
        <p className="text-sm text-[var(--omni-ink-soft)]">
          Acum ne uităm la 4 trăsături de bază. Harta completă are 7, iar celelalte 3 se vor deschide după câteva sesiuni.
        </p>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
          0 = deloc / aproape niciodată · 10 = aproape mereu
        </p>
      </header>

      <div className="space-y-5">
        {CAT_LITE_PART1_QUESTIONS.map((question) => {
          const axisLabel = CORE_AXIS_LABELS[question.axisId as CoreAxisId];
          const value = values[question.id];
          const vocabId = axisDefaultVocabMap[question.axisId];
          return (
            <article
              key={question.id}
              className="space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4"
              data-testid={`cat-lite-question-${question.id}`}
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{axisLabel}</p>
                {vocabId ? (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[var(--omni-muted)]">
                    <span>{coreWordLabel}</span>
                    <VocabChip vocabId={vocabId} locale={locale} variant="new" />
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-[var(--omni-ink)]">{question.label}</p>
              <input
                type="range"
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={1}
                value={value}
                onChange={(event) => handleChange(question.id, Number(event.target.value))}
                className="w-full accent-[var(--omni-energy)]"
                aria-label={question.label}
                data-testid={`cat-lite-slider-${question.id}`}
              />
              <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
                <span>0 · deloc</span>
                <span>10 · foarte des</span>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-[16px] border border-[var(--omni-border-soft)] bg-white/85 px-4 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Harta instant</p>
        {allAnswered ? (
          <div className="mt-4 space-y-4">
            <CatRadarChart data={radarData} />
            {weakestAxis ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--omni-ink)]/85">
                  Zonă cu scor minim:{" "}
                  <span className="font-semibold text-[var(--omni-ink)]">{getTraitLabel(weakestAxis)}</span>. Primul arc și primele module vor lucra prioritar
                  aici, apoi extindem spre celelalte trăsături.
                </p>
                {weakestVocab ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--omni-ink)]/75">{reflexIntro}</p>
                    <VocabCard
                      vocabId={weakestVocab.id}
                      locale={locale}
                      variant="full"
                      cta={
                        weakestUnlocked
                          ? undefined
                          : {
                              primaryLabel: locale === "en" ? "Unlock" : "Îl vreau",
                              onPrimary: handleWeakestUnlock,
                              secondaryLabel: locale === "en" ? "Later" : "Mai târziu",
                              onSecondary: handleWeakestSkip,
                            }
                      }
                    />
                    {weakestUnlocked ? (
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                        {locale === "en" ? "Already in your vocabulary." : "Deja este în vocabularul tău."}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--omni-ink-soft)]">
            Completează toate întrebările pentru a vedea harta CAT și planul de lucru pentru primele zile.
          </p>
        )}
      </section>

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
