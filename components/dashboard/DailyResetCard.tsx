"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  getTodayKey,
  loadDailyCheckin,
  saveDailyCheckin,
  getDailyResetPreviousDateKey,
  getLastAxesEntries,
  type DailyAxesEntry,
} from "@/lib/dailyReset";
import { DailyResetAxesSection } from "@/components/dailyReset/DailyResetAxesSection";
import type { OmniDailySnapshot } from "@/lib/omniState";
import type { ProgressFact } from "@/lib/progressFacts";

type SliderKey = "energy" | "stress" | "clarity";

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
    labelRo: "Emoție",
    labelEn: "Emotion",
    minRo: "Relaxat",
    minEn: "Calm",
    maxRo: "Tensionat",
    maxEn: "Tense",
  },
  clarity: {
    labelRo: "Gândire",
    labelEn: "Thinking",
    minRo: "Ceață mentală",
    minEn: "Foggy",
    maxRo: "Clar",
    maxEn: "Sharp",
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
      <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--omni-ink)] leading-tight">
        <span>
          {title}
          {optional ? (
            <span className="ml-1 text-[10px] font-normal uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              {lang === "ro" ? "opțional" : "optional"}
            </span>
          ) : null}
        </span>
        <span>{value.toFixed(0)}/10</span>
      </div>
      <div className="relative h-[7px] w-full rounded-full bg-gradient-to-r from-[#FDF7F1] to-[color-mix(in_srgb,var(--omni-energy)_45%,var(--omni-bg-paper))]">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={disabled}
          className="absolute inset-0 h-full w-full appearance-none
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[color-mix(in_srgb,var(--omni-energy)_75%,var(--omni-bg-paper))]
            [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.25)]
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[color-mix(in_srgb,var(--omni-energy)_75%,var(--omni-bg-paper))]
            [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.25)]
            [&::-moz-range-track]:bg-transparent
            [&::-ms-thumb]:appearance-none
            [&::-ms-thumb]:h-4 [&::-ms-thumb]:w-4
            [&::-ms-thumb]:rounded-full
            [&::-ms-thumb]:bg-[color-mix(in_srgb,var(--omni-energy)_75%,var(--omni-bg-paper))]
            [&::-ms-track]:bg-transparent"
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--omni-muted)]">
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
  const [summaryEntries, setSummaryEntries] = useState<DailyAxesEntry[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const localeLang: "ro" | "en" = lang === "ro" ? "ro" : "en";

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

  const allowInteractions = !fallbackMode ? Boolean(profileId) : true;
  const summaryProps: DailyResetSummaryProps = {
    lang,
    streak: typeof localStreak === "number" ? localStreak : null,
    completedToday: allowInteractions && completedToday,
  };
  const shouldHideCard = allowInteractions && completedToday;

  useEffect(() => {
    if (!shouldHideCard || fallbackMode || !profileId) {
      setSummaryEntries(null);
      setSummaryLoading(false);
      return;
    }
    let cancelled = false;
    setSummaryLoading(true);
    getLastAxesEntries(profileId, 4)
      .then((data) => {
        if (!cancelled) {
          setSummaryEntries(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummaryEntries([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shouldHideCard, fallbackMode, profileId]);

  const summaryHasToday =
    summaryEntries?.some((entry) => entry.date === todayKey) ?? false;

  const fallbackSummaryEntries: DailyAxesEntry[] | null = useMemo(() => {
    if (summaryEntries && summaryEntries.length) return summaryEntries;
    const local = localCache;
    if (!local?.values) return null;
    const emotionScore =
      typeof local.values.stress === "number" ? Math.max(0, Math.min(10, 10 - local.values.stress)) : 5;
    const fallbackEntry: DailyAxesEntry = {
      id: `local-${local.lastCheckinDate ?? todayKey}`,
      date: local.lastCheckinDate ?? todayKey,
      createdAt: local.values.date ? new Date(`${local.values.date}T00:00:00Z`) : new Date(),
      clarityScore: local.values.clarity ?? 5,
      emotionScore,
      energyScore: local.values.energy ?? 5,
      clarityDeltaFromPersonalMean: 0,
      emotionDeltaFromPersonalMean: 0,
      energyDeltaFromPersonalMean: 0,
    };
    return [fallbackEntry];
  }, [summaryEntries, localCache, todayKey]);

  if (shouldHideCard) {
    const preferredEntries =
      (summaryHasToday && summaryEntries?.length ? summaryEntries : null) ?? fallbackSummaryEntries;
    if (preferredEntries?.length) {
      return <DailyResetAxesSection entries={preferredEntries} lang={localeLang} />;
    }
    if (!fallbackMode && profileId && summaryLoading) {
      return (
        <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-3 text-sm text-[var(--omni-muted)]">
          {lang === "ro" ? "Se încarcă insight-urile zilnice..." : "Loading daily insights..."}
        </Card>
      );
    }
    return (
      <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-3 text-sm text-[var(--omni-muted)]">
        <DailyResetSummary {...summaryProps} />
      </Card>
    );
  }

  const handleSave = async () => {
    const payload = {
      clarity,
      energy,
      stress,
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

  const renderForm = () => (
    <div className="space-y-2.5">
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
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || initializing}
        className="w-full rounded-full border border-[#C5B29E] bg-[#F7EEE3] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:border-[#B08A78] disabled:opacity-60"
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
    <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-3 sm:p-4">
      <DailyResetSummary {...summaryProps} />
      <div className="mt-1.5 mb-2.5 border-t border-[var(--omni-border-soft)]/70" />
      {allowInteractions ? (
        renderForm()
      ) : (
        <p className="text-sm text-[var(--omni-muted)]">
          {lang === "ro"
            ? "Autentifică-te pentru a nota rapid energia, emoția și gândirea de azi."
            : "Sign in to capture today’s energy, emotion, and thinking."}
        </p>
      )}
      {fallbackMode ? (
        <p className="mt-2 text-[11px] text-[var(--omni-muted)]">
          {lang === "ro"
            ? "Demo: datele sunt stocate local pe acest dispozitiv."
            : "Demo mode: data is stored locally on this device."}
        </p>
      ) : null}
    </Card>
  );
}

export type DailyResetSummaryProps = {
  lang: string;
  streak: number | null;
  completedToday: boolean;
};

export function DailyResetSummary({ lang, streak, completedToday }: DailyResetSummaryProps) {
  return (
    <div className="flex flex-col gap-2 text-[var(--omni-ink)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {lang === "ro" ? "Ritual zilnic" : "Daily ritual"}
          </p>
          <h3 className="text-base font-semibold text-[var(--omni-ink)]">
            {lang === "ro" ? "Pulsul zilei" : "Daily pulse"}
          </h3>
        </div>
        {typeof streak === "number" ? (
          <span className="text-[11px] font-semibold text-[var(--omni-muted)]">
            {lang === "ro" ? `Zile în serie: ${streak}` : `Streak: ${streak} days`}
          </span>
        ) : null}
      </div>
      <p className="text-[12px] text-[var(--omni-muted)]">
        {completedToday
          ? lang === "ro"
            ? "Ai bifat resetul de azi. Revino mâine pentru gândire, emoție și energie."
            : "You logged today’s reset. Come back tomorrow for thinking, emotion, and energy."
          : lang === "ro"
            ? "Notează rapid energia, emoția și gândirea ca să menții ritmul."
            : "Capture today’s energy, emotion, and thinking to stay on cadence."}
      </p>
    </div>
  );
}

export function buildDailyResetMessage(snapshot: OmniDailySnapshot, lang: string) {
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
