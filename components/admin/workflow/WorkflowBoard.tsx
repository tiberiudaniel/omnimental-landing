"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkflowEdge, WorkflowState, WorkflowTask, WorkflowStatus } from "@/lib/workflow/types";
import { loadWorkflowState, sanitizeWorkflowState } from "@/lib/workflow/storage";
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
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `t_${now}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title,
    description,
    status: "todo",
    order: 0,
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

const orderValue = (task: WorkflowTask) => (typeof task.order === "number" ? task.order : task.createdAt);

const reindexStatus = (tasks: WorkflowTask[], status: WorkflowStatus) => {
  const ordered = tasks
    .filter((task) => task.status === status)
    .sort((a, b) => orderValue(a) - orderValue(b));
  ordered.forEach((task, index) => {
    task.order = index + 1;
  });
};

const reorderState = (state: WorkflowState, taskId: string, targetId: string | null, targetStatus: WorkflowStatus): WorkflowState => {
  const tasks = state.tasks.map((task) => ({ ...task }));
  const movingTask = tasks.find((task) => task.id === taskId);
  if (!movingTask) return state;
  const sourceStatus = movingTask.status;
  if (sourceStatus !== targetStatus) {
    movingTask.status = targetStatus;
    movingTask.updatedAt = Date.now();
  }
  const targetList = tasks
    .filter((task) => task.status === targetStatus && task.id !== taskId)
    .sort((a, b) => orderValue(a) - orderValue(b));
  const insertionIndex = targetId ? targetList.findIndex((task) => task.id === targetId) : targetList.length;
  if (targetId && insertionIndex === -1) {
    return state;
  }
  targetList.splice(insertionIndex, 0, movingTask);
  targetList.forEach((task, index) => {
    task.order = index + 1;
  });
  if (sourceStatus !== targetStatus) {
    reindexStatus(tasks, sourceStatus);
  }
  return {
    ...state,
    tasks,
  };
};

const WorkflowBoard = () => {
  const [boardState, setBoardState] = useState<WorkflowState>(() => loadWorkflowState());
  const skipNextPersistRef = useRef(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draftTaskTitle, setDraftTaskTitle] = useState("");
  const [draftTaskDescription, setDraftTaskDescription] = useState("");
  const [blockedMove, setBlockedMove] = useState<BlockedMove | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(boardState));
  }, [boardState]);

  const tasksById = useMemo(() => {
    const map = new Map<string, WorkflowTask>();
    for (const task of boardState.tasks) {
      map.set(task.id, task);
    }
    return map;
  }, [boardState.tasks]);

  const graphMaps = useMemo(() => buildGraphMaps(boardState.tasks, boardState.edges), [boardState.tasks, boardState.edges]);
  const criticalPath = useMemo(() => computeCriticalPath(boardState.tasks, boardState.edges), [boardState.tasks, boardState.edges]);
  const scheduleConflicts = useMemo(
    () => getScheduleConflicts(boardState.tasks, boardState.edges),
    [boardState.tasks, boardState.edges],
  );

  const counts = useMemo(() => {
    return {
      todo: boardState.tasks.filter((t) => t.status === "todo").length,
      in_progress: boardState.tasks.filter((t) => t.status === "in_progress").length,
      done: boardState.tasks.filter((t) => t.status === "done").length,
    };
  }, [boardState.tasks]);

  const sortedGanttTasks = useMemo(() => {
    return [...boardState.tasks].sort((a, b) => {
      if (a.start !== b.start) return a.start.localeCompare(b.start);
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt - b.createdAt;
    });
  }, [boardState.tasks]);

  const handleMoveTask = (taskId: string, targetStatus: WorkflowStatus, targetId: string | null) => {
    const task = tasksById.get(taskId);
    if (!task) return;
    if (targetStatus === "done" && task.status !== "done") {
      const blockers = (graphMaps.incoming[taskId] ?? [])
        .map((edge) => {
          const upstream = tasksById.get(edge.from);
          return upstream && upstream.status !== "done" ? upstream : null;
        })
        .filter((candidate): candidate is WorkflowTask => Boolean(candidate));
      if (blockers.length) {
        setBlockedMove({ task, blockers });
        return;
      }
    }
    setBoardState((prev) => reorderState(prev, taskId, targetId, targetStatus));
  };

  const handleStatusChange = (taskId: string, nextStatus: WorkflowStatus) => {
    handleMoveTask(taskId, nextStatus, null);
  };

  const handleReorderTask = (taskId: string, targetTaskId: string | null, status: WorkflowStatus) => {
    if (targetTaskId === taskId) return;
    handleMoveTask(taskId, status, targetTaskId);
  };

  const handleUpdateTask = (updated: WorkflowTask) => {
    setBoardState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === updated.id ? { ...updated, updatedAt: Date.now() } : task)),
    }));
  };

  const handleRemoveDependency = (edgeId: string) => {
    setBoardState((prev) => ({
      ...prev,
      edges: prev.edges.filter((edge) => edge.id !== edgeId),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasksById.get(taskId);
    setBoardState((prev) => {
      const nextTasks = prev.tasks.filter((task) => task.id !== taskId).map((task) => ({ ...task }));
      if (taskToDelete) {
        reindexStatus(nextTasks, taskToDelete.status);
      }
      return {
        ...prev,
        tasks: nextTasks,
        edges: prev.edges.filter((edge) => edge.from !== taskId && edge.to !== taskId),
      };
    });
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const openNewTaskModal = () => {
    setDraftTaskTitle("");
    setDraftTaskDescription("");
    setShowModal(true);
  };

  const handleAddTask = () => {
    if (!draftTaskTitle.trim()) return;
    const protoTask = createTask(draftTaskTitle.trim(), draftTaskDescription.trim());
    setBoardState((prev) => {
      const nextTasks = [...prev.tasks.map((task) => ({ ...task })), { ...protoTask }];
      reindexStatus(nextTasks, "todo");
      return {
        ...prev,
        tasks: nextTasks,
      };
    });
    setDraftTaskTitle("");
    setDraftTaskDescription("");
    setShowModal(false);
    setSelectedTaskId(protoTask.id);
  };

  const handleAddDependency = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const edge = createEdge(fromId, toId);
    if (boardState.edges.some((e) => e.from === fromId && e.to === toId)) {
      setDependencyError("Dependency already exists.");
      return;
    }
    if (wouldCreateCycle(boardState.tasks, boardState.edges, edge)) {
      setDependencyError("Cannot add dependency: cycle detected.");
      return;
    }
    setBoardState((prev) => ({
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
        setBoardState(validated);
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "Failed to import data");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(boardState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workflow.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetBoard = () => {
    skipNextPersistRef.current = true;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    }
    setBoardState(emptyWorkflowState());
    setSelectedTaskId(null);
    setResetConfirmOpen(false);
  };

  const selectedTask = selectedTaskId ? tasksById.get(selectedTaskId) ?? null : null;

  return (
    <div
      data-testid="workflow-admin-root"
      className="min-h-screen p-6"
      style={{
        backgroundColor: "#210F37",
        color: "#DCA06D",
        ["--workflow-bg" as string]: "#210F37",
        ["--workflow-ink" as string]: "#DCA06D",
        ["--workflow-accent" as string]: "#4F1C51",
        ["--workflow-accent-soft" as string]: "#A55B4B",
        ["--workflow-accent-faint" as string]: "rgba(165,91,75,0.2)",
        ["--workflow-border" as string]: "#4F1C51",
        ["--workflow-surface" as string]: "#4F1C51",
        ["--workflow-surface-deep" as string]: "#210F37",
        ["--workflow-muted" as string]: "rgba(220,160,109,0.75)",
        ["--workflow-gantt-bar-soft" as string]: "rgba(165,91,75,0.4)",
        ["--workflow-gantt-bar-strong" as string]: "rgba(220,160,109,0.8)",
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
            onClick={openNewTaskModal}
            className="rounded-full border border-[var(--workflow-accent,#e9a178)] px-4 py-2 text-sm font-semibold text-[var(--workflow-accent,#e9a178)] transition hover:bg-[rgba(233,161,120,0.12)]"
          >
            Add task
          </button>
          <button
            type="button"
            data-testid="export-json"
            onClick={handleExport}
            className="rounded-full border border-[var(--workflow-accent,#e9a178)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--workflow-accent,#e9a178)] transition hover:bg-[rgba(233,161,120,0.08)]"
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
            className="rounded-full border border-[var(--workflow-accent-soft,#c06b49)] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[var(--workflow-accent-soft,#c06b49)] hover:bg-[rgba(192,107,73,0.15)]"
          >
            Reset
          </button>
        </div>
      </div>
      {importError ? <p className="mb-4 text-sm text-red-400">{importError}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <KanbanBoard
            tasks={boardState.tasks}
            incoming={graphMaps.incoming}
            counts={counts}
            onStatusChange={handleStatusChange}
            onReorderTask={handleReorderTask}
            onDeleteTask={handleDeleteTask}
            onSelectTask={setSelectedTaskId}
            selectedTaskId={selectedTaskId}
          />
        </div>
        <div className="space-y-4">
          <TaskDetailsPanel
            task={selectedTask}
            tasks={boardState.tasks}
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
                  data-testid="new-task-title"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
                  value={draftTaskTitle}
                  onChange={(event) => setDraftTaskTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                Description
                <textarea
                  data-testid="new-task-description"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-white/40"
                  rows={3}
                  value={draftTaskDescription}
                  onChange={(event) => setDraftTaskDescription(event.target.value)}
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
                data-testid="create-task"
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
