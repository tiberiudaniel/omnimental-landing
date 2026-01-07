import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseFlowSpecText } from "@/lib/flowStudio/flowSpec";
import type { FlowOverlay, FlowOverlayStep } from "@/lib/flowStudio/types";

type JourneyStepOutput = {
  order: number;
  nodeId?: string;
  urlPattern?: string;
  assertTestId?: string;
  clickTestId?: string;
  gateTag?: string | null;
  tags?: string[] | null;
};

type JourneyOutput = {
  id: string;
  name?: string;
  status?: string;
  entryRoutePath?: string;
  exitRoutePath?: string;
  steps: JourneyStepOutput[];
};

type CliOptions = {
  specPath: string;
  outputPath: string;
};

const DEFAULT_OUTPUT_FILE =
  process.env.FLOW_JOURNEYS_OUT?.trim() || process.env.FLOW_JOURNEYS_FILE?.trim() || "tests/e2e/fixtures/journeys.json";

const sanitizePathInput = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return trimmed.length ? trimmed : null;
};

function parseCliArgs(argv: string[]): CliOptions {
  let specPathInput: string | null = null;
  let outputPathInput: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--spec" || token === "-s") {
      specPathInput = argv[index + 1] ?? null;
      index += 1;
    } else if (token === "--out" || token === "-o") {
      outputPathInput = argv[index + 1] ?? outputPathInput;
      index += 1;
    }
  }
  const envSpec = sanitizePathInput(process.env.FLOW_SPEC_PATH) ?? sanitizePathInput(process.env.FLOW_SPEC);
  const specPath = sanitizePathInput(specPathInput) ?? envSpec;
  if (!specPath) {
    console.error(
      "Usage: ts-node scripts/generateFlowJourneys.ts --spec <flowSpec.json> [--out tests/e2e/fixtures/journeys.json]",
    );
    process.exit(1);
  }
  const outputPath = sanitizePathInput(outputPathInput) ?? DEFAULT_OUTPUT_FILE;
  return {
    specPath: path.resolve(path.normalize(specPath)),
    outputPath: path.resolve(path.normalize(outputPath)),
  };
}

function normalizeStep(step: FlowOverlayStep, order: number): JourneyStepOutput {
  const normalized: JourneyStepOutput = { order };
  if (step.nodeId) normalized.nodeId = step.nodeId;
  if (step.urlPattern) normalized.urlPattern = step.urlPattern;
  if (step.assertTestId) normalized.assertTestId = step.assertTestId;
  if (step.clickTestId) normalized.clickTestId = step.clickTestId;
  if (step.gateTag) normalized.gateTag = step.gateTag;
  if (step.tags?.length) normalized.tags = step.tags;
  return normalized;
}

function validateJourney(overlay: FlowOverlay, steps: FlowOverlayStep[], errors: string[]) {
  const status = overlay.status ?? "draft";
  if (status !== "active") {
    return;
  }
  const journeyName = overlay.name ?? overlay.id;
  if (!overlay.entryRoutePath) {
    errors.push(`Journey ${journeyName} (active) nu are entryRoutePath.`);
  }
  if (!overlay.exitRoutePath) {
    errors.push(`Journey ${journeyName} (active) nu are exitRoutePath.`);
  }
  steps.forEach((step, index) => {
    const missingUrl = !step.urlPattern;
    const missingAssert = !step.assertTestId;
    const missingClick = !step.clickTestId;
    if (missingUrl || missingAssert || missingClick) {
      errors.push(
        `Journey ${journeyName} (active) are contract incomplet la pasul ${index + 1} (nodeId: ${step.nodeId ?? "n/a"}).`,
      );
    }
  });
}

async function main() {
  const { specPath, outputPath } = parseCliArgs(process.argv.slice(2));
  const specText = await fs.readFile(specPath, "utf-8");
  const specPreview = parseFlowSpecText(specText);
  if (specPreview.warnings.length) {
    console.warn("[generateFlowJourneys] Flow spec warnings:");
    specPreview.warnings.forEach((warning) => console.warn(`  • ${warning}`));
  }
  const overlays = specPreview.overlays ?? [];
  const errors: string[] = [];
  const journeys: JourneyOutput[] = overlays.map((overlay) => {
    const steps = overlay.steps ?? [];
    validateJourney(overlay, steps, errors);
    const formattedSteps = steps.map((step, index) => normalizeStep(step, index + 1));
    const journey: JourneyOutput = {
      id: overlay.id,
      name: overlay.name,
      status: overlay.status,
      entryRoutePath: overlay.entryRoutePath,
      exitRoutePath: overlay.exitRoutePath,
      steps: formattedSteps,
    };
    return journey;
  });
  if (errors.length) {
    console.error("[generateFlowJourneys] Spec invalid:");
    errors.forEach((error) => console.error(`  • ${error}`));
    process.exit(1);
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    flowId: specPreview.flow.id ?? null,
    flowName: specPreview.flow.name ?? null,
    journeys,
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`[generateFlowJourneys] ${journeys.length} journeys scrise în ${outputPath}`);
}

main().catch((error) => {
  console.error("[generateFlowJourneys] Eșec:", error);
  process.exit(1);
});
