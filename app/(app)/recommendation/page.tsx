"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import RequireAuth from "@/components/auth/RequireAuth";
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
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [arrowY, setArrowY] = useState<number | null>(null);
  const redirectToAuth = () => router.push("/auth");

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
  const basePathRec: OmniRecommendation | null = useMemo(() => {
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
      // Fallback: public/cached suggestion
      if (typeof window !== 'undefined') {
        const cached = readRecommendationCache();
        if (cached) {
          const isGroup = cached.recommendation.path !== 'individual';
          const label = isGroup ? (lang === 'ro' ? 'Grup OmniMental' : 'OmniMental group') : (lang === 'ro' ? 'Ședințe individuale' : 'Individual sessions');
          const title = (lang === 'ro' ? 'Recomandare inițială: ' : 'Initial recommendation: ') + label;
          return {
            id: 'base-path',
            userId: profile?.id ?? 'demo',
            title,
            shortLabel: label,
            type: 'onboarding',
            status: 'done',
            createdAt: '2000-01-01T00:00:00.000Z',
            priority: 3,
            body: isGroup
              ? (lang === 'ro' ? 'Ți se potrivește ritmul și suportul din programul de grup OmniMental.' : 'Group program seems a good fit.')
              : (lang === 'ro' ? 'Lucrăm 1-la-1 pentru a avansa pe tema ta prioritară.' : '1-on-1 sessions fit your situation.'),
            ctaLabel: isGroup ? (lang === 'ro' ? 'Deschide programul de grup' : 'Open group program') : (lang === 'ro' ? 'Programează un call' : 'Book a call'),
            ctaHref: isGroup ? '/group' : '/contact',
            source: 'system',
            sourceRef: 'path-recommendation',
          } as OmniRecommendation;
        }
      }
    } catch {}
    return null;
  }, [isPublicTier, progress, profile, lang, s]);

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

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={redirectToAuth}
      />
      {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? (
        <DemoUserSwitcher />
      ) : null}
      {search?.get("demo") ? (
        <div className="mx-auto mt-3 w-full max-w-4xl px-4">
          <span className="inline-flex items-center rounded-full bg-[#7A6455] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
            {s("badgeDemo", "Demo")}
          </span>
        </div>
      ) : null}
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
      />

      <main className="px-4 py-12 md:px-8" data-testid="recommendation-step">
        {showChooseBanner ? (
          <div className="mx-auto mb-4 w-full max-w-4xl rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === "ro"
                  ? "Pentru a vedea recomandarea completă, alege modul în care vrei să continui (individual sau grup)."
                  : "To view your full recommendation, choose how you want to continue (individual or group)."}
              </p>
              <button
                type="button"
                onClick={() => {
                  const url = new URL(window.location.origin + "/choose");
                  url.searchParams.set("from", "reco");
                  router.push(url.pathname + url.search);
                }}
                className="shrink-0 rounded-[10px] border border-[#2C2C2C] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === "ro" ? "Alege formatul" : "Choose format"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Hero + CTA */}
        <div className="mx-auto flex max-w-4xl flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
            OmniMental
          </p>
          <h1 className="text-3xl font-semibold text-[#2C1F18]">
            {pageTitle}
          </h1>
          <p className="text-sm text-[#4A3A30]">{pageSubtitle}</p>
          <div className="mt-1 flex justify-center">
            <Link
              href="/experience-onboarding?flow=initiation&step=omnikuno-test"
              className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              data-testid="reco-initiation-cta"
            >
              {lang === 'ro' ? 'Vreau să testez OmniMental' : 'I want to try OmniMental'}
            </Link>
          </div>
        </div>

        {/* Stack + detail: istoric recomandări + ultima recomandare activă (mutat imediat după hero) */}
        {hasStack ? (
          <section
            className="mx-auto mt-8 w-full max-w-5xl rounded-[16px] border border-[#E4D8CE] bg-white/90 px-6 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.05)] md:px-10 md:py-7"
            data-testid="debug-stack-section"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#2C2C2C]">
                {lang === "ro" ? "Recomandari" : "Your recommendations"}
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
                counts={{
                  all: withBase.length,
                  new: withBase.filter((r) => r.status === "new").length,
                  active: withBase.filter((r) => r.status === "active").length,
                  done: withBase.filter((r) => r.status === "done").length,
                  today: withBase.filter((r) => (r.createdAt || "").startsWith(new Date().toISOString().slice(0, 10))).length,
                }}
              />
            </div>

            <div className="grid items-stretch gap-6 md:grid-cols-[minmax(0,0.42fr)_auto_minmax(0,0.58fr)]">
              {/* STÂNGA: stiva de carduri */}
              <div className="pl-5 pr-5 pt-3 md:pt-4 border-b border-[#F0E6DA] md:border-b-0 md:border-l md:border-r">
                {recLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 w-full rounded-2xl bg-[#F6F2EE]" />
                    <div className="h-10 w-11/12 rounded-2xl bg-[#F6F2EE]" />
                    <div className="h-10 w-10/12 rounded-2xl bg-[#F6F2EE]" />
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

              {/* MIJLOC: săgeată între panouri (doar desktop) */}
              <div className="relative hidden md:block text-[11px] text-[#A08F82]">
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{ top: typeof arrowY === 'number' ? arrowY : 0 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg key={`arrow-${arrowY ?? 0}`} width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={'animate-pulse'}>
                      <path d="M1 6H19" stroke="#A08F82" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M13 1L19 6L13 11" stroke="#A08F82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* DREAPTA: panou de detalii */}
              <div className="pt-4 md:pt-0 md:pl-5">
                {recLoading ? (
                  <div className="space-y-3">
                    <div className="h-6 w-32 bg-[#F6F2EE]" />
                    <div className="h-5 w-56 bg-[#F6F2EE]" />
                    <div className="h-20 w-full bg-[#F6F2EE]" />
                    <div className="h-10 w-32 bg-[#F6F2EE]" />
                  </div>
                ) : (
                  <RecommendationDetailPanel item={activeRec} />
                )}
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
      </main>
    </div>
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
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[#1F1F1F]">{title}</h2>
      <p className="text-sm text-[#4A3A30]">{body}</p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/antrenament"
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
        >
          {ctaLabel}
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
          {lang === "ro" ? "Necesită autentificare" : "Requires sign in"}
        </p>
      </div>
    </section>
  );
}

function PublicOrCachedView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  const [cached] = useState<ReturnType<typeof readRecommendationCache> | null>(() => {
    try {
      return readRecommendationCache() ?? null;
    } catch {
      return null;
    }
  });

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
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[#1F1F1F]">{title}</h2>
      <p className="text-sm text-[#4A3A30]">
        {lang === "ro"
          ? "Bazată pe ultimele selecții făcute în aplicație."
          : "Based on your latest selections in the app."}
      </p>
      <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[#C07963]">
          {lang === "ro" ? "Recomandare" : "Recommendation"}
        </p>
        <h3 className="text-lg font-semibold text-[#1F1F1F]">{label}</h3>
        <p className="text-sm text-[#5C4F45]">{reason}</p>
        {selectionNote ? (
          <p className="text-xs text-[#7A6455]">{selectionNote}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Link
          href={
            cached.selectedPath === "group" ? "/group" : "/experience-onboarding"
          }
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
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
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 text-center text-sm text-[#4A3A30] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationLoading",
          "Se încarcă recomandarea ta personalizată…",
        )}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[#F4C7C3] bg-[#FFF5F4] px-6 py-6 text-center text-sm text-[#8C2B2F] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s(
          "recommendationLoadError",
          "Nu am putut încărca recomandarea. Încearcă din nou.",
        )}
      </div>
    );
  }
  if (!progress?.intent || !progress?.evaluation) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-8 text-center text-sm text-[#4A3A30] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
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
      <section className="space-y-4 rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
              {s("recommendationMemberTitle", "Recomandare curentă")}
            </p>
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">
              {profileName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
            >
              {s("recommendationRefresh", "Resincronizează")}
            </button>
            <span className="rounded-full border border-[#D8C6B6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5C4F45]">
              {badgeLabel}
            </span>
          </div>
        </header>
        <div className="space-y-3 rounded-[16px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-4">
          <h3 className="text-lg font-semibold text-[#1F1F1F]">
            {pathTitle}
          </h3>
          <p className="text-sm text-[#4A3A30]">{pathBody}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
            {s("recommendationMemberReasonLabel", "Motiv principal")}:{" "}
            {reasonLabel}
          </p>
          <p className="text-xs text-[#A08F82]">
            {s("recommendationMemberStageLabel", "Etapă evaluare")}:{" "}
            {STAGE_LABELS[progress.evaluation.stageValue] ??
              progress.evaluation.stageValue}
          </p>
        </div>
        <FirstOfferPanel primaryProduct={primaryProduct} lang={lang} />
      </section>

      {/* Rezumat scoruri psihometrice */}
      <section className="space-y-3 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
          {s("recommendationMemberSummaryHeading", "Rezumat scoruri")}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {evaluationRows.map((row) => (
            <div
              key={row.label}
              className="rounded-[10px] border border-[#F5EBE0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
                {row.label}
              </p>
              <p className="text-base font-semibold text-[#1F1F1F]">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quest-uri prioritare */}
      <section className="space-y-3 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
            {s("recommendationMemberQuestsTitle", "Quest-uri prioritare")}
          </p>
        </header>
        {quests.length ? (
          <div className="space-y-3">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="space-y-2 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{quest.title}</h3>
                  <span className="rounded-full border border-[#D8C6B6] px-2 py-[2px] text-[10px] uppercase tracking-[0.3em] text-[#5C4F45]">
                    {quest.type}
                  </span>
                </div>
                <p>{quest.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#A08F82]">
            {s(
              "recommendationMemberQuestsEmpty",
              "Quest-urile apar după evaluări complete.",
            )}
          </p>
        )}
      </section>
    </div>
  );
}

// ------------------------------------------------------
// Default export
// ------------------------------------------------------

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RequireAuth redirectTo="/recommendation">
        <RecommendationContent />
      </RequireAuth>
    </Suspense>
  );
}
