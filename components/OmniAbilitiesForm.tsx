"use client";

import { useState } from "react";
import { computeOmniAbilities, type OmniAbilityLevels } from "@/lib/omniAbilities";
import { submitOmniAbilitiesAssessment } from "@/lib/submitEvaluation";
import { recordAbilityPracticeFact, recordOmniPatch, recordPracticeEvent, recordPracticeSession } from "@/lib/progressFacts";

const levelLabels = ["0", "1", "2", "3"];

const defaultLevels: OmniAbilityLevels = {
  p1: { tempo: 0, diaphragm: 0, exhale: 0, calm: 0, coherence: 0 },
  p2: { observe: 0, orient: 0, decide: 0, act: 0, timing: 0 },
  p3: {
    case1: { thought: 0, alternative: 0, values: 0, plan: 0 },
    case2: { thought: 0, alternative: 0, values: 0, plan: 0 },
  },
  p4: { zeroSwitch: 0, completion: 0, calm: 0 },
  p5: { breathingDays: 0, sleepConsistencyDays: 0, journalingDays: 0, microPauseDays: 0 },
};

type Props = {
  lang: "ro" | "en";
};

export default function OmniAbilitiesForm({ lang }: Props) {
  const [levels, setLevels] = useState<OmniAbilityLevels>(defaultLevels);
  const [result, setResult] = useState(() => computeOmniAbilities(defaultLevels));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [p1Active, setP1Active] = useState(false);
  const [p4Active, setP4Active] = useState(false);
  const [p1StartMs, setP1StartMs] = useState<number | null>(null);
  const [p4StartMs, setP4StartMs] = useState<number | null>(null);

  const updateLevel = (path: string[], value: number) => {
    setLevels((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as OmniAbilityLevels;
      let current: Record<string, unknown> | number = updated;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        if (typeof current === "object" && current !== null) {
          const container = current as Record<string, unknown>;
          if (typeof container[key] !== "object" || container[key] === null) {
            container[key] = {};
          }
          current = container[key] as Record<string, unknown> | number;
        }
      }
      if (typeof current === "object" && current !== null) {
        (current as Record<string, unknown>)[path[path.length - 1]] = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const scores = computeOmniAbilities(levels);
    setResult(scores);
    try {
      await submitOmniAbilitiesAssessment({
        lang,
        result: {
          total: scores.total,
          probes: scores.probes,
        },
        inputs: levels,
      });
      // Dev: bump skillsIndex minimally and mark Abil unlocked
      try {
        await recordOmniPatch({ abil: { unlocked: true } });
      } catch {}
      setMessage(
        lang === "ro"
          ? "Scorul Omni-Abilități a fost salvat."
          : "Omni-Abilities assessment saved.",
      );
    } catch (error) {
      console.error("OA submit failed", error);
      setMessage(
        lang === "ro"
          ? "Nu am putut salva evaluarea. Încearcă din nou."
          : "Could not save assessment. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="space-y-2 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Omni-Abilități</p>
        <h2 className="text-2xl font-semibold text-[#1F1F1F]">
          {lang === "ro"
            ? "Probe practice (breath, decizie, focus)"
            : "Practice probes (breath, decision, focus)"}
        </h2>
        <p className="text-sm text-[#4A3A30]">
          {lang === "ro"
            ? "Selectează nivelul actual pentru fiecare criteriu (0=nu, 3=excelent)."
            : "Select your current level for each criterion (0=not present, 3=excellent)."}
        </p>
      </header>

      <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "P1 · Respirație de coerență HRV" : "P1 · HRV coherence breathing"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={p1Active}
            onClick={() => {
              setP1Active(true);
              setP1StartMs(Date.now());
            }}
            className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#F6F2EE]"
          >
            {lang === "ro" ? "Start" : "Start"}
          </button>
          <button
            type="button"
            disabled={!p1Active}
            onClick={() => {
              const end = Date.now();
              const start = p1StartMs ?? end;
              const durationSec = Math.max(0, Math.round((end - start) / 1000));
              setP1Active(false);
              setP1StartMs(null);
              void recordPracticeEvent("breathing");
              void recordPracticeSession("breathing", start, durationSec);
            }}
            className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#F6F2EE]"
          >
            {lang === "ro" ? "Final" : "End"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {([
            ["tempo", lang === "ro" ? "Tempo 5–6/min" : "Tempo 5–6/min"],
            ["diaphragm", lang === "ro" ? "Respirație diafragmatică" : "Diaphragm breathing"],
            ["exhale", lang === "ro" ? "Expirație prelungită" : "Extended exhale"],
            ["calm", lang === "ro" ? "Calm perceput" : "Perceived calm"],
            ["coherence", lang === "ro" ? "Coerență ritmică" : "Rhythmic coherence"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
              {label}
              <div className="flex gap-2">
                {levelLabels.map((lvl, index) => (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => updateLevel(["p1", key], index)}
                    className={`flex-1 rounded-[6px] border px-2 py-1 text-xs font-semibold ${
                      levels.p1[key as keyof typeof levels.p1] === index
                        ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Minimal practice logger (dev): marks one practice and bumps skillsIndex */}
      <section className="space-y-3 rounded-[16px] border border-[#E4D8CE] bg-[#FFFBF7] px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <p className="text-sm font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "Practică rapidă" : "Quick practice"}
        </p>
        <p className="text-xs text-[#5C4F45]">
          {lang === "ro"
            ? "Marchează un exercițiu finalizat (ex. micro‑pauză 2’)."
            : "Mark one completed exercise (e.g., 2’ micro‑break)."}
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await recordAbilityPracticeFact({ exercise: "quick-log" });
              setMessage(lang === "ro" ? "Exercițiul a fost marcat." : "Practice logged.");
            } catch {
              setMessage(lang === "ro" ? "Nu am putut marca." : "Could not log.");
            }
          }}
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
        >
          {lang === "ro" ? "Marchează exercițiu" : "Log practice"}
        </button>
      </section>

      <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro"
            ? "P2 · Decizie sub presiune (OODA)"
            : "P2 · Decision under pressure (OODA)"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {([
            ["observe", lang === "ro" ? "Observe" : "Observe"],
            ["orient", lang === "ro" ? "Orientare" : "Orient"],
            ["decide", lang === "ro" ? "Decizie" : "Decide"],
            ["act", lang === "ro" ? "Acțiune" : "Act"],
            ["timing", lang === "ro" ? "Timp & Simplitate" : "Timing & simplicity"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
              {label}
              <div className="flex gap-2">
                {levelLabels.map((lvl, index) => (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => updateLevel(["p2", key], index)}
                    className={`flex-1 rounded-[6px] border px-2 py-1 text-xs font-semibold ${
                      levels.p2[key as keyof typeof levels.p2] === index
                        ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "P3 · Reframing dublu" : "P3 · Double reframing"}
        </h3>
        {(["case1", "case2"] as const).map((caseKey, idx) => (
          <div key={caseKey} className="rounded-[12px] border border-[#F6EDE2] bg-[#FFFBF7] px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-[#2C2C2C]">
              {lang === "ro" ? `Situația ${idx + 1}` : `Scenario ${idx + 1}`}
            </p>
            {([
              ["thought", lang === "ro" ? "Gând automat" : "Automatic thought"],
              ["alternative", lang === "ro" ? "Alternativă logică" : "Logical alternative"],
              ["values", lang === "ro" ? "Legare de valori" : "Values link"],
              ["plan", lang === "ro" ? "Plan comportamental" : "Behavioral plan"],
            ] as const).map(([key, label]) => (
              <label key={`${caseKey}-${key}`} className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
                {label}
                <div className="flex gap-2">
                  {levelLabels.map((lvl, index) => (
                    <button
                      key={`${caseKey}-${key}-${index}`}
                      type="button"
                      onClick={() => updateLevel(["p3", caseKey, key], index)}
                      className={`flex-1 rounded-[6px] border px-2 py-1 text-xs font-semibold ${
                        levels.p3[caseKey][key] === index
                          ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                          : "border-[#D8C6B6] text-[#2C2C2C]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </label>
            ))}
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "P4 · Focus sprint 5 minute" : "P4 · 5-minute focus sprint"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={p4Active}
            onClick={() => {
              setP4Active(true);
              setP4StartMs(Date.now());
            }}
            className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#F6F2EE]"
          >
            {lang === "ro" ? "Start" : "Start"}
          </button>
          <button
            type="button"
            disabled={!p4Active}
            onClick={() => {
              const end = Date.now();
              const start = p4StartMs ?? end;
              const durationSec = Math.max(0, Math.round((end - start) / 1000));
              setP4Active(false);
              setP4StartMs(null);
              void recordPracticeEvent("drill");
              void recordPracticeSession("drill", start, durationSec);
            }}
            className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#F6F2EE]"
          >
            {lang === "ro" ? "Final" : "End"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {([
            ["zeroSwitch", lang === "ro" ? "Zero switch" : "Zero switch"],
            ["completion", lang === "ro" ? "Completare task" : "Task completion"],
            ["calm", lang === "ro" ? "Calm/Atenție" : "Calm/Presence"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
              {label}
              <div className="flex gap-2">
                {levelLabels.map((lvl, index) => (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => updateLevel(["p4", key], index)}
                    className={`flex-1 rounded-[6px] border px-2 py-1 text-xs font-semibold ${
                      levels.p4[key as keyof typeof levels.p4] === index
                        ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro"
            ? "P5 · Aderență la rutină (ultimele 7 zile)"
            : "P5 · Routine adherence (last 7 days)"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {([
            ["breathingDays", lang === "ro" ? "Respirație 10 min/zi" : "Breathwork 10 min/day"],
            ["sleepConsistencyDays", lang === "ro" ? "Somn constant (<60 min)" : "Consistent sleep (<60min)"],
            ["journalingDays", lang === "ro" ? "Jurnal CGER" : "Journal (CGER)"],
            ["microPauseDays", lang === "ro" ? "Micro-pauze 3/zi" : "3 mindful breaks/day"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
              {label}
              <input
                type="number"
                min={0}
                max={7}
                value={levels.p5[key as keyof typeof levels.p5]}
                onChange={(event) =>
                  updateLevel(["p5", key], Number(event.target.value))
                }
                className="rounded-[6px] border border-[#D8C6B6] px-3 py-2 focus:border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? lang === "ro"
              ? "Se salvează..."
              : "Saving..."
            : lang === "ro"
            ? "Salvează Omni-Abilități"
            : "Save Omni-Abilities"}
        </button>
        {message ? <p className="text-sm text-[#4A3A30]">{message}</p> : null}
      </div>

      <section className="space-y-3 rounded-[16px] border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "Rezumat scor" : "Score summary"}
        </h3>
        <p className="text-sm text-[#4A3A30]">
          {lang === "ro" ? "Scor total O.A." : "Total OA score"}:{" "}
          <span className="font-semibold text-[#1F1F1F]">{result.total}/100</span>
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {(() => {
            const labels =
              lang === "ro"
                ? {
                    p1: "Respirație HRV",
                    p2: "Decizie OODA",
                    p3: "Reframing dublu",
                    p4: "Focus sprint",
                    p5: "Rutină",
                  }
                : {
                    p1: "HRV breathing",
                    p2: "OODA decision",
                    p3: "Double reframing",
                    p4: "Focus sprint",
                    p5: "Routine",
                  };
            const scaledMax: Record<string, number> = { p1: 20, p2: 25, p3: 20, p4: 15, p5: 20 };
            return Object.entries(result.probes).map(([key, value]) => (
              <div key={key} className="space-y-1 rounded-[10px] border border-[#F6EDE2] bg-[#FFFBF7] px-4 py-3">
                <p className="text-sm font-semibold text-[#2C2C2C]">
                  {labels[key as keyof typeof labels]} · {value.scaled}p
                </p>
                <div className="h-1.5 w-full rounded-full bg-[#F6EDE2]">
                  <div
                    className="h-full rounded-full bg-[#2C2C2C]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((value.scaled / (scaledMax[key] ?? 20)) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ));
          })()}
        </div>
      </section>
    </form>
  );
}
