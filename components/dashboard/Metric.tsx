import InfoTooltip from "@/components/InfoTooltip";

type MetricProps = {
  label: string;
  value: number;
  badge?: string;
  testId?: string;
  tooltipItems?: string[];
  debugBadge?: string;
  testIdValue?: string;
};

export default function Metric({ label, value, badge, testId, tooltipItems, debugBadge, testIdValue }: MetricProps) {
  return (
    <div data-testid={testId} className="relative rounded-lg border border-[#EFE3D7] bg-[#FCF7F1] px-1.5 py-1 text-left sm:px-2 sm:py-1.5">
      {Array.isArray(tooltipItems) && tooltipItems.length > 0 ? (
        <div className="absolute right-1 top-1 z-10 sm:right-1.5 sm:top-1.5">
          <InfoTooltip items={tooltipItems} label={label} />
        </div>
      ) : null}
      {badge ? (
        <span className="absolute -right-1 -top-1 rounded-full border border-[#E4DAD1] bg-white px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#C07963] sm:px-1.5 sm:text-[9px]">
          {badge}
        </span>
      ) : null}
      <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7B6B60] sm:text-[10px]">
        <span>{label}</span>
        {debugBadge ? (
          <span className="ml-1 rounded bg-[#EDE6DE] px-1 py-0.5 text-[8px] font-semibold normal-case tracking-normal text-[#7B6B60]">
            {debugBadge}
          </span>
        ) : null}
      </p>
      <p className="text-[14px] font-bold text-[#C24B17] sm:text-base" data-testid={testIdValue}>
        {value}
      </p>
    </div>
  );
}
