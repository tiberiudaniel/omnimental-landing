"use client";

import { createContext, useContext } from "react";
import type { StepRunnerContextValue } from "./types";

export const StepRunnerContext = createContext<StepRunnerContextValue | null>(null);

export function useStepRunner() {
  const context = useContext(StepRunnerContext);
  if (!context) {
    throw new Error("useStepRunner must be used within a StepRunner provider");
  }
  return context;
}

export default StepRunnerContext;
