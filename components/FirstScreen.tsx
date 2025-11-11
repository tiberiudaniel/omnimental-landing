"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getDb, ensureAuth } from "../lib/firebase";
import {
  detectCategoryFromRawInput,
  getIntentExpressions,
  intentCategoryLabels,
  type LocalizedIntentExpression,
  type IntentPrimaryCategory,
} from "../lib/intentExpressions";

const db = getDb();

type FirstExpressionMeta = {
  expressionId?: string;
  category?: IntentPrimaryCategory;
};

interface FirstScreenProps {
  onNext: () => void;
  onSubmit?: (text: string, meta?: FirstExpressionMeta) => Promise<void | boolean> | void | boolean;
  errorMessage?: string | null;
  onAuthRequest?: () => void;
}

const PLACEHOLDER_SAMPLE_COUNT = 3;
const SUGGESTION_BATCH_MIN = 3;
const SUGGESTION_BATCH_MAX = 5;
const SUGGESTION_SELECTION_MAX = 2;
const SUGGESTION_FETCH_LIMIT = 100;
const PRIMARY_COLLECTION = "userInterests";
const FALLBACK_COLLECTIONS = ["usersInterests", "usersinterests", "userSuggestions"];
const CATEGORY_ORDER: IntentPrimaryCategory[] = [
  "clarity",
  "relationships",
  "stress",
  "confidence",
  "balance",
];

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

export default function FirstScreen({ onNext, onSubmit, errorMessage = null, onAuthRequest }: FirstScreenProps) {
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
  const [introPhase, setIntroPhase] = useState<"welcome" | "question">(
    welcomeText ? "welcome" : "question"
  );
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [suggestionSelectionError, setSuggestionSelectionError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locale = lang === "en" ? "en" : "ro";
  const expressionLibrary = useMemo(() => getIntentExpressions(locale), [locale]);
  const categoryLabels = useMemo(() => {
    const labels = intentCategoryLabels;
    return {
      clarity: labels.clarity[locale] ?? labels.clarity.ro,
      relationships: labels.relationships[locale] ?? labels.relationships.ro,
      stress: labels.stress[locale] ?? labels.stress.ro,
      confidence: labels.confidence[locale] ?? labels.confidence.ro,
      balance: labels.balance[locale] ?? labels.balance.ro,
    };
  }, [locale]);
  const buildPrimaryOptions = useCallback(() => {
    const options: LocalizedIntentExpression[] = [];
    CATEGORY_ORDER.forEach((category) => {
      const items = expressionLibrary.filter((entry) => entry.category === category);
      if (!items.length) return;
      const index = Math.floor(Math.random() * items.length);
      options.push(items[index]);
    });
    return options;
  }, [expressionLibrary]);
  // Evită mismatch SSR/CSR: generează aleator doar pe client
  const [primaryNonce, setPrimaryNonce] = useState(0);
  const isClient = typeof window !== "undefined";
  const primaryOptions = useMemo(() => {
    // Touch refresh counter to intentionally re-run when it changes
    void primaryNonce;
    return isClient ? buildPrimaryOptions() : [];
  }, [isClient, buildPrimaryOptions, primaryNonce]);

  const fallbackSuggestions = useMemo(() => {
    const suggestionPool = Array.isArray(suggestionValue) ? suggestionValue : [];
    return sanitizeSuggestions(suggestionPool);
  }, [suggestionValue]);

  const activeSuggestionPool =
    storedSuggestions.length > 0 ? storedSuggestions : fallbackSuggestions;

useEffect(() => {
  void ensureAuth().catch((err) => {
    console.warn("anonymous auth init failed", err);
  });

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
        await ensureAuth();
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

  const placeholderText = useMemo(() => {
    // Evită randomness în SSR: doar pe client folosim sugestii aleatorii
    if (!isClient || !storedSuggestions.length) {
      return placeholderTemplate;
    }
    const selection = pickRandom(
      storedSuggestions,
      Math.min(PLACEHOLDER_SAMPLE_COUNT, storedSuggestions.length),
    );
    if (!selection.length) {
      return placeholderTemplate;
    }
    return `Ex: ${selection.join("; ")}`;
  }, [isClient, placeholderTemplate, storedSuggestions]);

  const persistSuggestion = async (text: string) => {
    try {
      await ensureAuth();
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
    }
  };

  const handleSubmit = (value?: string, metadata?: FirstExpressionMeta) => {
    const text = value ?? input;
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setInput("");
    const resolvedMeta: FirstExpressionMeta = metadata ?? {
      category: detectCategoryFromRawInput(trimmed) ?? undefined,
    };

    const finish = (shouldAdvance: boolean) => {
      if (shouldAdvance) {
        onNext();
      }
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    };

    try {
      const result = onSubmit?.(trimmed, resolvedMeta);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        (result as Promise<unknown>)
          .then((value) => {
            // If handler returns false, do not advance
            const ok = value !== false;
            finish(ok);
          })
          .catch(() => {
            finish(false);
          });
      } else {
        // Non-promise handler: assume truthy return means success
        const ok = typeof result === "boolean" ? result : true;
        finish(ok);
      }
    } catch {
      finish(false);
    }

    if (!resolvedMeta?.expressionId) {
      void persistSuggestion(trimmed);
    }
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
    setSelectedSuggestions([]);
    setSuggestions(pullSuggestionBatch());
    setShowSuggestions(true);
  };

  const toggleSuggestionSelection = (value: string) => {
    setSuggestionSelectionError(null);
    setSelectedSuggestions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((entry) => entry !== value);
      }
      if (prev.length >= SUGGESTION_SELECTION_MAX) {
        setSuggestionSelectionError(
          lang === "ro"
            ? `Poți selecta cel mult ${SUGGESTION_SELECTION_MAX} opțiuni.`
            : `You can select up to ${SUGGESTION_SELECTION_MAX} options.`,
        );
        return prev;
      }
      return [...prev, value];
    });
  };

  const handleSuggestionSubmit = () => {
    if (selectedSuggestions.length < 2) {
      return;
    }
    const combined = selectedSuggestions.join(". ");
    handleSubmit(combined);
    setSelectedSuggestions([]);
    setShowSuggestions(false);
  };

  const handlePrimaryOptionSelect = (option: LocalizedIntentExpression) => {
    setSelectedSuggestions([]);
    setShowSuggestions(false);
    handleSubmit(option.label, { expressionId: option.id, category: option.category });
  };

  const handlePrimaryRefresh = () => {
    setPrimaryNonce((n) => n + 1);
  };

  const suggestionContinueLabel =
    lang === "ro" ? "Continuă cu selecțiile" : "Continue with selections";
  const suggestionRequirementLabel =
    lang === "ro"
      ? `Selectează încă ${Math.max(
          0,
          SUGGESTION_SELECTION_MAX - selectedSuggestions.length,
        )} opțiune pentru a continua.`
      : `Select ${Math.max(
          0,
          SUGGESTION_SELECTION_MAX - selectedSuggestions.length,
        )} more option(s) to continue.`;
  const suggestionMaxLabel =
    lang === "ro"
      ? `Poți folosi maximum ${SUGGESTION_SELECTION_MAX} sugestii.`
      : `You can use up to ${SUGGESTION_SELECTION_MAX} suggestions.`;

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
            {errorMessage ? (
              <div className="flex items-center gap-3">
                <p className="text-xs text-[#B8000E]">{errorMessage}</p>
                {onAuthRequest && /conect|sign in/i.test(errorMessage) ? (
                  <button
                    type="button"
                    onClick={onAuthRequest}
                    className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Autentifică-te" : "Sign in"}
                  </button>
                ) : null}
              </div>
            ) : null}

        </div>
      </div>

        <div className="mt-6 rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
            <span>{lang === "ro" ? "Alege rapid" : "Quick pick"}</span>
            <button
              type="button"
              onClick={handlePrimaryRefresh}
              className="text-[11px] uppercase tracking-[0.25em] text-[#C07963] transition hover:text-[#E60012]"
            >
              {lang === "ro" ? "Reîncarcă" : "Refresh"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {primaryOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => handlePrimaryOptionSelect(option)}
                className="flex flex-col gap-1 rounded-[10px] border border-[#D8C6B6] bg-[#FDF8F3] px-4 py-3 text-left transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
                  {categoryLabels[option.category]}
                </span>
                <span className="text-sm text-[#2C2C2C]">{option.label}</span>
              </button>
            ))}
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
              {suggestions.map((s) => {
                const isSelected = selectedSuggestions.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSuggestionSelection(s)}
                    className={`rounded-[8px] border px-4 py-2 text-sm transition ${
                      isSelected
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] bg-white text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-2 text-left">
              {selectedSuggestions.length < 2 && suggestionHint ? (
                <p className="text-xs text-[#2C2C2C]">{suggestionHint}</p>
              ) : null}
              {selectedSuggestions.length < 2 ? (
                <p className="text-xs text-[#B8000E]">{suggestionRequirementLabel}</p>
              ) : (
                <p className="text-xs text-[#2C2C2C]">{suggestionMaxLabel}</p>
              )}
              {suggestionSelectionError ? (
                <p className="text-xs text-[#B8000E]">{suggestionSelectionError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleSuggestionSubmit}
                disabled={selectedSuggestions.length < 2 || isSubmitting}
                className="inline-flex items-center justify-center rounded-[8px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] disabled:cursor-not-allowed disabled:border-[#2C2C2C]/30 disabled:text-[#2C2C2C]/30"
              >
                {suggestionContinueLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
