"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { getTodayKey, loadDailyCheckin, saveDailyCheckin, getDailyResetPreviousDateKey } from "@/lib/dailyReset";

type DailySummary = {
  streakDays?: number;
  lastCheckinDate?: string;
} | null | undefined;

type PickerProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  lang: string;
};

const scaleLabels: Record<string, string[]> = {
  clarity: ["Nesigur", "Foarte clar"],
  energy: ["Obosit", "Plin de energie"],
  emotion: ["Tensionat", "Calm"],
};

function ValuePicker({ label, value, onChange, disabled, lang }: PickerProps) {
  const [minLabel, maxLabel] = (() => {
    switch (label) {
      case "clarity":
        return lang === "ro" ? scaleLabels.clarity : ["Foggy", "Sharp"];
      case "energy":
        return lang === "ro" ? scaleLabels.energy : ["Drained", "Charged"];
      default:
        return lang === "ro" ? scaleLabels.emotion : ["Tense", "Calm"];
    }
  })();
  const title =
    label === "clarity"
      ? lang === "ro"
        ? "Claritate"
        : "Clarity"
      : label === "energy"
        ? lang === "ro"
          ? "Energie"
          : "Energy"
        : lang === "ro"
          ? "Emoții"
          : "Emotions";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#2D2017]">
        <span>{title}</span>
        <span>{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
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
  summary?: DailySummary;
};

const LOCAL_RESET_STORAGE_KEY = "daily-reset-local-v1";

type LocalResetState = {
  lastCheckinDate: string | null;
  streakDays: number;
  values?: {
    date: string;
    clarity: number;
    energy: number;
    emotion: number;
  };
};

const readLocalResetState = (): LocalResetState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_RESET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalResetState) : null;
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

export function DailyResetCard({ lang, profileId, summary }: DailyResetCardProps) {
  const [clarity, setClarity] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [emotion, setEmotion] = useState(3);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [localStreak, setLocalStreak] = useState<number | null>(summary?.streakDays ?? null);
  const [lastDate, setLastDate] = useState<string | null>(summary?.lastCheckinDate ?? null);
  const todayKey = useMemo(() => getTodayKey(), []);
  const fallbackMode = !profileId || /^guest[-_]/i.test(profileId) || /^demo/i.test(profileId);

  useEffect(() => {
    if (fallbackMode) {
      const local = readLocalResetState();
      const values = local?.values;
      if (values?.date === todayKey) {
        setClarity(values.clarity ?? 3);
        setEnergy(values.energy ?? 3);
        setEmotion(values.emotion ?? 3);
        setCompletedToday(true);
      } else {
        setCompletedToday(false);
      }
      setLocalStreak(local?.streakDays ?? null);
      setLastDate(local?.lastCheckinDate ?? null);
      setInitializing(false);
      return;
    }
    if (!profileId) return;
    let cancelled = false;
    setInitializing(true);
    loadDailyCheckin(profileId)
      .then((payload) => {
        if (cancelled || !payload) {
          return;
        }
        setClarity(payload.clarity ?? 3);
        setEnergy(payload.energy ?? 3);
        setEmotion(payload.emotion ?? 3);
        setLastDate(payload.date ?? lastDate ?? null);
        if (payload.date && payload.date === todayKey) {
          setCompletedToday(true);
        } else {
          setCompletedToday(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackMode, profileId, todayKey]);

  useEffect(() => {
    if (!completedToday && lastDate && lastDate === todayKey) {
      setCompletedToday(true);
    }
  }, [completedToday, lastDate, todayKey]);

  const handleSave = async () => {
    if (fallbackMode || !profileId) {
      const existing = readLocalResetState();
      const prevDate = existing?.lastCheckinDate ?? null;
      const yesterday = getDailyResetPreviousDateKey(todayKey);
      const continues = prevDate && yesterday && prevDate === yesterday;
      const streakDays = continues ? (existing?.streakDays ?? 0) + 1 : 1;
      const nextState: LocalResetState = {
        lastCheckinDate: todayKey,
        streakDays,
        values: { date: todayKey, clarity, energy, emotion },
      };
      writeLocalResetState(nextState);
      setCompletedToday(true);
      setLocalStreak(streakDays);
      setLastDate(todayKey);
      return;
    }
    setLoading(true);
    try {
      const result = await saveDailyCheckin(
        profileId,
        { clarity, energy, emotion },
        {
          prevStreak: localStreak ?? summary?.streakDays ?? null,
          prevDate: lastDate ?? summary?.lastCheckinDate ?? null,
        },
      );
      setCompletedToday(true);
      setLocalStreak(result?.streakDays ?? null);
      setLastDate(result?.lastCheckinDate ?? todayKey);
    } catch (error) {
      console.warn("daily reset save failed", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCompleted = () => (
    <div className="rounded-2xl border border-[#EEE3D7] bg-[#FFF6EE] px-3 py-3 text-sm text-[#5A4334]">
      {lang === "ro"
        ? fallbackMode
          ? "Demo: ai completat reset-ul de azi pe acest dispozitiv."
          : "Ai completat deja reset-ul de azi. Ne vedem mâine."
        : fallbackMode
          ? "Demo mode: you already logged today’s reset on this device."
          : "You already logged today’s reset. See you tomorrow."}
    </div>
  );

  const streakLabel =
    typeof localStreak === "number"
      ? lang === "ro"
        ? `Serie: ${localStreak} zile`
        : `Streak: ${localStreak} days`
      : null;

  const allowInteractions = !fallbackMode ? Boolean(profileId) : true;

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
        {streakLabel ? <span className="text-[11px] font-semibold text-[#7B6B60]">{streakLabel}</span> : null}
      </div>
      {allowInteractions ? (
        completedToday ? (
          renderCompleted()
        ) : (
          <div className="space-y-3">
            <ValuePicker label="clarity" value={clarity} onChange={setClarity} disabled={loading || initializing} lang={lang} />
            <ValuePicker label="energy" value={energy} onChange={setEnergy} disabled={loading || initializing} lang={lang} />
            <ValuePicker label="emotion" value={emotion} onChange={setEmotion} disabled={loading || initializing} lang={lang} />
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
        )
      ) : (
        <p className="text-sm text-[#7B6B60]">
          {lang === "ro"
            ? "Autentifică-te pentru a nota rapid claritatea, energia și emoțiile de azi."
            : "Sign in to log today’s clarity, energy, and emotions."}
        </p>
      )}
      {fallbackMode ? (
        <p className="mt-2 text-[11px] text-[#7B6B60]">
          {lang === "ro" ? "Demo: datele sunt stocate local pe acest dispozitiv." : "Demo mode: data is stored locally on this device."}
        </p>
      ) : null}
    </Card>
  );
}
