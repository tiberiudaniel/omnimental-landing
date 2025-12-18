import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

export type WowCardContext = {
  eyebrow: string;
  title: string;
  description: string;
  question: string;
  options: string[];
};

export type WowCardExercise = {
  title: string;
  steps: string[];
  durationHint?: string;
};

export type WowCardReflection = {
  title: string;
  prompt: string;
  placeholder: string;
  mapping: string;
};

export type WowLessonDefinition = {
  moduleKey: string;
  title: string;
  summary: string;
  traitPrimary: CatAxisId;
  traitSecondary?: CatAxisId;
  canonDomain: CanonDomainId;
  context: WowCardContext;
  exercise: WowCardExercise;
  reflection: WowCardReflection;
};

export const WOW_LESSONS_V2: Record<string, WowLessonDefinition> = {
  clarity_01_illusion_of_clarity: {
    moduleKey: "clarity_01_illusion_of_clarity",
    title: "Iluzia clarității",
    summary: "Îți verifici claritatea reală formulând o singură propoziție decisivă.",
    traitPrimary: "clarity",
    traitSecondary: "focus",
    canonDomain: "decisionalClarity",
    context: {
      eyebrow: "Context",
      title: "Cât de clar este cu adevărat?",
      description:
        "Faptul că ceva îți pare clar în cap nu înseamnă că este clar. Creierul confundă familiaritatea cu claritatea.",
      question: "Cât de des te trezești că explici greu ce ai de făcut?",
      options: ["Rar", "Din când în când", "Foarte des"],
    },
    exercise: {
      title: "L3 · O propoziție reală",
      steps: [
        "Închide ochii pentru 3 respirații lente.",
        "Scrie o singură propoziție despre decizia reală din următoarele 20 de minute.",
        "Repetă propoziția cu voce joasă și observă dacă este concretă (timp + rezultat).",
      ],
      durationHint: "~2 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce situație aplici regula unei singure propoziții azi?",
      placeholder: "Ex.: înainte de ședința de 14:00 scriu propoziția și o citesc.",
      mapping: "Lucrezi pe Claritate decizională și susții Focusul.",
    },
  },
  focus_energy_01_energy_not_motivation: {
    moduleKey: "focus_energy_01_energy_not_motivation",
    title: "Energia ≠ motivație",
    summary: "Înveți să-ți separi energia de motivație și să folosești micro-reseturi de corp.",
    traitPrimary: "energy",
    traitSecondary: "flexibility",
    canonDomain: "functionalEnergy",
    context: {
      eyebrow: "Context",
      title: "De ce scade energia?",
      description:
        "Motivația nu pornește fără energie minimă. Dacă ignori corpul, creierul apasă frâna.",
      question: "Ce faci de obicei când simți că energia scade?",
      options: ["Forțez și continui", "Caut o distragere", "Îmi iau un micro-reset"],
    },
    exercise: {
      title: "L3 · Reset corp + minte",
      steps: [
        "Ridică-te în picioare și inspiră pe nas 4 secunde, expiră pe gură 6 secunde (3 repetări).",
        "Scutură ușor umerii și coapsele 10 secunde.",
        "Notează un singur semnal real de oboseală pe care îl vei monitoriza azi.",
      ],
      durationHint: "~2 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Ce micro-reset aplici azi și la ce oră?",
      placeholder: "Ex.: la 16:30 fac resetul respirație + scuturare înainte de call.",
      mapping: "Lucrezi pe Energie funcțională și susții Flexibilitatea mentală.",
    },
  },
  emotional_flex_01_automatic_reaction_amygdala: {
    moduleKey: "emotional_flex_01_automatic_reaction_amygdala",
    title: "Reacția automată",
    summary: "Identifici primul semnal de activare și inserezi o micro-pauză înainte de răspuns.",
    traitPrimary: "emotionalStability",
    traitSecondary: "recalibration",
    canonDomain: "emotionalRegulation",
    context: {
      eyebrow: "Context",
      title: "Ce face amigdala",
      description: "Amigdala răspunde în 200 ms. Dacă nu inserezi o pauză, răspunzi după reflex, nu după valori.",
      question: "Cât de des îți dai seama că ai răspuns prea repede?",
      options: ["Rar", "Uneori", "Des"],
    },
    exercise: {
      title: "L3 · Pauză de 5 respirații",
      steps: [
        "Adu-ți aminte ultima discuție tensionată.",
        "Simulează scena și fă 5 respirații lente înainte să răspunzi.",
        "Notează ce s-ar fi schimbat dacă răspunsul venea după pauză.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce context real vei folosi pauza de 5 respirații azi?",
      placeholder: "Ex.: înainte de ședința 1:1, respir 5 ori înainte de a răspunde.",
      mapping: "Lucrezi pe Reglare emoțională și susții Recalibrarea.",
    },
  },
};

export function getWowLessonDefinition(moduleKey: string | null | undefined): WowLessonDefinition | null {
  if (!moduleKey) return null;
  return WOW_LESSONS_V2[moduleKey] ?? null;
}

export function getWowLessonTraitPrimary(moduleKey: string | null | undefined): CatAxisId | null {
  return getWowLessonDefinition(moduleKey)?.traitPrimary ?? null;
}

export function resolveTraitPrimaryForModule(
  moduleKey: string | null | undefined,
  fallback?: CatAxisId | null,
): CatAxisId | null {
  const trait = getWowLessonTraitPrimary(moduleKey);
  if (trait) {
    return trait;
  }
  if (fallback) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[wow-lessons] Missing traitPrimary for module ${moduleKey ?? "unknown"}; falling back to plan trait ${fallback}.`);
    }
    return fallback;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[wow-lessons] Missing traitPrimary mapping for module ${moduleKey ?? "unknown"}; XP not awarded.`);
  }
  return null;
}
