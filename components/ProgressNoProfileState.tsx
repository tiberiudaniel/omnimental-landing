"use client";

type Props = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export default function ProgressNoProfileState({ title, description, actionLabel, onAction }: Props) {
  return (
    <main className="px-4 py-12 md:px-8">
      <div className="mx-auto max-w-2xl rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-12 text-center shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <h1 className="text-2xl font-semibold text-[#2C1F18]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">{description}</p>
        <p className="mt-1 text-xs text-[var(--omni-muted)]">
          Dacă ai completat deja evaluarea, o conectăm automat după autentificare.
        </p>
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
        >
          {actionLabel}
        </button>
      </div>
    </main>
  );
}

