"use client";

import ProgressStageCard from "./ProgressStageCard";

export type StageCardConfig = {
  title: string;
  subtitle: string;
  percent: number;
  status: "complete" | "inProgress" | "stale";
  ctaLabel: string;
  onAction: () => void;
  locked?: boolean;
  lockHint?: string;
};

export default function ProgressStagesSection({ stages }: { stages: StageCardConfig[] }) {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
      {stages.map((s, idx) => (
        <ProgressStageCard key={`${s.title}-${idx}`} title={s.title} subtitle={s.subtitle} percent={s.percent} status={s.status} ctaLabel={s.ctaLabel} onAction={s.onAction} locked={s.locked} lockHint={s.lockHint} />
      ))}
    </div>
  );
}
