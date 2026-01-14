"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkflowEdge, WorkflowState, WorkflowTask, WorkflowStatus } from "@/lib/workflow/types";
import { loadWorkflowState, sanitizeWorkflowState, saveWorkflowState } from "@/lib/workflow/storage";
import { buildGraphMaps, computeCriticalPath, getScheduleConflicts, wouldCreateCycle } from "@/lib/workflow/graph";
import { emptyWorkflowState, WORKFLOW_STORAGE_KEY } from "@/lib/workflow/types";
import KanbanBoard from "./KanbanBoard";
import TaskDetailsPanel from "./TaskDetailsPanel";
import GanttView from "./GanttView";

type BlockedMove = {
  task: WorkflowTask;
  blockers: WorkflowTask[];
};

const formatLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createTask = (title: string, description: string): WorkflowTask => {
  const now = Date.now();
  return {
    id: `t_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    status: "todo",
    start: formatLocalDate(),
    durationDays: 1,
    priority: 2,
    createdAt: now,
    updatedAt: now,
  };
};

const createEdge = (from: string, to: string): WorkflowEdge => ({
  id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  from,
  to,
});

const WorkflowBoard = () => {
  const [state, setState] = useState<WorkflowState>(() => loadWorkflowState());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [blockedMove, setBlockedMove] = useState<BlockedMove | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    saveWorkflowState(state);
  }, [state]);

  const tasksById = useMemo(() => {
    const map = new Map<string, WorkflowTask>();
    for (const task of state.tasks) {
      map.set(task.id, task);
    }
    return map;
  }, [state.tasks]);

  const graphMaps = useMemo(() => buildGraphMaps(state.tasks, state.edges), [state.tasks, state.edges]);
  const criticalPath = useMemo(() => computeCriticalPath(state.tasks, state.edges), [state.tasks, state.edges]);
  const scheduleConflicts = useMemo(
    () => getScheduleConflicts(state.tasks, state.edges),
    [state.tasks, state.edges],
  );

  const counts = useMemo(() => {
    return {
      todo: state.tasks.filter((t) => t.status === "todo").length,
      in_progress: state.tasks.filter((t) => t.status === "in_progress").length,
      done: state.tasks.filter((t) => t.status === "done").length,
    };
  }, [state.tasks]);

  const sortedGanttTasks = useMemo(() => {
    return [...state.tasks].sort((a, b) => {
      if (a.start !== b.start) return a.start.localeCompare(b.start);
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt - b.createdAt;
    });
  }, [state.tasks]);

  const handleStatusChange = (taskId: string, nextStatus: WorkflowStatus) => {
    const task = tasksById.get(taskId);
    if (!task || task.status === nextStatus) return;
    if (nextStatus === "done") {
      const blockers = (graphMaps.incoming[taskId] ?? [])
        .map((edge) => tasksById.get(edge.from))
        .filter((t): t is WorkflowTask => Boolean(t) && t.status !== "done");
      if (blockers.length) {
        setBlockedMove({ task, blockers });
        return;
      }
    }
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, status: nextStatus, updatedAt: Date.now() } : t,
      ),
    }));
  };

  const handleUpdateTask = (updated: WorkflowTask) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === updated.id ? { ...updated, updatedAt: Date.now() } : task)),
    }));
  };

  const handleRemoveDependency = (edgeId: string) => {
    setState((prev) => ({
      ...prev,
      edges: prev.edges.filter((edge) => edge.id !== edgeId),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      edges: prev.edges.filter((edge) => edge.from !== taskId && edge.to !== taskId),
    }));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task = createTask(newTaskTitle.trim(), newTaskDescription.trim());
    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
    setNewTaskTitle("");
    setNewTaskDescription("");
    setShowModal(false);
    setSelectedTaskId(task.id);
  };

  const handleAddDependency = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const edge = createEdge(fromId, toId);
    if (state.edges.some((e) => e.from === fromId && e.to === toId)) {
      setDependencyError("Dependency already exists.");
      return;
    }
    if (wouldCreateCycle(state.tasks, state.edges, edge)) {
      setDependencyError("Cannot add dependency: cycle detected.");
      return;
    }
    setState((prev) => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
    setDependencyError(null);
  };

  const handleImport = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as WorkflowState;
        const validated = sanitizeWorkflowState(parsed);
        setState(validated);
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "Failed to import data");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workflow.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedTask = selectedTaskId ? tasksById.get(selectedTaskId) ?? null : null;

  return (
    <div
      data-testid="workflow-admin-root"
      className="min-h-screen p-6"
      style={{
        backgroundColor: "#0C0C0C",
        color: "#F5E8D8",
        ["--workflow-bg" as string]: "#0C0C0C",
        ["--workflow-ink" as string]: "#F5E8D8",
        ["--workflow-accent" as string]: "#F2613F",
        ["--workflow-accent-soft" as string]: "#9B3922",
        ["--workflow-surface" as string]: "#1a100d",
        ["--workflow-surface-deep" as string]: "#481E14",
        ["--workflow-muted" as string]: "rgba(245,232,216,0.65)",
      }}
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Control Center</h1>
          <p className="text-sm text-[var(--workflow-muted)]">Coordinate priorities, dependencies, and schedules.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="add-task"
            onClick={() => {
              setShowModal(true);
              setNewTaskTitle("");
              setNewTaskDescription("");
            }}
            className="rounded-full bg-[var(--omni-ink,#ffffff)] px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Add task
          </button>
          <button
            type="button"
            data-testid="export-json"
            onClick={handleExport}
            className="rounded-full border border-[var(--workflow-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--workflow-ink)] transition hover:bg-[var(--workflow-accent)]/20"
          >
            Export
          </button>
          <label className="flex cursor-pointer flex-col text-xs uppercase tracking-[0.25em] text-[var(--workflow-muted)]">
            <span>Import</span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              data-testid="import-json"
              onChange={(event) => handleImport(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            data-testid="reset-board"
            onClick={() => setResetConfirmOpen(true)}
            className="rounded-full border border-[var(--workflow-accent-soft)] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[var(--workflow-accent-soft)] hover:bg-[var(--workflow-accent-soft)]/20"
          >
            Reset
          </button>
        </div>
      </div>
      {importError ? <p className="mb-4 text-sm text-red-400">{importError}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <KanbanBoard
            tasks={state.tasks}
            incoming={graphMaps.incoming}
            counts={counts}
            onStatusChange={handleStatusChange}
            onDeleteTask={handleDeleteTask}
            onSelectTask={setSelectedTaskId}
            selectedTaskId={selectedTaskId}
          />
        </div>
        <div className="space-y-4">
          <TaskDetailsPanel
            task={selectedTask}
            tasks={state.tasks}
            incoming={graphMaps.incoming}
            outgoing={graphMaps.outgoing}
            onAddDependency={handleAddDependency}
            onRemoveDependency={handleRemoveDependency}
            onUpdateTask={handleUpdateTask}
            dependencyError={dependencyError}
            onClearError={() => setDependencyError(null)}
          />
          <GanttView
            tasks={sortedGanttTasks}
            criticalPath={criticalPath}
            scheduleConflicts={scheduleConflicts}
          />
        </div>
      </div>
      {showModal ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur">
          <div
            data-testid="new-task-modal"
            className="w-full max-w-md rounded-2xl bg-[var(--omni-bg-paper,#1c1c1c)] p-6 text-left shadow-2xl"
          >
            <h2 className="text-lg font-semibold">New Task</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                Title
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                Description
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
                  rows={3}
                  value={newTaskDescription}
                  onChange={(event) => setNewTaskDescription(event.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3 text-sm">
              <button
                type="button"
                className="rounded-full border border-white/30 px-3 py-1 uppercase tracking-[0.25em]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-white px-4 py-1 font-semibold text-black"
                onClick={handleAddTask}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {resetConfirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
          <div
            data-testid="reset-board-confirm-dialog"
            className="w-full max-w-sm rounded-2xl bg-[var(--omni-bg-paper,#1c1c1c)] p-5 text-center shadow-2xl"
          >
            <p className="text-sm text-white/70">Reset all tasks and dependencies?</p>
            <div className="mt-4 flex justify-center gap-3 text-sm">
              <button
                type="button"
                className="rounded-full border border-white/30 px-4 py-1 uppercase tracking-[0.25em]"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="reset-board-confirm"
                className="rounded-full bg-red-500 px-4 py-1 font-semibold text-white"
                onClick={handleResetBoard}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {blockedMove ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70">
          <div
            data-testid="dependency-warning-dialog"
            className="w-full max-w-md rounded-2xl bg-[var(--omni-bg-paper,#1c1c1c)] p-6 text-left shadow-2xl"
          >
            <h3 className="text-lg font-semibold">Dependencies incomplete</h3>
            <p className="mt-2 text-sm text-[var(--omni-muted,#bfbfbf)]">
              Complete the following tasks before marking <strong>{blockedMove.task.title}</strong> as done:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {blockedMove.blockers.map((task) => (
                <li key={task.id}>{task.title}</li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-full border border-white/30 px-4 py-1 uppercase tracking-[0.25em]"
                onClick={() => setBlockedMove(null)}
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WorkflowBoard;
  const handleResetBoard = () => {
    setState(emptyWorkflowState());
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    }
    setSelectedTaskId(null);
    setResetConfirmOpen(false);
  };
