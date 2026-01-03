import type { StepManifest, StepNode } from "@/lib/stepManifests/types";

export type StepRunnerState = Record<string, unknown>;

export type StepRunnerStateInput =
  | Partial<StepRunnerState>
  | ((previous: StepRunnerState) => StepRunnerState);

export type StepRunnerSetState = (update: StepRunnerStateInput) => void;

export type StepRunnerGoHandler = (variant?: string) => void;

export type StepComponentProps = {
  node: StepNode;
  manifest: StepManifest;
  routePath: string;
  go: StepRunnerGoHandler;
  state: StepRunnerState;
  setState: StepRunnerSetState;
};

export type StepRunnerContextValue = {
  routePath: string;
  manifest: StepManifest;
  currentStepId: string | null;
  node: StepNode | null;
  go: StepRunnerGoHandler;
  state: StepRunnerState;
  setState: StepRunnerSetState;
};
