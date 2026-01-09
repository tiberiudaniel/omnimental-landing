"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { getExploreCompletion } from "@/lib/intro/exploreState";
import { getNodeInternalStepsForRoute } from "@/lib/flowStudio/runtime";

const ACTION_TAG_CAT = "cta_explore_cat_day1" as const;
const ACTION_TAG_AXES = "cta_explore_axes_day1" as const;
type ExploreActionTag = typeof ACTION_TAG_CAT | typeof ACTION_TAG_AXES;

type ExploreCardDefinition = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  actionTag: ExploreActionTag;
  highlightLabel?: string;
  testId: string;
  buttonLabel: string;
};

const CARD_META: Record<
  ExploreActionTag,
  {
    eyebrow: string;
    description: string;
    meta: string;
    testId: string;
    buttonLabel: string;
  }
> = {
  [ACTION_TAG_CAT]: {
    eyebrow: "Opțiunea 1",
    description: "Răspunzi la câteva întrebări și vezi unde ești pe axele principale. Nu e test de personalitate, e hartă de lucru.",
    meta: "Potrivit dacă vrei un tablou clar înainte să investești mai mult timp.",
    testId: "explore-card-cat-lite",
    buttonLabel: "Intră în CAT Lite",
  },
  [ACTION_TAG_AXES]: {
    eyebrow: "Opțiunea 2",
    description: "O lecție scurtă, la alegere, fără evaluare completă.",
    meta: "Dacă vrei context rapid, alegi o axă și primești vocab + mini-instrucțiuni.",
    testId: "explore-card-axes",
    buttonLabel: "Alege o zonă",
  },
};

const DEFAULT_SCREEN_ID = "intro_explore_hub_day1";

export default function ExploreHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exploreCompletion = useMemo(() => getExploreCompletion(), []);
  const entrySource = searchParams?.get("source") ?? null;
  const entryParam = (searchParams?.get("entry") ?? "").toLowerCase();
  const entry = entryParam === "axes" || entryParam === "axis" ? "axes" : entryParam === "cat-lite" ? "cat-lite" : null;
  const highlightTag: ExploreActionTag | null =
    entry === "axes" ? ACTION_TAG_AXES : entry === "cat-lite" ? ACTION_TAG_CAT : null;
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
  const catTarget = preserveE2E ? "/intro/explore/cat-lite?e2e=1" : "/intro/explore/cat-lite";
  const axisTarget = preserveE2E ? "/intro/explore/axes?e2e=1" : "/intro/explore/axes";

  useEffect(() => {
    track("explore_opened_final", { entry: entry ?? null, source: entrySource ?? null });
  }, [entry, entrySource]);

  useEffect(() => {
    if (!exploreCompletion) return;
    router.replace(todayTarget);
  }, [exploreCompletion, router, todayTarget]);

  useEffect(() => {
    const targetRef = highlightTag === ACTION_TAG_AXES ? axisCardRef.current : highlightTag === ACTION_TAG_CAT ? catCardRef.current : null;
    if (!targetRef) return;
    const frame = window.requestAnimationFrame(() => {
      targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightTag]);

  const hubScreen = useMemo(() => {
    const screens = getNodeInternalStepsForRoute("/intro/explore");
    if (!screens.length) return null;
    return screens.find((screen) => screen.id === DEFAULT_SCREEN_ID) ?? screens[0] ?? null;
  }, []);

  const cards: ExploreCardDefinition[] = useMemo(() => {
    const docCards = hubScreen?.cards ?? null;
    if (!docCards?.length) {
      return [
        {
          id: "card_cat_profile",
          eyebrow: CARD_META[ACTION_TAG_CAT].eyebrow,
          title: "🟧 Profil mental Ziua 1 (CAT)",
          description: CARD_META[ACTION_TAG_CAT].description,
          meta: CARD_META[ACTION_TAG_CAT].meta,
          highlightLabel: "Recomandat azi",
          actionTag: ACTION_TAG_CAT,
          testId: CARD_META[ACTION_TAG_CAT].testId,
          buttonLabel: CARD_META[ACTION_TAG_CAT].buttonLabel,
        },
        {
          id: "card_explore_axis",
          eyebrow: CARD_META[ACTION_TAG_AXES].eyebrow,
          title: "🟦 Vreau să înțeleg mai bine o singură zonă",
          description: CARD_META[ACTION_TAG_AXES].description,
          meta: CARD_META[ACTION_TAG_AXES].meta,
          actionTag: ACTION_TAG_AXES,
          testId: CARD_META[ACTION_TAG_AXES].testId,
          buttonLabel: CARD_META[ACTION_TAG_AXES].buttonLabel,
        },
      ];
    }
    return docCards
      .map((card) => {
        if (!card.actionTag) return null;
        const actionTag = card.actionTag as ExploreActionTag;
        const meta = CARD_META[actionTag];
        if (!meta) return null;
        return {
          id: card.id,
          eyebrow: meta.eyebrow,
          title: card.label || (actionTag === ACTION_TAG_CAT ? "Profil mental Ziua 1" : "Explorează o axă"),
          description: meta.description,
          meta: meta.meta,
          actionTag,
          testId: meta.testId,
          highlightLabel: actionTag === ACTION_TAG_CAT ? "Recomandat azi" : undefined,
          buttonLabel: meta.buttonLabel,
        } as ExploreCardDefinition;
      })
      .filter((entry): entry is ExploreCardDefinition => Boolean(entry));
  }, [hubScreen]);

  const handleAction = useCallback(
    (actionTag: ExploreActionTag) => {
      const target = actionTag === ACTION_TAG_AXES ? axisTarget : catTarget;
      track("explore_card_selected", { actionTag, source: entrySource ?? null });
      router.push(target);
    },
    [axisTarget, catTarget, entrySource, router],
  );

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-0">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Ziua 1 · Explorare</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Ai redus zgomotul. Acum îți clarifici profilul mental.</h1>
          <p className="text-base text-[var(--omni-muted)]">Alege una dintre opțiuni – recomandarea de azi este profilul CAT completat rapid.</p>
        </header>
        <section className="space-y-5">
          {cards.map((card) => {
            const cardRef = card.actionTag === ACTION_TAG_CAT ? catCardRef : axisCardRef;
            const highlighted = highlightTag ? highlightTag === card.actionTag : card.actionTag === ACTION_TAG_CAT;
            return (
              <article
                key={card.id}
                ref={cardRef}
                className={`space-y-4 rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${
                  highlighted ? "border-[var(--omni-energy)] bg-white" : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]"
                }`}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                  <span>{card.eyebrow}</span>
                  {highlighted && card.highlightLabel ? (
                    <span className="rounded-full bg-[var(--omni-energy)] px-3 py-1 text-xs font-semibold text-white">{card.highlightLabel}</span>
                  ) : null}
                </div>
                <h2 className="text-2xl font-semibold leading-snug text-[var(--omni-ink)]">{card.title}</h2>
                <p className="text-base text-[var(--omni-ink)]/85">{card.description}</p>
                <p className="text-xs text-[var(--omni-muted)]">{card.meta}</p>
                <OmniCtaButton
                  className={`justify-center ${card.actionTag === ACTION_TAG_AXES ? "bg-[var(--omni-ink)]/90" : ""}`}
                  variant="neutral"
                  onClick={() => handleAction(card.actionTag)}
                  data-testid={card.testId}
                  data-action-tag={card.actionTag}
                >
                  {card.buttonLabel}
                </OmniCtaButton>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
