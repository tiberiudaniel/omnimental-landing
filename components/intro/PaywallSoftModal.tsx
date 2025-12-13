"use client";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

interface PaywallSoftModalProps {
  open: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PaywallSoftModal({
  open,
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onClose,
  onUpgrade,
}: PaywallSoftModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Oferta</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">{title}</h3>
        <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{body}</p>
        <div className="mt-6 flex flex-col gap-3">
          <OmniCtaButton onClick={onUpgrade} className="justify-center">
            {primaryLabel}
          </OmniCtaButton>
          <OmniCtaButton variant="neutral" onClick={onClose} className="justify-center">
            {secondaryLabel}
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}
