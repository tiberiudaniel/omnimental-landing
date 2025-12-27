"use client";

export type ExploreAxisId = "clarity" | "focus" | "energy" | "tension";

export type ExploreAxisOption = {
  id: ExploreAxisId;
  emoji: string;
  title: string;
  description: string;
};

export type ExploreAxisLesson = {
  id: ExploreAxisId;
  headline: string;
  intro: string[];
  microActions: string[];
  outro: string;
};

export const EXPLORE_AXIS_OPTIONS: ExploreAxisOption[] = [
  {
    id: "clarity",
    emoji: "🟩",
    title: "Claritate mentală",
    description: "Cum se reduce ceața și confuzia.",
  },
  {
    id: "focus",
    emoji: "🟦",
    title: "Focus & direcție",
    description: "Cum îți aduni atenția pe un singur lucru.",
  },
  {
    id: "energy",
    emoji: "🟥",
    title: "Energie mentală",
    description: "Cum îți gestionezi oboseala și ritmul.",
  },
  {
    id: "tension",
    emoji: "🟪",
    title: "Tensiune & reacții",
    description: "Cum se acumulează tensiunea și cum se poate regla.",
  },
];

export const EXPLORE_AXIS_LESSONS: Record<ExploreAxisId, ExploreAxisLesson> = {
  clarity: {
    id: "clarity",
    headline: "Claritate mentală",
    intro: [
      "Claritatea nu vine dintr-o idee genială, ci dintr-un spațiu mic fără zgomot. Începe prin a decupa 2–3 minute în care observi ce te trage în ceață.",
      "Notează 3 fapte simple, verificabile, fără interpretări. După fiecare fapt, respiră lung și întreabă: „Ce știu sigur acum?”",
    ],
    microActions: [
      "Scrie pe o hârtie: FAPT / INTERPRETARE și completează o singură linie la fiecare.",
      "Dacă apare alt gând, spune „Observ că mintea inventează scenarii” și revino la fapte.",
    ],
    outro: "Când ești gata, continuăm traseul ghidat.",
  },
  focus: {
    id: "focus",
    headline: "Focus & direcție",
    intro: [
      "Atenția împrăștiată nu se adună singură; trebuie să-i dai un singur fir. Alege o bucată de lucru care ar dura sub 5 minute.",
      "Închide orice tab sau aplicație care nu ajută această bucată. Spune cu voce tare ce faci („Acum termin paragraful X”) și pornește timerul.",
    ],
    microActions: [
      "Lucrează doar la elementul ales până sună timerul. Dacă apare tentația de context-switch, notează-l pe o listă separată.",
      "La final, spune „Firul e închis” și doar apoi decide următorul pas.",
    ],
    outro: "Revenim în modul Guided după această mini-antrenare.",
  },
  energy: {
    id: "energy",
    headline: "Energie mentală",
    intro: [
      "Oboseala mentală se acumulează când mergi la aceeași viteză, indiferent de semnale. Azi verificăm bateriile și ritmul.",
      "Întreabă-te ce ai făcut în ultimele 4 ore și ce ți-a consumat energia. Alege un micro-reset: apă, întindere, 10 respirații lente.",
    ],
    microActions: [
      "Scrie o singură frază: „Când simt că bateria scade, primul semn este…”.",
      "Planifică un checkpoint clar pentru următoarele 3 ore (ex: pauză de 3 minute la ora 16:00).",
    ],
    outro: "După acest reset, ne întoarcem în Guided pentru pasul următor.",
  },
  tension: {
    id: "tension",
    headline: "Tensiune & reacții",
    intro: [
      "Tensiunea se acumulează când corpul rămâne în modul „alertă” prea mult timp. Începe prin a observa trei semnale din corp (umeri, maxilar, respirație).",
      "Pe fiecare expirație, imaginează-ți că lași să cadă câte 5% din tensiune. Dacă apare reacția impulsivă, notează „Observ impulsul, nu îl urmez acum”.",
    ],
    microActions: [
      "Scrie o singură situație recentă în care reacția a fost prea rapidă. Ce ți-ar fi adus o pauză de 3 secunde?",
      "Pune un reminder vizual (post-it) cu textul „Pauză → apoi reacție”.",
    ],
    outro: "Starea corpului e un semnal, nu un verdict. Continuăm Guided cu mai mult spațiu.",
  },
};

export function getExploreAxisOption(axisId: ExploreAxisId | null | undefined) {
  if (!axisId) return null;
  return EXPLORE_AXIS_OPTIONS.find((axis) => axis.id === axisId) ?? null;
}
