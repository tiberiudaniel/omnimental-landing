"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IntroSlide } from "./IntroSlide";
import { IntroCTA } from "./IntroCTA";
import { useI18n } from "@/components/I18nProvider";
import { track } from "@/lib/telemetry/track";
import {
  getIntroSeen,
  setIntroSeen,
  getLastIntroChoice,
  setLastIntroChoice,
  setIntroHeuristics,
  getIntroHeuristics,
} from "@/lib/intro/introState";

type IntroLang = "ro" | "en";

type SlideContent = {
  title?: string;
  lines: string[];
  variant?: "normal" | "split";
};

type ChoiceContent = {
  body: string;
  label: string;
  subLabel: string;
  href: string;
  event: "intro_choice_explore" | "intro_choice_guided";
  variant: "primary" | "secondary";
};

type LocaleContent = {
  slides: SlideContent[];
  choices: ChoiceContent[];
  skipLabel: string;
  indicatorLabel: (current: number, total: number) => string;
};

const SLIDE_DURATIONS = [6000, 10000, 12000, 12000] as const;

const CONTENT: Record<IntroLang, LocaleContent> = {
  ro: {
    slides: [
      { lines: ["Nu ești leneș.", "Nu ești slab.", "Nu ești defect."] },
      {
        lines: [
          "Mintea ta rulează prea multe lucruri simultan.",
          "Deciziile mici îți consumă energia.",
          "Claritatea fluctuează.",
        ],
      },
      {
        lines: ["Problema nu este motivația.", "Este supraîncărcarea trăsăturilor cognitive."],
      },
      {
        lines: [
          "OmniMental este un sistem de reglaj cognitiv.",
          "Nu obiective.",
          "Nu obiceiuri.",
          "Capacitate de funcționare stabilă.",
        ],
      },
      { title: "Alege cum intri", lines: [], variant: "split" },
    ],
    choices: [
      {
        body: "Dacă vrei să înțelegi rapid sistemul și să testezi:",
        label: "Explorează sistemul",
        subLabel: "15–30 min. Fără presiune.",
        href: "/intro/explore",
        event: "intro_choice_explore",
        variant: "primary",
      },
      {
        body: "Dacă vrei să începi simplu, ghidat:",
        label: "Încep ghidat",
        subLabel: "5–7 min. Stabilizare.",
        href: "/intro/guided",
        event: "intro_choice_guided",
        variant: "secondary",
      },
    ],
    skipLabel: "Sari peste",
    indicatorLabel: (current, total) => `Slide ${current}/${total}`,
  },
  en: {
    slides: [
      { lines: ["You’re not lazy.", "You’re not weak.", "You’re not broken."] },
      {
        lines: [
          "Your mind is running too many things at once.",
          "Small decisions drain your energy.",
          "Clarity becomes unstable.",
        ],
      },
      {
        lines: ["The problem isn’t motivation.", "It’s cognitive overload."],
      },
      {
        lines: [
          "OmniMental is a cognitive regulation system.",
          "Not goals.",
          "Not habits.",
          "Stable capacity.",
        ],
      },
      { title: "Choose your entry", lines: [], variant: "split" },
    ],
    choices: [
      {
        body: "If you want to understand the system fast and test it:",
        label: "Explore the system",
        subLabel: "15–30 min. No pressure.",
        href: "/intro/explore",
        event: "intro_choice_explore",
        variant: "primary",
      },
      {
        body: "If you want a simple guided start:",
        label: "Start guided",
        subLabel: "5–7 min. Stabilization.",
        href: "/intro/guided",
        event: "intro_choice_guided",
        variant: "secondary",
      },
    ],
    skipLabel: "Skip",
    indicatorLabel: (current, total) => `Slide ${current}/${total}`,
  },
};

function detectLang(pref?: string | null): IntroLang {
  if (!pref) return "ro";
  return pref.toLowerCase().startsWith("en") ? "en" : "ro";
}

export default function CinematicPlayer() {
  const { lang } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const activeLang = useMemo<IntroLang>(() => {
    if (lang === "en" || lang === "ro") return lang;
    if (typeof document !== "undefined") {
      return detectLang(document.documentElement.lang);
    }
    if (typeof navigator !== "undefined") {
      return detectLang(navigator.language);
    }
    return "ro";
  }, [lang]);
  const initialSeen = typeof window !== "undefined" ? getIntroSeen() : false;
  const initialLastChoice = typeof window !== "undefined" ? getLastIntroChoice() : null;
  const initialHeuristics = typeof window !== "undefined" ? getIntroHeuristics() : null;
  const [slideIndex, setSlideIndex] = useState(initialSeen ? 4 : 0);
  const [skipPressed, setSkipPressed] = useState(initialHeuristics?.skipPressed ?? false);
  const [rapidClicksCount, setRapidClicksCount] = useState(initialHeuristics?.rapidClicks ?? 0);
  const [avgDwellMs, setAvgDwellMs] = useState(initialHeuristics?.avgDwellMs ?? 0);
  const [dwellSamples, setDwellSamples] = useState(initialHeuristics?.avgDwellMs ? 1 : 0);
  const [lastChoiceState, setLastChoiceState] = useState<"explore" | "guided" | null>(
    initialLastChoice,
  );
  const completedTrackedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const dwellRef = useRef<{ initialized: boolean; lastTimestamp: number }>({
    initialized: false,
    lastTimestamp: 0,
  });
  const dwellStatsRef = useRef<{ sum: number; count: number }>({ sum: 0, count: 0 });
  const seenRecordedRef = useRef(initialSeen);
  const heuristicsLoggedRef = useRef(false);
  const localeContent = useMemo(() => CONTENT[activeLang], [activeLang]);
  const totalSlides = localeContent.slides.length;
  const isFinalSlide = slideIndex === totalSlides - 1;

  useEffect(() => {
    if (motionReady) return;
    const id = window.setTimeout(() => setMotionReady(true), 0);
    return () => window.clearTimeout(id);
  }, [motionReady]);

  useEffect(() => {
    const now = Date.now();
    if (!dwellRef.current.initialized) {
      dwellRef.current.initialized = true;
      dwellRef.current.lastTimestamp = now;
      return;
    }
    const delta = now - dwellRef.current.lastTimestamp;
    dwellRef.current.lastTimestamp = now;
    if (delta > 0 && slideIndex > 0) {
      dwellStatsRef.current.sum += delta;
      dwellStatsRef.current.count += 1;
      setAvgDwellMs(dwellStatsRef.current.sum / dwellStatsRef.current.count);
      setDwellSamples(dwellStatsRef.current.count);
    }
  }, [slideIndex]);

  useEffect(() => {
    track("intro_started");
  }, []);

  useEffect(() => {
    if (isFinalSlide && !completedTrackedRef.current) {
      track("intro_completed");
      completedTrackedRef.current = true;
    }
  }, [isFinalSlide]);

  useEffect(() => {
    if (!isFinalSlide) return;
    if (!seenRecordedRef.current) {
      setIntroSeen(true);
      seenRecordedRef.current = true;
    }
    if (!heuristicsLoggedRef.current) {
      setIntroHeuristics({
        avgDwellMs,
        skipPressed,
        rapidClicks: rapidClicksCount,
      });
      heuristicsLoggedRef.current = true;
    }
  }, [avgDwellMs, isFinalSlide, rapidClicksCount, skipPressed]);

  const hasDwellData = dwellSamples > 0;
  const isHighLoadExplorer =
    skipPressed || rapidClicksCount >= 3 || (hasDwellData && avgDwellMs < 2200);
  const isDepletedContemplative =
    !skipPressed && hasDwellData && avgDwellMs >= 3500;
  const suggestedChoice =
    lastChoiceState ?? (isHighLoadExplorer ? "explore" : isDepletedContemplative ? "guided" : null);

  const clearActiveTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearActiveTimer();
    if (isFinalSlide) return;
    const duration = SLIDE_DURATIONS[slideIndex] ?? 6000;
    timerRef.current = window.setTimeout(() => {
      setSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
    }, duration);
    return () => {
      clearActiveTimer();
    };
  }, [slideIndex, isFinalSlide, totalSlides, clearActiveTimer]);

  useEffect(() => {
    if (!isFinalSlide) return;
    const target = suggestedChoice ?? "explore";
    const el = document.getElementById(
      target === "explore" ? "intro-choice-explore" : "intro-choice-guided",
    );
    if (el instanceof HTMLElement) {
      el.focus();
    }
  }, [isFinalSlide, suggestedChoice]);

  const handleSkip = useCallback(() => {
    track("intro_skipped", { fromSlide: slideIndex + 1 });
    setSkipPressed(true);
    setRapidClicksCount((prev) => prev + 1);
    clearActiveTimer();
    setSlideIndex(totalSlides - 1);
  }, [clearActiveTimer, slideIndex, totalSlides]);

  const handleChoice = useCallback(
    (choice: ChoiceContent, choiceId: "explore" | "guided") => {
      setLastIntroChoice(choiceId);
      setLastChoiceState(choiceId);
      track(choice.event);
    },
    [],
  );

  const currentSlide = localeContent.slides[slideIndex];
  const highlightExplore = suggestedChoice === "explore";
  const highlightGuided = suggestedChoice === "guided";

  return (
    <div className="relative min-h-screen w-full bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6">
      {!isFinalSlide ? (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute right-4 top-6 rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)] hover:bg-[var(--omni-bg-paper)] sm:right-10 sm:top-8"
        >
          {localeContent.skipLabel}
        </button>
      ) : null}
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          <span>{localeContent.indicatorLabel(slideIndex + 1, totalSlides)}</span>
          <div className="flex items-center gap-1">
            {localeContent.slides.map((_, idx) => (
              <span
                key={idx}
                className={[
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  idx <= slideIndex ? "bg-[var(--omni-ink)]" : "bg-[var(--omni-border-soft)]",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeLang}-${slideIndex}`}
            initial={
              motionReady
                ? { opacity: 0, y: shouldReduceMotion ? 0 : 6 }
                : { opacity: 1, y: 0 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              motionReady
                ? { opacity: 0, y: shouldReduceMotion ? 0 : -6 }
                : { opacity: 0, y: 0 }
            }
            transition={
              motionReady && !shouldReduceMotion
                ? { duration: 0.3, ease: "easeOut" }
                : { duration: 0 }
            }
          >
            <IntroSlide title={currentSlide.title} lines={currentSlide.lines} variant={currentSlide.variant}>
              {isFinalSlide ? (
                <div className="space-y-6">
                  {localeContent.choices.map((choice, idx) => {
                    const choiceId = choice.event === "intro_choice_explore" ? "explore" : "guided";
                    const selected = choiceId === "explore" ? highlightExplore : highlightGuided;
                    return (
                      <div
                        key={choice.event}
                        className={`space-y-3 ${idx === 1 ? "border-t border-[var(--omni-border-soft)] pt-6" : ""}`}
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)] sm:text-xs">
                          {choice.body}
                        </p>
                        <IntroCTA
                          id={choiceId === "explore" ? "intro-choice-explore" : "intro-choice-guided"}
                          label={choice.label}
                          subLabel={choice.subLabel}
                          href={choice.href}
                          variant={choice.variant === "primary" ? "primary" : "secondary"}
                          onClick={() => handleChoice(choice, choiceId)}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </IntroSlide>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
