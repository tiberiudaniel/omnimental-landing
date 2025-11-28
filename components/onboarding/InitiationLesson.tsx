"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import OnboardingLessonShell from "@/components/onboarding/OnboardingLessonShell";

type ThemeKey = "clarity" | "balance" | "energy" | "trust" | "generic";

const THEME_VARIANTS: Record<
  ThemeKey,
  { title: { ro: string; en: string }; obstacle: { ro: string; en: string } }
> = {
  clarity: {
    title: { ro: "De ce pierzi claritatea?", en: "Why does clarity slip away?" },
    obstacle: {
      ro: "Mintea sare către stimulii cu cel mai mare impact emoțional. Asta îți poate rupe focusul în mai puțin de 20 de secunde.",
      en: "The mind jumps toward the stimulus with the highest emotional impact. It can break your focus in under 20 seconds.",
    },
  },
  balance: {
    title: { ro: "De ce e greu să rămâi calm?", en: "Why is staying calm so hard?" },
    obstacle: {
      ro: "Creierul reacționează înainte să analizeze. Emoția vine prima, rațiunea vine târziu.",
      en: "The brain reacts before it analyzes. Emotion arrives first, reason shows up late.",
    },
  },
  energy: {
    title: { ro: "De ce se prăbușește energia mentală?", en: "Why does your mental energy crash?" },
    obstacle: {
      ro: "Nivelul tău de energie scade atunci când corpul operează în modul de protecție. Ritmul devine haotic.",
      en: "Your energy drops when your body runs in protection mode. The rhythm becomes chaotic.",
    },
  },
  trust: {
    title: { ro: "De ce se clatină încrederea atât de ușor?", en: "Why does confidence wobble so fast?" },
    obstacle: {
      ro: "Creierul arhivează momentele negative mai profund decât pe cele pozitive — o strategie evolutivă de supraviețuire.",
      en: "The brain archives negative moments more deeply than positive ones — an evolutionary survival strategy.",
    },
  },
  generic: {
    title: { ro: "De ce se simte începutul complicat?", en: "Why does the beginning feel complicated?" },
    obstacle: {
      ro: "Creierul prioritizează tiparele pe care deja le cunoaște, chiar și când știe că nu sunt cele mai bune pentru tine.",
      en: "The brain prioritizes the patterns it already knows, even when it realizes they’re not the best for you.",
    },
  },
};

const BASE_POINTS = {
  mechanism: {
    ro: "Mintea caută confort și familiaritate. Automatismul tău mental decide înaintea ta.",
    en: "The mind seeks comfort and familiarity. Your mental autopilot makes the choice before you do.",
  },
  discipline: {
    ro: "Disciplina nu este naturală pentru creier. Este o negociere continuă între sistemul emoțional și cel rațional.",
    en: "Discipline isn’t natural for the brain. It’s a constant negotiation between your emotional and rational systems.",
  },
  transformation: {
    ro: "Pe parcursul acestei călătorii, îți vei antrena mintea să fie orientată, nu reactivă. Vei învăța să-ți folosești atenția ca pe un instrument, nu ca pe o reacție.",
    en: "Throughout this journey you’ll train your mind to be oriented, not reactive. You’ll learn to use attention as a tool, not just a reflex.",
  },
  transition: {
    ro: "Cunoașterea fără practică rămâne teorie. Următorul pas este să o experimentezi.",
    en: "Knowledge without practice stays theory. The next step is to experience it.",
  },
};

const CTA_LABEL = {
  ro: "Continuă",
  en: "Continue",
};

const CTA_HINT = {
  ro: "Mergi mai departe către acțiunea imediată.",
  en: "Move forward to your immediate action.",
};

function resolveThemeKey(raw?: string | null): ThemeKey {
  if (!raw) return "generic";
  const value = raw.trim().toLowerCase();
  if (/clar|focus/.test(value)) return "clarity";
  if (/calm|stres|balance|emoț/i.test(value)) return "balance";
  if (/energie|ritm|energy/.test(value)) return "energy";
  if (/încredere|confiden/.test(value)) return "trust";
  return "generic";
}

type InitiationLessonProps = {
  themeLabel?: string | null;
  onContinue?: () => void;
};

export function InitiationLesson({ themeLabel, onContinue }: InitiationLessonProps) {
  const { lang } = useI18n();
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const router = useRouter();

  const themeKey = resolveThemeKey(themeLabel);
  const copy = THEME_VARIANTS[themeKey];

  const points = useMemo(
    () => [
      BASE_POINTS.mechanism[normalizedLang],
      BASE_POINTS.discipline[normalizedLang],
      copy.obstacle[normalizedLang],
      BASE_POINTS.transformation[normalizedLang],
      BASE_POINTS.transition[normalizedLang],
    ],
    [copy.obstacle, normalizedLang],
  );

  return (
    <OnboardingLessonShell
      label={normalizedLang === "ro" ? "Lecția 0 — Inițiere" : "Lesson 0 — Initiation"}
      title={copy.title[normalizedLang]}
      subtitle={CTA_HINT[normalizedLang]}
      meta={normalizedLang === "ro" ? "Inițiere · Minte · ~3 min" : "Initiation · Mind · ~3 min"}
      statusLabel={normalizedLang === "ro" ? "În desfășurare" : "In progress"}
      stepIndex={0}
      stepCount={1}
      continueLabel={CTA_LABEL[normalizedLang]}
      onContinue={() => {
        if (onContinue) onContinue();
        else router.push("/experience-onboarding?flow=initiation&step=first-action");
      }}
    >
      <ol className="space-y-4 text-base leading-relaxed text-[#3D1C10]">
        {points.map((text, idx) => (
          <li
            key={`point-${idx}`}
            className="rounded-[14px] border border-[#F0E8E0] bg-[#FFFBF7] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
          >
            {text}
          </li>
        ))}
      </ol>
    </OnboardingLessonShell>
  );
}
