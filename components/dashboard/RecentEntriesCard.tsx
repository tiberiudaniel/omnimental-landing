import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProgressFact, RecentEntry } from "@/lib/progressFacts";
import { toMsLocal } from "@/lib/dashboard/progressSelectors";

type RecentEntriesCardProps = {
  lang: string;
  facts: ProgressFact | null;
};

export function RecentEntriesCard({ lang, facts }: RecentEntriesCardProps) {
  const entries = (facts?.recentEntries as RecentEntry[] | undefined) ?? [];
  const normalized = entries
    .map((entry) => ({
      text: String(entry?.text ?? "").trim(),
      ms: toMsLocal(entry?.timestamp),
      tabId: entry?.tabId ? String(entry.tabId) : undefined,
      sourceType: entry?.sourceType ?? null,
      moduleId: entry?.moduleId ?? null,
      lessonId: entry?.lessonId ?? null,
      lessonTitle: entry?.lessonTitle ?? null,
    }))
    .filter((entry) => entry.text.length > 0 && entry.ms > 0)
    .sort((a, b) => b.ms - a.ms);
  const deduped: typeof normalized = [];
  const seenTexts = new Set<string>();
  for (const item of normalized) {
    const key = item.text.toLowerCase();
    if (seenTexts.has(key)) continue;
    seenTexts.add(key);
    deduped.push(item);
  }
  const limited = deduped.slice(0, 3);
  const grouped = (() => {
    if (!limited.length) return [];
    const fmtDay = (ms: number) => {
      try {
        return new Date(ms).toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return "";
      }
    };
    const result: Record<string, typeof limited> = {};
    for (const item of limited) {
      const dayKey = fmtDay(item.ms);
      if (!dayKey) continue;
      if (!result[dayKey]) result[dayKey] = [];
      result[dayKey].push(item);
    }
    return Object.entries(result).map(([day, items]) => ({ day, items }));
  })();
  const hasEntries = grouped.length > 0;
  const fmtTime = (ms: number) => {
    try {
      return new Date(ms).toLocaleTimeString(lang === "ro" ? "ro-RO" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };
  const tabLabel = (tabId?: string) => {
    switch (tabId) {
      case "SCOP_INTENTIE":
        return lang === "ro" ? "Scop & intenție" : "Goal & intent";
      case "MOTIVATIE_REZURSE":
        return lang === "ro" ? "Motivație & resurse" : "Motivation & resources";
      case "PLAN_RECOMANDARI":
        return lang === "ro" ? "Plan & recomandări" : "Plan & recommendations";
      case "OBSERVATII_EVALUARE":
        return lang === "ro" ? "Observații & evaluare" : "Observations & review";
      case "NOTE_LIBERE":
        return lang === "ro" ? "Note libere" : "Free notes";
      default:
        return lang === "ro" ? "Jurnal" : "Journal";
    }
  };
  const entryHref = (item: (typeof limited)[number]) => {
    if (item.sourceType === "omniKuno_lesson" && item.moduleId) {
      const query: Record<string, string> = { module: item.moduleId };
      if (item.lessonId) query.lesson = item.lessonId;
      return { pathname: "/omni-kuno", query };
    }
    const tab = item.tabId ?? "OBSERVATII_EVALUARE";
    return { pathname: "/progress", query: { open: "journal", tab } };
  };
  return (
    <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-2.5 sm:p-3.5">
      <div className="mb-1 flex items-center justify-between sm:mb-2">
        <h4 className="text-xs font-semibold text-[var(--omni-muted)] sm:text-sm">{lang === "ro" ? "Însemnări recente" : "Recent Entries"}</h4>
        <div className="flex items-center gap-1">
          <Link
            href={{ pathname: "/progress", query: { open: "journal" } }}
            className="rounded-[10px] border border-[var(--omni-border-soft)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)] sm:px-2 sm:text-[10px]"
            aria-label="Open journal"
          >
            {lang === "ro" ? "Jurnal" : "Journal"}
          </Link>
        </div>
      </div>
      {!hasEntries ? (
        <p className="rounded-[10px] border border-[#F0E8E0] bg-[var(--omni-bg-paper)] px-2 py-1.5 text-[11px] text-[#6A6A6A] sm:px-2.5 sm:py-2 sm:text-xs">
          {lang === "ro" ? "Nimic deocamdată. Scrie un jurnal sau finalizează un exercițiu." : "Nothing yet. Add a journal entry or complete a practice."}
        </p>
      ) : (
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.day}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--omni-muted)] sm:text-[11px]">{group.day}</p>
              {group.items.map((item, idx) => {
                const href = entryHref(item);
                const full = String(item.text);
                const MAX_PREVIEW = 80;
                const short = full.length > MAX_PREVIEW ? `${full.slice(0, MAX_PREVIEW).trimEnd()}…` : full;
                const isKuno = item.sourceType === "omniKuno_lesson";
                const tag = isKuno ? (lang === "ro" ? "Din OmniKuno" : "From OmniKuno") : lang === "ro" ? "Din jurnal" : "From Journal";
                const title = isKuno
                  ? item.lessonTitle || (lang === "ro" ? "Lecție OmniKuno" : "OmniKuno lesson")
                  : tabLabel(item.tabId);
                return (
                  <div
                    key={`${group.day}-${idx}`}
                    className="mb-1.5 border-b border-[#F0E8E0] pb-1.5 last:border-b-0 last:pb-0 sm:mb-2.5 sm:pb-2"
                    data-testid={isKuno ? "recent-entry-omnikuno-item" : undefined}
                  >
                    <div className="mb-0.5 flex items-center justify-between">
                      <span
                        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[var(--omni-muted)]"
                        data-testid={isKuno ? "recent-entry-omnikuno" : undefined}
                      >
                        {tag}
                      </span>
                      <span className="text-[9px] text-[var(--omni-muted)]" suppressHydrationWarning>
                        {fmtTime(item.ms)}
                      </span>
                    </div>
                    <Link
                      href={href}
                      className="block text-[11px] font-semibold text-[var(--omni-ink)] underline-offset-2 hover:underline sm:text-xs"
                      title={title}
                      data-testid={isKuno ? "recent-entry-link" : undefined}
                    >
                      {title}
                    </Link>
                    <Link
                      href={href}
                      className="mt-0.5 block text-[11px] text-[var(--omni-ink-soft)] underline-offset-2 hover:underline sm:text-xs"
                      title={full}
                    >
                      {short}
                    </Link>
                    {isKuno ? (
                      <Link
                        href={href}
                        className="mt-1 inline-flex text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] underline-offset-4 hover:underline sm:text-[10px]"
                        data-testid="recent-entry-back-to-lesson"
                      >
                        {lang === "ro" ? "Înapoi la lecție" : "Back to lesson"}
                      </Link>
                    ) : null}
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
          className="text-[10px] text-[var(--omni-muted)] underline-offset-2 transition hover:text-[var(--omni-ink)] hover:underline"
        >
          {lang === "ro" ? "Vezi tot" : "See all"}
        </Link>
      </div>
    </Card>
  );
}
