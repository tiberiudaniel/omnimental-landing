import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

export type ArenaTaskConfig = {
  id: string;
  name: string;
  indicatorId: string;
  canonDomain: CanonDomainId;
  catAxes: CatAxisId[];
};

export const ARENA_TASKS: Record<string, ArenaTaskConfig> = {
  exec_control_micro_stroop: {
    id: "exec_control_micro_stroop",
    name: "Micro-Stroop (control executiv)",
    indicatorId: "exec_control_stroop_v1",
    canonDomain: "executiveControl",
    catAxes: ["focus", "recalibration"],
  },
};

export function getArenaTaskConfig(id: string): ArenaTaskConfig | undefined {
  return ARENA_TASKS[id];
}
