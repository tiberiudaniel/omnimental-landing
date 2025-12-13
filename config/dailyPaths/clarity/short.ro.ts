import type { DailyPathConfig } from "@/types/dailyPath";

export const CLARITY_SHORT_RO: DailyPathConfig = {
  id: "clarity_v1_short_ro",
  cluster: "clarity_cluster",
  mode: "short",
  lang: "ro",
  version: 1,
  moduleKey: "clarity_single_intent",
  skillLabel: "Claritate: o singură intenție clară",
  nodes: [
    {
      id: "clarity_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Claritate mentală (rapid)",
      description:
        "Astăzi faci o versiune scurtă de antrenament. Înveți să formulezi O propoziție clară înainte să intri într-un task.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "clarity_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Testul clarității",
      description:
        "Test simplu: „Pot să spun în O propoziție ce fac în următoarele 20–30 de minute?” Dacă propoziția e vagă sau conține „și aia, și aia”, nu e claritate.",
      xp: 5,
    },
    {
      id: "clarity_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Verificare rapidă",
      description: "Care formulare este cea mai clară pentru următoarea jumătate de oră?",
      quizOptions: [
        { id: "A", label: "Mă ocup puțin de prezentare și de mailuri." },
        { id: "B", label: "În următoarele 30 de minute definitivez structura pentru primele 5 slide-uri." },
        { id: "C", label: "Mă apuc de mai multe lucruri și văd ce iese." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exact. O propoziție clară înseamnă timp + rezultat + un singur obiectiv.",
        incorrect: "Nu chiar. Dacă propoziția e vagă sau are prea multe obiective, claritatea lipsește.",
      },
      xp: 10,
    },
    {
      id: "clarity_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: o singură propoziție",
      description:
        "Alege un mic task real de azi.\nPentru următoarele 30 de secunde repetă în minte o singură propoziție clară despre ce vei face imediat după exercițiu.\nDacă mintea alunecă spre altceva, revino la propoziție.",
      xp: 10,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "clarity_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Provocarea ta de azi",
      description: "Alege contextul în care vei folosi regula unei singure propoziții.",
      fields: [
        {
          id: "context",
          label: "Contextul în care voi folosi o propoziție clară:",
          placeholder: "ex: când mă pun la birou seara",
        },
        {
          id: "rule",
          label: "Propoziția mea:",
          placeholder: "În următoarele 30 de minute fac draftul pentru partea X.",
        },
      ],
      xp: 20,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "clarity_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Antrenamentul rapid de claritate e gata.",
      description: "",
      bullets: [
        "Claritatea începe cu o propoziție simplă.",
        "O propoziție bună are timp + rezultat + un singur obiectiv.",
        "Dacă o legi de un moment real, șansele să o folosești cresc.",
      ],
      anchorDescription: "O propoziție clară. O minte mai liniștită.",
      xp: 0,
      ctaLabel: "Vezi progresul tău",
    },
    {
      id: "clarity_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "O propoziție clară. O minte mai liniștită.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};
