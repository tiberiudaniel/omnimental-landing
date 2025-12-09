"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import DailyPath from "@/components/daily/DailyPath";
import { getCatProfile } from "@/lib/firebase/cat";
import type { CatProfileDoc } from "@/types/cat";
import { deriveAdaptiveClusterFromCat } from "@/lib/dailyCluster";
import { getDailyPathForCluster } from "@/config/dailyPath";
import { getOnboardingStatus } from "@/lib/onboardingStatus";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { CAT_AXES, type CatAxisId } from "@/config/catEngine";
import type { AdaptiveCluster } from "@/types/dailyPath";

const ADAPTIVE_NUDGES: Record<AdaptiveCluster, string> = {
  clarity_cluster: "Alege azi un lucru important și exprimă-l în minte în 7 cuvinte.",
  emotional_flex_cluster: "Dacă apare tensiune, respiră 1 dată profund înainte de răspuns.",
  focus_energy_cluster: "Ia 2 minute fără telefon azi. Atât.",
};

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationContent />
    </Suspense>
  );
}

function RecommendationContent() {
  const router = useRouter();
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catProfile, setCatProfile] = useState<CatProfileDoc | null>(null);
  const [onboardingReady, setOnboardingReady] = useState(!user?.uid);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setHasCompletedOnboarding(false);
      setCatProfile(null);
      setOnboardingReady(true);
      return;
    }
    let cancelled = false;
    setOnboardingReady(false);
    (async () => {
      try {
        const [status, profileDoc] = await Promise.all([getOnboardingStatus(user.uid), getCatProfile(user.uid)]);
        if (cancelled) return;
        setCatProfile(profileDoc);
        setHasCompletedOnboarding(status.hasCompletedOnboarding);
        if (!status.hasCatProfile) {
          router.replace("/onboarding/cat-baseline");
          return;
        }
        if (!status.pillarsIntroCompleted) {
          router.replace("/onboarding/pillars");
          return;
        }
        if (!status.hasAdaptivePracticeSession) {
          router.replace("/onboarding/adaptive-practice");
          return;
        }
      } catch (error) {
        console.warn("Failed to load onboarding status", error);
      } finally {
        if (!cancelled) {
          setOnboardingReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, user?.uid]);

  const axisMeta = useMemo(() => {
    const map = new Map<CatAxisId, { label: string }>();
    for (const axis of CAT_AXES) {
      map.set(axis.id, { label: axis.label });
    }
    return map;
  }, []);

  const { cluster, primaryAxis } = useMemo(() => deriveAdaptiveClusterFromCat(catProfile), [catProfile]);
  const axisLabel = primaryAxis ? axisMeta.get(primaryAxis)?.label ?? null : null;
  const dailyPathConfig = useMemo(() => (cluster ? getDailyPathForCluster(cluster) : null), [cluster]);

  const showLoader = !onboardingReady;
  const showGuestBanner = Boolean(user?.isAnonymous);
  const missionText = cluster ? ADAPTIVE_NUDGES[cluster] : null;

  const header = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Frecommendation")}
    />
  );

  return (
    <>
      <AppShell header={header}>
        <div className="px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          {showLoader ? (
            <div className="rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              Calibrăm traseul tău adaptiv…
            </div>
          ) : hasCompletedOnboarding ? (
            <div className="space-y-6">
              <AdaptiveMissionCard axisLabel={axisLabel} nudge={missionText} />
              <DailyPath key={dailyPathConfig?.cluster ?? "none"} config={dailyPathConfig} />
              <ExploreCard onOpenKuno={() => router.push("/kuno")} onOpenAbil={() => router.push("/abil")} />
              {showGuestBanner ? (
                <GuestBanner onCreateAccount={() => router.push("/auth?returnTo=%2Frecommendation")} />
              ) : null}
            </div>
          ) : (
            <DailyLoopFallback />
          )}
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

function AdaptiveMissionCard({ axisLabel, nudge }: { axisLabel: string | null; nudge: string | null }) {
  return (
    <section className="space-y-3 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Misiunea adaptivă de azi</p>
      <h2 className="text-lg font-semibold text-[var(--omni-ink)]">{axisLabel ?? "Completează profilul OmniMental"}</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">
        {nudge ?? "Finalizează CAT Baseline și Adaptive Practice pentru a primi o misiune adaptată profilului tău."}
      </p>
    </section>
  );
}

function ExploreCard({ onOpenKuno, onOpenAbil }: { onOpenKuno: () => void; onOpenAbil: () => void }) {
  return (
    <section className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explorează liber</p>
      <p className="text-sm text-[var(--omni-ink)]/80">
        Ai chef de autonomie? Intră în biblioteca OmniKuno sau în hub-ul OmniAbil pentru a continua în ritmul tău.
      </p>
      <div className="flex flex-wrap gap-3">
        <OmniCtaButton size="sm" onClick={onOpenKuno}>
          Lecții OmniKuno
        </OmniCtaButton>
        <OmniCtaButton size="sm" variant="neutral" onClick={onOpenAbil}>
          Acțiuni OmniAbil
        </OmniCtaButton>
      </div>
    </section>
  );
}

function DailyLoopFallback() {
  return (
    <section className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Finalizează pașii OmniMental</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">
        Completează CAT Baseline, Pilonii OmniMental și Adaptive Practice pentru a primi path-ul zilnic adaptiv.
      </p>
      <div className="flex justify-center">
        <OmniCtaButton as="link" href="/experience-onboarding">
          Reia onboarding-ul
        </OmniCtaButton>
      </div>
    </section>
  );
}

function GuestBanner({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>Salvează-ți progresul pe toate dispozitivele – creează-ți cont OmniMental.</p>
        <OmniCtaButton size="sm" onClick={onCreateAccount}>
          Creează cont
        </OmniCtaButton>
      </div>
    </div>
  );
}
