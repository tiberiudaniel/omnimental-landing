"use client";

import clsx from "clsx";
import type { DragEvent as ReactDragEvent } from "react";
import type { RouteDoc } from "@/lib/flowStudio/types";

export type RouteDragHandler = (event: ReactDragEvent<HTMLElement>, route: RouteDoc) => void;

type RoutesPanelProps = {
  routes: RouteDoc[];
  search: string;
  onSearchChange: (value: string) => void;
  groupFilter: string;
  groupOptions: string[];
  onGroupFilterChange: (value: string) => void;
  onQuickAddRoute: (route: RouteDoc, options?: { markAsStart?: boolean }) => void;
  hasActiveFlow: boolean;
  onRouteDragStart: RouteDragHandler;
};

export function RoutesPanel({
  routes,
  search,
  onSearchChange,
  groupFilter,
  groupOptions,
  onGroupFilterChange,
  onQuickAddRoute,
  hasActiveFlow,
  onRouteDragStart,
}: RoutesPanelProps) {
  const emptyState = hasActiveFlow
    ? "Trage cardul peste canvas sau folosește „+” (Shift = start)."
    : "Selectează un map pentru a activa biblioteca.";
  return (
    <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2">
            <span className="text-[12px] text-[var(--omni-muted)]">🔍</span>
            <input
              type="text"
              className="w-full text-sm outline-none"
              placeholder="Caută route sau tastează path"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <select
            className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
            value={groupFilter}
            onChange={(event) => onGroupFilterChange(event.target.value)}
          >
            <option value="all">Toate grupurile</option>
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-[var(--omni-muted)]">{emptyState}</p>
      </div>
      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
        {routes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white/60 px-4 py-6 text-center text-sm text-[var(--omni-muted)]">
            Niciun route sincronizat. Rulează `npm run gen:routes`.
          </div>
        ) : (
          routes.map((route) => (
            <article
              key={route.id}
              draggable={hasActiveFlow}
              onDragStart={(event) => onRouteDragStart(event, route)}
              className={clsx(
                "rounded-2xl border border-[var(--omni-border-soft)] bg-white px-4 py-3 transition hover:border-[var(--omni-ink)]",
                hasActiveFlow ? "cursor-grab" : "opacity-60",
              )}
              tabIndex={hasActiveFlow ? 0 : -1}
              onKeyDown={(event) => {
                if (!hasActiveFlow || event.key !== "Enter") return;
                event.preventDefault();
                onQuickAddRoute(route, { markAsStart: event.shiftKey });
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--omni-ink)]">{route.routePath}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--omni-muted)]">
                    <span className="rounded-full bg-[var(--omni-bg-main)] px-2 py-0.5 uppercase tracking-[0.3em]">{route.group}</span>
                    <span className="truncate">{route.filePath}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--omni-ink)]"
                    onClick={() => navigator.clipboard?.writeText(route.routePath)}
                    title="Copiază path"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      "rounded-full border px-2 py-1 text-xs font-semibold transition",
                      hasActiveFlow
                        ? "border-[var(--omni-ink)] text-[var(--omni-ink)]"
                        : "cursor-not-allowed border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
                    )}
                    onClick={() => onQuickAddRoute(route)}
                    disabled={!hasActiveFlow}
                    title="Adaugă în map"
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
