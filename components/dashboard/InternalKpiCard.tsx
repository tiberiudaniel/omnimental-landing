import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import type { useI18n } from "@/components/I18nProvider";
import {
  aggregateAxes,
  applyStatePatch,
  type OmniDailySnapshot,
  type OmniStateVector,
} from "@/lib/omniState";

export type InternalKpiCardProps = {
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  timeframe: "day" | "week" | "month";
  setTimeframe: (tf: "day" | "week" | "month") => void;
  facts: ProgressFact | null;
  snapshot: OmniDailySnapshot | null;
};

const FALLBACK_VECTOR: OmniStateVector = {
  energy: 6,
  stress: 4,
  clarity: 6,
  sleep: 6,
  confidence: 6,
  focus: 6,
};

export default function InternalKpiCard({
  lang,
  t,
  timeframe,
  setTimeframe,
  facts,
  snapshot,
}: InternalKpiCardProps) {
  const axisStats = [
    {
      key: "mentalClarity" as const,
      label: lang === "ro" ? "Claritate mentală" : "Mental clarity",
      value: snapshot?.axes.mentalClarity ?? 5,
      delta: snapshot?.deltas.mentalClarity ?? 0,
    },
    {
      key: "emotionalBalance" as const,
      label: lang === "ro" ? "Echilibru emoțional" : "Emotional balance",
      value: snapshot?.axes.emotionalBalance ?? 5,
      delta: snapshot?.deltas.emotionalBalance ?? 0,
    },
    {
      key: "physicalEnergy" as const,
      label: lang === "ro" ? "Energie fizică" : "Physical energy",
      value: snapshot?.axes.physicalEnergy ?? 5,
      delta: snapshot?.deltas.physicalEnergy ?? 0,
    },
  ];

  return (
    <motion.div variants={fadeDelayed(0.05)} {...hoverScale}>
      <Card className="flex items-center gap-2 rounded-xl border border-[#E4DAD1] bg-white p-1.5 shadow-sm sm:gap-3 sm:p-2.5">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold tracking-[0.02em] text-[#6E5F55] sm:text-[14px]">
              {lang === "ro" ? "Axe zilnice – Claritate • Emoție • Energie" : "Daily axes – Clarity • Emotion • Energy"}
            </h3>
          </div>
          <p className="text-[10px] text-[#8C7C70] sm:text-[11px]">
            {lang === "ro"
              ? "Rezumatul scorurilor tale de azi vs. media personală."
              : "Snapshot of today’s scores vs your personal baseline."}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {axisStats.map((axis) => (
              <div key={axis.key} className="rounded-lg border border-[#E7DED3] bg-[#FFFBF7] px-2 py-1.5 text-center">
                <p className="text-[10px] font-semibold text-[#7B6B60]">{axis.label}</p>
                <p className="text-[15px] font-bold text-[#2C2C2C]">{axis.value.toFixed(1)}</p>
                <p className={`text-[10px] ${axis.delta >= 0 ? "text-[#1F7A43]" : "text-[#B82B4F]"}`}>
                  {axis.delta >= 0 ? "+" : ""}
                  {axis.delta.toFixed(1)} {lang === "ro" ? "vs. medie" : "vs. baseline"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[9px] sm:text-[10px]">
              <button
                type="button"
                onClick={() => setTimeframe("week")}
                className={`rounded px-1.5 py-0.5 transition ${
                  timeframe === "week" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"
                }`}
                aria-label="Toggle KPI to week"
                data-testid="kpi-toggle-week"
              >
                {getString(t, "dashboard.trendsToggle.week", lang === "ro" ? "Săptămână" : "Week")}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("month")}
                className={`rounded px-1.5 py-0.5 transition ${
                  timeframe === "month" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"
                }`}
                aria-label="Toggle KPI to month"
                data-testid="kpi-toggle-month"
              >
                {getString(t, "dashboard.trendsToggle.month", lang === "ro" ? "Lună" : "Month")}
              </button>
            </div>
            <div className="flex gap-1 text-[10px]">
              <Link
                href="/progress?highlight=daily-reset"
                className="inline-flex items-center gap-1 rounded-full border border-[#E4DAD1] px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[#4D3F36] transition hover:border-[#C07963] hover:text-[#C07963]"
              >
                {lang === "ro" ? "Actualizează" : "Update"}
              </Link>
              <Link
                href="/progress?open=journal&tab=NOTE_LIBERE"
                className="inline-flex items-center gap-1 rounded-full border border-[#E4DAD1] px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[#4D3F36] transition hover:border-[#C07963] hover:text-[#C07963]"
              >
                {lang === "ro" ? "Jurnal scurt" : "Quick journal"}
              </Link>
            </div>
          </div>

          {renderHistory({ lang, facts, snapshot })}
        </div>
      </Card>
    </motion.div>
  );
}

function renderHistory({
  lang,
  facts,
  snapshot,
}: {
  lang: string;
  facts: ProgressFact | null;
  snapshot: OmniDailySnapshot | null;
}) {
  type DailyHistory = Record<string, Partial<Record<keyof OmniStateVector, number>>>;
  const history =
    ((facts as { omni?: { daily?: { history?: DailyHistory } } } | undefined)?.omni?.daily?.history ?? {}) as DailyHistory;
  const entries = Object.entries(history)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort(([a], [b]) => (a > b ? 1 : -1));
  if (!entries.length) {
    return (
      <div className="mt-2 border-t border-[#F0E8E0] pt-2 text-[11px] text-[#7B6B60]">
        <p>
          {lang === "ro"
            ? "Nu avem încă istoric pentru aceste axe. Completează ritualul zilnic ca să pornim graficul."
            : "No history yet. Complete the daily ritual to unlock the chart."}
        </p>
      </div>
    );
  }
  const baseline = snapshot?.baseline ?? FALLBACK_VECTOR;
  const recent = entries
    .map(([dateKey, entry]) => {
      const vec = applyStatePatch(baseline, entry ?? {});
      const axes = aggregateAxes(vec);
      const ts = Date.parse(dateKey);
      return {
        ts: Number.isFinite(ts) ? ts : 0,
        clarity: axes.mentalClarity * 10,
        emotion: axes.emotionalBalance * 10,
        energy: axes.physicalEnergy * 10,
      };
    })
    .filter((row) => row.ts > 0)
    .slice(-7);

  return (
    <>
      <div className="mt-1.5 border-t border-[#F0E8E0] pt-1.5 sm:pt-2">
        <div className="h-[110px] sm:h-[120px]">
          <svg viewBox="0 0 220 110" className="h-full w-full">
            <line x1="24" y1="105" x2="214" y2="105" stroke="#D7CABE" strokeWidth={1} />
            {[100, 75, 50, 25].map((level) => {
              const y = 105 - (level / 100) * 90;
              const dashed = level === 50;
              return (
                <g key={`axis-${level}`}>
                  <line
                    x1="24"
                    y1={y}
                    x2="214"
                    y2={y}
                    stroke={dashed ? "#E1BFAA" : "#EFE6DD"}
                    strokeWidth={dashed ? 1.5 : 1}
                    strokeDasharray={dashed ? "4 3" : "2 6"}
                  />
                  <text x="0" y={y + 4} fill="#7B6B60" fontSize="9" fontWeight={dashed ? 600 : 400}>
                    {level}
                  </text>
                </g>
              );
            })}
            {["#7A6455", "#4D3F36", "#C07963"].map((accent, idx) => (
              <polyline
                key={`serie-${idx}`}
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={recent
                  .map((point, i) => {
                    const x = 24 + (i / Math.max(recent.length - 1, 1)) * 190;
                    const axisValue = idx === 0 ? point.clarity : idx === 1 ? point.emotion : point.energy;
                    const y = 105 - (axisValue / 100) * 90;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            ))}
          </svg>
        </div>
        <div className="mt-1 h-px bg-[#E4DAD1]" />
        <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.08em] text-[#A08F82]">
          {recent.map((point, idx) => {
            const date = new Date(point.ts);
            const label = Number.isNaN(date.getTime()) ? `D${idx + 1}` : `${(date.getUTCDate() + "").padStart(2, "0")}`;
            return (
              <span key={`tick-${point.ts}-${idx}`} className="flex-1 text-center first:text-left last:text-right">
                {label}
              </span>
            );
          })}
        </div>
      </div>
      <ChipSummary lang={lang} snapshot={snapshot} />
    </>
  );
}

function ChipSummary({ lang, snapshot }: { lang: string; snapshot: OmniDailySnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-[#6E5F55]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5">
          {lang === "ro" ? "Completează ritualul pentru actualizare." : "Complete the ritual to update."}
        </span>
      </div>
    );
  }
  const chips = [
    {
      label: lang === "ro" ? "Claritate" : "Clarity",
      color: "#9A8578",
      value: snapshot.axes.mentalClarity,
      delta: snapshot.deltas.mentalClarity,
    },
    {
      label: lang === "ro" ? "Echilibru" : "Emotion",
      color: "#766659",
      value: snapshot.axes.emotionalBalance,
      delta: snapshot.deltas.emotionalBalance,
    },
    {
      label: lang === "ro" ? "Energie" : "Energy",
      color: "#B98C7C",
      value: snapshot.axes.physicalEnergy,
      delta: snapshot.deltas.physicalEnergy,
    },
  ];
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#6E5F55]"
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chip.color }} aria-hidden />
          {chip.label}: {chip.value.toFixed(1)}
          <span className={chip.delta >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}>
            {chip.delta >= 0 ? "+" : ""}
            {chip.delta.toFixed(1)}
          </span>
        </span>
      ))}
    </div>
  );
}
