"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import { getDb } from "../lib/firebase";

type IntentCloudProps = {
  onComplete: (tags: string[]) => void;
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

  const words = useMemo(() => {
    if (!Array.isArray(rawList)) return [];
    return rawList
      .filter((item): item is string => typeof item === "string")
      .map((value, index) => {
        const hash = Math.abs(
          [...value].reduce((acc, char) => acc + char.charCodeAt(0), index),
        );
        const size = hash % 2; // 0 regular, 1 large
        const shift = (hash % 9) - 4; // small horizontal shift
        const tone = hash % 3;
        return {
          value,
          size,
          shift,
          tone,
        };
      });
  }, [rawList]);

  const toggleWord = (word: string) => {
    setSelected((prev) => {
      if (prev.includes(word)) {
        return prev.filter((item) => item !== word);
      }
      if (prev.length >= maxSelection) {
        return prev;
      }
      return [...prev, word];
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
    const snapshot = [...selected];
    onComplete(snapshot);
    void addDoc(collection(db, "userIntentTags"), {
      tags: selected,
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

        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3 md:gap-4">
          {words.map(({ value, size, shift }) => {
            const isActive = selected.includes(value);
            return (
              <motion.button
                key={value}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => toggleWord(value)}
                className={`rounded-[18px] border bg-white px-4 py-2 text-sm font-medium tracking-[0.08em] shadow-[0_8px_20px_rgba(31,41,55,0.08)] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E60012] ${
                  isActive
                    ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                    : "border-[#C0B0A1] text-[#1F1F1F] hover:border-[#E60012] hover:text-[#E60012]"
                }`}
                style={{
                  fontSize: size === 1 ? "1rem" : "0.9rem",
                  transform: `translateX(${shift}px)`,
                  borderStyle: "solid",
                  transitionProperty: "transform, box-shadow, border, color, background",
                }}
                aria-pressed={isActive}
              >
                {value}
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
