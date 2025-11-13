"use client";

import { useState } from "react";
import { recordPracticeSession } from "@/lib/progressFacts";
import SiteHeader from "@/components/SiteHeader";

function addDays(ms: number, days: number) {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export default function SeedPracticePage() {
  const enabled = (process.env.NEXT_PUBLIC_ENABLE_SEED || "").toLowerCase() === "1";
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function seed() {
    setBusy(true);
    setStatus("");
    try {
      const now = Date.now();
      const startOfToday = new Date(now); startOfToday.setHours(8,0,0,0);
      const base = startOfToday.getTime();
      const plan: Array<{ t: "reflection"|"breathing"|"drill"; dayOffset: number; min: number }> = [
        { t: "reflection", dayOffset: -6, min: 6 },
        { t: "breathing", dayOffset: -6, min: 4 },
        { t: "drill", dayOffset: -5, min: 5 },
        { t: "reflection", dayOffset: -4, min: 8 },
        { t: "breathing", dayOffset: -3, min: 3 },
        { t: "drill", dayOffset: -2, min: 10 },
        { t: "reflection", dayOffset: -1, min: 7 },
        { t: "breathing", dayOffset: 0, min: 5 },
      ];
      for (const item of plan) {
        const startedAt = addDays(base, item.dayOffset);
        await recordPracticeSession(item.t, startedAt, item.min * 60);
      }
      setStatus("Seeded 8 practice sessions over 7 days.");
    } catch (e) {
      console.error(e);
      setStatus("Failed. Check console.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-[#1F1F1F]">Seed Practice</h1>
        {!enabled ? (
          <p className="text-sm text-[#7A6455]">Set NEXT_PUBLIC_ENABLE_SEED=1 to enable this tool.</p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={seed}
            className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
          >
            {busy ? "Seeding…" : "Seed last 7 days"}
          </button>
        )}
        {status ? <p className="mt-3 text-sm text-[#2C2C2C]">{status}</p> : null}
      </main>
    </div>
  );
}

