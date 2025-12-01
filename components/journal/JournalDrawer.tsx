"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJournal, type JournalContext } from "./useJournal";
import { useProgressFacts } from "@/components/useProgressFacts";
import { deleteRecentEntry, type RecentEntry } from "@/lib/progressFacts";
import Toast from "../Toast";
import { useTStrings } from "../useTStrings";
import type { JournalTabId } from "@/lib/journal";

export type JournalDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null | undefined;
  context?: JournalContext;
  initialTab?: JournalTabId;
};

function useTabStrings() {
  const { s } = useTStrings();
  const label = (id: JournalTabId) =>
    s(
      `journal.tabs.${
        id === "SCOP_INTENTIE"
          ? "scop_intentie"
          : id === "MOTIVATIE_REZURSE"
          ? "motivatie_resurse"
          : id === "PLAN_RECOMANDARI"
          ? "plan_recomandari"
          : id === "OBSERVATII_EVALUARE"
          ? "observatii_evaluare"
          : "note_libere"
      }.label`,
      // fallbacks
      id,
    );
  const placeholder = (id: JournalTabId) =>
    s(
      `journal.tabs.${
        id === "SCOP_INTENTIE"
          ? "scop_intentie"
          : id === "MOTIVATIE_REZURSE"
          ? "motivatie_resurse"
          : id === "PLAN_RECOMANDARI"
          ? "plan_recomandari"
          : id === "OBSERVATII_EVALUARE"
          ? "observatii_evaluare"
          : "note_libere"
      }.placeholder`,
      "",
    );
  const status = {
    autosave: s("journal.status.autosave", "Se salvează automat."),
    loading: s("journal.status.loading", "Se încarcă…"),
    saving: s("journal.status.saving", "Salvez…"),
    saved: s("journal.status.saved", "Salvat"),
    title: s("journal.title", "Jurnal personal"),
    relatedPrefix: s("journal.relatedPrefix", "Legat de:"),
    suggestionsTitle: s("journal.suggestionsTitle", "Sugestii din ce ai completat:"),
  };
  return { label, placeholder, status };
}

export function JournalDrawer({ open, onOpenChange, userId, context, initialTab }: JournalDrawerProps) {
  const { loading, saving, tabs, setTabText, saveTab, scheduleSave } = useJournal(userId);
  const { data: facts } = useProgressFacts(userId ?? null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<JournalTabId>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== "undefined") {
      const stored =
        (window.localStorage.getItem("journalLastEditedTab") as JournalTabId | null) ??
        (window.localStorage.getItem("journalActiveTab") as JournalTabId | null);
      if (stored) return stored;
    }
    return "SCOP_INTENTIE";
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [loadedBlink, setLoadedBlink] = useState(false);
  const { label: tabLabel, placeholder: tabPlaceholder, status } = useTabStrings();

  const currentText = tabs[activeTab] ?? "";
  const [historyScope, setHistoryScope] = useState<"tab" | "all">("tab");
  const [historySearch, setHistorySearch] = useState("");
  // Recent history for the active tab (from progress facts)
  const toMs = (v: unknown): number => {
    if (!v) return 0;
    if (typeof v === "number") return v;
    if (v instanceof Date) return v.getTime();
    try {
      const t = (v as { toDate?: () => Date } | undefined)?.toDate?.();
      if (t instanceof Date) return t.getTime();
    } catch {}
    return 0;
  };
  const MAX_PREVIEW = 60;
  const history = (() => {
    const list: RecentEntry[] = Array.isArray(facts?.recentEntries)
      ? (facts!.recentEntries as RecentEntry[])
      : [];
    const filtered = historyScope === "tab" ? list.filter((e) => (e?.tabId ? e.tabId === activeTab : true)) : list;
    return filtered
      .map((e) => {
        const full = String(e?.text ?? "");
        const preview = full.length > MAX_PREVIEW ? full.slice(0, MAX_PREVIEW).trimEnd() + "…" : full;
        return { text: full, preview, ms: toMs(e?.timestamp), tabId: (e?.tabId as string | undefined) };
      })
      .filter((e) => e.text.trim().length > 0)
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 8);
  })();
  const historyFiltered = (() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) => h.text.toLowerCase().includes(q));
  })();
  const tabIdLabel = (id: string | undefined) => {
    switch (id) {
      case "SCOP_INTENTIE": return "Scop & intenție";
      case "MOTIVATIE_REZURSE": return "Motivație & resurse";
      case "PLAN_RECOMANDARI": return "Plan & recomandări";
      case "OBSERVATII_EVALUARE": return "Observații & evaluare";
      case "NOTE_LIBERE": return "Note libere";
      default: return "—";
    }
  };
  const showSuggested =
    activeTab === "OBSERVATII_EVALUARE" &&
    (context?.suggestedSnippets?.length ?? 0) > 0 &&
    !currentText;

  useEffect(() => {
    if (!open) {
      void (async () => {
        const res = await saveTab(activeTab, context);
        if (res === "cloud") setToastMsg("Salvat în cont");
        else if (res === "local") setToastMsg("Salvat local");
      })();
    }
  }, [open, activeTab, context, saveTab]);

  // Focus automat când se deschide
  useEffect(() => {
    if (open && textareaRef.current) {
      // mic delay pentru a asigura montarea
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, activeTab]);

  // Switch active tab based on initialTab when opening from deep link
  useEffect(() => {
    if (open && initialTab && initialTab !== activeTab) {
      setTimeout(() => setActiveTab(initialTab), 0);
    }
  }, [open, initialTab, activeTab]);

  // ESC pentru închidere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const allTabs = useMemo(
    () => [
      "SCOP_INTENTIE",
      "MOTIVATIE_REZURSE",
      "PLAN_RECOMANDARI",
      "OBSERVATII_EVALUARE",
      "NOTE_LIBERE",
    ] as JournalTabId[],
    [],
  );

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={open ? "false" : "true"}
      data-testid="journal-drawer"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        style={{ background: (typeof window !== 'undefined' && window.location.pathname.startsWith('/wizard')) ? 'rgba(253, 252, 249, 0.85)' : 'rgba(0,0,0,0.2)' }}
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <aside className={`absolute right-0 top-0 h-full w-full sm:max-w-sm ${open ? "translate-x-0" : "translate-x-full"} transform border-l border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] shadow-[0_10px_40px_rgba(0,0,0,0.15)] transition-transform`}>
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-2 border-b border-[var(--omni-border-soft)] px-3 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{status.title}</p>
              <h2 className="text-base font-semibold text-[var(--omni-ink)]">
                {context?.theme ? `${status.relatedPrefix} ${context.theme}` : "Noteaza ceea ce este interesant si util."}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Ascunde jurnalul"
              data-testid="journal-close"
              className="rounded-full p-1 text-[var(--omni-muted)] hover:bg-[var(--omni-bg-paper)]"
              onClick={() => onOpenChange(false)}
            >
              ×
            </button>
          </header>
          <div className="flex-1 overflow-auto px-3 py-3">
            {/* Tabs */}
            <div className="mb-3 flex w-full flex-wrap gap-2 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none" }}>
              {allTabs.map((tabId) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={async () => {
                    await saveTab(activeTab, context);
                    setActiveTab(tabId);
                  }}
                  className={`rounded-[10px] border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
                    activeTab === tabId
                      ? "border-[var(--omni-energy-soft)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                      : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[#C9B8A8]"
                  }`}
                >
                  {tabLabel(tabId)}
                </button>
              ))}
            </div>

            {showSuggested ? (
              <div className="mb-3 rounded-[10px] border border-[#EDE6DE] bg-[var(--omni-bg-paper)] p-3 text-xs text-[var(--omni-ink)]">
                <div className="mb-1 font-medium">{status.suggestionsTitle}</div>
                <ul className="list-inside list-disc space-y-1">
                  {context!.suggestedSnippets!.map((snip, idx) => (
                    <li key={`${snip}-${idx}`}>{snip}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              className={`min-h-[160px] md:min-h-[220px] w-full resize-none rounded-[10px] border bg-[var(--omni-surface-card)] p-3 text-sm md:text-[13px] text-[var(--omni-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-energy)] ${loadedBlink ? 'border-emerald-500 ring-2 ring-emerald-400 transition-shadow' : 'border-[var(--omni-border-soft)]'}`}
              placeholder={(() => {
                if (context?.sourceBlock === 'initiation.journal' && activeTab === 'NOTE_LIBERE' && !currentText) {
                  return 'Scrie 2 propoziții (~60 caractere) despre ce observi acum. Apoi închide jurnalul.';
                }
                return tabPlaceholder(activeTab);
              })()}
              value={currentText}
              data-testid="journal-text"
              onChange={(e) => {
                setTabText(activeTab, e.target.value);
                scheduleSave(activeTab, context);
              }}
              onBlur={async () => {
                const before = (tabs[activeTab] ?? "").trim();
                const res = await saveTab(activeTab, context);
                if (before) setToastMsg(res === "cloud" ? "Salvat în cont" : res === "local" ? "Salvat local" : "Jurnal salvat");
              }}
            />

            {/* History for current tab */}
            {history.length > 0 ? (
              <div className="mt-3 rounded-[10px] border border-[#EDE6DE] bg-[var(--omni-bg-paper)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">Istoric</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Caută în istoric…"
                      className="rounded-[8px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-2 py-1 text-[10px] text-[var(--omni-ink)] focus:outline-none"
                    />
                    <div className="inline-flex rounded-md border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setHistoryScope("tab")}
                        className={`rounded px-2 py-0.5 ${historyScope === 'tab' ? 'bg-[var(--omni-bg-paper)] font-semibold text-[var(--omni-ink)]' : 'text-[var(--omni-muted)]'}`}
                        title="Doar intrările din tab-ul curent"
                      >
                        Doar acest tab
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryScope("all")}
                        className={`rounded px-2 py-0.5 ${historyScope === 'all' ? 'bg-[var(--omni-bg-paper)] font-semibold text-[var(--omni-ink)]' : 'text-[var(--omni-muted)]'}`}
                        title="Toate intrările"
                      >
                        Toate
                      </button>
                    </div>
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        className="rounded-[8px] border border-[var(--omni-border-soft)] px-2 py-1 text-[10px] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
                        onClick={async () => {
                          const content = historyFiltered
                            .map((h) => `${new Date(h.ms).toLocaleString()}\n${h.text}`)
                            .join("\n\n---\n\n");
                          try {
                            await navigator.clipboard.writeText(content);
                            setToastMsg("Istoric copiat");
                          } catch {
                            setToastMsg("Nu am putut copia");
                          }
                        }}
                        title="Copiază în clipboard"
                      >
                        Copiază
                      </button>
                      <button
                        type="button"
                        className="rounded-[8px] border border-[var(--omni-border-soft)] px-2 py-1 text-[10px] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
                        onClick={() => {
                          const now = new Date();
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const fname = `journal-history-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.txt`;
                          const content = historyFiltered
                            .map((h) => `${new Date(h.ms).toLocaleString()}\n${h.text}`)
                            .join("\n\n---\n\n");
                          const blob = new Blob([content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = fname;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        title="Descarcă .txt"
                      >
                        Descarcă .txt
                      </button>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {historyFiltered.map((h, idx) => (
                    <li key={`${h.ms}-${idx}`} className="border-b border-[#F0E8E0] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {historyScope === 'all' ? (
                            <div className="mb-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--omni-muted)]">{tabIdLabel(h.tabId)}</div>
                          ) : null}
                          <p className="text-[11px] leading-relaxed text-[var(--omni-ink)]" title={h.text}>{h.preview}</p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-[8px] border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
                          onClick={() => {
                            setTabText(activeTab, h.text);
                            scheduleSave(activeTab, context);
                            try {
                              textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              textareaRef.current?.focus();
                            } catch {}
                            setLoadedBlink(true);
                            setTimeout(() => setLoadedBlink(false), 700);
                            setToastMsg('Încărcat în editor');
                          }}
                          title="Încarcă în editor"
                        >
                          Încarcă
                        </button>
                        <button
                          type="button"
                          className="shrink-0 rounded-[8px] border border-[#F0B8B8] px-2 py-0.5 text-[10px] text-[#8A1F11] hover:border-[var(--omni-danger)]"
                          onClick={async () => {
                            await deleteRecentEntry({ text: h.text, timestamp: new Date(h.ms) }, userId ?? undefined);
                            setToastMsg('Șters');
                          }}
                          title="Șterge intrarea"
                        >
                          Șterge
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--omni-muted)]">
                        {(() => {
                          try {
                            return new Date(h.ms).toLocaleString();
                          } catch {
                            return String(h.ms);
                          }
                        })()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <footer className="border-t border-[var(--omni-border-soft)] p-3 text-[10px] text-[var(--omni-muted)]">
            <div className="flex items-center justify-between gap-2">
              <span>{status.autosave}</span>
              {loading ? (
                <span>{status.loading}</span>
              ) : saving ? (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--omni-muted)]" />
                  {status.saving}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {status.saved}
                </span>
              )}
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 rounded-[8px] border border-[var(--omni-border-soft)] px-2 py-1 text-[10px] text-[var(--omni-ink)] hover:border-[#C9B8A8]"
                onClick={() => onOpenChange(false)}
              >
                Închide
              </button>
            </div>
          </footer>
        </div>
      </aside>
      {toastMsg ? (
        <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md px-4">
          <Toast message={toastMsg} okLabel="OK" onClose={() => setToastMsg(null)} />
        </div>
      ) : null}
    </div>
  );
}
