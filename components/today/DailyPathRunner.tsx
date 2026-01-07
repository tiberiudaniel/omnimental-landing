"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import DailyPath from "@/components/daily/DailyPath";
import { CurrentArcCard } from "@/components/today/CurrentArcCard";
import { ArcStateDebugPanel } from "@/components/debug/ArcStateDebugPanel";
import { getCatProfile } from "@/lib/firebase/cat";
import type { CatProfileDoc } from "@/types/cat";
import type { UserCompetence, CompetenceLevel } from "@/types/competence";
import type { ArcDefinition } from "@/types/arcs";
import { deriveAdaptiveClusterFromCat } from "@/lib/dailyCluster";
import { getDailyPathForCluster } from "@/config/dailyPath";
import { resolveStarterModule } from "@/config/todayModulesMeta";
import { isGuidedDayOneLane } from "@/lib/guidedDayOne";
import { getOnboardingStatus } from "@/lib/onboardingStatus";
import type { OnboardingStatus } from "@/lib/onboardingStatus";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import VocabCard from "@/components/vocab/VocabCard";
import { CAT_AXES } from "@/config/catEngine";
import type { CatAxisId as LegacyCatAxisId } from "@/config/catEngine";
import type { CatAxisId as ProfileAxisId } from "@/lib/profileEngine";
import { getGuidedClusterParam } from "@/lib/guidedDayOne";
import type { GuidedClusterParam } from "@/lib/guidedDayOne";
import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { DailyPracticeDoc } from "@/types/dailyPractice";
import type { NextDayDecision } from "@/lib/nextDayEngine";
import { decideNextDailyPath } from "@/lib/nextDayEngine";
import { applyDecisionPolicyV2, type DecisionBaseline } from "@/lib/decisionPolicyV2";
import { getUserCompetence, getUserOverallLevel } from "@/lib/competenceStore";
import { selectArcForUser } from "@/lib/arcs";
import { ensureCurrentArcForUser } from "@/lib/arcStateStore";
import { CAT_BASELINE_URL, PILLARS_URL, ADAPTIVE_PRACTICE_URL } from "@/config/routes";
import { getDailyPracticeHistory } from "@/lib/dailyPracticeStore";
import { getWowDayIndex } from "@/config/dailyPaths/wow";
import { getTodayKey } from "@/lib/dailyCompletion";
import { recordDailyRunnerEvent } from "@/lib/progressFacts/recorders";
import { daysBetween } from "@/lib/dailyPathHistory";
import { pickWordOfDay } from "@/config/catVocabulary";
import {
  getUnlockedVocabIds,
  markVocabShownToday,
  setShownVocabIdForToday,
  unlockVocab,
  wasVocabShownToday,
} from "@/lib/vocabProgress";
import { track } from "@/lib/telemetry/track";
import { useUserAccessTier } from "@/components/useUserAccessTier";

const ADAPTIVE_NUDGES: Record<AdaptiveCluster, string> = {
  clarity_cluster: "Alege azi un lucru important și exprimă-l în minte în 7 cuvinte.",
  emotional_flex_cluster: "Dacă apare tensiune, respiră 1 dată profund înainte de răspuns.",
  focus_energy_cluster: "Ia 2 minute fără telefon azi. Atât.",
};

const QA_PANEL_ENABLED = (() => {
  const flag = (process.env.NEXT_PUBLIC_SHOW_QA_LINKS || "").toLowerCase();
  return flag === "true" || flag === "1";
})();

const CLUSTER_PARAM_MAP = {
  energy: "focus_energy_cluster",
  clarity: "clarity_cluster",
  emotional_flex: "emotional_flex_cluster",
} as const;

const CLUSTER_FRIENDLY_LABELS: Record<AdaptiveCluster, string> = {
  focus_energy_cluster: "Energie",
  clarity_cluster: "Claritate",
  emotional_flex_cluster: "Flexibilitate emoțională",
};

const QA_CLUSTER_OPTIONS = [
  { param: "energy", label: "Energy", cluster: CLUSTER_PARAM_MAP.energy },
  { param: "clarity", label: "Clarity", cluster: CLUSTER_PARAM_MAP.clarity },
  { param: "emotional_flex", label: "Emotional Flex", cluster: CLUSTER_PARAM_MAP.emotional_flex },
] as const;

const QA_MODE_OPTIONS: Array<{ value: DailyPathMode; label: string }> = [
  { value: "deep", label: "Deep" },
  { value: "short", label: "Short" },
];

const QA_LANG_OPTIONS: Array<{ value: DailyPathLanguage; label: string }> = [
  { value: "ro", label: "RO" },
  { value: "en", label: "EN" },
];

const VALID_AXIS_IDS = new Set<ProfileAxisId>(CAT_AXES.map((axis) => axis.id as ProfileAxisId));

type VocabPrimerState = {
  dayKey: string;
  vocabId: string;
  axisId: ProfileAxisId;
};

const CLUSTER_TO_VOCAB_AXIS: Record<AdaptiveCluster, ProfileAxisId> = {
  clarity_cluster: "clarity",
  focus_energy_cluster: "focus",
  emotional_flex_cluster: "emotionalStability",
};

const LEGACY_TO_PROFILE_AXIS: Record<LegacyCatAxisId, ProfileAxisId> = {
  clarity: "clarity",
  focus: "focus",
  energy: "energy",
  flex: "flexibility",
  emo_stab: "emotionalStability",
  recalib: "recalibration",
  adapt_conf: "adaptiveConfidence",
};

function mapLegacyAxisToProfile(axis: LegacyCatAxisId | null | undefined): ProfileAxisId | null {
  if (!axis) return null;
  return LEGACY_TO_PROFILE_AXIS[axis] ?? null;
}

function inferLegacyWeakestAxis(doc: CatProfileDoc | null): LegacyCatAxisId | null {
  if (!doc?.axisScores) return null;
  let weakest: { axis: LegacyCatAxisId; score: number } | null = null;
  for (const [axis, score] of Object.entries(doc.axisScores) as Array<[LegacyCatAxisId, number]>) {
    if (typeof score !== "number") continue;
    if (!weakest || score < weakest.score) {
      weakest = { axis, score };
    }
  }
  return weakest?.axis ?? null;
}

function formatLocalDateKey(input: Date | number | string): string {
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveTimestampDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function getEntryLocalKey(entry: DailyPracticeDoc): string | null {
  const completionDate = resolveTimestampDate(entry.completedAt);
  const startedDate = resolveTimestampDate(entry.startedAt);
  const fallback = entry.date ? new Date(entry.date) : null;
  const candidate = completionDate ?? startedDate ?? fallback;
  if (!candidate || Number.isNaN(candidate.getTime())) {
    return null;
  }
  return formatLocalDateKey(candidate);
}

function computeLocalStreakStats(completionKeys: Set<string>): { current: number; best: number } {
  const sorted = Array.from(completionKeys).sort((a, b) => (a > b ? 1 : -1));
  if (!sorted.length) return { current: 0, best: 0 };
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const diff = Math.abs(daysBetween(sorted[i], sorted[i - 1]));
    if (diff === 1) {
      current += 1;
    } else if (diff > 1) {
      if (current > best) best = current;
      current = 1;
    }
  }
  if (current > best) best = current;
  // compute streak ending today
  let todayStreak = 0;
  const cursor = new Date();
  while (todayStreak < 60) {
    const key = formatLocalDateKey(cursor);
    if (!completionKeys.has(key)) break;
    todayStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current: todayStreak, best };
}

type DailyPathRunnerProps = {
  onCompleted?: (configId?: string | null, moduleKey?: string | null) => void;
  todayModuleKey?: string | null;
};

export default function DailyPathRunner({ onCompleted, todayModuleKey = null }: DailyPathRunnerProps) {
  const entryPath = "/today/run";
  const authReturnTo = encodeURIComponent(entryPath);

  return (
    <Suspense fallback={null}>
      <RunnerContent
        entryPath={entryPath}
        authReturnTo={authReturnTo}
        onCompleted={onCompleted}
        todayModuleKey={todayModuleKey}
      />
    </Suspense>
  );
}

type RunnerContentProps = {
  entryPath: string;
  authReturnTo: string;
  onCompleted?: (configId?: string | null, moduleKey?: string | null) => void;
  todayModuleKey?: string | null;
};

function RunnerContent({ entryPath, authReturnTo, onCompleted, todayModuleKey = null }: RunnerContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const { accessTier, membershipTier } = useUserAccessTier();
  const foundationDone = accessTier.flags.canArenas;
  const goToAuth = useCallback(() => {
    router.push(`/auth?returnTo=${authReturnTo}`);
  }, [authReturnTo, router]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catProfile, setCatProfile] = useState<CatProfileDoc | null>(null);
  const [onboardingReady, setOnboardingReady] = useState(!user?.uid);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStatusState, setOnboardingStatusState] = useState<OnboardingStatus | null>(null);
  const [dailyDecision, setDailyDecision] = useState<NextDayDecision | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [competence, setCompetence] = useState<UserCompetence | null>(null);
  const [currentArc, setCurrentArc] = useState<ArcDefinition | null>(null);
  const [dailyCompletedToday, setDailyCompletedToday] = useState(false);
  const [dailyStreak, setDailyStreak] = useState({ current: 0, best: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, total: 7 });
  const [timeModeOverride, setTimeModeOverride] = useState<DailyPathMode | null>(null);
  const [timeModeHint, setTimeModeHint] = useState<DailyPathMode | null>(null);
  const [timeSelectionMinutes, setTimeSelectionMinutes] = useState<number | null>(null);
  const [softGatePreview, setSoftGatePreview] = useState(false);
  const [vocabPrimer, setVocabPrimer] = useState<VocabPrimerState | null>(null);
  const [unlockedVocabIds, setUnlockedVocabIds] = useState<string[]>([]);
  const vocabImpressionRef = useRef<string | null>(null);
  const gatingStartRef = useRef<number | null>(null);
  const runDayKeyRef = useRef<string | null>(null);
  if (!runDayKeyRef.current) {
    runDayKeyRef.current = getTodayKey();
  }
  const vocabDayKey = runDayKeyRef.current;
  const rawSourceParam = searchParams?.get("source")?.toLowerCase() ?? "";
  const e2eParamActive = (searchParams?.get("e2e") ?? "").toLowerCase() === "1";
  const laneParam = searchParams?.get("lane")?.toLowerCase() ?? "";
  const guidedDayOneSource = isGuidedDayOneLane(rawSourceParam, laneParam);
  const cameFromUpgradeSuccess = rawSourceParam === "upgrade_success";
  const rawClusterParam = searchParams?.get("cluster")?.toLowerCase() ?? null;
  const rawAxisParam = searchParams?.get("axis")?.toLowerCase() ?? null;
  const axisOverrideParam =
    rawAxisParam && VALID_AXIS_IDS.has(rawAxisParam as ProfileAxisId) ? (rawAxisParam as ProfileAxisId) : null;
  const [storedMindAxis, setStoredMindAxis] = useState<ProfileAxisId | null>(null);
  useEffect(() => {
    if (!guidedDayOneSource) {
      setStoredMindAxis(null);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("mind_info_state_v1");
      if (!raw) {
        setStoredMindAxis(null);
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, { axisId?: string }>;
      const entry = parsed?.[vocabDayKey];
      const axisId = entry?.axisId;
      if (axisId && VALID_AXIS_IDS.has(axisId as ProfileAxisId)) {
        setStoredMindAxis(axisId as ProfileAxisId);
      } else {
        setStoredMindAxis(null);
      }
    } catch {
      setStoredMindAxis(null);
    }
  }, [guidedDayOneSource, vocabDayKey]);
  let axisCandidate: ProfileAxisId | null = null;
  let axisSourceTag: "query" | "storage" | "default" | null = null;
  if (axisOverrideParam) {
    axisCandidate = axisOverrideParam;
    axisSourceTag = "query";
  } else if (storedMindAxis) {
    axisCandidate = storedMindAxis;
    axisSourceTag = "storage";
  } else if (guidedDayOneSource) {
    axisCandidate = "clarity";
    axisSourceTag = "default";
  }
  const axisClusterParam = axisCandidate ? getGuidedClusterParam(axisCandidate) : null;
  let clusterKeyForDebug: GuidedClusterParam | null = null;
  let clusterSourceTag: "lane" | "query" | "axis-query" | "axis-storage" | "axis-default" | "default" | null = null;
  if (rawClusterParam && rawClusterParam in CLUSTER_PARAM_MAP) {
    clusterKeyForDebug = rawClusterParam as GuidedClusterParam;
    clusterSourceTag = laneParam === "guided_day1" ? "lane" : "query";
  }
  if (!clusterKeyForDebug && axisClusterParam) {
    clusterKeyForDebug = axisClusterParam;
    if (axisSourceTag === "query") clusterSourceTag = "axis-query";
    else if (axisSourceTag === "storage") clusterSourceTag = "axis-storage";
    else if (axisSourceTag === "default") clusterSourceTag = "axis-default";
    else clusterSourceTag = "axis-query";
  }
  if (!clusterKeyForDebug && guidedDayOneSource) {
    clusterKeyForDebug = "clarity";
    if (!clusterSourceTag) {
      clusterSourceTag = "default";
    }
  }
  const clusterOverride =
    clusterKeyForDebug && clusterKeyForDebug in CLUSTER_PARAM_MAP
      ? CLUSTER_PARAM_MAP[clusterKeyForDebug as keyof typeof CLUSTER_PARAM_MAP]
      : null;
  const effectiveAxisId = axisCandidate;

  const rawLangParam = searchParams?.get("lang")?.toLowerCase() ?? null;
  const langOverride = rawLangParam === "en" ? "en" : rawLangParam === "ro" ? "ro" : null;

  const rawModeParam = searchParams?.get("mode")?.toLowerCase() ?? null;
  const modeOverride =
    rawModeParam === "short" ? "short" : rawModeParam === "deep" ? "deep" : rawModeParam === "quick" ? "short" : null;

  const rawModuleParam = searchParams?.get("module")?.toLowerCase() ?? null;
  const moduleOverride = rawModuleParam && rawModuleParam.length > 0 ? rawModuleParam : null;
  const guidedDayOneE2E = guidedDayOneSource && e2eParamActive;

  const decisionLang: DailyPathLanguage = langOverride ?? "ro";
  const isPremiumMember = membershipTier === "premium";
  const manualClusterOverrideRequested = Boolean(rawClusterParam) && laneParam !== "guided_day1";
  const manualClusterOverride =
    manualClusterOverrideRequested && rawClusterParam && rawClusterParam in CLUSTER_PARAM_MAP
      ? CLUSTER_PARAM_MAP[rawClusterParam as keyof typeof CLUSTER_PARAM_MAP]
      : null;
  const manualLangOverrideRequested = Boolean(rawLangParam);
  const manualModeOverrideRequested = Boolean(rawModeParam);
  const manualModuleOverrideRequested = Boolean(rawModuleParam);
  const qaQueryFlag = (searchParams?.get("qa") ?? "").toLowerCase() === "1";
  const overrideRequestPresent =
    manualClusterOverrideRequested ||
    manualLangOverrideRequested ||
    manualModeOverrideRequested ||
    manualModuleOverrideRequested ||
    qaQueryFlag;
  const qaOverrideActive = overrideRequestPresent && !guidedDayOneSource;
  const overrideSuppressed = guidedDayOneSource && overrideRequestPresent;
  const skipOnboardingParam = searchParams?.get("skipOnboarding") === "1";
  const debugSkipEnv = (process.env.NEXT_PUBLIC_DEBUG_SKIP_ONBOARDING || "").toLowerCase();
  const debugSkipEnabled = debugSkipEnv === "true" || debugSkipEnv === "1";
  const skipOnboarding = skipOnboardingParam || debugSkipEnabled;
  const debugFlagEnv = (process.env.NEXT_PUBLIC_TODAY_RUN_DEBUG || "").toLowerCase();
  const debugParamEnabled = (searchParams?.get("debug") ?? "").toLowerCase() === "1";
  const debugEnabled = debugParamEnabled || debugFlagEnv === "1" || debugFlagEnv === "true";
  useEffect(() => {
    if (guidedDayOneSource) {
      setCatProfile(null);
      setOnboardingStatusState(null);
      setHasCompletedOnboarding(true);
      setOnboardingReady(true);
      return;
    }
    if (!user?.uid) {
      setCatProfile(null);
      setOnboardingStatusState(null);
      setHasCompletedOnboarding(qaOverrideActive || skipOnboarding);
      setOnboardingReady(true);
      return;
    }
    let cancelled = false;
    setOnboardingReady(false);
    (async () => {
      try {
        const [status, profileDoc] = await Promise.all([
          getOnboardingStatus(user.uid),
          getCatProfile(user.uid),
        ]);
        if (cancelled) return;
        setCatProfile(profileDoc);
        setOnboardingStatusState(status);
        setHasCompletedOnboarding(status.allDone || qaOverrideActive || skipOnboarding);
      } catch (error) {
        console.warn("Failed to load onboarding status", error);
      } finally {
        if (!cancelled) {
          setOnboardingReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guidedDayOneSource, router, user?.uid, qaOverrideActive, skipOnboarding]);

  useEffect(() => {
    if (guidedDayOneSource) {
      setCompetence(null);
      return;
    }
    if (!user?.uid) {
      setCompetence(null);
      return;
    }
    let cancelled = false;
    void getUserCompetence(user.uid)
      .then((data) => {
        if (!cancelled) setCompetence(data);
      })
      .catch((error) => {
        console.warn("Failed to load competence", error);
        if (!cancelled) setCompetence(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guidedDayOneSource, user?.uid]);

useEffect(() => {
  if (!user?.uid || !dailyDecision || qaOverrideActive) {
    setDailyCompletedToday(false);
    setDailyStreak({ current: 0, best: 0 });
    setWeeklyStats({ completed: 0, total: 7 });
    return;
  }
  let cancelled = false;
  const todayLocalKey = formatLocalDateKey(new Date());
  const checkHistory = async () => {
    try {
      const history = await getDailyPracticeHistory(user.uid, 30);
      if (cancelled) return;
      const completionKeys = new Set<string>();
      const completedEntry = history.find((entry) => {
        const entryLocalKey = getEntryLocalKey(entry);
        if (entry.completed && entryLocalKey) {
          completionKeys.add(entryLocalKey);
        }
        if (
          entry.completed &&
          entry.cluster === dailyDecision.cluster &&
          entry.mode === dailyDecision.mode &&
          entryLocalKey === todayLocalKey
        ) {
          return true;
        }
        return false;
      });
      setDailyCompletedToday(Boolean(completedEntry));
      setDailyStreak(computeLocalStreakStats(completionKeys));
      let completedCount = 0;
      const cursor = new Date();
      for (let i = 0; i < 7; i += 1) {
        const key = formatLocalDateKey(cursor);
        if (completionKeys.has(key)) {
          completedCount += 1;
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      setWeeklyStats({ completed: completedCount, total: 7 });
    } catch (error) {
      console.warn("Failed to check daily practice history", error);
      if (!cancelled) {
        setDailyCompletedToday(false);
        setDailyStreak({ current: 0, best: 0 });
        setWeeklyStats({ completed: 0, total: 7 });
      }
    }
  };
  void checkHistory();
  return () => {
    cancelled = true;
  };
}, [user?.uid, dailyDecision, qaOverrideActive]);

  const axisMeta = useMemo(() => {
    const map = new Map<LegacyCatAxisId, { label: string }>();
    for (const axis of CAT_AXES) {
      map.set(axis.id, { label: axis.label });
    }
    return map;
  }, []);

  const { cluster, primaryAxis } = useMemo(
    () => deriveAdaptiveClusterFromCat(catProfile),
    [catProfile],
  );

  const derivedAxisLabel = primaryAxis ? axisMeta.get(primaryAxis)?.label ?? null : null;
  const axisLabelFallback = derivedAxisLabel;

  const [plannerCalled, setPlannerCalled] = useState(false);

  useEffect(() => {
    if (!onboardingReady || qaOverrideActive) {
      setPlannerCalled(false);
      return;
    }
    if (guidedDayOneSource) {
      setDecisionLoading(false);
      setPlannerCalled(false);
      return;
    }
    let cancelled = false;
    setDecisionLoading(true);
    setPlannerCalled(true);
    setDailyDecision(null);
    void decideNextDailyPath({
      userId: user?.uid ?? null,
      catProfile,
      lang: decisionLang,
    })
      .then((result) => {
        if (!cancelled) {
          setDailyDecision(result);
        }
      })
      .catch((error) => {
        console.warn("decideNextDailyPath failed", error);
        if (!cancelled) {
          const fallbackConfig = getDailyPathForCluster({
            cluster: "clarity_cluster",
            mode: "short",
            lang: decisionLang,
          });
          setDailyDecision({
            config: fallbackConfig,
            cluster: fallbackConfig.cluster,
            mode: fallbackConfig.mode,
            reason: "fallback: decideNextDailyPath failed",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setDecisionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    onboardingReady,
    user?.uid,
    catProfile,
    decisionLang,
    qaOverrideActive,
    guidedDayOneSource,
    clusterOverride,
  ]);

  useEffect(() => {
    if (!guidedDayOneSource || !clusterOverride) return;
    const targetCluster = clusterOverride;
    const preferredMode = modeOverride ?? "deep";
    const resolvedModule = resolveStarterModule(todayModuleKey ?? null, targetCluster);
    try {
      const config = getDailyPathForCluster({
        cluster: targetCluster,
        mode: preferredMode,
        lang: decisionLang,
        moduleKey: resolvedModule ?? undefined,
      });
      setDailyDecision({
        config,
        cluster: targetCluster,
        mode: preferredMode,
        reason: "guided_day1_direct",
        moduleKey: resolvedModule ?? config.moduleKey ?? null,
        skipPolicy: true,
      });
      setDecisionLoading(false);
    } catch (error) {
      console.warn("Failed to load guided Day1 daily path", error);
    }
  }, [clusterOverride, decisionLang, guidedDayOneSource, modeOverride, todayModuleKey]);

  const guidedDayOneModuleKey = useMemo(() => {
    if (!guidedDayOneSource) return null;
    const candidate = dailyDecision?.moduleKey ?? todayModuleKey ?? null;
    const targetCluster = dailyDecision?.cluster ?? clusterOverride ?? cluster ?? null;
    return resolveStarterModule(candidate, targetCluster);
  }, [guidedDayOneSource, dailyDecision?.moduleKey, dailyDecision?.cluster, todayModuleKey, clusterOverride, cluster]);

  const baseDailyPathConfig = useMemo(() => {
    if (qaOverrideActive) {
      const overrideCluster = clusterOverride ?? cluster ?? null;
      const overrideMode = modeOverride ?? "deep";
      const overrideLang = langOverride ?? "ro";
      const overrideModuleKey = moduleOverride ?? null;
      if (!overrideCluster) return null;
      try {
        return getDailyPathForCluster({
          cluster: overrideCluster,
          mode: overrideMode,
          lang: overrideLang,
          moduleKey: overrideModuleKey ?? undefined,
        });
      } catch (error) {
        console.warn("Failed to load QA override daily path", error);
        return null;
      }
    }
    if (!dailyDecision) return null;
    if (guidedDayOneModuleKey && guidedDayOneModuleKey !== dailyDecision.moduleKey) {
      try {
        return getDailyPathForCluster({
          cluster: dailyDecision.cluster,
          mode: dailyDecision.mode,
          lang: dailyDecision.config.lang,
          moduleKey: guidedDayOneModuleKey,
        });
      } catch (error) {
        console.warn("Failed to load guided Day1 daily path", error);
      }
    }
    return dailyDecision.config;
  }, [
    qaOverrideActive,
    clusterOverride,
    cluster,
    modeOverride,
    langOverride,
    moduleOverride,
    dailyDecision,
    guidedDayOneModuleKey,
  ]);

  useEffect(() => {
    setTimeModeOverride(null);
    setTimeModeHint(null);
    setTimeSelectionMinutes(null);
    setSoftGatePreview(false);
  }, [baseDailyPathConfig?.id]);

  useEffect(() => {
    if (!guidedDayOneSource || !baseDailyPathConfig) return;
    if (timeSelectionMinutes != null) return;
    const fallback = baseDailyPathConfig.mode === "short" ? 7 : 15;
    setTimeSelectionMinutes(fallback);
  }, [baseDailyPathConfig, guidedDayOneSource, timeSelectionMinutes]);

  const userOverallLevel: CompetenceLevel = useMemo(() => {
    return competence ? getUserOverallLevel(competence) : "foundation";
  }, [competence]);

  useEffect(() => {
    if (!competence) {
      setCurrentArc(null);
      return;
    }
    let cancelled = false;
    if (!user?.uid) {
      setCurrentArc(selectArcForUser(userOverallLevel));
      return () => {
        cancelled = true;
      };
    }
    void ensureCurrentArcForUser(user.uid, userOverallLevel)
      .then(({ arc }) => {
        if (!cancelled) setCurrentArc(arc);
      })
      .catch((error) => {
        console.warn("ensureCurrentArcForUser failed", error);
        if (!cancelled) setCurrentArc(selectArcForUser(userOverallLevel));
      });
    return () => {
      cancelled = true;
    };
  }, [competence, userOverallLevel, user?.uid]);

  const handleTimeSelection = useCallback(
    (minutes: number) => {
      if (!baseDailyPathConfig) return;
      setTimeSelectionMinutes(minutes);
      const baseline: DecisionBaseline = {
        cluster: baseDailyPathConfig.cluster,
        mode: baseDailyPathConfig.mode,
        lang: baseDailyPathConfig.lang,
        reason: dailyDecision?.reason ?? (qaOverrideActive ? "qa_override" : "time_selection"),
        historyCount: dailyDecision ? 1 : 0,
        configId: baseDailyPathConfig.id,
      };
      const policyDecision = applyDecisionPolicyV2(baseline, { timeAvailableMin: minutes });
      setTimeModeHint(policyDecision.mode);
      setTimeModeOverride(
        policyDecision.mode === baseDailyPathConfig.mode ? null : policyDecision.mode,
      );
    },
    [baseDailyPathConfig, dailyDecision, qaOverrideActive],
  );

  const decisionReason = useMemo(() => {
    if (qaOverrideActive) {
      return "QA override active";
    }
    if (!dailyDecision) return null;
    const overrides: string[] = [];
    if (manualClusterOverride) overrides.push(`cluster=${manualClusterOverride}`);
    if (modeOverride) overrides.push(`mode=${modeOverride}`);
    if (langOverride) overrides.push(`lang=${langOverride}`);
    if (!overrides.length) return dailyDecision.reason;
    return `${dailyDecision.reason} | override ${overrides.join(", ")}`;
  }, [dailyDecision, manualClusterOverride, modeOverride, langOverride, qaOverrideActive]);

  const moduleKeyForSelection = useMemo(() => {
    if (guidedDayOneModuleKey) {
      return guidedDayOneModuleKey;
    }
    if (qaOverrideActive) {
      return moduleOverride ?? null;
    }
    return dailyDecision?.moduleKey ?? todayModuleKey ?? null;
  }, [guidedDayOneModuleKey, qaOverrideActive, moduleOverride, dailyDecision?.moduleKey, todayModuleKey]);

  const resolvedDailyPathConfig = useMemo(() => {
    if (!baseDailyPathConfig) return null;
    if (!timeModeOverride || timeModeOverride === baseDailyPathConfig.mode) {
      return baseDailyPathConfig;
    }
    try {
      return getDailyPathForCluster({
        cluster: baseDailyPathConfig.cluster,
        mode: timeModeOverride,
        lang: baseDailyPathConfig.lang,
        moduleKey: moduleKeyForSelection ?? undefined,
      });
    } catch (error) {
      console.warn("Failed to load mode override daily path", error);
      return baseDailyPathConfig;
    }
  }, [baseDailyPathConfig, timeModeOverride, moduleKeyForSelection]);

  const wowDayIndex = useMemo(() => {
    const key = moduleKeyForSelection ?? resolvedDailyPathConfig?.moduleKey ?? null;
    return getWowDayIndex(key ?? null);
  }, [moduleKeyForSelection, resolvedDailyPathConfig?.moduleKey]);
  const isWowActive = Boolean(wowDayIndex);
  const catUnlocked = onboardingStatusState?.catBaselineDone ?? false;

  const finalCluster = resolvedDailyPathConfig?.cluster ?? clusterOverride ?? cluster ?? null;
  const axisLabel = resolvedDailyPathConfig
    ? CLUSTER_FRIENDLY_LABELS[resolvedDailyPathConfig.cluster]
    : axisLabelFallback;
  const dailyLoopReady = guidedDayOneSource || hasCompletedOnboarding || qaOverrideActive || Boolean(onboardingStatusState?.catBaselineDone);
  const canRunDailyPath = dailyLoopReady || softGatePreview;
  const showLoader =
    (!guidedDayOneSource && !onboardingReady) || (!qaOverrideActive && decisionLoading) || !resolvedDailyPathConfig;
  const showGuestBanner = Boolean(user?.isAnonymous);
  const upgradeWelcomeCopy =
    decisionLang === "en"
      ? "Welcome back with full access. Let's continue with today's Path."
      : "Bine ai revenit cu acces complet. Continuăm cu Path-ul de azi.";
  const freeModeCopy =
    decisionLang === "en"
      ? "Free mode active: 1 guided Path/day (soft nodes). Upgrade anytime for full history and adaptive rotations."
      : "Mod gratuit activ: 1 Path ghidat/zi (soft nodes). Poți activa planul pentru istoric complet și adaptare.";
  const missionText = finalCluster ? ADAPTIVE_NUDGES[finalCluster] : null;
  const vocabUiCopy = useMemo(
    () => ({
      title: decisionLang === "en" ? "Word of the day" : "Cuvântul de azi",
      subtitle: decisionLang === "en" ? "One reflex. Use it today." : "Un reflex. Îl folosești azi.",
      detail: decisionLang === "en" ? "Use it before the first exercise." : "Aplică-l înainte de primul exercițiu.",
      start: decisionLang === "en" ? "Start" : "Încep",
      skip: decisionLang === "en" ? "Skip" : "Sari peste",
      save: decisionLang === "en" ? "Save to vocabulary" : "Salvează în vocabular",
      locale: decisionLang === "en" ? ("en" as const) : ("ro" as const),
    }),
    [decisionLang],
  );
  const showQaPanel = QA_PANEL_ENABLED && !guidedDayOneSource;
  const calibrationBypass = guidedDayOneSource;
  const planSourceTag = guidedDayOneSource
    ? clusterSourceTag ?? "default"
    : plannerCalled
      ? "planner"
      : qaOverrideActive
        ? "qa"
        : "unknown";
  const renderDebugBanner = () => {
    if (!debugEnabled) return null;
    return (
      <div className="fixed top-4 right-4 z-50 max-w-xs rounded-xl bg-black/80 px-4 py-3 text-[11px] text-white shadow-lg">
        <p>source: {rawSourceParam || "—"}</p>
        <p>lane: {laneParam || "n/a"}</p>
        <p>axis: {effectiveAxisId ?? "n/a"} ({axisSourceTag ?? "n/a"})</p>
        <p>cluster: {clusterOverride ?? cluster ?? "n/a"} ({clusterSourceTag ?? "n/a"})</p>
        <p>calibrationBypass: {calibrationBypass ? "yes" : "no"}</p>
        <p>qaOverride: {qaOverrideActive ? "active" : "inactive"}</p>
        <p>overrideSuppressed: {overrideSuppressed ? "yes" : "no"}</p>
        <p>plannerCalled: {plannerCalled ? "yes" : "no"}</p>
        <p>planSource: {planSourceTag}</p>
      </div>
    );
  };
  const guidedLaneBadge = guidedDayOneSource && debugEnabled ? (
    <div className="fixed bottom-4 left-4 z-40 rounded-lg bg-black/80 px-3 py-2 text-[11px] text-white shadow-lg">
      <p className="font-semibold">GuidedDay1LaneDebug</p>
      <p>axisSource: {axisSourceTag ?? "n/a"}</p>
      <p>clusterSource: {clusterSourceTag ?? "n/a"}</p>
      <p>planSource: {planSourceTag}</p>
      <p>plannerCalled: {plannerCalled ? "yes" : "no"}</p>
      <p>overrideSuppressed: {overrideSuppressed ? "yes" : "no"}</p>
    </div>
  ) : null;
  const vocabAlreadyUnlocked = vocabPrimer ? unlockedVocabIds.includes(vocabPrimer.vocabId) : true;
  const targetVocabAxis = useMemo<ProfileAxisId>(() => {
    const clusterCandidate = resolvedDailyPathConfig?.cluster ?? dailyDecision?.cluster ?? cluster ?? null;
    const clusterAxis = clusterCandidate ? CLUSTER_TO_VOCAB_AXIS[clusterCandidate] ?? null : null;
    if (clusterAxis) return clusterAxis;
    const profileAxis =
      mapLegacyAxisToProfile(catProfile?.weakestAxis) ?? mapLegacyAxisToProfile(inferLegacyWeakestAxis(catProfile));
    return profileAxis ?? "clarity";
  }, [resolvedDailyPathConfig?.cluster, dailyDecision?.cluster, cluster, catProfile]);
  const showDailyCompletedState = dailyCompletedToday && !qaOverrideActive && !guidedDayOneSource;

  useEffect(() => {
    if (!qaOverrideActive && !dailyLoopReady) {
      gatingStartRef.current = Date.now();
      return () => {
        gatingStartRef.current = null;
      };
    }
    gatingStartRef.current = null;
    return undefined;
  }, [dailyLoopReady, qaOverrideActive]);

  useEffect(() => {
    if (dailyLoopReady) {
      setSoftGatePreview(false);
    }
  }, [dailyLoopReady]);

  useEffect(() => {
    if (typeof window === "undefined" || !vocabDayKey) return;
    if (showDailyCompletedState) {
      setVocabPrimer(null);
      return;
    }
    const unlocked = getUnlockedVocabIds();
    setUnlockedVocabIds(unlocked);
    if (wasVocabShownToday(vocabDayKey)) {
      setVocabPrimer(null);
      return;
    }
    const card = pickWordOfDay({ axisId: targetVocabAxis, unlockedIds: unlocked, dayKey: vocabDayKey });
    setVocabPrimer({ dayKey: vocabDayKey, vocabId: card.id, axisId: card.axisId });
  }, [targetVocabAxis, showDailyCompletedState, vocabDayKey]);

  useEffect(() => {
    if (!vocabPrimer || showDailyCompletedState) return;
    const key = `${vocabPrimer.dayKey}:${vocabPrimer.vocabId}`;
    if (vocabImpressionRef.current === key) return;
    track("vocab_today_shown", {
      vocabId: vocabPrimer.vocabId,
      axisId: vocabPrimer.axisId,
      surface: "today_pre",
    });
    vocabImpressionRef.current = key;
  }, [vocabPrimer, showDailyCompletedState]);

  const handleSoftPreviewRequest = useCallback(() => {
    setSoftGatePreview(true);
    if (qaOverrideActive) return;
    const dwell = gatingStartRef.current != null ? Math.max(0, Date.now() - gatingStartRef.current) : null;
    void recordDailyRunnerEvent({
      type: "soft_gate_preview",
      dwellMs: dwell ?? undefined,
      context: "calibration_gate",
    });
  }, [qaOverrideActive]);

  const handleVocabDismiss = useCallback(
    (action: "start" | "skip") => {
      if (!vocabPrimer || !vocabDayKey) return;
      markVocabShownToday(vocabDayKey);
      setShownVocabIdForToday(vocabDayKey, vocabPrimer.vocabId);
      setVocabPrimer(null);
      if (action === "skip") {
        track("vocab_today_skipped", {
          vocabId: vocabPrimer.vocabId,
          axisId: vocabPrimer.axisId,
          surface: "today_pre",
        });
      }
    },
    [vocabPrimer, vocabDayKey],
  );

  const handleVocabSave = useCallback(() => {
    if (!vocabPrimer) return;
    const updated = unlockVocab(vocabPrimer.vocabId);
    setUnlockedVocabIds(updated);
    track("vocab_today_saved", {
      vocabId: vocabPrimer.vocabId,
      axisId: vocabPrimer.axisId,
      surface: "today_pre",
    });
    void recordDailyRunnerEvent({
      type: "vocab_completed",
      optionId: vocabPrimer.vocabId,
      label: vocabPrimer.vocabId,
      mode: "primer",
      context: "today_vocab",
    });
  }, [vocabPrimer]);

  const handleGuidedExit = useCallback(() => {
    if (typeof window !== "undefined") {
      const confirmText =
        decisionLang === "ro"
          ? "Vrei să ieși din sesiunea ghidată? Progresul de azi va rămâne în această sesiune."
          : "Leave the guided session? Progress from today stays inside this flow.";
      if (!window.confirm(confirmText)) {
        return;
      }
    }
    const target = e2eParamActive ? "/today?e2e=1" : "/today";
    router.push(target);
  }, [decisionLang, e2eParamActive, router]);

  if (guidedDayOneE2E) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)]"
        data-testid="guided-day1-e2e"
      >
        <p className="text-center text-lg font-semibold">Simulated Guided Day 1 session</p>
        <p className="max-w-md text-center text-sm text-[var(--omni-muted)]">
          Modul e în e2e. Apasă butonul de mai jos pentru a marca sesiunea ca finalizată și a continua spre pasul următor.
        </p>
        <OmniCtaButton
          className="w-full max-w-sm justify-center"
          data-testid="session-finish-button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            onCompleted?.();
          }}
        >
          Finalizează sesiunea
        </OmniCtaButton>
      </main>
    );
  }

  const defaultHeader = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={goToAuth}
    />
  );

  const guidedHeader = (
    <div className="flex items-center justify-between px-4 py-3 text-[var(--omni-ink)]">
      <Link href="/intro" className="flex items-center gap-2 font-semibold tracking-wide">
        <span className="text-lg">OmniMental</span>
        <span className="text-[10px] uppercase tracking-[0.4em] text-[var(--omni-muted)]">Guided Day 1</span>
      </Link>
      <button
        type="button"
        onClick={handleGuidedExit}
        className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)] hover:border-[var(--omni-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--omni-ink)]"
      >
        {decisionLang === "ro" ? "Ieși" : "Exit"}
      </button>
    </div>
  );

  const header = guidedDayOneSource ? guidedHeader : defaultHeader;

  return (
    <>
      {renderDebugBanner()}
      {guidedLaneBadge}
      <AppShell header={header}>
        <div className="w-full min-h-screen" style={{ background: "var(--omni-gradient-shell)" }}>
        <div className="px-4 py-8 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          {showQaPanel ? <DailyPathQaPanel reason={decisionReason} basePath={entryPath} /> : null}
          {showLoader ? (
            <div className="rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              Calibrăm traseul tău adaptiv…
            </div>
          ) : canRunDailyPath ? (
            <div className="space-y-6">
              <div className="mx-auto w-full max-w-[440px] px-4 pt-4 md:max-w-none md:px-0 md:pt-0">
                <div className="space-y-6">
                  {!dailyLoopReady ? (
                    <DailyLoopFallback
                      status={onboardingStatusState}
                      showDebugLinks={debugEnabled}
                      lang={decisionLang}
                      variant="inline"
                    />
                  ) : null}
                  {!guidedDayOneSource && isWowActive && wowDayIndex ? (
                    <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-xs font-semibold text-[var(--omni-muted)]">
                      Foundation Cycle · {wowDayIndex}/15
                    </div>
                  ) : null}
                  {!guidedDayOneSource && dailyLoopReady ? (
                    <div className="space-y-3">
                      {dailyStreak.current > 0 || dailyStreak.best > 0 ? (
                        <DailyStreakCallout lang={decisionLang} streak={dailyStreak.current} best={dailyStreak.best} />
                      ) : null}
                      <WeeklyCheckpointCard lang={decisionLang} stats={weeklyStats} />
                    </div>
                  ) : null}
                  {!guidedDayOneSource && isWowActive && wowDayIndex ? (
                    <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-xs font-semibold text-[var(--omni-muted)]">
                      Foundation Cycle · {wowDayIndex}/15
                    </div>
                  ) : null}
                  {!guidedDayOneSource && isWowActive && wowDayIndex ? (
                    <div className="rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                        <span>Foundation Cycle</span>
                        <span className="font-semibold text-[var(--omni-ink)]/70">WOW · Day {wowDayIndex}/15</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[var(--omni-ink)]">
                        {catUnlocked
                          ? "Diagnosticul CAT este complet. Ai deblocat Foundation Cycle (15 zile ghidate)."
                          : "Ai intrat în Foundation Cycle (15 zile ghidate)."}
                      </p>
                      <p className="mt-1 text-xs text-[var(--omni-ink)]/70">
                        Respira adânc, fixează intenția și intră în ziua {wowDayIndex}. După aceste 15 zile intri în modul adaptativ complet.
                      </p>
                    </div>
                  ) : null}
                  {!guidedDayOneSource ? <AdaptiveMissionCard axisLabel={axisLabel} nudge={missionText} /> : null}
                  {!guidedDayOneSource && cameFromUpgradeSuccess ? (
                    <div className="rounded-[18px] border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                      {upgradeWelcomeCopy}
                    </div>
                  ) : null}
                  {!guidedDayOneSource && !isPremiumMember ? (
                    <div className="rounded-[18px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 text-sm text-[var(--omni-ink)]/90">
                      {freeModeCopy}
                    </div>
                  ) : null}
                  {!guidedDayOneSource && currentArc ? <CurrentArcCard arc={currentArc} /> : null}
                  {!guidedDayOneSource && !showDailyCompletedState && vocabPrimer ? (
                    <div className="rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]/95 px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">{vocabUiCopy.title}</p>
                          <p className="text-sm text-[var(--omni-ink)]/80">{vocabUiCopy.subtitle}</p>
                          <p className="text-xs text-[var(--omni-muted)]">{vocabUiCopy.detail}</p>
                        </div>
                        <VocabCard
                          vocabId={vocabPrimer.vocabId}
                          size="mini"
                          locale={vocabUiCopy.locale}
                          className="px-4 py-4 sm:px-6"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleVocabDismiss("start")}
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--omni-energy)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white sm:flex-none sm:text-sm"
                          >
                            {vocabUiCopy.start}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVocabDismiss("skip")}
                            className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-xs font-semibold text-[var(--omni-ink)] sm:flex-none sm:text-sm"
                          >
                            {vocabUiCopy.skip}
                          </button>
                        </div>
                        {!vocabAlreadyUnlocked ? (
                          <button
                            type="button"
                            onClick={handleVocabSave}
                            className="text-xs font-semibold text-[var(--omni-energy)] hover:underline"
                          >
                            {vocabUiCopy.save}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {showDailyCompletedState ? (
                      <DailyPathCompletedCard
                        lang={resolvedDailyPathConfig?.lang ?? decisionLang}
                        showArenasCta={foundationDone}
                      />
                  ) : (
                    <DailyPath
                      key={resolvedDailyPathConfig?.id ?? "none"}
                      config={resolvedDailyPathConfig}
                      userId={user?.uid ?? null}
                      currentArcId={currentArc?.id ?? null}
                      disablePersistence={qaOverrideActive}
                      defaultTimeSelection={timeSelectionMinutes}
                      modeHint={timeModeHint ?? resolvedDailyPathConfig?.mode ?? null}
                      onTimeSelection={handleTimeSelection}
                      onCompleted={() =>
                        onCompleted?.(resolvedDailyPathConfig?.id ?? null, resolvedDailyPathConfig?.moduleKey ?? null)
                      }
                      streakDays={dailyStreak.current}
                      bestStreakDays={dailyStreak.best}
                      decisionReason={decisionReason}
                      policyReason={dailyDecision?.policyReason ?? null}
                      vocabDayKey={vocabDayKey}
                      uiMode={guidedDayOneSource ? "guided_day1" : "default"}
                    />
                  )}
                </div>
              </div>
              {!guidedDayOneSource && showGuestBanner ? <GuestBanner onCreateAccount={goToAuth} /> : null}
              {debugEnabled ? <ArcStateDebugPanel /> : null}
            </div>
          ) : (
            <DailyLoopFallback
              status={onboardingStatusState}
              showDebugLinks={debugEnabled}
              lang={decisionLang}
              variant="full"
              onPreviewRequest={handleSoftPreviewRequest}
            />
          )}
        </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

function DailyPathQaPanel({ reason, basePath }: { reason?: string | null; basePath: string }) {
  const router = useRouter();
  const combos = QA_CLUSTER_OPTIONS.flatMap((clusterOption) =>
    QA_MODE_OPTIONS.flatMap((modeOption) =>
      QA_LANG_OPTIONS.map((langOption) => ({
        cluster: clusterOption,
        mode: modeOption,
        lang: langOption,
        key: `${clusterOption.param}-${modeOption.value}-${langOption.value}`,
      })),
    ),
  );

  return (
    <section className="mb-6 rounded-[16px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4 text-sm text-[var(--omni-ink)] shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-[var(--omni-ink)]">DailyPath QA Links</p>
        <code className="text-[11px] uppercase tracking-[0.25em] text-[var(--omni-muted)]">
          NEXT_PUBLIC_SHOW_QA_LINKS=true
        </code>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {combos.map(({ cluster, mode, lang, key }) => {
          const search = new URLSearchParams({
            cluster: cluster.param,
            mode: mode.value,
            lang: lang.value,
            qa: "1",
          }).toString();
          const href = `${basePath}?${search}`;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.assign(href);
                } else {
                  router.push(href);
                }
              }}
              className="w-full rounded-[12px] border border-[var(--omni-border-soft)] px-3 py-2 text-left text-[13px] font-medium transition hover:bg-[var(--omni-bg-main)]"
            >
              {cluster.label} · {mode.label} · {lang.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-[var(--omni-muted)]">
        Tip: add <code className="px-1">module=energy_congruence</code> (energy_recovery / clarity_single_intent / clarity_one_important_thing / emotional_flex_pause / emotional_flex_naming) to the URL to load a specific module.
      </p>
      {reason ? (
        <p className="mt-3 text-[12px] text-[var(--omni-muted)]">Reason: {reason}</p>
      ) : null}
    </section>
  );
}

function AdaptiveMissionCard({ axisLabel, nudge }: { axisLabel: string | null; nudge: string | null }) {
  return (
    <section className="space-y-3 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Misiunea adaptivă de azi</p>
      <h2 className="text-lg font-semibold text-[var(--omni-ink)]">{axisLabel ?? "Completează profilul OmniMental"}</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">
        {nudge ?? "Finalizează CAT Baseline și Adaptive Practice pentru a primi o misiune adaptată profilului tău."}
      </p>
    </section>
  );
}

type CalibrationStepId = "cat" | "pillars" | "adaptive";

type CalibrationStep = {
  id: CalibrationStepId;
  title: string;
  subtitle: string;
  duration: string;
  domains: string[];
  kpis: string[];
  actionLabel: string;
  href: string;
};

const CALIBRATION_STEP_COPY: Record<DailyPathLanguage, CalibrationStep[]> = {
  ro: [
    {
      id: "cat",
      title: "CAT Baseline",
      subtitle: "Diagnoză digitală pentru control executiv + claritate decizională.",
      duration: "8–10 min",
      domains: ["Control executiv", "Claritate decizională"],
      kpis: ["Error rate sub interferență", "Latență decizie"],
      actionLabel: "Pornește CAT",
      href: CAT_BASELINE_URL,
    },
    {
      id: "pillars",
      title: "Pilonii OmniMental",
      subtitle: "Stabilești rutină pentru reglare emoțională + energie funcțională.",
      duration: "5–7 min",
      domains: ["Reglare emoțională", "Energie funcțională"],
      kpis: ["Timp de recuperare", "Curba de oboseală cognitivă"],
      actionLabel: "Deschide Pilonii",
      href: PILLARS_URL,
    },
    {
      id: "adaptive",
      title: "Adaptive Practice",
      subtitle: "Testăm transferul real și calibrăm provocările zilnice.",
      duration: "10+ min",
      domains: ["Control executiv", "Reglare emoțională"],
      kpis: ["Finalizare", "Degradare sub presiune"],
      actionLabel: "Pornește Adaptive Practice",
      href: ADAPTIVE_PRACTICE_URL,
    },
  ],
  en: [
    {
      id: "cat",
      title: "CAT Baseline",
      subtitle: "Digital diagnosis for executive control + decision clarity.",
      duration: "8–10 min",
      domains: ["Executive control", "Decision clarity"],
      kpis: ["Error rate under interference", "Decision latency"],
      actionLabel: "Start CAT",
      href: CAT_BASELINE_URL,
    },
    {
      id: "pillars",
      title: "OmniMental Pillars",
      subtitle: "Stabilizes routines for emotional regulation + functional energy.",
      duration: "5–7 min",
      domains: ["Emotional regulation", "Functional energy"],
      kpis: ["Recovery time", "Cognitive fatigue curve"],
      actionLabel: "Open Pillars",
      href: PILLARS_URL,
    },
    {
      id: "adaptive",
      title: "Adaptive Practice",
      subtitle: "Measures real-world transfer and calibrates the daily challenges.",
      duration: "10+ min",
      domains: ["Executive control", "Emotional regulation"],
      kpis: ["Completion", "Drop-off under pressure"],
      actionLabel: "Start Adaptive Practice",
      href: ADAPTIVE_PRACTICE_URL,
    },
  ],
};

const CALIBRATION_COPY: Record<
  DailyPathLanguage,
  {
    badge: string;
    title: string;
    description: string;
    progressLabel: string;
    domainLabel: string;
    kpiLabel: string;
    doneLabel: string;
    pendingLabel: string;
    primaryCta: string;
    previewCta: string;
    previewHelper: string;
    inlineNotice: string;
    inlineReminder: string;
  }
> = {
  ro: {
    badge: "Calibration Mission",
    title: "Conectăm backbone-ul științific și cel de produs",
    description:
      "Completează calibrările ca să măsurăm control executiv, claritate decizională, reglare emoțională și energie funcțională.",
    progressLabel: "calibrări",
    domainLabel: "Domenii",
    kpiLabel: "KPI urmăriți",
    doneLabel: "gata",
    pendingLabel: "în lucru",
    primaryCta: "Finalizează calibrările",
    previewCta: "Vezi misiunea demo (5–7 min)",
    previewHelper: "Modul demo îți arată structura fără scoruri complete și fără istoricul complet.",
    inlineNotice: "Ești în modul demo. Datele științifice sunt limitate până finalizezi calibrările.",
    inlineReminder: "Finalizează calibrările ca să deblocăm recomandările și scorurile exacte.",
  },
  en: {
    badge: "Calibration Mission",
    title: "Sync the scientific backbone with the product backbone",
    description:
      "Finish the three calibrations so we can measure executive control, decision clarity, emotional regulation, and functional energy.",
    progressLabel: "calibrations",
    domainLabel: "Domains",
    kpiLabel: "Tracked KPIs",
    doneLabel: "done",
    pendingLabel: "pending",
    primaryCta: "Finish calibrations",
    previewCta: "Preview mission (5–7 min)",
    previewHelper: "The demo mode shows structure only—no full scores or history until calibrations are done.",
    inlineNotice: "You’re in demo mode. Scientific data stays limited until calibrations are complete.",
    inlineReminder: "Complete the calibrations to unlock precise recommendations and scoring.",
  },
};

function DailyLoopFallback({
  status,
  showDebugLinks,
  lang,
  variant = "full",
  onPreviewRequest,
}: {
  status: OnboardingStatus | null;
  showDebugLinks: boolean;
  lang: DailyPathLanguage;
  variant?: "inline" | "full";
  onPreviewRequest?: () => void;
}) {
  const copy = CALIBRATION_COPY[lang] ?? CALIBRATION_COPY.ro;
  const stepCopy = CALIBRATION_STEP_COPY[lang] ?? CALIBRATION_STEP_COPY.ro;
  const steps = stepCopy.map((step) => {
    const done =
      step.id === "cat"
        ? status?.catBaselineDone
        : step.id === "pillars"
        ? status?.pillarsDone
        : status?.adaptivePracticeDone;
    return { ...step, done: Boolean(done) };
  });
  const completedCount = steps.filter((step) => step.done).length;
  const firstPending = steps.find((step) => !step.done);
  const isInline = variant === "inline";
  const containerClasses = isInline
    ? "space-y-3 rounded-[18px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-4 text-[var(--omni-ink)]"
    : "space-y-5 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-[var(--omni-ink)] shadow-[0_16px_40px_rgba(0,0,0,0.08)]";

  return (
    <section className={containerClasses}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{copy.badge}</p>
          <h2 className={isInline ? "text-lg font-semibold" : "text-2xl font-semibold"}>{copy.title}</h2>
          <p className="text-sm text-[var(--omni-ink)]/80">{copy.description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--omni-border-soft)] px-3 py-2 text-sm font-semibold text-[var(--omni-ink)]">
          <span className="text-xl">{completedCount}/3</span>
          <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">{copy.progressLabel}</span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4 text-left"
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              <span>{step.duration}</span>
              <span
                className={`rounded-full px-2 py-[2px] text-[10px] font-semibold ${
                  step.done ? "bg-[var(--omni-ink)] text-white" : "bg-[var(--omni-border-soft)] text-[var(--omni-muted)]"
                }`}
              >
                {step.done ? copy.doneLabel : copy.pendingLabel}
              </span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-[var(--omni-ink)]">{step.title}</h3>
            <p className="mt-1 text-sm text-[var(--omni-ink)]/80">{step.subtitle}</p>
            <p className="mt-3 text-[11px] text-[var(--omni-muted)]">
              <span className="font-semibold text-[var(--omni-ink)]/70">{copy.domainLabel}:</span>{" "}
              {step.domains.join(" · ")}
            </p>
            <p className="text-[11px] text-[var(--omni-muted)]">
              <span className="font-semibold text-[var(--omni-ink)]/70">{copy.kpiLabel}:</span>{" "}
              {step.kpis.join(" · ")}
            </p>
            <Link
              href={step.href}
              className="mt-3 inline-flex items-center text-[12px] font-semibold text-[var(--omni-ink)] hover:underline"
            >
              {step.actionLabel}
            </Link>
          </div>
        ))}
      </div>
      {isInline ? (
        <div className="rounded-[14px] border border-dashed border-[var(--omni-border-soft)] bg-white/70 px-4 py-3 text-xs text-[var(--omni-ink)]/80">
          <p>{copy.inlineNotice}</p>
          <p className="mt-1 text-[var(--omni-muted)]">{copy.inlineReminder}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <OmniCtaButton as="link" href={firstPending?.href ?? CAT_BASELINE_URL}>
              {copy.primaryCta}
            </OmniCtaButton>
            <button
              type="button"
              onClick={onPreviewRequest}
              disabled={!onPreviewRequest}
              className={`inline-flex items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold transition ${
                onPreviewRequest
                  ? "text-[var(--omni-ink)] hover:bg-[var(--omni-ink)]/5"
                  : "cursor-not-allowed text-[var(--omni-muted)]"
              }`}
            >
              {copy.previewCta}
            </button>
          </div>
          <p className="text-xs text-[var(--omni-muted)]">{copy.previewHelper}</p>
        </>
      )}
      {showDebugLinks ? (
        <div className="space-x-4 text-center text-xs text-[var(--omni-muted)]">
          <Link href={CAT_BASELINE_URL}>Open CAT Baseline</Link>
          <Link href={PILLARS_URL}>Open Pillars</Link>
          <Link href={ADAPTIVE_PRACTICE_URL}>Open Adaptive Practice</Link>
          <Link href="?skipOnboarding=1">Force Skip</Link>
        </div>
      ) : null}
    </section>
  );
}

function GuestBanner({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>Salvează-ți progresul pe toate dispozitivele – creează-ți cont OmniMental.</p>
        <OmniCtaButton size="sm" onClick={onCreateAccount}>
          Creează cont
        </OmniCtaButton>
      </div>
    </div>
  );
}

function DailyStreakCallout({ lang, streak, best }: { lang: DailyPathLanguage; streak: number; best: number }) {
  const copy =
    lang === "ro"
      ? {
          title: "Seria ta activă",
          body:
            streak > 0
              ? `Ai antrenat ${streak} ${streak === 1 ? "zi" : "zile"} la rând. Record: ${best} zile.`
              : `Record actual: ${best} ${best === 1 ? "zi" : "zile"}.`,
          cta: "Vezi ritmul",
        }
      : {
          title: "Active streak",
          body:
            streak > 0
              ? `You've trained ${streak} day${streak === 1 ? "" : "s"} in a row. Best streak: ${best} days.`
              : `Best streak so far: ${best} day${best === 1 ? "" : "s"}.`,
          cta: "View rhythm",
        };
  return (
    <div className="rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{copy.title}</p>
          <p className="font-semibold text-[var(--omni-ink)]">{copy.body}</p>
        </div>
        <Link
          href="/progress"
          className="inline-flex items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold text-[var(--omni-ink)] hover:bg-[var(--omni-ink)]/5"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}

function WeeklyCheckpointCard({
  lang,
  stats,
}: {
  lang: DailyPathLanguage;
  stats: { completed: number; total: number };
}) {
  const copy =
    lang === "ro"
      ? {
          title: "Checkpoint săptămânal",
          body: `Din ultimele ${stats.total} zile, ai închis ${stats.completed}.`,
          cta: "Checklist detaliat",
        }
      : {
          title: "Weekly checkpoint",
          body: `Out of the last ${stats.total} days you closed ${stats.completed}.`,
          cta: "Open details",
        };
  const ratio = stats.total > 0 ? Math.min(1, stats.completed / stats.total) : 0;
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 text-sm text-[var(--omni-ink)]">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{copy.title}</p>
          <p className="font-semibold text-[var(--omni-ink)]">{copy.body}</p>
        </div>
        <div className="h-2 w-full rounded-full bg-white/50">
          <div
            className="h-full rounded-full bg-[var(--omni-energy)] transition-all"
            style={{ width: `${Math.max(6, ratio * 100)}%` }}
          />
        </div>
        <Link
          href="/progress"
          className="inline-flex items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold text-[var(--omni-ink)] hover:bg-[var(--omni-ink)]/5"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}

function DailyPathCompletedCard({
  lang,
  showArenasCta,
}: {
  lang: DailyPathLanguage;
  showArenasCta: boolean;
}) {
  const copy =
    lang === "ro"
      ? {
          title: "Ai terminat Daily Path-ul de azi",
          body: showArenasCta
            ? "Păstrează progresul: vezi ce ai deblocat și testează nivelul 2 în Arene."
            : "Foundation Cycle continuă. Revino mâine pentru următoarea zi.",
          arenas: "Antrenează 90s în Arene",
          progress: "Vezi progresul",
        }
      : {
          title: "Today's Daily Path is complete",
          body: showArenasCta
            ? "Keep the momentum: review your progress and test Level 2 in Arenas."
            : "Foundation Cycle is still in progress. Come back tomorrow for the next day.",
          arenas: "Train 90s in Arenas",
          progress: "View progress",
        };
  return (
    <section className="space-y-4 rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-semibold text-[var(--omni-ink)]">{copy.title}</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">{copy.body}</p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        {showArenasCta ? (
          <OmniCtaButton as="link" href="/arenas">
            {copy.arenas}
          </OmniCtaButton>
        ) : null}
        <Link
          href="/progress"
          className="inline-flex items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-5 py-2 text-sm font-semibold text-[var(--omni-ink)] hover:bg-[var(--omni-ink)]/5"
        >
          {copy.progress}
        </Link>
      </div>
    </section>
  );
}
