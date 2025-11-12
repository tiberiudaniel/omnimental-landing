"use client";

import ProgressSparkline from "./ProgressSparkline";

type Props = {
  title: string;
  value: number | string;
  trend?: number[];
  tooltip?: string;
};

export default function KPICard({ title, value, trend, tooltip }: Props) {
  return (
    <div className="rounded-[12px] border border-[#8F7C6E] bg-[#A08F82] px-3 py-2.5 shadow-[0_6px_14px_rgba(0,0,0,0.04)] min-h-[72px]" title={tooltip}>
      <div className="t-label-xs font-medium text-white/85">{title}</div>
      <div className="mt-0.5 t-value-xl font-bold leading-tight text-white">{typeof value === "number" ? Math.round(value) : value}</div>
      {trend && trend.length > 1 ? (
        <div className="mt-1">
          <ProgressSparkline values={trend} strokeColor="#FFFFFF" fillColor="#FFFFFF" fillOpacityStart={0.22} />
        </div>
      ) : null}
    </div>
  );
}
