export type WorkflowStatus = "todo" | "in_progress" | "done";

export type WorkflowPriority = 1 | 2 | 3;

export type WorkflowTask = {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  start: string;
  durationDays: number;
  priority: WorkflowPriority;
  createdAt: number;
  updatedAt: number;
};

export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
};

export type WorkflowState = {
  version: 1;
  tasks: WorkflowTask[];
  edges: WorkflowEdge[];
};

export const WORKFLOW_STORAGE_KEY = "omnimental_workflow_v1";

export const emptyWorkflowState = (): WorkflowState => ({
  version: 1,
  tasks: [],
  edges: [],
});
