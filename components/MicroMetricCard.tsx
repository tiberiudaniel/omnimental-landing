"use client";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "normal" | "tiny" | "micro";
};

export default function MicroMetricCard({ label, value, hint, variant = "normal" }: Props) {
  const wrap =
    variant === "micro"
      ? "rounded-[8px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-1.5 py-[6px] shadow-[0_4px_10px_rgba(0,0,0,0.04)] min-h-[72px]"
      : variant === "tiny"
      ? "rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-2 py-1 shadow-[0_6px_14px_rgba(0,0,0,0.04)]"
      : "rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.05)]";
  const labelCls =
    variant === "micro"
      ? "t-label-xs text-[var(--omni-muted)]"
      : variant === "tiny"
      ? "text-[9px] uppercase tracking-[0.25em] text-[var(--omni-muted)]"
      : "text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]";
  const hintCls = variant === "micro" ? "text-[9px] text-[var(--omni-muted)]" : variant === "tiny" ? "text-[9px] text-[var(--omni-muted)]" : "text-[11px] text-[var(--omni-muted)]";
  const valueCls = variant === "micro" ? "t-value-base font-semibold text-[var(--omni-ink)]" : variant === "tiny" ? "text-sm font-semibold text-[var(--omni-ink)]" : "t-value-xl font-semibold text-[var(--omni-ink)]";
  return (
    <div className={wrap}>
      <div className={labelCls}>{label}</div>
      {hint ? <div className={hintCls}>{hint}</div> : null}
      <div className={valueCls}>{value}</div>
    </div>
  );
}
