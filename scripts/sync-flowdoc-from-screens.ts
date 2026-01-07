#!/usr/bin/env ts-node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type { FlowDoc, FlowNodeInternalStep } from "../lib/flowStudio/types";
import type { ScreenStep } from "../config/flows/types";
import { introScreens } from "../config/flows/introScreens";
import { todayScreens } from "../config/flows/todayScreens";
import { guidedDay1Screens } from "../config/flows/guidedDay1Screens";
import { catLitePart2Screens } from "../config/flows/catLitePart2Screens";
import { exploreCatScreens } from "../config/flows/exploreCatScreens";
import { exploreAxesScreens } from "../config/flows/exploreAxesScreens";

const FLOW_DOC_PATH = path.resolve(process.cwd(), "DOCS/FLOW/flowStudio-explore-cat-day1.json");

const ROUTE_SCREEN_MAP: Record<string, ScreenStep[]> = {
  "/intro": introScreens,
  "/today": todayScreens,
  "/guided/day1": guidedDay1Screens,
  "/onboarding/cat-lite-2": catLitePart2Screens,
  "/intro/explore": exploreCatScreens,
  "/intro/explore/axes": exploreAxesScreens.hub,
  "/intro/explore/axes/[axisId]": exploreAxesScreens.detail,
};

function toInternalSteps(steps: ScreenStep[]): FlowNodeInternalStep[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((step) => ({
      id: step.id,
      label: step.label,
      description: step.description,
      tags: step.tags,
    }));
}

function syncFlowDoc() {
  const raw = fs.readFileSync(FLOW_DOC_PATH, "utf-8");
  const doc = JSON.parse(raw) as FlowDoc;
  if (!doc.nodes) {
    throw new Error("FlowDoc nu conține noduri.");
  }
  const missingRoutes: string[] = [];
  Object.entries(ROUTE_SCREEN_MAP).forEach(([routePath, screens]) => {
    const targetNode = doc.nodes?.find((node) => node.routePath === routePath);
    if (!targetNode) {
      missingRoutes.push(routePath);
      return;
    }
    targetNode.internalSteps = toInternalSteps(screens);
  });
  if (missingRoutes.length) {
    console.warn("[sync-flowdoc] Route-uri fără nod corespunzător:", missingRoutes.join(", "));
  }
  fs.writeFileSync(FLOW_DOC_PATH, `${JSON.stringify(doc, null, 2)}\n`);
  console.log("[sync-flowdoc] FlowDoc actualizat:", FLOW_DOC_PATH);
}

try {
  syncFlowDoc();
} catch (error) {
  console.error("[sync-flowdoc] Eșec:", error);
  process.exit(1);
}
