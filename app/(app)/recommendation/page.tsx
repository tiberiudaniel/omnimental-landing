"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { getOnboardingStatus } from "@/lib/onboardingStatus";
import type { OnboardingStatus } from "@/lib/onboardingStatus";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { CAT_AXES, type CatAxisId } from "@/config/catEngine";
import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { NextDayDecision } from "@/lib/nextDayEngine";
import { decideNextDailyPath } from "@/lib/nextDayEngine";
import { applyDecisionPolicyV2, type DecisionBaseline } from "@/lib/decisionPolicyV2";
import { getUserCompetence, getUserOverallLevel } from "@/lib/competenceStore";
import { selectArcForUser } from "@/lib/arcs";
import { ensureCurrentArcForUser } from "@/lib/arcStateStore";
import { CAT_BASELINE_URL, PILLARS_URL, ADAPTIVE_PRACTICE_URL } from "@/config/routes";
import { getDailyPracticeHistory } from "@/lib/dailyPracticeStore";

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

function formatLocalDateKey(input: Date | number | string): string {
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationContent />
    </Suspense>
  );
}

function RecommendationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
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
  const [timeModeOverride, setTimeModeOverride] = useState<DailyPathMode | null>(null);
  const [timeModeHint, setTimeModeHint] = useState<DailyPathMode | null>(null);
  const [timeSelectionMinutes, setTimeSelectionMinutes] = useState<number | null>(null);
  const rawClusterParam = searchParams?.get("cluster")?.toLowerCase() ?? null;
  const clusterOverride =
    rawClusterParam && rawClusterParam in CLUSTER_PARAM_MAP
      ? CLUSTER_PARAM_MAP[rawClusterParam as keyof typeof CLUSTER_PARAM_MAP]
      : null;

  const rawLangParam = searchParams?.get("lang")?.toLowerCase() ?? null;
  const langOverride = rawLangParam === "en" ? "en" : rawLangParam === "ro" ? "ro" : null;

  const rawModeParam = searchParams?.get("mode")?.toLowerCase() ?? null;
  const modeOverride = rawModeParam === "short" ? "short" : rawModeParam === "deep" ? "deep" : null;

  const rawModuleParam = searchParams?.get("module")?.toLowerCase() ?? null;
  const moduleOverride = rawModuleParam && rawModuleParam.length > 0 ? rawModuleParam : null;

  const decisionLang: DailyPathLanguage = langOverride ?? "ro";
  const hasQaOverrideParams =
    Boolean(clusterOverride || langOverride || modeOverride || moduleOverride) ||
    Boolean(searchParams?.get("qa"));
  const qaOverrideActive = QA_PANEL_ENABLED && hasQaOverrideParams;
  const skipOnboardingParam = searchParams?.get("skipOnboarding") === "1";
  const debugSkipEnv = (process.env.NEXT_PUBLIC_DEBUG_SKIP_ONBOARDING || "").toLowerCase();
  const debugSkipEnabled = debugSkipEnv === "true" || debugSkipEnv === "1";
  const skipOnboarding = skipOnboardingParam || debugSkipEnabled;
  useEffect(() => {
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
  }, [router, user?.uid, qaOverrideActive, skipOnboarding]);

  useEffect(() => {
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
  }, [user?.uid]);

useEffect(() => {
  if (!user?.uid || !dailyDecision || qaOverrideActive) {
    setDailyCompletedToday(false);
    return;
  }
    let cancelled = false;
    const todayLocalKey = formatLocalDateKey(new Date());
    const checkHistory = async () => {
      try {
        const history = await getDailyPracticeHistory(user.uid, 14);
        if (cancelled) return;
        const completedEntry = history.find((entry) => {
          const completedAt =
            (entry.completedAt && typeof entry.completedAt === "object" && "toDate" in entry.completedAt)
              ? entry.completedAt.toDate()
              : new Date(entry.date);
          const entryLocalKey = formatLocalDateKey(completedAt);
          return (
            entry.completed &&
            entry.cluster === dailyDecision.cluster &&
            entry.mode === dailyDecision.mode &&
            entryLocalKey === todayLocalKey
          );
        });
        setDailyCompletedToday(Boolean(completedEntry));
      } catch (error) {
        console.warn("Failed to check daily practice history", error);
        if (!cancelled) setDailyCompletedToday(false);
      }
    };
    void checkHistory();
    return () => {
      cancelled = true;
    };
}, [user?.uid, dailyDecision, qaOverrideActive]);

  const axisMeta = useMemo(() => {
    const map = new Map<CatAxisId, { label: string }>();
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

  useEffect(() => {
    if (!onboardingReady || qaOverrideActive) return;
    let cancelled = false;
    setDecisionLoading(true);
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
  }, [onboardingReady, user?.uid, catProfile, decisionLang, qaOverrideActive]);

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
    return dailyDecision.config;
  }, [qaOverrideActive, clusterOverride, cluster, modeOverride, langOverride, moduleOverride, dailyDecision]);

  useEffect(() => {
    setTimeModeOverride(null);
    setTimeModeHint(null);
    setTimeSelectionMinutes(null);
  }, [baseDailyPathConfig?.id]);

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
    if (clusterOverride) overrides.push(`cluster=${clusterOverride}`);
    if (modeOverride) overrides.push(`mode=${modeOverride}`);
    if (langOverride) overrides.push(`lang=${langOverride}`);
    if (!overrides.length) return dailyDecision.reason;
    return `${dailyDecision.reason} | override ${overrides.join(", ")}`;
  }, [dailyDecision, clusterOverride, modeOverride, langOverride, qaOverrideActive]);

  const moduleKeyForSelection = useMemo(() => {
    if (qaOverrideActive) {
      return moduleOverride ?? null;
    }
    return dailyDecision?.moduleKey ?? null;
  }, [qaOverrideActive, moduleOverride, dailyDecision?.moduleKey]);

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

  const finalCluster = resolvedDailyPathConfig?.cluster ?? clusterOverride ?? cluster ?? null;
  const axisLabel = resolvedDailyPathConfig
    ? CLUSTER_FRIENDLY_LABELS[resolvedDailyPathConfig.cluster]
    : axisLabelFallback;
  const dailyLoopReady = hasCompletedOnboarding || qaOverrideActive;
  const showLoader =
    !onboardingReady || (!qaOverrideActive && decisionLoading) || !resolvedDailyPathConfig;
  const showGuestBanner = Boolean(user?.isAnonymous);
  const missionText = finalCluster ? ADAPTIVE_NUDGES[finalCluster] : null;
  const showQaPanel = QA_PANEL_ENABLED;
  const showDailyCompletedState = dailyCompletedToday && !qaOverrideActive;

  const header = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Frecommendation")}
    />
  );

  return (
    <>
      <AppShell header={header}>
        <div className="w-full min-h-screen" style={{ background: "var(--omni-gradient-shell)" }}>
        <div className="px-4 py-8 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          {showQaPanel ? <DailyPathQaPanel reason={decisionReason} /> : null}
          {showLoader ? (
            <div className="rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              Calibrăm traseul tău adaptiv…
            </div>
          ) : dailyLoopReady ? (
            <div className="space-y-6">
              <div className="mx-auto w-full max-w-[440px] px-4 pt-4 md:max-w-none md:px-0 md:pt-0">
                <div className="space-y-6">
                  <AdaptiveMissionCard axisLabel={axisLabel} nudge={missionText} />
                  {currentArc ? <CurrentArcCard arc={currentArc} /> : null}
                  {showDailyCompletedState ? (
                    <DailyPathCompletedCard lang={resolvedDailyPathConfig?.lang ?? decisionLang} />
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
                    />
                  )}
                </div>
              </div>
              {showGuestBanner ? (
                <GuestBanner onCreateAccount={() => router.push("/auth?returnTo=%2Frecommendation")} />
              ) : null}
              <ArcStateDebugPanel />
            </div>
          ) : (
            <DailyLoopFallback
              status={onboardingStatusState}
              showDebugLinks={process.env.NODE_ENV !== "production"}
            />
          )}
        </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

function DailyPathQaPanel({ reason }: { reason?: string | null }) {
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
          }).toString();
          const href = `/recommendation?${search}`;
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

function DailyLoopFallback({
  status,
  showDebugLinks,
}: {
  status: OnboardingStatus | null;
  showDebugLinks: boolean;
}) {
  const checklist = [
    { label: "CAT Baseline", done: status?.catBaselineDone },
    { label: "Pilonii OmniMental", done: status?.pillarsDone },
    { label: "Adaptive Practice", done: status?.adaptivePracticeDone },
  ];
  return (
    <section className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Finalizează calibrările</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">
        Completează CAT Baseline, Pilonii OmniMental și Adaptive Practice ca să primești Daily Path-ul adaptiv.
      </p>
      <div className="flex flex-col gap-1 text-left text-sm text-[var(--omni-ink)]/80 sm:flex-row sm:justify-center sm:gap-4">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                item.done ? "bg-[var(--omni-energy)] text-white" : "border border-[var(--omni-border-soft)] text-[var(--omni-muted)]"
              }`}
            >
              {item.done ? "✓" : "·"}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <OmniCtaButton as="link" href={CAT_BASELINE_URL}>
          CAT Baseline
        </OmniCtaButton>
        <OmniCtaButton as="link" href={PILLARS_URL}>
          Pilonii OmniMental
        </OmniCtaButton>
        <OmniCtaButton as="link" href={ADAPTIVE_PRACTICE_URL}>
          Adaptive Practice
        </OmniCtaButton>
      </div>
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

function DailyPathCompletedCard({ lang }: { lang: DailyPathLanguage }) {
  const copy =
    lang === "ro"
      ? {
          title: "Ai terminat Daily Path-ul de azi",
          body: "Păstrează progresul: vezi ce ai deblocat și testează nivelul 2 în Arene.",
          arenas: "Antrenează 90s în Arene",
          progress: "Vezi progresul",
        }
      : {
          title: "Today's Daily Path is complete",
          body: "Keep the momentum: review your progress and test Level 2 in Arenas.",
          arenas: "Train 90s in Arenas",
          progress: "View progress",
        };
  return (
    <section className="space-y-4 rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-semibold text-[var(--omni-ink)]">{copy.title}</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">{copy.body}</p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <OmniCtaButton as="link" href="/training/arenas">
          {copy.arenas}
        </OmniCtaButton>
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
