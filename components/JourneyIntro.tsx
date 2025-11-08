"use client";

import { useMemo } from "react";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";

interface JourneyIntroProps {
  onStart: () => void;
}

export default function JourneyIntro({ onStart }: JourneyIntroProps) {
  const { t } = useI18n();
  const titleValue = t("journeyIntroTitle");
  const quotesValue = t("journeyIntroQuotes");
  const bodyValue = t("journeyIntroBody");
  const buttonValue = t("journeyIntroButton");
  const title = useMemo(() => {
    if (Array.isArray(quotesValue)) {
      const validQuotes = quotesValue.filter(
        (quote): quote is string => typeof quote === "string" && quote.trim().length > 0,
      );
      if (validQuotes.length > 0) {
        // Select a random quote instead of always the first one
        const randomIndex = Math.floor(Math.random() * validQuotes.length);
        return validQuotes[randomIndex];
      }
    }
    return typeof titleValue === "string" ? titleValue : "";
  }, [quotesValue, titleValue]);
  const body = typeof bodyValue === "string" ? bodyValue : "";
  const buttonLabel = typeof buttonValue === "string" ? buttonValue : "Încep";

  return (
    <section id="intro" className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText key={title} text={title} speed={90} enableSound />
        {body ? <p className="text-base leading-relaxed text-[#2C2C2C]/80">{body}</p> : null}
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}