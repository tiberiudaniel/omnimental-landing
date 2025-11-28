"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import InfoTooltip from "@/components/InfoTooltip";
import {
  getTodayKey,
  loadDailyCheckin,
  saveDailyCheckin,
  getDailyResetPreviousDateKey,
} from "@/lib/dailyReset";
import { buildOmniDailySnapshot, type OmniDailySnapshot } from "@/lib/omniState";
import type { ProgressFact } from "@/lib/progressFacts";

type SliderKey = "energy" | "stress" | "clarity" | "sleep";

const sliderCopy: Record<
  SliderKey,
  {
    labelRo: string;
    labelEn: string;
    minRo: string;
    minEn: string;
    maxRo: string;
    maxEn: string;
  }
> = {
  energy: {
    labelRo: "Energie",
    labelEn: "Energy",
    minRo: "Scăzută",
    minEn: "Low",
    maxRo: "Ridicată",
    maxEn: "High",
  },
  stress: {
    labelRo: "Stres",
    labelEn: "Stress",
    minRo: "Relaxat",
    minEn: "Calm",
    maxRo: "Tensionat",
    maxEn: "Tense",
  },
  clarity: {
    labelRo: "Claritate",
    labelEn: "Clarity",
    minRo: "Ceață mentală",
    minEn: "Foggy",
    maxRo: "Clar",
    maxEn: "Sharp",
  },
  sleep: {
    labelRo: "Somn",
    labelEn: "Sleep quality",
    minRo: "Fragmentat",
    minEn: "Poor",
    maxRo: "Regenerant",
    maxEn: "Great",
  },
};

type ValuePickerProps = {
  dimension: SliderKey;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  lang: string;
  optional?: boolean;
};

function ValuePicker({ dimension, value, onChange, disabled, lang, optional }: ValuePickerProps) {
  const copy = sliderCopy[dimension];
  const title = lang === "ro" ? copy.labelRo : copy.labelEn;
  const minLabel = lang === "ro" ? copy.minRo : copy.minEn;
  const maxLabel = lang === "ro" ? copy.maxRo : copy.maxEn;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#2D2017]">
        <span>
          {title}
          {optional ? (
            <span className="ml-1 text-[10px] font-normal uppercase tracking-[0.2em] text-[#A08F82]">
              {lang === "ro" ? "opțional" : "optional"}
            </span>
          ) : null}
        </span>
        <span>{value.toFixed(0)}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="w-full accent-[#C07963]"
      />
      <div className="flex items-center justify-between text-[10px] text-[#7B6B60]">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

type DailyResetCardProps = {
  lang: string;
  profileId?: string | null;
  facts: ProgressFact | null;
};

const LOCAL_RESET_STORAGE_KEY = "daily-reset-local-v1";

type LocalResetValues = {
  date: string;
  clarity: number;
  energy: number;
  stress: number;
  sleep?: number | null;
};

type LocalResetState = {
  lastCheckinDate: string | null;
  streakDays: number;
  values?: LocalResetValues;
};

const clampSliderValue = (value: unknown, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 10) return 10;
  return n;
};

const readLocalResetState = (): LocalResetState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_RESET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalResetState & {
      values?: LocalResetValues & { emotion?: number };
    };
    if (parsed?.values) {
      const values = parsed.values;
      const stress = clampSliderValue(
        values.stress ?? (values as { emotion?: number }).emotion,
        5,
      );
      return {
        ...parsed,
        values: {
          date: values.date,
          clarity: clampSliderValue(values.clarity, 5),
          energy: clampSliderValue(values.energy, 5),
          stress,
          ...(values.sleep !== undefined ? { sleep: clampSliderValue(values.sleep, 6) } : {}),
        },
      };
    }
    return parsed ?? null;
  } catch {
    return null;
  }
};

const writeLocalResetState = (state: LocalResetState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_RESET_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore local storage failures
  }
};

export function DailyResetCard({ lang, profileId, facts }: DailyResetCardProps) {
  const todayKey = useMemo(() => getTodayKey(), []);
  const [clarity, setClarity] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [stress, setStress] = useState(4);
  const [sleep, setSleep] = useState(6);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [localCache, setLocalCache] = useState<LocalResetState | null>(null);
  const baseSummary = facts?.omni?.daily ?? null;
  const [completedToday, setCompletedToday] = useState(() =>
    baseSummary?.lastCheckinDate === todayKey,
  );
  const [localStreak, setLocalStreak] = useState<number | null>(baseSummary?.streakDays ?? null);
  const [lastDate, setLastDate] = useState<string | null>(baseSummary?.lastCheckinDate ?? null);
  const fallbackMode =
    !profileId || /^guest[-_]/i.test(profileId) || /^demo/i.test(profileId);

  useEffect(() => {
    const local = readLocalResetState();
    setLocalCache(local);
    if (local?.lastCheckinDate === todayKey && local.values) {
      setCompletedToday(true);
      setLocalStreak((prev) => local.streakDays ?? prev);
      setLastDate((prev) => local.lastCheckinDate ?? prev);
      setClarity((prev) => local.values?.clarity ?? prev);
      setEnergy((prev) => local.values?.energy ?? prev);
      setStress((prev) => local.values?.stress ?? prev);
      if (typeof local.values.sleep === "number") {
        setSleep(local.values.sleep);
      }
    }
  }, [todayKey]);

  useEffect(() => {
    if (!baseSummary) return;
    setLocalStreak(baseSummary.streakDays ?? null);
    setLastDate(baseSummary.lastCheckinDate ?? null);
    if (baseSummary.lastCheckinDate === todayKey) {
      setCompletedToday(true);
    }
  }, [baseSummary, todayKey]);

  useEffect(() => {
    if (fallbackMode || !profileId) return;
    let cancelled = false;
    setInitializing(true);
    loadDailyCheckin(profileId)
      .then((payload) => {
        if (cancelled || !payload) return;
        setClarity((prev) => payload.clarity ?? prev);
        setEnergy((prev) => payload.energy ?? prev);
        const payloadStress = (payload as { stress?: number; emotion?: number }).stress;
        setStress((prev) => payloadStress ?? (payload as { emotion?: number }).emotion ?? prev);
        if (typeof payload.sleep === "number") {
          setSleep(payload.sleep);
        }
        setLastDate((prev) => payload.date ?? prev);
        if (payload.date && payload.date === todayKey) {
          setCompletedToday(true);
        }
      })
      .catch(() => {
        // noop
      })
      .finally(() => {
        if (!cancelled) {
          setInitializing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackMode, profileId, todayKey]);

  useEffect(() => {
    if (!completedToday && lastDate === todayKey) {
      setCompletedToday(true);
    }
  }, [completedToday, lastDate, todayKey]);

  const mergedFacts: ProgressFact | null = useMemo(() => {
    if (!localCache || localCache.lastCheckinDate !== todayKey || !localCache.values) {
      return facts;
    }
    const entry = convertLocalToEntry(localCache.values);
    const baseOmni = (facts?.omni ?? {}) as ProgressFact["omni"];
    const next = {
      ...(facts ?? {}),
      omni: {
        ...baseOmni,
        daily: {
          ...(baseOmni?.daily ?? {}),
          lastCheckinDate: localCache.lastCheckinDate ?? baseOmni?.daily?.lastCheckinDate,
          streakDays: localCache.streakDays ?? baseOmni?.daily?.streakDays,
          today: entry,
          history: {
            ...(baseOmni?.daily?.history ?? {}),
            ...(localCache.values?.date ? { [localCache.values.date]: entry } : {}),
          },
        },
      },
    } as ProgressFact;
    return next;
  }, [facts, localCache, todayKey]);

  const snapshot = useMemo(() => {
    if (!mergedFacts) return null;
    return buildOmniDailySnapshot({ progress: mergedFacts, facts: mergedFacts });
  }, [mergedFacts]);

  const streakLabel =
    typeof localStreak === "number"
      ? lang === "ro"
        ? `Serie: ${localStreak} zile`
        : `Streak: ${localStreak} days`
      : null;

  const allowInteractions = !fallbackMode ? Boolean(profileId) : true;

  const handleSave = async () => {
    const payload = {
      clarity,
      energy,
      stress,
      sleep,
    };
    const persistLocal = (streakDays: number) => {
      const nextState: LocalResetState = {
        lastCheckinDate: todayKey,
        streakDays,
        values: {
          date: todayKey,
          ...payload,
        },
      };
      writeLocalResetState(nextState);
      setLocalCache(nextState);
      setCompletedToday(true);
      setLocalStreak(streakDays);
      setLastDate(todayKey);
    };

    if (fallbackMode || !profileId) {
      const existing = readLocalResetState();
      const prevDate = existing?.lastCheckinDate ?? null;
      const yesterday = getDailyResetPreviousDateKey(todayKey);
      const continues = prevDate && yesterday && prevDate === yesterday;
      const streakDays = continues ? (existing?.streakDays ?? 0) + 1 : 1;
      persistLocal(streakDays);
      return;
    }

    setLoading(true);
    try {
      const result = await saveDailyCheckin(profileId, payload, {
        prevStreak: localStreak ?? baseSummary?.streakDays ?? null,
        prevDate: lastDate ?? baseSummary?.lastCheckinDate ?? null,
      });
      const streakDays =
        result?.streakDays ?? baseSummary?.streakDays ?? (localStreak ?? 0) + 1;
      persistLocal(streakDays);
    } catch (error) {
      console.warn("daily reset save failed", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSummary = () => {
    if (!snapshot || snapshot.date !== todayKey) {
      return (
        <div className="rounded-2xl border border-[#EEE3D7] bg-[#FFF6EE] px-3 py-3 text-sm text-[#5A4334]">
          {lang === "ro"
            ? "Ai completat reset-ul de azi. Datele se sincronizează în câteva momente."
            : "You logged today’s reset. Data is syncing shortly."}
        </div>
      );
    }
    const axisItems = [
      {
        key: "mentalClarity",
        label: lang === "ro" ? "Claritate mentală" : "Mental clarity",
        value: snapshot.axes.mentalClarity,
        delta: snapshot.deltas.mentalClarity,
      },
      {
        key: "emotionalBalance",
        label: lang === "ro" ? "Echilibru emoțional" : "Emotional balance",
        value: snapshot.axes.emotionalBalance,
        delta: snapshot.deltas.emotionalBalance,
      },
      {
        key: "physicalEnergy",
        label: lang === "ro" ? "Energie fizică" : "Physical energy",
        value: snapshot.axes.physicalEnergy,
        delta: snapshot.deltas.physicalEnergy,
      },
    ] as const;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B08A78]">
          <span>{lang === "ro" ? "Statusul de azi" : "Today’s snapshot"}</span>
          <InfoTooltip
            items={[
              lang === "ro"
                ? "Valorile sunt comparate cu media ta recentă. Săgețile arată dacă ești peste sau sub baseline."
                : "Values compare against your personal baseline; arrows show if you’re above or below trend.",
            ]}
            label={lang === "ro" ? "Detalii status" : "Snapshot details"}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {axisItems.map((axis) => {
            const deltaDisplay = formatAxisDelta(axis.delta, lang);
            return (
              <div
                key={axis.key}
                className="rounded-2xl border border-[#E7DED3] bg-[#FFFBF7] px-3 py-2 text-center"
              >
                <p className="text-[11px] font-semibold text-[#7B6B60]">{axis.label}</p>
                <p className="text-[20px] font-bold text-[#3C2D24]">
                  {axis.value.toFixed(1)}
                </p>
                <p className={`text-[11px] font-bold ${deltaDisplay.colorClass}`}>
                  {deltaDisplay.text}
                </p>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl border border-[#F0E3D8] bg-[#FFFBF7] px-3 py-2 text-[12px] text-[#5A4334]">
          {buildDailyResetMessage(snapshot, lang)}
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <div className="space-y-3">
      <ValuePicker
        dimension="energy"
        value={energy}
        onChange={setEnergy}
        disabled={loading || initializing}
        lang={lang}
      />
      <ValuePicker
        dimension="stress"
        value={stress}
        onChange={setStress}
        disabled={loading || initializing}
        lang={lang}
      />
      <ValuePicker
        dimension="clarity"
        value={clarity}
        onChange={setClarity}
        disabled={loading || initializing}
        lang={lang}
      />
      <ValuePicker
        dimension="sleep"
        value={sleep}
        onChange={setSleep}
        disabled={loading || initializing}
        lang={lang}
        optional
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || initializing}
        className="w-full rounded-full border border-[#C5B29E] bg-[#F7EEE3] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D2017] transition hover:border-[#B08A78] disabled:opacity-60"
      >
        {loading
          ? lang === "ro"
            ? "Se salvează..."
            : "Saving..."
          : lang === "ro"
            ? "Salvează ziua de azi"
            : "Save today"}
      </button>
    </div>
  );

  return (
    <Card className="rounded-2xl border border-[#E4DAD1] bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B08A78]">
            {lang === "ro" ? "Ritual zilnic" : "Daily ritual"}
          </p>
          <h3 className="text-base font-semibold text-[#2C2C2C]">
            {lang === "ro" ? "Daily Reset în 3 pași" : "Daily Reset in 3 steps"}
          </h3>
        </div>
        {streakLabel ? (
          <span className="text-[11px] font-semibold text-[#7B6B60]">{streakLabel}</span>
        ) : null}
      </div>
      {allowInteractions ? (
        completedToday ? (
          renderSummary()
        ) : (
          renderForm()
        )
      ) : (
        <p className="text-sm text-[#7B6B60]">
          {lang === "ro"
            ? "Autentifică-te pentru a nota rapid energia, stresul și claritatea de azi."
            : "Sign in to capture today’s energy, stress, and clarity."}
        </p>
      )}
      {fallbackMode ? (
        <p className="mt-2 text-[11px] text-[#7B6B60]">
          {lang === "ro"
            ? "Demo: datele sunt stocate local pe acest dispozitiv."
            : "Demo mode: data is stored locally on this device."}
        </p>
      ) : null}
    </Card>
  );
}

function formatAxisDelta(delta: number, lang: string): { text: string; colorClass: string } {
  if (!Number.isFinite(delta)) {
    return { text: lang === "ro" ? "0" : "0", colorClass: "text-[#7B6B60]" };
  }
  const sign = delta > 0 ? "+" : "";
  const text = `${sign}${delta.toFixed(1)}`;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "↔";
  const colorClass = delta > 0 ? "text-[#1F7A43]" : delta < 0 ? "text-[#B82B4F]" : "text-[#7B6B60]";
  return { text: `${text} ${arrow}`, colorClass };
}

function buildDailyResetMessage(snapshot: OmniDailySnapshot, lang: string) {
  const { axes, deltas } = snapshot;
  if (axes.physicalEnergy < 4.5) {
    return lang === "ro"
      ? "Ai energie mai scăzută azi — rămâi în ritm light, hidratează-te și fă o pauză activă de 3 minute."
      : "Energy feels low today — keep a light rhythm, hydrate, and plan a 3‑minute active break.";
  }
  if (axes.emotionalBalance < 4.5 || deltas.emotionalBalance < -0.8) {
    return lang === "ro"
      ? "Echilibrul emoțional e sub media ta. Încearcă un jurnal scurt sau exerciții de respirație 4-6 pentru a relaxa sistemul nervos."
      : "Emotional balance dips below baseline. Try a short journal entry or a 4-6 breathing set to ease the nervous system.";
  }
  if (axes.mentalClarity > 6.5 && deltas.mentalClarity > 0.5) {
    return lang === "ro"
      ? "Claritatea e excelentă azi — profită de fereastra asta pentru o lecție OmniKuno sau o decizie importantă."
      : "Clarity is strong — use this window for an OmniKuno lesson or one important decision.";
  }
  return lang === "ro"
    ? "Trend echilibrat. Continuă cu pași mici: finalizează reset-ul zilnic și marchează o acțiune Omni-Abil."
    : "Balanced trend. Keep the steady pace: lock the daily reset and mark one Omni-Abil action.";
}

function convertLocalToEntry(values: LocalResetValues) {
  const entry: {
    clarity: number;
    energy: number;
    stress: number;
    sleep?: number;
  } = {
    clarity: clampSliderValue(values.clarity, 6),
    energy: clampSliderValue(values.energy, 6),
    stress: clampSliderValue(values.stress, 4),
  };
  if (typeof values.sleep === "number") {
    entry.sleep = clampSliderValue(values.sleep, 6);
  }
  return entry;
}
