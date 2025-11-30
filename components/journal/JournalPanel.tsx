"use client";

import { useEffect, useMemo, useState } from "react";
import { useJournal, type JournalContext } from "./useJournal";
import Toast from "../Toast";
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
    const last = window.localStorage.getItem("journalLastEditedTab") as JournalTabId | null;
    if (last) return last as JournalTabId;
    const raw = window.localStorage.getItem("journalActiveTab") as JournalTabId | null;
    return (raw as JournalTabId) || "SCOP_INTENTIE";
  });
  const { label: tabLabel, placeholder: tabPlaceholder, status, action } = useTabStrings();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
      <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/90 p-4 text-xs text-[var(--omni-muted)]">
        Autentifică-te pentru a folosi jurnalul personal.
      </div>
    );
  }

  if (!context) {
    return (
      <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/90 p-4 text-xs text-[var(--omni-muted)]">
        Selectează un cadran pentru a deschide jurnalul.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{status.title}</p>
          <h3 className="text-base font-semibold text-[var(--omni-ink)]">
            {context?.theme ? `${status.relatedPrefix} ${context.theme}` : "Noteaza ceea ce este interesant si util."}
          </h3>
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded-full p-1 text-[var(--omni-muted)] hover:bg-[var(--omni-bg-paper)]"
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
          <div className="mb-1 font-medium">Sugestii din ce ai completat:</div>
          <ul className="list-inside list-disc space-y-1">
            {context!.suggestedSnippets!.map((snip, idx) => (
              <li key={`${snip}-${idx}`}>{snip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <textarea
        className="min-h-[220px] w-full flex-1 resize-none rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-3 text-sm text-[var(--omni-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-energy)]"
        placeholder={tabPlaceholder(activeTab)}
        value={currentText}
        onChange={(e) => {
          setTabText(activeTab, e.target.value);
          scheduleSave(activeTab, context ?? undefined);
        }}
        onBlur={async () => {
          const before = (tabs[activeTab] ?? "").trim();
          await saveTab(activeTab, context ?? undefined);
          if (before) setToastMsg("Jurnal salvat");
        }}
      />

      <div className="mt-2 text-[10px] text-[var(--omni-muted)]">
        <div className="flex items-center justify-between">
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
        </div>
      </div>
      {toastMsg ? (
        <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md px-4">
          <Toast message={toastMsg} okLabel="OK" onClose={() => setToastMsg(null)} />
        </div>
      ) : null}
    </div>
  );
}
