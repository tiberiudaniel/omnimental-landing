"use client";

import clsx from "clsx";
import type { DragEvent as ReactDragEvent } from "react";
import type { RouteDoc } from "@/lib/flowStudio/types";

export type RouteDragHandler = (event: ReactDragEvent<HTMLTableRowElement>, route: RouteDoc) => void;

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
  onCollapse: () => void;
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
  onCollapse,
}: RoutesPanelProps) {
  return (
    <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            className="flex-1 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
            placeholder="Caută route..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <div className="flex items-center gap-2">
            <select
              className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
              value={groupFilter}
              onChange={(event) => onGroupFilterChange(event.target.value)}
            >
              <option value="all">Toate</option>
              {groupOptions.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-2 py-1 text-xs font-semibold text-[var(--omni-muted)] transition hover:text-[var(--omni-ink)]"
              onClick={onCollapse}
              title="Ascunde panoul Routes"
            >
              <span aria-hidden className="text-base leading-none">⟵</span>
              <span className="sr-only">Ascunde Routes</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--omni-muted)]">
          {hasActiveFlow
            ? "Trage rândul peste canvas sau folosește butonul + (Shift+Click pentru a marca punctul de start)."
            : "Selectează un flow pentru a activa drag & drop."}
        </p>
      </div>
      <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-[var(--omni-border-soft)]">
        {routes.length === 0 ? (
          <p className="p-4 text-sm text-[var(--omni-muted)]">Nu există rute sincronizate.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)]/50 text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Group</th>
                <th className="px-4 py-2">File</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr
                  key={route.id}
                  className={clsx(
                    "border-b border-[var(--omni-border-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--omni-border-strong)]",
                    hasActiveFlow ? "cursor-pointer" : "",
                  )}
                  draggable={hasActiveFlow}
                  onDragStart={(event) => onRouteDragStart(event, route)}
                  tabIndex={hasActiveFlow ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!hasActiveFlow || event.key !== "Enter") return;
                    if (event.currentTarget !== event.target) return;
                    event.preventDefault();
                    onQuickAddRoute(route, { markAsStart: event.shiftKey });
                  }}
                >
                  <td className="px-4 py-2 font-semibold">
                    <div className="flex items-center gap-2">
                      <a
                        href={route.routePath}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate select-text text-[var(--omni-ink)] underline decoration-dotted underline-offset-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {route.routePath}
                      </a>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--omni-ink)]"
                        onClick={(event) => {
                          event.stopPropagation();
                          void navigator.clipboard?.writeText(route.routePath);
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{route.group}</td>
                  <td className="px-4 py-2 text-xs text-[var(--omni-muted)]">{route.filePath}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border px-2 py-1 text-xs font-semibold transition",
                        hasActiveFlow
                          ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]"
                          : "cursor-not-allowed border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
                      )}
                      disabled={!hasActiveFlow}
                      onClick={(event) => {
                        event.stopPropagation();
                        onQuickAddRoute(route, { markAsStart: event.shiftKey });
                      }}
                      title="Adaugă rapid (Shift+Click pentru start)"
                      aria-label="Adaugă rapid (Shift+Click pentru start)"
                    >
                      <span className="text-lg leading-none">+</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
