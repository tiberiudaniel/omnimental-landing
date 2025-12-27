"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import {
  getGuidedCompleted,
  getGuidedCompletionCount,
  incrementGuidedCompletionCount,
  setGuidedAnswer,
  setGuidedCompleted,
} from "@/lib/intro/guidedState";
import { track } from "@/lib/telemetry/track";
import { FREE_CONTINUE_URL, UPGRADE_URL } from "@/lib/constants/routes";

type QuestionOption = { id: string; label: string };
type QuestionStep = {
  id: string;
  title: string;
  options: QuestionOption[];
};

type Content = {
  questions: QuestionStep[];
  reflection: { lines: string[]; cta: string };
  transitionLine: string;
  offer: { title: string; body: string; ctaPrimary: string; ctaSecondary: string };
};

const CONTENT: Record<"ro" | "en", Content> = {
  ro: {
    questions: [
      {
        id: "mind_state",
        title: "În ultimele zile, mintea ta e mai mult:",
        options: [
          { id: "crowded", label: "Aglomerată" },
          { id: "tired", label: "Obosită" },
          { id: "scattered", label: "Împrăștiată" },
          { id: "blocked", label: "Blocată" },
          { id: "rushed", label: "Grăbită" },
          { id: "foggy", label: "În ceață" },
          { id: "tense", label: "Încordată" },
          { id: "no_mood", label: "Fără chef" },
        ],
      },
      {
        id: "block_time",
        title: "Asta apare mai ales:",
        options: [
          { id: "morning", label: "Dimineața, înainte de lucru" },
          { id: "after_email", label: "După primele emailuri" },
          { id: "after_meetings", label: "După meeting-uri lungi" },
          { id: "post_lunch", label: "După prânz" },
          { id: "evening", label: "Seara târziu" },
          { id: "deadline", label: "Când apare un deadline" },
          { id: "traffic", label: "În trafic / drumuri" },
          { id: "social_media", label: "După ce intru pe social" },
          { id: "after_two_hours", label: "După ~2h de lucru intens" },
        ],
      },
      {
        id: "biggest_cost",
        title: "Cel mai mare cost acum este:",
        options: [
          { id: "decisions", label: "decizii" },
          { id: "energy", label: "energie" },
          { id: "emotions", label: "emoții" },
          { id: "procrastination", label: "procrastinare" },
          { id: "focus", label: "focus risipit" },
          { id: "confidence", label: "încredere scăzută" },
          { id: "sleep", label: "somn instabil" },
          { id: "motivation", label: "motivație fluctuantă" },
        ],
      },
    ],
    reflection: {
      lines: ["OK. Nu e un defect personal.", "E un tipar de supraîncărcare.", "Începem prin a stabiliza."],
      cta: "Începem",
    },
    transitionLine: "Observă cum se simte când iei 5 minute doar pentru calibrat atenția.",
    offer: {
      title: "Păstrezi asta zilnic?",
      body: "5 minute/zi. Traseu ghidat. Istoric & progres.",
      ctaPrimary: "Vezi planurile",
      ctaSecondary: "Continui gratuit azi",
    },
  },
  en: {
    questions: [
      {
        id: "mind_state",
        title: "Lately, your mind feels mostly:",
        options: [
          { id: "crowded", label: "Crowded" },
          { id: "tired", label: "Tired" },
          { id: "scattered", label: "Scattered" },
          { id: "blocked", label: "Blocked" },
          { id: "rushed", label: "Rushed" },
          { id: "foggy", label: "Foggy" },
          { id: "tense", label: "Tense" },
          { id: "no_mood", label: "No drive" },
        ],
      },
      {
        id: "block_time",
        title: "It shows up mostly when:",
        options: [
          { id: "morning", label: "Early morning" },
          { id: "after_email", label: "After clearing emails" },
          { id: "after_meetings", label: "After long meetings" },
          { id: "post_lunch", label: "Right after lunch" },
          { id: "evening", label: "Late evening" },
          { id: "deadline", label: "When deadlines pop up" },
          { id: "traffic", label: "While commuting" },
          { id: "social_media", label: "After scrolling socials" },
          { id: "after_two_hours", label: "After ~2h of deep work" },
        ],
      },
      {
        id: "biggest_cost",
        title: "Your biggest cost right now is:",
        options: [
          { id: "decisions", label: "decisions" },
          { id: "energy", label: "energy" },
          { id: "emotions", label: "emotions" },
          { id: "procrastination", label: "procrastination" },
          { id: "focus", label: "scattered focus" },
          { id: "confidence", label: "low confidence" },
          { id: "sleep", label: "unstable sleep" },
          { id: "motivation", label: "fluctuating motivation" },
        ],
      },
    ],
    reflection: {
      lines: ["Okay. This isn’t a personal flaw.", "It’s a pattern of overload.", "We stabilize first."],
      cta: "Let’s begin",
    },
    transitionLine: "Notice how it feels to spend 5 minutes just calibrating attention.",
    offer: {
      title: "Keep this daily?",
      body: "5 minutes/day. Guided path. History & progress.",
      ctaPrimary: "See plans",
      ctaSecondary: "Continue for free today",
    },
  },
};

const CLOUD_LAYOUT_IDS = ["mind_state", "block_time", "biggest_cost"];
const MULTI_SELECT_IDS = ["mind_state", "block_time", "biggest_cost"] as const;
type MultiSelectId = (typeof MULTI_SELECT_IDS)[number];
const MULTI_SELECT_SET = new Set<string>(MULTI_SELECT_IDS);

export default function GuidedDay1Flow() {
  const router = useRouter();
  const { lang } = useI18n();
  const locale: "ro" | "en" = lang === "en" ? "en" : "ro";
  const content = CONTENT[locale];
  const initialCompleted = useMemo(() => getGuidedCompleted(), []);
  const initialCompletionCount = useMemo(() => getGuidedCompletionCount(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const offerTrackedRef = useRef(false);
  const [selectionMap, setSelectionMap] = useState<{
    mind_state: string[];
    block_time: string[];
    biggest_cost: string[];
  }>({
    mind_state: [],
    block_time: [],
    biggest_cost: [],
  });
  const mindStateSelections = selectionMap.mind_state;
  const blockTimeSelections = selectionMap.block_time;
  const costSelections = selectionMap.biggest_cost;

  const reflectionIndex = content.questions.length;
  const offerIndex = reflectionIndex + 1;
  const showOfferForUser = initialCompletionCount >= 4;

  useEffect(() => {
    track("guided_opened");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!initialCompleted) {
      window.localStorage.setItem("guided_guest_mode", "1");
    }
  }, [initialCompleted]);

  useEffect(() => {
    if (showOfferForUser && stepIndex >= offerIndex && !offerTrackedRef.current) {
      offerTrackedRef.current = true;
      track("offer_shown", { flow: "guided" });
    }
  }, [offerIndex, showOfferForUser, stepIndex]);

  const goToNextStep = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, offerIndex));
  }, [offerIndex]);

  const handleQuestionSelect = (questionId: string, optionId: string) => {
    setGuidedAnswer(questionId, optionId);
    track("guided_step_completed", { step: questionId, value: optionId });
    goToNextStep();
  };

  const handleMultiToggle = (id: MultiSelectId, optionId: string) => {
    setSelectionMap((prev) => {
      const prevList = prev[id];
      let nextList: string[];
      if (prevList.includes(optionId)) {
        nextList = prevList.filter((value) => value !== optionId);
      } else if (prevList.length >= 2) {
        nextList = prevList;
      } else {
        nextList = [...prevList, optionId];
      }
      if (nextList === prevList) return prev;
      return { ...prev, [id]: nextList };
    });
  };

  const finalizeMultiSelection = useCallback(
    (questionId: "mind_state" | "block_time" | "biggest_cost", selections: string[]) => {
      const value = selections.join(",");
      setGuidedAnswer(questionId, value);
      track("guided_step_completed", { step: questionId, value });
      setSelectionMap((prev) => ({ ...prev, [questionId]: [] }));
      goToNextStep();
    },
    [goToNextStep],
  );

  const handleMultiContinue = (questionId: MultiSelectId) => {
    const selections = selectionMap[questionId];
    if (!selections.length) return;
    finalizeMultiSelection(questionId, selections);
  };

  const handleReflectionContinue = () => {
    track("guided_step_completed", { step: "reflection" });
    incrementGuidedCompletionCount();
    if (!initialCompleted) {
      setGuidedCompleted(true);
      track("guided_day1_completed");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("guided_guest_mode", "1");
      }
    }
    if (!showOfferForUser) {
      router.replace("/today?source=guided");
      return;
    }
    goToNextStep();
  };

  const handleOfferClick = (action: "plans" | "continue_free") => {
    track("offer_clicked", { flow: "guided", action });
  };

  const currentQuestion = content.questions[stepIndex];
  const isCurrentMultiSelect = currentQuestion ? MULTI_SELECT_SET.has(currentQuestion.id) : false;

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Guided Day-1</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {locale === "ro" ? "Încep ghidat" : "Start guided"}
          </h1>
          <p className="text-sm text-[var(--omni-ink)]/70 sm:text-base">
            {locale === "ro" ? "5–7 minute. Niciun progres salvat fără acord." : "5–7 minutes. Nothing saved without consent."}
          </p>
        </header>

        {stepIndex < reflectionIndex && currentQuestion ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
              {locale === "ro" ? "Micro-identificare" : "Micro-identification"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">
              {currentQuestion.title}
            </h2>
            <div
              className={
                CLOUD_LAYOUT_IDS.includes(currentQuestion.id)
                  ? "mt-6 flex flex-wrap justify-center gap-3"
                  : "mt-6 space-y-3"
              }
            >
              {currentQuestion.options.map((option, idx) => {
                const isCloud = CLOUD_LAYOUT_IDS.includes(currentQuestion.id);
                const isMultiSelect = isCurrentMultiSelect;
                const cloudSizes = ["px-6 py-2.5", "px-4 py-2", "px-5 py-3"];
                const cloudClass = cloudSizes[idx % cloudSizes.length];
                const selected =
                  currentQuestion.id === "mind_state"
                    ? mindStateSelections.includes(option.id)
                    : currentQuestion.id === "block_time"
                      ? blockTimeSelections.includes(option.id)
                      : currentQuestion.id === "biggest_cost"
                        ? costSelections.includes(option.id)
                        : false;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      isMultiSelect
                        ? handleMultiToggle(currentQuestion.id as MultiSelectId, option.id)
                        : handleQuestionSelect(currentQuestion.id, option.id)
                    }
                    className={
                      isCloud
                        ? `rounded-full border ${
                            selected
                              ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white"
                              : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] text-[var(--omni-ink)]"
                          } text-sm font-semibold capitalize transition hover:border-[var(--omni-ink)]/50 ${cloudClass}`
                        : "w-full rounded-[18px] border border-[var(--omni-border-soft)] px-4 py-3 text-left text-sm font-semibold text-[var(--omni-ink)] transition hover:border-[var(--omni-ink)]/50"
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {currentQuestion.id === "mind_state" ? (
              <p className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {locale === "ro" ? "Selectează până la două opțiuni." : "Select up to two options."}
              </p>
            ) : null}
            {currentQuestion.id === "block_time" ? (
              <p className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {locale === "ro" ? "Selectează până la două situații." : "Select up to two situations."}
              </p>
            ) : null}
            {currentQuestion.id === "biggest_cost" ? (
              <p className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {locale === "ro" ? "Selectează până la două costuri." : "Select up to two costs."}
              </p>
            ) : null}
            {isCurrentMultiSelect ? (
              <div className="mt-5 flex justify-center">
                <OmniCtaButton
                  variant="neutral"
                  disabled={!selectionMap[currentQuestion.id as MultiSelectId].length}
                  onClick={() => handleMultiContinue(currentQuestion.id as MultiSelectId)}
                  className="justify-center"
                >
                  {locale === "ro" ? "Continuă" : "Continue"}
                </OmniCtaButton>
              </div>
            ) : null}
          </section>
        ) : null}

        {stepIndex === reflectionIndex ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8">
            <div className="space-y-3 text-lg leading-relaxed text-[var(--omni-ink)] sm:text-xl">
              {content.reflection.lines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
            <OmniCtaButton className="mt-6 justify-center" onClick={handleReflectionContinue}>
              {content.reflection.cta}
            </OmniCtaButton>
          </section>
        ) : null}

        {showOfferForUser && stepIndex >= offerIndex ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] sm:px-8">
            <p className="text-sm text-[var(--omni-ink)]/70">{content.transitionLine}</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">
              {content.offer.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{content.offer.body}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <OmniCtaButton
                as="link"
                href={UPGRADE_URL}
                onClick={() => handleOfferClick("plans")}
                className="justify-center sm:min-w-[220px]"
              >
                {content.offer.ctaPrimary}
              </OmniCtaButton>
              <OmniCtaButton
                as="link"
                variant="neutral"
                href={FREE_CONTINUE_URL}
                onClick={() => handleOfferClick("continue_free")}
                className="justify-center sm:min-w-[220px]"
              >
                {content.offer.ctaSecondary}
              </OmniCtaButton>
            </div>
          </section>
        ) : null}

      </div>
    </div>
  );
}
