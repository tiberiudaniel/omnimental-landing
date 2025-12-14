export const INTRO_COPY = {
  exploreMap: {
    ro: {
      title: "Harta sistemului OmniMental",
      subtitle: "Patru axe care se influențează reciproc. Observă cum Claritatea, Energia, Adaptabilitatea și Reziliența formează un singur sistem.",
      cta: "Continuă spre testare",
      axes: [
        { id: "clarity", title: "Claritate", description: "Gânduri structurate, capacitate de prioritizare lucidă sub presiune." },
        { id: "energy", title: "Energie", description: "Reglajul micro-pauzelor și al atenției între task-uri." },
        { id: "adaptability", title: "Adaptabilitate", description: "Schimbarea rapidă a strategiilor și reframing strategic." },
        { id: "resilience", title: "Reziliență", description: "Protecție emoțională când contextul devine ostil." },
      ],
    },
    en: {
      title: "OmniMental system map",
      subtitle: "Four axes influencing each other. See how Clarity, Energy, Adaptability, and Resilience connect into one system.",
      cta: "Continue to testing",
      axes: [
        { id: "clarity", title: "Clarity", description: "Structured thinking and prioritization under pressure." },
        { id: "energy", title: "Energy", description: "Micro-pauses and attention reset between tasks." },
        { id: "adaptability", title: "Adaptability", description: "Fast strategy switches and strategic reframing." },
        { id: "resilience", title: "Resilience", description: "Emotional shielding when contexts get hostile." },
      ],
    },
  },
  axisTest: {
    ro: {
      title: "Testează o axă",
      description: "Alege o axă, rulează un test scurt și notează ce simți. După primul test scurt se deblochează și testele medii.",
      axes: [
        { id: "clarity", title: "Claritate", description: "Gândești rapid, dar ordinea se rupe. Testul măsoară focusul sub presiune." },
        { id: "energy", title: "Energie", description: "Cât de repede îți revii între task-uri și dacă respiri la timp." },
        { id: "adaptability", title: "Adaptabilitate", description: "Flexibilitatea cognitivă și ușurința de a schimba strategii." },
        { id: "resilience", title: "Reziliență", description: "Cât rezistă atenția când apare tensiunea emoțională." },
      ],
      buttons: { short: "Test scurt", medium: "Test mediu" },
      feedbackPrompt: "A fost util?",
      feedbackOptions: [
        { id: "yes", label: "Da" },
        { id: "meh", label: "Meh" },
        { id: "no", label: "Nu" },
      ],
    },
    en: {
      title: "Test an axis",
      description: "Pick an axis, run a short test, notice what shifts. Medium tests unlock after your first short test.",
      axes: [
        { id: "clarity", title: "Clarity", description: "Fast thinking, but order slips. Measures focus under pressure." },
        { id: "energy", title: "Energy", description: "How quickly you reset between tasks and if you breathe on time." },
        { id: "adaptability", title: "Adaptability", description: "Cognitive flexibility and ease of switching strategies." },
        { id: "resilience", title: "Resilience", description: "How attention holds when emotional tension appears." },
      ],
      buttons: { short: "Short test", medium: "Medium test" },
      feedbackPrompt: "Was it useful?",
      feedbackOptions: [
        { id: "yes", label: "Yes" },
        { id: "meh", label: "Meh" },
        { id: "no", label: "No" },
      ],
    },
  },
  contract: {
    ro: {
      heading: "Poți continua în două moduri:",
      options: {
        guided: {
          label: "Antrenament zilnic ghidat",
          subLabel: "5–7 min / zi. Direcție clară.",
          href: "/intro/guided",
        },
        free: {
          label: "Continui gratuit azi",
          subLabel: "Intră în modul Today.",
        },
        plans: "Vezi planurile",
      },
      moreLabel: "Mai explorez",
    },
    en: {
      heading: "You can continue in two ways:",
      options: {
        guided: {
          label: "Daily guided training",
          subLabel: "5–7 min/day. Clear direction.",
          href: "/intro/guided",
        },
        free: {
          label: "Continue for free today",
          subLabel: "Jump into Today mode.",
        },
        plans: "See plans",
      },
      moreLabel: "Keep exploring",
    },
  },
  offer: {
    ro: {
      title: "Vrei structură zilnică?",
      body: "Explorarea e utilă. Progresul real vine din frecvență. 5–7 minute/zi.",
      primary: "Activează planul",
      secondary: "Mai explorez",
    },
    en: {
      title: "Want daily structure?",
      body: "Exploration helps. Real progress comes from 5–7 minutes each day.",
      primary: "Activate plan",
      secondary: "Keep exploring",
    },
  },
} as const;
