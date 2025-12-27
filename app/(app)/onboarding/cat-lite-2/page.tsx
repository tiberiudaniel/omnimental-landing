"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { track } from "@/lib/telemetry/track";
import { saveCatLiteSnapshot, getUserProfileSnapshot, type CatAxisId, type UserProfileSnapshot } from "@/lib/profileEngine";
import { useProgressFacts } from "@/components/useProgressFacts";
import { needsCatLitePart2 } from "@/lib/gatingSelectors";
import { CAT_LITE_EXTENDED_AXES } from "@/lib/catLite";
import VocabChip from "@/components/vocab/VocabChip";
import { getDefaultVocabForAxis } from "@/config/catVocabulary";
import { useI18n } from "@/components/I18nProvider";
import { setExploreCompletion } from "@/lib/intro/exploreState";
import type { CatVocabTag } from "@/config/catVocabulary";

type CatLitePart2ItemId =
  | "recalibration_1"
  | "recalibration_2"
  | "flexibility_1"
  | "flexibility_2"
  | "adaptiveConfidence_1"
  | "adaptiveConfidence_2";

type CatLitePart2Question = {
  id: CatLitePart2ItemId;
  axisId: CatAxisId;
  label: string;
};

const QUESTIONS: CatLitePart2Question[] = [
  {
    id: "recalibration_1",
    axisId: "recalibration",
    label:
      "Când vezi că o abordare nu funcționează, cât de repede reușești să îți schimbi planul fără să rămâi blocat în ideea “o să meargă până la urmă”?",
  },
  {
    id: "recalibration_2",
    axisId: "recalibration",
    label:
      "În ultimele 7–10 zile, când ai primit feedback clar că ceva nu merge, cât de des ai ajustat rapid direcția în loc să insiști pe aceeași rută?",
  },
  {
    id: "flexibility_1",
    axisId: "flexibility",
    label: "Când ți s-au schimbat planurile pe neașteptate, cât de ușor ți-a fost să accepți schimbarea și să treci la noul plan?",
  },
  {
    id: "flexibility_2",
    axisId: "flexibility",
    label:
      "Cât de des poți trece, fără să te blochezi, de la o modalitate de lucru la alta (de exemplu de la “plan detaliat” la “improvizez cu ce am”)?",
  },
  {
    id: "adaptiveConfidence_1",
    axisId: "adaptiveConfidence",
    label:
      "Când intri într-o situație nouă, câtă încredere ai că te poți descurca învățând din mers, chiar dacă nu știi totul de la început?",
  },
  {
    id: "adaptiveConfidence_2",
    axisId: "adaptiveConfidence",
    label:
      "În ultimele 7–10 zile, cât de des ai ales să te bagi în ceva inconfortabil (dar important) în loc să amâni până “te vei simți pregătit”?",
  },
];

const RETURN_TO = "/onboarding/cat-lite-2";
const PRIMER_AXES: CatAxisId[] = ["recalibration", "flexibility", "adaptiveConfidence"];
const AXIS_VOCAB_TAG_MAP: Partial<Record<CatAxisId, CatVocabTag>> = {
  recalibration: "change_resistance",
  flexibility: "rigid",
  adaptiveConfidence: "stuck",
};

function CatLitePart2PageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exploreSource = searchParams.get("source");
  const returnToParam = searchParams.get("returnTo") ?? RETURN_TO;
  const { user, authReady } = useAuth();
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const { data: progressFacts, loading: progressFactsLoading } = useProgressFacts(user?.uid ?? null);
  const [profile, setProfile] = useState<UserProfileSnapshot | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [values, setValues] = useState<Record<CatLitePart2ItemId, number>>(() =>
    QUESTIONS.reduce((acc, question) => {
      acc[question.id] = 5;
      return acc;
    }, {} as Record<CatLitePart2ItemId, number>),
  );
  const [touched, setTouched] = useState<Record<CatLitePart2ItemId, boolean>>(() =>
    QUESTIONS.reduce((acc, question) => {
      acc[question.id] = false;
      return acc;
    }, {} as Record<CatLitePart2ItemId, boolean>),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gatingEvaluated = !progressFactsLoading && !profileLoading;
  const gatingAllowed = gatingEvaluated ? needsCatLitePart2(profile, progressFacts) : null;
  const disabled = saving || !gatingAllowed || !authReady || !user;
  const allAnswered = useMemo(() => QUESTIONS.every((question) => touched[question.id]), [touched]);
  const buttonDisabled = disabled || !allAnswered;

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?returnTo=${encodeURIComponent(returnToParam)}`);
    }
  }, [authReady, returnToParam, router, user]);

  useEffect(() => {
    if (!authReady || !user) return;
    let cancelled = false;
    setProfileLoading(true);
    getUserProfileSnapshot(user.uid)
      .then((snapshot) => {
        if (cancelled) return;
        setProfile(snapshot);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  useEffect(() => {
    if (!gatingEvaluated) return;
    if (gatingAllowed === false) {
      router.replace("/today");
    }
  }, [gatingAllowed, gatingEvaluated, router]);

  const startTrackedRef = useRef(false);
  useEffect(() => {
    if (!gatingEvaluated || gatingAllowed !== true) return;
    if (startTrackedRef.current) return;
    track("cat_lite_started", { phase: 2 });
    startTrackedRef.current = true;
  }, [gatingAllowed, gatingEvaluated]);

  const handleChange = (questionId: CatLitePart2ItemId, raw: number) => {
    setValues((prev) => ({ ...prev, [questionId]: raw }));
    setTouched((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleSubmit = async () => {
    if (!user || saving || !gatingAllowed) return;
    setSaving(true);
    setError(null);
    try {
      const axisScores = CAT_LITE_EXTENDED_AXES.reduce((acc, axisId) => {
        const axisItems = QUESTIONS.filter((question) => question.axisId === axisId);
        const sum = axisItems.reduce((total, item) => total + (values[item.id] ?? 0), 0);
        const avg = axisItems.length ? sum / axisItems.length : 0;
        acc[axisId] = Number(avg.toFixed(2));
        return acc;
      }, {} as Partial<Record<CatAxisId, number>>);
      await saveCatLiteSnapshot(user.uid, axisScores);
      track("cat_lite_completed", {
        phase: 2,
        recalibration: axisScores.recalibration ?? null,
        flexibility: axisScores.flexibility ?? null,
        adaptiveConfidence: axisScores.adaptiveConfidence ?? null,
      });
      if (exploreSource === "explore") {
        setExploreCompletion("cat-lite");
      }
      const sorted = Object.entries(axisScores)
        .filter(([, value]) => typeof value === "number")
        .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0));
      const weakestAxis = (sorted[0]?.[0] as CatAxisId | undefined) ?? null;
      const vocabTag = weakestAxis ? AXIS_VOCAB_TAG_MAP[weakestAxis] : null;
      const vocabUrl = new URLSearchParams({
        source: "cat-lite",
        returnTo: returnToParam || "/today?source=cat-lite-2",
      });
      if (vocabTag) {
        vocabUrl.set("tag", vocabTag);
      }
      router.replace(`/intro/vocab?${vocabUrl.toString()}`);
    } catch (err) {
      console.error("saveCatLiteSnapshot part2 failed", err);
      setError("Nu am reușit să salvăm măsurarea. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || !user || gatingAllowed !== true) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-sm text-[var(--omni-ink-soft)]">
        Verificăm dacă poți completa restul profilului…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10">
      <section className="mx-auto w-full max-w-3xl space-y-6 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_8px_28px_rgba(0,0,0,0.15)]">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">CAT Lite</p>
          <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">Partea 2 · trăsături avansate</h1>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            Completăm restul celor 7 trăsături pentru harta mentală completă. Răspunde onest și rapid — durează cel mult 4 minute.
          </p>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            0 = deloc / aproape niciodată · 10 = aproape mereu
          </p>
        </header>

        <div className="rounded-[16px] border border-dashed border-[var(--omni-border-soft)] bg-white/70 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            {locale === "en"
              ? "These words help when you need to change direction."
              : "Astea sunt cuvintele care te ajută când trebuie să schimbi direcția."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRIMER_AXES.map((axisId) => {
              const vocab = getDefaultVocabForAxis(axisId);
              return <VocabChip key={vocab.id} vocabId={vocab.id} locale={locale} />;
            })}
          </div>
        </div>

        <div className="space-y-5">
          {QUESTIONS.map((question) => (
            <article
              key={question.id}
              className="space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4"
            >
              <p className="text-sm text-[var(--omni-ink)]">{question.label}</p>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={values[question.id]}
                onChange={(event) => handleChange(question.id, Number(event.target.value))}
                className="w-full accent-[var(--omni-energy)]"
                aria-label={question.label}
              />
              <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
                <span>0 · deloc</span>
                <span>10 · foarte des</span>
              </div>
            </article>
          ))}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <OmniCtaButton type="button" variant="primary" disabled={buttonDisabled} onClick={handleSubmit}>
            {saving ? "Se salvează…" : "Salvează și revino la program"}
          </OmniCtaButton>
        </div>
      </section>
    </main>
  );
}

export default function CatLitePart2Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-sm text-[var(--omni-muted)]">
          Pregătim evaluarea…
        </main>
      }
    >
      <CatLitePart2PageInner />
    </Suspense>
  );
}
