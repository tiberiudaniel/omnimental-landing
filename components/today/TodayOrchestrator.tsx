"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { useCopy } from "@/lib/useCopy";
import { getScreenIdForRoute } from "@/lib/routeIds";

const TODAY_SCREEN_ID = getScreenIdForRoute("/today");
import { getTriedExtraToday, hasCompletedToday, readLastCompletion, type DailyCompletionRecord } from "@/lib/dailyCompletion";
import { getTraitLabel, type CatAxisId } from "@/lib/profileEngine";
import { type SessionPlan } from "@/lib/sessionRecommenderEngine";
import { saveTodayPlan } from "@/lib/todayPlanStorage";
import { getSensAiTodayPlan, hasFreeDailyLimit, type SensAiContext } from "@/lib/omniSensAI";
import { useProgressFacts } from "@/components/useProgressFacts";
import {
  canAccessOmniKuno,
  canAccessWizard,
  canInviteBuddy,
  getTotalActionsCompleted,
  getTotalDailySessionsCompleted,
  needsCatLitePart2,
  needsStyleProfile,
} from "@/lib/gatingSelectors";
import { CAT_LITE_EXTENDED_AXES } from "@/lib/catLite";
import { getAxisFromMindPacingSignal, isMindPacingSignalTag } from "@/lib/mindPacingSignals";
import { useUserAccessTier } from "@/components/useUserAccessTier";

export default function TodayOrchestrator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const { user, authReady } = useAuth();
  const { data: progressFacts, loading: progressFactsLoading } = useProgressFacts(user?.uid ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<DailyCompletionRecord | null>(null);
  const sourceParam = searchParams?.get("source");
  const mindpacingTagParam = searchParams?.get("mindpacingTag") ?? null;
  const forcedMindAxis = useMemo(() => {
    if (sourceParam !== "mindpacing_safe") return null;
    if (!isMindPacingSignalTag(mindpacingTagParam)) return null;
    return getAxisFromMindPacingSignal(mindpacingTagParam);
  }, [mindpacingTagParam, sourceParam]);
  const cameFromRunComplete = sourceParam === "run_complete";
  const cameFromGuided = sourceParam === "guided";
  const [triedExtraToday, setTriedExtraTodayState] = useState(false);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [sensAiCtx, setSensAiCtx] = useState<SensAiContext | null>(null);
  const [guidedGuestMode, setGuidedGuestMode] = useState(false);
  const totalDailySessionsCompleted = useMemo(() => getTotalDailySessionsCompleted(progressFacts), [progressFacts]);
  const totalActionsCompleted = useMemo(() => getTotalActionsCompleted(progressFacts), [progressFacts]);
  const wizardUnlocked = canAccessWizard(progressFacts);
  const omniKunoUnlocked = canAccessOmniKuno(progressFacts);
  const buddyUnlocked = canInviteBuddy(progressFacts);
  const needsStyle = needsStyleProfile(sensAiCtx?.profile ?? null, progressFacts);
  const catLitePart2Needed = useMemo(() => {
    if (progressFactsLoading) return false;
    if (!sensAiCtx?.profile) return false;
    return needsCatLitePart2(sensAiCtx.profile, progressFacts);
  }, [progressFactsLoading, sensAiCtx, progressFacts]);
  const missingExtendedAxisLabels = useMemo(() => {
    const profile = sensAiCtx?.profile ?? null;
    if (!profile?.catProfile) return [];
    const catProfile = profile.catProfile;
    return CAT_LITE_EXTENDED_AXES.filter((axis) => typeof catProfile.axes[axis]?.score !== "number").map((axis) =>
      getTraitLabel(axis),
    );
  }, [sensAiCtx]);
  const wizardUnlockRef = useRef(false);
  const omniKunoUnlockRef = useRef(false);
  const buddyUnlockRef = useRef(false);
  const { accessTier } = useUserAccessTier();

  useEffect(() => {
    if (wizardUnlocked && !wizardUnlockRef.current) {
      track("wizard_unlocked");
      wizardUnlockRef.current = true;
    }
  }, [wizardUnlocked]);

  useEffect(() => {
    if (omniKunoUnlocked && !omniKunoUnlockRef.current) {
      track("omni_kuno_unlocked");
      omniKunoUnlockRef.current = true;
    }
  }, [omniKunoUnlocked]);

  useEffect(() => {
    if (buddyUnlocked && !buddyUnlockRef.current) {
      track("buddy_unlocked");
      buddyUnlockRef.current = true;
    }
  }, [buddyUnlocked]);

  useEffect(() => {
    track("today_viewed");
    if (typeof window === "undefined") return;
    const guidedFlag = window.localStorage.getItem("guided_guest_mode") === "1";
    const startGuidedMode = guidedFlag || cameFromGuided;
    if (startGuidedMode) {
      setGuidedGuestMode(true);
      if (cameFromGuided) {
        window.localStorage.setItem("guided_guest_mode", "1");
      }
    }
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      const completed = hasCompletedToday();
      const last = readLastCompletion();
      const tried = getTriedExtraToday();
      setCompletedToday(completed);
      setLastCompletion(last);
      setTriedExtraTodayState(tried);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [cameFromGuided]);

  useEffect(() => {
    if (!guidedGuestMode) return;
    if (user || (totalDailySessionsCompleted ?? 0) > 0) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("guided_guest_mode");
      }
      setGuidedGuestMode(false);
    }
  }, [guidedGuestMode, totalDailySessionsCompleted, user]);

  useEffect(() => {
    if (!sourceParam) return;
    if (sourceParam === "run_complete" || sourceParam === "guided") {
      router.replace("/today");
    }
  }, [sourceParam, router]);

  const loadPlanFromSensAi = useCallback(
    async (userId: string, token: { cancelled: boolean }, forcedAxis?: CatAxisId | null) => {
      setPlanLoading(true);
      try {
        const result = await getSensAiTodayPlan(userId, forcedAxis ? { forcedAxis } : undefined);
        if (token.cancelled) return;
        setSensAiCtx(result.ctx);
        setSessionPlan(result.plan);
      } finally {
        if (!token.cancelled) setPlanLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!authReady || !user) return;
    const token = { cancelled: false };
    void loadPlanFromSensAi(user.uid, token, forcedMindAxis);
    return () => {
      token.cancelled = true;
    };
  }, [authReady, user, loadPlanFromSensAi, forcedMindAxis]);

  useEffect(() => {
    if (!sessionPlan) return;
    saveTodayPlan({
      arcId: sessionPlan.arcId,
      arcDayIndex: sessionPlan.arcDayIndex,
      arcLengthDays: sessionPlan.arcLengthDays,
      moduleId: sessionPlan.moduleId,
      traitPrimary: sessionPlan.traitPrimary,
      traitSecondary: sessionPlan.traitSecondary,
      canonDomain: sessionPlan.canonDomain,
    });
  }, [sessionPlan]);

  const lastSessionLabel = useMemo(() => {
    if (!lastCompletion) return "—";
    const completedAt = new Date(lastCompletion.completedAt);
    const todayKey = new Date().toDateString();
    if (completedAt.toDateString() === todayKey) {
      return "Azi";
    }
    try {
      return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" }).format(completedAt);
    } catch {
      return completedAt.toLocaleDateString();
    }
  }, [lastCompletion]);

  const handleStart = () => {
    track("today_primary_clicked", { completedToday });
    if (guidedGuestMode && typeof window !== "undefined") {
      window.localStorage.removeItem("guided_guest_mode");
      setGuidedGuestMode(false);
    }
    router.push("/today/run");
  };

  const header = (
    <SiteHeader
      showMenu={accessTier.flags.showMenu}
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")}
    />
  );

  useEffect(() => {
    if (!accessTier.flags.showMenu && menuOpen) {
      setMenuOpen(false);
    }
  }, [accessTier.flags.showMenu, menuOpen]);

  const isPremiumSubscriber = sensAiCtx?.profile.subscription.status === "premium";
  const freeLimitReached = hasFreeDailyLimit(sensAiCtx);

  const defaultHeroTitle = sessionPlan?.title ?? "Antrenamentul de azi";
  const defaultHeroSubtitle = sessionPlan?.summary ?? "Traseu adaptiv calibrat pe profilul tău mental.";
  const recommendedLabel = sessionPlan?.expectedDurationMinutes
    ? `Sesiunea zilnică recomandată (${sessionPlan.expectedDurationMinutes} min)`
    : "Sesiunea zilnică recomandată";
  const defaultPrimaryCta = freeLimitReached
    ? "Disponibil în Premium"
    : completedToday
    ? "Completat azi"
    : recommendedLabel;
  const defaultSecondaryCta = "Sesiune intensivă (în curând)";
  const todayCopy = useCopy(TODAY_SCREEN_ID, "ro", {
    h1: defaultHeroTitle,
    subtitle: defaultHeroSubtitle,
    ctaPrimary: defaultPrimaryCta,
    ctaSecondary: defaultSecondaryCta,
  });
  const heroTitle = todayCopy.h1 ?? defaultHeroTitle;
  const heroSubtitle = todayCopy.subtitle ?? defaultHeroSubtitle;
  const primaryCtaLabel = todayCopy.ctaPrimary ?? defaultPrimaryCta;
  const secondaryCtaLabel = todayCopy.ctaSecondary ?? defaultSecondaryCta;

  if (!sessionPlan) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-center text-[var(--omni-ink)]">
        Se încarcă sesiunea recomandată...
      </div>
    );
  }

  const activeArcDayIndex =
    sensAiCtx?.profile.activeArcId && sensAiCtx.profile.activeArcId === sessionPlan.arcId
      ? sensAiCtx.profile.activeArcDayIndex ?? null
      : null;
  const arcDayNumber = sessionPlan.arcId
    ? (() => {
        const profileDay = typeof activeArcDayIndex === "number" ? activeArcDayIndex + 1 : null;
        const fallbackDay = typeof sessionPlan.arcDayIndex === "number" ? sessionPlan.arcDayIndex + 1 : null;
        const rawDay = profileDay ?? fallbackDay;
        if (rawDay == null) return null;
        if (sessionPlan.arcLengthDays) {
          return Math.min(rawDay, sessionPlan.arcLengthDays);
        }
        return rawDay;
      })()
    : null;
  const arcProgressLabel = sessionPlan.arcId
    ? `Ziua ${arcDayNumber ?? "—"}${sessionPlan.arcLengthDays ? ` din ${sessionPlan.arcLengthDays}` : ""} în ${sessionPlan.title}`
    : "Primul tău antrenament de claritate";
  const xpForTrait = sensAiCtx?.profile.xpByTrait?.[sessionPlan.traitPrimary] ?? 0;

  const handleUpgrade = () => router.push("/upgrade");

  const shellHeader = guidedGuestMode ? null : header;

  return (
    <>
      <AppShell header={shellHeader}>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">Astăzi</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{heroTitle}</h1>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{heroSubtitle}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {arcProgressLabel}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <OmniCtaButton
                  className="justify-center sm:min-w-[220px]"
                  onClick={freeLimitReached ? handleUpgrade : handleStart}
                  disabled={completedToday || planLoading || freeLimitReached}
                >
                  {primaryCtaLabel}
                </OmniCtaButton>
                {!guidedGuestMode ? (
                  <button
                    type="button"
                    className={`rounded-[12px] border px-4 py-2 text-sm font-semibold ${isPremiumSubscriber ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]" : "border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]"}`}
                    onClick={() => {
                      if (!isPremiumSubscriber) handleUpgrade();
                    }}
                    disabled={!isPremiumSubscriber}
                  >
                    {secondaryCtaLabel}
                  </button>
                ) : null}
              </div>
              <div className="mt-5 rounded-[18px] border border-[var(--omni-border-soft)] bg-white/70 px-4 py-4 text-sm text-[var(--omni-ink)]">
                <p className="font-semibold">Focus: {getTraitLabel(sessionPlan.traitPrimary)}</p>
                <p className="mt-1 text-[var(--omni-ink)]/80">
                  {`Consolidezi ${getTraitLabel(sessionPlan.traitPrimary)} și susții ${
                    sessionPlan.traitSecondary.length
                      ? getTraitLabel(sessionPlan.traitSecondary[0])
                      : "energia funcțională"
                  }.`}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--omni-energy)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
                  {`${getTraitLabel(sessionPlan.traitPrimary)}: ${xpForTrait} XP`}
                </div>
                {!guidedGuestMode ? (
                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-energy)]"
                      onClick={() => router.push("/os")}
                    >
                      Vezi harta mentală →
                    </button>
                  </div>
                ) : null}
              </div>
              {freeLimitReached ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Ai făcut deja sesiunea zilnică azi. Dacă vrei să lucrezi mai mult în fiecare zi, activează OmniMental Premium.
                </div>
              ) : cameFromRunComplete ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Sesiunea de azi este completă. Ne vedem mâine.
                </div>
              ) : null}
            </section>

            {!guidedGuestMode ? (
              <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-5 text-sm text-[var(--omni-ink)]/85 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Ultima sesiune</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">{lastSessionLabel}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Zile consecutive</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">—</p>
                </div>
              </section>
            ) : null}
        {catLitePart2Needed ? (
          <CatLitePart2Card
            missingTraits={missingExtendedAxisLabels}
            onContinue={() => {
              track("cat_lite_part2_card_clicked");
              router.push("/onboarding/cat-lite-2");
            }}
          />
        ) : null}

        {needsStyle ? (
          <StyleProfileCard
            totalDailySessions={totalDailySessionsCompleted}
            onConfigure={() => {
              track("style_profile_cta_clicked");
              router.push("/onboarding/style");
            }}
          />
        ) : null}

        <GatingUnlockCards
          wizardUnlocked={wizardUnlocked}
          omniKunoUnlocked={omniKunoUnlocked}
          buddyUnlocked={buddyUnlocked}
          stats={{ totalDailySessions: totalDailySessionsCompleted, totalActions: totalActionsCompleted }}
          onWizard={() => router.push("/wizard")}
          onOmniKuno={() => router.push("/kuno/learn")}
          onBuddy={() => {
            track("buddy_invite_clicked");
            router.push("/intro?buddy=1");
          }}
        />

            {!isPremiumSubscriber && (completedToday || triedExtraToday || freeLimitReached) ? (
              <section className="rounded-[24px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-[var(--omni-ink)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Upgrade</p>
                <h2 className="mt-2 text-2xl font-semibold">Vrei încă o sesiune azi?</h2>
                <ul className="mt-4 space-y-2 text-sm text-[var(--omni-ink)]/85">
                  <li>• +1 sesiune azi</li>
                  <li>• Istoric complet</li>
                  <li>• Recomandări adaptative</li>
                </ul>
                <OmniCtaButton
                  as="link"
                  href="/upgrade"
                  className="mt-4 w-full justify-center sm:w-auto"
                >
                  Activează OmniMental
                </OmniCtaButton>
              </section>
            ) : null}
          </div>
        </div>
      </AppShell>
      {!guidedGuestMode ? <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} /> : null}
    </>
  );
}

type StyleProfileCardProps = {
  totalDailySessions: number;
  onConfigure: () => void;
};

type CatLitePart2CardProps = {
  missingTraits: string[];
  onContinue: () => void;
};

function CatLitePart2Card({ missingTraits, onContinue }: CatLitePart2CardProps) {
  const missingText = missingTraits.length ? missingTraits.join(", ") : "încă 3 trăsături";
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/85 px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Profil mental</p>
      <h3 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Continuă-ți profilul CAT</h3>
      <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
        Ai răspuns la primele 4 trăsături de bază. Mai lipsesc {missingText}. Îți ia 3-4 minute să finalizezi mini-profilul complet.
      </p>
      <OmniCtaButton className="mt-4 w-full justify-center sm:w-auto" onClick={onContinue}>
        Completează restul profilului
      </OmniCtaButton>
    </section>
  );
}

function StyleProfileCard({ totalDailySessions, onConfigure }: StyleProfileCardProps) {
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/85 px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Personalizare</p>
      <h3 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Adaptează exercițiile la stilul tău</h3>
      <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
        Ai deja {totalDailySessions} sesiuni reale. Completează un chestionar de 2 minute ca să calibrăm modul de livrare.
      </p>
      <OmniCtaButton className="mt-4 w-full justify-center sm:w-auto" onClick={onConfigure}>
        Configurează stilul
      </OmniCtaButton>
    </section>
  );
}

type GatingCardStats = {
  totalDailySessions: number;
  totalActions: number;
};

type GatingUnlockCardsProps = {
  wizardUnlocked: boolean;
  omniKunoUnlocked: boolean;
  buddyUnlocked: boolean;
  stats: GatingCardStats;
  onWizard: () => void;
  onOmniKuno: () => void;
  onBuddy: () => void;
};

function GatingUnlockCards({
  wizardUnlocked,
  omniKunoUnlocked,
  buddyUnlocked,
  stats,
  onWizard,
  onOmniKuno,
  onBuddy,
}: GatingUnlockCardsProps) {
  if (!wizardUnlocked && !omniKunoUnlocked && !buddyUnlocked) {
    return null;
  }
  const cards: Array<{ key: string; title: string; body: string; action: string; onClick: () => void }> = [];
  if (wizardUnlocked) {
    cards.push({
      key: "wizard",
      title: "Configuratorul Wizard e deblocat",
      body: "Ai deja peste 31 de sesiuni reale. Poți configura direcțiile și scenariile de antrenament avansat.",
      action: "Deschide Wizard",
      onClick: onWizard,
    });
  }
  if (omniKunoUnlocked) {
    cards.push({
      key: "omnikuno",
      title: "OmniKuno e deschis",
      body: "Ai depășit pragul minim pentru școala de execuție. Intră în lecțiile OmniKuno pentru antrenament intensiv.",
      action: "Intră în OmniKuno",
      onClick: onOmniKuno,
    });
  }
  if (buddyUnlocked) {
    cards.push({
      key: "buddy",
      title: "Poți invita un Buddy",
      body: `Ai ${stats.totalDailySessions} sesiuni zilnice și ${stats.totalActions} acțiuni confirmate. Invită un buddy și oferi acces la o mini-experiență gratuită.`,
      action: "Invită un buddy",
      onClick: onBuddy,
    });
  }
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/80 px-6 py-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Deblocări</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-[20px] border border-[var(--omni-border-soft)] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
          >
            <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{card.title}</h3>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{card.body}</p>
            <OmniCtaButton variant="primary" onClick={card.onClick} className="mt-3 justify-center">
              {card.action}
            </OmniCtaButton>
          </article>
        ))}
      </div>
    </section>
  );
}
