"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { AppShell } from "@/components/AppShell";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import { PrimaryButton, SecondaryButton } from "@/components/PrimaryButton";
import { MissionResourcesView } from "@/components/mission-map/MissionResourcesView";
import { MissionMentalProgressView } from "@/components/mission-map/MissionMentalProgressView";
import { useMissionPerspective, type MissionSummary } from "@/lib/hooks/useMissionPerspective";

type ViewType = "resources" | "mental";

function MissionMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = useProfile();
  const activeMission = useMemo(
    () => (profile as { activeMission?: MissionSummary | null } | null)?.activeMission ?? null,
    [profile],
  );
  const requestedMissionId = searchParams?.get("missionId") ?? undefined;
  const initialView: ViewType = searchParams?.get("view") === "mental" ? "mental" : "resources";
  const [view, setView] = useState<ViewType>(initialView);
  const missionId = requestedMissionId ?? activeMission?.id;
  const { mission, resources, mental } = useMissionPerspective({
    missionId: missionId ?? undefined,
    mission: activeMission ?? undefined,
  });

  const header = (
    <SiteHeader
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Fmission-map")}
    />
  );

  const heroTitle = "Harta mea";
  const heroSubtitle = mission
    ? `Pentru misiunea „${mission.title}” ne uităm mai întâi la resursele tale interne, apoi la felul în care ai lucrat mental la această schimbare.`
    : "Ca să vezi harta completă ai nevoie de o misiune activă. Când selectezi una din onboarding sau din dashboard, vei găsi aici cele două perspective esențiale.";

  const content = mission ? (
    <div className="space-y-8">
      <section className="omni-card rounded-3xl p-6 md:p-7 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          OmniMental · Perspectiva misiunii
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">{heroTitle}</h1>
        <p className="mt-3 text-sm text-[var(--omni-ink-soft)]">{heroSubtitle}</p>
        <p className="mt-2 text-xs text-[var(--omni-muted)]">
          Valorile de mai jos sunt orientative. Ele nu te definesc, ci te ajută să vezi unde să investești atenție în perioada
          următoare.
        </p>
      </section>

      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-1 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
          <ToggleButton active={view === "resources"} label="Resurse interne" onClick={() => setView("resources")} />
          <ToggleButton active={view === "mental"} label="Progres mental" onClick={() => setView("mental")} />
        </div>
      </div>

      {view === "resources" ? (
        <MissionResourcesView missionTitle={mission.title} resources={resources} onSwitchView={() => setView("mental")} />
      ) : (
        <MissionMentalProgressView
          missionTitle={mission.title}
          mental={mental}
          onNextStep={() => router.push("/omni-kuno")}
        />
      )}
    </div>
  ) : (
    <div className="space-y-6">
      <section className="omni-card rounded-3xl p-6 md:p-7 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          OmniMental · Perspectiva misiunii
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">{heroTitle}</h1>
        <p className="mt-3 text-sm text-[var(--omni-ink-soft)]">{heroSubtitle}</p>
      </section>
      <section className="omni-panel-soft rounded-3xl border border-dashed border-[var(--omni-border-soft)] p-6 text-center text-[var(--omni-ink-soft)]">
        <p className="text-lg font-semibold text-[var(--omni-ink)]">Nu ai încă o misiune activă</p>
        <p className="mt-2 text-sm">
          Alege o misiune prioritară din onboarding sau din dashboard și revino aici pentru a vedea resursele și progresul mental.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <PrimaryButton onClick={() => router.push("/experience-onboarding?flow=initiation&step=welcome")} className="w-full justify-center sm:w-auto">
            Deschide onboarding-ul
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/progress")} className="w-full justify-center sm:w-auto">
            Înapoi la dashboard
          </SecondaryButton>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <AppShell header={header}>
        <div className="mx-auto w-full max-w-5xl px-0 py-2">{content}</div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] transition ${
        active
          ? "bg-[var(--omni-energy)] text-[var(--omni-ink-on-accent)] shadow-[0_10px_26px_rgba(88,32,21,0.22)]"
          : "text-[var(--omni-muted)] hover:text-[var(--omni-ink)]"
      }`}
    >
      {label}
    </button>
  );
}

function MissionMapPageInner() {
  return (
    <RequireAuth redirectTo="/mission-map">
      <MissionMapContent />
    </RequireAuth>
  );
}

export default function MissionMapPage() {
  return (
    <Suspense fallback={null}>
      <MissionMapPageInner />
    </Suspense>
  );
}
