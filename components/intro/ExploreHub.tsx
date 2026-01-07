"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { getAxisLessonChoice, getExploreCompletion } from "@/lib/intro/exploreState";

export default function ExploreHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exploreCompletion = useMemo(() => getExploreCompletion(), []);
  const axisChoice = useMemo(() => getAxisLessonChoice(), []);
  const entrySource = searchParams?.get("source") ?? null;
  const entryParam = (searchParams?.get("entry") ?? "").toLowerCase();
  const entry = entryParam === "axes" || entryParam === "axis" ? "axes" : entryParam === "cat-lite" ? "cat-lite" : null;
  const preserveE2E = (searchParams?.get("e2e") ?? "").toLowerCase() === "1";
  const catCardRef = useRef<HTMLDivElement | null>(null);
  const axisCardRef = useRef<HTMLDivElement | null>(null);
  const todayTarget = useMemo(() => {
    const params = new URLSearchParams({ mode: "deep", source: "explore_cat_day1" });
    if ((searchParams?.get("e2e") || "").toLowerCase() === "1") {
      params.set("e2e", "1");
    }
    return `/today?${params.toString()}`;
  }, [searchParams]);

  useEffect(() => {
    track("explore_opened_final", { entry: entry ?? null, source: entrySource ?? null });
  }, [entry, entrySource]);

  useEffect(() => {
    if (!exploreCompletion) return;
    router.replace(todayTarget);
  }, [exploreCompletion, router, todayTarget]);

  useEffect(() => {
    const targetRef = entry === "axes" ? axisCardRef.current : entry === "cat-lite" ? catCardRef.current : null;
    if (!targetRef) return;
    const frame = window.requestAnimationFrame(() => {
      targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [entry]);

  const axisDisabled = Boolean(axisChoice);

  const featuredCat = entry === "cat-lite";
  const featuredAxis = entry === "axes";
  const catTarget = preserveE2E ? "/intro/explore/cat-lite?e2e=1" : "/intro/explore/cat-lite";
  const axisTarget = preserveE2E ? "/intro/explore/axes?e2e=1" : "/intro/explore/axes";

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explore Mode</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Cum vrei să continui explorarea?</h1>
          <p className="text-base text-[var(--omni-muted)]">Poți merge mai în profunzime într-unul din aceste moduri.</p>
        </header>
        <section className="space-y-5">
          <article
            ref={catCardRef}
            className={`space-y-4 rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${
              featuredCat ? "border-[var(--omni-energy)] bg-white" : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]"
            }`}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
              <span>Opțiunea 1</span>
              {featuredCat ? (
                <span className="rounded-full bg-[var(--omni-energy)]/10 px-3 py-1 text-[var(--omni-energy)]">Recomandat</span>
              ) : null}
            </div>
            <h2 className="text-2xl font-semibold leading-snug text-[var(--omni-ink)]">🟨 Vreau să văd unde mă situez acum</h2>
            <p className="text-base text-[var(--omni-ink)]/85">
              O evaluare scurtă, pe câteva direcții, ca să obții o imagine mai clară a stării tale actuale.
            </p>
            <p className="text-xs text-[var(--omni-muted)]">Nu este un rezultat final. Este o fotografie de moment.</p>
            <OmniCtaButton
              className="justify-center"
              variant="neutral"
              onClick={() => router.push(catTarget)}
              data-testid="explore-card-cat-lite"
            >
              👉 Continuă cu evaluarea
            </OmniCtaButton>
          </article>
          <article
            ref={axisCardRef}
            className={`space-y-4 rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${
              featuredAxis
                ? "border-[var(--omni-energy)] bg-white"
                : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Opțiunea 2</p>
            <h2 className="text-2xl font-semibold leading-snug text-[var(--omni-ink)]">🟦 Vreau să înțeleg mai bine o altă zonă</h2>
            <p className="text-base text-[var(--omni-ink)]/85">O lecție scurtă, la alegere, fără evaluare.</p>
            <p className="text-xs text-[var(--omni-muted)]">
              {axisDisabled ? "Ai ales deja o zonă în această sesiune." : "Poți explora o singură zonă acum."}
            </p>
            <OmniCtaButton
              className="justify-center bg-[var(--omni-ink)]/90"
              variant="neutral"
              disabled={axisDisabled}
              onClick={axisDisabled ? undefined : () => router.push(axisTarget)}
              data-testid="explore-card-axes"
            >
              {axisDisabled ? "Explore deja închis" : "👉 Alege o zonă"}
            </OmniCtaButton>
          </article>
        </section>
      </div>
    </main>
  );
}
