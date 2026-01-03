"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useI18n } from "@/components/I18nProvider";
import { getTodayKey } from "@/lib/dailyCompletion";
import { pickVocabPrimary, type MatchContext } from "@/lib/vocab/matching";
import { useVocab } from "@/components/vocab/useVocab";
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
import {
  MINDPACING_SIGNAL_VOCAB,
  getMindPacingSignalFromOption,
  isMindPacingSignalTag,
  type MindPacingSignalTag,
} from "@/lib/mindPacingSignals";
import type { StepComponentProps } from "@/components/stepRunner/types";
import type { IntroMindPacingResult } from "./IntroMindPacingStep";

const AXIS_TAG_MAP: Partial<Record<CatAxisId, CatVocabTag>> = {
  clarity: "clarity_low",
  focus: "focus_scattered",
  energy: "energy_low",
  emotionalStability: "tension_high",
  recalibration: "change_resistance",
  flexibility: "rigid",
  adaptiveConfidence: "stuck",
};

const VOCAB_COPY = {
  clarity_fog: {
    ro: {
      overline: "În ceață",
      subtitle: "CEAȚĂ MENTALĂ (BRAIN FOG)",
      paragraphs: [
        "Așa numim momentele în care gândirea devine încețoșată: îți e greu să te concentrezi, să iei decizii sau să procesezi clar informațiile, ca și cum mintea ar fi acoperită de ceață.",
        "Apare des când mintea e suprasolicitată sau obosită, nu pentru că e „ceva în neregulă” cu tine.",
        "Claritatea se poate recâștiga pas cu pas. În sesiunile următoare lucrăm exact pe asta.",
      ],
    },
    en: {
      overline: "Foggy",
      subtitle: "MENTAL FOG (BRAIN FOG)",
      paragraphs: [
        "This is what we call the moments when thinking becomes hazy: it’s harder to focus, decide, or process information clearly—as if the mind were covered in fog.",
        "It often shows up when the mind is overloaded or tired, not because there is “something wrong” with you.",
        "Clarity can be rebuilt step by step. That’s exactly what the next sessions drill on.",
      ],
    },
  },
  clarity_story_strip: {
    ro: {
      overline: "Scenarii peste scenarii",
      subtitle: "SCENARII ÎN BUCLE (OVERTHINKING)",
      paragraphs: [
        "Așa numim momentele în care mintea tot derulează scenarii: repeți conversații, îți imaginezi ce s-ar putea întâmpla și tot „reiei filmul de la capăt”.",
        "De obicei apare când miza ți se pare mare sau nu ai informații clare, iar creierul încearcă să „controleze” viitorul gândind la nesfârșit.",
        "Nu trebuie să oprești toate scenariile. În sesiunile următoare lucrăm să le ancorăm în pași concreți, nu în bucle infinite.",
      ],
    },
    en: {
      overline: "Scenario after scenario",
      subtitle: "SCENARIO LOOPS (OVERTHINKING)",
      paragraphs: [
        "This is what we call the moments when the mind keeps spinning stories: you replay conversations, imagine what could happen, and hit replay again and again.",
        "It usually shows up when the stakes feel high or information is unclear, so the brain tries to “control” the future by thinking endlessly.",
        "You don’t have to stop every scenario. Next sessions focus on anchoring them into concrete steps instead of infinite loops.",
      ],
    },
  },
  focus_scattered: {
    ro: {
      overline: "Încep multe",
      subtitle: "INIȚIERE FĂRĂ ÎNCHIDERE (TASK-SWITCHING)",
      paragraphs: [
        "Așa numim momentele în care sari de la un lucru la altul: începi mai multe sarcini, dar rareori le duci la capăt înainte să apară altceva care îți ia atenția.",
        "Asta fragmentează energia și îți dă senzația că muncești mult, dar nu termini nimic important.",
        "În sesiunile următoare lucrăm pe a închide măcar un mic „ciclu” o dată, ca să recapeți sentimentul de finalizare.",
      ],
    },
    en: {
      overline: "Starting many things",
      subtitle: "INITIATION WITHOUT CLOSURE (TASK SWITCHING)",
      paragraphs: [
        "This is what we call the moments when you jump from one thing to another: you start several tasks but rarely close them before something else steals your focus.",
        "It fragments energy and makes you feel like you work a lot while nothing important gets finished.",
        "Next sessions help you close at least one small cycle at a time so you rebuild the feeling of completion.",
      ],
    },
  },
  emo_tense: {
    ro: {
      overline: "Corp încordat",
      subtitle: "TENSIUNE ÎN CORP (SOMATIC STRESS)",
      paragraphs: [
        "Așa numim momentele în care simți încordare în umeri, maxilar, piept sau stomac, chiar dacă nu e un pericol real în fața ta.",
        "E un semn că sistemul tău de alarmă a rămas activat mai mult decât e nevoie, din cauza grijilor, presiunii sau oboselii acumulate.",
        "Vom lucra cu micro-pauze și descărcări scurte, ca tensiunea să scadă treptat, nu doar să o ignori.",
      ],
    },
    en: {
      overline: "Body on edge",
      subtitle: "TENSION IN THE BODY (SOMATIC STRESS)",
      paragraphs: [
        "This is what we call the moments when tension shows up in shoulders, jaw, chest, or stomach even without an immediate threat in front of you.",
        "It’s a sign your alarm system stayed on longer than needed because of worries, pressure, or accumulated fatigue.",
        "We’ll work with micro breaks and small releases so the tension drops gradually instead of being ignored.",
      ],
    },
  },
} as const;

type IntroVocabDecision =
  | { status: "pending" }
  | { status: "card"; vocabId: string }
  | { status: "skipped"; reason: "limit" | "missing" };

export type IntroVocabContinuePayload = {
  activeSignal: MindPacingSignalTag | null;
  decision: IntroVocabDecision;
};

type IntroVocabExperienceProps = {
  forcedTag?: CatVocabTag | null;
  forcedAxis?: CatAxisId | null;
  manualActiveSignal?: MindPacingSignalTag | null;
  overrideMatchTags?: {
    primary?: CatVocabTag | null;
    secondary?: CatVocabTag[];
  };
  avoidDayKeys?: string[];
  onContinue: (payload: IntroVocabContinuePayload) => void;
};

export function IntroVocabExperience({
  forcedTag = null,
  forcedAxis = null,
  manualActiveSignal = null,
  overrideMatchTags,
  avoidDayKeys,
  onContinue,
}: IntroVocabExperienceProps) {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const dayKey = useMemo(() => getTodayKey(), []);
  const appliedVocabRef = useRef<string | null>(null);
  const storedEntry = useMemo(() => getMindPacingEntry(dayKey), [dayKey]);
  const defaultAvoidKeys = useMemo(() => {
    if (avoidDayKeys?.length) return avoidDayKeys;
    const prevKey = (() => {
      const date = new Date(dayKey);
      if (Number.isNaN(date.getTime())) return null;
      date.setDate(date.getDate() - 1);
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    })();
    return prevKey ? [dayKey, prevKey] : [dayKey];
  }, [avoidDayKeys, dayKey]);
  const activeSignal: MindPacingSignalTag | null = manualActiveSignal ?? (() => {
    if (!storedEntry) return null;
    if (isMindPacingSignalTag(storedEntry.mindTag)) return storedEntry.mindTag;
    return getMindPacingSignalFromOption(storedEntry.optionId);
  })();
  const matchTags: CatVocabTag[] = useMemo(() => {
    const tags: CatVocabTag[] = [];
    if (overrideMatchTags?.primary) {
      tags.push(overrideMatchTags.primary);
    }
    if (overrideMatchTags?.secondary?.length) {
      overrideMatchTags.secondary.forEach((tag) => {
        if (tag) tags.push(tag);
      });
    }
    if (!tags.length && storedEntry?.answerTagPrimary) {
      tags.push(storedEntry.answerTagPrimary as CatVocabTag);
    }
    if (forcedTag) {
      tags.push(forcedTag);
    }
    if (!tags.length && forcedAxis && AXIS_TAG_MAP[forcedAxis]) {
      tags.push(AXIS_TAG_MAP[forcedAxis]!);
    }
    return tags;
  }, [forcedAxis, forcedTag, overrideMatchTags, storedEntry]);

  const decision = useMemo<IntroVocabDecision>(() => {
    const shownToday = getVocabShownTodayCount(dayKey);
    if (shownToday >= 1) {
      return { status: "skipped", reason: "limit" };
    }
    if (activeSignal) {
      const forcedId = MINDPACING_SIGNAL_VOCAB[activeSignal];
      if (forcedId) {
        return { status: "card", vocabId: forcedId };
      }
    }
    if (!matchTags.length) {
      return { status: "skipped", reason: "missing" };
    }
    const recent = getRecentVocabIds();
    const ctx: MatchContext = {
      mindInfoAnswerTagPrimary: matchTags[0],
      mindInfoAnswerTagsSecondary: matchTags.slice(1),
      recentVocabIds: recent,
      shownTodayCount: shownToday,
      todayKey: dayKey,
      avoidDayKeys: defaultAvoidKeys,
      lastShownById: getLastShownDayById(),
    };
    const vocab = pickVocabPrimary(ctx, Object.values(CAT_VOCABULARY));
    if (!vocab) {
      return { status: "skipped", reason: "missing" };
    }
    return { status: "card", vocabId: vocab.id };
  }, [activeSignal, dayKey, defaultAvoidKeys, matchTags]);

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

  const vocabData = useVocab(decision.status === "card" ? decision.vocabId : null);
  const heroCopy =
    locale === "ro"
      ? {
          eyebrow: "MindPacing",
          title: "Hai să înțelegem starea asta",
          subtitle: "Un nume clar te ajută să o recunoști și să o gestionezi mai ușor.",
        }
      : {
          eyebrow: "MindPacing",
          title: "Let’s understand this state",
          subtitle: "Naming it clearly makes it easier to recognize and handle.",
        };
  type VocabCopyEntry = (typeof VOCAB_COPY)[keyof typeof VOCAB_COPY];
  const vocabCopyEntry: VocabCopyEntry | null =
    decision.status === "card"
      ? (VOCAB_COPY as Record<string, VocabCopyEntry>)[decision.vocabId] ?? null
      : null;
  const vocabCopy = vocabCopyEntry ? vocabCopyEntry[locale] : null;
  const fallbackParagraphs =
    locale === "ro"
      ? [vocabData.definition?.ro, vocabData.bridge, vocabData.promise].filter((text): text is string => Boolean(text))
      : [vocabData.definition?.en ?? vocabData.definition?.ro, vocabData.bridge, vocabData.promise].filter(
          (text): text is string => Boolean(text),
        );
  const bodyParagraphs = vocabCopy?.paragraphs ?? fallbackParagraphs;
  const overlineLabel = vocabCopy?.overline ?? (vocabData.stateLabel?.[locale] ?? vocabData.stateLabel?.ro ?? "");
  const subtitleLabel = vocabCopy?.subtitle ?? vocabData.scienceLabel ?? "";

  const handleContinue = useCallback(() => {
    onContinue({ activeSignal, decision });
  }, [activeSignal, decision, onContinue]);

  return (
    <main
      className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0"
      data-testid="vocab-root"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="space-y-3 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{heroCopy.eyebrow}</p>
          <h1 className="text-3xl font-semibold">{heroCopy.title}</h1>
          <p className="text-sm text-[var(--omni-muted)]">{heroCopy.subtitle}</p>
        </section>
        <div className="rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {decision.status === "card" ? (
            <>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">{overlineLabel}</p>
              {subtitleLabel ? (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)]/70">
                  {subtitleLabel}
                </p>
              ) : null}
              <div className="mt-5 space-y-3 text-sm text-[var(--omni-ink)]/85">
                {bodyParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-6 flex justify-center sm:justify-start">
                <OmniCtaButton className="justify-center" onClick={handleContinue} data-testid="vocab-continue">
                  {locale === "ro" ? "Continuă" : "Continue"}
                </OmniCtaButton>
              </div>
            </>
          ) : decision.status === "skipped" ? (
            <div className="space-y-4 text-center sm:text-left">
              <h2 className="text-2xl font-semibold">
                {locale === "ro" ? "Nimic de adăugat acum" : "Nothing to add right now"}
              </h2>
              <p className="text-sm text-[var(--omni-muted)]">
                {decision.reason === "limit"
                  ? locale === "ro"
                    ? "Ai primit deja un vocab astăzi. Continuăm traseul ghidat."
                    : "You already received a vocab today. Continuing the guided path."
                  : locale === "ro"
                    ? "Nu avem un vocab potrivit acum. Continuăm traseul ghidat."
                    : "No matching vocab right now. Continuing the guided path."}
              </p>
              <div className="flex justify-center sm:justify-start">
                <OmniCtaButton className="justify-center" onClick={handleContinue} data-testid="vocab-continue">
                  {locale === "ro" ? "Continuă" : "Continue"}
                </OmniCtaButton>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-[var(--omni-muted)]">
              {locale === "ro" ? "Pregătim vocab-ul…" : "Preparing vocab…"}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export function IntroVocabStep({ state, setState, go }: StepComponentProps) {
  const mindState = (state.introMindPacing ?? null) as IntroMindPacingResult | null;
  const handleContinue = useCallback(
    (payload: IntroVocabContinuePayload) => {
      setState((prev) => ({
        ...prev,
        introVocab: {
          activeSignal: payload.activeSignal,
          decision: payload.decision,
        },
      }));
      go("next");
    },
    [go, setState],
  );
  return (
    <IntroVocabExperience
      manualActiveSignal={mindState?.mindTag ?? null}
      overrideMatchTags={
        mindState
          ? {
              primary: (mindState.answerTagPrimary as CatVocabTag) ?? null,
              secondary: (mindState.answerTagsSecondary ?? []) as CatVocabTag[],
            }
          : undefined
      }
      onContinue={handleContinue}
    />
  );
}

export default IntroVocabStep;
