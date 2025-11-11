"use client";

type QuestItem = { title?: string; description?: string; completed?: boolean };

type Props = {
  lang: "ro" | "en";
  quests?: QuestItem[];
  evaluationsCount?: number;
};

export default function LatestEntries({ lang, quests = [], evaluationsCount = 0 }: Props) {
  const items = [] as { text: string }[];
  if (quests.length) {
    items.push({ text: (quests[0].title ?? fallbackQuest(lang)) });
  }
  if (evaluationsCount > 0) {
    items.push({ text: lang === "ro" ? "Ai completat o evaluare Omni‑Intel." : "You completed an Omni‑Intel evaluation." });
  }
  return (
    <section className="mx-auto mb-6 max-w-5xl">
      <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
        <p className="mb-3 text-sm font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "Ultimele înregistrări" : "Latest entries"}
        </p>
        {items.length === 0 ? (
          <p className="text-xs text-[#7A6455]">
            {lang === "ro" ? "Nu există încă înregistrări." : "No entries yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((e, i) => (
              <li key={`entry-${i}`} className="rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-3 py-2 text-sm text-[#2C2C2C]">
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

