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
      ? "rounded-[8px] border border-[#E4D8CE] bg-white px-1.5 py-[6px] shadow-[0_4px_10px_rgba(0,0,0,0.04)] min-h-[72px]"
      : variant === "tiny"
      ? "rounded-[10px] border border-[#E4D8CE] bg-white px-2 py-1 shadow-[0_6px_14px_rgba(0,0,0,0.04)]"
      : "rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.05)]";
  const labelCls =
    variant === "micro"
      ? "t-label-xs text-[#A08F82]"
      : variant === "tiny"
      ? "text-[9px] uppercase tracking-[0.25em] text-[#A08F82]"
      : "text-xs uppercase tracking-[0.3em] text-[#A08F82]";
  const hintCls = variant === "micro" ? "text-[9px] text-[#7A6455]" : variant === "tiny" ? "text-[9px] text-[#7A6455]" : "text-[11px] text-[#7A6455]";
  const valueCls = variant === "micro" ? "t-value-base font-semibold text-[#1F1F1F]" : variant === "tiny" ? "text-sm font-semibold text-[#1F1F1F]" : "t-value-xl font-semibold text-[#1F1F1F]";
  return (
    <div className={wrap}>
      <div className={labelCls}>{label}</div>
      {hint ? <div className={hintCls}>{hint}</div> : null}
      <div className={valueCls}>{value}</div>
    </div>
  );
}
