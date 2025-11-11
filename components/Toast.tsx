"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  timeoutMs?: number;
  onClose?: () => void;
  okLabel?: string;
};

export default function Toast({ message, timeoutMs = 3000, onClose, okLabel = "OK" }: ToastProps) {
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
      <div className="pointer-events-auto flex max-w-md items-center gap-4 rounded-[12px] border border-[#E4D8CE] bg-white/95 px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
        <span>{message}</span>
        <button
          type="button"
          aria-label="Close"
          className="ml-auto rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] hover:text-[#E60012]"
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
