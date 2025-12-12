"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { OMNIKUNO_MODULES, type OmniKunoModuleConfig, type OmniKunoLesson } from "@/config/omniKunoLessons";
import { normalizePerformance, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import Toast from "@/components/Toast";
import TestView from "./TestView";
import { computeLessonsStatus } from "./useKunoTimeline";
import { asDifficulty } from "./difficulty";
import { normalizeKunoFacts, getKunoModuleSnapshot } from "@/lib/kunoFacts";
import { getLessonObjective } from "./lessonUtils";
import { resolveModuleId, type OmniAreaKey } from "@/config/omniKunoModules";
import { KunoModuleHeader } from "./KunoModuleHeader";
import { KunoActivePanel } from "./KunoActivePanel";
import { KunoFinalTestBanner } from "./KunoFinalTestBanner";
import { getKunoLevel } from "@/lib/omniKunoXp";
import { KunoContainer } from "./KunoContainer";
import { ModuleOverviewDialog } from "./ModuleOverviewDialog";
import LessonAccordionItem from "./LessonAccordionItem";
import ActiveLessonInner from "./ActiveLessonInner";
import type { UnlockedCollectible } from "@/lib/collectibles";

const LOCAL_COMPLETED_PREFIX = "omnikuno_local_completed_";

const readStoredCompletedIds = (moduleId: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${LOCAL_COMPLETED_PREFIX}${moduleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
    }
  } catch {
    // ignore malformed storage
  }
  return [];
};

const persistCompletedIds = (moduleId: string, ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${LOCAL_COMPLETED_PREFIX}${moduleId}`, JSON.stringify(ids));
  } catch {
    // ignore quota issues
  }
};

const mergeUniqueIds = (...lists: Array<ReadonlyArray<string>>) => {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) {
    for (const value of list) {
      if (typeof value !== "string" || !value.length) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      merged.push(value);
    }
  }
  return merged;
};

function useStableIdList(ids: ReadonlyArray<string>) {
  const key = useMemo(() => JSON.stringify(ids), [ids]);
  return useMemo(() => {
    try {
      return JSON.parse(key) as string[];
    } catch {
      return [];
    }
  }, [key]);
}

type ModuleFinalTestContent = {
  testId: string;
  heading: string;
  title: string;
  description: string;
  buttonLabel: string;
  moduleName: string;
};

type LessonToastPayload = {
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

type SupportedFinalTestArea =
  | "emotional_balance"
  | "focus_clarity"
  | "relationships_communication"
  | "energy_body"
  | "self_trust"
  | "decision_discernment"
  | "willpower_perseverance"
  | "optimal_weight_management";

type TimelineItemWithMeta = ReturnType<typeof computeLessonsStatus>[number] & {
  lesson: OmniKunoLesson | null;
  displayIndex: number;
  levelLabel?: string;
  centerLabel?: string;
  durationLabel?: string;
  description?: string;
};

const FINAL_TEST_COPY: Record<
  SupportedFinalTestArea,
  {
    testId: string;
    heading: { ro: string; en: string };
    title: { ro: string; en: string };
    description: { ro: string; en: string };
    buttonLabel: { ro: string; en: string };
    moduleName: { ro: string; en: string };
  }
> = {
  emotional_balance: {
    testId: "emotional_balance_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: { ro: "Ai parcurs toate lecțiile Echilibru Emoțional", en: "You completed all Emotional Balance lessons" },
    description: {
      ro: "Încheie călătoria cu mini-testul Echilibru Emoțional pentru a fixa claritatea obținută.",
      en: "Wrap up with the Emotional Balance mini-test to anchor the clarity you unlocked.",
    },
    buttonLabel: { ro: "Mini-test Echilibru Emoțional", en: "Emotional Balance mini-test" },
    moduleName: { ro: "Echilibru Emoțional", en: "Emotional Balance" },
  },
  focus_clarity: {
    testId: "focus_clarity_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: { ro: "Ai parcurs toate lecțiile Claritate și Focus", en: "You completed all Clarity & Focus lessons" },
    description: {
      ro: "Închide modulul cu mini-testul Claritate și Focus pentru a valida protocolul tău de atenție.",
      en: "Close the module with the Clarity & Focus mini-test to validate your clarity protocol.",
    },
    buttonLabel: { ro: "Mini-test Claritate și Focus", en: "Clarity & Focus mini-test" },
    moduleName: { ro: "Claritate și Focus", en: "Clarity & Focus" },
  },
  relationships_communication: {
    testId: "relationships_communication_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: {
      ro: "Ai parcurs toate lecțiile Relații și Comunicare",
      en: "You completed all Relationships & Communication lessons",
    },
    description: {
      ro: "Încheie modulul cu mini-testul Relații și Comunicare pentru a fixa protocolul de ascultare și limite.",
      en: "Close the module with the Relationships & Communication mini-test to reinforce the listening and boundaries protocol.",
    },
    buttonLabel: { ro: "Mini-test Relații și Comunicare", en: "Relationships & Communication mini-test" },
    moduleName: { ro: "Relații și Comunicare", en: "Relationships & Communication" },
  },
  energy_body: {
    testId: "energy_body_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: { ro: "Ai parcurs toate lecțiile Energie & Corp", en: "You completed all Energy & Body lessons" },
    description: {
      ro: "Încheie modulul cu mini-testul Energie & Corp pentru a valida protocolul de resetare și ritualurile tale.",
      en: "Close the module with the Energy & Body mini-test to reinforce your reset protocol and rituals.",
    },
    buttonLabel: { ro: "Mini-test Energie & Corp", en: "Energy & Body mini-test" },
    moduleName: { ro: "Energie & Corp", en: "Energy & Body" },
  },
  self_trust: {
    testId: "self_trust_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: { ro: "Ai parcurs toate lecțiile Încredere în Sine", en: "You completed all Self-Trust lessons" },
    description: {
      ro: "Încheie modulul cu mini-testul Încredere în Sine pentru a întări protocolul realist și reparațiile rapide.",
      en: "Close the module with the Self-Trust mini-test to reinforce the realistic promise protocol and quick repairs.",
    },
    buttonLabel: { ro: "Mini-test Încredere în Sine", en: "Self-Trust mini-test" },
    moduleName: { ro: "Încredere în Sine", en: "Self-Trust" },
  },
  decision_discernment: {
    testId: "decision_discernment_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: {
      ro: "Ai parcurs toate lecțiile Discernământ & Decizii",
      en: "You completed all Discernment & Decisions lessons",
    },
    description: {
      ro: "Încheie modulul cu mini-testul Discernământ & Decizii pentru a fixa protocolul calm și ritualul tău de alegere.",
      en: "Close the module with the Discernment & Decisions mini-test to reinforce your calm decision protocol and ritual.",
    },
    buttonLabel: { ro: "Mini-test Discernământ & Decizii", en: "Discernment & Decisions mini-test" },
    moduleName: { ro: "Discernământ & Decizii", en: "Discernment & Decisions" },
  },
  willpower_perseverance: {
    testId: "willpower_perseverance_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: {
      ro: "Ai parcurs toate lecțiile Voință & Perseverență",
      en: "You completed all Willpower & Perseverance lessons",
    },
    description: {
      ro: "Încheie modulul cu mini-testul Voință & Perseverență pentru a întări pașii mici și ritualul de protecție a energiei.",
      en: "Close the module with the Willpower & Perseverance mini-test to reinforce the small steps and energy protection ritual.",
    },
    buttonLabel: { ro: "Mini-test Voință & Perseverență", en: "Willpower & Perseverance mini-test" },
    moduleName: { ro: "Voință & Perseverență", en: "Willpower & Perseverance" },
  },
  optimal_weight_management: {
    testId: "optimal_weight_management_final_test",
    heading: { ro: "Finalizare modul", en: "Module completion" },
    title: {
      ro: "Ai parcurs toate lecțiile Greutate optimă",
      en: "You completed all Optimal Weight lessons",
    },
    description: {
      ro: "Încheie modulul cu mini-testul Greutate optimă pentru a fixa pașii mici și ritualurile zilnice.",
      en: "Close the module with the Optimal Weight mini-test to consolidate the small steps and daily rituals.",
    },
    buttonLabel: { ro: "Mini-test Greutate optimă", en: "Optimal Weight mini-test" },
    moduleName: { ro: "Greutate optimă", en: "Optimal Weight" },
  },
};

function getFinalTestConfig(areaKey: OmniAreaKey, lang: "ro" | "en"): ModuleFinalTestContent | null {
  if (!(areaKey in FINAL_TEST_COPY)) return null;
  const copy = FINAL_TEST_COPY[areaKey as SupportedFinalTestArea];
  if (!copy) return null;
  return {
    testId: copy.testId,
    heading: copy.heading[lang] ?? copy.heading.ro,
    title: copy.title[lang] ?? copy.title.ro,
    description: copy.description[lang] ?? copy.description.ro,
    buttonLabel: copy.buttonLabel[lang] ?? copy.buttonLabel.ro,
    moduleName: copy.moduleName[lang] ?? copy.moduleName.ro,
  };
}

export default function OmniKunoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const isReplayMode = searchParams?.get("replay") === "1";
  const { data: progress } = useProgressFacts(profile?.id);
  const kunoFacts = useMemo(() => normalizeKunoFacts(progress?.omni?.kuno), [progress?.omni?.kuno]);
  const { lang } = useI18n();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<LessonToastPayload | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const handleToast = useCallback((payload: LessonToastPayload) => {
    setToastMsg(payload);
  }, []);
  const moduleEntries = useMemo(() => Object.entries(OMNIKUNO_MODULES) as Array<[OmniAreaKey, OmniKunoModuleConfig]>, []);
  const [localCompletionVersion, setLocalCompletionVersion] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const notifyLocalProgressUpdate = useCallback(() => {
    setLocalCompletionVersion((v) => v + 1);
  }, []);
  const moduleParam = searchParams?.get("module");
  const areaParam = searchParams?.get("area");
  const lessonParamRaw = searchParams?.get("lesson");
  const lessonHasExplicitNone = lessonParamRaw === "none";
  const lessonQueryParam = lessonHasExplicitNone ? null : lessonParamRaw;
  const parseModuleParam = useCallback((value?: string | null): OmniAreaKey | null => {
    const resolved = resolveModuleId(value ?? undefined);
    if (resolved && OMNIKUNO_MODULES[resolved]) {
      return resolved;
    }
    return null;
  }, []);
  const moduleFromUrl = parseModuleParam(moduleParam);
  const areaFromUrl = parseModuleParam(areaParam);
  const recommendedArea = useMemo<OmniAreaKey | null>(() => {
    const direct = parseModuleParam(kunoFacts.recommendedArea);
    if (direct) return direct;
    return parseModuleParam(kunoFacts.recommendedModuleId);
  }, [kunoFacts.recommendedArea, kunoFacts.recommendedModuleId, parseModuleParam]);
  const getNextLessonForArea = useCallback(
    (area: OmniAreaKey, options?: { includeLocalCache?: boolean }) => {
      const moduleConfig = OMNIKUNO_MODULES[area];
      const snapshot = getKunoModuleSnapshot(kunoFacts, moduleConfig.moduleId);
      const shouldUseLocal = (options?.includeLocalCache ?? true) && isHydrated;
      const localCompleted = shouldUseLocal ? readStoredCompletedIds(moduleConfig.moduleId) : [];
      const completed = mergeUniqueIds(snapshot.completedIds ?? [], localCompleted);
      const ordered = moduleConfig.lessons.slice().sort((a, b) => a.order - b.order);
      const pendingLesson = ordered.find((lesson) => !completed.includes(lesson.id));
      return { lessonId: pendingLesson?.id ?? null, module: moduleConfig };
    },
    [isHydrated, kunoFacts],
  );
  const fallbackAreaOrder = useMemo(() => {
    const recommendedList = [recommendedArea, ...moduleEntries.map(([areaKey]) => areaKey)].filter(
      (value, index, array): value is OmniAreaKey => Boolean(value) && array.indexOf(value) === index,
    );
    return recommendedList;
  }, [moduleEntries, recommendedArea]);
  const activeAreaKey = useMemo(() => {
    const resolveArea = (area: OmniAreaKey) => getNextLessonForArea(area, { includeLocalCache: false }).lessonId !== null;
    if (moduleFromUrl) {
      return moduleFromUrl;
    }
    if (areaFromUrl) {
      return areaFromUrl;
    }
    const pendingArea = fallbackAreaOrder.find((area) => resolveArea(area));
    return pendingArea ?? fallbackAreaOrder[0] ?? "emotional_balance";
  }, [areaFromUrl, fallbackAreaOrder, getNextLessonForArea, moduleFromUrl]);
  const activeModule = OMNIKUNO_MODULES[activeAreaKey];
  const moduleSnapshot = getKunoModuleSnapshot(kunoFacts, activeModule.moduleId);
  const completedIdsFromFacts = moduleSnapshot.completedIds;
  const performanceFromFacts = (moduleSnapshot.performance ?? null) as Partial<KunoPerformanceSnapshot> | null;
  const normalizedPerformance = normalizePerformance(performanceFromFacts);
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [finalTestResult, setFinalTestResult] = useState<{ correct: number; total: number } | null>(null);
  const resetFinalTestState = useCallback(() => {
    setShowFinalTest(false);
    setFinalTestResult(null);
  }, []);
  const updateUrl = useCallback(
    (updates: { area?: OmniAreaKey | null; module?: string | null; lesson?: string | null }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      let changed = false;
      if (updates.area !== undefined) {
        if (updates.area) {
          if (params.get("area") !== updates.area) changed = true;
          params.set("area", updates.area);
        } else if (params.has("area")) {
          params.delete("area");
          changed = true;
        }
      }
      if (updates.module !== undefined) {
          if (updates.module) {
            if (params.get("module") !== updates.module) changed = true;
            params.set("module", updates.module);
          } else if (params.has("module")) {
            params.delete("module");
            changed = true;
          }
      }
      if (updates.lesson !== undefined) {
        const lessonValue = updates.lesson ?? "none";
        if (params.get("lesson") !== lessonValue) changed = true;
        params.set("lesson", lessonValue);
      }
      if (!changed) return;
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const handleAreaSelect = useCallback(
    (nextArea: ExperienceProps["areaKey"]) => {
      resetFinalTestState();
      const { lessonId, module: moduleConfig } = getNextLessonForArea(nextArea);
      updateUrl({ area: nextArea, module: moduleConfig.moduleId, lesson: lessonId });
    },
    [getNextLessonForArea, resetFinalTestState, updateUrl],
  );
  const orderedModuleLessons = useMemo(() => activeModule.lessons.slice().sort((a, b) => a.order - b.order), [activeModule.lessons]);
  const resolvedLessonIdFromQuery =
    lessonQueryParam && orderedModuleLessons.some((lesson) => lesson.id === lessonQueryParam) ? lessonQueryParam : null;
  const storedLocalCompletions = useMemo(() => {
    const version = localCompletionVersion;
    void version;
    if (!isHydrated) return [];
    return readStoredCompletedIds(activeModule.moduleId);
  }, [activeModule.moduleId, isHydrated, localCompletionVersion]);
  const mergedEffectiveCompletedIds = useMemo(
    () => mergeUniqueIds(completedIdsFromFacts, storedLocalCompletions),
    [completedIdsFromFacts, storedLocalCompletions],
  );
  const effectiveCompletedIds = useStableIdList(mergedEffectiveCompletedIds);
  const pendingLessonId = useMemo(() => {
    const next = orderedModuleLessons.find((lesson) => !effectiveCompletedIds.includes(lesson.id));
    return next?.id ?? orderedModuleLessons[0]?.id ?? null;
  }, [effectiveCompletedIds, orderedModuleLessons]);
  const fallbackLessonId = pendingLessonId;
  const initialLessonIdForModule = resolvedLessonIdFromQuery ?? (lessonHasExplicitNone ? null : fallbackLessonId);
  useEffect(() => {
    const needsAreaSync = areaParam !== activeAreaKey;
    const needsModuleSync = moduleParam !== activeModule.moduleId;
    const needsLessonSync =
      initialLessonIdForModule != null ? lessonQueryParam !== initialLessonIdForModule : !lessonHasExplicitNone;

    if (needsAreaSync || needsModuleSync || needsLessonSync) {
      updateUrl({
        area: activeAreaKey,
        module: activeModule.moduleId,
        lesson: initialLessonIdForModule ?? null,
      });
    }
  }, [
    activeAreaKey,
    activeModule.moduleId,
    areaParam,
    moduleParam,
    initialLessonIdForModule,
    lessonHasExplicitNone,
    lessonQueryParam,
    updateUrl,
  ]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!isHydrated) return;
    if (moduleFromUrl || areaFromUrl) return;
    const preferredArea = fallbackAreaOrder.find((area) => {
      const { lessonId } = getNextLessonForArea(area, { includeLocalCache: true });
      return lessonId !== null;
    });
    if (preferredArea && preferredArea !== activeAreaKey) {
      const { lessonId, module } = getNextLessonForArea(preferredArea, { includeLocalCache: true });
      updateUrl({ area: preferredArea, module: module.moduleId, lesson: lessonId });
    }
  }, [
    activeAreaKey,
    areaFromUrl,
    fallbackAreaOrder,
    getNextLessonForArea,
    isHydrated,
    moduleFromUrl,
    updateUrl,
  ]);
  const areaStats = useMemo(() => {
    const version = localCompletionVersion;
    void version;
    return Object.fromEntries(
      moduleEntries.map(([areaKey, module]) => {
        const snapshot = kunoFacts.modules[module.moduleId];
        const lessonIdSet = new Set(module.lessons.map((lesson) => lesson.id));
        const remoteCompleted = (snapshot?.completedIds ?? []).filter((id) => lessonIdSet.has(id));
        const storedCompleted = isHydrated ? readStoredCompletedIds(module.moduleId) : [];
        const completedIds = mergeUniqueIds(remoteCompleted, storedCompleted);
        const totalLessons = module.lessons.length;
        const progressPct = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;
        return [
          areaKey,
          {
            completed: completedIds.length,
            total: totalLessons,
            percentage: Number.isFinite(progressPct) ? Math.min(100, Math.max(0, progressPct)) : 0,
          },
        ];
      }),
    ) as Record<OmniAreaKey, { completed: number; total: number; percentage: number }>;
  }, [isHydrated, kunoFacts.modules, moduleEntries, localCompletionVersion]);
  const areaLabelMap = useMemo<Record<OmniAreaKey, string>>(() => {
    if (lang === "ro") {
      return {
        emotional_balance: "Echilibru emoțional",
        focus_clarity: "Claritate & Focus",
        energy_body: "Energie & Corp",
        relationships_communication: "Relații & Comunicare",
        decision_discernment: "Discernământ & Decizii",
        self_trust: "Încredere în Sine",
        willpower_perseverance: "Voință & Perseverență",
        optimal_weight_management: "Greutate optimă",
      };
    }
    return {
      emotional_balance: "Emotional Balance",
      focus_clarity: "Clarity & Focus",
      energy_body: "Energy & Body",
      relationships_communication: "Relationships & Communication",
      decision_discernment: "Discernment & Decisions",
      self_trust: "Self-Trust",
      willpower_perseverance: "Willpower & Perseverance",
      optimal_weight_management: "Optimal Weight",
    };
  }, [lang]);
  const finalTestConfig = useMemo(() => getFinalTestConfig(activeAreaKey, lang), [activeAreaKey, lang]);
  const handleLessonSelect = useCallback(
    (lessonId: string | null) => {
      updateUrl({ area: activeAreaKey, module: activeModule.moduleId, lesson: lessonId });
    },
    [activeAreaKey, activeModule.moduleId, updateUrl],
  );
  const focusLabel = areaLabelMap[activeAreaKey];
  const moduleStateKey = `${activeModule.moduleId}:${completedIdsFromFacts.slice().sort().join("|")}:${normalizedPerformance.difficultyBias}:${isReplayMode ? `replay:${lessonQueryParam ?? "l1"}` : "normal"}`;
  const completedLessonsCount = effectiveCompletedIds.length;
  const headerProgressSummary =
    lang === "ro"
      ? `Lecții finalizate: ${completedLessonsCount}/${activeModule.lessons.length}`
      : `Lessons completed: ${completedLessonsCount}/${activeModule.lessons.length}`;
  const totalXp = Math.max(0, Math.round(kunoFacts.global?.totalXp ?? 0));
  const { level: kunoLevel } = getKunoLevel(totalXp);
  const headerXpSummary =
    lang === "ro"
      ? `XP: ${totalXp} · Nivel global ${kunoLevel}`
      : `XP: ${totalXp} · Global level ${kunoLevel}`;
  const moduleLevelLabel = lang === "ro" ? "Nivel 1" : "Level 1";

  const goToAuth = useCallback(() => router.push("/auth"), [router]);

  const header = (
    <SiteHeader
      onAuthRequest={!profile?.id ? goToAuth : undefined}
      onMenuToggle={() => setMenuOpen(true)}
    />
  );

  return (
    <AppShell header={header}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-[var(--omni-ink)]">
        <div className="space-y-6">
          <KunoContainer>
            <div className="space-y-4" data-testid="omni-kuno-header">
              <KunoModuleHeader
                title={
                  lang === "ro"
                    ? "Acumulează cunoaștere pe tema"
                    : "Accumulate knowledge on"
                }
                focusLabel={focusLabel}
                moduleLevelLabel={moduleLevelLabel}
                progressSummary={headerProgressSummary}
                xpSummary={headerXpSummary}
                overviewLabel={lang === "ro" ? "Vezi toate lecțiile" : "View all lessons"}
                onOpenOverview={() => setOverviewOpen(true)}
              />
            </div>
          </KunoContainer>
          <div className="flex flex-col gap-6 px-2 sm:px-3 lg:flex-row">
            <aside className="order-2 rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-4 shadow-sm lg:order-1 lg:w-60 lg:flex-shrink-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">Teme OmniKuno</p>
            <ul className="space-y-2 text-sm text-[var(--omni-ink)]">
              {moduleEntries.map(([key, module]) => {
                const isActive = key === activeAreaKey;
                const stat = areaStats[key];
                const isRecommended = recommendedArea === key;
                const levelBadge = lang === "ro" ? "Nivel 1" : "Level 1";
                return (
                  <li key={module.moduleId}>
                    <button
                      type="button"
                      onClick={() => handleAreaSelect(key)}
                      className={`w-full rounded-card border px-3.5 py-3 text-left transition ${
                        isActive ? "border-[var(--omni-energy)] bg-[var(--omni-bg-paper)] shadow-[0_10px_25px_rgba(192,121,99,0.08)]" : "border-[#F0E8E0] hover:border-[#E3D3C7]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{areaLabelMap[key]}</span>
                        <div className="flex items-center gap-2">
                          {isRecommended ? (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
                              style={{
                                backgroundColor: "var(--omni-energy-tint)",
                                color: "var(--omni-energy)",
                                border: `1px solid var(--omni-border-soft)`,
                              }}
                            >
                              {lang === "ro" ? "Recomandat" : "Recommended"}
                            </span>
                          ) : null}
                          <span className={`text-xs font-semibold ${isActive ? "text-[var(--omni-energy)]" : "text-[var(--omni-muted)]"}`}>{levelBadge}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--omni-muted)]">
                        <span>
                          {stat?.completed ?? 0}/{stat?.total ?? module.lessons.length} {lang === "ro" ? "misiuni" : "missions"}
                        </span>
                        <span>{stat ? `${stat.percentage}%` : "0%"}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[#F2E7DD]">
                        <div
                          className="h-1.5 rounded-full bg-[var(--omni-accent)]"
                          style={{ width: `${Math.min(100, stat?.percentage ?? 0)}%` }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

            <section className="order-1 flex-1 space-y-6 lg:order-2 lg:basis-[65%] lg:max-w-[65%]">
              <ModuleExperience
                key={moduleStateKey}
                areaKey={activeAreaKey}
                module={activeModule}
                profileId={profile?.id}
                completedIdsFromFacts={completedIdsFromFacts}
                initialCompletedIds={effectiveCompletedIds}
                initialPerformance={normalizedPerformance}
                initialLessonId={initialLessonIdForModule}
                lessonHasExplicitNone={lessonHasExplicitNone}
                onToast={handleToast}
                showFinalTest={showFinalTest}
                finalTestResult={finalTestResult}
                onToggleFinalTest={setShowFinalTest}
                onFinalTestComplete={(result) => setFinalTestResult(result)}
                finalTestConfig={finalTestConfig}
                onLessonSelect={handleLessonSelect}
                onLocalProgressUpdate={notifyLocalProgressUpdate}
                overviewOpen={overviewOpen}
                onCloseOverview={() => setOverviewOpen(false)}
                isReplayMode={isReplayMode}
              />
            </section>
          </div>
        </div>
      </div>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      {toastMsg ? (
        <Toast
          message={toastMsg.message}
          actionLabel={toastMsg.actionLabel}
          onAction={
            toastMsg.actionHref
              ? () => {
                  router.push(toastMsg.actionHref as string);
                  setToastMsg(null);
                }
              : undefined
          }
          onClose={() => setToastMsg(null)}
        />
      ) : null}
    </AppShell>
  );
}

type ExperienceProps = {
  areaKey: OmniAreaKey;
  module: OmniKunoModuleConfig;
  profileId?: string | null;
  completedIdsFromFacts: string[];
  initialPerformance: KunoPerformanceSnapshot;
  initialLessonId?: string | null;
  lessonHasExplicitNone?: boolean;
  onLessonSelect?: (lessonId: string | null) => void;
  initialCompletedIds?: readonly string[] | null;
  onLocalProgressUpdate?: () => void;
  onToast?: (payload: LessonToastPayload) => void;
  showFinalTest?: boolean;
  finalTestResult?: { correct: number; total: number } | null;
  onToggleFinalTest?: (value: boolean) => void;
  onFinalTestComplete?: (result: { correct: number; total: number } | null) => void;
  finalTestConfig?: ModuleFinalTestContent | null;
  overviewOpen: boolean;
  onCloseOverview: () => void;
  isReplayMode?: boolean;
};

function ModuleExperience({
  areaKey,
  module,
  profileId,
  completedIdsFromFacts,
  initialCompletedIds,
  initialPerformance,
  initialLessonId = null,
  lessonHasExplicitNone = false,
  onLessonSelect,
  onLocalProgressUpdate,
  onToast,
  showFinalTest = false,
  finalTestResult = null,
  onToggleFinalTest,
  onFinalTestComplete,
  finalTestConfig = null,
  overviewOpen,
  onCloseOverview,
  isReplayMode = false,
}: ExperienceProps) {
  const { t, lang } = useI18n();
  const mergedInitialCompletedRaw = useMemo(
    () => mergeUniqueIds(completedIdsFromFacts, Array.isArray(initialCompletedIds) ? initialCompletedIds : []),
    [completedIdsFromFacts, initialCompletedIds],
  );
  const mergedInitialCompleted = useStableIdList(mergedInitialCompletedRaw);
  const [localOnlyCompletedByModule, setLocalOnlyCompletedByModule] = useState<Record<string, string[]>>({});
  const localOnlyCompleted = useMemo(
    () => localOnlyCompletedByModule[module.moduleId] ?? [],
    [localOnlyCompletedByModule, module.moduleId],
  );
  const combinedLocalCompleted = useMemo(
    () => mergeUniqueIds(mergedInitialCompleted, localOnlyCompleted),
    [mergedInitialCompleted, localOnlyCompleted],
  );
  const localCompleted = useStableIdList(combinedLocalCompleted);
  const [localPerformance, setLocalPerformance] = useState<KunoPerformanceSnapshot>(initialPerformance);
  const [lessonProgressByModule, setLessonProgressByModule] = useState<
    Record<string, Record<string, { current: number; total: number }>>
  >({});
  const moduleLessonProgress = lessonProgressByModule[module.moduleId] ?? {};
  const [openLessonsByModule, setOpenLessonsByModule] = useState<Record<string, string | null>>({});
  const [justActivatedLessonId, setJustActivatedLessonId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const timeline = useMemo(
    () => computeLessonsStatus(module.lessons, localCompleted),
    [module.lessons, localCompleted],
  );
  const orderedLessons = useMemo(() => module.lessons.slice().sort((a, b) => a.order - b.order), [module.lessons]);
  const initialReplayLessonId = useMemo(() => {
    if (!isReplayMode) return null;
    if (initialLessonId && module.lessons.some((lesson) => lesson.id === initialLessonId)) {
      return initialLessonId;
    }
    return orderedLessons[0]?.id ?? null;
  }, [initialLessonId, isReplayMode, module.lessons, orderedLessons]);
  const [replayActiveLessonId, setReplayActiveLessonId] = useState<string | null>(() =>
    isReplayMode ? initialReplayLessonId ?? orderedLessons[0]?.id ?? null : null,
  );
  const [replayLastCompleted, setReplayLastCompleted] = useState<string | null>(null);
  const replayNextLessonId = useMemo(() => {
    if (!isReplayMode) return null;
    return replayActiveLessonId ?? initialReplayLessonId ?? orderedLessons[0]?.id ?? null;
  }, [initialReplayLessonId, isReplayMode, orderedLessons, replayActiveLessonId]);
  const replayHref = useMemo(() => {
    return { pathname: `/replay/module/${module.moduleId}` };
  }, [module.moduleId]);
  const flatTimeline = useMemo(() => timeline.slice().sort((a, b) => a.order - b.order), [timeline]);
  const timelineWithMeta = useMemo<TimelineItemWithMeta[]>(() => {
    return flatTimeline.map((item) => {
      const lessonDef = module.lessons.find((lesson) => lesson.id === item.id) ?? null;
      const difficultyKey = lessonDef ? asDifficulty(lessonDef.difficulty) : "easy";
      const levelLabel = lessonDef ? String(t(`omnikuno.difficulty.${difficultyKey}Label`)) : "";
      const centerLabel = (() => {
        if (!lessonDef?.center) return "";
        const map =
          lang === "ro"
            ? { mind: "Minte", body: "Corp", heart: "Inimă", combined: "Integrat" }
            : { mind: "Mind", body: "Body", heart: "Heart", combined: "Integrated" };
        return map[lessonDef.center];
      })();
      const durationLabel = lessonDef?.durationMin ? `~${lessonDef.durationMin} min` : "";
      const description = lessonDef ? getLessonObjective(lessonDef, lang) : "";
      return {
        ...item,
        lesson: lessonDef,
        displayIndex: lessonDef?.order ?? item.order,
        levelLabel,
        centerLabel,
        durationLabel,
        description,
      } as TimelineItemWithMeta;
    });
  }, [flatTimeline, module.lessons, lang, t]);
  const moduleCompleted = useMemo(() => timelineWithMeta.every((item) => item.status === "done"), [timelineWithMeta]);
  const completedCount = useMemo(() => timelineWithMeta.filter((item) => item.status === "done").length, [timelineWithMeta]);
  const completionPct = timelineWithMeta.length ? Math.round((completedCount / timelineWithMeta.length) * 100) : 0;
  const activeItem = timelineWithMeta.find((item) => item.status === "active") ?? null;
  const visibleTimeline = useMemo(() => {
    const result: TimelineItemWithMeta[] = [];
    let lockedIncluded = false;
    for (const item of timelineWithMeta) {
      if (item.status === "locked") {
        if (lockedIncluded) {
          continue;
        }
        lockedIncluded = true;
      }
      result.push(item);
    }
    return result;
  }, [timelineWithMeta]);
  const storedLessonId = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("omnikuno_last_module");
      if (!raw) return null;
      const payload = JSON.parse(raw) as { moduleId?: string; lessonId?: string };
      if (payload?.moduleId === module.moduleId && payload.lessonId) {
        const exists = timelineWithMeta.some((item) => item.id === payload.lessonId);
        return exists ? payload.lessonId : null;
      }
    } catch {
      // ignore malformed storage
    }
    return null;
  }, [module.moduleId, timelineWithMeta]);
  const defaultOpenLessonId = useMemo(() => {
    if (lessonHasExplicitNone || !timelineWithMeta.length) return null;
    if (initialLessonId && timelineWithMeta.some((item) => item.id === initialLessonId)) {
      return initialLessonId;
    }
    if (storedLessonId) return storedLessonId;
    return activeItem?.id ?? null;
  }, [activeItem?.id, initialLessonId, lessonHasExplicitNone, storedLessonId, timelineWithMeta]);
  const baseOpenLessonId = Object.prototype.hasOwnProperty.call(openLessonsByModule, module.moduleId)
    ? openLessonsByModule[module.moduleId] ?? null
    : defaultOpenLessonId;
  const openLessonId = isReplayMode ? replayActiveLessonId : baseOpenLessonId;
  const lastPersistSignature = useRef<string | null>(null);
  useEffect(() => {
    if (isReplayMode) return;
    const signature = `${module.moduleId}:${JSON.stringify(localCompleted)}`;
    if (lastPersistSignature.current === signature) return;
    lastPersistSignature.current = signature;
    persistCompletedIds(module.moduleId, localCompleted);
    onLocalProgressUpdate?.();
  }, [isReplayMode, localCompleted, module.moduleId, onLocalProgressUpdate]);
  useEffect(() => {
    if (!moduleCompleted) {
      if (showFinalTest) {
        onToggleFinalTest?.(false);
      }
      if (finalTestResult) {
        onFinalTestComplete?.(null);
      }
      return;
    }
    if (moduleCompleted && finalTestConfig && !showFinalTest && !finalTestResult) {
      onToggleFinalTest?.(true);
    }
  }, [moduleCompleted, finalTestConfig, finalTestResult, onFinalTestComplete, onToggleFinalTest, showFinalTest]);
  const setOpenLessonForModule = useCallback(
    (nextLessonId: string | null) => {
      setOpenLessonsByModule((prev) => {
        const prevHas = Object.prototype.hasOwnProperty.call(prev, module.moduleId);
        const prevValue = prev[module.moduleId] ?? null;
        if (nextLessonId === null) {
          if (!prevHas) {
            return prev;
          }
          const nextState = { ...prev };
          delete nextState[module.moduleId];
          return nextState;
        }
        if (prevHas && prevValue === nextLessonId) {
          return prev;
        }
        return { ...prev, [module.moduleId]: nextLessonId };
      });
    },
    [module.moduleId],
  );
  useEffect(() => {
    if (!isReplayMode || !replayActiveLessonId) return;
    const raf = window.requestAnimationFrame(() => {
      const anchor = document.getElementById(`kuno-lesson-${replayActiveLessonId}`);
      if (anchor) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isReplayMode, replayActiveLessonId]);
  useEffect(() => {
    onLessonSelect?.(openLessonId);
  }, [openLessonId, onLessonSelect]);
  const triggerLessonHighlight = useCallback((lessonId: string) => {
    setJustActivatedLessonId(lessonId);
    if (typeof window !== "undefined") {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      // Keep the highlight a bit longer so the user clearly sees the transition to the next lesson
      highlightTimeoutRef.current = window.setTimeout(() => {
        setJustActivatedLessonId(null);
        highlightTimeoutRef.current = null;
      }, 2800) as unknown as number;
    }
  }, []);
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || isReplayMode) return;
    try {
      const payload = {
        moduleId: module.moduleId,
        areaKey,
        lessonId: openLessonId,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem("omnikuno_last_module", JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("omnikuno:last-module", { detail: payload }));
    } catch {
      // ignore write errors (private / quota)
    }
  }, [areaKey, isReplayMode, module.moduleId, openLessonId]);
  const langKey: "ro" | "en" = lang === "ro" ? "ro" : "en";
  const scrollToLesson = useCallback((lessonId: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(`kuno-lesson-${lessonId}`);
    if (!el) return;
    const yOffset = 120;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - yOffset;
    window.scrollTo({ top: targetTop > 0 ? targetTop : 0, behavior: "smooth" });
  }, []);
  const handleLessonProgress = useCallback(
    (lessonId: string, current: number, total: number) => {
      setLessonProgressByModule((prev) => {
        const prevModuleMap = prev[module.moduleId] ?? {};
        const existing = prevModuleMap[lessonId];
        if (existing && existing.current === current && existing.total === total) {
          return prev;
        }
        return {
          ...prev,
          [module.moduleId]: { ...prevModuleMap, [lessonId]: { current, total } },
        };
      });
    },
    [module.moduleId],
  );
  const handleLessonCompleted = useCallback(
    (
      lessonId: string,
      meta?: {
        updatedPerformance?: KunoPerformanceSnapshot;
        score?: number;
        timeSpentSec?: number;
        unlockedCollectibles?: UnlockedCollectible[];
      },
    ) => {
      if (isReplayMode) {
        const currentIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
        const nextLesson =
          currentIndex >= 0 && currentIndex < orderedLessons.length - 1
            ? orderedLessons[currentIndex + 1]
            : null;
        console.log("[Replay] handleLessonCompleted", {
          isReplayMode,
          finishedLessonId: lessonId,
          nextReplayLessonId: nextLesson?.id ?? null,
        });
        if (nextLesson) {
          setReplayActiveLessonId(nextLesson.id);
          setReplayLastCompleted(lessonId);
          scrollToLesson(nextLesson.id);
          triggerLessonHighlight(nextLesson.id);
        } else {
          setReplayActiveLessonId(null);
          setReplayLastCompleted(lessonId);
          if (onToast) {
            onToast({
              message: lang === "ro" ? "Ai reluat toate lecțiile din modul." : "You replayed all lessons in this module.",
            });
          }
        }
        return;
      }
      setLocalOnlyCompletedByModule((prev) => {
        const bucket = prev[module.moduleId] ?? [];
        if (bucket.includes(lessonId)) return prev;
        return { ...prev, [module.moduleId]: [...bucket, lessonId] };
      });
      if (meta?.updatedPerformance) {
        setLocalPerformance(meta.updatedPerformance);
      }
      if (onToast) {
        if (meta?.score != null) {
          onToast({
            message:
              lang === "ro"
                ? `Quiz finalizat cu ${meta.score}%. Continuă misiunile!`
                : `Quiz completed with ${meta.score}%. Keep the missions rolling!`,
          });
        } else {
          onToast({
            message: lang === "ro" ? "Lecție finalizată și XP actualizat." : "Lesson completed and XP updated.",
          });
        }
        if (meta?.unlockedCollectibles?.length) {
          const actionLabel = lang === "ro" ? "Vezi detalii" : "View details";
          meta.unlockedCollectibles.forEach((collectible) => {
            onToast({
              message:
                lang === "ro"
                  ? `Ai deblocat noul protocol: ${collectible.title}`
                  : `You unlocked a new protocol: ${collectible.title}`,
              actionLabel,
              actionHref: "/collectibles",
            });
          });
        }
      }
      const currentIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
      const nextLesson = currentIndex >= 0 ? orderedLessons.slice(currentIndex + 1).find((lesson) => lesson) : null;
      if (nextLesson) {
        setOpenLessonForModule(nextLesson.id);
        scrollToLesson(nextLesson.id);
        triggerLessonHighlight(nextLesson.id);
      } else {
        setOpenLessonForModule(null);
      }
    },
    [
      isReplayMode,
      lang,
      module.moduleId,
      onToast,
      orderedLessons,
      scrollToLesson,
      setLocalOnlyCompletedByModule,
      setOpenLessonForModule,
      setReplayActiveLessonId,
      triggerLessonHighlight,
    ],
  );
  const translate = useCallback(
    (key: string) => {
      const value = t(key);
      if (typeof value === "string" || typeof value === "number") return value;
      return undefined;
    },
    [t],
  );
  const handleContinueMission = useCallback(() => {
    if (!activeItem) return;
    setOpenLessonForModule(activeItem.id);
    scrollToLesson(activeItem.id);
    triggerLessonHighlight(activeItem.id);
  }, [activeItem, scrollToLesson, setOpenLessonForModule, triggerLessonHighlight]);
  return (
    <div className="space-y-8">
      {isReplayMode ? (
        <div className="rounded-card border border-dashed border-[var(--omni-border-soft)] bg-[color-mix(in srgb,var(--omni-energy)_6%,white)] px-4 py-3 text-xs text-[var(--omni-ink)] shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">Replay DEBUG</p>
          <ul className="mt-1 space-y-0.5 font-mono text-[11px]">
            <li>isReplayMode: {String(isReplayMode)}</li>
            <li>replayScope: module</li>
            <li>replayActiveLessonId: {replayActiveLessonId ?? "-"}</li>
            <li>nextLessonId: {replayNextLessonId ?? "-"}</li>
            <li>lastCompletedLessonId: {replayLastCompleted ?? "-"}</li>
          </ul>
        </div>
      ) : null}
      <KunoContainer align="left">
        <KunoActivePanel
          progressSummary={
            lang === "ro"
              ? `Progres: ${completedCount}/${timelineWithMeta.length} misiuni`
              : `Progress: ${completedCount}/${timelineWithMeta.length} missions`
          }
          nextLessonTitle={activeItem?.lesson?.title ?? null}
          onContinue={activeItem ? handleContinueMission : undefined}
          disabled={!activeItem}
        >
          <div className="h-2 rounded-full bg-[#F4EDE4]">
            <div className="h-2 rounded-full bg-[var(--omni-accent)]" style={{ width: `${Math.min(100, completionPct)}%` }} />
          </div>
        </KunoActivePanel>
      </KunoContainer>
      <KunoContainer align="left">
        {visibleTimeline.length ? (
          <div className="space-y-3 md:space-y-4" data-testid="kuno-timeline">
            {visibleTimeline.map((item, idx) => {
              const lessonConfig = item.lesson ?? module.lessons.find((lesson) => lesson.id === item.id);
              const isOpen = item.id === openLessonId;
              const isReplayTarget = Boolean(isReplayMode && replayActiveLessonId === item.id);
              const progress = moduleLessonProgress[item.id];
              const currentStep = progress?.current ?? 1;
              const totalSteps =
                progress?.total ??
                lessonConfig?.screensCount ??
                (lessonConfig?.type === "quiz" ? 1 : 1);
              return (
                <LessonAccordionItem
                  key={item.id}
                  containerId={`kuno-lesson-${item.id}`}
                  id={item.id}
                  index={idx + 1}
                  title={item.title}
                  description={item.description ?? ""}
                  level={item.levelLabel ?? ""}
                  center={item.centerLabel ?? ""}
                  duration={item.durationLabel ?? ""}
                  status={(isReplayTarget ? "active" : item.status) as "done" | "active" | "locked"}
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  isOpen={Boolean(isOpen)}
                  onToggle={() => {
                    if (!isReplayTarget && item.status !== "active") return;
                    const next = openLessonId === item.id ? null : item.id;
                    setOpenLessonForModule(next);
                  }}
                  lang={langKey}
                  justActivated={item.id === justActivatedLessonId}
                  forceActive={isReplayTarget}
                >
                  {isOpen && lessonConfig ? (
                    <ActiveLessonInner
                      areaKey={areaKey}
                      module={module}
                      lesson={lessonConfig}
                      existingCompletedIds={localCompleted}
                      ownerId={profileId}
                      performanceSnapshot={localPerformance}
                      onLessonCompleted={(lessonId, meta) => handleLessonCompleted(lessonId, meta)}
                      onProgressChange={handleLessonProgress}
                      isReplayMode={isReplayMode}
                    />
                  ) : null}
                </LessonAccordionItem>
              );
            })}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/70 px-4 py-6 text-center text-sm text-[var(--omni-muted)]">
            {lang === "ro"
              ? "Acest modul nu are încă misiuni configurate."
              : "This module does not have missions configured yet."}
          </div>
        )}
        {isReplayMode && !replayActiveLessonId ? (
          <p className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-center text-sm text-[var(--omni-ink)]">
            {lang === "ro"
              ? "Replay complet: ai revăzut toate lecțiile din modul."
              : "Replay complete: you revisited every lesson in this module."}
          </p>
        ) : null}
      </KunoContainer>
      {moduleCompleted && finalTestConfig ? (
        <KunoContainer align="left">
          <div className="space-y-4">
            <KunoFinalTestBanner
              areaKey={areaKey}
              finalTestConfig={finalTestConfig}
              showFinalTest={showFinalTest}
              onToggleFinalTest={(value) => onToggleFinalTest?.(value)}
              lang={lang}
              finalTestResult={finalTestResult}
              replayHref={replayHref}
            />
            {showFinalTest ? (
              <TestView
                testId={finalTestConfig.testId}
                onCompleted={(result) => {
                  onFinalTestComplete?.(result);
                  if (onToast) {
                    onToast({
                      message: `${finalTestConfig.moduleName} · mini-test finalizat (${result.correct}/${result.total}).`,
                    });
                  }
                }}
              />
            ) : null}
          </div>
        </KunoContainer>
      ) : null}
      <ModuleOverviewDialog
        open={overviewOpen}
        onClose={onCloseOverview}
        timeline={flatTimeline}
        module={module}
        lang={lang}
        t={translate}
        onSelectLesson={(lessonId) => {
          setOpenLessonForModule(lessonId);
          onCloseOverview();
        }}
      />
    </div>
  );
}
