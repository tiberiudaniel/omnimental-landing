#!/usr/bin/env ts-node

import process from "node:process";
import { getIntroManifestFromFlowDoc, getGuidedDayOneManifestFromFlowDoc, getStepScreenKeysForRoute } from "@/lib/flowStudio/runtime";

function validateManifest(name: string, manifestRoute: string, expectedStepKeys: string[]) {
  const manifest = name === "intro" ? getIntroManifestFromFlowDoc() : getGuidedDayOneManifestFromFlowDoc();
  const errors: string[] = [];
  if (!manifest.nodes.length) {
    errors.push("Manifest nu are noduri.");
  }
  if (!manifest.edges.length) {
    errors.push("Manifest nu are tranziții.");
  }
  if (!manifest.startNodeId) {
    errors.push("Start node lipsește.");
  } else if (!manifest.nodes.find((node) => node.id === manifest.startNodeId)) {
    errors.push(`Start node ${manifest.startNodeId} nu există în nodes.`);
  }
  if (!manifest.terminalNodeIds?.length) {
    errors.push("Terminal node ids lipsesc.");
  } else {
    manifest.terminalNodeIds.forEach((id) => {
      if (!manifest.nodes.find((node) => node.id === id)) {
        errors.push(`Terminal node ${id} nu există în nodes.`);
      }
    });
  }

  const manifestStepKeys = manifest.nodes.map((node) => node.id).sort();
  const expectedSorted = [...expectedStepKeys].sort();
  if (manifestStepKeys.join(",") !== expectedSorted.join(",")) {
    errors.push(
      `Mismatch step keys. FlowDoc: [${expectedSorted.join(", ")}], Manifest: [${manifestStepKeys.join(", ")}]`,
    );
  }

  if (errors.length) {
    console.error(`[verify-stepmanifests] ${manifestRoute} manifest invalid:`);
    errors.forEach((error) => console.error(` - ${error}`));
    return false;
  }
  console.log(`[verify-stepmanifests] ${manifestRoute} OK (${manifest.nodes.length} pași, ${manifest.edges.length} tranziții)`);
  return true;
}

async function main() {
  const introKeys = getStepScreenKeysForRoute("/intro");
  const guidedKeys = getStepScreenKeysForRoute("/guided/day1");
  const introValid = validateManifest("intro", "/intro", introKeys);
  const guidedValid = validateManifest("guided", "/guided/day1", guidedKeys);
  if (!introValid || !guidedValid) {
    process.exit(1);
  }
}

void main();
