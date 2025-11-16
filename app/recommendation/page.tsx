"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import AccountModal from "../../components/AccountModal";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { useI18n } from "../../components/I18nProvider";
import { useTStrings } from "../../components/useTStrings";
import { useProfile } from "../../components/ProfileProvider";
import { useProgressFacts } from "../../components/useProgressFacts";
import { computeDimensionScores, type IntentCategorySummary } from "@/lib/scoring";
import { recommendSession } from "@/lib/recommendation";
import { readRecommendationCache } from "@/lib/recommendationCache";
import { recordCtaClicked } from "@/lib/progressFacts";
import DemoUserSwitcher from "../../components/DemoUserSwitcher";
import ExperienceStep from "@/components/ExperienceStep";

const STAGE_LABELS: Record<string, string> = {
  t0: "Start (0 săpt.)",
  t1: "3 săpt.",
  t2: "6 săpt.",
  t3: "9 săpt.",
  t4: "12 săpt.",
};

// use s() for translation keys; local guards for non-i18n values where needed

function RecommendationContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useI18n();
  const { s } = useTStrings();
  const { profile } = useProfile();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Gate tweak: do not auto-redirect to /choose. Instead, show a clear banner with a CTA.
  const showChooseBanner = useMemo(
    () => Boolean(profile?.id && (profile.selection ?? 'none') === 'none'),
    [profile?.id, profile?.selection],
  );

  const tier = profile?.accessTier ?? "public";
  const { data: progress, loading, error } = useProgressFacts(profile?.id);

  const pageTitle = s("recommendationPageTitle", "Recomandarea mea pentru tine");
  const pageSubtitle = s(
    "recommendationPageSubtitle",
    "Folosim datele completate până acum pentru a-ți da direcția cu cele mai multe șanse.",
  );

  const showPublicView = tier === "public";

  return (
    <div className="bg-[#FDFCF9] min-h-screen">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => setAccountModalOpen(true)} />
      {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? <DemoUserSwitcher /> : null}
      {search?.get("demo") ? (
        <div className="mx-auto mt-3 w-full max-w-4xl px-4">
          <span className="inline-flex items-center rounded-full bg-[#7A6455] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">{s("badgeDemo", "Demo")}</span>
        </div>
      ) : null}
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      <main className="px-4 py-12 md:px-8" data-testid="recommendation-step">
        {showChooseBanner ? (
          <div className="mx-auto mb-4 w-full max-w-4xl rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === 'ro'
                  ? 'Pentru a vedea recomandarea completă, alege modul în care vrei să continui (individual sau grup).'
                  : 'To view your full recommendation, choose how you want to continue (individual or group).'}
              </p>
              <button
                type="button"
                onClick={() => {
                  const url = new URL(window.location.origin + '/choose');
                  url.searchParams.set('from', 'reco');
                  router.push(url.pathname + url.search);
                }}
                className="shrink-0 rounded-[10px] border border-[#2C2C2C] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === 'ro' ? 'Alege formatul' : 'Choose format'}
              </button>
            </div>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-4xl flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">OmniMental</p>
          <h1 className="text-3xl font-semibold text-[#2C1F18]">{pageTitle}</h1>
          <p className="text-sm text-[#4A3A30]">{pageSubtitle}</p>
          <div className="mt-2 flex justify-center">
            <a
              href="/experience-onboarding?flow=initiation&step=intro"
              className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              data-testid="reco-initiation-cta"
            >
              {lang === 'ro' ? 'Vreau să testez OmniMental' : 'I want to try OmniMental'}
            </a>
          </div>
        </div>
        {showPublicView ? (
          <PublicOrCachedView lang={lang} />
        ) : (
          <MemberRecommendationView
            profileName={profile?.name ?? "Membru OmniMental"}
            progress={progress}
            loading={loading}
            error={error}
            tier={tier}
          />
        )}
        {/* Gentle onboarding continuation: simulated experience selection */}
        {!showPublicView && profile?.id ? (
          <ExperienceStep userId={profile.id} onContinue={() => router.push("/progress")} />
        ) : null}
      </main>
    </div>
  );
}

function PublicRecommendationView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  const title = s("recommendationPublicTitle", "Vrei o direcție personalizată?");
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

type MemberViewProps = {
  profileName: string;
  progress: ReturnType<typeof useProgressFacts>["data"];
  loading: boolean;
  error: Error | null;
  tier: string;
};

function MemberRecommendationView({ profileName, progress, loading, error, tier }: MemberViewProps) {
  const router = useRouter();
  const { s } = useTStrings();
  if (loading) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 text-center text-sm text-[#4A3A30] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s("recommendationLoading", "Se încarcă recomandarea ta personalizată…")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[#F4C7C3] bg-[#FFF5F4] px-6 py-6 text-center text-sm text-[#8C2B2F] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s("recommendationLoadError", "Nu am putut încărca recomandarea. Încearcă din nou.")}
      </div>
    );
  }
  if (!progress?.intent || !progress?.evaluation) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-8 text-center text-sm text-[#4A3A30] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {s("recommendationMemberFallback", "Finalizează o evaluare completă pentru a primi recomandări dedicate.")}
      </div>
    );
  }

  const intentCategories = progress.intent.categories as IntentCategorySummary[];
  const dimensionScores = computeDimensionScores(intentCategories, progress.intent.urgency);
  const recommendation = recommendSession({
    urgency: progress.intent.urgency,
    primaryCategory: intentCategories[0]?.category,
    dimensionScores,
    hasProfile: true,
  });
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
  const reasonLabel = s(`recommendationReason_${recommendation.reasonKey}`, recommendation.reasonKey);
  const badgeLabel =
    tier === "persona"
      ? s("recommendationMemberPersonaBadge", "Acces Persona")
      : s("recommendationMemberMemberBadge", "Membru activ");

  const personaCtaLabel = s("recommendationPersonaCta", "Deschide planul Persona");
  const personaCtaBody = s("recommendationPersonaCtaBody", "Primești modulul următor, sesiunea live și check-in dedicat.");
  const memberCtaLabel = s("recommendationMemberCta", "Programează un call");
  const memberCtaBody = s("recommendationMemberCtaBody", "Stabilim următorii pași în 20 de minute.");
  const quests = progress.quests?.items ?? [];
  const evaluationRows = [
    { label: "PSS", value: progress.evaluation.scores.pssTotal.toFixed(0) },
    { label: "GSE", value: progress.evaluation.scores.gseTotal.toFixed(0) },
    { label: "MAAS", value: progress.evaluation.scores.maasTotal.toFixed(1) },
    { label: "PANAS +", value: progress.evaluation.scores.panasPositive.toFixed(0) },
    { label: "PANAS -", value: progress.evaluation.scores.panasNegative.toFixed(0) },
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
      <section className="space-y-4 rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
              {s("recommendationMemberTitle", "Recomandare curentă")}
            </p>
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">{profileName}</h2>
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
          <h3 className="text-lg font-semibold text-[#1F1F1F]">{pathTitle}</h3>
          <p className="text-sm text-[#4A3A30]">{pathBody}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
            {s("recommendationMemberReasonLabel", "Motiv principal")}: {reasonLabel}
          </p>
          <p className="text-xs text-[#A08F82]">
            {s("recommendationMemberStageLabel", "Etapă evaluare")}: {STAGE_LABELS[progress.evaluation.stageValue] ?? progress.evaluation.stageValue}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{memberCtaBody}</p>
            <Link
              href="/contact"
              onClick={() => { void recordCtaClicked("book_call"); }}
              className="mt-2 inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              {memberCtaLabel}
            </Link>
          </div>
          <div className="rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{personaCtaBody}</p>
            <Link
              href="/group"
              className="mt-2 inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              {personaCtaLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">{s("recommendationMemberSummaryHeading", "Rezumat scoruri")}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {evaluationRows.map((row) => (
            <div key={row.label} className="rounded-[10px] border border-[#F5EBE0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]">
              <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{row.label}</p>
              <p className="text-base font-semibold text-[#1F1F1F]">{row.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
            {s("recommendationMemberQuestsTitle", "Quest-uri prioritare")}
          </p>
        </header>
        {quests.length ? (
          <div className="space-y-3">
            {quests.map((quest) => (
              <div key={quest.id} className="space-y-2 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]">
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
          <p className="text-sm text-[#A08F82]">{s("recommendationMemberQuestsEmpty", "Quest-urile apar după evaluări complete.")}</p>
        )}
      </section>
    </div>
  );
}

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationContent />
    </Suspense>
  );
}
function PublicOrCachedView({ lang }: { lang: string }) {
  const { s } = useTStrings();
  // Read once via lazy initializer; safe‑guard for SSR
  const [cached] = useState<ReturnType<typeof readRecommendationCache>>(() =>
    typeof window === 'undefined' ? null : readRecommendationCache(),
  );
  if (!cached) {
    return <PublicRecommendationView lang={lang} />;
  }
  const title = s("recommendationCachedTitle", "Recomandarea ta salvată");
  const label = cached.recommendation.path === "individual" ? (lang === "ro" ? "Ședințe individuale" : "Individual sessions") : (lang === "ro" ? "Grup OmniMental" : "OmniMental group");
  const reason = s(`recommendationReason_${cached.recommendation.reasonKey}`, cached.recommendation.reasonKey);
  const selectionNote = cached.selectedPath
    ? (cached.selectedPath === "individual"
        ? (lang === "ro" ? "Ai ales sesiuni individuale." : "You chose individual sessions.")
        : (lang === "ro" ? "Ai ales programul de grup." : "You chose the group program."))
    : null;
  return (
    <section className="mx-auto mt-10 max-w-3xl space-y-4 rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[#1F1F1F]">{title}</h2>
      <p className="text-sm text-[#4A3A30]">{lang === "ro" ? "Bazată pe ultimele selecții făcute în aplicație." : "Based on your latest selections in the app."}</p>
      <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[#C07963]">{lang === "ro" ? "Recomandare" : "Recommendation"}</p>
        <h3 className="text-lg font-semibold text-[#1F1F1F]">{label}</h3>
        <p className="text-sm text-[#5C4F45]">{reason}</p>
        {selectionNote ? <p className="text-xs text-[#7A6455]">{selectionNote}</p> : null}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Link href={cached.selectedPath === "group" ? "/group-info" : "/sessions/individual"} className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white">{lang === "ro" ? "Vezi opțiunile" : "See options"}</Link>
        <Link href="/" className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white">{lang === "ro" ? "Refă clarificarea" : "Refine again"}</Link>
      </div>
    </section>
  );
}
