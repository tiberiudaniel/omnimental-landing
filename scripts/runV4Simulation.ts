#!/usr/bin/env ts-node

import process from "node:process";
import { simulateV4Progress } from "@/lib/simulation/v4Simulator";

type CliArgs = {
  user: string | null;
  days: number;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let user: string | null = process.env.USER_ID ?? null;
  let days = Number(process.env.DAYS ?? process.env.SIM_DAYS ?? 5);
  for (const chunk of args) {
    if (chunk.startsWith("--user=")) {
      user = chunk.split("=")[1] ?? user;
    } else if (chunk.startsWith("--days=")) {
      const parsed = Number(chunk.split("=")[1]);
      if (!Number.isNaN(parsed)) days = parsed;
    }
  }
  return { user, days: Math.max(1, Math.floor(days || 1)) };
}

async function main() {
  const { user, days } = parseArgs();
  if (!user) {
    console.error("Usage: ts-node scripts/runV4Simulation.ts --user=USER_ID [--days=5]");
    process.exit(1);
  }
  console.log(`[v4-sim] Running simulation for ${user} (${days} zile)…`);
  await simulateV4Progress(user, { days, pretendDates: true });
  console.log("[v4-sim] Done.");
}

void main();
