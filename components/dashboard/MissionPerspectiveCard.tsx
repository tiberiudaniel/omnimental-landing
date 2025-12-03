"use client";

import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import type { MissionSummary } from "@/lib/hooks/useMissionPerspective";

type MissionPerspectiveCardProps = {
  mission: MissionSummary | null;
};

export function MissionPerspectiveCard({ mission }: MissionPerspectiveCardProps) {
  const router = useRouter();

  if (!mission) return null;

  return (
    <div className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-5 text-[var(--omni-ink)] shadow-[0_15px_32px_rgba(0,0,0,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Harta misiunii</p>
      <h3 className="mt-2 text-lg font-semibold text-[var(--omni-ink)]">Harta misiunii tale</h3>
      <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">
        Vezi dintr-o privire cum stai cu resursele interne și cu progresul mental pentru{" "}
        <span className="font-semibold">{mission.title || "misiunea ta principală"}</span>.
      </p>
      <PrimaryButton
        className="mt-5 text-xs font-semibold uppercase tracking-[0.25em]"
        onClick={() => {
          const href = mission?.id ? `/mission-map?missionId=${encodeURIComponent(mission.id)}` : "/mission-map";
          router.push(href);
        }}
      >
        Deschide harta
      </PrimaryButton>
    </div>
  );
}
