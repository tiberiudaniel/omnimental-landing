"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useLastNavReason } from "@/lib/debug/runtimeDebug";

type RuntimeDebugContext = {
  worldId?: string | null;
  todayPlanVersion?: string | null;
  runId?: string | null;
  blockIndex?: number | null;
  activeBlockKind?: string | null;
  activeLessonId?: string | null;
  moduleId?: string | null;
  extras?: Record<string, unknown>;
};

type RuntimeDebugPanelProps = {
  context?: RuntimeDebugContext | null;
  forceEnabled?: boolean;
};

const PANEL_CLASS =
  "fixed bottom-4 right-4 z-50 w-[320px] rounded-2xl border border-[var(--omni-border-soft)] bg-white/95 p-3 text-xs text-[var(--omni-ink)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]";

export function RuntimeDebugPanel({ context = null, forceEnabled = true }: RuntimeDebugPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navReason = useLastNavReason();
  const queryParams = useMemo(() => {
    if (!searchParams) return {};
    const entries = Array.from(searchParams.entries());
    return entries.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }, [searchParams]);
  const debugFlag = (searchParams?.get("debug") ?? "").toLowerCase() === "1";
  const e2eFlag = (searchParams?.get("e2e") ?? "").toLowerCase() === "1";
  const enabled = forceEnabled && (debugFlag || e2eFlag);
  const snapshot = useMemo(
    () => ({
      route: pathname,
      params: queryParams,
      worldId: context?.worldId ?? null,
      todayPlanVersion: context?.todayPlanVersion ?? null,
      runId: context?.runId ?? null,
      blockIndex: context?.blockIndex ?? null,
      activeBlockKind: context?.activeBlockKind ?? null,
      activeLessonId: context?.activeLessonId ?? null,
      moduleId: context?.moduleId ?? null,
      extras: context?.extras ?? null,
      lastReasonCode: navReason?.code ?? null,
      lastReasonDetails: navReason?.details ?? null,
      lastReasonAt: navReason?.timestamp ?? null,
      timestamp: new Date().toISOString(),
    }),
    [context, navReason, pathname, queryParams],
  );
  if (!enabled) return null;
  const readableParams = Object.keys(queryParams).length ? queryParams : { "-": "none" };
  return (
    <div className={PANEL_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Debug snapshot</p>
        <button
          type="button"
          className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em]"
          onClick={() => {
            void navigator.clipboard?.writeText(JSON.stringify(snapshot, null, 2));
          }}
        >
          Copy
        </button>
      </div>
      <div className="mt-2 space-y-1">
        <p>
          <span className="font-semibold">Route:</span> {pathname}
        </p>
        <div>
          <p className="font-semibold">Params:</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(readableParams).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 font-mono text-[10px]"
              >
                {key}={value}
              </span>
            ))}
          </div>
        </div>
        {context?.worldId ? (
          <p>
            <span className="font-semibold">World:</span> {context.worldId}
          </p>
        ) : null}
        {context?.todayPlanVersion ? (
          <p>
            <span className="font-semibold">Plan version:</span> {context.todayPlanVersion}
          </p>
        ) : null}
        {context?.runId ? (
          <p>
            <span className="font-semibold">Run:</span> {context.runId} (block {context.blockIndex ?? "?"})
          </p>
        ) : null}
        {context?.activeBlockKind ? (
          <p>
            <span className="font-semibold">Block:</span> {context.activeBlockKind} · {context.activeLessonId ?? "—"}
          </p>
        ) : null}
        {context?.moduleId ? (
          <p>
            <span className="font-semibold">Module:</span> {context.moduleId}
          </p>
        ) : null}
        {context?.extras ? (
          <p className="font-mono text-[11px] text-[var(--omni-muted)]">{JSON.stringify(context.extras)}</p>
        ) : null}
        <div
          className={clsx(
            "mt-2 rounded-xl px-3 py-2 text-[11px]",
            navReason ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-[var(--omni-muted)]",
          )}
        >
          <p className="font-semibold uppercase tracking-[0.3em] text-[10px]">Last redirect</p>
          {navReason ? (
            <>
              <p className="font-semibold">{navReason.code}</p>
              {navReason.details ? (
                <pre className="mt-1 whitespace-pre-wrap break-words text-[10px]">
                  {JSON.stringify(navReason.details)}
                </pre>
              ) : null}
            </>
          ) : (
            <p className="text-[10px]">None recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
