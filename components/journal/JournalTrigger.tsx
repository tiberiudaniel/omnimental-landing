"use client";

import { useState } from "react";
import { JournalDrawer } from "./JournalDrawer";
import type { JournalContext } from "./useJournal";

type Props = {
  userId: string | null | undefined;
  context?: JournalContext;
  label?: string; // optional override (e.g., "Jurnal")
  onRequireAuth?: () => void; // if no user, prompt auth
};

export function JournalTrigger({ userId, context, label, onRequireAuth }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="inline-flex items-center rounded-full bg-[var(--omni-surface-card)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] transition hover:bg-[var(--omni-bg-paper)]"
        onClick={() => {
          if (!userId) {
            if (onRequireAuth) onRequireAuth();
            return;
          }
          setOpen(true);
        }}
      >
        <span>{label ?? "Jurnal"}</span>
      </button>
      {userId && open ? (
        <JournalDrawer open={open} onOpenChange={setOpen} userId={userId} context={context} />
      ) : null}
    </>
  );
}
