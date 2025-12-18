"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { getUserProfileSnapshot, type CatAxisState, type CatAxisId } from "@/lib/profileEngine";
import type { ArcConfig } from "@/config/arcs";
import { getTempleByDomain } from "@/config/temples";
import { getActiveArc } from "@/lib/arcEngine";

const TRAIT_NAMES: Record<CatAxisId, string> = {
  clarity: "Claritate cognitivă",
  focus: "Focus și continuitate",
  recalibration: "Recalibrare după greșeli",
  energy: "Energie și recuperare",
  flexibility: "Flexibilitate mentală",
  adaptiveConfidence: "Încredere adaptativă",
  emotionalStability: "Stabilitate emoțională",
};

export default function OnboardingFirstTemple() {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [traits, setTraits] = useState<Array<{ id: CatAxisId; state: CatAxisState }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeArc, setActiveArc] = useState<ArcConfig | null>(null);
  const [templeLabel, setTempleLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !user) return;
    let cancelled = false;
    const loadSnapshot = async () => {
      setLoading(true);
      try {
        const snapshot = await getUserProfileSnapshot(user.uid);
        if (cancelled || !snapshot) return;
        if (snapshot.catProfile) {
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

  const message = useMemo(() => {
    if (loading) return "Se calculează...";
    if (!activeArc) {
      return "Ai activat primul Templu și începem cu un arc de claritate. Vei vedea aici progresul când avem mai multe sesiuni.";
    }
    const label = templeLabel ?? "Templul activ";
    return `${label} — ${activeArc.description}`;
  }, [activeArc, templeLabel, loading]);

  if (!authReady) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--omni-ink-soft)]">
        Pregătim harta ta cognitivă...
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-[var(--omni-ink)]">Creează un cont ca să vezi progresul în Temples.</p>
        <OmniCtaButton onClick={() => router.push("/auth?returnTo=%2Fonboarding")} variant="primary">
          Creează cont
        </OmniCtaButton>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pasul 4 din 4</p>
        <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Templul activat</h2>
        <p className="text-sm text-[var(--omni-ink-soft)]">Primele măsurători sunt salvate. Acesta este templul tău principal acum.</p>
      </header>

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
        <OmniCtaButton variant="primary" onClick={() => router.replace("/today")}>
          Mergi la /today
        </OmniCtaButton>
        <OmniCtaButton variant="neutral" onClick={() => router.replace("/antrenament")}>
          Vezi alte trasee
        </OmniCtaButton>
      </div>
    </section>
  );
}
