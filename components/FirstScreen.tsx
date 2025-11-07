"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  limit,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import TypewriterText from "./TypewriterText";
import { useI18n } from "../components/I18nProvider";
import { getDb } from "../lib/firebase";

const db = getDb();

interface FirstScreenProps {
  onNext: () => void;
  onSubmit?: (text: string) => void;
}

const PLACEHOLDER_SAMPLE_COUNT = 3;
const SUGGESTION_BATCH_MIN = 3;
const SUGGESTION_BATCH_MAX = 5;
const SUGGESTION_FETCH_LIMIT = 100;
const PRIMARY_COLLECTION = "userInterests";
const FALLBACK_COLLECTIONS = ["usersInterests", "usersinterests", "userSuggestions"];

const sanitizeSuggestions = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

const pickRandom = (pool: string[], count: number) => {
  if (!pool.length) return [];
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  const limitCount = Math.min(count, copy.length);
  return copy.slice(0, limitCount);
};

export default function FirstScreen({ onNext, onSubmit }: FirstScreenProps) {
  const { lang, t } = useI18n();
  const welcomeValue = t("firstScreenWelcome");
  const question = t("firstScreenQuestion");
  const placeholderTemplateValue = t("firstScreenPlaceholder");
  const suggestionsLabel = t("firstScreenSuggestionsBtn");
  const continueLabel = t("firstScreenContinueBtn");
  const suggestionValue = t("firstScreenSuggestionsList");
  const suggestionHintValue = t("firstScreenSuggestionHint");
  const suggestionRefreshValue = t("firstScreenSuggestionsRefresh");
  const suggestionTitleValue = t("firstScreenSuggestionsTitle");
  const welcomeText = typeof welcomeValue === "string" ? welcomeValue : "";
  const questionText =
    typeof question === "string" ? question : "";
  const placeholderTemplate =
    typeof placeholderTemplateValue === "string" ? placeholderTemplateValue : "";
  const suggestionHint =
    typeof suggestionHintValue === "string" ? suggestionHintValue : "";
  const suggestionRefresh =
    typeof suggestionRefreshValue === "string" ? suggestionRefreshValue : "";
  const suggestionTitle =
    typeof suggestionTitleValue === "string" ? suggestionTitleValue : "";

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [storedSuggestions, setStoredSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderText, setPlaceholderText] = useState(placeholderTemplate);
  const [introPhase, setIntroPhase] = useState<"welcome" | "question">(
    welcomeText ? "welcome" : "question"
  );
  const [isInputHovered, setIsInputHovered] = useState(false);
  const isMountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fallbackSuggestions = useMemo(() => {
    const suggestionPool = Array.isArray(suggestionValue) ? suggestionValue : [];
    return sanitizeSuggestions(suggestionPool);
  }, [suggestionValue]);

  const activeSuggestionPool =
    storedSuggestions.length > 0 ? storedSuggestions : fallbackSuggestions;

useEffect(() => {
  let cancelled = false;
  isMountedRef.current = true;

    const fetchFromCollection = async (collectionName: string) => {
      try {
        const suggestionsQuery = query(
          collection(db, collectionName),
          orderBy("timestamp", "desc"),
          limit(SUGGESTION_FETCH_LIMIT)
        );
        return await getDocs(suggestionsQuery);
      } catch (err) {
        console.warn(`fetchSuggestions orderBy failed for ${collectionName}:`, err);
        try {
          return await getDocs(collection(db, collectionName));
        } catch (innerErr) {
          console.error(`fetchSuggestions failed for ${collectionName}:`, innerErr);
          return null;
        }
      }
    };

    const fetchSuggestions = async () => {
      try {
        const collectionsToQuery = [PRIMARY_COLLECTION, ...FALLBACK_COLLECTIONS];
        const snapshots = await Promise.all(
          collectionsToQuery.map((name) => fetchFromCollection(name))
        );
        if (cancelled) return;

        const fetched = snapshots
          .filter(
            (snapshot): snapshot is QuerySnapshot<DocumentData> => snapshot !== null
          )
          .flatMap((snapshot) =>
            snapshot.docs
              .map((doc) => doc.data()?.text)
              .filter((value): value is string => typeof value === "string")
          );

        if (!cancelled && isMountedRef.current) {
          setStoredSuggestions(sanitizeSuggestions(fetched));
        }
      } catch (err) {
        console.error("fetchSuggestions failed:", err);
      }
    };

    fetchSuggestions();

    return () => {
      isMountedRef.current = false;
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!storedSuggestions.length) {
      setPlaceholderText(placeholderTemplate);
      return;
    }

    const selection = pickRandom(
      storedSuggestions,
      Math.min(PLACEHOLDER_SAMPLE_COUNT, storedSuggestions.length),
    );
    if (!selection.length) {
      setPlaceholderText(placeholderTemplate);
      return;
    }

    setPlaceholderText(`Ex: ${selection.join("; ")}`);
  }, [placeholderTemplate, storedSuggestions]);

  useEffect(() => {
    setShowSuggestions(false);
    setSuggestions([]);
    setIntroPhase(welcomeText ? "welcome" : "question");
  }, [lang, welcomeText]);

  const persistSuggestion = async (text: string) => {
    try {
      await addDoc(collection(db, PRIMARY_COLLECTION), {
        text,
        timestamp: serverTimestamp(),
      });
      if (isMountedRef.current) {
        setStoredSuggestions((prev) =>
          sanitizeSuggestions([text, ...prev]).slice(0, SUGGESTION_FETCH_LIMIT)
        );
      }
    } catch (err) {
      console.error("addDoc failed:", err);
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = (value?: string) => {
    const text = value ?? input;
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setInput("");
    onSubmit?.(trimmed);
    onNext();

    void persistSuggestion(trimmed);
  };

  const pullSuggestionBatch = () => {
    if (!activeSuggestionPool.length) return [];
    const range = SUGGESTION_BATCH_MAX - SUGGESTION_BATCH_MIN + 1;
    const desired =
      Math.min(
        activeSuggestionPool.length,
        Math.floor(Math.random() * range) + SUGGESTION_BATCH_MIN,
      );
    return pickRandom(activeSuggestionPool, desired);
  };

  const handleSuggestionsToggle = () => {
    setSuggestions(pullSuggestionBatch());
    setShowSuggestions(true);
  };

  const handleQuestionComplete = () => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = setTimeout(() => {
      inputRef.current?.focus();
    }, 900);
  };

  return (
    <section className="hero-canvas flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="relative z-10 w-full max-w-3xl rounded-[12px] border border-[#E4D8CE] bg-white px-8 py-10 shadow-[0_8px_24px_rgba(31,41,55,0.08)]">
        <div className="flex items-center gap-2 pb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C]">
          <span className="h-[1px] w-10 bg-[#E60012]" />
          OmniMental Coaching
        </div>
        <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FDFCF9] px-6 py-6">
          {introPhase === "welcome" && welcomeText ? (
            <TypewriterText
              key={`${lang}-welcome-${welcomeText}`}
              text={welcomeText}
              speed={90}
              enableSound
              onComplete={() => setIntroPhase("question")}
              wrapperClassName="mb-5 w-full bg-transparent px-0 py-0"
            />
          ) : (
            <TypewriterText
              key={`${lang}-question-${questionText || "question"}`}
              text={questionText}
              speed={102}
              enableSound
              onComplete={handleQuestionComplete}
              wrapperClassName="mb-5 w-full bg-transparent px-0 py-0"
            />
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1 rounded-[8px] border border-[#D8C6B6] bg-white transition hover:border-[#2C2C2C] focus-within:border-[#2C2C2C] focus-within:shadow-[0_0_0_1px_rgba(44,44,44,0.05)]">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isInputHovered ? "" : placeholderText}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (showSuggestions) {
                      setShowSuggestions(false);
                      setSuggestions([]);
                    }
                  }}
                  onMouseEnter={() => setIsInputHovered(true)}
                  onMouseLeave={() => setIsInputHovered(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  className="w-full rounded-[8px] bg-transparent px-4 py-3 text-base text-[#2C2C2C] placeholder:text-[#9F9F9F] transition focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !input.trim()}
                className="inline-flex items-center justify-center rounded-[8px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] disabled:cursor-not-allowed disabled:border-[#2C2C2C]/30 disabled:text-[#2C2C2C]/30"
              >
                {typeof continueLabel === "string" ? continueLabel : ""}
              </button>
            </div>

          </div>
        </div>

        {!showSuggestions && (
          <div className="mt-6">
            <button
              onClick={handleSuggestionsToggle}
              className="inline-flex items-center gap-2 rounded-[4px] border border-[#E60012] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
            >
              {typeof suggestionsLabel === "string" ? suggestionsLabel : ""}
            </button>
          </div>
        )}

        {showSuggestions && (
          <div className="mt-8 space-y-3 rounded-[10px] border border-[#D8C6B6] bg-white px-5 py-6">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-[#2C2C2C]">
              <span>{suggestionTitle}</span>
              <button
                onClick={() => setSuggestions(pullSuggestionBatch())}
                className="text-[#E60012] transition hover:text-[#B8000E]"
              >
                {suggestionRefresh}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  className="rounded-[4px] border border-[#D8C6B6] bg-white px-4 py-2 text-sm text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {s}
                </button>
              ))}
            </div>
            {suggestionHint && (
              <p className="mt-4 text-xs text-[#2C2C2C]">{suggestionHint}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
