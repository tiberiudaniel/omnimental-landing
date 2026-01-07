import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { DailyPracticeDoc } from "@/types/dailyPractice";

dotenv.config({ path: ".env.local" });

type DurationStats = {
  count: number;
  totalSeconds: number;
  minSeconds: number;
};

function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractModuleId(configId: string | null | undefined): string | null {
  if (!configId) return null;
  const idx = configId.indexOf("-");
  if (idx === -1) return configId;
  const moduleId = configId.slice(idx + 1);
  return moduleId || configId;
}

function usage() {
  console.info("Usage: ts-node scripts/updateDurationBenchmarks.ts [--days=60] [--min-samples=8]");
}

async function main() {
  const args = process.argv.slice(2);
  let windowDays = Number(process.env.DURATION_WINDOW_DAYS ?? 60);
  let minSamples = Number(process.env.DURATION_MIN_SAMPLES ?? 5);

  for (const chunk of args) {
    if (chunk === "--help" || chunk === "-h") {
      usage();
      process.exit(0);
    }
    if (chunk.startsWith("--days=")) {
      const parsed = Number(chunk.split("=")[1]);
      if (!Number.isNaN(parsed)) {
        windowDays = Math.max(1, Math.floor(parsed));
      }
    } else if (chunk.startsWith("--min-samples=")) {
      const parsed = Number(chunk.split("=")[1]);
      if (!Number.isNaN(parsed)) {
        minSamples = Math.max(1, Math.floor(parsed));
      }
    }
  }

  const db = getAdminDb();
  const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const cutoffKey = formatDateKey(cutoffDate);
  console.log(`[duration-benchmarks] Collecting docs since ${cutoffKey} (${windowDays} zile)…`);

  const snapshot = await db
    .collection("dailyPractice")
    .where("date", ">=", cutoffKey)
    .get();

  console.log(`[duration-benchmarks] Read ${snapshot.size} dailyPractice docs.`);

  const stats = new Map<string, DurationStats>();
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DailyPracticeDoc;
    if (!data.completed) return;
    if (typeof data.durationSeconds !== "number" || data.durationSeconds <= 0) return;
    const moduleId = extractModuleId(data.configId);
    if (!moduleId) return;
    const entry = stats.get(moduleId) ?? { count: 0, totalSeconds: 0, minSeconds: Number.POSITIVE_INFINITY };
    entry.count += 1;
    entry.totalSeconds += data.durationSeconds;
    entry.minSeconds = Math.min(entry.minSeconds, data.durationSeconds);
    stats.set(moduleId, entry);
  });

  const payload: Record<string, { avgSeconds: number; minSeconds: number; sampleSize: number; updatedAt: string }> = {};
  const updatedAt = new Date().toISOString();

  stats.forEach((entry, moduleId) => {
    if (entry.count < minSamples) return;
    const avgSeconds = entry.totalSeconds / entry.count;
    payload[moduleId] = {
      avgSeconds: Number(avgSeconds.toFixed(1)),
      minSeconds: Math.round(entry.minSeconds),
      sampleSize: entry.count,
      updatedAt,
    };
  });

  const outputPath = path.resolve(process.cwd(), "generated", "duration-benchmarks.json");
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`[duration-benchmarks] Wrote ${Object.keys(payload).length} modules to ${outputPath}`);
}

main().catch((error) => {
  console.error("[duration-benchmarks] Failed to update metrics", error);
  process.exit(1);
});
