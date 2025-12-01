"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import IllustratedStep from "@/components/onboarding/IllustratedStep";
import onboardingKunoSigns from "@/public/assets/onboarding-kuno-signs.jpg";

export default function StepIntro({ onStart }: { onStart: () => void }) {
  const { lang } = useI18n();
  const isRo = lang === "ro";
  return (
    <IllustratedStep
      image={onboardingKunoSigns}
      imageAlt={isRo ? "Drum cu panouri Omni-Kuno" : "Path with Omni-Kuno signs"}
      label="Start Omni-Kuno"
      title={isRo ? "Înainte de drum, verificăm resursele" : "Before the journey, check your resources"}
      body={
        <div className="space-y-3">
          <Typewriter
            className="text-sm md:text-base"
            text={
              isRo
                ? "Când pornești într-o călătorie, îți verifici resursele: cum te simți, dacă ești pregătit, dacă ai tot ce-ți trebuie. La fel facem și aici, înainte să intri în inițiere."
                : "Before any journey you check your resources: how you feel, whether you’re rested, whether you have everything you need. We’ll do the same here before you enter the initiation."
            }
          />
          <p className="text-sm md:text-base" style={{ color: "var(--text-main)" }}>
            {isRo
              ? "Hai să facem o mică trecere în revistă și să vedem cum arată resursele tale chiar acum."
              : "Let’s do a quick check-in and see how your resources look right now."}
          </p>
        </div>
      }
    >
      <div className="flex justify-start">
        <button
          data-testid="eo-start"
          onClick={onStart}
          className="omni-btn-ghost text-[13px] font-semibold tracking-[0.18em]"
        >
          {isRo ? "Începe" : "Start"}
        </button>
      </div>
    </IllustratedStep>
  );
}
