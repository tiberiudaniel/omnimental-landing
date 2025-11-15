"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import GuideCard from "@/components/onboarding/GuideCard";
import { useI18n } from "@/components/I18nProvider";

export default function StepIntro({ onStart }: { onStart: () => void }) {
  const { lang } = useI18n();
  return (
    <section className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-8 shadow-sm">
      <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Pas 1/7' : 'Step 1/7'}</div>
      <Typewriter text={lang === 'ro' ? "Bine ai venit în onboarding-ul experiențial OmniMental. În câteva minute simți cum funcționează: un mini‑test, un jurnal scurt și un exercițiu de respirație." : "Welcome to the experiential onboarding. In a few minutes you’ll feel how it works: a mini‑quiz, a short journal, and a breathing exercise."} />
      {/* removed top start button; primary Start lives inside the Omni‑Kuno card */}

      {/* Omni‑Kuno intro card */}
      <div className="mt-6 w-full max-w-[22rem] md:max-w-[24rem] mx-auto">
        <GuideCard
          title="Omni‑Kuno"
          className="flex flex-col justify-between rounded-[14px] border-[#E4DAD1] bg-[#FFFBF7] px-6 py-5 shadow-[0_12px_24px_rgba(0,0,0,0.06)]"
          onClick={onStart}
        >
          <div className="text-center">
            {/* Title pill (white, thin border, two lines inside) */}
            <div className="mx-auto inline-flex min-w-[11rem] flex-col items-center justify-center rounded-[14px] border border-[#2C2C2C] bg-white px-5 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.4em] text-[#111111]">OMNI‑KUNO</span>
              <span className="mt-1 text-[12px] font-medium text-[#5C4F45]">
                {lang === 'ro' ? 'Cunoaștere & concepte' : 'Knowledge & concepts'}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#2C2C2C]">
              {lang === 'ro'
                ? 'Omni‑Kuno este mini‑testul de cunoștințe care îți arată rapid nivelul de înțelegere pe conceptele cheie. În 3 întrebări afli punctajul inițial și vezi explicația corectă la fiecare răspuns.'
                : 'Omni‑Kuno is a short knowledge quiz that quickly shows your current understanding of the key concepts. In 3 questions you get an initial score and see the explanation for each answer.'}
            </p>
          </div>
          <div className="pt-3 flex justify-center">
            <button
              data-testid="eo-start"
              onClick={onStart}
              className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              {lang === 'ro' ? 'Începe' : 'Start'}
            </button>
          </div>
        </GuideCard>
      </div>
    </section>
  );
}
