"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { OMNIKUNO_MODULES, type OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import { normalizePerformance, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import InfoTooltip from "@/components/InfoTooltip";
import Toast from "@/components/Toast";
import LessonView from "./LessonView";
import QuizView from "./QuizView";
import KunoLessonItem from "./KunoLessonItem";
import { computeLessonsStatus } from "./useKunoTimeline";
import { asDifficulty, DIFFICULTY_STYLES, type LessonDifficulty } from "./difficulty";
import { getLessonDuration, getLessonObjective } from "./lessonUtils";
import { normalizeKunoFacts, getKunoModuleSnapshot } from "@/lib/kunoFacts";

export default function OmniKunoPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const search = useSearchParams();
  const { data: progress } = useProgressFacts(profile?.id);
  const kunoFacts = useMemo(() => normalizeKunoFacts(progress?.omni?.kuno), [progress?.omni?.kuno]);
  const { t, lang } = useI18n();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const moduleIdFromQuery = search?.get("moduleId");
  const recommendedModuleId = kunoFacts.recommendedModuleId ?? null;
const moduleEntries = useMemo(() => Object.entries(OMNIKUNO_MODULES) as Array<[ExperienceProps["areaKey"], OmniKunoModuleConfig]>, []);
const areaFromModuleId = useMemo<ExperienceProps["areaKey"] | null>(() => {
  if (!moduleIdFromQuery) return null;
  const match = moduleEntries.find(([, module]) => module.moduleId === moduleIdFromQuery);
  return match ? match[0] : null;
}, [moduleEntries, moduleIdFromQuery]);
  const recommendedArea = useMemo<ExperienceProps["areaKey"] | null>(() => {
    if (kunoFacts.recommendedArea && Object.hasOwn(OMNIKUNO_MODULES, kunoFacts.recommendedArea)) {
      return kunoFacts.recommendedArea as ExperienceProps["areaKey"];
    }
    if (!recommendedModuleId) return null;
    const match = moduleEntries.find(([, module]) => module.moduleId === recommendedModuleId);
    return match ? match[0] : null;
  }, [kunoFacts.recommendedArea, moduleEntries, recommendedModuleId]);
  const areaQueryParam = search?.get("area");
  const areaFromQuery = (areaQueryParam && Object.hasOwn(OMNIKUNO_MODULES, areaQueryParam)
    ? (areaQueryParam as ExperienceProps["areaKey"])
    : null);
  const defaultArea = areaFromQuery ?? areaFromModuleId ?? recommendedArea ?? "calm";
  const [selectedArea, setSelectedArea] = useState<ExperienceProps["areaKey"]>(defaultArea);
  useEffect(() => {
    setSelectedArea(defaultArea);
  }, [defaultArea]);
  const activeAreaKey = selectedArea;
  const activeModule = OMNIKUNO_MODULES[activeAreaKey];
  const moduleSnapshot = getKunoModuleSnapshot(kunoFacts, activeModule.moduleId);
  const completedIdsFromFacts = moduleSnapshot.completedIds;
  const performanceFromFacts = (moduleSnapshot.performance ?? null) as Partial<KunoPerformanceSnapshot> | null;
const normalizedPerformance = useMemo(
  () => normalizePerformance(performanceFromFacts),
  [performanceFromFacts],
);
const areaStats = useMemo(() => {
  return Object.fromEntries(
    moduleEntries.map(([areaKey, module]) => {
      const snapshot = kunoFacts.modules[module.moduleId];
      const completedIds = snapshot?.completedIds ?? [];
      const progressPct = Math.round(((completedIds.length ?? 0) / module.lessons.length) * 100);
      return [
        areaKey,
        {
          completed: completedIds.length ?? 0,
          total: module.lessons.length,
          percentage: Number.isFinite(progressPct) ? Math.min(100, Math.max(0, progressPct)) : 0,
        },
      ];
    }),
  ) as Record<ExperienceProps["areaKey"], { completed: number; total: number; percentage: number }>;
}, [kunoFacts.modules, moduleEntries]);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);
  const [adaptiveHistory, setAdaptiveHistory] = useState<Array<{ id: string; message: string }>>([]);
  const [activeLessonMeta, setActiveLessonMeta] = useState<{ id: string; difficulty: LessonDifficulty } | null>(null);
  const lastDifficultyRef = useRef<LessonDifficulty | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaLabelMap = useMemo<Record<ExperienceProps["areaKey"], string>>(() => {
    if (lang === "ro") {
      return {
        calm: "Calm",
        energy: "Energie",
        relations: "Relații",
        performance: "Performanță",
        sense: "Sens",
      };
    }
    return {
      calm: "Calm",
      energy: "Energy",
      relations: "Relationships",
      performance: "Performance",
      sense: "Meaning",
    };
  }, [lang]);
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

  const goToAuth = useCallback(() => router.push("/auth"), [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader
        compact
        onAuthRequest={!profile?.id ? goToAuth : undefined}
        onMenuToggle={() => setMenuOpen(true)}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-6xl px-4 py-6 text-[#2C2C2C]">
        <div className="space-y-6">
        <header className="rounded-2xl border border-[#E4DAD1] bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C07963]">OmniKuno</p>
          <h1 className="text-2xl font-bold text-[#2C2C2C]">
            Tema ta în focus · <span className="text-xl text-[#C07963]">{focusLabel}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#7B6B60]">
            <span>{areaLabelMap[activeAreaKey]} · Nivel 1</span>
            <span>XP: 45 / 120</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#7B6B60]">
            <span>{String(t("omnikuno.adaptive.headerExplainerShort"))}</span>
            <InfoTooltip
              label={String(t("omnikuno.adaptive.headerExplainer"))}
              items={[String(t("omnikuno.adaptive.tooltip"))]}
            />
          </div>
          {adaptiveMessage ? (
            <div className="mt-2 flex items-start justify-between rounded-xl border border-[#F0E8E0] bg-[#FFFBF7] px-3 py-2 text-[12px] text-[#5A4B43]">
              <span>{adaptiveMessage}</span>
              <button type="button" className="ml-2 text-[#B08A78] transition hover:text-[#2C2C2C]" onClick={() => setAdaptiveMessage(null)}>
                ×
              </button>
            </div>
          ) : null}
          {adaptiveHistory.length ? (
            <div className="mt-3 rounded-xl border border-dashed border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3">
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
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7B6B60]">Teme OmniKuno</p>
            <ul className="space-y-2 text-sm text-[#2C2C2C]">
              {moduleEntries.map(([key, module]) => {
                const isActive = key === activeAreaKey;
                const stat = areaStats[key];
                const isRecommended = recommendedArea === key;
                return (
                  <li key={module.moduleId}>
                    <button
                      type="button"
                      onClick={() => setSelectedArea(key)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
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
                          <span className={`text-xs ${isActive ? "text-[#C07963]" : "text-[#A08F82]"}`}>Nivel 1</span>
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

          <section className="space-y-4">
            <ModuleExperience
              key={moduleStateKey}
              areaKey={activeAreaKey}
              module={activeModule}
              profileId={profile?.id}
              completedIdsFromFacts={completedIdsFromFacts}
              initialPerformance={normalizedPerformance}
              onActiveLessonChange={handleActiveLessonChange}
              onToast={setToastMsg}
            />
          </section>
        </div>
      </div>
      </main>
      {toastMsg ? <Toast message={toastMsg} onClose={() => setToastMsg(null)} /> : null}
    </div>
  );
}

type ExperienceProps = {
  areaKey: "calm" | "energy" | "relations" | "performance" | "sense";
  module: OmniKunoModuleConfig;
  profileId?: string | null;
  completedIdsFromFacts: string[];
  initialPerformance: KunoPerformanceSnapshot;
  onActiveLessonChange?: (meta: { id: string; difficulty: LessonDifficulty } | null) => void;
  onToast?: (message: string) => void;
};

function ModuleExperience({
  areaKey,
  module,
  profileId,
  completedIdsFromFacts,
  initialPerformance,
  onActiveLessonChange,
  onToast,
}: ExperienceProps) {
  const { t, lang } = useI18n();
  const [localCompleted, setLocalCompleted] = useState<string[]>(() => completedIdsFromFacts);
  const [localPerformance, setLocalPerformance] = useState<KunoPerformanceSnapshot>(initialPerformance);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(() => {
    const initialTimeline = computeLessonsStatus(module.lessons, completedIdsFromFacts, initialPerformance);
    const active = initialTimeline.find((item) => item.status === "active") ?? initialTimeline[0];
    return active?.id ?? null;
  });
  const timeline = useMemo(
    () => computeLessonsStatus(module.lessons, localCompleted, localPerformance),
    [module.lessons, localCompleted, localPerformance],
  );
  const completedCount = useMemo(() => timeline.filter((item) => item.status === "done").length, [timeline]);
  const completionPct = timeline.length ? Math.round((completedCount / timeline.length) * 100) : 0;
  const timelineIdSet = useMemo(() => new Set(timeline.map((item) => item.id)), [timeline]);
  const activeTimelineId = useMemo(() => timeline.find((item) => item.status === "active")?.id ?? null, [timeline]);
  const resolvedLessonId = useMemo(() => {
    if (selectedLessonId && timelineIdSet.has(selectedLessonId)) {
      return selectedLessonId;
    }
    return activeTimelineId;
  }, [selectedLessonId, timelineIdSet, activeTimelineId]);
  const resolvedLesson = useMemo(() => {
    if (resolvedLessonId) {
      const explicit = module.lessons.find((lesson) => lesson.id === resolvedLessonId);
      if (explicit) return explicit;
    }
    const activeFallback = timeline.find((item) => item.status === "active");
    return activeFallback ? module.lessons.find((lesson) => lesson.id === activeFallback.id) ?? null : null;
  }, [module.lessons, resolvedLessonId, timeline]);
  useEffect(() => {
    if (!onActiveLessonChange) return;
    if (resolvedLesson) {
      onActiveLessonChange({ id: resolvedLesson.id, difficulty: asDifficulty(resolvedLesson.difficulty) });
    } else {
      onActiveLessonChange(null);
    }
  }, [onActiveLessonChange, resolvedLesson]);

  const handleLessonCompleted = useCallback(
    (
      lessonId: string,
      meta?: { updatedPerformance?: KunoPerformanceSnapshot; score?: number; timeSpentSec?: number },
    ) => {
      const performanceForNext = meta?.updatedPerformance ?? localPerformance;
      setLocalCompleted((prev) => {
        if (prev.includes(lessonId)) return prev;
        const next = [...prev, lessonId];
        const refreshed = computeLessonsStatus(module.lessons, next, performanceForNext);
        const nextActive = refreshed.find((item) => item.status === "active");
        setSelectedLessonId(nextActive?.id ?? lessonId);
        return next;
      });
      if (meta?.updatedPerformance) {
        setLocalPerformance(meta.updatedPerformance);
      }
      if (onToast) {
        if (meta?.score != null) {
          onToast(
            lang === "ro"
              ? `Quiz finalizat cu ${meta.score}%. Continuă misiunile!`
              : `Quiz completed with ${meta.score}%. Keep the missions rolling!`,
          );
        } else {
          onToast(lang === "ro" ? "Lecție finalizată și XP actualizat." : "Lesson completed and XP updated.");
        }
      }
    },
    [lang, module.lessons, localPerformance, onToast],
  );

  return (
    <>
      <div className="rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B6B60]">
              {lang === "ro" ? "Misiunea activă" : "Active mission"}
            </p>
            <h2 className="text-xl font-bold text-[#2C2C2C]">
              {module.moduleId.replace(/_/g, " ")} · {lang === "ro" ? "misiunea principală" : "main storyline"}
            </h2>
          </div>
          <div className="text-right text-sm text-[#7B6B60]">
            <p>
              {lang === "ro" ? "Progres" : "Progress"}: {completedCount} / {timeline.length} {lang === "ro" ? "misiuni" : "missions"}
            </p>
            <p>XP: 45 · {lang === "ro" ? "Următorul nivel la 120" : "Next level at 120"}</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-[#F4EDE4]">
          <div className="h-2 rounded-full bg-[#C07963]" style={{ width: `${Math.min(100, completionPct)}%` }} />
        </div>
        <div className="mt-4 space-y-3">
          {timeline.map((item) => {
            const lessonDef = module.lessons.find((lesson) => lesson.id === item.id);
            if (!lessonDef) return null;
            const disabled = item.status === "locked";
            const difficultyKey = asDifficulty(item.difficulty);
            const difficultyLabel = String(t(`omnikuno.difficulty.${difficultyKey}Label`));
            const difficultyShort = String(t(`omnikuno.difficulty.${difficultyKey}Short`));
            const isActive = resolvedLessonId ? resolvedLessonId === item.id : item.status === "active";
            const objective = String(getLessonObjective(lessonDef, lang));
            return (
              <KunoLessonItem
                key={item.id}
                lesson={{
                  id: item.id,
                  order: item.order,
                  title: item.title,
                  type: item.type,
                  status: item.status,
                  difficulty: difficultyKey,
                }}
                isActive={Boolean(isActive)}
                disabled={disabled}
                onSelect={() => {
                  if (!disabled) setSelectedLessonId(item.id);
                }}
                header={
                  <div className="flex w-full items-start gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                        item.status === "done"
                          ? "border-[#1F7A43] bg-[#ECF8F0] text-[#1F7A43]"
                          : item.status === "active"
                            ? "border-[#C07963] bg-[#FFF3EC] text-[#C07963]"
                            : "border-[#F0E8E0] bg-white text-[#B0A295]"
                      }`}
                    >
                      {item.status === "done" ? "✓" : item.status === "locked" ? "…" : "▶"}
                    </div>
                    <div
                      className={`flex-1 rounded-xl border px-3 py-2 ${
                        isActive ? "border-[#C07963] bg-white" : "border-[#F0E8E0]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#2C2C2C]">
                            {item.order}. {item.title}
                          </p>
                          <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
                            {item.type === "quiz" ? "Quiz" : lang === "ro" ? "Lecție" : "Lesson"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] ${DIFFICULTY_STYLES[difficultyKey].badge}`}
                            title={difficultyShort}
                          >
                            {difficultyLabel}
                          </span>
                          {renderEffortBadges(module, item.id, lang)}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-[#7B6B60]">{objective}</p>
                    </div>
                  </div>
                }
              >
                {lessonDef.type === "quiz" ? (
                  <QuizView
                    areaKey={areaKey}
                    moduleId={module.moduleId}
                    lesson={lessonDef}
                    existingCompletedIds={localCompleted}
                    ownerId={profileId}
                    performanceSnapshot={localPerformance}
                    onCompleted={(lessonId, meta) => handleLessonCompleted(lessonId, meta)}
                  />
                ) : (
                  <LessonView
                    areaKey={areaKey}
                    moduleId={module.moduleId}
                    lesson={lessonDef}
                    existingCompletedIds={localCompleted}
                    ownerId={profileId}
                    performanceSnapshot={localPerformance}
                    onCompleted={(lessonId, meta) => handleLessonCompleted(lessonId, meta)}
                  />
                )}
              </KunoLessonItem>
            );
          })}
        </div>
      </div>
    </>
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

function renderEffortBadges(module: OmniKunoModuleConfig, lessonId: string, lang: string) {
  const lesson = module.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  const minutes = getLessonDuration(lesson);
  return (
    <div className="mt-1 text-[10px] text-[#7B6B60]">
      {minutes ? `${minutes} ${lang === "ro" ? "min" : "min"}` : ""}
    </div>
  );
}
