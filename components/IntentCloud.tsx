"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import { getDb, areWritesDisabled } from "../lib/firebase";
import type { IntentCloudWord, IntentPrimaryCategory } from "@/lib/intentExpressions";
import { INTENT_MIN_SELECTION, INTENT_MAX_SELECTION, computeCategoryCounts, type IntentSelectionWord } from "@/lib/intentSelection";

type IntentWord = {
  key: string;
  label: string;
  category: string;
  size: number;
  shift: number;
};

export type IntentCloudResult = {
  tags: string[];
  categories: Array<{ category: IntentPrimaryCategory; count: number }>;
  selectionIds: string[];
};

type IntentCloudProps = {
  onComplete: (result: IntentCloudResult) => void;
  minSelection?: number;
  maxSelection?: number;
  words?: IntentCloudWord[];
};

const DEFAULT_MIN = INTENT_MIN_SELECTION;
const DEFAULT_MAX = INTENT_MAX_SELECTION;

export default function IntentCloud({
  onComplete,
  minSelection = DEFAULT_MIN,
  maxSelection = DEFAULT_MAX,
  words: presetWords,
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
  const buttonLabel = typeof buttonValue === "string" ? buttonValue : (lang === 'ro' ? 'Continuă' : 'Continue');
  const progress = Math.min(selected.length / maxSelection, 1);

  const words = useMemo<IntentWord[]>(() => {
    const sourceList: IntentCloudWord[] =
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

    return sourceList.map((item, index) => {
      const base = item.label;
      const hash = Math.abs([...base].reduce((acc, char) => acc + char.charCodeAt(0), index));
      const size = hash % 2;
      const shift = (hash % 9) - 4;
      return {
        key: item.id ?? `${item.label}-${index.toString()}`,
        label: item.label,
        category: item.category,
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
    <section data-testid="wizard-step-intent" className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-12">
      <div className="w-full max-w-5xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-6 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <div className="w-full flex justify-center">
          <div className="max-w-xl w-full text-left">
            <TypewriterText text={title} speed={90} enableSound key={title} />
          </div>
        </div>
        {helper ? (
          <div className="mx-auto max-w-3xl text-[#2C2C2C]/80">
            <p className="t-body text-center">{helper}</p>
          </div>
        ) : null}

        <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#2C2C2C]/70">
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
              className="h-full rounded-full bg-gradient-to-r from-[#E60012] via-[#C24B17] to-[#2C2C2C] transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A08F82]">
            {Math.round(progress * 100)}%
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 md:gap-3" data-testid="wizard-step-intent-cloud">
          {words.map(({ key, label }) => {
            const isActive = selected.includes(key);
            return (
              <motion.button
                key={key}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => toggleWord(key)}
                className={`min-h-[34px] rounded-full border px-3 py-2 text-sm md:text-base font-medium shadow-[0_6px_14px_rgba(31,41,55,0.08)] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E60012] ${
                  isActive
                    ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                    : "border-[#D6C7B8] bg-[#FCF7F1] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                }`}
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
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="wizard-continue"
        >
          {submitting ? (lang === "ro" ? "Se procesează…" : "Processing…") : buttonLabel}
        </button>
          {/* Helper microcopy when disabled */}
          {selected.length < minSelection && !submitting ? (
            <p className="text-[11px] text-[#7B6B60]">
              {lang === "ro" ? "Selectează 5–7 opțiuni pentru a continua." : "Pick 5–7 options to continue."}
            </p>
          ) : null}
          {error && (
            <p className="text-sm text-[#E60012]">{error}</p>
          )}
        </div>
      </div>
    </section>
  );
}
