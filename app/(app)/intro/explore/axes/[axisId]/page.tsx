"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { EXPLORE_AXIS_LESSONS, EXPLORE_AXIS_OPTIONS, type ExploreAxisId } from "@/lib/intro/exploreConfig";
import { setAxisLessonChoice, setExploreCompletion } from "@/lib/intro/exploreState";

function ExploreAxisLessonPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ axisId?: string | string[] }>();
  const rawAxisId = params?.axisId;
  const axisIdParam = Array.isArray(rawAxisId) ? rawAxisId[0] : rawAxisId;
  const axisId = axisIdParam as ExploreAxisId | undefined;
  const lesson = axisId ? EXPLORE_AXIS_LESSONS[axisId] : null;
  const axisMeta = useMemo(
    () => (axisId ? EXPLORE_AXIS_OPTIONS.find((axis) => axis.id === axisId) ?? null : null),
    [axisId],
  );
  const isE2E = searchParams?.get("e2e") === "1";
  const withE2E = (path: string) => (isE2E ? `${path}${path.includes("?") ? "&" : "?"}e2e=1` : path);
  const todayPath = () => {
    const query = new URLSearchParams({ mode: "short", source: "explore" });
    if (isE2E) {
      query.set("e2e", "1");
    }
    return `/today?${query.toString()}`;
  };
  const goBackToToday = () => {
    router.push(todayPath());
  };

  if (!lesson || !axisId) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-center"
        data-testid="explore-axis-detail-root"
      >
        <div className="space-y-4 rounded-[24px] border border-[var(--omni-border-soft)] bg-white/90 px-6 py-8 text-[var(--omni-ink)] shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explorare</p>
          <h1 className="text-2xl font-semibold">Zona aleasă nu există.</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <OmniCtaButton className="justify-center" onClick={() => router.replace(withE2E("/intro/explore/axes"))}>
              Înapoi la selecție
            </OmniCtaButton>
            <OmniCtaButton variant="neutral" className="justify-center" data-testid="explore-back-today" onClick={goBackToToday}>
              Înapoi la Today
            </OmniCtaButton>
          </div>
        </div>
      </main>
    );
  }

  const handleFinish = () => {
    setAxisLessonChoice(lesson.id);
    setExploreCompletion("axis");
    router.replace(todayPath());
  };

  return (
    <main
      className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0"
      data-testid="explore-axis-detail-root"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Lecție scurtă</p>
          <h1 className="text-3xl font-semibold">
            {axisMeta?.emoji} {lesson.headline}
          </h1>
        </header>
        <section className="space-y-3 text-sm leading-relaxed text-[var(--omni-ink)]/85">
          {lesson.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
        <section className="space-y-3 rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)]/70 px-4 py-5 text-sm leading-relaxed text-[var(--omni-ink)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Micro-acțiuni</p>
          <ul className="list-disc space-y-2 pl-5">
            {lesson.microActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>
        <p className="text-sm text-[var(--omni-muted)]">{lesson.outro}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <OmniCtaButton className="justify-center" onClick={handleFinish}>
            Revenim în Today
          </OmniCtaButton>
          <OmniCtaButton variant="neutral" className="justify-center" data-testid="explore-back-today" onClick={goBackToToday}>
            Înapoi la Today
          </OmniCtaButton>
        </div>
      </div>
    </main>
  );
}

export default function ExploreAxisLessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <ExploreAxisLessonPageInner />
    </Suspense>
  );
}
