"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { getAxisLessonChoice, getExploreCompletion } from "@/lib/intro/exploreState";

export default function ExploreHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exploreCompletion = useMemo(() => getExploreCompletion(), []);
  const axisChoice = useMemo(() => getAxisLessonChoice(), []);
  const todayTarget = useMemo(() => {
    const params = new URLSearchParams({ mode: "short", source: "explore" });
    if ((searchParams?.get("e2e") || "").toLowerCase() === "1") {
      params.set("e2e", "1");
    }
    return `/today?${params.toString()}`;
  }, [searchParams]);

  useEffect(() => {
    track("explore_opened_final");
  }, []);

  useEffect(() => {
    if (!exploreCompletion) return;
    router.replace(todayTarget);
  }, [exploreCompletion, router, todayTarget]);

  const axisDisabled = Boolean(axisChoice);

  const cards = useMemo(
    () => [
      {
        id: "cat-lite",
        eyebrow: "Opțiunea 1",
        title: "🟨 Vreau să văd unde mă situez acum",
        description:
          "O evaluare scurtă, pe câteva direcții, ca să obții o imagine mai clară a stării tale actuale.",
        micro: "Nu este un rezultat final. Este o fotografie de moment.",
        action: "👉 Continuă cu evaluarea",
        onClick: () => router.push("/intro/explore/cat-lite"),
        variant: "primary" as const,
        disabled: false,
      },
      {
        id: "axis",
        eyebrow: "Opțiunea 2",
        title: "🟦 Vreau să înțeleg mai bine o altă zonă",
        description: "O lecție scurtă, la alegere, fără evaluare.",
        micro: axisDisabled ? "Ai ales deja o zonă în această sesiune." : "Poți explora o singură zonă acum.",
        action: axisDisabled ? "Explore deja închis" : "👉 Alege o zonă",
        onClick: () => router.push("/intro/explore/axes"),
        variant: "secondary" as const,
        disabled: axisDisabled,
      },
    ],
    [axisDisabled, router],
  );

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explore Mode</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Cum vrei să continui explorarea?</h1>
          <p className="text-base text-[var(--omni-muted)]">Poți merge mai în profunzime într-unul din aceste moduri.</p>
        </header>
        <section className="space-y-5">
          {cards.map((card) => (
            <article
              key={card.id}
              className="space-y-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{card.eyebrow}</p>
              <h2 className="text-2xl font-semibold leading-snug text-[var(--omni-ink)]">{card.title}</h2>
              <p className="text-base text-[var(--omni-ink)]/85">{card.description}</p>
              <p className="text-xs text-[var(--omni-muted)]">{card.micro}</p>
              <OmniCtaButton
                className={card.variant === "primary" ? "justify-center" : "justify-center bg-[var(--omni-ink)]/90"}
                variant="neutral"
                disabled={card.disabled}
                onClick={card.disabled ? undefined : card.onClick}
              >
                {card.action}
              </OmniCtaButton>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
