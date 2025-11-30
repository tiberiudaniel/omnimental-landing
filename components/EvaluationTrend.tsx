"use client";

import React, { useMemo, useState } from "react";
import { useEvaluationTimeline } from "./useEvaluationTimeline";

const STAGE_LABELS: Record<string, string> = {
  t0: "Start",
  t1: "3 săpt.",
  t2: "6 săpt.",
  t3: "9 săpt.",
  t4: "12 săpt.",
};

const STAGE_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Toate etapele" },
  { value: "t0", label: "Start (T0)" },
  { value: "t1", label: "3 săptămâni (T1)" },
  { value: "t2", label: "6 săptămâni (T2)" },
  { value: "t3", label: "9 săptămâni (T3)" },
  { value: "t4", label: "Final (T4)" },
];

const METRICS = [
  {
    key: "pssTotal",
    label: "Stres perceput (PSS)",
    color: "var(--omni-energy)",
    max: 40,
    invert: true,
    helper: "Mai mic = mai puțin stres",
  },
  {
    key: "gseTotal",
    label: "Autoeficacitate (GSE)",
    color: "#1F1F1F",
    max: 40,
    invert: false,
    helper: "Mai mare = încredere și control",
  },
  {
    key: "maasTotal",
    label: "Prezență (MAAS)",
    color: "#A2541A",
    max: 6,
    invert: false,
    helper: "Observi prezentul fără pilot automat",
  },
  {
    key: "panasPositive",
    label: "Afect pozitiv (PANAS+)",
    color: "#0F6D45",
    max: 25,
    invert: false,
    helper: "Emoții pozitive în ultima perioadă",
  },
  {
    key: "panasNegative",
    label: "Afect negativ (PANAS-)",
    color: "#5C0A0A",
    max: 25,
    invert: true,
    helper: "Mai mic = mai puține emoții dificile",
  },
  {
    key: "svs",
    label: "Vitalitate (SVS)",
    color: "#00406F",
    max: 7,
    invert: false,
    helper: "Energie interioară resimțită",
  },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const formatter = new Intl.DateTimeFormat("ro-RO", {
  month: "short",
  day: "numeric",
});

function formatLabel(stage: string | null, createdAt: Date | null, index: number) {
  if (stage && STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  if (createdAt) return formatter.format(createdAt);
  return `Eval ${index + 1}`;
}

type ChartRow = {
  label: string;
  stage: string | null;
  createdAt: Date | null;
  values: Record<MetricKey, number | undefined>;
};

function buildChartData(entries: ReturnType<typeof useEvaluationTimeline>["entries"]) {
  return entries.map<ChartRow>((entry, index) => {
    const values: Record<MetricKey, number | undefined> = {
      pssTotal: entry.scores?.pssTotal,
      gseTotal: entry.scores?.gseTotal,
      maasTotal: entry.scores?.maasTotal,
      panasPositive: entry.scores?.panasPositive,
      panasNegative: entry.scores?.panasNegative,
      svs: entry.scores?.svs,
    };
    return {
      label: formatLabel(entry.stage, entry.createdAt, index),
      stage: entry.stage ?? null,
      createdAt: entry.createdAt ?? null,
      values,
    };
  });
}

function TrendLines({ rows, enabledMetrics }: { rows: ChartRow[]; enabledMetrics: Record<MetricKey, boolean> }) {
  const width = 640;
  const height = 260;
  const paddingX = 32;
  const paddingY = 24;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const maxIndex = rows.length > 1 ? rows.length - 1 : 1;
  const xStep = innerWidth / maxIndex;

  const activeMetrics = METRICS.filter((metric) => enabledMetrics[metric.key]);

  const paths = activeMetrics.map((metric) => {
    const points = rows
      .map((row, idx) => {
        const value = row.values[metric.key];
        if (typeof value !== "number") return null;
        const percentage = Math.min(1, Math.max(0, value / metric.max));
        const normalized = metric.invert ? 1 - percentage : percentage;
        const x = paddingX + xStep * idx;
        const y = paddingY + innerHeight * (1 - normalized);
        return { x, y };
      })
      .filter((point): point is { x: number; y: number } => Boolean(point));
    if (points.length < 2) return null;
    const path = points
      .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    return { metric, path };
  }).filter(Boolean) as Array<{ metric: (typeof METRICS)[number]; path: string }>;

  const xLabels = rows.map((row, idx) => (
    <div
      key={`${row.label}-${idx}`}
      className="flex-1 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--omni-ink-soft)]"
    >
      {row.label}
    </div>
  ));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="max-w-full">
          <rect x={paddingX} y={paddingY} width={innerWidth} height={innerHeight} fill="none" stroke="#E8DDD3" />
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={paddingY + innerHeight * ratio}
              y2={paddingY + innerHeight * ratio}
              stroke="#F0E6DA"
              strokeDasharray="4 4"
            />
          ))}
          {paths.map(({ metric, path }) => (
            <path key={metric.key} d={path} fill="none" stroke={metric.color} strokeWidth={2.5} />
          ))}
        </svg>
      </div>
      <div className="flex justify-between gap-2">{xLabels}</div>
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-[var(--omni-ink-soft)]">
        {activeMetrics.map((metric) => (
          <div key={metric.key} className="flex items-center gap-2" title={metric.helper}>
            <span
              className="inline-block h-2 w-6 rounded-full"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function BaselineGrid({ rows }: { rows: ChartRow[] }) {
  const entry = rows[0];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {METRICS.map((metric) => {
        const value = entry.values[metric.key];
        if (typeof value !== "number") return null;
        const percentage = Math.min(100, Math.max(0, (value / metric.max) * 100));
        return (
          <div
            key={metric.key}
            className="space-y-2 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--omni-ink)]" title={metric.helper}>
              <span>{metric.label}</span>
              <span>{value.toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#F7EFE8]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percentage}%`, backgroundColor: metric.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EvaluationTrend() {
  const { entries, loading, error } = useEvaluationTimeline();
  const rows = buildChartData(entries);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const filteredRows = useMemo(() => {
    if (stageFilter === "all") {
      return rows;
    }
    return rows.filter((row) => row.stage === stageFilter);
  }, [rows, stageFilter]);
  const [enabledMetrics, setEnabledMetrics] = useState<Record<MetricKey, boolean>>(() =>
    METRICS.reduce<Record<MetricKey, boolean>>((acc, metric) => {
      acc[metric.key] = true;
      return acc;
    }, {} as Record<MetricKey, boolean>),
  );
  const activeCount = useMemo(() => Object.values(enabledMetrics).filter(Boolean).length, [enabledMetrics]);
  const toggleMetric = (key: MetricKey) => {
    setEnabledMetrics((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (Object.values(next).every((value) => !value)) {
        return prev;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <section className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 text-sm text-[var(--omni-ink-soft)] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
        Se încarcă istoricul evaluărilor…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[16px] border border-[var(--omni-danger)] bg-[var(--omni-danger-soft)] px-6 py-6 text-sm text-[var(--omni-danger)] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
        Nu am putut încărca evoluția evaluărilor. {error.message}
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="rounded-[16px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 text-sm text-[var(--omni-ink-soft)] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        Graficele vor apărea automat după prima evaluare completă.
      </section>
    );
  }

  const hasRowsForStage = filteredRows.length > 0;
  const latestRow = hasRowsForStage ? filteredRows[filteredRows.length - 1] : null;
  const previousRow =
    hasRowsForStage && filteredRows.length > 1 ? filteredRows[filteredRows.length - 2] : null;

  return (
    <section
      id="evaluation-progress"
      className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
    >
      <header className="space-y-2 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Evoluție evaluări</p>
        <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Progresul tău în program</h2>
        <p className="text-sm text-[var(--omni-ink-soft)]">
          Monitorizăm stresul, autoeficacitatea, prezența și energia la fiecare 3 săptămâni.
        </p>
      </header>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-[var(--omni-ink-soft)]">
          {STAGE_FILTERS.map((stage) => {
            const active = stageFilter === stage.value;
            return (
              <button
                key={stage.value}
                type="button"
                onClick={() => setStageFilter(stage.value)}
                className={`rounded-full border px-3 py-1 transition ${
                  active ? "border-[var(--omni-energy-soft)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]" : "border-[var(--omni-border-soft)] text-[var(--omni-ink-soft)]"
                }`}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
        {filteredRows.length > 1 && (
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-[var(--omni-ink-soft)]">
            {METRICS.map((metric) => (
              <button
                key={metric.key}
                type="button"
                onClick={() => toggleMetric(metric.key)}
                className={`rounded-full border px-3 py-1 transition ${
                  enabledMetrics[metric.key]
                    ? "border-[var(--omni-energy-soft)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                    : "border-[var(--omni-border-soft)] text-[var(--omni-ink-soft)]"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        )}
        {!hasRowsForStage ? (
          <div className="rounded-[12px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4 text-sm text-[var(--omni-ink-soft)]">
            Nu avem încă date pentru etapa selectată. Alege altă etapă din filtru.
          </div>
        ) : filteredRows.length === 1 ? (
          <BaselineGrid rows={filteredRows} />
        ) : (
          <TrendLines rows={filteredRows} enabledMetrics={enabledMetrics} key={`${activeCount}-${stageFilter}`} />
        )}
        <MetricSummaryGrid latest={latestRow} previous={previousRow} />
      </div>
    </section>
  );
}

function MetricSummaryGrid({ latest, previous }: { latest: ChartRow | null; previous: ChartRow | null }) {
  if (!latest) return null;
  return (
    <div className="grid gap-3 rounded-[16px] border border-[#F5EBE0] bg-[var(--omni-bg-paper)] px-4 py-4 md:grid-cols-2">
      {METRICS.map((metric) => {
        const current = latest.values[metric.key];
        if (typeof current !== "number") {
          return null;
        }
        const prevValue = previous?.values[metric.key];
        const delta = typeof prevValue === "number" ? current - prevValue : null;
        const deltaText =
          delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
        const improved =
          delta === null
            ? null
            : metric.invert
            ? delta < 0
            : delta > 0;
        return (
          <div key={metric.key} className="flex flex-col gap-1 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 text-sm text-[var(--omni-ink)] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              <span>{metric.label}</span>
              <span className="text-[var(--omni-ink-soft)]">{latest.label}</span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-2xl font-semibold text-[var(--omni-ink)]">{current.toFixed(1)}</p>
              <span
                className={`text-xs font-semibold uppercase tracking-[0.3em] ${
                  improved === null
                    ? "text-[var(--omni-muted)]"
                    : improved
                    ? "text-[#0F6D45]"
                    : "text-[var(--omni-energy)]"
                }`}
                title={
                  improved === null
                    ? "Nu există o evaluare precedentă"
                    : improved
                    ? "Trend favorabil față de ultima măsurare"
                    : "Trend descendent față de ultima măsurare"
                }
              >
                {deltaText}
              </span>
            </div>
            <p className="text-xs text-[var(--omni-ink-soft)]">{metric.helper}</p>
          </div>
        );
      })}
    </div>
  );
}
