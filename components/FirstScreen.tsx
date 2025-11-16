"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";
import { useI18n } from "../components/I18nProvider";
import {
  detectCategoryFromRawInput,
  getIntentExpressions,
  intentCategoryLabels,
  type LocalizedIntentExpression,
  type IntentPrimaryCategory,
} from "../lib/intentExpressions";


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

// Simplified: no chip suggestions list, only curated primary themes
const CATEGORY_ORDER: IntentPrimaryCategory[] = [
  "clarity",
  "relationships",
  "stress",
  "confidence",
  "balance",
];

// Utility kept minimal; placeholder uses static template

export default function FirstScreen({ onNext, onSubmit, errorMessage = null, onAuthRequest }: FirstScreenProps) {
  const { lang, t } = useI18n();
  const welcomeValue = t("firstScreenWelcome");
  const question = t("firstScreenQuestion");
  const placeholderTemplateValue = t("firstScreenPlaceholder");
  const continueLabel = t("firstScreenContinueBtn");
  const welcomeText = typeof welcomeValue === "string" ? welcomeValue : "";
  const questionText =
    typeof question === "string" ? question : "";
  const placeholderTemplate =
    typeof placeholderTemplateValue === "string" ? placeholderTemplateValue : "";

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [introPhase, setIntroPhase] = useState<"welcome" | "question">(
    welcomeText ? "welcome" : "question"
  );
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
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

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const placeholderText = placeholderTemplate;

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
  };

  const handlePrimaryOptionSelect = (option: LocalizedIntentExpression) => {
    handleSubmit(option.label, { expressionId: option.id, category: option.category });
  };

  const handlePrimaryRefresh = () => {
    setPrimaryNonce((n) => n + 1);
  };

  // Suggestions chips removed; no additional labels required

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

        {showIdeas ? (
          <div className="mt-6 rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
              <span>{lang === "ro" ? "Teme principale" : "Primary themes"}</span>
              <button
                type="button"
                onClick={handlePrimaryRefresh}
                className="text-[11px] uppercase tracking-[0.25em] text-[#C07963] transition hover:text-[#E60012]"
              >
                {lang === "ro" ? "Reîncarcă" : "Refresh"}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#7B6B60]">
              {lang === 'ro'
                ? 'Alege una care rezonează cu tine, sau reîncarcă cu alte exemple.'
                : 'Pick one that resonates with you, or refresh for other examples.'}
            </p>
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
        ) : null}

        <div className="mt-6">
          <button
            onClick={() => setShowIdeas((v) => !v)}
            className="inline-flex items-center gap-2 rounded-[4px] border border-[#E4D8CE] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] transition hover:border-[#C9B8A8] hover:text-[#C07963] focus:outline-none focus:ring-1 focus:ring-[#E4D8CE]"
          >
            {showIdeas
              ? (lang === 'ro' ? 'Ascunde exemplele' : 'Hide examples')
              : (lang === 'ro' ? 'Inspiră-te din exemple' : 'See examples')}
          </button>
        </div>
      </div>
    </section>
  );
}
