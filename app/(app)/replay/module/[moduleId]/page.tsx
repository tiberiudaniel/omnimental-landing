"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { resolveModuleId, getModuleLabel, type OmniKunoModuleId } from "@/config/omniKunoModules";
import type { OmniKunoLesson } from "@/config/omniKunoLessons";
import {
  OMNI_KUNO_LESSON_CONTENT,
  type OmniKunoLessonScreen,
} from "@/config/omniKunoLessonContent";
import { OMNIKUNO_MODULES as OMNIKUNO_LESSON_MODULES } from "@/config/omniKunoLessons";

function useOrderedLessons(moduleId: OmniKunoModuleId) {
  return useMemo(() => {
    const moduleConfig = OMNIKUNO_LESSON_MODULES[moduleId];
    return moduleConfig.lessons.slice().sort((a, b) => a.order - b.order);
  }, [moduleId]);
}

function ReplayScreen({ screen }: { screen: OmniKunoLessonScreen }) {
  if (screen.kind === "content") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {screen.title}
        </p>
        <p className="text-sm leading-relaxed text-[var(--omni-ink)]">{screen.body}</p>
        {screen.bullets ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--omni-ink)]">
            {screen.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (screen.kind === "reflection") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {screen.title}
        </p>
        <p className="text-sm text-[var(--omni-ink)]">{screen.prompt}</p>
        <p className="rounded-card border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-sm text-[var(--omni-muted)]">
          {"Scrie-ți notele într-un jurnal separat; această reluare este doar pentru reîmprospătare."}
        </p>
      </div>
    );
  }
  if (screen.kind === "quiz") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {screen.title}
        </p>
        <p className="text-sm text-[var(--omni-ink)]">{screen.question}</p>
        <ul className="space-y-1 rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-sm text-[var(--omni-ink)]">
          {screen.options.map((option) => (
            <li key={option}>{option}</li>
          ))}
        </ul>
        <p className="text-xs text-[var(--omni-muted)]">
          Răspunsurile rămân blocate – recitește doar opțiunile corecte.
        </p>
      </div>
    );
  }
  if (screen.kind === "checkpoint") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {screen.title}
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--omni-ink)]">
          {screen.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    );
  }
  if (screen.kind === "protocol") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {screen.title}
        </p>
        {screen.body ? <p className="text-sm text-[var(--omni-ink)]">{screen.body}</p> : null}
        {screen.steps ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--omni-ink)]">
            {screen.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (screen.kind === "arcIntro") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {screen.title}
        </p>
        <p className="text-sm text-[var(--omni-ink)]">{screen.body}</p>
      </div>
    );
  }
  return null;
}

function ReplayLessonContent({ lesson }: { lesson: OmniKunoLesson }) {
  const lessonContent = OMNI_KUNO_LESSON_CONTENT[lesson.id];
  const screens = lessonContent?.screens ?? [];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Lecție OmniKuno</p>
        <h2 className="text-2xl font-bold text-[var(--omni-ink)]">{lesson.title}</h2>
        {lesson.summary ? <p className="mt-2 text-sm text-[var(--omni-ink)]">{lesson.summary}</p> : null}
      </div>
      {screens.length ? (
        <div className="space-y-4">
          {screens.map((screen, idx) => (
            <div
              key={`${lesson.id}-${idx}`}
              className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3"
            >
              <ReplayScreen screen={screen} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--omni-muted)]">
          Nu există încă conținut detaliat pentru această lecție.
        </p>
      )}
    </div>
  );
}

function ReplayModuleContent({ moduleId }: { moduleId: OmniKunoModuleId }) {
  const { lang } = useI18n();
  const lessons = useOrderedLessons(moduleId);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  if (!lessons.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm text-[var(--omni-muted)]">Acest modul nu are încă lecții pentru replay.</p>
        <Link
          href="/progress"
          className="inline-flex rounded-full border border-[var(--omni-ink)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
        >
          Înapoi la Dashboard
        </Link>
      </div>
    );
  }

  const clampedIndex = Math.min(index, lessons.length - 1);
  const isComplete = index >= lessons.length;
  const currentLesson = lessons[isComplete ? lessons.length - 1 : clampedIndex];

  const handleNext = () => {
    if (index < lessons.length) {
      setIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const moduleLabel = getModuleLabel(moduleId, lang === "ro" ? "ro" : "en");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2 rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Replay modul</p>
        <h1 className="text-3xl font-bold text-[var(--omni-ink)]">{moduleLabel}</h1>
        {!isComplete ? (
          <p className="text-sm text-[var(--omni-muted)]">
            {lang === "ro"
              ? `Lecția ${clampedIndex + 1} din ${lessons.length}. Reluare liniară — progresul original rămâne intact.`
              : `Lesson ${clampedIndex + 1} of ${lessons.length}. Linear replay keeps your completion intact.`}
          </p>
        ) : (
          <p className="text-sm text-[var(--omni-muted)]">
            {lang === "ro"
              ? "Ai reluat toate lecțiile. Întoarce-te în Dashboard pentru recomandări."
              : "You replayed every lesson. Return to the dashboard for next steps."}
          </p>
        )}
      </div>

      {!isComplete && currentLesson ? (
        <div className="space-y-4 rounded-card border border-[var(--omni-border-soft)] bg-white/95 px-5 py-6 shadow-xl">
          <div className="rounded-full border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
            {lang === "ro" ? "Mod Replay · conținut" : "Replay mode · content"}
          </div>
          <ReplayLessonContent lesson={currentLesson} />
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={index === 0}
              className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)] transition hover:border-[var(--omni-ink)] hover:text-[var(--omni-ink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {lang === "ro" ? "Înapoi" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center rounded-full border border-[var(--omni-energy)] bg-[var(--omni-energy)] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            >
              {index >= lessons.length - 1 ? (lang === "ro" ? "Finalizează replay" : "Finish replay") : lang === "ro" ? "Lecția următoare" : "Next lesson"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-card border border-[var(--omni-border-soft)] bg-white/95 px-5 py-6 text-center shadow-xl">
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{lang === "ro" ? "Replay complet" : "Replay complete"}</p>
          <p className="text-sm text-[var(--omni-muted)]">
            {lang === "ro"
              ? "Toate lecțiile au fost reluate. Poți reveni la Dashboard pentru a continua."
              : "All lessons have been revisited. You can return to the dashboard."}
          </p>
          <Link
            href="/progress"
            className="inline-flex items-center justify-center rounded-full border border-[var(--omni-ink)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] transition hover:bg-[var(--omni-ink)] hover:text-white"
          >
            {lang === "ro" ? "Înapoi la Dashboard" : "Back to dashboard"}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ReplayModulePage() {
  const params = useParams<{ moduleId: string }>();
  const normalized = resolveModuleId(params?.moduleId);
  if (!normalized) {
    notFound();
  }
  return (
    <AppShell header={<SiteHeader showMenu={false} wizardMode />}>
      <ReplayModuleContent moduleId={normalized} />
    </AppShell>
  );
}
