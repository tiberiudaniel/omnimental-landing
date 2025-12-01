"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useI18n } from "@/components/I18nProvider";
import { useTStrings } from "@/components/useTStrings";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import {
  computeDimensionScores,
  type IntentCategorySummary,
} from "@/lib/scoring";
import { recommendSession } from "@/lib/recommendation";
import { readRecommendationCache } from "@/lib/recommendationCache";
import DemoUserSwitcher from "@/components/DemoUserSwitcher";
import ExperienceStep from "@/components/ExperienceStep";
import { useUserRecommendations } from "@/components/useUserRecommendations";
import {
  RecommendationFilters,
  type RecommendationFilterKey,
} from "@/components/recommendations/RecommendationFilters";
import { RecommendationListStack } from "@/components/recommendations/RecommendationListStack";
import { RecommendationDetailPanel } from "@/components/recommendations/RecommendationDetailPanel";
import type { OmniRecommendation } from "@/lib/recommendations";
import { getPrimaryRecommendation } from "@/lib/recommendations";
import FirstOfferPanel from "@/components/recommendations/FirstOfferPanel";
import { choosePrimaryProduct, inferBudgetLevelFromIntent } from "@/lib/primaryProduct";
import { useAuth } from "@/components/AuthProvider";
import { PrimaryButton, SecondaryButton } from "@/components/PrimaryButton";
// useState already imported above

const STAGE_LABELS: Record<string, string> = {
  t0: "Start (0 săpt.)",
  t1: "3 săpt.",
  t2: "6 săpt.",
  t3: "9 săpt.",
  t4: "12 săpt.",
};

// ------------------------------------------------------
// Page shell + stacked recommendations
// ------------------------------------------------------

function RecommendationContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useI18n();
  const { s } = useTStrings();
  const { profile } = useProfile();
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setArrowY] = useState<number | null>(null);
  const allowGuest = Boolean(search?.get("demo") || search?.get("e2e") === "1");
  const hasFullAccount = Boolean(user && !user.isAnonymous);
  const needsAccount = !hasFullAccount && !allowGuest;
  const isClient = typeof window !== "undefined";

    const redirectToAuth = () => {
    const encoded = encodeURIComponent("/recommendation");
    router.push(`/auth?returnTo=${encoded}`);
  };

  // Gate tweak: nu mai redirect automat la /choose, ci banner clar cu CTA
  const showChooseBanner = useMemo(
    () => Boolean(profile?.id && (profile.selection ?? "none") === "none"),
    [profile?.id, profile?.selection],
  );

  const tier = profile?.accessTier ?? "public";
  const { data: progress, loading, error } = useProgressFacts(profile?.id);
  const isPublicTier = tier === "public";

  const pageTitle = lang === 'ro'
    ? 'Recomandările tale și progresul lor'
    : s('recommendationPageTitle', 'Your recommendations and progress');
  const pageSubtitle = s(
    "recommendationPageSubtitle",
    "Folosim datele completate până acum pentru a-ți da direcția cu cele mai multe șanse.",
  );

  // Stack de recomandări (istoric + starea curentă)
  const { recommendations, loading: recLoading } = useUserRecommendations();

  const [filter, setFilter] = useState<RecommendationFilterKey>(() => {
    if (typeof window === "undefined") return "all";
    try {
      const v = window.localStorage.getItem("reco_filter");
      if (
        v === "new" ||
        v === "active" ||
        v === "done" ||
        v === "today" ||
        v === "all"
      ) {
        return v as RecommendationFilterKey;
      }
    } catch {
      // ignore
    }
    return "all";
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  // Demo fallback when no recommendations yet
  const demoRecs: OmniRecommendation[] = useMemo(() => {
    const uid = profile?.id ?? "demo";
    const nowIso = new Date().toISOString();
    return [
      {
        id: "demo-1",
        userId: uid,
        title: "Focus pe somn în următoarele 3 zile",
        shortLabel: "Somn – 3 zile",
        type: "next-step",
        status: "new",
        priority: 1,
        createdAt: nowIso,
        estimatedMinutes: 15,
        tags: ["somn", "energie"],
        body:
          "Începe prin a-ți stabiliza ora de culcare și evită ecranele în ultima oră înainte de somn. Notează în jurnal cum te simți dimineața.",
        ctaLabel: "Vezi exercițiul de seară",
        ctaHref: "/antrenament?tab=somn",
      },
      {
        id: "demo-2",
        userId: uid,
        title: "Micro-pauze pentru claritate mentală",
        shortLabel: "Pauze de 3 minute",
        type: "mindset",
        status: "active",
        priority: 2,
        createdAt: nowIso,
        estimatedMinutes: 10,
        tags: ["claritate", "workday"],
        body:
          "De 3 ori pe zi, rupe 3 minute pentru respirație conștientă sau o scurtă plimbare. Scopul este să-ți recalibrezi atenția, nu să ‘recuperezi’ task-uri.",
        ctaLabel: "Deschide ghidul de micro-pauze",
        ctaHref: "/antrenament?tab=pauze",
      },
      {
        id: "demo-3",
        userId: uid,
        title: "Clarifică-ți intenția pentru săptămâna asta",
        shortLabel: "Intenția săptămânii",
        type: "quest",
        status: "new",
        priority: 3,
        createdAt: nowIso,
        estimatedMinutes: 20,
        tags: ["intenții", "mindset"],
        body:
          "Răspunde în jurnal la trei întrebări: 1) Ce vreau să iasă diferit săptămâna asta? 2) Ce îmi poate sabota intenția? 3) Ce micro-acțiune încep chiar azi?",
        ctaLabel: "Deschide jurnalul",
        ctaHref: "/jurnal?from=recommendation",
      },
    ];
  }, [profile?.id]);

  // Base list used both for filtering and counts
  const baseAll: OmniRecommendation[] = useMemo(
    () => (recommendations.length ? recommendations : demoRecs),
    [recommendations, demoRecs],
  );

  // Ensure the oldest (index 1 at bottom) is the initial path recommendation: Group vs Individual
  const basePathRecFromProgress: OmniRecommendation | null = useMemo(() => {
    try {
      // Prefer member recommendation computed from current progress
      if (!isPublicTier && progress?.intent && progress?.evaluation) {
        const intentCategories = progress.intent.categories as IntentCategorySummary[];
        const dimensionScores = computeDimensionScores(intentCategories, progress.intent.urgency);
        const rec = recommendSession({
          urgency: progress.intent.urgency,
          primaryCategory: intentCategories[0]?.category,
          dimensionScores,
          hasProfile: true,
        });
        const isGroup = rec.recommendedPath !== 'individual';
        const label = isGroup ? (lang === 'ro' ? 'Grup OmniMental' : 'OmniMental group') : (lang === 'ro' ? 'Ședințe individuale' : 'Individual sessions');
        const title = (lang === 'ro' ? 'Recomandare inițială: ' : 'Initial recommendation: ') + label;
        const body = s(
          `recommendationPath_${rec.recommendedPath}_body`,
          isGroup
            ? 'Ți se potrivește ritmul și suportul din programul de grup OmniMental.'
            : 'Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară.'
        );
        return {
          id: 'base-path',
          userId: profile?.id ?? 'demo',
          title,
          shortLabel: label,
          type: 'onboarding',
          status: 'done',
          createdAt: '2000-01-01T00:00:00.000Z',
          updatedAt: undefined,
          priority: 3,
          estimatedMinutes: undefined,
          tags: [],
          body,
          ctaLabel: isGroup ? (lang === 'ro' ? 'Deschide programul de grup' : 'Open group program') : (lang === 'ro' ? 'Programează un call' : 'Book a call'),
          ctaHref: isGroup ? '/group' : '/contact',
          source: 'system',
          sourceRef: 'path-recommendation',
        };
      }
    } catch {}
    return null;
  }, [isPublicTier, progress, profile, lang, s]);

  const [cachedBasePathRec, setCachedBasePathRec] = useState<OmniRecommendation | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    let cancelled = false;
    const applyCache = () => {
      if (cancelled) return;
      try {
        const cached = readRecommendationCache();
        if (!cached) {
          setCachedBasePathRec(null);
          return;
        }
        const isGroup = cached.recommendation.path !== "individual";
        const label =
          isGroup
            ? lang === "ro"
              ? "Grup OmniMental"
              : "OmniMental group"
            : lang === "ro"
              ? "Ședințe individuale"
              : "Individual sessions";
        const title = (lang === "ro" ? "Recomandare inițială: " : "Initial recommendation: ") + label;
        const body = isGroup
          ? lang === "ro"
            ? "Ți se potrivește ritmul și suportul din programul de grup OmniMental."
            : "Group program seems a good fit."
          : lang === "ro"
            ? "Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară."
            : "1-on-1 sessions fit your situation.";
        setCachedBasePathRec({
          id: "base-path",
          userId: profile?.id ?? "demo",
          title,
          shortLabel: label,
          type: "onboarding",
          status: "done",
          createdAt: "2000-01-01T00:00:00.000Z",
          priority: 3,
          body,
          ctaLabel: isGroup
            ? lang === "ro"
              ? "Deschide programul de grup"
              : "Open group program"
            : lang === "ro"
              ? "Programează un call"
              : "Book a call",
          ctaHref: isGroup ? "/group" : "/contact",
          source: "system",
          sourceRef: "path-recommendation",
        });
      } catch {
        setCachedBasePathRec(null);
      }
    };
    applyCache();
    window.addEventListener("storage", applyCache);
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", applyCache);
      }
    };
  }, [profile?.id, lang]);

  const basePathRec = basePathRecFromProgress ?? cachedBasePathRec;

  const withBase: OmniRecommendation[] = useMemo(() => {
    const list = [...baseAll];
    if (basePathRec && !list.some((r) => r.id === 'base-path')) list.push(basePathRec);
    return list;
  }, [baseAll, basePathRec]);

  const filteredRecs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    switch (filter) {
      case "new":
        return withBase.filter((r) => r.status === "new");
      case "active":
        return withBase.filter((r) => r.status === "active");
      case "done":
        return withBase.filter((r) => r.status === "done");
      case "today":
        return withBase.filter((r) => (r.createdAt || "").startsWith(todayStr));
      case "all":
      default:
        return withBase;
    }
  }, [withBase, filter]);

  // Effective list for UI: if current filter set is empty, show demo
  const effectiveRecs = useMemo(
    () => (filteredRecs.length ? filteredRecs : demoRecs),
    [filteredRecs, demoRecs],
  );

  const activeRec: OmniRecommendation | null = useMemo(() => {
    if (!effectiveRecs.length) return null;
    if (activeId && effectiveRecs.some((r) => r.id === activeId)) {
      return effectiveRecs.find((r) => r.id === activeId)!;
    }
    return getPrimaryRecommendation(effectiveRecs) ?? null;
  }, [effectiveRecs, activeId]);

  // Temporar: afișăm mereu secțiunea; componenta știe să arate empty state
  const hasStack = true;

  // Arrow animates via key change; no setState in effect

  const header = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={redirectToAuth}
    />
  );

  return (
    <>
      <AppShell header={header}>
        {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? (
          <DemoUserSwitcher />
        ) : null}
        {search?.get("demo") ? (
          <div className="mx-auto mt-3 w-full max-w-4xl px-4">
            <span className="inline-flex items-center rounded-full bg-[var(--omni-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
              {s("badgeDemo", "Demo")}
            </span>
          </div>
        ) : null}

        <div className="px-4 py-12 md:px-8" data-testid="recommendation-step">
        {needsAccount ? (
          <section className="mx-auto mb-6 max-w-3xl rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Recomandările tale" : "Your recommendations"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">
              {lang === "ro"
                ? "Ai deja un plan personalizat. Hai să nu-l pierzi."
                : "You already have a personalised path. Let’s not lose it."}
            </h1>
            <p className="mt-3 text-sm text-[var(--omni-ink-soft)]/80">
              {lang === "ro"
                ? "Poți vedea direcția recomandată și ca invitat, dar ca să păstrăm traseul, jurnalul și pașii următori în timp, e nevoie de un cont OmniMental."
                : "You can see your recommended direction as a guest, but to keep your path, journal, and next steps over time, you’ll need an OmniMental account."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <SecondaryButton
                type="button"
                onClick={() => router.push("/?step=cards")}
                className="text-[11px] uppercase tracking-[0.25em]"
              >
                {lang === "ro" ? "Reia wizardul" : "Resume wizard"}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={redirectToAuth}
                className="text-[11px] uppercase tracking-[0.25em]"
              >
                {lang === "ro" ? "Creează cont" : "Create account"}
              </PrimaryButton>
            </div>
          </section>
        ) : null}
        {showChooseBanner ? (
          <div className="mx-auto mb-4 w-full max-w-4xl rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === "ro"
                  ? "Pentru a vedea recomandarea completă, alege modul în care vrei să continui (individual sau grup)."
                  : "To view your full recommendation, choose how you want to continue (individual or group)."}
              </p>
              <SecondaryButton
                type="button"
                onClick={() => {
                  const url = new URL(window.location.origin + "/choose");
                  url.searchParams.set("from", "reco");
                  router.push(url.pathname + url.search);
                }}
                className="shrink-0 text-[11px] uppercase tracking-[0.25em]"
              >
                {lang === "ro" ? "Alege formatul" : "Choose format"}
              </SecondaryButton>
            </div>
          </div>
        ) : null}
        <div className="w-full max-w-5xl mx-auto px-4">
          <section className="omni-card rounded-3xl p-6 md:p-7 mb-8 space-y-3 text-center">
            <p className="text-xs md:text-[11px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">OmniMental</p>
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--omni-ink)]">{pageTitle}</h1>
            <p className="text-sm text-[var(--omni-ink-soft)]">{pageSubtitle}</p>
            <div className="mt-2 flex justify-center">
              <PrimaryButton
                shape="pill"
                data-testid="reco-initiation-cta"
                className="uppercase tracking-[0.2em] text-[12px]"
                asChild
              >
                <Link href="/experience-onboarding?flow=initiation&step=welcome&from=recommendation">
                  {lang === "ro" ? "Vreau să testez OmniMental" : "I want to try OmniMental"}
                </Link>
              </PrimaryButton>
            </div>
          </section>
        </div>

        <div className="w-full max-w-5xl mx-auto px-4 space-y-8">
        {/* Stack + detail */}
        {hasStack ? (
          <section className="space-y-6" data-testid="debug-stack-section">
            <div className="omni-panel-soft rounded-3xl p-6 md:p-7 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base md:text-lg font-semibold text-[var(--omni-ink)]">
                {lang === "ro" ? "Recomandări" : "Your recommendations"}
              </h2>
              <RecommendationFilters
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  try {
                    window.localStorage.setItem("reco_filter", v);
                  } catch {}
                }}
                labels={{
                  all: lang === "ro" ? "Toate" : "All",
                  new: lang === "ro" ? "Noi" : "New",
                  active: lang === "ro" ? "În lucru" : "Active",
                  done: lang === "ro" ? "Finalizate" : "Done",
                  today: lang === "ro" ? "Azi" : "Today",
                }}
                counts={
                  isClient
                    ? {
                        all: withBase.length,
                        new: withBase.filter((r) => r.status === "new").length,
                        active: withBase.filter((r) => r.status === "active").length,
                        done: withBase.filter((r) => r.status === "done").length,
                        today: withBase.filter((r) => (r.createdAt || "").startsWith(new Date().toISOString().slice(0, 10))).length,
                      }
                    : undefined
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)]">
              <div className="omni-panel-soft rounded-3xl p-6 md:p-7">
                {recLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 w-full rounded-2xl bg-[var(--omni-bg-paper)]" />
                    <div className="h-10 w-11/12 rounded-2xl bg-[var(--omni-bg-paper)]" />
                    <div className="h-10 w-10/12 rounded-2xl bg-[var(--omni-bg-paper)]" />
                  </div>
                ) : (
                  <RecommendationListStack
                    items={effectiveRecs}
                    activeId={activeRec?.id ?? null}
                    onActiveChange={setActiveId}
                    onActiveMidpoint={(mid) => setArrowY(mid)}
                  />
                )}
              </div>
              <div className="space-y-6">
                <div className="omni-card rounded-3xl p-6 md:p-7">
                  {recLoading ? (
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-[var(--omni-bg-paper)]" />
                      <div className="h-5 w-56 bg-[var(--omni-bg-paper)]" />
                      <div className="h-20 w-full bg-[var(--omni-bg-paper)]" />
                      <div className="h-10 w-32 bg-[var(--omni-bg-paper)]" />
                    </div>
                  ) : (
                    <RecommendationDetailPanel item={activeRec} />
                  )}
                </div>
                <div className="omni-panel-soft rounded-3xl p-6 md:p-7 text-[var(--omni-muted)]">
                  <p className="text-sm">
                    {lang === "ro"
                      ? "Aplică recomandarea principală și revino pentru actualizări bazate pe progres."
                      : "Apply your primary recommendation and return for updates as progress shifts."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Public: doar teaser + cached view dacă există */}
        {isPublicTier && recommendations.length === 0 ? (
          <PublicOrCachedView lang={lang} />
        ) : null}

        {/* Rezumat mare pentru membri (path + scoruri + quest-uri) */}
        {!isPublicTier ? (
          <MemberRecommendationView
            profileName={(profile as { name?: string; id?: string } | null)?.name ?? profile?.id ?? "Membru OmniMental"}
            progress={progress}
            loading={loading}
            error={error}
            tier={tier}
          />
        ) : null}

        {/* Continuare blândă: ExperienceStep */}
        {!isPublicTier && profile?.id ? (
          <ExperienceStep
            userId={profile.id}
            onContinue={() => router.push("/progress")}
          />
        ) : null}
        </div>
        </div>
      </AppShell>
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
      />
    </>
  );
}

// ------------------------------------------------------
// Public views (teaser / cached)
// ------------------------------------------------------

function PublicRecommendationView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  const title = s(
    "recommendationPublicTitle",
    "Vrei o direcție personalizată?",
  );
  const body = s(
    "recommendationPublicBody",
    "Completează mini-evaluarea (5–7 minute) și primești un sumar logic + următorul pas recomandat.",
  );
  const ctaLabel = s("recommendationPublicCta", "Începe evaluarea");
  return (
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{title}</h2>
      <p className="text-sm text-[var(--omni-ink-soft)]">{body}</p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/antrenament"
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
        >
          {ctaLabel}
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Necesită autentificare" : "Requires sign in"}
        </p>
      </div>
    </section>
  );
}

function PublicOrCachedView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  const [cached, setCached] = useState<ReturnType<typeof readRecommendationCache> | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return readRecommendationCache() ?? null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const update = () => {
      if (cancelled) return;
      try {
        setCached(readRecommendationCache() ?? null);
      } catch {
        setCached(null);
      }
    };
    const raf = window.requestAnimationFrame(update);
    const listener: EventListener = () => {
      window.requestAnimationFrame(update);
    };
    window.addEventListener("storage", listener);
    window.addEventListener("recommendation:cache-update", listener);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("storage", listener);
      window.removeEventListener("recommendation:cache-update", listener);
    };
  }, []);

  if (!cached) {
    return <PublicRecommendationView lang={lang} />;
  }

  const title = s(
    "recommendationCachedTitle",
    "Recomandarea ta salvată",
  );
  const label =
    cached.recommendation.path === "individual"
      ? lang === "ro"
        ? "Ședințe individuale"
        : "Individual sessions"
      : lang === "ro"
      ? "Grup OmniMental"
      : "OmniMental group";
  const reason = s(
    `recommendationReason_${cached.recommendation.reasonKey}`,
    cached.recommendation.reasonKey,
  );
  const selectionNote = cached.selectedPath
    ? cached.selectedPath === "individual"
      ? lang === "ro"
        ? "Ai ales sesiuni individuale."
        : "You chose individual sessions."
      : lang === "ro"
      ? "Ai ales programul de grup."
      : "You chose the group program."
    : null;

  return (
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{title}</h2>
      <p className="text-sm text-[var(--omni-ink-soft)]">
        {lang === "ro"
          ? "Bazată pe ultimele selecții făcute în aplicație."
          : "Based on your latest selections in the app."}
      </p>
      <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-energy)]">
          {lang === "ro" ? "Recomandare" : "Recommendation"}
        </p>
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{label}</h3>
        <p className="text-sm text-[var(--omni-ink-soft)]">{reason}</p>
        {selectionNote ? (
          <p className="text-xs text-[var(--omni-muted)]">{selectionNote}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Link
          href={
            cached.selectedPath === "group" ? "/group" : "/experience-onboarding"
          }
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
        >
          {lang === "ro" ? "Continuă de aici" : "Continue from here"}
        </Link>
      </div>
    </section>
  );
}

// ------------------------------------------------------
// Member view: path + scoruri + quest-uri
// ------------------------------------------------------

type MemberViewProps = {
  profileName: string;
  progress: ReturnType<typeof useProgressFacts>["data"];
  loading: boolean;
  error: Error | null;
  tier: string;
};

function MemberRecommendationView({
  profileName,
  progress,
  loading,
  error,
  tier,
}: MemberViewProps) {
  const router = useRouter();
  const { s } = useTStrings();
  const { lang } = useI18n();

  if (loading) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 text-center text-sm text-[var(--omni-ink-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationLoading",
          "Se încarcă recomandarea ta personalizată…",
        )}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[var(--omni-danger)] bg-[var(--omni-danger-soft)] px-6 py-6 text-center text-sm text-[var(--omni-danger)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationLoadError",
          "Nu am putut încărca recomandarea. Încearcă din nou.",
        )}
      </div>
    );
  }
  if (!progress?.intent || !progress?.evaluation) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center text-sm text-[var(--omni-ink-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationMemberFallback",
          "Finalizează o evaluare completă pentru a primi recomandări dedicate.",
        )}
      </div>
    );
  }

  const intentCategories = progress.intent.categories as IntentCategorySummary[];
  const dimensionScores = computeDimensionScores(
    intentCategories,
    progress.intent.urgency,
  );
  const recommendation = recommendSession({
    urgency: progress.intent.urgency,
    primaryCategory: intentCategories[0]?.category,
    dimensionScores,
    hasProfile: true,
  });
  const budgetLevel = inferBudgetLevelFromIntent(progress?.motivation ?? progress?.intent ?? {});
  const primaryProduct = choosePrimaryProduct({ budget: budgetLevel, urgency: progress.intent.urgency });

  // Path flags not used directly in this view

  const pathTitle = s(
    `recommendationPath_${recommendation.recommendedPath}_title`,
    recommendation.recommendedPath === "individual"
      ? "Recomandare: ședințe individuale"
      : "Recomandare: grup OmniMental",
  );
  const pathBody = s(
    `recommendationPath_${recommendation.recommendedPath}_body`,
    recommendation.recommendedPath === "individual"
      ? "Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară."
      : "Ți se potrivește ritmul și suportul din programul de grup OmniMental.",
  );
  const reasonLabel = s(
    `recommendationReason_${recommendation.reasonKey}`,
    recommendation.reasonKey,
  );
  const badgeLabel =
    tier === "persona"
      ? s("recommendationMemberPersonaBadge", "Acces Persona")
      : s("recommendationMemberMemberBadge", "Membru activ");

  // Legacy CTA labels removed from this minimalist member view

  const quests = progress.quests?.items ?? [];
  const evaluationRows: { label: string; value: string }[] = [
    { label: "PSS", value: progress.evaluation.scores.pssTotal.toFixed(0) },
    { label: "GSE", value: progress.evaluation.scores.gseTotal.toFixed(0) },
    {
      label: "MAAS",
      value: progress.evaluation.scores.maasTotal.toFixed(1),
    },
    {
      label: "PANAS +",
      value: progress.evaluation.scores.panasPositive.toFixed(0),
    },
    {
      label: "PANAS -",
      value: progress.evaluation.scores.panasNegative.toFixed(0),
    },
    { label: "SVS", value: progress.evaluation.scores.svs.toFixed(1) },
  ];

  if (progress.evaluation.knowledge) {
    evaluationRows.push({
      label: "OC",
      value: `${progress.evaluation.knowledge.percent.toFixed(0)}%`,
    });
  }

  return (
    <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-8">
      {/* Recomandarea de top (path) */}
      <section className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
              {s("recommendationMemberTitle", "Recomandare curentă")}
            </p>
            <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">
              {profileName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {s("recommendationRefresh", "Resincronizează")}
            </button>
            <span className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink-soft)]">
              {badgeLabel}
            </span>
          </div>
        </header>
        <div className="space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4">
          <h3 className="text-lg font-semibold text-[var(--omni-ink)]">
            {pathTitle}
          </h3>
          <p className="text-sm text-[var(--omni-ink-soft)]">{pathBody}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {s("recommendationMemberReasonLabel", "Motiv principal")}:{" "}
            {reasonLabel}
          </p>
          <p className="text-xs text-[var(--omni-muted)]">
            {s("recommendationMemberStageLabel", "Etapă evaluare")}:{" "}
            {STAGE_LABELS[progress.evaluation.stageValue] ??
              progress.evaluation.stageValue}
          </p>
        </div>
        <FirstOfferPanel primaryProduct={primaryProduct} lang={lang} />
      </section>

      {/* Rezumat scoruri psihometrice */}
      <section className="omni-panel-soft rounded-3xl p-6 md:p-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
          {s("recommendationMemberSummaryHeading", "Rezumat scoruri")}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {evaluationRows.map((row) => (
            <div
              key={row.label}
              className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {row.label}
              </p>
              <p className="text-base font-semibold text-[var(--omni-ink)]">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quest-uri prioritare */}
      <section className="omni-panel-soft rounded-3xl p-6 md:p-7 space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
            {s("recommendationMemberQuestsTitle", "Quest-uri prioritare")}
          </p>
        </header>
        {quests.length ? (
          <div className="space-y-3">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="space-y-2 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{quest.title}</h3>
                  <span className="rounded-full border border-[var(--omni-border-soft)] px-2 py-[2px] text-[10px] uppercase tracking-[0.3em] text-[var(--omni-ink-soft)]">
                    {quest.type}
                  </span>
                </div>
                <p>{quest.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--omni-muted)]">
            {s(
              "recommendationMemberQuestsEmpty",
              "Quest-urile apar după evaluări complete.",
            )}
          </p>
        )}
      </section>
    </div>
  );

  // ------------------------------------------------------
  // Default export
  // ------------------------------------------------------
}

// ------------------------------------------------------
// Default export
// ------------------------------------------------------

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationContent />
    </Suspense>
  );
}
