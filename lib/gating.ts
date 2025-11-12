import type { ProgressFact } from "./progressFacts";

export function hasSelectedPath(progress: ProgressFact | null | undefined): boolean {
  const selected = progress?.recommendation?.selectedPath;
  return typeof selected === "string" && (selected === "individual" || selected === "group");
}

export function isWizardComplete(progress: ProgressFact | null | undefined): boolean {
  // Consider complete if snapshot + recommendation present
  return Boolean(progress?.intent && progress?.recommendation?.reasonKey);
}

