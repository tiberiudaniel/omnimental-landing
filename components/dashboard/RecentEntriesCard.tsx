import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProgressFact } from "@/lib/progressFacts";
import { toMsLocal } from "@/lib/dashboard/progressSelectors";

type RecentEntriesCardProps = {
  lang: string;
  facts: ProgressFact | null;
};

export function RecentEntriesCard({ lang, facts }: RecentEntriesCardProps) {
  const entries = (facts?.recentEntries as Array<{ text?: string; timestamp?: unknown; tabId?: string }> | undefined) ?? [];
  const hasEntries = entries.length > 0;
  const grouped = (() => {
    if (!hasEntries) return [];
    const sorted = entries
      .map((e) => ({ ...e, _ms: toMsLocal(e.timestamp), _text: String(e.text ?? "").trim() }))
      .sort((a, b) => b._ms - a._ms);
    const dedup: Array<(typeof sorted)[number]> = [];
    const seen = new Set<string>();
    for (const item of sorted) {
      const key = item._text;
      if (key && !seen.has(key)) {
        seen.add(key);
        dedup.push(item);
      }
    }
    const items = dedup.slice(0, 2);
    const groups: Record<string, Array<{ text: string; ms: number; tab?: string }>> = {};
    const fmtDay = (ms: number) => {
      try {
        return new Date(ms).toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", { year: "numeric", month: "short", day: "numeric" });
      } catch {
        return "";
      }
    };
    for (const it of items) {
      if (!it._ms) continue;
      const day = fmtDay(it._ms);
      if (!day) continue;
      if (!groups[day]) groups[day] = [];
      groups[day].push({ text: it._text || "-", ms: it._ms, tab: it.tabId });
    }
    return Object.entries(groups).map(([day, list]) => ({ day, items: list }));
  })();
  const fmtTime = (ms: number) => {
    try {
      return new Date(ms).toLocaleTimeString(lang === "ro" ? "ro-RO" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };
  return (
    <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3.5">
      <div className="mb-1 flex items-center justify-between sm:mb-2">
        <h4 className="text-xs font-semibold text-[#7B6B60] sm:text-sm">{lang === "ro" ? "Însemnări recente" : "Recent Entries"}</h4>
        <div className="flex items-center gap-1">
          <Link
            href={{ pathname: "/progress", query: { open: "journal" } }}
            className="rounded-[10px] border border-[#2C2C2C] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] sm:px-2 sm:text-[10px]"
            aria-label="Open journal"
          >
            {lang === "ro" ? "Jurnal" : "Journal"}
          </Link>
        </div>
      </div>
      {!hasEntries ? (
        <p className="rounded-[10px] border border-[#F0E8E0] bg-[#FFFBF7] px-2 py-1.5 text-[11px] text-[#6A6A6A] sm:px-2.5 sm:py-2 sm:text-xs">
          {lang === "ro" ? "Nimic deocamdată. Scrie un jurnal sau finalizează un exercițiu." : "Nothing yet. Add a journal entry or complete a practice."}
        </p>
      ) : (
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.day}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A08F82] sm:text-[11px]">{group.day}</p>
              {group.items.map((item, idx) => {
                const tab = typeof item.tab === "string" && item.tab ? item.tab : "OBSERVATII_EVALUARE";
                const href = { pathname: "/progress", query: { open: "journal", tab } } as const;
                const full = String(item.text);
                const MAX_PREVIEW = 60;
                const short = full.length > MAX_PREVIEW ? `${full.slice(0, MAX_PREVIEW).trimEnd()}…` : full;
                return (
                  <div key={`${group.day}-${idx}`} className="mb-1.5 border-b border-[#F0E8E0] pb-1.5 last:border-b-0 last:pb-0 sm:mb-2.5 sm:pb-2">
                    <Link href={href} className="block truncate text-[11px] text-[#2C2C2C] underline-offset-2 hover:underline sm:text-xs" title={full}>
                      {short}
                    </Link>
                    <p className="mt-0.5 text-[9px] text-[#A08F82] sm:mt-1 sm:text-[10px]" suppressHydrationWarning>
                      {fmtTime(item.ms)}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center justify-end sm:mt-2">
        <Link
          href={{ pathname: "/progress", query: { open: "journal" } }}
          className="text-[10px] text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
        >
          {lang === "ro" ? "Vezi tot" : "See all"}
        </Link>
      </div>
    </Card>
  );
}
