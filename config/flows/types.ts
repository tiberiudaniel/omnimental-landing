export type ScreenStepType = "screen" | "loop" | "branch" | "summary";

export interface ScreenStep {
  id: string;
  type: ScreenStepType;
  label: string;
  description?: string;
  order: number;
  tags?: string[];
  component?: string;
  variant?: string;
}
