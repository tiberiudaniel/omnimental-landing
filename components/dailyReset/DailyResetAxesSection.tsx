"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DailyAxesEntry } from "@/lib/dailyReset";

type DailyResetAxesSectionProps = {
  entries: DailyAxesEntry[];
  lang: "ro" | "en";
};

export function DailyResetAxesSection({ entries, lang }: DailyResetAxesSectionProps) {
  const router = useRouter();
  const today = entries[entries.length - 1] ?? null;
  const message = useMemo(() => (today ? getDailyAxesMessage(today, lang) : null), [today, lang]);

  if (!entries.length || !today || !message) return null;
  return (
    <section className="flex flex-col gap-5 rounded-card border border-border/80 bg-surface px-7 py-6 shadow-card">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-textMuted">
          {lang === "ro" ? "Axe zilnice – Claritate · Emoție · Energie" : "Daily axes – Clarity · Emotion · Energy"}
        </p>
        <p className="mt-1 text-[14px] text-textSecondary">
          {lang === "ro"
            ? "Rezumatul scorurilor tale de azi vs. media personală."
            : "Summary of today’s scores versus your personal average."}
        </p>
      </div>

      <div className="rounded-card border border-border/60 bg-surfaceAlt/80 px-5 py-4 text-base leading-snug text-textMain shadow-soft">
        <p className="font-medium">{message}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-textMuted">
        {["week", "month", "notes"].map((key, idx) => {
          const label =
            key === "week"
              ? lang === "ro"
                ? "Săptămână"
                : "Week"
              : key === "month"
                ? lang === "ro"
                  ? "Lună"
                  : "Month"
                : lang === "ro"
                  ? "Notițe rapide"
                  : "Quick notes";
          const active = idx === 0;
          return (
            <button
              key={key}
              type="button"
              className={`rounded-full border px-4 py-1 ${active ? "border-textMain text-textMain" : "border-border text-textMuted"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-card border border-border/60 bg-surfaceAlt px-4 py-4 shadow-soft">
        <DailyAxesMicroChart entries={entries} lang={lang} />
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-border/40 pt-4 sm:grid-cols-3">
        <AxisCard
          label={lang === "ro" ? "Claritate" : "Clarity"}
          score={today.clarityScore}
          delta={today.clarityDeltaFromPersonalMean}
          colorClass="text-kunoAccent"
          lang={lang}
        />
        <AxisCard
          label={lang === "ro" ? "Emoție" : "Emotion"}
          score={today.emotionScore}
          delta={today.emotionDeltaFromPersonalMean}
          colorClass="text-abilAccent"
          lang={lang}
        />
        <AxisCard
          label={lang === "ro" ? "Energie" : "Energy"}
          score={today.energyScore}
          delta={today.energyDeltaFromPersonalMean}
          colorClass="text-flexAccent"
          lang={lang}
        />
      </div>

      <button
        type="button"
        className="w-full rounded-[32px] bg-[var(--omni-ink)] px-8 py-3 text-center text-[14px] font-medium tracking-wide text-white transition hover:-translate-y-0.5 hover:shadow-ctaHover"
        onClick={() => router.push("/omni-abil")}
      >
        {lang === "ro" ? "Continuă cu acțiunea ta Omni-Abil de azi →" : "Continue with today’s Omni-Abil action →"}
      </button>
    </section>
  );
}

type AxisCardProps = {
  label: string;
  score: number;
  delta: number;
  colorClass: string;
  lang: "ro" | "en";
};

function AxisCard({ label, score, delta, colorClass, lang }: AxisCardProps) {
  const formattedScore = Number.isFinite(score) ? score.toFixed(1) : "–";
  const formattedDelta = (() => {
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.05) {
      return lang === "ro" ? "egal cu media" : "even with average";
    }
    const prefix = delta > 0 ? "+" : "";
    return `${prefix}${delta.toFixed(1)} ${lang === "ro" ? "vs. medie" : "vs. avg"}`;
  })();
  const deltaClass =
    !Number.isFinite(delta) || Math.abs(delta) < 0.05
      ? "text-textSecondary"
      : delta > 0
        ? "text-[var(--omni-success)]"
        : "text-[var(--omni-danger)]";
  return (
    <div className="rounded-card border border-border/60 bg-surface px-4 py-3 shadow-soft">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-textSecondary">
        <span>{label}</span>
        <span className={colorClass}>●</span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{formattedScore}</p>
      <p className={`text-xs font-medium ${deltaClass}`}>{formattedDelta}</p>
    </div>
  );
}

export function DailyAxesMicroChart({ entries, lang }: { entries: DailyAxesEntry[]; lang: "ro" | "en" }) {
  if (!entries.length) return null;
  const normalized = entries.map((entry) => ({
    ts: entry.createdAt.getTime(),
    clarity: entry.clarityScore * 10,
    emotion: entry.emotionScore * 10,
    energy: entry.energyScore * 10,
    date: entry.date,
  }));
  const axisColors = ["#8D7361", "#C4775A", "#A7A06E"];
  const pointCount = Math.max(normalized.length - 1, 1);
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox="0 0 260 140" className="h-[140px] w-full">
        <line x1="24" y1="120" x2="244" y2="120" stroke="#D7CABE" strokeWidth={1} />
        {[100, 75, 50, 25].map((level) => {
          const y = 120 - (level / 100) * 90;
          return (
            <g key={`micro-axis-${level}`}>
              <line
                x1="24"
                y1={y}
                x2="244"
                y2={y}
                stroke={level === 50 ? "#E1BFAA" : "#EFE6DD"}
                strokeWidth={level === 50 ? 1.5 : 1}
                strokeDasharray={level === 50 ? "4 3" : "2 6"}
              />
              <text x="0" y={y + 4} fill="#7B6B60" fontSize="9" fontWeight={level === 50 ? 600 : 400}>
                {level}
              </text>
            </g>
          );
        })}
        {["clarity", "emotion", "energy"].map((key, idx) => (
          <polyline
            key={key}
            fill="none"
            stroke={axisColors[idx]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={normalized
              .map((point, i) => {
                const x = 24 + (i / pointCount) * 220;
                const value = key === "clarity" ? point.clarity : key === "emotion" ? point.emotion : point.energy;
                const y = 120 - (value / 100) * 90;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.08em] text-textSecondary">
        {normalized.map((entry) => {
          const date = toLocaleLabel(entry.date, lang);
          return (
            <span key={`${entry.ts}-label`} className="flex-1 text-center first:text-left last:text-right">
              {date}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function toLocaleLabel(dateKey: string, lang: "ro" | "en") {
  const parsed = dateKey ? new Date(`${dateKey}T12:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return dateKey;
  return parsed
    .toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", {
      day: "2-digit",
      month: "short",
    })
    .toUpperCase();
}

export function getDailyAxesMessage(today: DailyAxesEntry, lang: "ro" | "en") {
  const { clarityScore, emotionScore, energyScore } = today;
  const max = Math.max(clarityScore, emotionScore, energyScore);
  const roMessages = {
    clarity: "Mintea este limpede azi. Profită și fă un pas mic în direcția obiectivelor tale.",
    emotion: "Ai o stare emoțională bună. Folosește-o pentru a consolida o rutină sănătoasă.",
    energy: "Energie bună azi. Un mic progres fizic sau mental va conta mult.",
    balanced: "Trend echilibrat. Continuă cu pași mici: finalizează acțiunea Omni-Abil de azi.",
  };
  const enMessages = {
    clarity: "Your mind feels clear today. Use it to take a small step toward your priorities.",
    emotion: "You’re emotionally steady today. Reinforce a healthy routine while it feels easy.",
    energy: "Energy is high today. Channel it into a short physical or mental win.",
    balanced: "Balanced trend. Keep moving with small steps—complete today’s Omni-Abil action.",
  };
  const copy = lang === "ro" ? roMessages : enMessages;
  if (max === clarityScore) return copy.clarity;
  if (max === emotionScore) return copy.emotion;
  if (max === energyScore) return copy.energy;
  return copy.balanced;
}
