export type ArcLevel = "foundation" | "operational" | "mastery";

export type ArcDomain =
  | "energy"
  | "clarity"
  | "flex"
  | "executive"
  | "adaptive"
  | "shielding"
  | "identity";

export interface ArcDefinition {
  id: string;
  name: string;
  level: ArcLevel;
  domain: ArcDomain;
  durationDays: number;
  description: string;
}
