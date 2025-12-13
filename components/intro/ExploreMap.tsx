"use client";

import { useEffect, useRef } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { getExploreMapViewed, setExploreMapViewed } from "@/lib/intro/exploreState";

interface ExploreMapProps {
  onContinue?: () => void;
}

const AXES = [
  { id: "clarity", title: "Claritate", description: "Gânduri structurate, capacitate de prioritizare lucidă sub presiune." },
  { id: "energy", title: "Energie", description: "Reglajul micro-pauzelor și al atenției pentru stabilitate între task-uri." },
  { id: "adaptability", title: "Adaptabilitate", description: "Schimbarea rapidă a strategiilor și reframing strategic." },
  { id: "resilience", title: "Reziliență", description: "Protecție emoțională și cognitivă când contextul devine ostil." },
];

export function ExploreMap({ onContinue }: ExploreMapProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(getExploreMapViewed());

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          setExploreMapViewed();
          track("explore_map_viewed");
        }
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={cardRef}
      className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_25px_70px_rgba(0,0,0,0.08)] sm:px-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">
            Harta sistemului OmniMental
          </h2>
          <p className="text-sm leading-relaxed text-[var(--omni-ink)]/80 sm:text-base">
            Patru axe care se influențează reciproc. Observă cum Claritatea, Energia, Adaptabilitatea și Reziliența se conectează
            într-un singur sistem de reglaj.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {AXES.map((axis) => (
              <div key={axis.id} className="rounded-2xl border border-[var(--omni-border-soft)]/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{axis.title}</p>
                <p className="mt-2 text-sm text-[var(--omni-ink)]/85">{axis.description}</p>
              </div>
            ))}
          </div>
          <OmniCtaButton onClick={onContinue} className="w-full sm:w-auto" variant="primary">
            Continuă spre testare
          </OmniCtaButton>
        </div>
        <div className="mx-auto flex h-64 w-64 flex-none items-center justify-center rounded-full border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)]">
          <div className="relative h-48 w-48">
            {AXES.map((axis, index) => {
              const angle = (index / AXES.length) * Math.PI * 2;
              const radius = 90;
              const cx = radius * Math.cos(angle);
              const cy = radius * Math.sin(angle);
              return (
                <div
                  key={axis.id}
                  className="absolute flex h-10 w-10 items-center justify-center rounded-full border border-[var(--omni-border-strong)] bg-white text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)]"
                  style={{
                    left: `calc(50% + ${cx}px - 20px)`,
                    top: `calc(50% + ${cy}px - 20px)`,
                  }}
                >
                  {axis.title.slice(0, 1)}
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--omni-energy)] text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow-lg">
              <span className="inline-block translate-y-[18px]">OmniMental</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
