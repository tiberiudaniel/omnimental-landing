"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ArenaId } from "@/config/arenaModules/v1/types";
import { ArenaHistorySparkline } from "@/components/arenas/ArenaHistorySparkline";
import { getArenaRuns } from "@/lib/arenaRunStore";

export default function ArenaHistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <ArenaHistoryClient />
    </Suspense>
  );
}

function ArenaHistoryClient() {
  const searchParams = useSearchParams();
  const arenaIdParam = searchParams.get("arenaId") as ArenaId | null;
  const moduleIdParam = searchParams.get("moduleId");
  const drillIdParam = searchParams.get("drillId");
  const runs = useMemo(() => {
    const filters = {
      arenaId: arenaIdParam ?? undefined,
      moduleId: moduleIdParam ?? undefined,
      drillId: drillIdParam ?? undefined,
    };
    return getArenaRuns(filters);
  }, [arenaIdParam, moduleIdParam, drillIdParam]);

  const chartRuns = useMemo(() => runs.slice().reverse(), [runs]);
  const latest = runs[0];

  const formatTs = (ts: number) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="min-h-screen bg-[#05060a] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-white/60">Istoric Arenă</p>
          <h1 className="text-3xl font-semibold">Run History</h1>
          <p className="text-sm text-white/70">
            {arenaIdParam ? `Arena: ${arenaIdParam}` : "Toate arenele"}
            {moduleIdParam ? ` · Modul: ${moduleIdParam}` : null}
            {drillIdParam ? ` · Drill: ${drillIdParam}` : null}
          </p>
        </div>
        {runs.length ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">Ultimul run</p>
                  <p className="text-2xl font-semibold">
                    {latest?.score != null ? `${Math.round(latest.score)} puncte` : "-"}
                  </p>
                  {latest ? (
                    <p className="text-sm text-white/60">{formatTs(latest.completedAt)}</p>
                  ) : null}
                </div>
                <ArenaHistorySparkline runs={chartRuns} width={320} height={90} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold mb-3">Run-uri recente</h2>
              <div className="space-y-3">
                {runs.slice(0, 25).map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{formatTs(run.completedAt)}</p>
                      <p className="text-xs text-white/60">
                        Durată: {run.duration} · Acuratețe:{" "}
                        {run.accuracy != null ? `${(run.accuracy * 100).toFixed(1)}%` : "-"} · Mean RT:{" "}
                        {run.meanRTms ? `${Math.round(run.meanRTms)} ms` : "-"}
                      </p>
                    </div>
                    <div className="text-xl font-bold">
                      {run.score != null ? Math.round(run.score) : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Nu există run-uri salvate pentru filtrul curent.
          </div>
        )}
        <div className="flex gap-3">
          <Link
            href="/arenas"
            className="rounded-full border border-white/40 text-white text-sm font-semibold px-5 py-2"
          >
            Înapoi la arene
          </Link>
        </div>
      </div>
    </main>
  );
}

function HistorySkeleton() {
  return (
    <main className="min-h-screen bg-[#05060a] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded" />
        <div className="h-10 w-64 bg-white/10 rounded" />
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    </main>
  );
}
