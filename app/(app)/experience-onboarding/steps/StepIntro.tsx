"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import GuideCard from "@/components/onboarding/GuideCard";
import { useI18n } from "@/components/I18nProvider";

export default function StepIntro({ onStart }: { onStart: () => void }) {
  const { lang } = useI18n();
  return (
    <section className="rounded-[24px] border-none bg-transparent px-0 py-0">
      <div className="relative overflow-hidden rounded-[24px] border border-[#E4DAD1] bg-[#FFF8F4] px-6 py-8 shadow-[0_32px_80px_rgba(48,21,8,0.18)]">
        <div className="relative z-10 text-[#3D1C10]">
          <div className="mb-3 text-xs uppercase tracking-[0.4em] text-[#96705B]">{lang === 'ro' ? 'Pas 1/7' : 'Step 1/7'}</div>
          <Typewriter
            className="text-base leading-relaxed text-white/95 md:text-lg"
            text={
              lang === 'ro'
                ? "Bine ai venit în onboarding-ul experiențial OmniMental. În câteva minute simți cum funcționează: un mini‑test, un jurnal scurt și un exercițiu de respirație."
                : "Welcome to the experiential onboarding. In a few minutes you’ll feel how it works: a mini‑quiz, a short journal, and a breathing exercise."
            }
          />
        </div>
      </div>
      {/* removed top start button; primary Start lives inside the Omni‑Kuno card */}

      {/* Omni‑Kuno intro card */}
      <div className="mt-6 w-full max-w-[22rem] md:max-w-[24rem] mx-auto">
        <GuideCard
          title="Omni‑Kuno"
          className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[#E4DAD1] bg-white px-6 py-6 text-[#2A140A] shadow-[0_18px_40px_rgba(0,0,0,0.12)] [&>h3]:sr-only"
          onClick={onStart}
        >
        <div className="relative z-10 text-center">
          <div className="mx-auto inline-flex min-w-[11rem] flex-col items-center justify-center rounded-[14px] border border-[#E6D7C8] bg-white px-5 py-3 text-[#3A1C0E] shadow-[0_14px_28px_rgba(0,0,0,0.15)]">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.35em] text-[#C07963]">OMNI‑KUNO</span>
            <span className="mt-1 text-[12px] font-medium text-[#5C4F45]">
              {lang === 'ro' ? 'Cunoaștere & concepte' : 'Knowledge & concepts'}
            </span>
          </div>
          <p className="mt-4 text-sm text-[#4A3A30]">
            {lang === 'ro'
              ? 'Omni‑Kuno este mini‑testul de cunoștințe care îți arată rapid nivelul de înțelegere pe conceptele cheie. În 3 întrebări afli punctajul inițial și vezi explicația corectă la fiecare răspuns.'
              : 'Omni‑Kuno is a short knowledge quiz that quickly shows your current understanding of the key concepts. In 3 questions you get an initial score and see the explanation for each answer.'}
          </p>
        </div>
        <div className="relative z-10 pt-4 flex justify-center">
          <button
            data-testid="eo-start"
            onClick={onStart}
            className="rounded-[12px] border border-[#2C2C2C] bg-transparent px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white"
          >
            {lang === 'ro' ? 'Începe' : 'Start'}
          </button>
          </div>
        </GuideCard>
      </div>
    </section>
  );
}
