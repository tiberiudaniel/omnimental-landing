import type { DailyPathConfig } from "@/types/dailyPath";

export const ENERGY_CONGRUENCE_SHORT_RO: DailyPathConfig = {
  id: "energy_congruence_short_ro",
  cluster: "focus_energy_cluster",
  mode: "short",
  lang: "ro",
  version: 1,
  moduleKey: "energy_congruence",
  skillLabel: "Energie: congruență (rapid)",
  nodes: [
    {
      id: "energy_congruence_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Energie prin congruență (rapid)",
      description:
        "Astăzi faci o versiune scurtă. Observi o scurgere internă de energie și faci o alegere mică, aliniată.\nAzi nu e despre pauze sau respirație, ci despre energia pe care o pierzi din conflict interior.",
      xp: 0,
      ctaLabel: "Începe antrenamentul",
    },
    {
      id: "energy_congruence_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Conflictul care obosește",
      description:
        "Oboseala apare adesea când spui „da” cu gura și „nu” în tine.\nCongruența reduce această pierdere.\nNu înseamnă să faci doar ce îți place, ci să știi când alegi și când te sacrifici conștient.",
      xp: 5,
    },
    {
      id: "energy_congruence_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Verificare scurtă",
      description: "Ce consumă mai mult energie?",
      quizOptions: [
        { id: "A", label: "Efortul ales conștient." },
        { id: "B", label: "Conflictul interior constant." },
        { id: "C", label: "O pauză de câteva minute." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Corect. Conflictul dintre interior și exterior consumă energie rapid. Probabil ai simțit asta deja, chiar dacă nu ai numit-o așa.",
        incorrect: "Aproape. Efortul ales energizează — conflictul te golește.",
      },
      xp: 10,
    },
    {
      id: "energy_congruence_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: observă conflictul",
      description:
        "Observă o situație recentă în care nu ai fost pe deplin aliniat.\nCât timp rulează cercul, simte acea clipă în corp. Fără analiză — doar conștiență.\nPoate apărea ca tensiune în piept, greutate în stomac, agitație — sau nimic clar (și asta e ok).",
      xp: 10,
      ctaLabel: "Exercițiul e gata",
    },
    {
      id: "energy_congruence_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Alegerea ta de azi",
      description: "Descrie situația și alegerea congruentă. Alege ceva mic și realist, care se poate întâmpla azi.",
      fields: [
        {
          id: "situation",
          label: "Situația:",
          placeholder: "ex: când primesc o cerere în plus",
        },
        {
          id: "decision",
          label: "Alegerea mea:",
          placeholder: "ex: Aleg să spun nu calm, chiar dacă cineva se supără",
        },
      ],
      xp: 20,
      ctaLabel: "Mă angajez",
    },
    {
      id: "energy_congruence_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Antrenamentul rapid e gata.",
      description: "",
      bullets: [
        "Congruența conservă energie.",
        "Conflictul interior o consumă.",
        "O alegere mică face diferența.",
        "Nu trebuie să rezolvi tot. E suficient să nu te mai lupți cu tine.",
      ],
      anchorDescription: "Mai puțină luptă. Mai multă energie.",
      xp: 0,
      ctaLabel: "Vezi progresul",
    },
    {
      id: "energy_congruence_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Motto zilnic",
      description: "Mai puțină luptă. Mai multă energie.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};
