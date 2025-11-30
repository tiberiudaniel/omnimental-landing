"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useI18n } from "./I18nProvider";
import { getDb, areWritesDisabled } from "../lib/firebase";
import type { IntentCloudWord, IntentPrimaryCategory } from "@/lib/intentExpressions";
import { INTENT_MIN_SELECTION, INTENT_MAX_SELECTION, computeCategoryCounts, type IntentSelectionWord } from "@/lib/intentSelection";
import { getWizardStepTestId } from "./useWizardSteps";

type IntentWord = {
  key: string;
  label: string;
  category: IntentPrimaryCategory;
  size: number;
  shift: number;
};

export type IntentCloudResult = {
  tags: string[];
  categories: Array<{ category: IntentPrimaryCategory; count: number }>;
  selectionIds: string[];
};

const FALLBACK_WORDS: IntentCloudWord[] = [
  { id: "clarity_focus", label: "Claritate mentală", category: "clarity" },
  { id: "stress_relief", label: "Reduc stresul", category: "stress" },
  { id: "energy_reset", label: "Resetare energie", category: "balance" },
  { id: "confidence_boost", label: "Încredere sub presiune", category: "confidence" },
  { id: "relationships", label: "Relații sănătoase", category: "relationships" },
  { id: "calm_body", label: "Calm în corp", category: "stress" },
  { id: "focus_flow", label: "Focus în flux", category: "clarity" },
  { id: "habits", label: "Obiceiuri stabile", category: "balance" },
  { id: "willpower_anchor", label: "Voință și continuitate", category: "willpower_perseverance" },
  { id: "optimal_weight_reset", label: "Greutate optimă", category: "optimal_weight_management" },
];

type IntentCloudProps = {
  onComplete: (result: IntentCloudResult) => void;
  minSelection?: number;
  maxSelection?: number;
  words?: IntentCloudWord[];
  distributionHint?: string;
};

const DEFAULT_MIN = INTENT_MIN_SELECTION;
const DEFAULT_MAX = INTENT_MAX_SELECTION;

export default function IntentCloud({
  onComplete,
  minSelection = DEFAULT_MIN,
  maxSelection = DEFAULT_MAX,
  words: presetWords,
  distributionHint,
}: IntentCloudProps) {
  const { t, lang } = useI18n();
  const db = getDb();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleValue = t("intentCloudTitle");
  const helperValue = t("intentCloudHelper");
  const buttonValue = t("intentCloudButton");
  const rawList = t("intentCloudList");

  const title = typeof titleValue === "string" ? titleValue : "";
  const helper =
    typeof helperValue === "string" && helperValue.trim().length > 0
      ? helperValue
      : lang === "ro"
      ? "Alege între 5 și 7 afirmații care descriu cel mai bine starea ta actuală."
      : "Pick 5 to 7 statements that best describe what you feel right now.";
  const buttonLabel = typeof buttonValue === "string" ? buttonValue : (lang === 'ro' ? 'Continua' : 'Continue');
  const progress = Math.min(selected.length / maxSelection, 1);

  const words = useMemo<IntentWord[]>(() => {
    const ensureMinimumWords = (list: IntentCloudWord[], min = 7) => {
      if (list.length >= min) return list;
      const fallbackPool = FALLBACK_WORDS.filter(
        (entry) => !list.some((item) => item.id === entry.id || item.label === entry.label),
      );
      const needed = Math.max(min - list.length, 0);
      return [...list, ...fallbackPool.slice(0, needed)];
    };

    const sourceListRaw: IntentCloudWord[] =
      Array.isArray(presetWords) && presetWords.length > 0
        ? presetWords
        : Array.isArray(rawList)
        ? (rawList
            .map((item, index) => {
              if (!item || typeof item !== "object") {
                return null;
              }
              const record = item as Record<string, unknown>;
              const key =
                typeof record.key === "string" && record.key.trim().length > 0
                  ? record.key
                  : `intent-word-${index}`;
              const label =
                typeof record.label === "string" && record.label.trim().length > 0
                  ? record.label
                  : "";
              const category =
                typeof record.category === "string" && record.category.trim().length > 0
                  ? (record.category as string)
                  : "clarity";
              if (!label) {
                return null;
              }
              return { id: key, label, category };
            })
            .filter((entry): entry is IntentCloudWord => entry !== null) as IntentCloudWord[])
        : [];
    const sourceList = ensureMinimumWords(sourceListRaw);

    return sourceList.map((item, index) => {
      const base = item.label;
      const hash = Math.abs([...base].reduce((acc, char) => acc + char.charCodeAt(0), index));
      const size = hash % 2;
      const shift = (hash % 9) - 4;
      const category = CATEGORY_TINTS[item.category as IntentPrimaryCategory]
        ? (item.category as IntentPrimaryCategory)
        : "clarity";
      return {
        key: item.id ?? `${item.label}-${index.toString()}`,
        label: item.label,
        category,
        size,
        shift,
      };
    });
  }, [presetWords, rawList]);

  const wordDictionary = useMemo(() => {
    const map: Record<string, IntentWord> = {};
    words.forEach((word) => {
      map[word.key] = word;
    });
    return map;
  }, [words]);

  const selectedLabels = useMemo(
    () => selected.map((key) => wordDictionary[key]?.label ?? key),
    [selected, wordDictionary],
  );

  const toggleWord = (wordKey: string) => {
    setSelected((prev) => {
      if (prev.includes(wordKey)) {
        return prev.filter((item) => item !== wordKey);
      }
      if (prev.length >= maxSelection) {
        return prev;
      }
      return [...prev, wordKey];
    });
  };

  const handleContinue = async () => {
    if (submitting) return;
    if (selected.length < minSelection || selected.length > maxSelection) {
      const rangeText =
        minSelection === maxSelection
          ? `${minSelection}`
          : `${minSelection} și ${maxSelection}`;
      setError(
        lang === "ro"
          ? minSelection === maxSelection
            ? `Selectează ${rangeText} opțiuni pentru a continua.`
            : `Selectează între ${rangeText} opțiuni pentru a continua.`
          : minSelection === maxSelection
          ? `Please select ${rangeText} options to continue.`
          : `Please select between ${minSelection} and ${maxSelection} options to continue.`
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    const snapshot = [...selectedLabels];
    const selectionWords: Record<string, IntentSelectionWord> = Object.fromEntries(
      words.map((w) => [w.key, { id: w.key, label: w.label, category: w.category }]),
    );
    const { categories } = computeCategoryCounts(selectionWords, selected);
    const sortedCategories = categories.map((c) => ({ category: c.category as IntentPrimaryCategory, count: c.count }));

    onComplete({ tags: snapshot, categories: sortedCategories, selectionIds: [...selected] });
    if (!areWritesDisabled()) {
      void addDoc(collection(db, "userIntentTags"), {
        tags: snapshot,
        categories: sortedCategories,
        lang,
        timestamp: serverTimestamp(),
      })
        .catch((err) => {
          console.warn("intent cloud save failed", err);
        })
        .finally(() => {
          // small debounce to prevent double-advance
          setTimeout(() => setSubmitting(false), 600);
        });
    } else {
      // Skip network writes in test/demo; just clear submitting
      setTimeout(() => setSubmitting(false), 200);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[var(--omni-bg-main)] px-6 py-12">
      <div className="w-full max-w-5xl space-y-6 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/92 px-6 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <div className="w-full flex justify-center">
          <div className="max-w-xl w-full text-left">
            <p className="t-title" key={title}>{title}</p>
          </div>
        </div>
        {helper ? (
          <div className="mx-auto max-w-3xl text-[var(--omni-ink)]/80">
            <p className="t-body text-center">{helper}</p>
          </div>
        ) : null}
        {distributionHint ? (
          <p className="text-xs text-[var(--omni-muted)]">{distributionHint}</p>
        ) : null}

        <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--omni-ink)]/70">
            <span>
              {selected.length}/{maxSelection}{" "}
              {lang === "ro" ? "selectate" : "selected"}
            </span>
            <span>
              {lang === "ro" ? "Țintă: 5–7" : "Goal: 5–7"}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#E8DDD3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--omni-energy)] via-[var(--omni-brand)] to-[var(--omni-ink)] transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
            {Math.round(progress * 100)}%
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 md:gap-3" data-testid={`${getWizardStepTestId("intent")}-cloud`}>
          {words.map(({ key, label, category }) => {
            const isActive = selected.includes(key);
            const tint = CATEGORY_TINTS[category] ?? CATEGORY_TINTS.clarity;
            const baseClasses =
              "min-h-[34px] rounded-full border px-3 py-2 text-sm md:text-base font-medium shadow-[0_6px_14px_rgba(31,41,55,0.08)] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--omni-energy)]";
            const activeEmphasis = "ring-2 ring-offset-1 ring-[#2F261E]/30";
            const stateClasses = isActive
              ? `${tint.active} ${activeEmphasis} shadow-[0_10px_24px_rgba(31,41,55,0.15)]`
              : tint.idle;
            return (
              <motion.button
                key={key}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => toggleWord(key)}
                className={`${baseClasses} ${stateClasses}`}
                style={{ borderStyle: "solid", transitionProperty: "transform, box-shadow, border, color, background" }}
                aria-pressed={isActive}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
        <div className="space-y-3 pt-4">
          <button
            type="button"
          onClick={handleContinue}
          disabled={
            selected.length < minSelection ||
            selected.length > maxSelection || submitting
          }
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-energy)] disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="wizard-continue"
        >
          {submitting ? (lang === "ro" ? "Se procesează…" : "Processing…") : buttonLabel}
        </button>
          {/* Helper microcopy when disabled */}
          {selected.length < minSelection && !submitting ? (
            <p className="text-[11px] text-[var(--omni-muted)]">
              {lang === "ro" ? "Selectează 5–7 opțiuni pentru a continua." : "Pick 5–7 options to continue."}
            </p>
          ) : null}
          {error && (
            <p className="text-sm text-[var(--omni-energy)]">{error}</p>
          )}
        </div>
      </div>
    </section>
  );
}
const CATEGORY_TINTS: Record<
  IntentPrimaryCategory,
  { idle: string; active: string }
> = {
  clarity: {
    idle: "border-[#D9D0FF] bg-[#F7F3FF] text-[#3A2E66] hover:border-[#BBA9FF] hover:text-[#5B4ACB]",
    active: "border-[#8B7BFF] bg-[#E3DCFF] text-[#251B57]",
  },
  relationships: {
    idle: "border-[#F4C9D5] bg-[var(--omni-bg-paper)] text-[#6F233D] hover:border-[#E49BB1] hover:text-[#C24B71]",
    active: "border-[#E07B98] bg-[var(--omni-bg-paper)] text-[#5C1C33]",
  },
  stress: {
    idle: "border-[#F7D7C4] bg-[var(--omni-bg-paper)] text-[#70321E] hover:border-[#E9B79B] hover:text-[#C25A32]",
    active: "border-[#E39A72] bg-[var(--omni-bg-paper)] text-[#5B2A17]",
  },
  confidence: {
    idle: "border-[#CBDDF2] bg-[#F2F8FF] text-[#1F3C62] hover:border-[#AAC4E8] hover:text-[#2F5F96]",
    active: "border-[#7FB1E8] bg-[#E1F0FF] text-[#16304F]",
  },
  balance: {
    idle: "border-[#CDE4CB] bg-[var(--omni-bg-paper)] text-[#2F4B32] hover:border-[#A9D5A6] hover:text-[#4B7A4F]",
    active: "border-[#7BCB7B] bg-[var(--omni-bg-paper)] text-[#244226]",
  },
  willpower_perseverance: {
    idle: "border-[#F2D3A2] bg-[#FFF8EF] text-[#6B3F07] hover:border-[#E2B773] hover:text-[#A35A10]",
    active: "border-[#D08A2D] bg-[#FFEFD6] text-[#4A2802]",
  },
  optimal_weight_management: {
    idle: "border-[#F5D8C5] bg-[#FFF7F0] text-[#6F3D22] hover:border-[#E9B693] hover:text-[#B45A33]",
    active: "border-[#E3A072] bg-[#FFE8D8] text-[#4F2612]",
  },
};
