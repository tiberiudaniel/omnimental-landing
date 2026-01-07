"use client";

import { getGuidedDayOneManifestFromFlowDoc } from "@/lib/flowStudio/runtime";
import type { StepManifest } from "./types";

export function getGuidedDayOneManifest(): StepManifest {
  return getGuidedDayOneManifestFromFlowDoc();
}
