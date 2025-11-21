import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import { INDICATORS } from "@/lib/indicators";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import type { useI18n } from "@/components/I18nProvider";

export type InternalKpiCardProps = {
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  timeframe: "day" | "week" | "month";
  setTimeframe: (tf: "day" | "week" | "month") => void;
  facts: ProgressFact | null;
};

export default function InternalKpiCard({ lang, t, timeframe, setTimeframe, facts }: InternalKpiCardProps) {
  return (
    <motion.div variants={fadeDelayed(0.05)} {...hoverScale}>
      <Card className="flex items-center gap-2 rounded-xl border border-[#E4DAD1] bg-white p-1.5 shadow-sm sm:gap-3 sm:p-2.5">
        <div className="flex-1">
          <div className="mb-0.5 flex items-center justify-between sm:mb-1">
            <h3 className="text-[13px] font-semibold tracking-[0.02em] text-[#6E5F55] sm:text-[14px]">
              {lang === "ro" ? "KPI — Gândire • Emoție • Energie" : "KPI — Thinking • Emotion • Energy"}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#8C7C70] sm:text-[11px]">
              {lang === "ro" ? "Evoluția indicatorilor interni în timp." : "Evolution of internal indicators over time."}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[9px] sm:text-[10px]">
              <button
                type="button"
                onClick={() => setTimeframe("week")}
                className={`rounded px-1.5 py-0.5 transition ${timeframe === "week" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                aria-label="Toggle KPI to week"
                data-testid="kpi-toggle-week"
              >
                {getString(t, "dashboard.trendsToggle.week", lang === "ro" ? "Săptămână" : "Week")}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("month")}
                className={`rounded px-1.5 py-0.5 transition ${timeframe === "month" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                aria-label="Toggle KPI to month"
                data-testid="kpi-toggle-month"
              >
                {getString(t, "dashboard.trendsToggle.month", lang === "ro" ? "Lună" : "Month")}
              </button>
            </div>
          </div>
          {renderHistory(lang, facts)}
        </div>
      </Card>
    </motion.div>
  );
}

function renderHistory(lang: string, facts: ProgressFact | null) {
  type HistRec = Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>;
  const hist: HistRec = ((facts as { omni?: { scope?: { history?: HistRec } } } | undefined)?.omni?.scope?.history ?? {});
  const entries = Object.entries(hist);
  if (!entries.length) {
    return (
      <div className="mt-2 border-t border-[#F0E8E0] pt-2 sm:pt-2.5 text-[11px] text-[#7B6B60]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[#7B6B60]">
            {lang === "ro"
              ? "Nu avem încă istoric pentru indicatori. Completează rapid sliderele (1–10) ca să începem evoluția."
              : "No history yet. Do a quick 1–10 slider check to start your evolution."}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/experience-onboarding?flow=initiation&step=daily-state" className="text-[#2C2C2C] underline hover:text-[#C07963]" data-testid="internal-cta-sliders">
              {lang === "ro" ? "Actualizează (1–10)" : "Update (1–10)"}
            </Link>
            <Link href="/progress?open=journal&tab=NOTE_LIBERE" className="text-[#2C2C2C] underline hover:text-[#C07963]" data-testid="internal-cta-journal">
              {lang === "ro" ? "Adaugă o notă rapidă" : "Add a quick note"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const byDay = entries
    .map(([k, v]) => {
      const y = Number(k.slice(1, 5));
      const m = Number(k.slice(5, 7)) - 1;
      const d = Number(k.slice(7, 9));
      const dt = new Date(y, m, d).getTime();
      return { ts: Number.isFinite(dt) ? dt : 0, clarity: Number(v.clarity) || 0, calm: Number(v.calm) || 0, energy: Number(v.energy) || 0 };
    })
    .filter((e) => e.ts > 0)
    .sort((a, b) => a.ts - b.ts);
  const take = byDay.slice(-7);
  return (
    <>
      <div className="mt-1.5 border-t border-[#F0E8E0] pt-1.5 sm:pt-2">
        <div className="h-[110px] sm:h-[120px]">
          <svg viewBox="0 0 220 110" className="h-full w-full">
            <line x1="24" y1="105" x2="214" y2="105" stroke="#D7CABE" strokeWidth={1} />
            {[100, 75, 50, 25].map(level => {
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
                  <text x="0" y={y + 4} fill="#7B6B60" fontSize="9" fontWeight={level === 50 ? 600 : 400}>
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
                points={take
                  .map((point, i) => {
                    const x = 24 + (i / Math.max(take.length - 1, 1)) * 190;
                    const y = 105 - ((idx === 0 ? point.clarity : idx === 1 ? point.calm : point.energy) / 100) * 90;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            ))}
          </svg>
        </div>
        <div className="mt-1 h-px bg-[#E4DAD1]" />
        <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.08em] text-[#A08F82]">
          {take.map((point, idx) => {
            const dateLabel = (() => {
              const d = new Date(point.ts);
              if (Number.isNaN(d.getTime())) return `D${idx + 1}`;
              const day = d.getDate();
              return day < 10 ? `0${day}` : String(day);
            })();
            return (
              <span key={`axis-${point.ts}-${idx}`} className="flex-1 text-center first:text-left last:text-right">
                {dateLabel}
              </span>
            );
          })}
        </div>
      </div>
      <ChipSummary lang={lang} facts={facts} />
    </>
  );
}

function ChipSummary({ lang, facts }: { lang: string; facts: ProgressFact | null }) {
  type HistRec = Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>;
  const record = ((facts as { omni?: { scope?: { history?: HistRec } } } | undefined)?.omni?.scope?.history ?? {});
  const chipData = computeChipData(record);

  if (!chipData.length) {
    return (
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#6E5F55]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#9A8578]" aria-hidden />
          {lang === "ro" ? "Actualizează indicatorii" : "Update indicators"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {chipData.map((chip) => (
        <span key={chip.label} className="inline-flex items-center gap-1 rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#6E5F55]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chip.color }} aria-hidden />
          {chip.label}: {Math.round(chip.value)}
          <span className={chip.delta >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}>
            {chip.delta >= 0 ? "+" : ""}
            {Math.round(chip.delta)}
          </span>
        </span>
      ))}
    </div>
  );
}

function computeChipData(record: Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>) {
  try {
    const hist = Object.entries(record)
      .map(([, v]) => ({ clarity: Number(v.clarity) || 0, calm: Number(v.calm) || 0, energy: Number(v.energy) || 0 }))
      .slice(-2);
    const take = hist.length ? hist : [{ clarity: 0, calm: 0, energy: 0 }];
    const last = take[take.length - 1];
    const prev = take.length >= 2 ? take[take.length - 2] : last;
    return [
      { label: INDICATORS.mental_clarity.label, value: last.clarity, delta: last.clarity - prev.clarity, color: "#9A8578" },
      { label: INDICATORS.emotional_balance.label, value: last.calm, delta: last.calm - prev.calm, color: "#766659" },
      { label: INDICATORS.physical_energy.label, value: last.energy, delta: last.energy - prev.energy, color: "#B98C7C" },
    ];
  } catch {
    return [];
  }
}
