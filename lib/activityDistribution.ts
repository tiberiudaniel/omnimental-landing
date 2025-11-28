import type { PracticeSessionLite } from "./progressAnalytics";

export function computeDistribution(sessions: PracticeSessionLite[]): {
  reflection: number;
  breathing: number;
  drill: number;
  total: number;
} {
  let reflection = 0;
  let breathing = 0;
  let drill = 0;
  sessions.forEach((session) => {
    const minutes = Math.max(0, Math.round((session.durationSec ?? 0) / 60));
    if (session.type === "reflection") reflection += minutes;
    else if (session.type === "breathing") breathing += minutes;
    else if (session.type === "drill") drill += minutes;
  });
  const total = reflection + breathing + drill;
  return { reflection, breathing, drill, total };
}
