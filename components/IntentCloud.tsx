"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const mountedRef = useRef(true);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setStatus("idle");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [status]);

  const titleValue = t("intentCloudTitle");
  const helperValue = t("intentCloudHelper");
  const buttonValue = t("intentCloudButton");
  const rawList = t("intentCloudList");

  const title = typeof titleValue === "string" ? titleValue : "";
  const helper = typeof helperValue === "string" ? helperValue : "";
  const buttonLabel = typeof buttonValue === "string" ? buttonValue : "Continuă";
  const heroCopy = helper ? `${title} ${helper}` : title;
  const words = useMemo(
    () =>
      Array.isArray(rawList)
        ? rawList.filter((item): item is string => typeof item === "string")
        : [],
    [rawList]
  );

  const toggleWord = (word: string) => {
    setStatus("idle");
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
    setStatus("saving");
    const snapshot = [...selected];

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      onComplete(snapshot);
      transitionTimerRef.current = null;
    }, 500);

    void addDoc(collection(db, "userIntentTags"), {
      tags: selected,
      lang,
      timestamp: serverTimestamp(),
    })
      .then(() => {
        if (mountedRef.current) {
          setStatus("saved");
        }
      })
      .catch((err) => {
        console.error("intent cloud save failed", err);
        if (mountedRef.current) {
          setStatus("idle");
        }
      });
  };

  const progress = Math.min(selected.length / maxSelection, 1);
  const statusMessage =
    status === "saving"
      ? lang === "ro"
        ? "Se salvează alegerile tale..."
        : "Saving your picks..."
      : status === "saved"
      ? lang === "ro"
        ? "Notat. Continuăm."
        : "Saved. Moving on."
      : null;

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-12">
      <div className="grid w-full max-w-5xl gap-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 p-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px] md:grid-cols-[minmax(0,1fr)_260px] md:text-left">
        <div className="space-y-6">
          <TypewriterText text={heroCopy} speed={90} enableSound />
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {selected.length}/{maxSelection} selectate
          </div>
          <div className="mx-auto mt-1 h-1 w-full max-w-md rounded-full bg-[#F0E5DC] md:mx-0">
            <div
              className="h-full rounded-full bg-[#2C2C2C] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3 md:mx-0 md:justify-start">
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
                selected.length > maxSelection ||
                status === "saving"
              }
              className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buttonLabel}
            </button>
            {error && (
              <p className="text-sm text-[#E60012]">{error}</p>
            )}
            {!error && statusMessage && (
              <p className="text-sm text-[#2C2C2C]/70">{statusMessage}</p>
            )}
          </div>
        </div>

        <div className="relative hidden overflow-hidden rounded-[14px] border border-[#D8C6B6]/80 bg-[#F6F2EE]/90 shadow-[0_12px_32px_rgba(0,0,0,0.06)] md:block">
          <Image
            src="/assets/tech-mind-cogs-right.jpg"
            alt="Gears illustration"
            fill
            sizes="280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#FDF7EF]/85" />
          <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#2C2C2C]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
              Claritate ghidată
            </p>
            <p className="text-sm leading-relaxed">
              Când aliniezi mintea cu ritmul tău, apar logică și decizii curate. Alege
              cuvintele care descriu starea ta și continuăm împreună.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
