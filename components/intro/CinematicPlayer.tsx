"use client";

import {
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IntroSlide } from "./IntroSlide";
import { IntroCTA } from "./IntroCTA";
import { useIntroAudioAssets } from "./useIntroAudioAssets";
import type { CinematicCue } from "./cues.ro";
import { RO_CUES_V1 } from "./cues.ro";
import { useI18n } from "@/components/I18nProvider";
import { track } from "@/lib/telemetry/track";
import {
  getIntroSeen,
  setIntroSeen,
  setIntroVariant,
  getLastIntroChoice,
  setLastIntroChoice,
  setIntroHeuristics,
  getIntroHeuristics,
} from "@/lib/intro/introState";
import type { IntroChoice, HeuristicSnapshot } from "@/lib/intro/introState";

type IntroLang = "ro" | "en";

type SlideContent = {
  title?: string;
  lines: string[];
  variant?: "normal" | "split";
  kind?: "default" | "timeline";
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
  slideDurations?: number[];
};

type TimelineStage = "pre" | "chaos" | "pause" | "pivot" | "calm";
type InitialClientState = {
  seen: boolean;
  heuristics: HeuristicSnapshot | null;
  lastChoice: IntroChoice | null;
};
interface CinematicPlayerProps {
  allowSkip?: boolean;
  onComplete?: () => void;
}

const DEFAULT_SLIDE_DURATIONS = [6000, 10000, 12000, 12000] as const;
const DEFAULT_TYPEWRITER_CHAR_MS = 45;
const TIMELINE_BASE_Y_OFFSET = 50;
const INTRO_VARIANT = "cinematic-v1";
function readInitialClientState(): InitialClientState | null {
  if (typeof window === "undefined") return null;
  return {
    seen: getIntroSeen(),
    heuristics: getIntroHeuristics(),
    lastChoice: getLastIntroChoice(),
  };
}
const NOISE_TEXTURE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZsb2c9Im5vbmUiIG9wYWNpdHk9IjAuMDQiLz4KICA8cGF0aCBkPSJNMCAwTDAuNSAwLjVMMSAwTDEuNSAwaDAuNUwxLjUgMC41TDIgMUwxLjUgMS41TDEgMUwwLjUgMS41TDAgMS4wNVYwWiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAzIi8+Cjwvc3ZnPg==";
const STAGE_VISUALS: Record<
  TimelineStage,
  { baseGradient: string; glowOpacity: number; glowScale: number; noiseOpacity: number }
> = {
  pre: {
    baseGradient:
      "linear-gradient(140deg, #0f1116 20%, #14171d 50%, #181b22 80%), radial-gradient(circle at 40% 0%, rgba(255,231,199,0.22), transparent 55%)",
    glowOpacity: 0.25,
    glowScale: 1.02,
    noiseOpacity: 0.25,
  },
  chaos: {
    baseGradient:
      "linear-gradient(140deg, #14121d 20%, #1c1622 48%, #221a27 80%), radial-gradient(circle at 60% 10%, rgba(255,181,151,0.25), transparent 60%)",
    glowOpacity: 0.45,
    glowScale: 1.08,
    noiseOpacity: 0.4,
  },
  pause: {
    baseGradient:
      "linear-gradient(140deg, #0f0f15 20%, #1a161d 50%, #1f1721 80%), radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 65%)",
    glowOpacity: 0.1,
    glowScale: 1.04,
    noiseOpacity: 0.15,
  },
  pivot: {
    baseGradient:
      "linear-gradient(140deg, #1b1521 15%, #221823 50%, #2a1c28 80%), radial-gradient(circle at 50% 25%, rgba(255,210,176,0.38), transparent 55%)",
    glowOpacity: 0.55,
    glowScale: 1.12,
    noiseOpacity: 0.32,
  },
  calm: {
    baseGradient:
      "linear-gradient(140deg, #19171e 20%, #231b24 45%, #2f2128 80%), radial-gradient(circle at 50% 30%, rgba(255,226,194,0.45), transparent 60%)",
    glowOpacity: 0.5,
    glowScale: 1.18,
    noiseOpacity: 0.25,
  },
};

const CONTENT: Record<IntroLang, LocaleContent> = {
  ro: {
    slides: [
      { lines: [], kind: "timeline" },
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
    slideDurations: [RO_CUES_V1[RO_CUES_V1.length - 1].endMs],
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

export default function CinematicPlayer({ allowSkip = true, onComplete }: CinematicPlayerProps = {}) {
  const { lang } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(prefersReducedMotion);
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
  const localeContent = useMemo(() => CONTENT[activeLang], [activeLang]);
  const timelineCues = useMemo<CinematicCue[]>(
    () => (activeLang === "ro" ? RO_CUES_V1 : []),
    [activeLang],
  );
  const timelineTotalMs = timelineCues.length ? timelineCues[timelineCues.length - 1].endMs : 0;
  const totalSlides = localeContent.slides.length;
  const [initialState] = useState<InitialClientState | null>(() => readInitialClientState());
  const initialHeuristics = initialState?.heuristics;
  const [slideIndex, setSlideIndex] = useState(() =>
    initialState?.seen ? Math.max(totalSlides - 1, 0) : 0,
  );
  const initialTimelineValue = initialState?.seen ? timelineTotalMs : 0;
  const [timelineElapsed, setTimelineElapsedState] = useState(initialTimelineValue);
  const timelineElapsedRef = useRef(initialTimelineValue);
  const timelineRafRef = useRef<number | null>(null);
  const prevTimelineRef = useRef(false);
  const [skipPressed, setSkipPressed] = useState(initialHeuristics?.skipPressed ?? false);
  const [rapidClicksCount, setRapidClicksCount] = useState(initialHeuristics?.rapidClicks ?? 0);
  const [avgDwellMs, setAvgDwellMs] = useState(initialHeuristics?.avgDwellMs ?? 0);
  const [dwellSamples, setDwellSamples] = useState(initialHeuristics?.avgDwellMs ? 1 : 0);
  const [lastChoiceState, setLastChoiceState] = useState<"explore" | "guided" | null>(
    initialState?.lastChoice ?? null,
  );
  const completedTrackedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const timelineStartRef = useRef<number | null>(null);
  const dwellRef = useRef<{ initialized: boolean; lastTimestamp: number }>({
    initialized: false,
    lastTimestamp: 0,
  });
  const dwellStatsRef = useRef<{ sum: number; count: number }>({ sum: 0, count: 0 });
  const heuristicsLoggedRef = useRef(false);
  const seenRecordedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const slideDurations = localeContent.slideDurations ?? DEFAULT_SLIDE_DURATIONS;
  const isFinalSlide = slideIndex === totalSlides - 1;
  const currentSlide = localeContent.slides[slideIndex];
  const isTimelineSlide = activeLang === "ro" && currentSlide?.kind === "timeline";

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
      onCompleteRef.current?.();
    }
  }, [isFinalSlide]);

  useEffect(() => {
    if (!isFinalSlide) return;
    if (!seenRecordedRef.current) {
      setIntroSeen(true);
      setIntroVariant(INTRO_VARIANT);
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
    if (isTimelineSlide) return;
    const duration = slideDurations[slideIndex] ?? 6000;
    timerRef.current = window.setTimeout(() => {
      setSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
    }, duration);
    return () => {
      clearActiveTimer();
    };
  }, [slideIndex, isFinalSlide, totalSlides, clearActiveTimer, isTimelineSlide, slideDurations]);

  const setTimelineProgress = useCallback(
    (value: number) => {
      const maxMs = timelineTotalMs || 0;
      const clamped = Math.max(0, Math.min(value, maxMs));
      timelineElapsedRef.current = clamped;
      setTimelineElapsedState(clamped);
    },
    [timelineTotalMs],
  );

  useEffect(() => {
    if (!isTimelineSlide) {
      if (prevTimelineRef.current) {
        prevTimelineRef.current = false;
      }
      if (timelineRafRef.current) {
        window.cancelAnimationFrame(timelineRafRef.current);
        timelineRafRef.current = null;
      }
      return;
    }
    if (!prevTimelineRef.current) {
      timelineElapsedRef.current = 0;
      prevTimelineRef.current = true;
    }
    timelineStartRef.current = performance.now() - timelineElapsedRef.current;
    const step = (now: number) => {
      if (timelineStartRef.current == null) return;
      const elapsed = now - timelineStartRef.current;
      if (elapsed >= timelineTotalMs) {
        setTimelineProgress(timelineTotalMs);
        setSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
        timelineRafRef.current = null;
        return;
      }
      setTimelineProgress(elapsed);
      timelineRafRef.current = window.requestAnimationFrame(step);
    };
    timelineRafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (timelineRafRef.current) {
        window.cancelAnimationFrame(timelineRafRef.current);
        timelineRafRef.current = null;
      }
    };
  }, [isTimelineSlide, totalSlides, setTimelineProgress, timelineTotalMs]);

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
    setTimelineProgress(timelineTotalMs);
    setSlideIndex(totalSlides - 1);
  }, [clearActiveTimer, setTimelineProgress, slideIndex, timelineTotalMs, totalSlides]);

  useEffect(() => {
    if (isFinalSlide || !allowSkip) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [allowSkip, handleSkip, isFinalSlide]);

  const handleChoice = useCallback(
    (choice: ChoiceContent, choiceId: "explore" | "guided") => {
      setLastIntroChoice(choiceId);
      setLastChoiceState(choiceId);
      track(choice.event);
    },
    [],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!allowSkip || isFinalSlide) return;
      const target = event.target as HTMLElement;
      if (target?.closest("[data-skip-exempt='true']")) return;
      handleSkip();
    },
    [allowSkip, handleSkip, isFinalSlide],
  );

  const highlightExplore = suggestedChoice === "explore";
  const highlightGuided = suggestedChoice === "guided";
  const showProgressMeta = !(isTimelineSlide && !isFinalSlide);
  const shouldPlayAudio = timelineCues.length > 0 && isTimelineSlide && !isFinalSlide;
  useEffect(() => {
    console.log("[intro-audio] shouldPlayAudio:", shouldPlayAudio);
  }, [shouldPlayAudio]);
  useIntroAudioAssets(shouldPlayAudio, timelineElapsed);

  return (
    <div
      className="relative min-h-screen w-full bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {!isFinalSlide && allowSkip ? (
        <button
          type="button"
          onClick={handleSkip}
          data-skip-exempt="true"
          className="absolute right-4 top-6 rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)] hover:bg-[var(--omni-bg-paper)] sm:right-10 sm:top-8"
        >
          {localeContent.skipLabel}
        </button>
      ) : null}
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
        {showProgressMeta ? (
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
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div
            key={
              isTimelineSlide && !isFinalSlide
                ? `${activeLang}-timeline`
                : `${activeLang}-${slideIndex}`
            }
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
            {isTimelineSlide && !isFinalSlide ? (
              <TimelineScene
                elapsedMs={timelineElapsed}
                shouldReduceMotion={shouldReduceMotion}
                cues={timelineCues}
              />
            ) : (
              <IntroSlide title={currentSlide.title} lines={currentSlide.lines} variant={currentSlide.variant}>
                {isFinalSlide ? (
                  <div className="space-y-6" data-skip-exempt="true">
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
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TimelineScene({
  elapsedMs,
  shouldReduceMotion,
  cues,
}: {
  elapsedMs: number;
  shouldReduceMotion: boolean;
  cues: CinematicCue[];
}) {
  const stage = useMemo(() => getTimelineStage(elapsedMs), [elapsedMs]);
  const stageVisual = STAGE_VISUALS[stage];
  const shift = shouldReduceMotion ? 0 : Math.sin(elapsedMs / 2000) * 4;
  const scale = shouldReduceMotion ? 1 : 1 + Math.sin(elapsedMs / 2600) * 0.02;
  const shimmerShift = shouldReduceMotion ? 0 : Math.cos(elapsedMs / 3000) * 6;
  const noiseOffset = shouldReduceMotion ? 0 : elapsedMs * 0.04;
  return (
    <div className="relative min-h-[420px] w-full overflow-hidden rounded-[32px] border border-[var(--omni-border-soft)]/40 bg-[var(--omni-bg-paper)] px-4 py-10 text-[var(--omni-ink)] shadow-[0_35px_120px_rgba(196,170,140,0.35)] sm:min-h-[460px] sm:px-10 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          background: stageVisual.baseGradient,
          transform: `translateY(${shift}px) scale(${scale})`,
          transition: "transform 0.6s ease-out",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: stageVisual.noiseOpacity,
          backgroundImage:
            "linear-gradient(120deg, rgba(255,255,255,0.08) 0%, transparent 55%), linear-gradient(300deg, rgba(255,190,150,0.04) 0%, transparent 60%)",
          transform: `translateY(${shimmerShift}px)`,
          mixBlendMode: "multiply",
          transition: "opacity 0.4s ease-out, transform 0.6s ease-out",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `url(${NOISE_TEXTURE})`,
          backgroundSize: "96px 96px",
          backgroundPosition: `0 ${noiseOffset}px`,
          mixBlendMode: "soft-light",
        }}
      />
      <div
        className="pointer-events-none absolute inset-6 rounded-[28px]"
        style={{
          opacity: stageVisual.glowOpacity,
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.45), transparent 65%)",
          transform: `scale(${stageVisual.glowScale})`,
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      />
      <TimelineSymbol stage={stage} elapsedMs={elapsedMs} shouldReduceMotion={shouldReduceMotion} />
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="relative flex h-full w-full items-center justify-center">
          {cues.map((cue) => (
            <TimelineCueText
              key={cue.id}
              cue={cue}
              elapsedMs={elapsedMs}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineSymbol({
  stage,
  elapsedMs,
  shouldReduceMotion,
}: {
  stage: TimelineStage;
  elapsedMs: number;
  shouldReduceMotion: boolean;
}) {
  const targetHeight =
    stage === "calm" ? 200 : stage === "pivot" ? 160 : stage === "chaos" ? 120 : stage === "pause" ? 30 : 80;
  const jitter =
    shouldReduceMotion || stage === "calm"
      ? 0
      : stage === "chaos"
        ? Math.sin(elapsedMs / 90) * 40
        : Math.sin(elapsedMs / 420) * 12;
  const opacity =
    stage === "pause" ? 0.15 : stage === "chaos" ? 0.4 : stage === "pre" ? 0.35 : stage === "pivot" ? 0.65 : 0.85;
  const width = stage === "calm" ? 3 : 2;
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2"
      style={{ opacity }}
    >
      <div
        className="rounded-full bg-white/70"
        style={{
          width,
          height: Math.max(16, targetHeight + jitter),
          transition: "height 0.4s ease, width 0.4s ease",
          boxShadow: stage === "calm" ? "0 0 18px rgba(255,255,255,0.4)" : "0 0 8px rgba(255,255,255,0.2)",
        }}
      />
    </div>
  );
}

function TimelineCueText({
  cue,
  elapsedMs,
  shouldReduceMotion,
}: {
  cue: CinematicCue;
  elapsedMs: number;
  shouldReduceMotion: boolean;
}) {
  if (!cue.text || cue.anim === "none") {
    return null;
  }
  const fadeInWindow = 260;
  const fadeOutWindow = 320;
  const visibleStart = cue.startMs;
  const visibleEnd = cue.endMs + fadeOutWindow;
  if (elapsedMs < visibleStart || elapsedMs > visibleEnd) return null;

  const opacityBase = getCueOpacity(
    elapsedMs,
    cue.startMs,
    cue.endMs,
    fadeInWindow,
    fadeOutWindow,
  );
  const opacity = opacityBase * (cue.opacity ?? 1);
  if (opacity <= 0.01) return null;

  const duration = Math.max(cue.endMs - cue.startMs, 1);
  const progress = clamp((elapsedMs - cue.startMs) / duration, 0, 1);
  const baseOffset = computeCueBaseOffset(cue);
  const drift =
    cue.anim === "fade_drift" && !shouldReduceMotion
      ? getThoughtDrift(elapsedMs, cue.id, cue.driftPx ?? 3)
      : { x: 0, y: 0 };
  const slideLift = cue.anim === "fade_slide_up" ? (1 - easeOutCubic(progress)) * 12 : 0;
  const translateX = clamp(baseOffset.x + drift.x, -120, 120);
  const translateY = clamp(baseOffset.y + drift.y - slideLift + TIMELINE_BASE_Y_OFFSET, -110, 110);
  const sizeClass = getCueSizeClass(cue);
  const modeClass = getCueModeClass(cue);
  const filterValue =
    cue.blurPx && cue.blurPx > 0 && !shouldReduceMotion ? `blur(${cue.blurPx}px)` : undefined;

  let renderedText: ReactNode = cue.text;
  if (cue.anim === "typewriter" && cue.typewriter?.enabled) {
    const { content, cursorVisible } = getTypewriterState(
      cue.text,
      Math.max(0, elapsedMs - cue.startMs),
      cue.typewriter.msPerChar ?? DEFAULT_TYPEWRITER_CHAR_MS,
      cue.typewriter.showCursor ?? true,
      cue.typewriter.hideCursorAtEnd ?? true,
    );
    renderedText = (
      <span className="inline-flex items-center">
        <span>{content}</span>
        {cursorVisible ? (
          <span className="ml-1 inline-block h-[1.2em] w-[2px] bg-[#C9B68B]" />
        ) : null}
      </span>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-1/2 w-[calc(100%-32px)] max-w-[520px] px-4 text-center ${sizeClass} ${modeClass}`}
      style={{
        opacity,
        transform: `translate(-50%, -50%) translate3d(${translateX}px, ${translateY}px, 0)`,
        filter: filterValue,
      }}
    >
      {renderedText}
    </div>
  );
}

function getCueOpacity(
  elapsed: number,
  start: number,
  end: number,
  fadeInWindow: number,
  fadeOutWindow: number,
) {
  if (elapsed < start) {
    return 0;
  }
  if (elapsed < start + fadeInWindow) {
    const progress = (elapsed - start) / fadeInWindow;
    return easeOutCubic(progress);
  }
  if (elapsed > end) {
    if (elapsed > end + fadeOutWindow) return 0;
    const progress = (elapsed - end) / fadeOutWindow;
    return easeOutCubic(1 - progress);
  }
  return 1;
}

function getThoughtDrift(elapsed: number, cueId: string, range: number) {
  const seed = hashString(cueId) / 100;
  const x = Math.sin(elapsed / 900 + seed) * range;
  const y = Math.cos(elapsed / 1100 + seed * 1.5) * range;
  return { x, y };
}

function getTypewriterState(
  text: string,
  localElapsed: number,
  msPerChar: number,
  showCursor: boolean,
  hideCursorAtEnd: boolean,
) {
  const totalChars = text.length;
  const typedChars = Math.min(totalChars, Math.floor(localElapsed / msPerChar));
  const content = typedChars >= totalChars ? text : text.slice(0, typedChars);
  const cursorVisible =
    showCursor &&
    (typedChars < totalChars || !hideCursorAtEnd) &&
    Math.floor(localElapsed / 220) % 2 === 0;
  return { content, cursorVisible };
}

function computeCueBaseOffset(cue: CinematicCue) {
  const hash = hashString(cue.id);
  if (!cue.align || cue.align === "center") {
    return { x: 0, y: 0 };
  }
  if (cue.align === "offcenter") {
    const dirX = hash % 2 === 0 ? -1 : 1;
    const dirY = hash % 4 < 2 ? -1 : 1;
    return { x: dirX * 60, y: dirY * 30 };
  }
  const randX = ((hash % 200) / 200) * 160 - 80;
  const randY = (((hash >> 3) % 200) / 200) * 120 - 60;
  return { x: randX, y: randY };
}

function getCueSizeClass(cue: CinematicCue) {
  if (cue.mode === "thought") {
    return "text-[clamp(20px,5.6vw,32px)] leading-snug";
  }
  if (cue.mode === "final") {
    return "text-[clamp(26px,7.6vw,48px)] leading-tight";
  }
  return "text-[clamp(24px,6.8vw,42px)] leading-tight";
}

function getCueModeClass(cue: CinematicCue) {
  if (cue.mode === "thought") {
    return "font-light tracking-[0.015em] text-[#9CA1AD]/[0.65]";
  }
  if (cue.mode === "final") {
    return "font-semibold tracking-[0.35em] uppercase text-[#E6E7EB]";
  }
  return "font-semibold tracking-[-0.01em] text-[#E6E7EB]";
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(t: number) {
  const clamped = clamp(t, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

function getTimelineStage(ms: number): TimelineStage {
  if (ms < 3600) return "pre";
  if (ms < 7200) return "chaos";
  if (ms < 7500) return "pause";
  if (ms < 11000) return "pivot";
  return "calm";
}

type AudioLayerConfig = {
  type: OscillatorType;
  frequency: number;
  tremoloHz?: number;
  tremoloDepth?: number;
};

type ManagedLayer = AudioLayerConfig & {
  ctx: AudioContext;
  gain: GainNode;
  osc: OscillatorNode | null;
  tremoloGain: GainNode;
  tremolo?: {
    osc: OscillatorNode;
    depth: GainNode;
  };
};

type CinematicAudioEngine = {
  ctx: AudioContext;
  masterGain: GainNode;
  layers: {
    bed: ManagedLayer;
    chaos: ManagedLayer;
    stable: ManagedLayer;
  };
};

let sharedAudioEngine: CinematicAudioEngine | null = null;
let audioPrimed = false;

export async function primeIntroAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const attemptResume = async () => {
    if (!sharedAudioEngine) {
      sharedAudioEngine = createAudioEngine();
    }
    if (!sharedAudioEngine) {
      (window as unknown as { __introAudioState?: string }).__introAudioState = "no-engine";
      return false;
    }
    try {
      await sharedAudioEngine.ctx.resume();
      const state = sharedAudioEngine.ctx.state;
      (window as unknown as { __introAudioState?: string }).__introAudioState = state;
      return state === "running";
    } catch (err) {
      console.error("[intro-audio] AudioContext resume failed", err);
      (window as unknown as { __introAudioState?: string }).__introAudioState = "resume-error";
      return false;
    }
  };

  let ok = await attemptResume();
  if (!ok) {
    if (sharedAudioEngine) {
      try {
        sharedAudioEngine.ctx.close();
      } catch {}
    }
    sharedAudioEngine = createAudioEngine();
    ok = await attemptResume();
  }

  audioPrimed = ok;
  if (ok && sharedAudioEngine) {
    playPrimedPing(sharedAudioEngine);
  }
  return ok;
}

function useCinematicAudio(enabled: boolean, progressMs: number) {
  const engineRef = useRef<CinematicAudioEngine | null>(null);
  const pivotTriggeredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        stopCinematicAudio(engineRef.current);
        engineRef.current = null;
      }
      sharedAudioEngine = null;
      audioPrimed = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !audioPrimed) {
      pivotTriggeredRef.current = false;
      if (engineRef.current) {
        stopCinematicAudio(engineRef.current);
        engineRef.current = null;
        sharedAudioEngine = null;
        audioPrimed = false;
      }
      return;
    }
    if (!engineRef.current) {
      engineRef.current = sharedAudioEngine ?? createAudioEngine();
      sharedAudioEngine = engineRef.current;
    }
    const engine = engineRef.current;
    if (!engine) return;
    engine.ctx.resume().catch(() => undefined);
    applyAudioTimeline(engine, progressMs, pivotTriggeredRef);
  }, [enabled, progressMs]);
}

function createAudioEngine(): CinematicAudioEngine | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  const ctx = new AudioContextCtor();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(ctx.destination);
  return {
    ctx,
    masterGain,
    layers: {
      bed: createLayer(ctx, masterGain, { type: "sine", frequency: 110 }),
      chaos: createLayer(ctx, masterGain, { type: "triangle", frequency: 140, tremoloHz: 7 }),
      stable: createLayer(ctx, masterGain, { type: "sine", frequency: 220 }),
    },
  };
}

function stopCinematicAudio(engine: CinematicAudioEngine) {
  deactivateLayer(engine.layers.bed, 240);
  deactivateLayer(engine.layers.chaos, 240);
  deactivateLayer(engine.layers.stable, 240);
  engine.ctx.close().catch(() => undefined);
}

function applyAudioTimeline(
  engine: CinematicAudioEngine,
  progressMs: number,
  pivotTriggeredRef: MutableRefObject<boolean>,
) {
  const { bed, chaos, stable } = engine.layers;
  // Bed hum windows
  if ((progressMs >= 0 && progressMs < 7200) || (progressMs >= 11000 && progressMs < 15300)) {
    setLayerLevel(bed, 0.22, 320);
  } else if (progressMs >= 15300) {
    deactivateLayer(bed, 420);
  } else {
    deactivateLayer(bed, 260);
  }

  // Chaos pulses
  if (progressMs >= 3600 && progressMs < 7200) {
    setLayerLevel(chaos, 0.08, 220);
  } else {
    deactivateLayer(chaos, 220);
  }

  // Stable tone during pivot recovery
  if (progressMs >= 7500 && progressMs < 11000) {
    setLayerLevel(stable, 0.18, 320);
  } else {
    deactivateLayer(stable, 260);
  }

  // Pivot hit
  if (progressMs >= 7500 && !pivotTriggeredRef.current) {
    pivotTriggeredRef.current = true;
    playPivotHit(engine);
  }
}

function createLayer(
  ctx: AudioContext,
  masterGain: GainNode,
  config: AudioLayerConfig,
): ManagedLayer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(masterGain);

  const tremoloGain = ctx.createGain();
  tremoloGain.gain.value = 1;
  tremoloGain.connect(gain);

  return { ctx, gain, osc: null, tremoloGain, ...config };
}

function ensureLayerRunning(layer: ManagedLayer) {
  if (layer.osc) return;
  const osc = layer.ctx.createOscillator();
  osc.type = layer.type;
  osc.frequency.value = layer.frequency;
  osc.connect(layer.tremoloGain);
  osc.start();
  if (layer.tremoloHz && !layer.tremolo) {
    const lfo = layer.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = layer.tremoloHz;
    const depth = layer.ctx.createGain();
    depth.gain.value = layer.tremoloDepth ?? 0.25;
    lfo.connect(depth);
    depth.connect(layer.tremoloGain.gain);
    lfo.start();
    layer.tremolo = { osc: lfo, depth };
  }
  layer.osc = osc;
}

function setLayerLevel(layer: ManagedLayer, volume: number, fadeMs: number) {
  ensureLayerRunning(layer);
  const now = layer.ctx.currentTime;
  const fadeSec = fadeMs / 1000;
  layer.gain.gain.cancelScheduledValues(now);
  layer.gain.gain.linearRampToValueAtTime(volume, now + fadeSec);
}

function deactivateLayer(layer: ManagedLayer, fadeMs: number) {
  if (!layer.osc && layer.gain.gain.value === 0) return;
  const now = layer.ctx.currentTime;
  const fadeSec = fadeMs / 1000;
  layer.gain.gain.cancelScheduledValues(now);
  layer.gain.gain.linearRampToValueAtTime(0, now + fadeSec);
  if (layer.osc) {
    const osc = layer.osc;
    layer.osc = null;
    osc.stop(now + fadeSec + 0.05);
    osc.onended = () => {
      osc.disconnect();
    };
  }
}

function playPivotHit(engine: CinematicAudioEngine) {
  const { ctx, masterGain } = engine;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180;
  gain.gain.value = 0;
  gain.connect(masterGain);
  osc.connect(gain);
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
  gain.gain.linearRampToValueAtTime(0, now + 0.35);
  osc.start();
  osc.stop(now + 0.45);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

function playPrimedPing(engine: CinematicAudioEngine) {
  const { ctx, masterGain } = engine;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 660;
  gain.gain.value = 0;
  gain.connect(masterGain);
  osc.connect(gain);
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
  gain.gain.linearRampToValueAtTime(0, now + 0.15);
  osc.start();
  osc.stop(now + 0.2);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
