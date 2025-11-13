"use client";

import { useMemo, useState } from "react";
import { INSIGHTS, type InsightTheme } from "@/lib/insights";
import { getDb } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SeedInsightsPage() {
  const enabled = (process.env.NEXT_PUBLIC_ENABLE_SEED || "").toLowerCase() === "1";
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const payloadByTheme = useMemo(() => {
    const map: Record<InsightTheme, string[]> = {
      Calm: [],
      Clarity: [],
      Energy: [],
      Focus: [],
    };
    INSIGHTS.forEach((i) => map[i.theme].push(i.text));
    return map;
  }, []);

  async function handleSeed() {
    setBusy(true);
    setStatus("");
    try {
      const db = getDb();
      const themes = Object.keys(payloadByTheme) as InsightTheme[];
      for (const theme of themes) {
        const ref = doc(db, "insights", theme);
        await setDoc(ref, { items: payloadByTheme[theme] }, { merge: true });
      }
      setStatus("Seeded insights for Calm/Clarity/Energy/Focus.");
    } catch (e) {
      console.error("seed insights failed", e);
      setStatus("Failed to seed insights. Check console and rules.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-[#1F1F1F]">Seed Insights</h1>
        <p className="mb-6 text-sm text-[#4A3A30]">
          Populate Firestore collection <code>insights</code> with items for each theme.
        </p>
        {!enabled ? (
          <p className="text-sm text-[#7A6455]">
            Seeding is disabled. Set <code>NEXT_PUBLIC_ENABLE_SEED=1</code> in <code>.env.local</code> to enable this page.
          </p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={handleSeed}
            className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
          >
            {busy ? "Seeding…" : "Seed now"}
          </button>
        )}
        {status ? <p className="mt-4 text-sm text-[#2C2C2C]">{status}</p> : null}
      </main>
    </div>
  );
}

