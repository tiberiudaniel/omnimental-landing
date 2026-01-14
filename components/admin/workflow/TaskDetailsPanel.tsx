"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkflowEdge, WorkflowTask } from "@/lib/workflow/types";

type Props = {
  task: WorkflowTask | null;
  tasks: WorkflowTask[];
  incoming: Record<string, WorkflowEdge[]>;
  outgoing: Record<string, WorkflowEdge[]>;
  onAddDependency: (fromId: string, toId: string) => void;
  onRemoveDependency: (edgeId: string) => void;
  onUpdateTask: (task: WorkflowTask) => void;
  dependencyError: string | null;
  onClearError: () => void;
};

const TaskDetailsPanel = ({
  task,
  tasks,
  incoming,
  outgoing,
  onAddDependency,
  onRemoveDependency,
  onUpdateTask,
  dependencyError,
  onClearError,
}: Props) => {
  const [selectedPrereq, setSelectedPrereq] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WorkflowTask | null>(null);

  const tasksById = useMemo(() => new Map(tasks.map((item) => [item.id, item])), [tasks]);

  useEffect(() => {
    if (!task) return;
    let timeout: number | null = null;
    const schedule = () => {
      setDraft(task);
      setEditing(false);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(schedule);
    } else {
      timeout = window.setTimeout(schedule, 0);
    }
    return () => {
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
    };
  }, [task]);

  const prereqItems = useMemo(() => {
    if (!task) return [];
    return (incoming[task.id] ?? [])
      .map((edge) => ({ edge, node: tasksById.get(edge.from) }))
      .filter(
        (entry): entry is { edge: WorkflowEdge; node: WorkflowTask } =>
          Boolean(entry.node),
      );
  }, [incoming, task, tasksById]);

  const dependentItems = useMemo(() => {
    if (!task) return [];
    return (outgoing[task.id] ?? [])
      .map((edge) => ({ edge, node: tasksById.get(edge.to) }))
      .filter(
        (entry): entry is { edge: WorkflowEdge; node: WorkflowTask } =>
          Boolean(entry.node),
      );
  }, [outgoing, task, tasksById]);

  const availablePrereqs = useMemo(() => {
    if (!task) return [];
    return tasks.filter(
      (candidate) => candidate.id !== task.id && !prereqItems.some((item) => item.node.id === candidate.id),
    );
  }, [task, tasks, prereqItems]);

  const resetSelect = () => {
    setSelectedPrereq("");
  };

  if (!task || !draft) {
    return (
      <div className="rounded-3xl border border-[var(--workflow-accent-soft,#9B3922)] bg-[var(--workflow-surface,#1a100d)] p-4 text-sm text-[var(--workflow-muted,#cbb89f)]">
        Select a task to see details.
      </div>
    );
  }

  const handleField =
    <K extends keyof WorkflowTask>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setDraft((prev) => (prev ? { ...prev, [key]: key === "durationDays" ? Math.max(1, Number(value)) : key === "priority" ? Number(value) : value } : prev));
    };

  const handleSave = () => {
    if (!draft.title.trim()) return;
    onUpdateTask({
      ...draft,
      durationDays: Math.max(1, draft.durationDays),
      priority: draft.priority === 1 || draft.priority === 2 || draft.priority === 3 ? draft.priority : 2,
    });
    setEditing(false);
  };

  return (
    <div className="rounded-3xl border border-[var(--workflow-accent-soft,#9B3922)] bg-[var(--workflow-surface,#1a100d)] p-4 text-[var(--workflow-ink,#F5E8D8)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{task.title || "Untitled"}</h2>
          <p className="text-sm text-white/70">{task.description || "No description."}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            data-testid="task-edit-toggle"
            className="rounded-full border border-[var(--workflow-border,#2C1A14)] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[var(--workflow-muted,#cbb89f)] hover:border-[var(--workflow-accent,#F2613F)]"
            onClick={() => {
              setEditing((prev) => !prev);
              setDraft(task);
            }}
          >
            {editing ? "View" : "Edit"}
          </button>
          <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.25em]">
            {task.status.replace("_", " ")}
          </span>
        </div>
      </div>
      {editing ? (
        <div className="mt-4 space-y-3 text-sm">
          <label className="block text-[var(--workflow-muted,#cbb89f)]">
            Title
            <input
              data-testid="task-edit-title"
              type="text"
              value={draft.title}
              onChange={handleField("title")}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
            />
          </label>
          <label className="block text-[var(--workflow-muted,#cbb89f)]">
            Description
            <textarea
              data-testid="task-edit-description"
              rows={3}
              value={draft.description}
              onChange={handleField("description")}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              Start
              <input
                data-testid="task-edit-start"
                type="date"
                value={draft.start}
                onChange={handleField("start")}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
              />
            </label>
            <label className="block">
              Duration
              <input
                data-testid="task-edit-duration"
                type="number"
                min={1}
                value={draft.durationDays}
                onChange={handleField("durationDays")}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
              />
            </label>
            <label className="block">
              Priority
              <select
                data-testid="task-edit-priority"
                value={draft.priority}
                onChange={handleField("priority")}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
              >
                <option value={1}>High</option>
                <option value={2}>Medium</option>
                <option value={3}>Low</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3 text-xs uppercase tracking-[0.25em]">
            <button
              type="button"
              data-testid="task-edit-cancel"
            className="rounded-full border border-[var(--workflow-accent,#F2613F)] px-4 py-1 text-[var(--workflow-ink,#F5E8D8)]"
              onClick={() => {
                setDraft(task);
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="task-edit-save"
            className="rounded-full bg-[var(--workflow-accent,#F2613F)] px-4 py-1 font-semibold text-black"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 text-xs uppercase tracking-[0.25em] text-[var(--workflow-muted,#cbb89f)] sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--workflow-accent-soft,#9B3922)] bg-[var(--workflow-surface-deep,#28140f)] p-3">
            <p>Start</p>
            <p className="text-base tracking-normal">{task.start}</p>
          </div>
          <div className="rounded-2xl border border-[var(--workflow-accent-soft,#9B3922)] bg-[var(--workflow-surface-deep,#28140f)] p-3">
            <p>Duration</p>
            <p className="text-base tracking-normal">{task.durationDays} days</p>
          </div>
        </div>
      )}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--workflow-muted,#cbb89f)]">Depends on</p>
          <ul className="mt-2 space-y-2 text-sm">
            {prereqItems.length ? (
              prereqItems.map((item) => (
                <li key={item.edge.id} className="flex items-center justify-between rounded-xl border border-[var(--workflow-accent-soft,#9B3922)] bg-[var(--workflow-surface-deep,#28140f)] px-3 py-2">
                  <span>{item.node.title}</span>
                  <button
                    type="button"
                    data-testid={`unlink-prereq-${item.edge.id}`}
                    className="text-xs uppercase tracking-[0.25em] text-[var(--workflow-accent,#F2613F)] hover:text-white"
                    onClick={() => onRemoveDependency(item.edge.id)}
                  >
                    Unlink
                  </button>
                </li>
              ))
            ) : (
              <li className="text-[var(--workflow-muted,#cbb89f)]">No prerequisites.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--workflow-muted,#cbb89f)]">Blocks</p>
          <ul className="mt-2 space-y-2 text-sm">
            {dependentItems.length ? (
              dependentItems.map((item) => (
                <li key={item.edge.id} className="flex items-center justify-between rounded-xl border border-[var(--workflow-accent-soft,#9B3922)] bg-[var(--workflow-surface-deep,#28140f)] px-3 py-2">
                  <span>{item.node.title}</span>
                  <button
                    type="button"
                    data-testid={`unlink-dependent-${item.edge.id}`}
                    className="text-xs uppercase tracking-[0.25em] text-[var(--workflow-accent,#F2613F)] hover:text-white"
                    onClick={() => onRemoveDependency(item.edge.id)}
                  >
                    Unlink
                  </button>
                </li>
              ))
            ) : (
              <li className="text-[var(--workflow-muted,#cbb89f)]">No outgoing dependencies.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--workflow-muted,#cbb89f)]">Add dependency</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={selectedPrereq}
            onChange={(event) => {
              onClearError();
              setSelectedPrereq(event.target.value);
            }}
            className="rounded-full border border-[var(--workflow-muted,#cbb89f)] bg-transparent px-3 py-1 text-sm text-[var(--workflow-ink,#F5E8D8)] outline-none focus:border-[var(--workflow-accent,#F2613F)]"
          >
            <option value="">Select task</option>
            {availablePrereqs.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-full bg-[var(--workflow-accent,#F2613F)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-black disabled:opacity-40"
            disabled={!selectedPrereq}
            onClick={() => {
              if (!selectedPrereq) return;
              onAddDependency(selectedPrereq, task.id);
              resetSelect();
            }}
          >
            Link
          </button>
        </div>
        {dependencyError ? <p className="mt-2 text-sm text-red-400">{dependencyError}</p> : null}
      </div>
    </div>
  );
};

export default TaskDetailsPanel;
