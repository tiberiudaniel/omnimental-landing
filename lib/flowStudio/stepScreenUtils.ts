"use client";

import type { StepScreenConfig } from "@/lib/flowStudio/types";

export function buildStepScreenHref(config?: StepScreenConfig | null): string | null {
  if (!config) return null;
  const params = new URLSearchParams();
  params.set("step", config.stepKey);
  if (config.queryPreset) {
    Object.entries(config.queryPreset).forEach(([key, value]) => {
      if (key && value !== undefined && value !== null) {
        params.set(key, value);
      }
    });
  }
  const query = params.toString();
  if (!query) {
    return config.hostRoutePath;
  }
  const separator = config.hostRoutePath.includes("?") ? "&" : "?";
  return `${config.hostRoutePath}${separator}${query}`;
}
