"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJournal, type JournalContext } from "./useJournal";
import { useTStrings } from "../useTStrings";
import type { JournalTabId } from "@/lib/journal";

export type JournalDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null | undefined;
  context?: JournalContext;
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

export function JournalDrawer({ open, onOpenChange, userId, context }: JournalDrawerProps) {
  const { loading, saving, tabs, setTabText, saveTab, scheduleSave } = useJournal(userId);
  const [activeTab, setActiveTab] = useState<JournalTabId>(() => {
    if (typeof window === "undefined") return "SCOP_INTENTIE";
    const raw = window.localStorage.getItem("journalActiveTab") as JournalTabId | null;
    return (raw as JournalTabId) || "SCOP_INTENTIE";
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { label: tabLabel, placeholder: tabPlaceholder, status } = useTabStrings();

  const currentText = tabs[activeTab] ?? "";
  const showSuggested =
    activeTab === "OBSERVATII_EVALUARE" &&
    (context?.suggestedSnippets?.length ?? 0) > 0 &&
    !currentText;

  useEffect(() => {
    if (!open) void saveTab(activeTab, context);
  }, [open, activeTab, context, saveTab]);

  // Focus automat când se deschide
  useEffect(() => {
    if (open && textareaRef.current) {
      // mic delay pentru a asigura montarea
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, activeTab]);

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
    <div className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <aside className={`absolute right-0 top-0 h-full w-full sm:max-w-sm ${open ? "translate-x-0" : "translate-x-full"} transform border-l border-[#E4D8CE] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] transition-transform`}>
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-2 border-b border-[#F0E6DA] px-3 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#A08F82]">{status.title}</p>
              <h2 className="text-base font-semibold text-[#1F1F1F]">
                {context?.theme ? `${status.relatedPrefix} ${context.theme}` : "Notează ce este important pentru tine acum."}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Închide jurnalul"
              className="rounded-full p-1 text-[#7A6455] hover:bg-[#F6F2EE]"
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
                      ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                      : "border-[#E4D8CE] text-[#2C2C2C] hover:border-[#C9B8A8]"
                  }`}
                >
                  {tabLabel(tabId)}
                </button>
              ))}
            </div>

            {showSuggested ? (
              <div className="mb-3 rounded-[10px] border border-[#EDE6DE] bg-[#FFFBF7] p-3 text-xs text-[#2C2C2C]">
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
              className="min-h-[160px] md:min-h-[220px] w-full resize-none rounded-[10px] border border-[#E4D8CE] bg-white p-3 text-sm md:text-[13px] text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
              placeholder={tabPlaceholder(activeTab)}
              value={currentText}
              onChange={(e) => {
                setTabText(activeTab, e.target.value);
                scheduleSave(activeTab, context);
              }}
              onBlur={() => void saveTab(activeTab, context)}
            />
          </div>
          <footer className="border-t border-[#F0E6DA] p-3 text-[10px] text-[#7A6455]">
            <div className="flex items-center justify-between gap-2">
              <span>{status.autosave}</span>
              {loading ? (
                <span>{status.loading}</span>
              ) : saving ? (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7A6455]" />
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
                className="ml-auto inline-flex items-center gap-1 rounded-[8px] border border-[#E4D8CE] px-2 py-1 text-[10px] text-[#2C2C2C] hover:border-[#C9B8A8]"
                onClick={() => onOpenChange(false)}
              >
                Închide
              </button>
            </div>
          </footer>
        </div>
      </aside>
    </div>
  );
}
