"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MultiTypewriter from "./MultiTypewriter";
import { useI18n } from "../components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { NeutralCtaButton } from "@/components/ui/cta/NeutralCtaButton";
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
  "willpower_perseverance",
  "optimal_weight_management",
];

// Utility kept minimal; placeholder uses static template

export default function FirstScreen({ onNext, onSubmit, errorMessage = null, onAuthRequest }: FirstScreenProps) {
  const { lang, t } = useI18n();
  const placeholderTemplate = (typeof t("firstScreenPlaceholder") === "string"
    ? (t("firstScreenPlaceholder") as string)
    : (lang === 'ro'
      ? "Ex.: claritate decizie / stres / energie / relații…"
      : "e.g., clarity on a decision / stress / energy / relationships…"));
  const linesFirstInput = (() => {
    const v = t('wizard.firstInput');
    if (Array.isArray(v)) return v as string[];
    return (lang === 'ro'
      ? [
          'Înainte să îți spun ce poate face proiectul ăsta, vreau să văd cum arată problema prin ochii tăi.',
          'Scrie în câteva cuvinte ce te apasă cel mai tare acum, fără să cauți formularea perfectă.',
          'De aici pornește harta antrenamentului tău mental.',
        ]
      : [
          'Before I tell you what this project can do, I want to see the problem through your eyes.',
          'Write in a few words what weighs on you most now — don’t look for the perfect wording.',
          'From here your mental training map begins.',
        ]);
  })();

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // no need to track sequence flag, we only focus the input after text finishes
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const isMountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locale = lang === "en" ? "en" : "ro";
  const continueLabel = getString(t, "wizard.continue", lang === "ro" ? "Continua" : "Continue");
  const expressionLibrary = useMemo(() => getIntentExpressions(locale), [locale]);
  const categoryLabels = useMemo(() => {
    const labels = intentCategoryLabels;
    return {
      clarity: labels.clarity[locale] ?? labels.clarity.ro,
      relationships: labels.relationships[locale] ?? labels.relationships.ro,
      stress: labels.stress[locale] ?? labels.stress.ro,
      confidence: labels.confidence[locale] ?? labels.confidence.ro,
      balance: labels.balance[locale] ?? labels.balance.ro,
      willpower_perseverance: labels.willpower_perseverance[locale] ?? labels.willpower_perseverance.ro,
      optimal_weight_management:
        labels.optimal_weight_management[locale] ?? labels.optimal_weight_management.ro,
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

  // placeholderTemplate is used directly in JSX to avoid unused-var lint

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
    <section className="hero-canvas flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[var(--omni-bg-main)] px-6 py-16">
      <div className="relative z-10 w-full max-w-3xl rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-8 py-10 shadow-[0_8px_24px_rgba(31,41,55,0.08)]">
        <div className="flex items-center gap-2 pb-6 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-ink)]">
          <span className="h-[1px] w-10 bg-[var(--omni-energy)]" />
          OmniMental Coaching
        </div>
        <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-6 py-6">
          <div className="w-full flex justify-center">
            <div className="max-w-xl w-full text-left">
              <MultiTypewriter
                key={`first-input-${lang}`}
                lines={linesFirstInput}
                speed={60}
                gapMs={420}
                wrapperClassName="mb-5 w-full bg-transparent px-0 py-0"
                onDone={() => {
                  handleQuestionComplete();
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1 rounded-[8px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] transition hover:border-[var(--omni-energy)] focus-within:border-[var(--omni-ink)] focus-within:shadow-[0_0_0_1px_rgba(44,44,44,0.05)]">
                <input
                  ref={inputRef}
                  type="text"
                placeholder={isInputHovered ? "" : placeholderTemplate}
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
                  className="w-full rounded-[8px] bg-transparent px-4 py-3 text-base text-[var(--omni-ink)] placeholder:text-[var(--omni-muted)] transition focus:outline-none"
                />
              </div>
              <OmniCtaButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !input.trim()}
                className="min-w-[160px]"
              >
                {typeof continueLabel === "string" ? continueLabel : ""}
              </OmniCtaButton>
            </div>
            {errorMessage ? (
              <div className="flex items-center gap-3">
                <p className="text-xs text-[var(--omni-danger)]">{errorMessage}</p>
                {onAuthRequest && /conect|sign in/i.test(errorMessage) ? (
                  <NeutralCtaButton type="button" size="sm" onClick={onAuthRequest}>
                    {lang === "ro" ? "Autentifică-te" : "Sign in"}
                  </NeutralCtaButton>
                ) : null}
              </div>
            ) : null}

        </div>
      </div>

        {showIdeas ? (
          <div className="mt-6 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              <span>{lang === "ro" ? "Teme principale" : "Primary themes"}</span>
              <button
                type="button"
                onClick={handlePrimaryRefresh}
                className="text-[11px] uppercase tracking-[0.25em] text-[var(--omni-energy)] transition hover:text-[var(--omni-energy)]"
              >
                {lang === "ro" ? "Reîncarcă" : "Refresh"}
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--omni-muted)]">
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
                  className="flex flex-col gap-1 rounded-[10px] border border-[#E9DED3] bg-[var(--omni-surface-card)] px-4 py-3 text-left transition hover:border-[#C9B8A8]"
                >
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--omni-muted)]">
                    {categoryLabels[option.category]}
                  </span>
                  <span className="text-sm text-[var(--omni-ink)]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <button
            onClick={() => setShowIdeas((v) => !v)}
            className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--omni-border-soft)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)] transition hover:border-[#C9B8A8] hover:text-[var(--omni-energy)] focus:outline-none focus:ring-1 focus:ring-[#E4D8CE]"
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
