"use client";

import { useState } from "react";
import { buildIndicatorSummary } from "@/lib/indicators";
import { recordQuestCompletion, recordQuestProgressFact } from "@/lib/progressFacts";
import type { QuestSuggestion } from "@/lib/quests";

type Props = {
  lang: "ro" | "en";
  categories: Array<{ category: string; count: number }>;
  items?: Array<QuestSuggestion & { completed?: boolean }>;
};

export default function QuestsList({ lang, categories, items = [] }: Props) {
  const [busy, setBusy] = useState(false);
  const { chart } = buildIndicatorSummary(categories);
  void chart; // reserved for smarter generation later

  const generate = async () => {
    setBusy(true);
    try {
      const baseCta = lang === "ro" ? "Începe" : "Start";
      const now = Date.now();
      const quests: QuestSuggestion[] = [
        {
          id: `q-reflection-${now}`,
          scriptId: "manual-reflection",
          type: "reflect",
          title: lang === "ro" ? "Reflectă 5 minute" : "Reflect 5 minutes",
          body: lang === "ro" ? "Scrie 5 fraze despre ce simți acum." : "Write 5 lines about how you feel now.",
          ctaLabel: baseCta,
          priority: 5,
          contextSummary: lang === "ro" ? "Quick reflection" : "Quick reflection",
        },
        {
          id: `q-action-${now + 1}`,
          scriptId: "manual-action",
          type: "practice",
          title: lang === "ro" ? "Exercițiu de 3 minute" : "3‑minute practice",
          body: lang === "ro" ? "Respirație 3×3×3 pentru reglare." : "3×3×3 breathing for regulation.",
          ctaLabel: baseCta,
          priority: 6,
          contextSummary: lang === "ro" ? "Quick practice" : "Quick practice",
        },
        {
          id: `q-tracking-${now + 2}`,
          scriptId: "manual-tracking",
          type: "reflect",
          title: lang === "ro" ? "Check‑in seara" : "Evening check‑in",
          body: lang === "ro" ? "Notează 1 lucru care ți-a ieșit bine." : "Note one thing that went well.",
          ctaLabel: baseCta,
          priority: 7,
          contextSummary: lang === "ro" ? "Daily check‑in" : "Daily check‑in",
        },
      ];
      await recordQuestProgressFact({ quests });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1F1F1F]">{lang === "ro" ? "Quest‑uri active" : "Active quests"}</h3>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
        >
          {lang === "ro" ? "Generează" : "Generate"}
        </button>
      </header>
      {items.length === 0 ? (
        <p className="text-xs text-[#7A6455]">{lang === "ro" ? "Vor apărea aici după generare." : "They will appear after generation."}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((q) => (
            <li key={q.id} className="flex items-center justify-between rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-3 py-2 text-sm text-[#2C2C2C]">
              <div>
                <p className="font-semibold">{q.title}</p>
                {q.body ? <p className="text-xs text-[#7A6455]">{q.body}</p> : null}
              </div>
              <button
                type="button"
                disabled={busy || q.completed}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await recordQuestCompletion();
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-[10px] border border-[#2C2C2C] px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
              >
                {q.completed ? (lang === "ro" ? "Finalizat" : "Completed") : (lang === "ro" ? "Completează" : "Complete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
