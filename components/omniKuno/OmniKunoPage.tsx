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
import { useNavigationLinks } from "@/components/useNavigationLinks";
import Toast from "@/components/Toast";
import TestView from "./TestView";
import { computeLessonsStatus } from "./useKunoTimeline";
import { asDifficulty, type LessonDifficulty } from "./difficulty";
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
  | "willpower_perseverance";

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
  const { data: progress } = useProgressFacts(profile?.id);
  const kunoFacts = useMemo(() => normalizeKunoFacts(progress?.omni?.kuno), [progress?.omni?.kuno]);
  const { t, lang } = useI18n();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<LessonToastPayload | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const handleToast = useCallback((payload: LessonToastPayload) => {
    setToastMsg(payload);
  }, []);
  const moduleEntries = useMemo(() => Object.entries(OMNIKUNO_MODULES) as Array<[OmniAreaKey, OmniKunoModuleConfig]>, []);
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
  const activeAreaKey: OmniAreaKey = moduleFromUrl ?? areaFromUrl ?? recommendedArea ?? "emotional_balance";
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
      const nextModule = OMNIKUNO_MODULES[nextArea];
      const nextSnapshot = getKunoModuleSnapshot(kunoFacts, nextModule.moduleId);
      const nextCompleted = nextSnapshot.completedIds ?? [];
      const ordered = nextModule.lessons.slice().sort((a, b) => a.order - b.order);
      const nextLessonId = (() => {
        const pending = ordered.find((lesson) => !nextCompleted.includes(lesson.id));
        return pending?.id ?? ordered[0]?.id ?? null;
      })();
      updateUrl({ area: nextArea, module: nextModule.moduleId, lesson: nextLessonId });
    },
    [kunoFacts, resetFinalTestState, updateUrl],
  );
  const orderedModuleLessons = useMemo(() => activeModule.lessons.slice().sort((a, b) => a.order - b.order), [activeModule.lessons]);
  const resolvedLessonIdFromQuery =
    lessonQueryParam && orderedModuleLessons.some((lesson) => lesson.id === lessonQueryParam) ? lessonQueryParam : null;
  const pendingLessonId = useMemo(() => {
    const next = orderedModuleLessons.find((lesson) => !completedIdsFromFacts.includes(lesson.id));
    return next?.id ?? orderedModuleLessons[0]?.id ?? null;
  }, [completedIdsFromFacts, orderedModuleLessons]);
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
const areaStats = useMemo(() => {
  return Object.fromEntries(
    moduleEntries.map(([areaKey, module]) => {
      const snapshot = kunoFacts.modules[module.moduleId];
      const lessonIdSet = new Set(module.lessons.map((lesson) => lesson.id));
      const completedIds = (snapshot?.completedIds ?? []).filter((id) => lessonIdSet.has(id));
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
}, [kunoFacts.modules, moduleEntries]);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);
  const [adaptiveHistory, setAdaptiveHistory] = useState<Array<{ id: string; message: string }>>([]);
  const [activeLessonMeta, setActiveLessonMeta] = useState<{ id: string; difficulty: LessonDifficulty } | null>(null);
  const lastDifficultyRef = useRef<LessonDifficulty | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    };
  }, [lang]);
  const finalTestConfig = useMemo(() => getFinalTestConfig(activeAreaKey, lang), [activeAreaKey, lang]);
  const handleLessonSelect = useCallback(
    (lessonId: string | null) => {
      updateUrl({ area: activeAreaKey, module: activeModule.moduleId, lesson: lessonId });
    },
    [activeAreaKey, activeModule.moduleId, updateUrl],
  );
  const handleActiveLessonChange = useCallback((meta: { id: string; difficulty: LessonDifficulty } | null) => {
    setActiveLessonMeta(meta);
  }, []);
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    const current = activeLessonMeta?.difficulty ?? null;
    if (!current) return;
    const prev = lastDifficultyRef.current;
    if (prev == null) {
      lastDifficultyRef.current = current;
      return;
    }
    if (prev === current) return;
    const message = buildAdaptiveMessage(prev, current, t);
    lastDifficultyRef.current = current;
    if (message) {
      setAdaptiveMessage(message);
      setAdaptiveHistory((prev) => [{ id: `${Date.now()}`, message }, ...prev].slice(0, 3));
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setAdaptiveMessage(null);
      }, 6000);
    }
  }, [activeLessonMeta, t]);
  const focusLabel = areaLabelMap[activeAreaKey];
  const moduleStateKey = `${activeModule.moduleId}:${completedIdsFromFacts.slice().sort().join("|")}:${normalizedPerformance.difficultyBias}`;
  const completedLessonsCount = completedIdsFromFacts.length;
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

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader
        compact
        onAuthRequest={!profile?.id ? goToAuth : undefined}
        onMenuToggle={() => setMenuOpen(true)}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 text-[#2C2C2C]">
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
                adaptiveMessage={adaptiveMessage}
                onDismissAdaptive={() => setAdaptiveMessage(null)}
                overviewLabel={lang === "ro" ? "Vezi toate lecțiile" : "View all lessons"}
                onOpenOverview={() => setOverviewOpen(true)}
              />
              {adaptiveHistory.length ? (
                <div className="rounded-xl border border-dashed border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7B6B60]">
                    {lang === "ro" ? "Ajustări recente de dificultate" : "Recent difficulty changes"}
                  </p>
                  <ul className="mt-2 space-y-1 text-[12px] text-[#5A4B43]">
                    {adaptiveHistory.map((entry) => (
                      <li key={entry.id}>{entry.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </KunoContainer>
        <div className="flex flex-col gap-6 px-2 sm:px-3 lg:flex-row">
          <aside className="order-2 rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm lg:order-1 lg:w-60 lg:flex-shrink-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7B6B60]">Teme OmniKuno</p>
            <ul className="space-y-2 text-sm text-[#2C2C2C]">
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
                      className={`w-full rounded-2xl border px-3.5 py-3 text-left transition ${
                        isActive ? "border-[#C07963] bg-[#FFF4EE] shadow-[0_10px_25px_rgba(192,121,99,0.08)]" : "border-[#F0E8E0] hover:border-[#E3D3C7]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{areaLabelMap[key]}</span>
                        <div className="flex items-center gap-2">
                          {isRecommended ? (
                            <span className="rounded-full bg-[#FCEFE8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C07963]">
                              {lang === "ro" ? "Recomandat" : "Recommended"}
                            </span>
                          ) : null}
                          <span className={`text-xs font-semibold ${isActive ? "text-[#C07963]" : "text-[#A08F82]"}`}>{levelBadge}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-[#7B6B60]">
                        <span>
                          {stat?.completed ?? 0}/{stat?.total ?? module.lessons.length} {lang === "ro" ? "misiuni" : "missions"}
                        </span>
                        <span>{stat ? `${stat.percentage}%` : "0%"}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[#F2E7DD]">
                        <div
                          className="h-1.5 rounded-full bg-[#C07963]"
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
              initialPerformance={normalizedPerformance}
              initialLessonId={initialLessonIdForModule}
              lessonHasExplicitNone={lessonHasExplicitNone}
              onActiveLessonChange={handleActiveLessonChange}
              onToast={handleToast}
              showFinalTest={showFinalTest}
              finalTestResult={finalTestResult}
              onToggleFinalTest={setShowFinalTest}
              onFinalTestComplete={(result) => setFinalTestResult(result)}
              finalTestConfig={finalTestConfig}
              onLessonSelect={handleLessonSelect}
              overviewOpen={overviewOpen}
              onCloseOverview={() => setOverviewOpen(false)}
            />
          </section>
        </div>
      </div>
      </main>
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
    </div>
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
  onActiveLessonChange?: (meta: { id: string; difficulty: LessonDifficulty } | null) => void;
  onToast?: (payload: LessonToastPayload) => void;
  showFinalTest?: boolean;
  finalTestResult?: { correct: number; total: number } | null;
  onToggleFinalTest?: (value: boolean) => void;
  onFinalTestComplete?: (result: { correct: number; total: number } | null) => void;
  finalTestConfig?: ModuleFinalTestContent | null;
  overviewOpen: boolean;
  onCloseOverview: () => void;
};

function ModuleExperience({
  areaKey,
  module,
  profileId,
  completedIdsFromFacts,
  initialPerformance,
  initialLessonId = null,
  lessonHasExplicitNone = false,
  onLessonSelect,
  onActiveLessonChange,
  onToast,
  showFinalTest = false,
  finalTestResult = null,
  onToggleFinalTest,
  onFinalTestComplete,
  finalTestConfig = null,
  overviewOpen,
  onCloseOverview,
}: ExperienceProps) {
  const { t, lang } = useI18n();
  const [localCompleted, setLocalCompleted] = useState<string[]>(() => completedIdsFromFacts);
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
  const defaultOpenLessonId = useMemo(() => {
    if (lessonHasExplicitNone || !timelineWithMeta.length) return null;
    if (initialLessonId && timelineWithMeta.some((item) => item.id === initialLessonId)) {
      return initialLessonId;
    }
    return activeItem?.id ?? null;
  }, [activeItem?.id, initialLessonId, lessonHasExplicitNone, timelineWithMeta]);
  const openLessonId = Object.prototype.hasOwnProperty.call(openLessonsByModule, module.moduleId)
    ? openLessonsByModule[module.moduleId] ?? null
    : defaultOpenLessonId;
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
    onLessonSelect?.(openLessonId);
  }, [openLessonId, onLessonSelect]);
  const triggerLessonHighlight = useCallback((lessonId: string) => {
    setJustActivatedLessonId(lessonId);
    if (typeof window !== "undefined") {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setJustActivatedLessonId(null);
        highlightTimeoutRef.current = null;
      }, 1800) as unknown as number;
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
    if (typeof window === "undefined") return;
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
  }, [areaKey, module.moduleId, openLessonId]);
  useEffect(() => {
    if (!onActiveLessonChange) return;
    if (activeItem?.lesson) {
      onActiveLessonChange({ id: activeItem.lesson.id, difficulty: asDifficulty(activeItem.lesson.difficulty) });
    } else {
      onActiveLessonChange(null);
    }
  }, [activeItem, onActiveLessonChange]);
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
      setLocalCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
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
    [lang, onToast, orderedLessons, scrollToLesson, setOpenLessonForModule, triggerLessonHighlight],
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
            <div className="h-2 rounded-full bg-[#C07963]" style={{ width: `${Math.min(100, completionPct)}%` }} />
          </div>
        </KunoActivePanel>
      </KunoContainer>
      <KunoContainer align="left">
        {visibleTimeline.length ? (
          <div className="space-y-3 md:space-y-4" data-testid="kuno-timeline">
            {visibleTimeline.map((item, idx) => {
              const lessonConfig = item.lesson ?? module.lessons.find((lesson) => lesson.id === item.id);
              const isOpen = item.status === "active" && item.id === openLessonId;
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
                  status={item.status}
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  isOpen={Boolean(isOpen)}
                  onToggle={() => {
                    if (item.status !== "active") return;
                    const next = openLessonId === item.id ? null : item.id;
                    setOpenLessonForModule(next);
                  }}
                  lang={langKey}
                  justActivated={item.id === justActivatedLessonId}
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
                      onProgressChange={(lessonId, current, total) => handleLessonProgress(lessonId, current, total)}
                    />
                  ) : null}
                </LessonAccordionItem>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E4DAD1] bg-white/70 px-4 py-6 text-center text-sm text-[#7B6B60]">
            {lang === "ro"
              ? "Acest modul nu are încă misiuni configurate."
              : "This module does not have missions configured yet."}
          </div>
        )}
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

function buildAdaptiveMessage(
  previous: LessonDifficulty,
  next: LessonDifficulty,
  t: ReturnType<typeof useI18n>["t"],
): string | null {
  if (next === "easy" && previous !== "easy") {
    return String(previous === "hard" ? t("omnikuno.adaptive.easierMessage") : t("omnikuno.adaptive.easierMessageAlt"));
  }
  if (next === "hard" && previous !== "hard") {
    return String(previous === "easy" ? t("omnikuno.adaptive.harderMessage") : t("omnikuno.adaptive.harderMessageAlt"));
  }
  if (next === "medium" && previous !== "medium") {
    return String(t("omnikuno.adaptive.mediumMessage"));
  }
  return null;
}
