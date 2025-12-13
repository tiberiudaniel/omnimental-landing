import type { L1Bridge } from "@/config/arenaModules/v1/types";

const BRIDGE_MAP: Record<L1Bridge, string> = {
  clarity: "/recommendation?cluster=clarity",
  energy: "/recommendation?cluster=energy",
  emotional_flex: "/recommendation?cluster=emotional_flex",
};

export function resolveBridgeHref(bridge: L1Bridge): string {
  return BRIDGE_MAP[bridge] ?? "/recommendation";
}
