"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { OMNIKUNO_MODULES, type OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import { normalizePerformance, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import InfoTooltip from "@/components/InfoTooltip";
import LessonView from "./LessonView";
import QuizView from "./QuizView";
import { computeLessonsStatus } from "./useKunoTimeline";
import { asDifficulty, DIFFICULTY_STYLES, type LessonDifficulty } from "./difficulty";

export default function OmniKunoPage() {
  const { profile } = useProfile();
  const search = useSearchParams();
  const { data: progress } = useProgressFacts(profile?.id);
  const { t, lang } = useI18n();
  const moduleIdFromQuery = search?.get("moduleId");
  const recommendedModuleId =
    ((progress?.omni?.kuno as { recommendedModuleId?: string } | undefined)?.recommendedModuleId) ?? null;
  const moduleEntries = useMemo(() => Object.entries(OMNIKUNO_MODULES), []);
  const activeEntry = useMemo<[ExperienceProps["areaKey"], OmniKunoModuleConfig]>(() => {
    if (moduleIdFromQuery) {
      return (
        (moduleEntries.find(([, module]) => module.moduleId === moduleIdFromQuery) as
          | [ExperienceProps["areaKey"], OmniKunoModuleConfig]
          | undefined) ?? ["calm", OMNIKUNO_MODULES.calm]
      );
    }
    if (recommendedModuleId) {
      return (
        (moduleEntries.find(([, module]) => module.moduleId === recommendedModuleId) as
          | [ExperienceProps["areaKey"], OmniKunoModuleConfig]
          | undefined) ?? ["calm", OMNIKUNO_MODULES.calm]
      );
    }
    return ["calm", OMNIKUNO_MODULES.calm];
  }, [moduleEntries, moduleIdFromQuery, recommendedModuleId]);
  const activeAreaKey = activeEntry?.[0] ?? "calm";
  const activeModule = activeEntry?.[1] ?? OMNIKUNO_MODULES.calm;
  const completedIdsFromFacts =
    ((progress?.omni?.kuno as { lessons?: Record<string, { completedIds?: string[] }> } | undefined)?.lessons?.[
      activeModule.moduleId
    ]?.completedIds ?? []) as string[];
  const performanceFromFacts =
    ((progress?.omni?.kuno as { lessons?: Record<string, { performance?: Partial<KunoPerformanceSnapshot> }> } | undefined)?.lessons?.[
      activeModule.moduleId
    ]?.performance ?? null) as Partial<KunoPerformanceSnapshot> | null;
  const normalizedPerformance = useMemo(
    () => normalizePerformance(performanceFromFacts),
    [performanceFromFacts],
  );
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);
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
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setAdaptiveMessage(null);
      }, 6000);
    }
  }, [activeLessonMeta, t]);
  const areaQuery = search?.get("area") ?? undefined;
  const areaQueryKey = (areaQuery && Object.hasOwn(areaLabelMap, areaQuery)
    ? (areaQuery as ExperienceProps["areaKey"])
    : null);
  const focusLabel = areaQueryKey ? areaLabelMap[areaQueryKey] : areaLabelMap[activeAreaKey];
  const moduleStateKey = `${activeModule.moduleId}:${completedIdsFromFacts.slice().sort().join("|")}:${normalizedPerformance.difficultyBias}`;

  return (
    <div className="min-h-screen bg-[#FDFCF9] px-4 py-6 text-[#2C2C2C]">
      <div className="mx-auto max-w-6xl space-y-6">
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
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7B6B60]">Teme OmniKuno</p>
            <ul className="space-y-2 text-sm text-[#2C2C2C]">
              {[
                { key: "calm", label: "Calm" },
                { key: "energy", label: "Energie" },
                { key: "relations", label: "Relații" },
                { key: "performance", label: "Performanță" },
                { key: "sense", label: "Sens" },
              ].map((item) => (
                <li key={item.key} className="flex items-center justify-between rounded-lg border border-[#F0E8E0] px-3 py-2">
                  <span>{item.label}</span>
                  <span className="text-xs text-[#A08F82]">Nivel 1</span>
                </li>
              ))}
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
            />
          </section>
        </div>
      </div>
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
};

function ModuleExperience({
  areaKey,
  module,
  profileId,
  completedIdsFromFacts,
  initialPerformance,
  onActiveLessonChange,
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
  const selectedLesson = useMemo(
    () => module.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [module.lessons, selectedLessonId],
  );
  useEffect(() => {
    if (!onActiveLessonChange) return;
    if (selectedLesson) {
      onActiveLessonChange({ id: selectedLesson.id, difficulty: asDifficulty(selectedLesson.difficulty) });
    } else {
      onActiveLessonChange(null);
    }
  }, [onActiveLessonChange, selectedLesson]);

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
    },
    [module.lessons, localPerformance],
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
            const isSelected = selectedLessonId === item.id;
            const disabled = item.status === "locked";
            const difficultyKey = asDifficulty(item.difficulty);
            const difficultyLabel = String(t(`omnikuno.difficulty.${difficultyKey}Label`));
            const difficultyShort = String(t(`omnikuno.difficulty.${difficultyKey}Short`));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!disabled) setSelectedLessonId(item.id);
                }}
                className={`flex w-full items-start gap-3 rounded-2xl px-2 py-1 text-left transition ${
                  disabled ? "cursor-not-allowed opacity-70" : "hover:bg-[#FFFBF7]"
                }`}
              >
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
                  className={`flex-1 rounded-xl border px-3 py-2 ${isSelected ? "border-[#C07963] bg-white" : "border-[#F0E8E0]"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#2C2C2C]">
                      {item.order}. {item.title}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-[0.2em] ${DIFFICULTY_STYLES[difficultyKey].badge} px-3 py-0.5`}
                      title={difficultyShort}
                    >
                      {difficultyLabel}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
                    {item.type === "quiz" ? "Quiz" : lang === "ro" ? "Lecție" : "Lesson"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B6B60]">
          {lang === "ro" ? "Conținut" : "Content"}
        </p>
        <div className="mt-2 rounded-xl border border-[#F0E8E0] bg-[#FFFBF7] p-4 text-sm text-[#2C2C2C]">
          {selectedLesson ? (
            selectedLesson.type === "quiz" ? (
              <QuizView
                areaKey={areaKey}
                moduleId={module.moduleId}
                lesson={selectedLesson}
                existingCompletedIds={localCompleted}
                ownerId={profileId}
                performanceSnapshot={localPerformance}
                onCompleted={(lessonId, meta) => handleLessonCompleted(lessonId, meta)}
              />
            ) : (
              <LessonView
                areaKey={areaKey}
                moduleId={module.moduleId}
                lesson={selectedLesson}
                existingCompletedIds={localCompleted}
                ownerId={profileId}
                performanceSnapshot={localPerformance}
                onCompleted={(lessonId, meta) => handleLessonCompleted(lessonId, meta)}
              />
            )
          ) : (
            <p className="text-sm text-[#7B6B60]">
              {lang === "ro" ? "Selectează o lecție sau un quiz din timeline pentru a începe." : "Pick a lesson or quiz from the timeline to start."}
            </p>
          )}
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
