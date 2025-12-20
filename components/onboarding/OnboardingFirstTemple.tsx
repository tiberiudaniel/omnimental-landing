"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { getUserProfileSnapshot, type CatAxisState, type CatAxisId, type CatProfile } from "@/lib/profileEngine";
import type { ArcConfig } from "@/config/arcs";
import { getTempleByDomain } from "@/config/temples";
import { getActiveArc } from "@/lib/arcEngine";
import OnboardingProgressBar, { type OnboardingProgressMeta } from "@/components/onboarding/OnboardingProgressBar";
import { track } from "@/lib/telemetry/track";
import CatRadarChart from "@/components/cat/CatRadarChart";
import type { CatAxisId as RadarAxisId } from "@/config/catEngine";
import { CAT_LITE_EXTENDED_AXES } from "@/lib/catLite";
import { getTraitLabel } from "@/lib/profileEngine";

const TRAIT_NAMES: Record<CatAxisId, string> = {
  clarity: "Claritate cognitivă",
  focus: "Focus și continuitate",
  recalibration: "Recalibrare după greșeli",
  energy: "Energie și recuperare",
  flexibility: "Flexibilitate mentală",
  adaptiveConfidence: "Încredere adaptativă",
  emotionalStability: "Stabilitate emoțională",
};

type Props = {
  progress: OnboardingProgressMeta;
};

const RADAR_AXES: Array<{ profileAxis: CatAxisId; radarAxis: RadarAxisId; label: string }> = [
  { profileAxis: "clarity", radarAxis: "clarity", label: "Claritate" },
  { profileAxis: "focus", radarAxis: "focus", label: "Focus și continuitate" },
  { profileAxis: "recalibration", radarAxis: "recalib", label: "Recalibrare" },
  { profileAxis: "energy", radarAxis: "energy", label: "Energie" },
  { profileAxis: "flexibility", radarAxis: "flex", label: "Flexibilitate" },
  { profileAxis: "adaptiveConfidence", radarAxis: "adapt_conf", label: "Încredere adaptativă" },
  { profileAxis: "emotionalStability", radarAxis: "emo_stab", label: "Stabilitate emoțională" },
];

export default function OnboardingFirstTemple({ progress }: Props) {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [traits, setTraits] = useState<Array<{ id: CatAxisId; state: CatAxisState }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeArc, setActiveArc] = useState<ArcConfig | null>(null);
  const [templeLabel, setTempleLabel] = useState<string | null>(null);
  const [catProfile, setCatProfile] = useState<CatProfile | null>(null);

  useEffect(() => {
    if (!authReady || !user) return;
    let cancelled = false;
    const loadSnapshot = async () => {
      setLoading(true);
      try {
        const snapshot = await getUserProfileSnapshot(user.uid);
        if (cancelled || !snapshot) return;
        if (snapshot.catProfile) {
          setCatProfile(snapshot.catProfile);
          const entries = Object.entries(snapshot.catProfile.axes)
            .filter(([, value]) => typeof value.score === "number")
            .map(([id, state]) => ({ id: id as CatAxisId, state }))
            .sort((a, b) => (b.state.score ?? 0) - (a.state.score ?? 0));
          if (!cancelled) {
            setTraits(entries.slice(0, 3));
          }
        }
        const arc = getActiveArc(snapshot);
        if (!cancelled) {
          setActiveArc(arc);
          if (arc) {
            const temple = getTempleByDomain(arc.canonDomain);
            setTempleLabel(temple?.label ?? null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSnapshot().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (!authReady || !user || loading || viewTrackedRef.current) return;
    const coverage =
      catProfile == null ? "none" : CAT_LITE_EXTENDED_AXES.some((axis) => typeof catProfile.axes[axis]?.score !== "number") ? "partial" : "full";
    const topTraits =
      traits.length > 0
        ? traits.map((trait) => ({ id: trait.id, score: trait.state.score ?? null }))
        : activeArc
        ? [activeArc.traitPrimary, ...activeArc.traitSecondary].map((trait) => ({ id: trait, score: null }))
        : [];
    track("first_temple_viewed", {
      templeId: activeArc?.id ?? null,
      topTraits,
      catCoverage: coverage,
    });
    viewTrackedRef.current = true;
  }, [authReady, user, loading, traits, activeArc, catProfile]);

  const message = useMemo(() => {
    if (loading) return "Se calculează...";
    if (!activeArc) {
      return "Ai activat primul Templu și începem cu un arc de claritate. Vei vedea aici progresul când avem mai multe sesiuni.";
    }
    const label = templeLabel ?? "Templul activ";
    return `${label} — ${activeArc.description}`;
  }, [activeArc, templeLabel, loading]);

  const missingExtendedAxes = useMemo(() => {
    if (!catProfile) return CAT_LITE_EXTENDED_AXES;
    return CAT_LITE_EXTENDED_AXES.filter((axis) => typeof catProfile.axes[axis]?.score !== "number");
  }, [catProfile]);

  const radarData = useMemo(() => {
    if (!catProfile) return [];
    return RADAR_AXES.map((axis) => {
      const score = catProfile.axes[axis.profileAxis]?.score ?? 0;
      return {
        id: axis.radarAxis,
        label: axis.label,
        value: Math.max(0, Math.min(10, score)) * 10,
      };
    });
  }, [catProfile]);

  const coverageNote = useMemo(() => {
    if (!catProfile) {
      return "Nu avem încă toate măsurătorile. După primele sesiuni zilnice completăm harta CAT.";
    }
    if (missingExtendedAxes.length > 0) {
      const labels = missingExtendedAxes.map((axis) => getTraitLabel(axis)).join(", ");
      return `Ai completat prima parte (4 trăsături de bază). Mai evaluăm ${labels} după câteva sesiuni.`;
    }
    return "Harta de auto-percepție pe toate cele 7 trăsături este completă. Pe măsură ce rulezi antrenamente reale, aceste valori devin tot mai precise.";
  }, [catProfile, missingExtendedAxes]);

  if (!authReady) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--omni-ink-soft)]">
        Pregătim harta ta cognitivă...
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <OnboardingProgressBar {...progress} />
      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Templul activat</h2>
        <p className="text-sm text-[var(--omni-ink-soft)]">Primele măsurători sunt salvate. Acesta este templul tău principal acum.</p>
      </header>

      <section className="rounded-[20px] border border-[var(--omni-border-soft)] bg-white/90 px-5 py-6 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <CatRadarChart data={radarData} />
          </div>
          <div className="flex-1 space-y-3 text-sm text-[var(--omni-ink)]/85">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Profil CAT</p>
            <p>{coverageNote}</p>
            {missingExtendedAxes.length > 0 ? (
              <p className="text-[13px] text-[var(--omni-ink-soft)]">
                Lipsesc încă:{" "}
                <span className="font-medium text-[var(--omni-ink)]">
                  {missingExtendedAxes.map((axis) => getTraitLabel(axis)).join(", ")}
                </span>
                .
              </p>
            ) : (
              <p className="text-[13px] text-[var(--omni-ink-soft)]">
                Poți trece oricând prin /onboarding/cat-lite-2 dacă vrei să-ți ajustezi self-percepția.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-5 text-sm text-[var(--omni-ink)]/90">
        {loading ? "Se calculează..." : message}
      </div>

      {traits.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {traits.map(({ id, state }) => (
            <article key={id} className="rounded-[16px] border border-[var(--omni-border-soft)] bg-white/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{state.canonDomain}</p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">{TRAIT_NAMES[id]}</h3>
              <p className="mt-1 text-[13px] text-[var(--omni-ink-soft)]">Nivel estimat: {state.score ?? "—"} / 10</p>
            </article>
          ))}
        </div>
      ) : activeArc ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[activeArc.traitPrimary, ...activeArc.traitSecondary].map((trait) => (
            <article key={trait} className="rounded-[16px] border border-[var(--omni-border-soft)] bg-white/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Arc</p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">{TRAIT_NAMES[trait]}</h3>
              <p className="mt-1 text-[13px] text-[var(--omni-ink-soft)]">Rol: {trait === activeArc.traitPrimary ? "Primar" : "Suport"}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <OmniCtaButton
          variant="primary"
          onClick={() => {
            track("first_temple_cta_today_clicked");
            router.replace("/today");
          }}
        >
          Încep programul ghidat
        </OmniCtaButton>
        <OmniCtaButton
          variant="neutral"
          onClick={() => {
            track("first_temple_cta_arenas_clicked");
            router.replace("/arenas");
          }}
        >
          Explorez exerciții intensive
        </OmniCtaButton>
      </div>
    </section>
  );
}
