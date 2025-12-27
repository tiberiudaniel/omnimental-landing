"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { EXPLORE_AXIS_LESSONS, EXPLORE_AXIS_OPTIONS, type ExploreAxisId } from "@/lib/intro/exploreConfig";
import { setAxisLessonChoice, setExploreCompletion } from "@/lib/intro/exploreState";

type PageProps = {
  params: { axisId: ExploreAxisId };
};

export default function ExploreAxisLessonPage({ params }: PageProps) {
  const router = useRouter();
  const lesson = EXPLORE_AXIS_LESSONS[params.axisId];
  const axisMeta = useMemo(() => EXPLORE_AXIS_OPTIONS.find((axis) => axis.id === params.axisId) ?? null, [params.axisId]);

  if (!lesson) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-center">
        <div className="space-y-4 rounded-[24px] border border-[var(--omni-border-soft)] bg-white/90 px-6 py-8 text-[var(--omni-ink)] shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explorare</p>
          <h1 className="text-2xl font-semibold">Zona aleasă nu există.</h1>
          <OmniCtaButton className="justify-center" onClick={() => router.replace("/intro/explore/axes")}>
            Înapoi la selecție
          </OmniCtaButton>
        </div>
      </main>
    );
  }

  const handleFinish = () => {
    setAxisLessonChoice(lesson.id);
    setExploreCompletion("axis");
    router.replace("/intro/guided?source=explore");
  };

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0">
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
        <OmniCtaButton className="justify-center" onClick={handleFinish}>
          Revenim în Guided
        </OmniCtaButton>
      </div>
    </main>
  );
}
