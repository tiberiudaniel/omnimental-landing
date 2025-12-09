"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useI18n } from "@/components/I18nProvider";
import { useTStrings } from "@/components/useTStrings";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import {
  computeDimensionScores,
  type IntentCategorySummary,
} from "@/lib/scoring";
import { recommendSession } from "@/lib/recommendation";
import { readRecommendationCache } from "@/lib/recommendationCache";
import DemoUserSwitcher from "@/components/DemoUserSwitcher";
import ExperienceStep from "@/components/ExperienceStep";
import { useUserRecommendations } from "@/components/useUserRecommendations";
import {
  RecommendationFilters,
  type RecommendationFilterKey,
} from "@/components/recommendations/RecommendationFilters";
import { RecommendationListStack } from "@/components/recommendations/RecommendationListStack";
import { RecommendationDetailPanel } from "@/components/recommendations/RecommendationDetailPanel";
import type { OmniRecommendation } from "@/lib/recommendations";
import { getPrimaryRecommendation } from "@/lib/recommendations";
import FirstOfferPanel from "@/components/recommendations/FirstOfferPanel";
import { choosePrimaryProduct, inferBudgetLevelFromIntent } from "@/lib/primaryProduct";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { TodayGuidanceCard } from "@/components/dashboard/CenterColumnCards";
import { PulseOfDayCard } from "@/components/today/PulseOfDayCard";
import { computePillarProgress } from "@/lib/pillarProgress";
import { CAT_AXES, type CatAxisId } from "@/config/catEngine";
import { normalizeKunoFacts } from "@/lib/kunoFacts";
import { buildOmniDailySnapshot } from "@/lib/omniState";
import { getLastAxesEntries, type DailyAxesEntry } from "@/lib/dailyReset";
import {
  OMNIKUNO_MODULES as OMNIKUNO_LESSON_MODULES,
  type OmniKunoModuleConfig,
} from "@/config/omniKunoLessons";
import {
  getLegacyModuleKeyById,
  resolveModuleId,
  OMNIKUNO_MODULES as OMNIKUNO_META,
  type OmniKunoModuleId,
} from "@/config/omniKunoModules";
import { normalizePerformance } from "@/lib/omniKunoAdaptive";
import KunoMissionCard, {
  type KunoMissionCardData,
  type KunoNextModuleSuggestion,
} from "@/components/dashboard/KunoMissionCard";
import { getCatProfile } from "@/lib/firebase/cat";
import type { CatProfileDoc } from "@/types/cat";
import type { DailyPathConfig } from "@/types/dailyPath";
import { deriveAdaptiveClusterFromCat } from "@/lib/dailyCluster";
import DailyPath from "@/components/daily/DailyPath";
import { getDailyPathForCluster } from "@/config/dailyPath";
import type { AdaptiveCluster } from "@/types/dailyPath";
import { getOnboardingStatus } from "@/lib/onboardingStatus";

const STAGE_LABELS: Record<string, string> = {
  t0: "Start (0 săpt.)",
  t1: "3 săpt.",
  t2: "6 săpt.",
  t3: "9 săpt.",
  t4: "12 săpt.",
};

const ADAPTIVE_NUDGES: Record<AdaptiveCluster, string> = {
  clarity_cluster: "Alege azi un lucru important și exprimă-l în minte în 7 cuvinte.",
  emotional_flex_cluster: "Dacă apare tensiune, respiră 1 dată profund înainte de răspuns.",
  focus_energy_cluster: "Ia 2 minute fără telefon azi. Atât.",
};

const ABIL_NUDGES: Record<AdaptiveCluster, string> = {
  clarity_cluster: "Scrie un task în 7 cuvinte max.",
  emotional_flex_cluster: "Fă pauza de 2 secunde înainte de a răspunde azi.",
  focus_energy_cluster: "Setează blocul tău de 2 minute fără telefon.",
};

const MICRO_LESSON_PLACEHOLDER = {
  ro: "O idee scurtă pentru tine azi. Ți-am pregătit o lecție micro în Kuno.",
  en: "A short thought for you today. Kuno has a micro-lesson ready.",
};

type DailyLoopDeckProps = {
  cluster: AdaptiveCluster | null;
  axisLabel: string | null;
  adaptiveNudge: string | null;
  abilNudge: string | null;
  microLessonText: string;
  onOpenKuno: () => void;
  onOpenAbil: () => void;
  onOpenJournal: () => void;
  dailyPathConfig: DailyPathConfig | null;
};

function DailyLoopDeck({
  cluster,
  axisLabel,
  adaptiveNudge,
  abilNudge,
  microLessonText,
  onOpenKuno,
  onOpenAbil,
  onOpenJournal,
  dailyPathConfig,
}: DailyLoopDeckProps) {
  return (
    <section className="mx-auto mb-8 w-full max-w-5xl space-y-4">
      <AdaptiveMissionCard cluster={cluster} axisLabel={axisLabel} nudge={adaptiveNudge} />
      <DailyPath key={dailyPathConfig?.cluster ?? "none"} config={dailyPathConfig} />
      <div className="grid gap-4 md:grid-cols-2">
        <MicroLessonCard text={microLessonText} onClick={onOpenKuno} />
        <AbilActionCard cluster={cluster} text={abilNudge} onClick={onOpenAbil} />
        <JournalCard onClick={onOpenJournal} />
        <ExploreCard onOpenKuno={onOpenKuno} onOpenAbil={onOpenAbil} onOpenJournal={onOpenJournal} />
      </div>
    </section>
  );
}

function CardShell({ title, subtitle, children }: { title: string; subtitle?: string | null; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-5 shadow-[0_14px_32px_rgba(0,0,0,0.08)]">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{title}</p>
        {subtitle ? <p className="text-sm font-semibold text-[var(--omni-ink)]">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function AdaptiveMissionCard({
  cluster,
  axisLabel,
  nudge,
}: {
  cluster: AdaptiveCluster | null;
  axisLabel: string | null;
  nudge: string | null;
}) {
  const disabled = !cluster;
  return (
    <CardShell title="Misiunea ta adaptivă de azi" subtitle={axisLabel ?? "Completează profilul pentru personalizare"}>
      <p className="text-sm text-[var(--omni-ink)]/80">
        {nudge ?? "Finalizează evaluarea CAT și adaptive practice pentru a primi o misiune precisă."}
      </p>
      <div className="flex flex-wrap gap-2">
        <OmniCtaButton size="sm" disabled={disabled}>
          Am făcut
        </OmniCtaButton>
        <OmniCtaButton size="sm" variant="neutral">
          Revin mai târziu
        </OmniCtaButton>
      </div>
    </CardShell>
  );
}

function MicroLessonCard({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <CardShell title="Mică lecție pentru azi">
      <p className="text-sm text-[var(--omni-ink)]/80">{text}</p>
      <OmniCtaButton size="sm" onClick={onClick}>
        Deschide Kuno
      </OmniCtaButton>
    </CardShell>
  );
}

function AbilActionCard({
  cluster,
  text,
  onClick,
}: {
  cluster: AdaptiveCluster | null;
  text: string | null;
  onClick: () => void;
}) {
  return (
    <CardShell title="Acțiune mică pentru azi" subtitle={cluster ? "Piloni Abil" : null}>
      <p className="text-sm text-[var(--omni-ink)]/80">
        {text ?? "Completează Adaptive Practice pentru a primi acțiuni precise."}
      </p>
      <OmniCtaButton size="sm" onClick={onClick}>
        Intră în Abil
      </OmniCtaButton>
    </CardShell>
  );
}

function JournalCard({ onClick }: { onClick: () => void }) {
  return (
    <CardShell title="Notează un gând de azi (opțional)">
      <p className="text-sm text-[var(--omni-ink)]/80">
        Scrie 1-2 fraze pentru a fixa ce ai observat azi. Nu trebuie să fie perfect.
      </p>
      <OmniCtaButton size="sm" variant="neutral" onClick={onClick}>
        Deschide jurnalul
      </OmniCtaButton>
    </CardShell>
  );
}

function ExploreCard({
  onOpenKuno,
  onOpenAbil,
  onOpenJournal,
}: {
  onOpenKuno: () => void;
  onOpenAbil: () => void;
  onOpenJournal: () => void;
}) {
  return (
    <CardShell title="Explorează liber">
      <p className="text-sm text-[var(--omni-ink)]/80">Ai chef de autonomie? Alege una dintre biblioteci.</p>
      <div className="flex flex-wrap gap-2">
        <OmniCtaButton size="sm" onClick={onOpenKuno}>
          Lecții OmniKuno
        </OmniCtaButton>
        <OmniCtaButton size="sm" onClick={onOpenAbil}>
          Acțiuni OmniAbil
        </OmniCtaButton>
        <OmniCtaButton size="sm" variant="neutral" onClick={onOpenJournal}>
          Jurnal
        </OmniCtaButton>
      </div>
    </CardShell>
  );
}

function DailyLoopFallback() {
  return (
    <section className="mx-auto mb-8 w-full max-w-4xl rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pregătim traseul tău</p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Finalizează pașii OmniMental</h2>
      <p className="mt-3 text-sm text-[var(--omni-ink)]/80">
        Completează evaluarea CAT, pilonii OmniMental și Adaptive Practice pentru a primi un path adaptiv zilnic.
      </p>
    </section>
  );
}

function GuestAccountBanner({ onCreateAccount, onResume }: { onCreateAccount: () => void; onResume: () => void }) {
  return (
    <div className="mx-auto mb-6 flex w-full max-w-4xl flex-col gap-2 rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <p>
        Ai deja un plan personalizat. Pentru a-l salva și sincroniza între dispozitive, creează un cont sau reia wizardul.
      </p>
      <div className="flex flex-wrap gap-2">
        <OmniCtaButton size="sm" variant="neutral" onClick={onResume}>
          Reia wizardul
        </OmniCtaButton>
        <OmniCtaButton size="sm" onClick={onCreateAccount}>
          Creează cont
        </OmniCtaButton>
      </div>
    </div>
  );
}

// ------------------------------------------------------
// Page shell + stacked recommendations
// ------------------------------------------------------

function RecommendationContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useI18n();
  const { s } = useTStrings();
  const { profile } = useProfile();
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setArrowY] = useState<number | null>(null);
  const [catProfile, setCatProfile] = useState<CatProfileDoc | null>(null);
  const [onboardingReady, setOnboardingReady] = useState(!user?.uid);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const allowGuest = Boolean(search?.get("demo") || search?.get("e2e") === "1");
  const hasFullAccount = Boolean(user && !user.isAnonymous);
  const needsAccount = !hasFullAccount && !allowGuest;
  const isClient = typeof window !== "undefined";

    const redirectToAuth = () => {
    const encoded = encodeURIComponent("/recommendation");
    router.push(`/auth?returnTo=${encoded}`);
  };

  // Gate tweak: nu mai redirect automat la /choose, ci banner clar cu CTA
  const showChooseBanner = useMemo(
    () => Boolean(profile?.id && (profile.selection ?? "none") === "none"),
    [profile?.id, profile?.selection],
  );

  useEffect(() => {
    if (allowGuest) {
      setHasCompletedOnboarding(true);
      setOnboardingReady(true);
      return;
    }
    if (!user?.uid) {
      setCatProfile(null);
      setHasCompletedOnboarding(false);
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
        setHasCompletedOnboarding(status.hasCompletedOnboarding);
        if (!status.hasCatProfile) {
          router.replace("/onboarding/cat-baseline");
          return;
        }
        if (!status.pillarsIntroCompleted) {
          router.replace("/onboarding/pillars");
          return;
        }
        if (!status.hasAdaptivePracticeSession) {
          router.replace("/onboarding/adaptive-practice");
          return;
        }
      } catch (err) {
        console.warn("getOnboardingStatus failed", err);
      } finally {
        if (!cancelled) {
          setOnboardingReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowGuest, router, user?.uid]);

  const axisMeta = useMemo(() => {
    const map = new Map<CatAxisId, { label: string; shortLabel: string }>();
    for (const axis of CAT_AXES) {
      map.set(axis.id, { label: axis.label, shortLabel: axis.shortLabel });
    }
    return map;
  }, []);

  const { primaryAxis, cluster } = useMemo(() => deriveAdaptiveClusterFromCat(catProfile), [catProfile]);
  const axisLabel = primaryAxis ? axisMeta.get(primaryAxis)?.label ?? null : null;
  const adaptiveNudge = cluster ? ADAPTIVE_NUDGES[cluster] : null;
  const abilNudge = cluster ? ABIL_NUDGES[cluster] : null;
  const microLessonText = lang === "ro" ? MICRO_LESSON_PLACEHOLDER.ro : MICRO_LESSON_PLACEHOLDER.en;
  const dailyPathConfig = useMemo(() => (cluster ? getDailyPathForCluster(cluster) : null), [cluster]);
  const canShowDailyLoop = hasCompletedOnboarding || allowGuest;
  const showGuestBanner = needsAccount && canShowDailyLoop;

const tier = profile?.accessTier ?? "public";
const { data: progress, loading, error } = useProgressFacts(profile?.id);
const kunoFacts = useMemo(() => normalizeKunoFacts(progress?.omni?.kuno), [progress?.omni?.kuno]);
const [lastKunoModulePref, setLastKunoModulePref] = useState<{
  moduleId: OmniKunoModuleId | null;
  lessonId: string | null;
  updatedAt: number | null;
} | null>(null);
const isPublicTier = tier === "public";
const pillarProgress = useMemo(() => computePillarProgress(progress ?? null), [progress]);
const [pulseEntries, setPulseEntries] = useState<DailyAxesEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsePref = () => {
      try {
        const raw = window.localStorage.getItem("omnikuno_last_module");
        if (!raw) {
          setLastKunoModulePref(null);
          return;
        }
        const parsed = JSON.parse(raw) as {
          moduleId?: string | null;
          areaKey?: string | null;
          lessonId?: string | null;
          updatedAt?: number | null;
        };
        const normalized =
          resolveModuleId(parsed?.moduleId ?? undefined) ?? resolveModuleId(parsed?.areaKey ?? undefined);
        if (!normalized || !OMNIKUNO_LESSON_MODULES[normalized]) {
          setLastKunoModulePref(null);
          return;
        }
        setLastKunoModulePref({
          moduleId: normalized as OmniKunoModuleId,
          lessonId: typeof parsed?.lessonId === "string" ? parsed!.lessonId! : null,
          updatedAt: typeof parsed?.updatedAt === "number" ? parsed!.updatedAt! : null,
        });
      } catch {
        setLastKunoModulePref(null);
      }
    };
    parsePref();
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "omnikuno_last_module") return;
      parsePref();
    };
    const handleCustom = () => parsePref();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("omnikuno:last-module", handleCustom as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("omnikuno:last-module", handleCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const profileId = profile?.id;
    if (!profileId) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setPulseEntries([]);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const data = await getLastAxesEntries(profileId, 4);
        if (process.env.NODE_ENV !== "production") {
          console.log("Pulsul zilei entries:", data.length, data);
        }
        if (!cancelled) {
          setPulseEntries(data);
        }
      } catch {
        if (!cancelled) {
          setPulseEntries([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, progress?.omni?.daily?.lastCheckinDate]);

  const activeMissionData =
    (profile as { activeMission?: { moduleId?: string | null; areaKey?: string | null; area?: string | null; title?: string | null } } | null)
      ?.activeMission ?? null;
  const profileActiveModuleKey =
    activeMissionData?.moduleId ?? activeMissionData?.areaKey ?? activeMissionData?.area ?? null;
  const focusAreaLabel = activeMissionData?.title ?? null;
  const pulseTodayEntry = pulseEntries.length ? pulseEntries[pulseEntries.length - 1] : null;

  const resolveCandidateId = (value?: string | null) => {
    if (!value) return null;
    return resolveModuleId(value);
  };

  const kunoMissionData: KunoMissionCardData | null = useMemo(() => {
    const moduleEntries = Object.entries(OMNIKUNO_LESSON_MODULES) as Array<[OmniKunoModuleId, OmniKunoModuleConfig]>;
    const pushCandidate = (
      list: Array<[OmniKunoModuleId, OmniKunoModuleConfig]>,
      value?: string | null,
    ) => {
      const normalized = resolveCandidateId(value);
      if (!normalized) return;
      if (!OMNIKUNO_LESSON_MODULES[normalized]) return;
      if (list.some(([key]) => key === normalized)) return;
      list.push([normalized, OMNIKUNO_LESSON_MODULES[normalized]]);
    };
    const candidates: Array<[OmniKunoModuleId, OmniKunoModuleConfig]> = [];
    if (lastKunoModulePref?.moduleId) {
      pushCandidate(candidates, lastKunoModulePref.moduleId);
    }
    pushCandidate(candidates, kunoFacts.recommendedModuleId ?? null);
    pushCandidate(candidates, kunoFacts.recommendedArea ?? null);
    const inProgressModules = moduleEntries
      .map(([areaKey, module]) => {
        const snapshot = kunoFacts.modules[module.moduleId];
        const completedCount = Array.isArray(snapshot?.completedIds) ? snapshot!.completedIds!.length : 0;
        const totalLessons = module.lessons.length;
        const hasProgress = totalLessons > 0 && completedCount > 0 && completedCount < totalLessons;
        const lastUpdated = typeof snapshot?.lastUpdated === "number" ? snapshot.lastUpdated : 0;
        return { areaKey, module, hasProgress, lastUpdated };
      })
      .filter((entry) => entry.hasProgress)
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
    inProgressModules.forEach((entry) => pushCandidate(candidates, entry.areaKey));
    const fallbackArea = (() => {
      const resolved = resolveCandidateId(profileActiveModuleKey);
      if (resolved && OMNIKUNO_LESSON_MODULES[resolved as OmniKunoModuleId]) {
        return resolved as OmniKunoModuleId;
      }
      const legacy = resolved ? getLegacyModuleKeyById(resolved) : null;
      if (legacy && OMNIKUNO_LESSON_MODULES[legacy as OmniKunoModuleId]) {
        return legacy as OmniKunoModuleId;
      }
      return "emotional_balance";
    })();
    pushCandidate(candidates, fallbackArea);
    if (!candidates.length) {
      pushCandidate(candidates, "emotional_balance");
    }
    const [areaKey, module] = candidates[0] ?? [];
    if (!areaKey || !module) return null;
    const moduleSnapshot = kunoFacts.modules[module.moduleId];
    const completedIds = moduleSnapshot?.completedIds ?? [];
    const xp = Number((kunoFacts.gamification as { xp?: number } | null)?.xp ?? 0);
    return {
      areaKey,
      module,
      completedIds,
      xp: Number.isFinite(xp) ? xp : 0,
      performance: normalizePerformance(
        (moduleSnapshot?.performance as Partial<{ recentScores: number[]; recentTimeSpent: number[]; difficultyBias: number }> | null) ?? null,
      ),
    };
  }, [kunoFacts, lastKunoModulePref?.moduleId, profileActiveModuleKey]);

  const kunoNextModuleSuggestion: KunoNextModuleSuggestion | null = useMemo(() => {
    if (!kunoMissionData?.module?.moduleId) return null;
    const currentModuleId = kunoMissionData.module.moduleId as OmniKunoModuleId;
    const ordered: OmniKunoModuleId[] = [];
    const seen = new Set<OmniKunoModuleId>();
    const pushCandidate = (value?: string | null) => {
      const normalized = resolveCandidateId(value);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        ordered.push(normalized);
      }
    };
    pushCandidate(kunoFacts.recommendedModuleId ?? null);
    pushCandidate(kunoFacts.recommendedArea ?? null);
    pushCandidate(profileActiveModuleKey ?? null);
    type IntentCat = { category?: string | null; count?: number | null };
    const intentBlock = progress?.intent as { categories?: IntentCat[] } | undefined;
    if (Array.isArray(intentBlock?.categories)) {
      const sorted = intentBlock.categories
        .slice()
        .sort((a, b) => (Number(b?.count) || 0) - (Number(a?.count) || 0));
      sorted.forEach((entry) => pushCandidate(entry?.category ?? null));
    }
    OMNIKUNO_META.forEach((meta) => {
      if (!seen.has(meta.id)) {
        seen.add(meta.id);
        ordered.push(meta.id);
      }
    });
    const nextModuleId = ordered.find((id) => id !== currentModuleId);
    if (!nextModuleId) return null;
    const nextModule = OMNIKUNO_LESSON_MODULES[nextModuleId];
    if (!nextModule) return null;
    const firstLessonId =
      nextModule.lessons
        .slice()
        .sort((a, b) => a.order - b.order)[0]?.id ?? null;
    return { moduleId: nextModuleId, firstLessonId };
  }, [kunoFacts, kunoMissionData?.module?.moduleId, profileActiveModuleKey, progress?.intent]);

  const kunoMissionProgressPercent = useMemo(() => {
    if (!kunoMissionData?.module?.moduleId) return null;
    const moduleId = kunoMissionData.module.moduleId as OmniKunoModuleId;
    const moduleScore = pillarProgress.metadata.kunoByModule[moduleId];
    return moduleScore?.percent ?? pillarProgress.kuno.percent;
  }, [kunoMissionData?.module?.moduleId, pillarProgress]);

  const omniCunoScore = typeof kunoFacts.primaryScore === "number" ? Math.round(kunoFacts.primaryScore) : 0;
  const kunoDelta: number | null = null;
  const omniSnapshot = useMemo(() => buildOmniDailySnapshot({ progress: progress ?? null, facts: progress ?? null }), [progress]);

  // Stack de recomandări (istoric + starea curentă)
  const { recommendations, loading: recLoading } = useUserRecommendations();

  const [filter, setFilter] = useState<RecommendationFilterKey>(() => {
    if (typeof window === "undefined") return "all";
    try {
      const v = window.localStorage.getItem("reco_filter");
      if (
        v === "new" ||
        v === "active" ||
        v === "done" ||
        v === "today" ||
        v === "all"
      ) {
        return v as RecommendationFilterKey;
      }
    } catch {
      // ignore
    }
    return "all";
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  // Demo fallback when no recommendations yet
  const demoRecs: OmniRecommendation[] = useMemo(() => {
    const uid = profile?.id ?? "demo";
    const nowIso = new Date().toISOString();
    return [
      {
        id: "demo-1",
        userId: uid,
        title: "Focus pe somn în următoarele 3 zile",
        shortLabel: "Somn – 3 zile",
        type: "next-step",
        status: "new",
        priority: 1,
        createdAt: nowIso,
        estimatedMinutes: 15,
        tags: ["somn", "energie"],
        body:
          "Începe prin a-ți stabiliza ora de culcare și evită ecranele în ultima oră înainte de somn. Notează în jurnal cum te simți dimineața.",
        ctaLabel: "Vezi exercițiul de seară",
        ctaHref: "/antrenament?tab=somn",
      },
      {
        id: "demo-2",
        userId: uid,
        title: "Micro-pauze pentru claritate mentală",
        shortLabel: "Pauze de 3 minute",
        type: "mindset",
        status: "active",
        priority: 2,
        createdAt: nowIso,
        estimatedMinutes: 10,
        tags: ["claritate", "workday"],
        body:
          "De 3 ori pe zi, rupe 3 minute pentru respirație conștientă sau o scurtă plimbare. Scopul este să-ți recalibrezi atenția, nu să ‘recuperezi’ task-uri.",
        ctaLabel: "Deschide ghidul de micro-pauze",
        ctaHref: "/antrenament?tab=pauze",
      },
      {
        id: "demo-3",
        userId: uid,
        title: "Clarifică-ți intenția pentru săptămâna asta",
        shortLabel: "Intenția săptămânii",
        type: "quest",
        status: "new",
        priority: 3,
        createdAt: nowIso,
        estimatedMinutes: 20,
        tags: ["intenții", "mindset"],
        body:
          "Răspunde în jurnal la trei întrebări: 1) Ce vreau să iasă diferit săptămâna asta? 2) Ce îmi poate sabota intenția? 3) Ce micro-acțiune încep chiar azi?",
        ctaLabel: "Deschide jurnalul",
        ctaHref: "/jurnal?from=recommendation",
      },
    ];
  }, [profile?.id]);

  // Base list used both for filtering and counts
  const baseAll: OmniRecommendation[] = useMemo(
    () => (recommendations.length ? recommendations : demoRecs),
    [recommendations, demoRecs],
  );

  // Ensure the oldest (index 1 at bottom) is the initial path recommendation: Group vs Individual
  const basePathRecFromProgress: OmniRecommendation | null = useMemo(() => {
    try {
      // Prefer member recommendation computed from current progress
      if (!isPublicTier && progress?.intent && progress?.evaluation) {
        const intentCategories = progress.intent.categories as IntentCategorySummary[];
        const dimensionScores = computeDimensionScores(intentCategories, progress.intent.urgency);
        const rec = recommendSession({
          urgency: progress.intent.urgency,
          primaryCategory: intentCategories[0]?.category,
          dimensionScores,
          hasProfile: true,
        });
        const isGroup = rec.recommendedPath !== 'individual';
        const label = isGroup ? (lang === 'ro' ? 'Grup OmniMental' : 'OmniMental group') : (lang === 'ro' ? 'Ședințe individuale' : 'Individual sessions');
        const title = (lang === 'ro' ? 'Recomandare inițială: ' : 'Initial recommendation: ') + label;
        const body = s(
          `recommendationPath_${rec.recommendedPath}_body`,
          isGroup
            ? 'Ți se potrivește ritmul și suportul din programul de grup OmniMental.'
            : 'Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară.'
        );
        return {
          id: 'base-path',
          userId: profile?.id ?? 'demo',
          title,
          shortLabel: label,
          type: 'onboarding',
          status: 'done',
          createdAt: '2000-01-01T00:00:00.000Z',
          updatedAt: undefined,
          priority: 3,
          estimatedMinutes: undefined,
          tags: [],
          body,
          ctaLabel: isGroup ? (lang === 'ro' ? 'Deschide programul de grup' : 'Open group program') : (lang === 'ro' ? 'Programează un call' : 'Book a call'),
          ctaHref: isGroup ? '/group' : '/contact',
          source: 'system',
          sourceRef: 'path-recommendation',
        };
      }
    } catch {}
    return null;
  }, [isPublicTier, progress, profile, lang, s]);

  const [cachedBasePathRec, setCachedBasePathRec] = useState<OmniRecommendation | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    let cancelled = false;
    const applyCache = () => {
      if (cancelled) return;
      try {
        const cached = readRecommendationCache();
        if (!cached) {
          setCachedBasePathRec(null);
          return;
        }
        const isGroup = cached.recommendation.path !== "individual";
        const label =
          isGroup
            ? lang === "ro"
              ? "Grup OmniMental"
              : "OmniMental group"
            : lang === "ro"
              ? "Ședințe individuale"
              : "Individual sessions";
        const title = (lang === "ro" ? "Recomandare inițială: " : "Initial recommendation: ") + label;
        const body = isGroup
          ? lang === "ro"
            ? "Ți se potrivește ritmul și suportul din programul de grup OmniMental."
            : "Group program seems a good fit."
          : lang === "ro"
            ? "Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară."
            : "1-on-1 sessions fit your situation.";
        setCachedBasePathRec({
          id: "base-path",
          userId: profile?.id ?? "demo",
          title,
          shortLabel: label,
          type: "onboarding",
          status: "done",
          createdAt: "2000-01-01T00:00:00.000Z",
          priority: 3,
          body,
          ctaLabel: isGroup
            ? lang === "ro"
              ? "Deschide programul de grup"
              : "Open group program"
            : lang === "ro"
              ? "Programează un call"
              : "Book a call",
          ctaHref: isGroup ? "/group" : "/contact",
          source: "system",
          sourceRef: "path-recommendation",
        });
      } catch {
        setCachedBasePathRec(null);
      }
    };
    applyCache();
    window.addEventListener("storage", applyCache);
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", applyCache);
      }
    };
  }, [profile?.id, lang]);

  const basePathRec = basePathRecFromProgress ?? cachedBasePathRec;

  const withBase: OmniRecommendation[] = useMemo(() => {
    const list = [...baseAll];
    if (basePathRec && !list.some((r) => r.id === 'base-path')) list.push(basePathRec);
    return list;
  }, [baseAll, basePathRec]);

  const filteredRecs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    switch (filter) {
      case "new":
        return withBase.filter((r) => r.status === "new");
      case "active":
        return withBase.filter((r) => r.status === "active");
      case "done":
        return withBase.filter((r) => r.status === "done");
      case "today":
        return withBase.filter((r) => (r.createdAt || "").startsWith(todayStr));
      case "all":
      default:
        return withBase;
    }
  }, [withBase, filter]);

  // Effective list for UI: if current filter set is empty, show demo
  const effectiveRecs = useMemo(
    () => (filteredRecs.length ? filteredRecs : demoRecs),
    [filteredRecs, demoRecs],
  );

  const activeRec: OmniRecommendation | null = useMemo(() => {
    if (!effectiveRecs.length) return null;
    if (activeId && effectiveRecs.some((r) => r.id === activeId)) {
      return effectiveRecs.find((r) => r.id === activeId)!;
    }
    return getPrimaryRecommendation(effectiveRecs) ?? null;
  }, [effectiveRecs, activeId]);

  // Temporar: afișăm mereu secțiunea; componenta știe să arate empty state
  const hasStack = true;

  // Arrow animates via key change; no setState in effect

  const header = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={redirectToAuth}
    />
  );

  if (!onboardingReady) {
    return (
      <>
        <AppShell header={header}>
          <div className="px-4 py-16 text-center text-sm text-[var(--omni-muted)]">
            Calibrăm traseul tău adaptiv…
          </div>
        </AppShell>
        <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      </>
    );
  }

  return (
    <>
      <AppShell header={header}>
        {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? (
          <DemoUserSwitcher />
        ) : null}
        {search?.get("demo") ? (
          <div className="mx-auto mt-3 w-full max-w-4xl px-4">
            <span className="inline-flex items-center rounded-full bg-[var(--omni-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
              {s("badgeDemo", "Demo")}
            </span>
          </div>
        ) : null}

        <div className="px-4 py-12 md:px-8" data-testid="recommendation-step">
        {/* Daily loop : full visibility when onboarding is complete */}
        {canShowDailyLoop ? (
          <>
            <DailyLoopDeck
              cluster={cluster}
              axisLabel={axisLabel}
              adaptiveNudge={adaptiveNudge}
              abilNudge={abilNudge}
              microLessonText={microLessonText}
              onOpenKuno={() => router.push("/kuno")}
              onOpenAbil={() => router.push("/abil")}
              onOpenJournal={() => router.push("/journal")}
              dailyPathConfig={dailyPathConfig}
            />
            {showGuestBanner ? (
              <GuestAccountBanner onCreateAccount={redirectToAuth} onResume={() => router.push("/?step=cards")} />
            ) : null}
          </>
        ) : (
          <DailyLoopFallback />
        )}
        {showChooseBanner ? (
          <div className="mx-auto mb-4 w-full max-w-4xl rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === "ro"
                  ? "Pentru a vedea recomandarea completă, alege modul în care vrei să continui (individual sau grup)."
                  : "To view your full recommendation, choose how you want to continue (individual or group)."}
              </p>
              <OmniCtaButton
                type="button"
                variant="neutral"
                onClick={() => {
                  const url = new URL(window.location.origin + "/choose");
                  url.searchParams.set("from", "reco");
                  router.push(url.pathname + url.search);
                }}
                className="shrink-0"
              >
                {lang === "ro" ? "Alege formatul" : "Choose format"}
              </OmniCtaButton>
            </div>
          </div>
        ) : null}
        <div className="w-full max-w-5xl mx-auto px-4 mb-8">
          <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 px-4 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur-[2px] md:px-6 md:py-6">
            <div className="grid gap-4 md:gap-5 lg:gap-6 lg:grid-cols-[minmax(260px,290px)_minmax(320px,1fr)_minmax(320px,1fr)]">
              <div className="flex h-full flex-col min-w-0">
                <PulseOfDayCard
                  lang={lang === "ro" ? "ro" : "en"}
                  today={pulseTodayEntry}
                  recentEntries={pulseEntries}
                />
              </div>
              <div className="flex h-full flex-col min-w-0">
                <KunoMissionCard
                  lang={lang}
                  focusAreaLabel={focusAreaLabel}
                  omniCunoScore={omniCunoScore}
                  kunoDelta={kunoDelta}
                  missionData={kunoMissionData}
                  nextModuleSuggestion={kunoNextModuleSuggestion}
                  progressPercent={kunoMissionProgressPercent}
                />
              </div>
              <div className="flex h-full flex-col min-w-0">
                <TodayGuidanceCard lang={lang} snapshot={omniSnapshot} facts={progress ?? null} />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto px-4 space-y-8">
        {/* Stack + detail */}
        {hasStack ? (
          <section className="space-y-6" data-testid="debug-stack-section">
            <div className="omni-panel-soft rounded-card p-6 md:p-7 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base md:text-lg font-semibold text-[var(--omni-ink)]">
                {lang === "ro" ? "Recomandări" : "Your recommendations"}
              </h2>
              <RecommendationFilters
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  try {
                    window.localStorage.setItem("reco_filter", v);
                  } catch {}
                }}
                labels={{
                  all: lang === "ro" ? "Toate" : "All",
                  new: lang === "ro" ? "Noi" : "New",
                  active: lang === "ro" ? "În lucru" : "Active",
                  done: lang === "ro" ? "Finalizate" : "Done",
                  today: lang === "ro" ? "Azi" : "Today",
                }}
                counts={
                  isClient
                    ? {
                        all: withBase.length,
                        new: withBase.filter((r) => r.status === "new").length,
                        active: withBase.filter((r) => r.status === "active").length,
                        done: withBase.filter((r) => r.status === "done").length,
                        today: withBase.filter((r) => (r.createdAt || "").startsWith(new Date().toISOString().slice(0, 10))).length,
                      }
                    : undefined
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)]">
              <div className="omni-panel-soft rounded-card p-6 md:p-7">
                {recLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 w-full rounded-card bg-[var(--omni-bg-paper)]" />
                    <div className="h-10 w-11/12 rounded-card bg-[var(--omni-bg-paper)]" />
                    <div className="h-10 w-10/12 rounded-card bg-[var(--omni-bg-paper)]" />
                  </div>
                ) : (
                  <RecommendationListStack
                    items={effectiveRecs}
                    activeId={activeRec?.id ?? null}
                    onActiveChange={setActiveId}
                    onActiveMidpoint={(mid) => setArrowY(mid)}
                  />
                )}
              </div>
              <div className="space-y-6">
                <div className="omni-card rounded-card p-6 md:p-7">
                  {recLoading ? (
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-[var(--omni-bg-paper)]" />
                      <div className="h-5 w-56 bg-[var(--omni-bg-paper)]" />
                      <div className="h-20 w-full bg-[var(--omni-bg-paper)]" />
                      <div className="h-10 w-32 bg-[var(--omni-bg-paper)]" />
                    </div>
                  ) : (
                    <RecommendationDetailPanel item={activeRec} />
                  )}
                </div>
                <div className="omni-panel-soft rounded-card p-6 md:p-7 text-[var(--omni-muted)]">
                  <p className="text-sm">
                    {lang === "ro"
                      ? "Aplică recomandarea principală și revino pentru actualizări bazate pe progres."
                      : "Apply your primary recommendation and return for updates as progress shifts."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Public: doar teaser + cached view dacă există */}
        {isPublicTier && recommendations.length === 0 ? (
          <PublicOrCachedView lang={lang} />
        ) : null}

        {/* Rezumat mare pentru membri (path + scoruri + quest-uri) */}
        {!isPublicTier ? (
          <MemberRecommendationView
            profileName={(profile as { name?: string; id?: string } | null)?.name ?? profile?.id ?? "Membru OmniMental"}
            progress={progress}
            loading={loading}
            error={error}
            tier={tier}
          />
        ) : null}

        {/* Continuare blândă: ExperienceStep */}
        {!isPublicTier && profile?.id ? (
          <ExperienceStep
            userId={profile.id}
            onContinue={() => router.push("/progress")}
          />
        ) : null}
        </div>
        </div>
      </AppShell>
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
      />
    </>
  );
}

// ------------------------------------------------------
// Public views (teaser / cached)
// ------------------------------------------------------

function PublicRecommendationView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  const title = s(
    "recommendationPublicTitle",
    "Vrei o direcție personalizată?",
  );
  const body = s(
    "recommendationPublicBody",
    "Completează mini-evaluarea (5–7 minute) și primești un sumar logic + următorul pas recomandat.",
  );
  const ctaLabel = s("recommendationPublicCta", "Începe evaluarea");
  return (
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{title}</h2>
      <p className="text-sm text-[var(--omni-ink-soft)]">{body}</p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/antrenament"
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
        >
          {ctaLabel}
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Necesită autentificare" : "Requires sign in"}
        </p>
      </div>
    </section>
  );
}

function PublicOrCachedView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  const [cached, setCached] = useState<ReturnType<typeof readRecommendationCache> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const update = () => {
      if (cancelled) return;
      try {
        setCached(readRecommendationCache() ?? null);
      } catch {
        setCached(null);
      }
    };
    const raf = window.requestAnimationFrame(update);
    const listener: EventListener = () => {
      window.requestAnimationFrame(update);
    };
    window.addEventListener("storage", listener);
    window.addEventListener("recommendation:cache-update", listener);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("storage", listener);
      window.removeEventListener("recommendation:cache-update", listener);
    };
  }, []);

  if (!cached) {
    return <PublicRecommendationView lang={lang} />;
  }

  const title = s(
    "recommendationCachedTitle",
    "Recomandarea ta salvată",
  );
  const label =
    cached.recommendation.path === "individual"
      ? lang === "ro"
        ? "Ședințe individuale"
        : "Individual sessions"
      : lang === "ro"
      ? "Grup OmniMental"
      : "OmniMental group";
  const reason = s(
    `recommendationReason_${cached.recommendation.reasonKey}`,
    cached.recommendation.reasonKey,
  );
  const selectionNote = cached.selectedPath
    ? cached.selectedPath === "individual"
      ? lang === "ro"
        ? "Ai ales sesiuni individuale."
        : "You chose individual sessions."
      : lang === "ro"
      ? "Ai ales programul de grup."
      : "You chose the group program."
    : null;

  return (
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{title}</h2>
      <p className="text-sm text-[var(--omni-ink-soft)]">
        {lang === "ro"
          ? "Bazată pe ultimele selecții făcute în aplicație."
          : "Based on your latest selections in the app."}
      </p>
      <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-energy)]">
          {lang === "ro" ? "Recomandare" : "Recommendation"}
        </p>
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{label}</h3>
        <p className="text-sm text-[var(--omni-ink-soft)]">{reason}</p>
        {selectionNote ? (
          <p className="text-xs text-[var(--omni-muted)]">{selectionNote}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Link
          href={
            cached.selectedPath === "group" ? "/group" : "/experience-onboarding"
          }
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
        >
          {lang === "ro" ? "Continuă de aici" : "Continue from here"}
        </Link>
      </div>
    </section>
  );
}

// ------------------------------------------------------
// Member view: path + scoruri + quest-uri
// ------------------------------------------------------

type MemberViewProps = {
  profileName: string;
  progress: ReturnType<typeof useProgressFacts>["data"];
  loading: boolean;
  error: Error | null;
  tier: string;
};

function MemberRecommendationView({
  profileName,
  progress,
  loading,
  error,
  tier,
}: MemberViewProps) {
  const router = useRouter();
  const { s } = useTStrings();
  const { lang } = useI18n();

  if (loading) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 text-center text-sm text-[var(--omni-ink-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationLoading",
          "Se încarcă recomandarea ta personalizată…",
        )}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[var(--omni-danger)] bg-[var(--omni-danger-soft)] px-6 py-6 text-center text-sm text-[var(--omni-danger)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationLoadError",
          "Nu am putut încărca recomandarea. Încearcă din nou.",
        )}
      </div>
    );
  }
  if (!progress?.intent || !progress?.evaluation) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center text-sm text-[var(--omni-ink-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationMemberFallback",
          "Finalizează o evaluare completă pentru a primi recomandări dedicate.",
        )}
      </div>
    );
  }

  const intentCategories = progress.intent.categories as IntentCategorySummary[];
  const dimensionScores = computeDimensionScores(
    intentCategories,
    progress.intent.urgency,
  );
  const recommendation = recommendSession({
    urgency: progress.intent.urgency,
    primaryCategory: intentCategories[0]?.category,
    dimensionScores,
    hasProfile: true,
  });
  const budgetLevel = inferBudgetLevelFromIntent(progress?.motivation ?? progress?.intent ?? {});
  const primaryProduct = choosePrimaryProduct({ budget: budgetLevel, urgency: progress.intent.urgency });

  // Path flags not used directly in this view

  const pathTitle = s(
    `recommendationPath_${recommendation.recommendedPath}_title`,
    recommendation.recommendedPath === "individual"
      ? "Recomandare: ședințe individuale"
      : "Recomandare: grup OmniMental",
  );
  const pathBody = s(
    `recommendationPath_${recommendation.recommendedPath}_body`,
    recommendation.recommendedPath === "individual"
      ? "Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară."
      : "Ți se potrivește ritmul și suportul din programul de grup OmniMental.",
  );
  const reasonLabel = s(
    `recommendationReason_${recommendation.reasonKey}`,
    recommendation.reasonKey,
  );
  const badgeLabel =
    tier === "persona"
      ? s("recommendationMemberPersonaBadge", "Acces Persona")
      : s("recommendationMemberMemberBadge", "Membru activ");

  // Legacy CTA labels removed from this minimalist member view

  const quests = progress.quests?.items ?? [];
  const evaluationRows: { label: string; value: string }[] = [
    { label: "PSS", value: progress.evaluation.scores.pssTotal.toFixed(0) },
    { label: "GSE", value: progress.evaluation.scores.gseTotal.toFixed(0) },
    {
      label: "MAAS",
      value: progress.evaluation.scores.maasTotal.toFixed(1),
    },
    {
      label: "PANAS +",
      value: progress.evaluation.scores.panasPositive.toFixed(0),
    },
    {
      label: "PANAS -",
      value: progress.evaluation.scores.panasNegative.toFixed(0),
    },
    { label: "SVS", value: progress.evaluation.scores.svs.toFixed(1) },
  ];

  if (progress.evaluation.knowledge) {
    evaluationRows.push({
      label: "OC",
      value: `${progress.evaluation.knowledge.percent.toFixed(0)}%`,
    });
  }

  return (
    <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-8">
      {/* Recomandarea de top (path) */}
      <section className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
              {s("recommendationMemberTitle", "Recomandare curentă")}
            </p>
            <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">
              {profileName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {s("recommendationRefresh", "Resincronizează")}
            </button>
            <span className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink-soft)]">
              {badgeLabel}
            </span>
          </div>
        </header>
        <div className="space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4">
          <h3 className="text-lg font-semibold text-[var(--omni-ink)]">
            {pathTitle}
          </h3>
          <p className="text-sm text-[var(--omni-ink-soft)]">{pathBody}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {s("recommendationMemberReasonLabel", "Motiv principal")}:{" "}
            {reasonLabel}
          </p>
          <p className="text-xs text-[var(--omni-muted)]">
            {s("recommendationMemberStageLabel", "Etapă evaluare")}:{" "}
            {STAGE_LABELS[progress.evaluation.stageValue] ??
              progress.evaluation.stageValue}
          </p>
        </div>
        <FirstOfferPanel primaryProduct={primaryProduct} lang={lang} />
      </section>

      {/* Rezumat scoruri psihometrice */}
      <section className="omni-panel-soft rounded-card p-6 md:p-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
          {s("recommendationMemberSummaryHeading", "Rezumat scoruri")}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {evaluationRows.map((row) => (
            <div
              key={row.label}
              className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {row.label}
              </p>
              <p className="text-base font-semibold text-[var(--omni-ink)]">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quest-uri prioritare */}
      <section className="omni-panel-soft rounded-card p-6 md:p-7 space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
            {s("recommendationMemberQuestsTitle", "Quest-uri prioritare")}
          </p>
        </header>
        {quests.length ? (
          <div className="space-y-3">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="space-y-2 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{quest.title}</h3>
                  <span className="rounded-full border border-[var(--omni-border-soft)] px-2 py-[2px] text-[10px] uppercase tracking-[0.3em] text-[var(--omni-ink-soft)]">
                    {quest.type}
                  </span>
                </div>
                <p>{quest.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--omni-muted)]">
            {s(
              "recommendationMemberQuestsEmpty",
              "Quest-urile apar după evaluări complete.",
            )}
          </p>
        )}
      </section>
    </div>
  );
}

// ------------------------------------------------------
// Default export
// ------------------------------------------------------

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationContent />
    </Suspense>
  );
}
