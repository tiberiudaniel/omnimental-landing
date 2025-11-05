"use client";

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
import { db } from "../firebaseConfig";

interface FirstScreenProps {
  onNext: () => void;
}

const MAX_SUGGESTIONS = 2;
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

export default function FirstScreen({ onNext }: FirstScreenProps) {
  const { lang, t } = useI18n();
  const question = t("firstScreenQuestion");
  const placeholderTemplateValue = t("firstScreenPlaceholder");
  const suggestionsLabel = t("firstScreenSuggestionsBtn");
  const continueLabel = t("firstScreenContinueBtn");
  const suggestionValue = t("firstScreenSuggestionsList");
  const microcopyValue = t("firstScreenMicrocopy");
  const suggestionHintValue = t("firstScreenSuggestionHint");
  const suggestionRefreshValue = t("firstScreenSuggestionsRefresh");
  const suggestionTitleValue = t("firstScreenSuggestionsTitle");
  const placeholderTemplate =
    typeof placeholderTemplateValue === "string" ? placeholderTemplateValue : "";
  const microcopy = typeof microcopyValue === "string" ? microcopyValue : "";
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
  const isMountedRef = useRef(true);

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
    if (!activeSuggestionPool.length) {
      setPlaceholderText(placeholderTemplate);
      return;
    }

    const selection = pickRandom(activeSuggestionPool, Math.min(2, activeSuggestionPool.length));
    if (!selection.length) {
      setPlaceholderText(placeholderTemplate);
      return;
    }

    const colonIndex = placeholderTemplate.indexOf(":");
    const prefix =
      colonIndex >= 0
        ? placeholderTemplate.slice(0, colonIndex + 1).trim()
        : "";
    const prefixWithSpace = prefix ? `${prefix} ` : "";
    setPlaceholderText(`${prefixWithSpace}${selection.join(", ")}`);
  }, [placeholderTemplate, activeSuggestionPool]);

  useEffect(() => {
    setShowSuggestions(false);
    setSuggestions([]);
  }, [lang]);

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
    setSuggestions([]);
    setShowSuggestions(false);
    onNext();

    void persistSuggestion(trimmed);
  };

  const handleSuggestionsToggle = () => {
    setSuggestions(pickRandom(activeSuggestionPool, MAX_SUGGESTIONS));
    setShowSuggestions(true);
  };

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-11 shadow-[0_12px_28px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 pb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C]">
          <span className="h-[1px] w-10 bg-[#D8C6B6]" />
          OmniMental Coaching
        </div>
        <TypewriterText text={typeof question === "string" ? question : ""} />

        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1 rounded-[6px] border border-[#D8C6B6] bg-white transition hover:border-[#2C2C2C] focus-within:border-[#2C2C2C] focus-within:shadow-[0_0_0_1px_rgba(44,44,44,0.05)]">
              <input
                type="text"
                placeholder={placeholderText}
                value={input}
                onChange={(e) => {
                  const value = e.target.value;
                  setInput(value);
                  if (showSuggestions) {
                    setShowSuggestions(false);
                    setSuggestions([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
                className="w-full rounded-[6px] px-4 py-3 text-base text-[#2C2C2C] placeholder:text-[#9F9F9F] transition focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !input.trim()}
              className="inline-flex items-center justify-center rounded-[6px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {typeof continueLabel === "string" ? continueLabel : ""}
            </button>
          </div>

          <div className="h-[1px] w-full bg-[#F6F2EE]" />
        </div>

        {!showSuggestions && (
          <div className="mt-6">
            <button
              onClick={handleSuggestionsToggle}
              className="inline-flex items-center gap-2 rounded-[6px] border border-[#E60012] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E60012] transition hover:bg-[#E60012]/10 focus:outline-none focus:ring-1 focus:ring-[#E60012]"
            >
              {typeof suggestionsLabel === "string" ? suggestionsLabel : ""}
            </button>
          </div>
        )}

        {showSuggestions && (
          <div className="mt-8 rounded-[6px] border border-[#D8C6B6] bg-[#F6F2EE] px-5 py-6">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-[#2C2C2C]">
              <span>{suggestionTitle}</span>
              <button
                onClick={() => setSuggestions(pickRandom(activeSuggestionPool, MAX_SUGGESTIONS))}
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
