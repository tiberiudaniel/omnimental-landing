import { arcs } from "@/config/arcs/arcs";
import type { ArcDefinition, ArcLevel } from "@/types/arcs";

export function getArcsByLevel(level: ArcLevel): ArcDefinition[] {
  return arcs.filter((arc) => arc.level === level);
}

export function getArcById(id: string): ArcDefinition | undefined {
  return arcs.find((arc) => arc.id === id);
}

export function selectArcForUser(level: ArcLevel): ArcDefinition {
  const grouped = getArcsByLevel(level);
  return grouped[0] ?? arcs[0];
}
