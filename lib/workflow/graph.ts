import type { WorkflowEdge, WorkflowTask } from "./types";

type GraphMaps = {
  incoming: Record<string, WorkflowEdge[]>;
  outgoing: Record<string, WorkflowEdge[]>;
};

export const buildGraphMaps = (tasks: WorkflowTask[], edges: WorkflowEdge[]): GraphMaps => {
  const incoming: GraphMaps["incoming"] = {};
  const outgoing: GraphMaps["outgoing"] = {};
  for (const task of tasks) {
    incoming[task.id] = [];
    outgoing[task.id] = [];
  }
  for (const edge of edges) {
    if (incoming[edge.to]) {
      incoming[edge.to].push(edge);
    }
    if (outgoing[edge.from]) {
      outgoing[edge.from].push(edge);
    }
  }
  return { incoming, outgoing };
};

export const wouldCreateCycle = (
  tasks: WorkflowTask[],
  edges: WorkflowEdge[],
  candidate: WorkflowEdge,
): boolean => {
  const adjacency = new Map<string, string[]>();
  for (const task of tasks) {
    adjacency.set(task.id, []);
  }
  const pushEdge = (edge: WorkflowEdge) => {
    const list = adjacency.get(edge.from);
    if (list) {
      list.push(edge.to);
    }
  };
  edges.forEach(pushEdge);
  pushEdge(candidate);
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfs = (node: string): boolean => {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    const next = adjacency.get(node) ?? [];
    for (const child of next) {
      if (dfs(child)) return true;
    }
    inStack.delete(node);
    return false;
  };

  for (const task of tasks) {
    if (dfs(task.id)) return true;
  }
  return false;
};

const topoSort = (tasks: WorkflowTask[], edges: WorkflowEdge[]): string[] | null => {
  const indeg = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const task of tasks) {
    indeg.set(task.id, 0);
    outgoing.set(task.id, []);
  }
  for (const edge of edges) {
    if (!indeg.has(edge.to)) continue;
    indeg.set(edge.to, (indeg.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }
  const queue: string[] = [];
  indeg.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });
  const order: string[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const child of outgoing.get(node) ?? []) {
      const next = (indeg.get(child) ?? 0) - 1;
      indeg.set(child, next);
      if (next === 0) queue.push(child);
    }
  }
  return order.length === tasks.length ? order : null;
};

export const computeCriticalPath = (tasks: WorkflowTask[], edges: WorkflowEdge[]): Set<string> => {
  if (!tasks.length) return new Set();
  const order = topoSort(tasks, edges);
  if (!order) return new Set();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const incoming = buildGraphMaps(tasks, edges).incoming;
  const finishTimes = new Map<string, number>();
  const parent = new Map<string, string | null>();
  for (const id of order) {
    const task = taskMap.get(id);
    if (!task) continue;
    const duration = Math.max(1, task.durationDays);
    const prereqs = incoming[id] ?? [];
    let bestFinish = 0;
    let bestParent: string | null = null;
    for (const edge of prereqs) {
      const finish = finishTimes.get(edge.from) ?? 0;
      if (finish > bestFinish) {
        bestFinish = finish;
        bestParent = edge.from;
      }
    }
    finishTimes.set(id, bestFinish + duration);
    parent.set(id, bestParent);
  }
  let target: string | null = null;
  let maxFinish = -Infinity;
  for (const [id, finish] of finishTimes.entries()) {
    if (finish > maxFinish) {
      target = id;
      maxFinish = finish;
    }
  }
  const critical = new Set<string>();
  while (target) {
    critical.add(target);
    target = parent.get(target) ?? null;
  }
  return critical;
};

export const getScheduleConflicts = (tasks: WorkflowTask[], edges: WorkflowEdge[]): Set<string> => {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const incoming = buildGraphMaps(tasks, edges).incoming;
  const conflicts = new Set<string>();
  for (const task of tasks) {
    const prereqs = incoming[task.id] ?? [];
    if (!prereqs.length) continue;
    const latestEnd = Math.max(
      ...prereqs
        .map((edge) => taskMap.get(edge.from))
        .filter((t): t is WorkflowTask => Boolean(t))
        .map((t) => {
          const start = Date.parse(t.start);
          const duration = Math.max(1, t.durationDays);
          return start + duration * 24 * 60 * 60 * 1000;
        }),
    );
    if (!Number.isFinite(latestEnd)) continue;
    const currentStart = Date.parse(task.start);
    if (currentStart < latestEnd) {
      conflicts.add(task.id);
    }
  }
  return conflicts;
};
