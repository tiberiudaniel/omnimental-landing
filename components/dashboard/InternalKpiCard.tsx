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
import { buildDailyResetMessage } from "@/components/dashboard/DailyResetCard";

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
  const summaryText = snapshot
    ? buildDailyResetMessage(snapshot, lang)
    : lang === "ro"
      ? "Rezumatul scorurilor tale de azi vs. media personală."
      : "Snapshot of today’s scores vs your personal baseline.";

  return (
    <motion.div variants={fadeDelayed(0.05)} {...hoverScale}>
      <Card className="flex items-center gap-2 rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-1.5 shadow-sm sm:gap-3 sm:p-2.5">
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


          <div className="mt-2 flex flex-col gap-2">
            <div className="rounded-xl border border-[#F0E3D8] bg-[var(--omni-bg-paper)] px-3 py-2 text-[11px] text-[var(--omni-muted)]">
              {summaryText}
            </div>
            <div className="rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/70 p-0.5 text-[9px] sm:text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTimeframe("week")}
                    className={`rounded px-1.5 py-0.5 transition ${
                      timeframe === "week" ? "bg-[var(--omni-surface-card)] border border-[var(--omni-border-soft)] text-[var(--omni-ink)] font-semibold" : "text-[var(--omni-ink-soft)]"
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
                      timeframe === "month" ? "bg-[var(--omni-surface-card)] border border-[var(--omni-border-soft)] text-[var(--omni-ink)] font-semibold" : "text-[var(--omni-ink-soft)]"
                    }`}
                    aria-label="Toggle KPI to month"
                    data-testid="kpi-toggle-month"
                  >
                    {getString(t, "dashboard.trendsToggle.month", lang === "ro" ? "Lună" : "Month")}
                  </button>
                </div>
                <Link
                  href="/progress?open=journal&tab=NOTE_LIBERE&source=daily_axes"
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4D3F36] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
                >
                  {lang === "ro" ? "Notițe rapide" : "Quick journal"}
                </Link>
              </div>
            </div>
            <div>{renderHistory({ lang, facts, snapshot, compact: true })}</div>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {axisStats.map((axis, idx) => (
              <div
                key={axis.key}
                className="rounded-lg border border-[#E7DED3] bg-[var(--omni-bg-paper)] px-3 py-2 text-center text-[10px]"
              >
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[var(--omni-muted)]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: idx === 0 ? "#2563EB" : idx === 1 ? "#DC2626" : "#059669" }}
                    aria-hidden
                  />
                  {axis.label}
                </div>
                <p className="text-[15px] font-bold text-[var(--omni-ink)]">{axis.value.toFixed(1)}</p>
                <p className={`text-[10px] ${axis.delta >= 0 ? "text-[#1F7A43]" : "text-[#B82B4F]"}`}>
                  {axis.delta >= 0 ? "+" : ""}
                  {axis.delta.toFixed(1)} {lang === "ro" ? "vs. medie" : "vs. baseline"}
                </p>
              </div>
            ))}
          </div>

        </div>
      </Card>
    </motion.div>
  );
}

function renderHistory({
  lang,
  facts,
  snapshot,
  compact = false,
}: {
  lang: string;
  facts: ProgressFact | null;
  snapshot: OmniDailySnapshot | null;
  compact?: boolean;
}) {
  type DailyHistory = Record<string, Partial<Record<keyof OmniStateVector, number>>>;
  const history =
    ((facts as { omni?: { daily?: { history?: DailyHistory } } } | undefined)?.omni?.daily?.history ?? {}) as DailyHistory;
  const entries = Object.entries(history)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort(([a], [b]) => (a > b ? 1 : -1));
  if (!entries.length) {
    return (
      <div className="mt-2 border-t border-[#F0E8E0] pt-2 text-[11px] text-[var(--omni-muted)]">
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
      <div className="border-t border-[#F0E8E0] pt-1.5 sm:pt-2">
        <div className="h-[110px] px-1 sm:h-[120px] sm:px-2">
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
            {["#2563EB", "#DC2626", "#059669"].map((accent, idx) => (
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
        <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.08em] text-[var(--omni-muted)] px-1 sm:px-2">
          {recent.map((point, idx) => {
            const date = new Date(point.ts);
            const label = Number.isNaN(date.getTime())
              ? `D${idx + 1}`
              : date.toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", {
                  day: "2-digit",
                  month: "short",
                });
            return (
              <span key={`tick-${point.ts}-${idx}`} className="flex-1 text-center first:text-left last:text-right">
                {label}
              </span>
            );
          })}
        </div>
      </div>
      {!compact ? <ChipSummary lang={lang} snapshot={snapshot} /> : null}
    </>
  );
}

function ChipSummary({ lang, snapshot }: { lang: string; snapshot: OmniDailySnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-[#6E5F55]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2 py-0.5">
          {lang === "ro" ? "Completează ritualul pentru actualizare." : "Complete the ritual to update."}
        </span>
      </div>
    );
  }
  const chips = [
    {
      label: lang === "ro" ? "Claritate" : "Clarity",
      color: "#9A8578",
    },
    {
      label: lang === "ro" ? "Echilibru" : "Emotion",
      color: "#766659",
    },
    {
      label: lang === "ro" ? "Energie" : "Energy",
      color: "#B98C7C",
    },
  ];
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2 py-0.5 text-[10px] text-[#6E5F55]"
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chip.color }} aria-hidden />
          {chip.label}
        </span>
      ))}
    </div>
  );
}
