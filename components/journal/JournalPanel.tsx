"use client";

import { useEffect, useMemo, useState } from "react";
import { useJournal, type JournalContext } from "./useJournal";
import { useTStrings } from "../useTStrings";
import type { JournalTabId } from "@/lib/journal";

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
  const action = {
    close: s("journal.action.close", "Ascunde panoul"),
    open: s("journal.action.open", "Arată jurnalul"),
  };
  return { label, placeholder, status, action };
}

export function JournalPanel({
  userId,
  context,
  onClose,
}: {
  userId: string | undefined | null;
  context: JournalContext | null;
  onClose?: () => void;
}) {
  const { loading, saving, tabs, setTabText, saveTab, scheduleSave } = useJournal(userId ?? null);
  const [activeTab, setActiveTab] = useState<JournalTabId>(() => {
    if (typeof window === "undefined") return "SCOP_INTENTIE";
    const raw = window.localStorage.getItem("journalActiveTab") as JournalTabId | null;
    return (raw as JournalTabId) || "SCOP_INTENTIE";
  });
  const { label: tabLabel, placeholder: tabPlaceholder, status, action } = useTabStrings();

  useEffect(() => {
    // autosave when context changes (switching which card drives the panel)
    void saveTab(activeTab, context ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.theme, context?.sourceBlock]);

  const currentText = tabs[activeTab] ?? "";
  const showSuggested =
    activeTab === "OBSERVATII_EVALUARE" &&
    (context?.suggestedSnippets?.length ?? 0) > 0 &&
    !currentText;

  const allTabs = useMemo(() => [
    "SCOP_INTENTIE",
    "MOTIVATIE_REZURSE",
    "PLAN_RECOMANDARI",
    "OBSERVATII_EVALUARE",
    "NOTE_LIBERE",
  ] as JournalTabId[], []);

  if (!userId) {
    return (
      <div className="rounded-[12px] border border-[#E4D8CE] bg-white/90 p-4 text-xs text-[#7A6455]">
        Autentifică-te pentru a folosi jurnalul personal.
      </div>
    );
  }

  if (!context) {
    return (
      <div className="rounded-[12px] border border-[#E4D8CE] bg-white/90 p-4 text-xs text-[#7A6455]">
        Selectează un cadran pentru a deschide jurnalul.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-[12px] border border-[#E4D8CE] bg-white/95 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#A08F82]">{status.title}</p>
          <h3 className="text-base font-semibold text-[#1F1F1F]">
            {context?.theme ? `${status.relatedPrefix} ${context.theme}` : "Notează ce este important pentru tine acum."}
          </h3>
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded-full p-1 text-[#7A6455] hover:bg-[#F6F2EE]"
            onClick={onClose}
            aria-label={action.close}
            title={action.close}
          >
            ×
          </button>
        ) : null}
      </header>

      <div className="mb-3 flex w-full flex-wrap gap-2 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none" }}>
        {allTabs.map((tabId) => (
          <button
            key={tabId}
            type="button"
            onClick={async () => {
              await saveTab(activeTab, context ?? undefined);
              setActiveTab(tabId);
              try { window.localStorage.setItem("journalActiveTab", tabId); } catch {}
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
          <div className="mb-1 font-medium">Sugestii din ce ai completat:</div>
          <ul className="list-inside list-disc space-y-1">
            {context!.suggestedSnippets!.map((snip, idx) => (
              <li key={`${snip}-${idx}`}>{snip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <textarea
        className="min-h-[220px] w-full flex-1 resize-none rounded-[10px] border border-[#E4D8CE] bg-white p-3 text-sm text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
        placeholder={tabPlaceholder(activeTab)}
        value={currentText}
        onChange={(e) => {
          setTabText(activeTab, e.target.value);
          scheduleSave(activeTab, context ?? undefined);
        }}
        onBlur={() => void saveTab(activeTab, context ?? undefined)}
      />

      <div className="mt-2 text-[10px] text-[#7A6455]">
        <div className="flex items-center justify-between">
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
        </div>
      </div>
    </div>
  );
}
