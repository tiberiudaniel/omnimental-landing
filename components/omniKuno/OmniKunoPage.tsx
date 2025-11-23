"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { OMNIKUNO_MODULES, type OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import { OMNI_KUNO_ARC_INTROS } from "@/config/omniKunoLessonContent";
import { normalizePerformance, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import Toast from "@/components/Toast";
import ModuleArcHero from "./ModuleArcHero";
import TestView from "./TestView";
import { computeLessonsStatus } from "./useKunoTimeline";
import { asDifficulty, type LessonDifficulty } from "./difficulty";
import { getLessonDuration } from "./lessonUtils";
import { normalizeKunoFacts, getKunoModuleSnapshot } from "@/lib/kunoFacts";
import { resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";
import { KunoModuleHeader } from "./KunoModuleHeader";
import { KunoTimeline } from "./KunoTimeline";
import { KunoActivePanel } from "./KunoActivePanel";
import { KunoFinalTestBanner } from "./KunoFinalTestBanner";
import { getKunoLevel } from "@/lib/omniKunoXp";
type ArcZoneKey = keyof (typeof OMNI_KUNO_ARC_INTROS)["emotional_balance"];
const ARC_ZONE_ORDER: ArcZoneKey[] = ["trezire", "primele_ciocniri", "profunzime", "maestrie"];
type OmniAreaKey = OmniKunoModuleId;
type TimelineItem = ReturnType<typeof computeLessonsStatus>[number];
type ModuleFinalTestContent = {
  testId: string;
  heading: string;
  title: string;
  description: string;
  buttonLabel: string;
  moduleName: string;
};
type SupportedFinalTestArea =
  | "emotional_balance"
  | "focus_clarity"
  | "relationships_communication"
  | "energy_body"
  | "self_trust"
  | "decision_discernment";
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
    title: {
      ro: "Ai parcurs toate lecțiile Energie & Corp",
      en: "You completed all Energy & Body lessons",
    },
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
};

type ZoneRule = (lessonId: string) => ArcZoneKey | null;

const MODULE_ZONE_RULES: Partial<Record<OmniAreaKey, ZoneRule>> = {
  emotional_balance: (lessonId: string) => {
    if (lessonId.startsWith("emotional_balance_l1_") || lessonId.startsWith("emotional_balance_l1_q")) {
      return "trezire";
    }
    if (lessonId.startsWith("emotional_balance_l2_") || lessonId.startsWith("emotional_balance_l2_q")) {
      return "primele_ciocniri";
    }
    const level3Match = lessonId.match(/^emotional_balance_l3_(\d+)/);
    if (level3Match) {
      const numeric = Number(level3Match[1]);
      if (numeric >= 17 && numeric <= 20) return "profunzime";
      if (numeric >= 21) return "maestrie";
    }
    return null;
  },
  focus_clarity: (lessonId: string) => {
    const match = lessonId.match(/^focus_clarity_l1_(\d+)/);
    if (!match) return null;
    const numeric = Number(match[1]);
    if (numeric <= 2) return "trezire";
    if (numeric <= 4) return "primele_ciocniri";
    if (numeric <= 6) return "profunzime";
    return "maestrie";
  },
  energy_body: (lessonId: string) => {
    if (lessonId === "energy_body_protocol") {
      return "trezire";
    }
    const match = lessonId.match(/^energy_body_l(\d)_(\d+)/);
    if (!match) return null;
    const level = Number(match[1]);
    const numeric = Number(match[2]);
    if (level === 1) {
      return numeric <= 4 ? "trezire" : "primele_ciocniri";
    }
    if (level === 2) {
      return numeric <= 7 ? "primele_ciocniri" : "profunzime";
    }
    if (level === 3) {
      return numeric <= 10 ? "profunzime" : "maestrie";
    }
    return null;
  },
  relationships_communication: (lessonId: string) => {
    if (lessonId.startsWith("relationships_communication_l1_")) {
      return "trezire";
    }
    if (lessonId.startsWith("relationships_communication_l2_")) {
      return "primele_ciocniri";
    }
    const level3Match = lessonId.match(/^relationships_communication_l3_(\d+)/);
    if (level3Match) {
      const numeric = Number(level3Match[1]);
      if (numeric <= 10) return "profunzime";
      return "maestrie";
    }
    return null;
  },
  self_trust: (lessonId: string) => {
    if (lessonId === "self_trust_protocol" || lessonId.startsWith("self_trust_l1_")) {
      return "trezire";
    }
    if (lessonId.startsWith("self_trust_l2_")) {
      return "primele_ciocniri";
    }
    const level3Match = lessonId.match(/^self_trust_l3_(\d+)/);
    if (level3Match) {
      const numeric = Number(level3Match[1]);
      if (numeric <= 10) return "profunzime";
      return "maestrie";
    }
    return null;
  },
  decision_discernment: (lessonId: string) => {
    if (lessonId === "decision_discernment_protocol" || lessonId.startsWith("decision_discernment_l1_")) {
      return "trezire";
    }
    if (lessonId.startsWith("decision_discernment_l2_")) {
      return "primele_ciocniri";
    }
    if (lessonId.startsWith("decision_discernment_l3_")) {
      return "profunzime";
    }
    return null;
  },
};

function getZoneKeyForLesson(areaKey: OmniAreaKey, lessonId: string): ArcZoneKey | null {
  const rule = MODULE_ZONE_RULES[areaKey];
  if (!rule) return null;
  return rule(lessonId);
}

function groupTimelineSegments(
  areaKey: OmniAreaKey,
  timeline: TimelineItem[],
): Array<{ zoneKey: ArcZoneKey | null; items: TimelineItem[] }> {
  if (!timeline.length) return [];
  const segments: Array<{ zoneKey: ArcZoneKey | null; items: TimelineItem[] }> = [];
  let currentZone: ArcZoneKey | null = null;
  let buffer: TimelineItem[] = [];
  timeline.forEach((item) => {
    const zone = getZoneKeyForLesson(areaKey, item.id);
    if (buffer.length === 0) {
      currentZone = zone;
    } else if (zone !== currentZone) {
      segments.push({ zoneKey: currentZone, items: buffer });
      buffer = [];
      currentZone = zone;
    }
    buffer.push(item);
  });
  if (buffer.length) {
    segments.push({ zoneKey: currentZone, items: buffer });
  }
  return segments;
}

function ArcIntroCard({
  areaKey,
  zoneKey,
  variant = "default",
}: {
  areaKey: OmniAreaKey;
  zoneKey: ArcZoneKey;
  variant?: "default" | "compact";
}) {
  const arcSet = OMNI_KUNO_ARC_INTROS[areaKey];
  const arc = arcSet?.[zoneKey];
  if (!arc) return null;
  const zoneIndex = ARC_ZONE_ORDER.indexOf(zoneKey);
  const zoneLabel = zoneIndex >= 0 ? `Zona ${zoneIndex + 1}` : "Zona";
  const containerClasses =
    variant === "compact"
      ? "rounded-2xl border border-[#E7DED3] bg-white/80 px-4 py-3 text-sm"
      : "rounded-3xl border border-[#E7DED3] bg-white/80 px-4 py-4 text-base";
  return (
    <div className={`${containerClasses} text-[#2C2C2C] shadow-sm`}>
      <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">
        {zoneLabel} · {arc.title}
      </p>
      <p className="mt-1 text-sm text-[#4D3F36]">{arc.body}</p>
    </div>
  );
}

function renderArcIntro(areaKey: OmniAreaKey, zoneKey: ArcZoneKey | null) {
  if (!zoneKey) return null;
  const arcSet = OMNI_KUNO_ARC_INTROS[areaKey];
  if (!arcSet || !arcSet[zoneKey]) return null;
  return <ArcIntroCard areaKey={areaKey} zoneKey={zoneKey} />;
}

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
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
      const nextLessonId = nextModule.lessons[0]?.id ?? null;
      updateUrl({ area: nextArea, module: nextModule.moduleId, lesson: nextLessonId });
    },
    [resetFinalTestState, updateUrl],
  );
  const resolvedLessonIdFromQuery =
    lessonQueryParam && activeModule.lessons.some((lesson) => lesson.id === lessonQueryParam) ? lessonQueryParam : null;
  const fallbackLessonId = activeModule.lessons[0]?.id ?? null;
  const initialLessonIdForModule = resolvedLessonIdFromQuery ?? (lessonHasExplicitNone ? null : fallbackLessonId);
  useEffect(() => {
    const needsAreaSync = areaParam !== activeAreaKey;
    const needsModuleSync = moduleParam !== activeAreaKey;
    const needsLessonSync =
      initialLessonIdForModule != null ? lessonQueryParam !== initialLessonIdForModule : !lessonHasExplicitNone;
    if (needsAreaSync || needsModuleSync || needsLessonSync) {
      updateUrl({
        area: activeAreaKey,
        module: activeAreaKey,
        lesson: initialLessonIdForModule ?? null,
      });
    }
  }, [activeAreaKey, areaParam, moduleParam, initialLessonIdForModule, lessonHasExplicitNone, lessonQueryParam, updateUrl]);
  const moduleSnapshot = getKunoModuleSnapshot(kunoFacts, activeModule.moduleId);
  const completedIdsFromFacts = moduleSnapshot.completedIds;
  const performanceFromFacts = (moduleSnapshot.performance ?? null) as Partial<KunoPerformanceSnapshot> | null;
  const normalizedPerformance = normalizePerformance(performanceFromFacts);
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
      };
    }
    return {
      emotional_balance: "Emotional Balance",
      focus_clarity: "Clarity & Focus",
      energy_body: "Energy & Body",
      relationships_communication: "Relationships & Communication",
      decision_discernment: "Discernment & Decisions",
      self_trust: "Self-Trust",
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
  const { level: kunoLevel, nextThreshold } = getKunoLevel(totalXp);
  const nextLevelCopy =
    nextThreshold != null
      ? lang === "ro"
        ? `Următorul nivel la ${nextThreshold} XP`
        : `Next level at ${nextThreshold} XP`
      : lang === "ro"
        ? "Nivel maxim atins"
        : "Max level reached";
  const headerXpSummary =
    lang === "ro"
      ? `XP: ${totalXp} · Nivel ${kunoLevel} · ${nextLevelCopy}`
      : `XP: ${totalXp} · Level ${kunoLevel} · ${nextLevelCopy}`;

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
          <div data-testid="omni-kuno-header">
            <KunoModuleHeader
              title={lang === "ro" ? "Tema ta în focus" : "Your focus mission"}
              focusLabel={focusLabel}
              progressLabel={headerProgressSummary}
              xpLabel={headerXpSummary}
              adaptiveMessage={adaptiveMessage}
              onDismissAdaptive={() => setAdaptiveMessage(null)}
            />
          </div>
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
                      onClick={() => handleAreaSelect(key)}
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
            <ModuleArcHero areaKey={activeAreaKey} areaLabel={areaLabelMap[activeAreaKey]} />
            <ModuleExperience
              key={moduleStateKey}
              areaKey={activeAreaKey}
              module={activeModule}
              xpLabel={headerXpSummary}
              profileId={profile?.id}
              completedIdsFromFacts={completedIdsFromFacts}
              initialPerformance={normalizedPerformance}
              onActiveLessonChange={handleActiveLessonChange}
              onToast={setToastMsg}
              showFinalTest={showFinalTest}
            finalTestResult={finalTestResult}
            onToggleFinalTest={setShowFinalTest}
            onFinalTestComplete={(result) => setFinalTestResult(result)}
            finalTestConfig={finalTestConfig}
            initialLessonId={initialLessonIdForModule}
            onLessonSelect={handleLessonSelect}
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
  areaKey: OmniAreaKey;
  module: OmniKunoModuleConfig;
  profileId?: string | null;
  completedIdsFromFacts: string[];
  initialPerformance: KunoPerformanceSnapshot;
  initialLessonId?: string | null;
  onLessonSelect?: (lessonId: string | null) => void;
  onActiveLessonChange?: (meta: { id: string; difficulty: LessonDifficulty } | null) => void;
  onToast?: (message: string) => void;
  showFinalTest?: boolean;
  finalTestResult?: { correct: number; total: number } | null;
  onToggleFinalTest?: (value: boolean) => void;
  onFinalTestComplete?: (result: { correct: number; total: number }) => void;
  finalTestConfig?: ModuleFinalTestContent | null;
  xpLabel?: string;
};

function ModuleExperience({
  areaKey,
  module,
  profileId,
  completedIdsFromFacts,
  initialPerformance,
  initialLessonId = null,
  onLessonSelect,
  onActiveLessonChange,
  onToast,
  showFinalTest = false,
  finalTestResult = null,
  onToggleFinalTest,
  onFinalTestComplete,
  finalTestConfig = null,
  xpLabel,
}: ExperienceProps) {
  const { t, lang } = useI18n();
  const fallbackXpLabel = lang === "ro" ? "XP actualizat" : "XP updated";
  const xpDisplay = xpLabel ?? fallbackXpLabel;
  const [localCompleted, setLocalCompleted] = useState<string[]>(() => completedIdsFromFacts);
  const [localPerformance, setLocalPerformance] = useState<KunoPerformanceSnapshot>(initialPerformance);
  const orderedLessons = useMemo(() => module.lessons.slice().sort((a, b) => a.order - b.order), [module.lessons]);
  const timeline = useMemo(
    () => computeLessonsStatus(module.lessons, localCompleted, localPerformance),
    [module.lessons, localCompleted, localPerformance],
  );
  const timelineSegments = useMemo(() => {
    if (!MODULE_ZONE_RULES[areaKey]) {
      return [{ zoneKey: null, items: timeline }];
    }
    return groupTimelineSegments(areaKey, timeline);
  }, [areaKey, timeline]);
  const moduleCompleted = useMemo(() => timeline.every((item) => item.status === "done"), [timeline]);
  const completedCount = useMemo(() => timeline.filter((item) => item.status === "done").length, [timeline]);
  const completionPct = timeline.length ? Math.round((completedCount / timeline.length) * 100) : 0;
  const timelineIdSet = useMemo(() => new Set(timeline.map((item) => item.id)), [timeline]);
  const resolvedLessonId = useMemo(() => {
    if (initialLessonId && timelineIdSet.has(initialLessonId)) {
      return initialLessonId;
    }
    return null;
  }, [initialLessonId, timelineIdSet]);
  const resolvedLesson = useMemo(() => {
    if (resolvedLessonId) {
      const explicit = module.lessons.find((lesson) => lesson.id === resolvedLessonId);
      if (explicit) return explicit;
    }
    return null;
  }, [module.lessons, resolvedLessonId]);
  const renderZoneIntroForTimeline = useCallback(
    (zoneKey: ArcZoneKey | null) => renderArcIntro(areaKey, zoneKey),
    [areaKey],
  );
  const timelineTranslation = useCallback(
    (key: string): string | number => {
      const value = t(key);
      if (typeof value === "string" || typeof value === "number") return value;
      return String(value ?? "");
    },
    [t],
  );
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
      setLocalCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
      const currentIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
      const nextLesson = currentIndex >= 0 ? orderedLessons[currentIndex + 1] : null;
      if (nextLesson) {
        onLessonSelect?.(nextLesson.id);
      } else {
        onLessonSelect?.(null);
      }
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
    [lang, onLessonSelect, onToast, orderedLessons],
  );
  const handleLockedLessonAttempt = useCallback(() => {
    if (!onToast) return;
    onToast(
      lang === "ro"
        ? "Finalizează lecțiile anterioare pentru a debloca această lecție."
        : "Finish the previous lessons to unlock this step.",
    );
  }, [lang, onToast]);

  return (
    <>
      <KunoActivePanel
        progress={
          <p>
            {lang === "ro" ? "Progres" : "Progress"}: {completedCount} / {timeline.length}{" "}
            {lang === "ro" ? "misiuni" : "missions"}
          </p>
        }
        xpLabel={xpDisplay}
        nextLessonTitle={resolvedLesson?.title ?? null}
        onContinue={resolvedLesson ? () => onLessonSelect?.(resolvedLesson.id) : undefined}
        disabled={!resolvedLesson}
      >
        <div className="mt-4 h-2 rounded-full bg-[#F4EDE4]">
          <div className="h-2 rounded-full bg-[#C07963]" style={{ width: `${Math.min(100, completionPct)}%` }} />
        </div>
      </KunoActivePanel>
      <KunoTimeline
        areaKey={areaKey}
        segments={timelineSegments as Array<{ zoneKey: ArcZoneKey | null; items: ReturnType<typeof computeLessonsStatus> }>}
        module={module}
        lang={lang}
        profileId={profileId}
        resolvedLessonId={resolvedLessonId}
        localCompleted={localCompleted}
        localPerformance={localPerformance}
        onLessonSelect={(lessonId) => onLessonSelect?.(lessonId)}
        onLessonCompleted={handleLessonCompleted}
        onLockedAttempt={handleLockedLessonAttempt}
        renderZoneIntro={renderZoneIntroForTimeline}
        renderEffortBadges={renderEffortBadges}
        t={timelineTranslation}
      />
      {moduleCompleted && finalTestConfig ? (
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
                  onToast(`${finalTestConfig.moduleName} · mini-test finalizat (${result.correct}/${result.total}).`);
                }
              }}
            />
          ) : null}
        </div>
      ) : null}
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
