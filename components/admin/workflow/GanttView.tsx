"use client";

import type { WorkflowTask } from "@/lib/workflow/types";
import { useMemo } from "react";

type Props = {
  tasks: WorkflowTask[];
  criticalPath: Set<string>;
  scheduleConflicts: Set<string>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const GanttView = ({ tasks, criticalPath, scheduleConflicts }: Props) => {
  const timeline = useMemo(() => {
    if (!tasks.length) {
      return { base: Date.now(), span: DAY_MS, rows: [] as Array<{ task: WorkflowTask; offset: number; width: number }> };
    }
    const starts = tasks.map((task) => Date.parse(task.start));
    const ends = tasks.map((task) => Date.parse(task.start) + Math.max(1, task.durationDays) * DAY_MS);
    const base = Math.min(...starts);
    const span = Math.max(1, Math.max(...ends) - base);
    const rows = tasks.map((task) => {
      const offset = Date.parse(task.start) - base;
      const width = Math.max(1, task.durationDays) * DAY_MS;
      return { task, offset, width };
    });
    return { base, span, rows };
  }, [tasks]);

  return (
    <div className="rounded-3xl border border-[var(--workflow-border,#2C1A14)] bg-[var(--workflow-surface,#1a100d)] p-4">
      <div className="mb-3 flex items-center justify-between text-[var(--workflow-ink,#F5E8D8)]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em]">Timeline</h2>
        <div
          data-testid="critical-path-legend"
          className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[var(--workflow-muted,#cbb89f)]"
        >
          <span className="h-2 w-6 rounded-full bg-amber-400" /> Critical path
        </div>
      </div>
      <div data-testid="gantt-root" className="space-y-3 text-[var(--workflow-ink,#F5E8D8)]">
        {timeline.rows.length === 0 ? (
          <p className="text-sm text-[var(--workflow-muted,#cbb89f)]">No tasks scheduled.</p>
        ) : (
          timeline.rows.map(({ task, offset, width }) => {
            const left = `${(offset / timeline.span) * 100}%`;
            const barWidth = `${(width / timeline.span) * 100}%`;
            const critical = criticalPath.has(task.id);
            const conflict = scheduleConflicts.has(task.id);
            return (
              <div key={task.id} className="rounded-2xl border border-[var(--workflow-border,#2C1A14)] bg-[var(--workflow-surface-deep,#1D1411)] p-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">{task.title}</p>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[var(--workflow-muted,#cbb89f)]">
                    <span>{task.start}</span>
                    <span>{task.durationDays}d</span>
                    {conflict ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-200">Schedule conflict</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 h-3 rounded-full bg-white/5">
                  <div
                    className={`h-3 rounded-full ${critical ? "bg-[var(--workflow-accent,#F2613F)]" : "bg-white/40"}`}
                    style={{ marginLeft: left, width: barWidth }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GanttView;
