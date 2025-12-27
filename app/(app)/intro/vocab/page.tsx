"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VocabCard from "@/components/vocab/VocabCard";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useI18n } from "@/components/I18nProvider";
import { getTodayKey } from "@/lib/dailyCompletion";
import { pickVocabPrimary, type MatchContext } from "@/lib/vocab/matching";
import {
  getRecentVocabIds,
  pushRecentVocabId,
  getVocabShownTodayCount,
  incrementVocabShownTodayCount,
  setShownVocabIdForToday,
  setLastShownDayForVocab,
  getLastShownDayById,
  unlockVocab,
} from "@/lib/vocabProgress";
import { CAT_VOCABULARY, type CatVocabTag } from "@/config/catVocabulary";
import { getMindPacingEntry, setMindPacingVocab } from "@/lib/mindPacingStore";
import type { CatAxisId } from "@/lib/profileEngine";

const AXIS_TAG_MAP: Partial<Record<CatAxisId, CatVocabTag>> = {
  clarity: "clarity_low",
  focus: "focus_scattered",
  energy: "energy_low",
  emotionalStability: "tension_high",
  recalibration: "change_resistance",
  flexibility: "rigid",
  adaptiveConfidence: "stuck",
};

function IntroVocabPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const dayKey = useMemo(() => getTodayKey(), []);
  const appliedVocabRef = useRef<string | null>(null);

  const returnTo = searchParams.get("returnTo") ?? "/intro/guided";
  const source = searchParams.get("source") ?? "mindpacing";
  const forcedTag = (searchParams.get("tag") as CatVocabTag | null) ?? null;
  const forcedAxis = (searchParams.get("axis") as CatAxisId | null) ?? null;

  const decision = useMemo(() => {
    const shownToday = getVocabShownTodayCount(dayKey);
    if (shownToday >= 1) {
      return { status: "skipped", reason: "limit" } as const;
    }
    const entry = getMindPacingEntry(dayKey);
    const recent = getRecentVocabIds();
    const avoidDayKeysParam = searchParams.get("avoid");
    const avoidDayKeys = avoidDayKeysParam?.length ? avoidDayKeysParam.split(",") : [dayKey];
    const matchTags: CatVocabTag[] = [];
    if (entry?.answerTagPrimary) {
      matchTags.push(entry.answerTagPrimary as CatVocabTag);
    }
    if (forcedTag) {
      matchTags.push(forcedTag);
    }
    if (!matchTags.length && forcedAxis && AXIS_TAG_MAP[forcedAxis]) {
      matchTags.push(AXIS_TAG_MAP[forcedAxis]!);
    }
    if (!matchTags.length) {
      return { status: "skipped", reason: "missing" } as const;
    }
    const ctx: MatchContext = {
      mindInfoAnswerTagPrimary: matchTags[0],
      mindInfoAnswerTagsSecondary: matchTags.slice(1),
      recentVocabIds: recent,
      shownTodayCount: shownToday,
      todayKey: dayKey,
      avoidDayKeys,
      lastShownById: getLastShownDayById(),
    };
    const vocab = pickVocabPrimary(ctx, Object.values(CAT_VOCABULARY));
    if (!vocab) {
      return { status: "skipped", reason: "missing" } as const;
    }
    return { status: "card" as const, vocabId: vocab.id, ctx };
  }, [dayKey, forcedAxis, forcedTag, searchParams]);

  useEffect(() => {
    if (decision.status !== "card") {
      appliedVocabRef.current = null;
      return;
    }
    if (appliedVocabRef.current === decision.vocabId) return;
    unlockVocab(decision.vocabId);
    pushRecentVocabId(decision.vocabId);
    incrementVocabShownTodayCount(dayKey);
    setLastShownDayForVocab(decision.vocabId, dayKey);
    setShownVocabIdForToday(dayKey, decision.vocabId);
    setMindPacingVocab(dayKey, decision.vocabId);
    appliedVocabRef.current = decision.vocabId;
  }, [dayKey, decision]);

  const cardCopy = useMemo(() => {
    if (locale === "ro") {
      return {
        headline: "Un cuvânt util pentru momente ca acesta:",
        skipMessage:
          decision.status === "skipped" && decision.reason === "limit"
            ? "Ai primit deja un vocab astăzi. Continuăm traseul ghidat."
            : "Nu avem un vocab potrivit acum. Continuăm traseul ghidat.",
        continue: "Continuă",
      };
    }
    return {
      headline: "A useful word for moments like this:",
      skipMessage:
        decision.status === "skipped" && decision.reason === "limit"
          ? "You already received a vocab today. Continuing the guided path."
          : "No matching vocab right now. Continuing the guided path.",
      continue: "Continue",
    };
  }, [decision, locale]);

  const handleContinue = () => {
    router.replace(returnTo);
  };

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Vocab reflex · {source}</p>
        {decision.status === "card" ? (
          <>
            <h1 className="mt-2 text-lg font-semibold text-[var(--omni-muted)]">{cardCopy.headline}</h1>
            <div className="mt-4">
              <VocabCard vocabId={decision.vocabId} locale={locale} size="full" variant="public" showFitCheck />
            </div>
            <div className="mt-6 flex justify-center">
              <OmniCtaButton className="justify-center" onClick={handleContinue}>
                {cardCopy.continue}
              </OmniCtaButton>
            </div>
          </>
        ) : decision.status === "skipped" ? (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Nimic de adăugat acum</h1>
            <p className="text-sm text-[var(--omni-muted)]">{cardCopy.skipMessage}</p>
            <div className="flex justify-center">
              <OmniCtaButton className="justify-center" onClick={handleContinue}>
                {cardCopy.continue}
              </OmniCtaButton>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-[var(--omni-muted)]">Pregătim vocab-ul…</div>
        )}
      </div>
    </main>
  );
}

export default function IntroVocabPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-sm text-[var(--omni-muted)]">
          Pregătim vocab-ul…
        </main>
      }
    >
      <IntroVocabPageInner />
    </Suspense>
  );
}
