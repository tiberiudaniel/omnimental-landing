"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useLessonJournal } from "@/lib/hooks/useLessonJournal";
import type { LessonJournalBlock } from "@/lib/types/journal";

export type LessonJournalDrawerProps = {
  open: boolean;
  onClose: () => void;
  userId?: string | null;
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
};

function sortBlocks(blocks: LessonJournalBlock[]): LessonJournalBlock[] {
  return blocks
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function LessonJournalDrawer({ open, onClose, userId, moduleId, lessonId, lessonTitle }: LessonJournalDrawerProps) {
  const { entry, loading, error, addNote, canWrite } = useLessonJournal(userId ?? null, moduleId, lessonId, lessonTitle);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      const result = await addNote(trimmed, "note");
      if (result) {
        setText("");
        setSavedMessage("Salvat în jurnal");
        window.setTimeout(() => setSavedMessage(null), 2500);
      }
    } finally {
      setPending(false);
    }
  };

  const blocks = entry?.blocks ? sortBlocks(entry.blocks) : [];

  const formatDate = (value: Date) => {
    try {
      return value.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return value.toISOString();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex min-h-full w-full items-end justify-center p-0 sm:items-center sm:p-4">
        <DialogPanel
          className="flex h-[96vh] w-full max-w-none flex-col gap-4 rounded-t-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 p-4 shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-card sm:p-6"
          data-testid="lesson-journal-drawer"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Jurnal lecție</DialogTitle>
              <p className="text-lg font-semibold text-[var(--omni-ink)]">{lessonTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-transparent px-2 py-1 text-sm text-[var(--omni-muted)] transition hover:border-[#7B6B60]"
              aria-label="Închide jurnalul"
            >
              ×
            </button>
          </div>

          {!canWrite ? (
            <p className="rounded-card border border-[#F0E8E0] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-muted)]">
              Trebuie să fii autentificat pentru a salva notițe din lecții.
            </p>
          ) : (
            <>
              <div
                className="max-h-[45vh] space-y-3 overflow-y-auto rounded-card border border-[#F0E8E0] bg-[var(--omni-surface-card)] px-3 py-3 sm:max-h-60"
                data-testid="lesson-journal-blocks"
              >
                {loading ? (
                  <p className="text-sm text-[var(--omni-muted)]">Se încarcă jurnalul…</p>
                ) : blocks.length ? (
                  blocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded-card border border-[#F7E7DA] bg-[var(--omni-bg-paper)] px-3 py-2"
                      data-testid="lesson-journal-block"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--omni-muted)]">
                        <span>{block.kind === "snippet" ? "Fragment salvat" : "Notă"}</span>
                        <span suppressHydrationWarning>{formatDate(block.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--omni-ink)] whitespace-pre-line">{block.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--omni-muted)]">Nu ai încă notițe pentru această lecție.</p>
                )}
                {error ? <p className="text-sm text-[var(--omni-energy)]">{error}</p> : null}
              </div>

              <div className="space-y-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="w-full rounded-card border border-[var(--omni-border-soft)] px-3 py-2 text-sm text-[var(--omni-ink)] focus:border-[var(--omni-energy)] focus:outline-none"
                  placeholder="Notele mele din lecția asta…"
                data-testid="lesson-journal-textarea"
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-[var(--omni-muted)]">
                    {savedMessage ?? "Scrie câteva idei și apasă pe Adaugă în jurnal."}
                  </p>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={pending || !text.trim()}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--omni-energy)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--omni-border-soft)] disabled:text-[#B99484]"
                  >
                    {pending ? "Se salvează…" : "Adaugă în jurnal"}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
