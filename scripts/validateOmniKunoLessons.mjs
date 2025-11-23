#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const MODULE_PREFIXES = [
  "emotional_balance",
  "focus_clarity",
  "relationships_communication",
  "energy_body",
  "self_trust",
  "decision_discernment",
];

const DOC_SOURCES = MODULE_PREFIXES.map((prefix) => ({
  prefix,
  path: new URL(`../DOCS/DOCS/omniKuno_${prefix}.md`, import.meta.url),
}));

const DOC_HEADING_REGEX = /^#\s+([a-z0-9_]+)/gim;
const CONFIG_ID_REGEX = /id:\s*"([^"]+)"/g;
const CONTENT_ID_REGEX = /["']lessonId["']\s*:\s*["']([^"']+)["']/g;

const lessonPrefixRegex = new RegExp(`^(?:${MODULE_PREFIXES.join("|")})_`, "i");

const isLessonId = (value) =>
  typeof value === "string" &&
  lessonPrefixRegex.test(value) &&
  !value.includes("_arc_") &&
  !value.endsWith("_arc") &&
  !value.endsWith("_final_test");

const normalizeId = (value) => value.trim();

async function collectDocIds() {
  const ids = new Set();
  for (const doc of DOC_SOURCES) {
    try {
      const content = await readFile(doc.path, "utf8");
      DOC_HEADING_REGEX.lastIndex = 0;
      let match;
      while ((match = DOC_HEADING_REGEX.exec(content))) {
        const id = normalizeId(match[1]);
        if (isLessonId(id)) {
          ids.add(id);
        }
      }
    } catch (error) {
      console.warn(`Could not read ${doc.path.pathname}: ${error.message}`);
    }
  }
  return ids;
}

async function collectConfigIds() {
  const file = new URL("../config/omniKunoLessons.ts", import.meta.url);
  const content = await readFile(file, "utf8");
  const ids = new Set();
  CONFIG_ID_REGEX.lastIndex = 0;
  let match;
  while ((match = CONFIG_ID_REGEX.exec(content))) {
    const id = normalizeId(match[1]);
    if (isLessonId(id)) {
      ids.add(id);
    }
  }
  return ids;
}

async function collectContentIds() {
  const file = new URL("../config/omniKunoLessonContent.ts", import.meta.url);
  const content = await readFile(file, "utf8");
  const ids = new Set();
  CONTENT_ID_REGEX.lastIndex = 0;
  let match;
  while ((match = CONTENT_ID_REGEX.exec(content))) {
    const id = normalizeId(match[1]);
    if (isLessonId(id)) {
      ids.add(id);
    }
  }
  return ids;
}

const difference = (a, b) => Array.from(a).filter((entry) => !b.has(entry)).sort();

function printSection(label, entries) {
  console.log(`\n[${label}]`);
  if (!entries.length) {
    console.log("- none");
    return;
  }
  entries.forEach((entry) => console.log(`- ${entry}`));
}

async function main() {
  const [docIds, configIds, contentIds] = await Promise.all([
    collectDocIds(),
    collectConfigIds(),
    collectContentIds(),
  ]);

  const docOnly = difference(docIds, configIds);
  const configOnly = difference(configIds, docIds);
  const configMissingContent = difference(configIds, contentIds);
  const contentOnly = difference(contentIds, configIds);

  printSection("DOC_ONLY", docOnly);
  printSection("CONFIG_ONLY", configOnly);
  printSection("CONFIG_MISSING_CONTENT", configMissingContent);
  printSection("CONTENT_ONLY", contentOnly);
}

main().catch((error) => {
  console.error("[validate-omnikuno-lessons] Unexpected error:", error);
  process.exitCode = 1;
});
