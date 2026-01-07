"use client";

import { getIntroManifestFromFlowDoc } from "@/lib/flowStudio/runtime";
import type { StepManifest } from "./types";

export function getIntroManifest(): StepManifest {
  return getIntroManifestFromFlowDoc();
}
