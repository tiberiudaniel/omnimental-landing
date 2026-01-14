"use client";

import type { WorkflowEdge, WorkflowStatus, WorkflowTask } from "@/lib/workflow/types";
import { memo, useMemo } from "react";

type Props = {
  tasks: WorkflowTask[];
  incoming: Record<string, WorkflowEdge[]>;
  counts: Record<WorkflowStatus, number>;
  onStatusChange: (taskId: string, status: WorkflowStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  selectedTaskId: string | null;
};

const COLUMN_META: Array<{ label: string; status: WorkflowStatus; testId: string; countId: string }> = [
  { label: "To Do", status: "todo", testId: "kanban-col-todo", countId: "kanban-count-todo" },
  { label: "In Progress", status: "in_progress", testId: "kanban-col-in_progress", countId: "kanban-count-in_progress" },
  { label: "Done", status: "done", testId: "kanban-col-done", countId: "kanban-count-done" },
];

const priorityLabel = (priority: number) => {
  if (priority === 1) return "High";
  if (priority === 3) return "Low";
  return "Medium";
};

const KanbanBoard = memo(function KanbanBoard({
  tasks,
  incoming,
  counts,
  onStatusChange,
  onDeleteTask,
  onSelectTask,
  selectedTaskId,
}: Props) {
  const grouped = useMemo(() => {
    const map: Record<WorkflowStatus, WorkflowTask[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) {
      map[task.status].push(task);
    }
    const sorter = (a: WorkflowTask, b: WorkflowTask) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.start !== b.start) return a.start.localeCompare(b.start);
      return a.createdAt - b.createdAt;
    };
    map.todo.sort(sorter);
    map.in_progress.sort(sorter);
    map.done.sort(sorter);
    return map;
  }, [tasks]);

  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const handleDragStart = (event: React.DragEvent, taskId: string) => {
    event.dataTransfer.setData("text/task-id", taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event: React.DragEvent, status: WorkflowStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  const blockedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const task of tasks) {
      const prereqs = incoming[task.id] ?? [];
      map[task.id] = prereqs.some((edge) => {
        const prerequisite = tasksById.get(edge.from);
        return !prerequisite || prerequisite.status !== "done";
      });
    }
    return map;
  }, [incoming, tasks, tasksById]);

  return (
    <div className="rounded-3xl border border-[var(--workflow-border,#2C1A14)] bg-[var(--workflow-surface,#141010)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMN_META.map((column) => (
          <div
            key={column.status}
            data-testid={column.testId}
            className="rounded-2xl border border-[var(--workflow-border,#2C1A14)] bg-[var(--workflow-surface-deep,#1D1411)] p-2"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.status)}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--workflow-muted,#cbb89f)]">{column.label}</h3>
              <span data-testid={column.countId} className="rounded-full bg-[var(--workflow-accent,#F2613F)]/20 px-2 py-0.5 text-[11px] text-[var(--workflow-ink,#F5E8D8)]">
                {counts[column.status]}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[column.status].map((task) => (
                <article
                  draggable
                  key={task.id}
                  data-testid={`task-card-${task.id}`}
                  onDragStart={(event) => handleDragStart(event, task.id)}
                  onClick={() => onSelectTask(task.id)}
                  className={`rounded-lg border border-[var(--workflow-border,#2C1A14)] bg-black/25 p-2 text-xs text-[var(--workflow-ink,#F5E8D8)] transition hover:border-[var(--workflow-accent,#F2613F)]/60 ${
                    selectedTaskId === task.id ? "ring-2 ring-[var(--workflow-accent)]/70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      data-testid={`open-task-${task.id}`}
                      onClick={() => onSelectTask(task.id)}
                      className="text-left text-sm font-semibold leading-tight"
                    >
                      <span data-testid={`task-title-${task.id}`}>{task.title || "Untitled"}</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-task-${task.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="text-[10px] uppercase tracking-[0.25em] text-[var(--workflow-muted,#cbb89f)] transition hover:text-[var(--workflow-accent,#F2613F)]"
                    >
                      Delete
                    </button>
                  </div>
                  {task.description ? (
                    <p
                      className="mt-1 truncate text-[12px] font-light text-[var(--workflow-muted,#cbb89f)]"
                      style={{ fontFamily: "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif" }}
                      title={task.description}
                    >
                      {task.description}
                    </p>
                  ) : null}
                  {blockedMap[task.id] ? (
                    <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[var(--workflow-accent,#F2613F)]">Blocked</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap justify-end gap-1 text-[9px] uppercase tracking-[0.25em] text-[var(--workflow-muted,#cbb89f)]">
                    <span className="rounded-full border border-[var(--workflow-border,#2C1A14)] px-1.5 py-0.5 text-[var(--workflow-muted,#cbb89f)]">
                      {priorityLabel(task.priority)}
                    </span>
                    <span className="rounded-full border border-[var(--workflow-border,#2C1A14)] px-1.5 py-0.5 text-[var(--workflow-muted,#cbb89f)]">
                      {task.durationDays}d
                    </span>
                    <span className="rounded-full border border-[var(--workflow-border,#2C1A14)] px-1.5 py-0.5 text-[var(--workflow-muted,#cbb89f)]">
                      {task.start}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default KanbanBoard;
