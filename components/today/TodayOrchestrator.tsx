"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import { track } from "@/lib/telemetry/track";
import { useCopy } from "@/lib/useCopy";
import { getScreenIdForRoute } from "@/lib/routeIds";
import { isGuidedDayOneLane } from "@/lib/guidedDayOne";
import {
  getTriedExtraToday,
  hasCompletedToday,
  readLastCompletion,
  type DailyCompletionRecord,
} from "@/lib/dailyCompletion";
import { getTodayKey } from "@/lib/time/todayKey";
import { getTraitLabel, type CatAxisId } from "@/lib/profileEngine";
import type { LessonId, ModuleId, SessionTemplateId, WorldId } from "@/lib/taxonomy/types";
import { type SessionPlan } from "@/lib/sessionRecommenderEngine";
import { clearTodayPlan, readTodayPlan, saveTodayPlan } from "@/lib/todayPlanStorage";
import { getSensAiTodayPlan, hasFreeDailyLimit, type SensAiContext } from "@/lib/omniSensAI";
import { useProgressFacts } from "@/components/useProgressFacts";
import {
  canAccessOmniKuno,
  canAccessWizard,
  canInviteBuddy,
  getTotalActionsCompleted,
  getTotalDailySessionsCompleted,
  needsCatLitePart2,
  needsStyleProfile,
} from "@/lib/gatingSelectors";
import { CAT_LITE_EXTENDED_AXES } from "@/lib/catLite";
import {
  getAxisFromMindPacingSignal,
  getMindPacingSignalFromOption,
  isMindPacingSignalTag,
} from "@/lib/mindPacingSignals";
import { useUserAccessTier } from "@/components/useUserAccessTier";
import { isE2EMode } from "@/lib/e2eMode";
import { getGuidedClusterParam } from "@/lib/guidedDayOne";
import { useEarnedRoundsController } from "@/components/today/useEarnedRounds";
import {
  ensureInitiationProgress,
  markInitiationLessonsCompleted,
  clearInitiationProgress,
  readInitiationProgressState,
} from "@/lib/content/initiationProgressStorage";
import {
  buildInitiationSessionPlan,
  type InitiationSessionPlanResult,
} from "@/lib/sessions/buildInitiationSessionPlan";
import {
  hasInitiationRunCompleted,
  markInitiationRunCompleted,
  clearInitiationRunHistory,
} from "@/lib/content/initiationRunHistory";
import { useInitiationProgress } from "@/components/today/useInitiationProgress";
import { resolveInitiationPlanLock } from "@/lib/today/initiationPlanLock";

const TODAY_SCREEN_ID = getScreenIdForRoute("/today");
const GUIDED_ONBOARDING_KEY = "guided_onboarding_active";
const LEGACY_GUIDED_KEY = "guided_guest_mode";
const GUIDED_REASON_BY_SIGNAL: Record<string, string> = {
  brain_fog: "Mintea era în ceață. Azi o traducem în 1 propoziție reală.",
  overthinking: "Te-a blocat overthinking-ul. Tăiem firul mental și rămâne o decizie.",
  task_switching: "Task switching continuu ți-a mâncat claritatea. Fixăm o singură ancoră.",
  somatic_tension: "Corpul ținea frâna, nu motivația. Relaxăm tensiunea și alegem un gest real.",
};
const GUIDED_REASON_BY_AXIS: Partial<Record<CatAxisId, string>> = {
  clarity: "Nu e lipsă de voință, e zgomot cognitiv. Îl reducem azi.",
  energy: "Nu erai leneș, doar descărcat. Îți aducem energie funcțională rapid.",
};
const DAY_ONE_ENTRY_UNLOCK_KEY = "today_day1_entry_unlock_v1";

const formatLessonLabel = (lessonId: string): string =>
  lessonId
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export default function TodayOrchestrator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const { user, authReady } = useAuth();
  const { data: progressFacts, loading: progressFactsLoading } = useProgressFacts(user?.uid ?? null);
  const initiationProgressSnapshot = useInitiationProgress(user?.uid ?? null);
  const earnedRounds = useEarnedRoundsController(progressFacts ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<DailyCompletionRecord | null>(null);
  const sourceParam = searchParams?.get("source");
  const normalizedSourceParam = (sourceParam ?? "").toLowerCase();
  const intentParam = (searchParams?.get("intent") ?? "").toLowerCase();
  const mindpacingTagParam = searchParams?.get("mindpacingTag") ?? null;
  const laneParam = (searchParams?.get("lane") ?? "").toLowerCase();
  const normalizedMindpacingTag = mindpacingTagParam ? mindpacingTagParam.toLowerCase() : null;
  const todayKey = useMemo(() => getTodayKey(), []);
  const entryUnlockStorageKey = useMemo(() => `${DAY_ONE_ENTRY_UNLOCK_KEY}:${todayKey}`, [todayKey]);
  const mindBlock = progressFacts?.mindPacing ?? null;
  const persistedMindSignal = useMemo(() => {
    if (!mindBlock) return null;
    if (mindBlock.dayKey !== todayKey) return null;
    const tag = mindBlock.mindTag;
    if (isMindPacingSignalTag(tag)) {
      return tag;
    }
    const fallbackSignal = getMindPacingSignalFromOption(mindBlock.optionId ?? null);
    return fallbackSignal ?? null;
  }, [mindBlock, todayKey]);
  const persistedAxis = useMemo<CatAxisId | null>(() => {
    if (!mindBlock) return null;
    if (mindBlock.dayKey !== todayKey) return null;
    const axis = mindBlock.axisId;
    if (axis) return axis as CatAxisId;
    return persistedMindSignal ? getAxisFromMindPacingSignal(persistedMindSignal) : null;
  }, [mindBlock, persistedMindSignal, todayKey]);
  const forcedMindAxis = useMemo<CatAxisId | null>(() => {
    if (sourceParam === "mindpacing_safe" && isMindPacingSignalTag(normalizedMindpacingTag)) {
      return getAxisFromMindPacingSignal(normalizedMindpacingTag);
    }
    if (persistedAxis) {
      return persistedAxis;
    }
    return null;
  }, [normalizedMindpacingTag, persistedAxis, sourceParam]);
  const cameFromRunComplete = sourceParam === "run_complete";
  const cameFromGuided = sourceParam === "guided";
  const e2eParamActive = (searchParams?.get("e2e") ?? "").toLowerCase() === "1";
  const e2eMode = e2eParamActive || isE2EMode();
  const [triedExtraToday, setTriedExtraTodayState] = useState(false);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [planPersisted, setPlanPersisted] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [sensAiCtx, setSensAiCtx] = useState<SensAiContext | null>(null);
  const [initiationPlanResult, setInitiationPlanResult] = useState<InitiationSessionPlanResult | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [guidedOnboardingActive, setGuidedOnboardingActive] = useState(false);
  const [dayOneEntryUnlocked, setDayOneEntryUnlocked] = useState(false);
  const totalDailySessionsCompleted = useMemo(() => getTotalDailySessionsCompleted(progressFacts), [progressFacts]);
  const totalActionsCompleted = useMemo(() => getTotalActionsCompleted(progressFacts), [progressFacts]);
  const wizardUnlocked = canAccessWizard(progressFacts);
  const omniKunoUnlocked = canAccessOmniKuno(progressFacts);
  const buddyUnlocked = canInviteBuddy(progressFacts);
  const needsStyle = needsStyleProfile(sensAiCtx?.profile ?? null, progressFacts);
  const catLitePart2Needed = useMemo(() => {
    if (progressFactsLoading) return false;
    if (!sensAiCtx?.profile) return false;
    return needsCatLitePart2(sensAiCtx.profile, progressFacts);
  }, [progressFactsLoading, sensAiCtx, progressFacts]);
  const missingExtendedAxisLabels = useMemo(() => {
    const profile = sensAiCtx?.profile ?? null;
    if (!profile?.catProfile) return [];
    const catProfile = profile.catProfile;
    return CAT_LITE_EXTENDED_AXES.filter((axis) => typeof catProfile.axes[axis]?.score !== "number").map((axis) =>
      getTraitLabel(axis),
    );
  }, [sensAiCtx]);
  const wizardUnlockRef = useRef(false);
  const omniKunoUnlockRef = useRef(false);
  const buddyUnlockRef = useRef(false);
  const { accessTier, membershipTier } = useUserAccessTier();
  const fallbackTrackedRef = useRef(false);
  const debugQueryActive = (searchParams?.get("debug") ?? "").toLowerCase() === "1";
  const showDebugUi = process.env.NODE_ENV !== "production" || e2eMode || debugQueryActive;
  const handleResetInitiation = useCallback(() => {
    const uid = user?.uid ?? null;
    clearTodayPlan();
    clearInitiationProgress(uid);
    clearInitiationRunHistory(uid);
    setInitiationPlanResult(null);
    setRunId(null);
    fallbackTrackedRef.current = false;
  }, [user?.uid]);


  useEffect(() => {
    if (wizardUnlocked && !wizardUnlockRef.current) {
      track("wizard_unlocked");
      wizardUnlockRef.current = true;
    }
  }, [wizardUnlocked]);

  useEffect(() => {
    if (omniKunoUnlocked && !omniKunoUnlockRef.current) {
      track("omni_kuno_unlocked");
      omniKunoUnlockRef.current = true;
    }
  }, [omniKunoUnlocked]);

  useEffect(() => {
    if (buddyUnlocked && !buddyUnlockRef.current) {
      track("buddy_unlocked");
      buddyUnlockRef.current = true;
    }
  }, [buddyUnlocked]);

  useEffect(() => {
    track("today_viewed");
    if (typeof window === "undefined") return;
    const storedNew = window.localStorage.getItem(GUIDED_ONBOARDING_KEY) === "1";
    const storedLegacy = window.localStorage.getItem(LEGACY_GUIDED_KEY) === "1";
    const startGuidedMode = storedNew || storedLegacy || cameFromGuided;
    if (startGuidedMode) {
      setGuidedOnboardingActive(true);
      try {
        window.localStorage.setItem(GUIDED_ONBOARDING_KEY, "1");
        window.localStorage.removeItem(LEGACY_GUIDED_KEY);
      } catch {}
    }
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      const completed = hasCompletedToday();
      const last = readLastCompletion();
      const tried = getTriedExtraToday();
      setCompletedToday(completed);
      setLastCompletion(last);
      setTriedExtraTodayState(tried);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [cameFromGuided]);

  useEffect(() => {
    if (!guidedOnboardingActive) return;
    const isRealUser = Boolean(user && !user.isAnonymous);
    if (isRealUser || (totalDailySessionsCompleted ?? 0) > 0) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUIDED_ONBOARDING_KEY);
        window.localStorage.removeItem(LEGACY_GUIDED_KEY);
      }
      setGuidedOnboardingActive(false);
    }
  }, [guidedOnboardingActive, totalDailySessionsCompleted, user]);

  useEffect(() => {
    if (sourceParam !== "run_complete") return;
    const storedPlan = readTodayPlan();
    if (
      !storedPlan ||
      storedPlan.worldId !== "INITIATION" ||
      storedPlan.mode !== "initiation" ||
      !storedPlan.initiationModuleId ||
      !storedPlan.initiationLessonIds?.length
    ) {
      return;
    }
    const userId = user?.uid ?? null;
    if (!storedPlan.runId) {
      markInitiationLessonsCompleted(
        userId,
        storedPlan.initiationModuleId as ModuleId,
        storedPlan.initiationLessonIds as LessonId[],
      );
      clearTodayPlan();
      return;
    }
    if (hasInitiationRunCompleted(userId, storedPlan.runId)) {
      return;
    }
    markInitiationLessonsCompleted(
      userId,
      storedPlan.initiationModuleId as ModuleId,
      storedPlan.initiationLessonIds as LessonId[],
    );
    markInitiationRunCompleted(userId, storedPlan.runId);
    clearTodayPlan();
  }, [sourceParam, user?.uid]);

  useEffect(() => {
    if (!sourceParam) return;
    if (sourceParam === "run_complete" || sourceParam === "guided") {
      router.replace("/today");
    }
  }, [sourceParam, router]);

  const loadPlanFromSensAi = useCallback(
    async (userId: string, token: { cancelled: boolean }, forcedAxis?: CatAxisId | null) => {
      setPlanLoading(true);
      try {
        const result = await getSensAiTodayPlan(userId, forcedAxis ? { forcedAxis } : undefined);
        if (token.cancelled) return;
        setSensAiCtx(result.ctx);
        setSessionPlan(result.plan);
      } finally {
        if (!token.cancelled) setPlanLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const planLockResult = resolveInitiationPlanLock({
      todayKey,
      mindpacingTag: normalizedMindpacingTag,
    });
    if (planLockResult.status === "reused") {
      setInitiationPlanResult(planLockResult.planResult);
      setRunId(planLockResult.runId);
      fallbackTrackedRef.current = Boolean(planLockResult.planResult.debug.fallbackReason);
      return;
    }
    setRunId(planLockResult.runId);
    fallbackTrackedRef.current = false;

    try {
      const existingProgress = readInitiationProgressState(user?.uid ?? null);
      const builderResult = buildInitiationSessionPlan({
        templateId: "initiation_v2_12min" as SessionTemplateId,
        currentModuleId: existingProgress?.moduleId ?? null,
        completedLessonIds: existingProgress?.completedLessonIds ?? [],
        mindpacingTag: normalizedMindpacingTag,
      });
      ensureInitiationProgress(user?.uid ?? null, builderResult.debug.moduleId);
      setInitiationPlanResult(builderResult);
    } catch (error) {
      console.warn("[today] initiation session plan failed", error);
      setInitiationPlanResult(null);
      setRunId(null);
    }
  }, [normalizedMindpacingTag, user?.uid, todayKey]);

  useEffect(() => {
    if (!authReady || !user) return;
    const token = { cancelled: false };
    void loadPlanFromSensAi(user.uid, token, forcedMindAxis);
    return () => {
      token.cancelled = true;
    };
  }, [authReady, user, loadPlanFromSensAi, forcedMindAxis]);

  useEffect(() => {
    if (!initiationPlanResult?.debug.fallbackReason) return;
    if (fallbackTrackedRef.current) return;
    fallbackTrackedRef.current = true;
    track("mindpacing_fallback", {
      reason: initiationPlanResult.debug.fallbackReason,
      mindpacingTag: initiationPlanResult.debug.mindpacingTag ?? null,
      fallbackModuleId: initiationPlanResult.debug.moduleId,
    });
  }, [initiationPlanResult]);

  useEffect(() => {
    if (!sessionPlan || !initiationPlanResult || !runId) {
      setPlanPersisted(false);
      return;
    }
    saveTodayPlan({
      arcId: sessionPlan.arcId,
      arcDayIndex: sessionPlan.arcDayIndex,
      arcLengthDays: sessionPlan.arcLengthDays,
      moduleId: sessionPlan.moduleId,
      traitPrimary: sessionPlan.traitPrimary,
      traitSecondary: sessionPlan.traitSecondary,
      canonDomain: sessionPlan.canonDomain,
      initiationModuleId: initiationPlanResult.initiation.moduleId,
      initiationLessonIds: initiationPlanResult.initiation.lessonIds,
      initiationRecallPromptId: initiationPlanResult.initiation.recallPromptId ?? null,
      initiationElectiveReason: initiationPlanResult.initiation.electiveReason ?? null,
      todayKey,
      runId,
      mindpacingTag: initiationPlanResult.debug.mindpacingTag ?? null,
      fallbackReason: initiationPlanResult.debug.fallbackReason,
      worldId: "INITIATION" as WorldId,
      mode: "initiation",
    });
    setPlanPersisted(true);
  }, [sessionPlan, initiationPlanResult, todayKey, runId]);

  const lastSessionLabel = useMemo(() => {
    if (!lastCompletion) return "—";
    const completedAt = new Date(lastCompletion.completedAt);
    if (getTodayKey(completedAt) === todayKey) {
      return "Azi";
    }
    try {
      return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" }).format(completedAt);
    } catch {
      return completedAt.toLocaleDateString();
    }
  }, [lastCompletion, todayKey]);

  const preserveGuidedDayOneE2E = e2eMode;
  const buildGuidedDayOneQuery = () => {
    const params = new URLSearchParams();
    params.set("mode", "deep");
    params.set("source", "guided_day1");
    params.set("lane", "guided_day1");
    const axis = forcedMindAxis;
    if (axis) {
      params.set("axis", axis);
      const clusterParam = getGuidedClusterParam(axis);
      if (clusterParam) {
        params.set("cluster", clusterParam);
      }
    }
    if (preserveGuidedDayOneE2E) {
      params.set("e2e", "1");
    }
    return params.toString();
  };
  const exploreCatUrl = useMemo(() => {
    const params = new URLSearchParams({ source: "today", entry: "cat-lite" });
    if (preserveGuidedDayOneE2E) {
      params.set("e2e", "1");
    }
    return `/intro/explore?${params.toString()}`;
  }, [preserveGuidedDayOneE2E]);
  const exploreAxesUrl = useMemo(() => {
    const params = new URLSearchParams({ source: "today", entry: "axes" });
    if (preserveGuidedDayOneE2E) {
      params.set("e2e", "1");
    }
    return `/intro/explore?${params.toString()}`;
  }, [preserveGuidedDayOneE2E]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDayOneEntryUnlocked(window.localStorage.getItem(entryUnlockStorageKey) === "1");
    } catch {
      setDayOneEntryUnlocked(false);
    }
  }, [entryUnlockStorageKey]);
  const markDayOneEntryUnlocked = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(entryUnlockStorageKey, "1");
    } catch {
      // ignore
    }
    setDayOneEntryUnlocked(true);
  }, [entryUnlockStorageKey]);
  useEffect(() => {
    if (!normalizedSourceParam) return;
    if (
      normalizedSourceParam === "guided_day1" ||
      normalizedSourceParam === "explore_cat_day1" ||
      normalizedSourceParam === "explore_axes_day1"
    ) {
      markDayOneEntryUnlocked();
    }
  }, [markDayOneEntryUnlocked, normalizedSourceParam]);
  const handleGuidedDayOneStart = () => {
    if (!canStartGuided) return;
    const target = `/today/run?${buildGuidedDayOneQuery()}`;
    if (e2eGuidedOverride && typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
    setTimeout(() => {
      markDayOneEntryUnlocked();
    }, 0);
  };
  const handleStart = () => {
    track("today_primary_clicked", { completedToday });
    if (guidedOnboardingActive && typeof window !== "undefined") {
      window.localStorage.removeItem(GUIDED_ONBOARDING_KEY);
      window.localStorage.removeItem(LEGACY_GUIDED_KEY);
      setGuidedOnboardingActive(false);
    }
    const runTarget = e2eMode ? "/today/run?e2e=1" : "/today/run";
    router.push(runTarget);
  };

  const completedSessions = totalDailySessionsCompleted ?? 0;
  const exploreDay1Context =
    (sourceParam === "guided" || sourceParam === "explore_cat_day1" || sourceParam === "intro") && completedSessions <= 1;
  const catProfileComplete = sourceParam === "explore_cat_day1";
  const isGuestOrAnon = !user || user.isAnonymous;
  const guidedDayOneActive =
    isGuidedDayOneLane(sourceParam, laneParam) &&
    !dayOneEntryUnlocked &&
    (isGuestOrAnon || completedSessions === 0 || e2eMode);
  const dayOneEntryEligible = exploreDay1Context && !dayOneEntryUnlocked;
  const dayOneEntryActive =
    dayOneEntryEligible &&
    !guidedDayOneActive &&
    (normalizedSourceParam === "intro" || (!normalizedSourceParam && completedSessions <= 0));
  const axisParamToday = searchParams?.get("axis") ?? null;
  const clusterParamToday = searchParams?.get("cluster") ?? null;
  const overrideSuppressedToday = Boolean(
    ((clusterParamToday && laneParam !== "guided_day1") ||
      ((searchParams?.get("lang") ?? null) && laneParam !== "guided_day1") ||
      ((searchParams?.get("mode") ?? null) && laneParam !== "guided_day1") ||
      (searchParams?.get("qa") ?? "")) &&
      guidedDayOneActive,
  );
  const guidedLaneBadge = guidedDayOneActive ? (
    <div className="fixed bottom-4 left-4 z-40 rounded-lg bg-black/80 px-3 py-2 text-[11px] text-white shadow-lg">
      <p className="font-semibold">GuidedDay1LaneDebug</p>
      <p>axisSource: {axisParamToday ? "query" : persistedAxis ? "storage" : "n/a"}</p>
      <p>clusterSource: {clusterParamToday ? (laneParam === "guided_day1" ? "lane" : "query") : persistedAxis ? "storage" : "n/a"}</p>
      <p>overrideSuppressed: {overrideSuppressedToday ? "yes" : "no"}</p>
    </div>
  ) : null;

  const header = (
    <SiteHeader
      showMenu={accessTier.flags.showMenu}
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")}
    />
  );
  const shellHeader = guidedOnboardingActive ? null : header;

  useEffect(() => {
    if (!accessTier.flags.showMenu && menuOpen) {
      setMenuOpen(false);
    }
  }, [accessTier.flags.showMenu, menuOpen]);

  const isPremiumMember = membershipTier === "premium";
  const freeLimitReached = hasFreeDailyLimit(sensAiCtx);

  const defaultHeroTitle = sessionPlan?.title ?? "Antrenamentul de azi";
  const defaultHeroSubtitle = sessionPlan?.summary ?? "Traseu adaptiv calibrat pe profilul tău mental.";
  const recommendedLabel = sessionPlan?.expectedDurationMinutes
    ? `Sesiunea zilnică recomandată (${sessionPlan.expectedDurationMinutes} min)`
    : "Sesiunea zilnică recomandată";
  const defaultPrimaryCta = freeLimitReached
    ? "Disponibil în Premium"
    : completedToday
      ? "Completat azi"
      : recommendedLabel;
  const todayCopy = useCopy(TODAY_SCREEN_ID, "ro", {
    h1: defaultHeroTitle,
    subtitle: defaultHeroSubtitle,
    ctaPrimary: defaultPrimaryCta,
  });
  const heroTitle = todayCopy.h1 ?? defaultHeroTitle;
  const heroSubtitle = todayCopy.subtitle ?? defaultHeroSubtitle;
  const primaryCtaLabel = todayCopy.ctaPrimary ?? defaultPrimaryCta;
  const guidedReasonText = useMemo(() => {
    if (persistedMindSignal && GUIDED_REASON_BY_SIGNAL[persistedMindSignal]) {
      return GUIDED_REASON_BY_SIGNAL[persistedMindSignal];
    }
    if (persistedAxis && GUIDED_REASON_BY_AXIS[persistedAxis]) {
      return GUIDED_REASON_BY_AXIS[persistedAxis] ?? null;
    }
    return null;
  }, [persistedMindSignal, persistedAxis]);
  const guidedDayOneLane = isGuidedDayOneLane(sourceParam, laneParam);
  const guidedStartBlockingReason = (() => {
    if (!sessionPlan) return "session_plan_pending";
    if (!planPersisted) return "plan_not_persisted";
    return null;
  })();
  const e2eGuidedOverride = e2eMode && guidedDayOneLane;
  const canStartGuided = e2eGuidedOverride ? true : !guidedStartBlockingReason;
  const guidedStartDisabled = !canStartGuided || (!e2eGuidedOverride && planLoading);
  const guidedDisabledReasonForDebug = e2eGuidedOverride ? guidedStartBlockingReason : null;
  const guidedCtaLabel = useMemo(() => {
    if (!sessionPlan?.expectedDurationMinutes) return null;
    return `Pornește sesiunea (${sessionPlan.expectedDurationMinutes} min)`;
  }, [sessionPlan?.expectedDurationMinutes]);

  const goToEarnGate = useCallback(
    (source: string) => {
      router.push(`/today/earn?source=${source}&round=extra`);
    },
    [router],
  );
  if (guidedDayOneActive) {
    const guidedTitle = sessionPlan?.title ?? "Start clar pentru Ziua 1";
    const guidedSummary = guidedReasonText ?? sessionPlan?.summary ?? undefined;
    const guidedCta = guidedCtaLabel ?? "Pornește sesiunea (10–12 min)";
    return (
      <div data-testid="today-root">
        <div data-testid="guided-day1-page">
          {guidedLaneBadge}
          <AppShell header={null} bodyClassName="bg-[var(--omni-bg-soft)]" mainClassName="px-0 py-10">
            <div className="mx-auto w-full max-w-4xl px-4">
              <DayOneEntryHero
                title={guidedTitle}
                summary={
                  guidedSummary ??
                  "O sesiune ghidată de 10–12 minute care taie zgomotul mental și îți dă o singură decizie aplicabilă azi."
                }
                ctaLabel={guidedCta}
                disabled={guidedStartDisabled}
                disabledLabel="Se pregătește planul…"
                debugDisabledReasonTestId="guided-day1-start-disabled-reason"
                debugDisabledReason={guidedDisabledReasonForDebug ?? null}
                onStart={handleGuidedDayOneStart}
              />
            </div>
          </AppShell>
        </div>
      </div>
    );
  }
  const quickButtonLabel = completedToday ? "Completat azi" : primaryCtaLabel;
  const quickButtonDisabled = freeLimitReached || planLoading || completedToday;
  const quickDurationLabel = sessionPlan?.expectedDurationMinutes
    ? `${sessionPlan.expectedDurationMinutes} min`
    : "10–20 min";
  const deepNeedsEarnCredit = !isPremiumMember && completedToday && !earnedRounds.canSpend;
  const deepButtonLabel = deepNeedsEarnCredit ? "Deblochează credit Earn" : "Pornește Deep Loop";
  const deepDescription = isPremiumMember
    ? "Playlist extins 30–60 min pentru aceeași temă."
    : deepNeedsEarnCredit
      ? "Ai nevoie de un credit Earn pentru încă o rundă azi."
      : "Credit Earn disponibil pentru 30–60 min de focus.";
  const highlightExploreCat = !catProfileComplete && (exploreDay1Context || intentParam === "explore");
  const exploreHeadingLabel = exploreDay1Context ? "Vrei mai mult azi?" : "Explorează mai mult";
  const exploreHeadingTitle = exploreDay1Context ? "Alege contextul pe care îl aprofundezi" : "Alege contextul pe care îl aprofundezi";
  const exploreHeadingBody = exploreDay1Context
    ? "După sesiunea deep poți continua cu profilul CAT sau cu o lecție scurtă pe o axă."
    : "După sesiunea deep poți continua cu o explorare ghidată sau cu o lecție scurtă pe o axă.";
  const earnStatusLabel = isPremiumMember
    ? "Premium activ: poți rula Deep + Explore fără limită."
    : `Credite Earn: ${earnedRounds.state.credits}/3 · Runde extra azi: ${earnedRounds.state.usedToday}`;

  const handleUpgrade = () => router.push("/upgrade");
  const handleQuickLoop = () => {
    if (quickButtonDisabled) {
      if (freeLimitReached) handleUpgrade();
      return;
    }
    handleStart();
  };
  const handleDeepLoop = () => {
    track("today_deep_loop_selected", { premium: isPremiumMember });
    if (deepNeedsEarnCredit) {
      goToEarnGate("today_deep");
      return;
    }
    const params = new URLSearchParams({ source: "today_hub", mode: "deep", round: "extra" });
    router.push(`/today/next?${params.toString()}`);
  };
  const handleExploreCatLite = () => {
    track("today_explore_cat_clicked", { intent: intentParam || null, source: sourceParam ?? null });
    router.push(exploreCatUrl);
  };
  const exploreCatTitle = "Profil mental Ziua 1";
  const exploreCatDescription = exploreDay1Context
    ? "Intră în CAT Lite și vezi unde ești pe axele principale. Îți ia 10–12 minute."
    : "Intră în CAT Lite și vezi unde te afli pe axele principale. Îți ia 10-12 minute.";
  const exploreAxesTitle = "Alege o lecție pe o axă";
  const exploreAxesDescription = exploreDay1Context
    ? "Dacă vrei doar context rapid, alegi o axă și primești vocab + mini-instrucțiuni pentru zona respectivă."
    : "Dacă vrei doar context rapid, alege o axă și primești vocab + mini-instrucțiuni pentru zona respectivă.";
  const handleExploreAxes = () => {
    track("today_explore_axes_clicked", { intent: intentParam || null, source: sourceParam ?? null });
    router.push(exploreAxesUrl);
  };
  const handleEarnShortcut = () => {
    goToEarnGate("today_hub");
  };
  const moduleIdForUi =
    initiationPlanResult?.debug.moduleId ??
    initiationProgressSnapshot?.moduleId ??
    ("init_clarity_foundations" as ModuleId);
  const moduleMeta = INITIATION_MODULES[moduleIdForUi] ?? null;
  const moduleLessonCount = moduleMeta?.lessonIds.length ?? 0;
  const completedLessonsCount = initiationProgressSnapshot?.completedLessonIds.length ?? 0;
  const currentLessonNumber = moduleLessonCount
    ? Math.min(completedLessonsCount + 1, moduleLessonCount)
    : null;

  if (!sessionPlan) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-center text-[var(--omni-ink)]">
        Se încarcă sesiunea recomandată...
      </div>
    );
  }
  if (dayOneEntryActive) {
    const entryTitle = sessionPlan?.title ?? "Start clar pentru Ziua 1";
    const entrySummary =
      guidedReasonText ??
      sessionPlan?.summary ??
      "O sesiune ghidată de 10–12 minute care reduce zgomotul mental și setează ritmul de lucru.";
    const entryCta = guidedCtaLabel ?? "Pornește sesiunea (10–12 min)";
    return (
      <div data-testid="today-root">
        <div data-testid="today-day1-entry">
          {guidedLaneBadge}
          <AppShell header={null} bodyClassName="bg-[var(--omni-bg-soft)]" mainClassName="px-0 py-10">
            <div className="mx-auto w-full max-w-4xl px-4">
              <DayOneEntryHero
                title={entryTitle}
                summary={entrySummary}
                ctaLabel={entryCta}
                disabled={!canStartGuided || planLoading}
                disabledLabel="Se pregătește planul…"
                onStart={handleGuidedDayOneStart}
              />
            </div>
          </AppShell>
        </div>
      </div>
    );
  }

  const activeArcDayIndex =
    sensAiCtx?.profile.activeArcId && sensAiCtx.profile.activeArcId === sessionPlan.arcId
      ? sensAiCtx.profile.activeArcDayIndex ?? null
      : null;
  const arcDayNumber = sessionPlan.arcId
    ? (() => {
        const profileDay = typeof activeArcDayIndex === "number" ? activeArcDayIndex + 1 : null;
        const fallbackDay = typeof sessionPlan.arcDayIndex === "number" ? sessionPlan.arcDayIndex + 1 : null;
        const rawDay = profileDay ?? fallbackDay;
        if (rawDay == null) return null;
        if (sessionPlan.arcLengthDays) {
          return Math.min(rawDay, sessionPlan.arcLengthDays);
        }
        return rawDay;
      })()
    : null;
  const arcProgressLabel = sessionPlan.arcId
    ? `Ziua ${arcDayNumber ?? "—"}${sessionPlan.arcLengthDays ? ` din ${sessionPlan.arcLengthDays}` : ""} în ${sessionPlan.title}`
    : "Primul tău antrenament de claritate";
  const xpForTrait = sensAiCtx?.profile.xpByTrait?.[sessionPlan.traitPrimary] ?? 0;
  const initiationLessons = initiationPlanResult?.lessons ?? [];
  const showFallbackBanner = Boolean(initiationPlanResult?.debug.fallbackReason) && showDebugUi;
  const fallbackBanner = showFallbackBanner ? (
    <div
      data-testid="mindpacing-fallback-banner"
      className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800"
    >
      <p className="font-semibold uppercase tracking-[0.3em]">MindPacing fallback</p>
      <p className="mt-1">
        {initiationPlanResult?.debug.fallbackReason === "unknown_mindpacing_tag"
          ? "Tag necunoscut – folosim Clarity Foundations."
          : "Mindpacing tag lipsă – folosim plan implicit."}
      </p>
    </div>
  ) : null;
  const lessonList = showDebugUi && initiationLessons.length ? (
    <div
      className="mt-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white/70 px-4 py-3"
      data-testid="initiation-lesson-plan"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Lecțiile de azi</p>
      <ul className="mt-2 space-y-1 text-sm text-[var(--omni-ink)]">
        {initiationLessons.map((lesson) => (
          <li key={lesson.meta.lessonId} className="flex items-center justify-between">
            <span>{formatLessonLabel(lesson.meta.lessonId)}</span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              {lesson.source === "wow" ? "WOW" : "DailyPath"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <>
      <AppShell header={shellHeader}>
        <div
          className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8"
          data-testid="today-root"
        >
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">Astăzi</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{heroTitle}</h1>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{heroSubtitle}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {arcProgressLabel}
              </p>
              {fallbackBanner}
              {lessonList}
              {showDebugUi ? (
                <button
                  type="button"
                  data-testid="debug-reset-initiation"
                  onClick={handleResetInitiation}
                  className="mt-3 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700"
                >
                  Reset Initiation State
                </button>
              ) : null}
              {moduleMeta ? (
                <p className="mt-3 text-sm text-[var(--omni-ink)]/70">
                  Modul: <span className="font-semibold">{moduleMeta.title}</span>
                  {moduleLessonCount ? (
                    <span className="ml-2">
                      · Lecția {currentLessonNumber ?? moduleLessonCount}/{moduleLessonCount}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <article className="rounded-[20px] border border-[var(--omni-border-soft)] bg-white/90 px-5 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                    <span>Quick Loop</span>
                    <span>{quickDurationLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{heroSubtitle}</p>
                  <p className="mt-1 text-xs text-[var(--omni-muted)]">Ultima sesiune: {lastSessionLabel}</p>
                  <OmniCtaButton
                    className="mt-4 w-full justify-center"
                    disabled={quickButtonDisabled}
                    onClick={handleQuickLoop}
                    data-testid="today-start-run"
                  >
                    {quickButtonLabel}
                  </OmniCtaButton>
                </article>
                <article className="rounded-[20px] border border-[var(--omni-border-soft)] bg-white/90 px-5 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                    <span>Deep Loop</span>
                    <span>30–60 min</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{deepDescription}</p>
                  <OmniCtaButton
                    className="mt-4 w-full justify-center"
                    variant="neutral"
                    onClick={handleDeepLoop}
                    disabled={planLoading}
                  >
                    {deepButtonLabel}
                  </OmniCtaButton>
                </article>
              </div>
              <div className="mt-4 flex flex-col gap-2 rounded-[18px] border border-[var(--omni-border-soft)] bg-white/60 px-4 py-3 text-xs text-[var(--omni-muted)] sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold uppercase tracking-[0.35em] text-[var(--omni-ink)]">{earnStatusLabel}</p>
                {!isPremiumMember ? (
                  <button
                    type="button"
                    className="text-[var(--omni-energy)] font-semibold"
                    onClick={handleEarnShortcut}
                    disabled={!earnedRounds.canEarnMore}
                  >
                    {earnedRounds.canEarnMore ? "Deblochează un credit" : "Limită Earn atinsă azi"}
                  </button>
                ) : (
                  <span className="uppercase tracking-[0.35em] text-[var(--omni-muted)]">Premium ready</span>
                )}
              </div>
              <div className="mt-5 rounded-[18px] border border-[var(--omni-border-soft)] bg-white/70 px-4 py-4 text-sm text-[var(--omni-ink)]">
                <p className="font-semibold">Focus: {getTraitLabel(sessionPlan.traitPrimary)}</p>
                <p className="mt-1 text-[var(--omni-ink)]/80">
                  {`Consolidezi ${getTraitLabel(sessionPlan.traitPrimary)} și susții ${
                    sessionPlan.traitSecondary.length
                      ? getTraitLabel(sessionPlan.traitSecondary[0])
                      : "energia funcțională"
                  }.`}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--omni-energy)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
                  {`${getTraitLabel(sessionPlan.traitPrimary)}: ${xpForTrait} XP`}
                </div>
                {!guidedOnboardingActive ? (
                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-energy)]"
                      onClick={() => router.push("/os")}
                    >
                      Vezi harta mentală →
                    </button>
                  </div>
                ) : null}
              </div>
              {freeLimitReached ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Ai făcut deja sesiunea zilnică azi. Dacă vrei să lucrezi mai mult în fiecare zi, activează OmniMental Premium.
                </div>
              ) : catProfileComplete ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-ink)]/15 bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Sesiunea deep este completă, iar profilul mental de Ziua 1 este salvat.
                </div>
              ) : cameFromRunComplete ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Sesiunea de azi este completă. Ne vedem mâine.
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-white/90 px-6 py-8 shadow-[0_15px_45px_rgba(0,0,0,0.06)] sm:px-10">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{exploreHeadingLabel}</p>
                <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{exploreHeadingTitle}</h2>
                <p className="text-sm text-[var(--omni-ink)]/80">{exploreHeadingBody}</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="rounded-[22px] border border-[var(--omni-border-soft)] bg-white/95 px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                    <span>Explore CAT</span>
                    {highlightExploreCat ? (
                      <span className="rounded-full bg-[var(--omni-energy)] px-3 py-1 text-xs font-semibold text-white">Propus azi</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[var(--omni-ink)]">{exploreCatTitle}</h3>
                  <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{exploreCatDescription}</p>
                  {catProfileComplete ? (
                    <p className="mt-2 text-xs text-[var(--omni-muted)]">Profilul CAT pentru Ziua 1 este salvat.</p>
                  ) : null}
                  <OmniCtaButton className="mt-4 w-full justify-center" onClick={handleExploreCatLite} data-testid="today-explore-cat">
                    Explorează CAT
                  </OmniCtaButton>
                </article>
                <article className="rounded-[22px] border border-dashed border-[var(--omni-border-soft)] bg-white/80 px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Explore AXE</div>
                  <h3 className="mt-3 text-xl font-semibold text-[var(--omni-ink)]">{exploreAxesTitle}</h3>
                  <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{exploreAxesDescription}</p>
                  <OmniCtaButton
                    className="mt-4 w-full justify-center"
                    variant="neutral"
                    onClick={handleExploreAxes}
                    data-testid="today-explore-axes"
                  >
                    Explorează axele
                  </OmniCtaButton>
                </article>
              </div>
            </section>

            {!exploreDay1Context ? (
              <>
                {!guidedOnboardingActive ? (
                  <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-5 text-sm text-[var(--omni-ink)]/85 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Ultima sesiune</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">{lastSessionLabel}</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Zile consecutive</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">—</p>
                    </div>
                  </section>
                ) : null}
                {catLitePart2Needed ? (
                  <CatLitePart2Card
                    missingTraits={missingExtendedAxisLabels}
                    onContinue={() => {
                      track("cat_lite_part2_card_clicked");
                      router.push("/onboarding/cat-lite-2");
                    }}
                  />
                ) : null}
                {needsStyle ? (
                  <StyleProfileCard
                    totalDailySessions={totalDailySessionsCompleted}
                    onConfigure={() => {
                      track("style_profile_cta_clicked");
                      router.push("/onboarding/style");
                    }}
                  />
                ) : null}
                <GatingUnlockCards
                  wizardUnlocked={wizardUnlocked}
                  omniKunoUnlocked={omniKunoUnlocked}
                  buddyUnlocked={buddyUnlocked}
                  stats={{ totalDailySessions: totalDailySessionsCompleted, totalActions: totalActionsCompleted }}
                  onWizard={() => router.push("/wizard")}
                  onOmniKuno={() => router.push("/kuno/learn")}
                  onBuddy={() => {
                    track("buddy_invite_clicked");
                    router.push("/intro?buddy=1");
                  }}
                />
                {!isPremiumMember && (completedToday || triedExtraToday || freeLimitReached) ? (
                  <section className="rounded-[24px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-[var(--omni-ink)]">
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Upgrade</p>
                    <h2 className="mt-2 text-2xl font-semibold">Vrei încă o sesiune azi?</h2>
                    <ul className="mt-4 space-y-2 text-sm text-[var(--omni-ink)]/85">
                      <li>• +1 sesiune azi</li>
                      <li>• Istoric complet</li>
                      <li>• Recomandări adaptative</li>
                    </ul>
                    <OmniCtaButton as="link" href="/upgrade" className="mt-4 w-full justify-center sm:w-auto">
                      Activează OmniMental
                    </OmniCtaButton>
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </AppShell>
      {!guidedOnboardingActive ? <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} /> : null}
    </>
  );
}

type StyleProfileCardProps = {
  totalDailySessions: number;
  onConfigure: () => void;
};

type CatLitePart2CardProps = {
  missingTraits: string[];
  onContinue: () => void;
};

function CatLitePart2Card({ missingTraits, onContinue }: CatLitePart2CardProps) {
  const missingText = missingTraits.length ? missingTraits.join(", ") : "încă 3 trăsături";
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/85 px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Profil mental</p>
      <h3 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Continuă-ți profilul CAT</h3>
      <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
        Ai răspuns la primele 4 trăsături de bază. Mai lipsesc {missingText}. Îți ia 3-4 minute să finalizezi mini-profilul complet.
      </p>
      <OmniCtaButton className="mt-4 w-full justify-center sm:w-auto" onClick={onContinue}>
        Completează restul profilului
      </OmniCtaButton>
    </section>
  );
}

function StyleProfileCard({ totalDailySessions, onConfigure }: StyleProfileCardProps) {
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/85 px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Personalizare</p>
      <h3 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Adaptează exercițiile la stilul tău</h3>
      <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
        Ai deja {totalDailySessions} sesiuni reale. Completează un chestionar de 2 minute ca să calibrăm modul de livrare.
      </p>
      <OmniCtaButton className="mt-4 w-full justify-center sm:w-auto" onClick={onConfigure}>
        Configurează stilul
      </OmniCtaButton>
    </section>
  );
}

type DayOneEntryHeroProps = {
  title: string;
  summary: string;
  ctaLabel: string;
  disabled?: boolean;
  disabledLabel?: string;
  onStart: () => void;
  debugDisabledReasonTestId?: string;
  debugDisabledReason?: string | null;
};

function DayOneEntryHero({
  title,
  summary,
  ctaLabel,
  disabled,
  disabledLabel,
  onStart,
  debugDisabledReasonTestId,
  debugDisabledReason,
}: DayOneEntryHeroProps) {
  return (
    <section className="rounded-[32px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.08)] sm:px-12">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Ziua 1 · Guided</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base text-[var(--omni-ink)]/85">{summary}</p>
      <OmniCtaButton
        className="mt-8 w-full justify-center sm:w-auto"
        onClick={onStart}
        disabled={disabled}
        data-testid="guided-day1-start"
      >
        {disabled ? disabledLabel ?? "Se pregătește planul…" : ctaLabel}
      </OmniCtaButton>
      {debugDisabledReason && debugDisabledReasonTestId ? (
        <div data-testid={debugDisabledReasonTestId} className="sr-only">
          {debugDisabledReason}
        </div>
      ) : null}
      <p className="mt-4 text-sm text-[var(--omni-muted)]">
        După cele 10–12 minute intri în Explore Hub și alegi fie profilul CAT, fie o axă de lucru rapidă.
      </p>
    </section>
  );
}

type GatingCardStats = {
  totalDailySessions: number;
  totalActions: number;
};

type GatingUnlockCardsProps = {
  wizardUnlocked: boolean;
  omniKunoUnlocked: boolean;
  buddyUnlocked: boolean;
  stats: GatingCardStats;
  onWizard: () => void;
  onOmniKuno: () => void;
  onBuddy: () => void;
};

function GatingUnlockCards({
  wizardUnlocked,
  omniKunoUnlocked,
  buddyUnlocked,
  stats,
  onWizard,
  onOmniKuno,
  onBuddy,
}: GatingUnlockCardsProps) {
  if (!wizardUnlocked && !omniKunoUnlocked && !buddyUnlocked) {
    return null;
  }
  const cards: Array<{ key: string; title: string; body: string; action: string; onClick: () => void }> = [];
  if (wizardUnlocked) {
    cards.push({
      key: "wizard",
      title: "Configuratorul Wizard e deblocat",
      body: "Ai deja peste 31 de sesiuni reale. Poți configura direcțiile și scenariile de antrenament avansat.",
      action: "Deschide Wizard",
      onClick: onWizard,
    });
  }
  if (omniKunoUnlocked) {
    cards.push({
      key: "omnikuno",
      title: "OmniKuno e deschis",
      body: "Ai depășit pragul minim pentru școala de execuție. Intră în lecțiile OmniKuno pentru antrenament intensiv.",
      action: "Intră în OmniKuno",
      onClick: onOmniKuno,
    });
  }
  if (buddyUnlocked) {
    cards.push({
      key: "buddy",
      title: "Poți invita un Buddy",
      body: `Ai ${stats.totalDailySessions} sesiuni zilnice și ${stats.totalActions} acțiuni confirmate. Invită un buddy și oferi acces la o mini-experiență gratuită.`,
      action: "Invită un buddy",
      onClick: onBuddy,
    });
  }
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/80 px-6 py-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Deblocări</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-[20px] border border-[var(--omni-border-soft)] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
          >
            <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{card.title}</h3>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{card.body}</p>
            <OmniCtaButton variant="primary" onClick={card.onClick} className="mt-3 justify-center">
              {card.action}
            </OmniCtaButton>
          </article>
        ))}
      </div>
    </section>
  );
}
