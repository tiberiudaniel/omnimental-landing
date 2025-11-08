"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import { getDb } from "../lib/firebase";

const CATEGORY_KEYS = [
  "calm",
  "relationships",
  "career",
  "clarity",
  "boundaries",
  "selfTrust",
] as const;

export type IntentCategory = (typeof CATEGORY_KEYS)[number];

type IntentWord = {
  key: string;
  label: string;
  category: IntentCategory;
  size: number;
  shift: number;
};

export type IntentCloudResult = {
  tags: string[];
  categories: Array<{ category: IntentCategory; count: number }>;
};

type IntentCloudProps = {
  onComplete: (result: IntentCloudResult) => void;
  minSelection?: number;
  maxSelection?: number;
};

const DEFAULT_MIN = 3;
const DEFAULT_MAX = 5;

export default function IntentCloud({
  onComplete,
  minSelection = DEFAULT_MIN,
  maxSelection = DEFAULT_MAX,
}: IntentCloudProps) {
  const { t, lang } = useI18n();
  const db = getDb();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const titleValue = t("intentCloudTitle");
  const helperValue = t("intentCloudHelper");
  const buttonValue = t("intentCloudButton");
  const rawList = t("intentCloudList");

  const title = typeof titleValue === "string" ? titleValue : "";
  const helper = typeof helperValue === "string" ? helperValue : "";
  const buttonLabel = typeof buttonValue === "string" ? buttonValue : "Continuă";
  const progress = Math.min(selected.length / maxSelection, 1);

  const words = useMemo<IntentWord[]>(() => {
    if (!Array.isArray(rawList)) return [];
    const isCategory = (value: unknown): value is IntentCategory =>
      typeof value === "string" && CATEGORY_KEYS.includes(value as IntentCategory);

    return rawList.flatMap((item, index) => {
      if (!item || typeof item !== "object") {
        return [];
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

      if (!label) {
        return [];
      }

      const category = isCategory(record.category) ? record.category : "clarity";

      const hash = Math.abs([...label].reduce((acc, char) => acc + char.charCodeAt(0), index));
      const size = hash % 2;
      const shift = (hash % 9) - 4;

      return [
        {
          key,
          label,
          category,
          size,
          shift,
        },
      ];
    });
  }, [rawList]);

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
    const snapshot = [...selectedLabels];
    const categoryCounts = selected.reduce((acc, key) => {
      const category = wordDictionary[key]?.category ?? "clarity";
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {} as Record<IntentCategory, number>);

    const sortedCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category: category as IntentCategory,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    onComplete({ tags: snapshot, categories: sortedCategories });
    void addDoc(collection(db, "userIntentTags"), {
      tags: snapshot,
      categories: sortedCategories,
      lang,
      timestamp: serverTimestamp(),
    }).catch((err) => {
      console.error("intent cloud save failed", err);
    });
  };

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-12">
      <div className="w-full max-w-5xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-6 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText text={title} speed={90} enableSound key={title} />
        {helper ? (
          <p className="text-sm text-[#2C2C2C]/80">{helper}</p>
        ) : null}

        <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#2C2C2C]/70">
            <span>
              {selected.length}/{maxSelection} selectate
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#E8DDD3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E60012] via-[#C24B17] to-[#2C2C2C] transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 md:gap-3">
          {words.map(({ key, label, size, shift }) => {
            const isActive = selected.includes(key);
            return (
              <motion.button
                key={key}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => toggleWord(key)}
                className={`rounded-[14px] border px-3.5 py-1.5 text-[0.82rem] font-semibold uppercase tracking-[0.18em] shadow-[0_6px_14px_rgba(31,41,55,0.08)] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E60012] ${
                  isActive
                    ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                    : "border-[#D6C7B8] bg-[#FCF7F1] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                }`}
                style={{
                  fontSize: size === 1 ? "0.85rem" : "0.78rem",
                  transform: `translateX(${shift}px)`,
                  borderStyle: "solid",
                  transitionProperty: "transform, box-shadow, border, color, background",
                }}
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
            selected.length > maxSelection
          }
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonLabel}
        </button>
          {error && (
            <p className="text-sm text-[#E60012]">{error}</p>
          )}
        </div>
      </div>
    </section>
  );
}
