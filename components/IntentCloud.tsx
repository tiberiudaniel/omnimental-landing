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
  const words = useMemo(
    () =>
      Array.isArray(rawList)
        ? rawList.filter((item): item is string => typeof item === "string")
        : [],
    [rawList]
  );

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
        <TypewriterText
          text={title}
          speed={90}
          enableSound
        />
        {helper ? (
          <p className="text-sm text-[#2C2C2C]/80">{helper}</p>
        ) : null}
        <p className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
          {selected.length}/{maxSelection} selectate
        </p>
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
          {words.map((word) => {
            const isActive = selected.includes(word);
            return (
              <motion.button
                key={word}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => toggleWord(word)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                    : "border-[#D8C6B6] bg-white text-[#2C2C2C] hover:border-[#2C2C2C] hover:text-[#2C2C2C]"
                }`}
              >
                {word}
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
