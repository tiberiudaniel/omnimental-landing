"use client";

type QuestItem = { title?: string; description?: string; completed?: boolean };

type Props = {
  lang: "ro" | "en";
  quests?: QuestItem[];
  evaluationsCount?: number;
  compact?: boolean;
};

import { useState } from "react";
import { recordAbilityPracticeFact } from "@/lib/progressFacts";

export default function LatestEntries({ lang, quests = [], evaluationsCount = 0, compact = false }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const items = [] as { text: string }[];
  if (quests.length) {
    items.push({ text: (quests[0].title ?? fallbackQuest(lang)) });
  }
  if (evaluationsCount > 0) {
    items.push({ text: lang === "ro" ? "Ai completat o evaluare Omni‑Intel." : "You completed an Omni‑Intel evaluation." });
  }
  if (compact) {
    const text = items.length ? items[0].text : (lang === "ro" ? "Nu există încă înregistrări." : "No entries yet.");
    return (
      <section className="mx-auto mb-4 max-w-5xl">
        <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 shadow-[0_6px_14px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--omni-ink)]">{lang === "ro" ? "Ultimele înregistrări" : "Latest entries"}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await recordAbilityPracticeFact({ exercise: "quick-log" });
                  setMsg(lang === "ro" ? "Am marcat un exercițiu scurt." : "Logged a quick practice.");
                } catch {
                  setMsg(lang === "ro" ? "Nu am putut marca exercițiul." : "Could not log practice.");
                }
              }}
              className="rounded-[10px] border border-[var(--omni-border-soft)] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
            >
              {lang === "ro" ? "Log rapid" : "Quick log"}
            </button>
          </div>
          <div className="mt-2 rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-xs text-[var(--omni-ink)]">
            {msg ?? text}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mb-6 max-w-5xl">
      <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-4 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
        <p className="mb-3 text-sm font-semibold text-[var(--omni-ink)]">
          {lang === "ro" ? "Ultimele înregistrări" : "Latest entries"}
        </p>
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await recordAbilityPracticeFact({ exercise: "quick-log" });
                setMsg(lang === "ro" ? "Am marcat un exercițiu scurt." : "Logged a quick practice.");
              } catch {
                setMsg(lang === "ro" ? "Nu am putut marca exercițiul." : "Could not log practice.");
              }
            }}
            className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
          >
            {lang === "ro" ? "Log rapid" : "Quick log"}
          </button>
          {msg ? <span className="text-xs text-[var(--omni-muted)]">{msg}</span> : null}
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-[var(--omni-muted)]">
            {lang === "ro" ? "Nu există încă înregistrări." : "No entries yet."}
          </p>
        ) : (
          <ul className="max-h-40 space-y-2 overflow-auto">
            {items.map((e, i) => (
              <li key={`entry-${i}`} className="rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-sm text-[var(--omni-ink)]">
                {e.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function fallbackQuest(lang: "ro" | "en") {
  return lang === "ro" ? "Provocare scurtă: micro‑pauză 2 minute." : "Short challenge: 2‑minute micro‑break.";
}
