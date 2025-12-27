"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { EXPLORE_AXIS_OPTIONS, getExploreAxisOption, type ExploreAxisId } from "@/lib/intro/exploreConfig";
import { getAxisLessonChoice, setAxisLessonChoice } from "@/lib/intro/exploreState";

export default function ExploreAxisPickerPage() {
  const router = useRouter();
  const existingChoice = useMemo(() => getAxisLessonChoice(), []);

  const existingAxisLabel = useMemo(() => getExploreAxisOption(existingChoice as ExploreAxisId | null)?.title ?? null, [existingChoice]);

  const handleSelect = (axisId: ExploreAxisId) => {
    if (existingChoice) return;
    setAxisLessonChoice(axisId);
    router.push(`/intro/explore/axes/${axisId}`);
  };

  if (existingChoice) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)]">
        <div className="w-full max-w-2xl space-y-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-white/90 px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explorare</p>
          <h1 className="text-2xl font-semibold">Ai ales deja zona {existingAxisLabel ?? existingChoice}.</h1>
          <p className="text-sm text-[var(--omni-muted)]">Continuăm cu traseul Guided.</p>
          <OmniCtaButton className="justify-center" onClick={() => router.replace("/intro/guided?source=explore")}>
            Înapoi în Guided
          </OmniCtaButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explorare</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Ce zonă vrei să explorezi acum?</h1>
          <p className="text-base text-[var(--omni-muted)]">Alege una. Vei primi o lecție scurtă.</p>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          {EXPLORE_AXIS_OPTIONS.map((axis) => (
            <article key={axis.id} className="space-y-4 rounded-[24px] border border-[var(--omni-border-soft)] bg-white/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{axis.emoji}</p>
                <h2 className="mt-1 text-xl font-semibold">{axis.title}</h2>
                <p className="text-sm text-[var(--omni-ink)]/80">{axis.description}</p>
              </div>
              <OmniCtaButton className="justify-center" onClick={() => handleSelect(axis.id)}>
                👉 Explorează
              </OmniCtaButton>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
