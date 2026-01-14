import { emptyWorkflowState, WORKFLOW_STORAGE_KEY, type WorkflowEdge, type WorkflowState, type WorkflowTask } from "./types";

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

export const sanitizeWorkflowState = (value: unknown): WorkflowState => {
  if (!value || typeof value !== "object") return emptyWorkflowState();
  const state = value as WorkflowState;
  if (state.version !== 1 || !Array.isArray(state.tasks) || !Array.isArray(state.edges)) {
    return emptyWorkflowState();
  }
  const validTasks = state.tasks.filter((task): task is WorkflowTask => isValidTask(task));
  const taskIds = new Set(validTasks.map((task) => task.id));
  const validEdges = state.edges.filter(
    (edge): edge is WorkflowEdge => isValidEdge(edge) && taskIds.has(edge.from) && taskIds.has(edge.to),
  );
  return {
    version: 1,
    tasks: validTasks,
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
