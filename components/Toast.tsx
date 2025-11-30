"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  timeoutMs?: number;
  onClose?: () => void;
  okLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function Toast({
  message,
  timeoutMs = 3000,
  onClose,
  okLabel = "OK",
  actionLabel,
  onAction,
}: ToastProps) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, timeoutMs);
    return () => clearTimeout(id);
  }, [open, onClose, timeoutMs]);

  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-md items-center gap-4 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
        <span className="flex-1">{message}</span>
        {actionLabel && onAction ? (
          <button
            type="button"
            className="rounded-full border border-transparent bg-[#F7EDE4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5A422F] transition hover:border-[#E0C5AF]"
            onClick={() => {
              onAction();
              setOpen(false);
              onClose?.();
            }}
          >
            {actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Close"
          className="rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)] transition hover:text-[var(--omni-energy)]"
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
        >
          {okLabel}
        </button>
      </div>
    </div>
  );
}
