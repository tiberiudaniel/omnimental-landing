import {
  emptyWorkflowState,
  WORKFLOW_STORAGE_KEY,
  type WorkflowEdge,
  type WorkflowState,
  type WorkflowStatus,
  type WorkflowTask,
} from "./types";

const isValidTask = (task: WorkflowTask): boolean => {
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    (task.status === "todo" || task.status === "in_progress" || task.status === "done") &&
    typeof task.start === "string" &&
    typeof task.durationDays === "number" &&
    (task.priority === 1 || task.priority === 2 || task.priority === 3) &&
    typeof task.createdAt === "number" &&
    typeof task.updatedAt === "number"
  );
};

const isValidEdge = (edge: WorkflowEdge): boolean => {
  return typeof edge.id === "string" && typeof edge.from === "string" && typeof edge.to === "string";
};

const normalizeOrder = (tasks: WorkflowTask[]): WorkflowTask[] => {
  const statusList: Record<WorkflowStatus, WorkflowTask[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const task of tasks) {
    statusList[task.status].push(task);
  }
  const toOrderValue = (task: WorkflowTask) => (typeof task.order === "number" ? task.order : task.createdAt);
  (Object.keys(statusList) as WorkflowStatus[]).forEach((status) => {
    const list = statusList[status].sort((a, b) => toOrderValue(a) - toOrderValue(b));
    list.forEach((task, index) => {
      task.order = index + 1;
    });
  });
  return tasks;
};

export const sanitizeWorkflowState = (value: unknown): WorkflowState => {
  if (!value || typeof value !== "object") return emptyWorkflowState();
  const state = value as WorkflowState;
  if (state.version !== 1 || !Array.isArray(state.tasks) || !Array.isArray(state.edges)) {
    return emptyWorkflowState();
  }
  const validTasks = state.tasks.filter((task): task is WorkflowTask => isValidTask(task));
  const normalizedTasks = normalizeOrder(validTasks.map((task) => ({ ...task })));
  const taskIds = new Set(normalizedTasks.map((task) => task.id));
  const validEdges = state.edges.filter(
    (edge): edge is WorkflowEdge => isValidEdge(edge) && taskIds.has(edge.from) && taskIds.has(edge.to),
  );
  return {
    version: 1,
    tasks: normalizedTasks,
    edges: validEdges,
  };
};

export function loadWorkflowState(): WorkflowState {
  if (typeof window === "undefined") {
    return emptyWorkflowState();
  }
  try {
    const payload = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!payload) return emptyWorkflowState();
    const parsed = JSON.parse(payload) as unknown;
    return sanitizeWorkflowState(parsed);
  } catch {
    // ignore malformed data
  }
  return emptyWorkflowState();
}

export function saveWorkflowState(state: WorkflowState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota failures
  }
}
