import type { AdaptiveCluster, DailyPathConfig } from "@/types/dailyPath";

const FOCUS_ENERGY_DEEP_RO: DailyPathConfig = {
  cluster: "focus_energy_cluster",
  autonomyNodeId: "focus_a1",
  nodes: [
    {
      id: "focus_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Energie & recuperare mentală",
      description:
        "Astăzi lucrezi la bateria ta mentală. Vezi unde se scurge energia în timpul zilei și înveți un mic reflex de reset care îți protejează claritatea când schimbi activitatea.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "focus_example1",
      kind: "LEARN",
      shape: "circle",
      title: "O zi care golește bateria",
      description:
        "Andrei își începe ziua hotărât: vrea să termine un raport.\nDar sare între email, WhatsApp, banking, apeluri și tab-uri noi.\nSeara e obosit și raportul e abia început.\nNu munca l-a obosit, ci schimbările haotice de context.",
      xp: 5,
    },
    {
      id: "focus_l1",
      kind: "LEARN",
      shape: "circle",
      title: "Ce este energia mentală?",
      description:
        "Imaginează-ți că ai o baterie invizibilă pentru atenție și decizii. Nu obosești doar pentru că muncești mult, ci pentru că această baterie se golește de fiecare dată când ești întrerupt, sari de la un lucru la altul sau ții prea multe lucruri în minte.\nEnergie mentală = capacitatea ta de a fi prezent, lucid și orientat în ce faci acum.",
      xp: 5,
    },
    {
      id: "focus_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Test rapid",
      description: "Ce îți golește cel mai tare energia mentală?",
      quizOptions: [
        { id: "A", label: "Trei ore de lucru concentrat cu pauze scurte." },
        { id: "B", label: "Să sari de zeci de ori între email, chat, telefon." },
        { id: "C", label: "O plimbare de 30 de minute fără telefon." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exact. Comutările dese tocmai asta fac.",
        incorrect: "Aproape. Lucrul concentrat protejează energia. Schimbările dese o scurg.",
      },
      xp: 10,
    },
    {
      id: "focus_l2",
      kind: "LEARN",
      shape: "circle",
      title: "De ce te rupe schimbul de context",
      description:
        "Când treci la altceva, mintea are nevoie să „mute scena”:\n– să uite ce făcea,\n– să încarce noul context.\nDacă faci asta de 50–100 ori/zi, energia cade masiv.\nReflexul care ajută: pauza de 2 secunde.",
      xp: 5,
    },
    {
      id: "focus_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Aplicare",
      description: "Ești la laptop și treci la alt task. Ce protejează cel mai bine energia ta?",
      quizOptions: [
        { id: "A", label: "Deschid imediat alt tab și intru pe social media." },
        { id: "B", label: "Mă opresc 2 secunde → inspir 2 sec, expir 2 sec → apoi încep." },
        { id: "C", label: "Deschid 3 tab-uri ca să aleg după chef." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Da. Pauza de 2 secunde îți protejează energia.",
        incorrect: "Aproape. Mintea are nevoie de un spațiu gol între activități.",
      },
      xp: 10,
    },
    {
      id: "focus_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: pauza ta de 2 secunde",
      description:
        "Antrenezi reflexul de reset. Când cercul se umple: inspiră 2 secunde. Când se golește: expiră 2 secunde. Repetă 2–3 cicluri.",
      xp: 15,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "focus_a1",
      kind: "ACTION",
      shape: "star",
      title: "Cum simți după primele încercări?",
      description: "Mai vrei o rundă de antrenament sau ești pregătit pentru provocare?",
      xp: 0,
    },
    {
      id: "focus_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "Extra training",
      description: "Încă 2–3 cicluri de pauză 2–2 îți consolidează reflexul.",
      xp: 5,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "energy_context_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Ce înseamnă să schimbi contextul",
      description:
        "Schimbarea de context apare când treci de la telefon la laptop, de la email la call etc.\nDacă intri în noua sarcină pe pilot automat, energia se scurge.\nReflexul tău nou: pauză conștientă de 2 secunde.",
      xp: 0,
    },
    {
      id: "focus_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Provocarea ta reală de azi",
      description: "Scrie contextul și regula ta personalizată.",
      fields: [
        {
          id: "context",
          label: "Azi, când te întâlnești cu o situație precum:",
          placeholder: "ex: închid telefonul și mă apuc de lucru la laptop",
        },
        {
          id: "rule",
          label: "Regula mea de azi:",
          prefix: "Când",
          suffix: "→ respir 2 secunde înainte să continui.",
          placeholder: "ex: deschid laptopul și mă apuc de lucru",
        },
      ],
      xp: 25,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "focus_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Felicitări, ai terminat antrenamentul de azi.",
      description: "",
      bullets: [
        "Schimbările dese de context consumă masiv energia.",
        "Pauza de 2 secunde protejează mintea între task-uri.",
        "Legarea regulii de un context real crește șansa să o aplici.",
      ],
      anchorDescription: "Când schimb contextul, respir 2 secunde.",
      xp: 0,
      ctaLabel: "Vezi progresul tău",
    },
    {
      id: "focus_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "Când schimb contextul, respir 2 secunde.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};

const FOCUS_ENERGY_DEEP_EN: DailyPathConfig = {
  cluster: "focus_energy_cluster",
  autonomyNodeId: "focus_a1",
  nodes: [
    {
      id: "focus_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Mental Energy & Recovery",
      description:
        "Today you’ll work on your mental battery. You’ll see where energy leaks throughout the day and learn a simple 2-second reset that protects your clarity whenever you switch tasks.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "focus_example1",
      kind: "LEARN",
      shape: "circle",
      title: "A day that drains your battery",
      description:
        "Andrei starts the day motivated: he wants to finish an important report.\nBut he bounces between email, WhatsApp, banking apps, calls, and new tabs.\nAt night, he's exhausted and the report is barely started.\nHe wasn’t worn out by “work,” but by chaotic context switching.",
      xp: 5,
    },
    {
      id: "focus_l1",
      kind: "LEARN",
      shape: "circle",
      title: "What is mental energy?",
      description:
        "Imagine a hidden battery for attention and decisions.\nYou don’t get mentally tired just because you work a lot — your battery drains every time you are interrupted, jump between tasks, or hold too many things in mind at once.\nMental energy = your capacity to stay present, clear, and intentional.",
      xp: 5,
    },
    {
      id: "focus_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Quick check",
      description: "Which situation drains your mental energy the most?",
      quizOptions: [
        { id: "A", label: "Three hours of focused work with short breaks." },
        { id: "B", label: "Jumping dozens of times between email, chat, and notifications." },
        { id: "C", label: "A 30-minute walk without your phone." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Correct. Rapid context switching is the biggest hidden drain.",
        incorrect: "Not quite. Focused work protects energy. Constant switching drains it.",
      },
      xp: 10,
    },
    {
      id: "focus_l2",
      kind: "LEARN",
      shape: "circle",
      title: "Why context switching breaks you",
      description:
        "Every time you shift tasks, your mind needs to “move the scene”:\n– release what you were doing,\n– load what matters now.\nDo this 50–100 times a day and your energy collapses.\nThe solution: a simple 2-second pause.",
      xp: 5,
    },
    {
      id: "focus_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Apply the rule",
      description: "You finish a task and want to start the next one. What protects your energy best?",
      quizOptions: [
        { id: "A", label: "Open a new tab and check social media for 1–2 minutes." },
        { id: "B", label: "Pause for 2 seconds → inhale 2 sec, exhale 2 sec → then start intentionally." },
        { id: "C", label: "Open three tabs in parallel and decide based on impulse." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exactly. The 2-second pause resets your mental state.",
        incorrect: "Almost. Your mind needs a small blank space before the next task.",
      },
      xp: 10,
    },
    {
      id: "focus_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: Your 2-second pause",
      description:
        "Train the reset reflex. When the circle fills: inhale for 2 seconds. When it empties: exhale for 2 seconds. Repeat 2–3 cycles.",
      xp: 15,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Exercise done",
    },
    {
      id: "focus_a1",
      kind: "ACTION",
      shape: "star",
      title: "How do you feel after the first rounds?",
      description: "Choose your next step.",
      xp: 0,
    },
    {
      id: "focus_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "Extra training",
      description: "Another 2–3 cycles strengthen the reflex.",
      xp: 5,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Exercise done",
    },
    {
      id: "energy_context_learn",
      kind: "LEARN",
      shape: "circle",
      title: "What “context switching” actually is",
      description:
        "Context switching is not abstract. It happens whenever you:\n– move from phone to laptop,\n– end a call and dive into emails,\n– leave a meeting and open a new document.\nEntering the next activity on autopilot drains energy.\nYour new reflex: a conscious 2-second pause.",
      xp: 0,
    },
    {
      id: "focus_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Your real challenge for today",
      description: "Write your personal rule for today.",
      fields: [
        {
          id: "context",
          label: "Today, when I encounter a situation like:",
          placeholder: "e.g., I put down my phone and start work",
        },
        {
          id: "rule",
          label: "My rule for today:",
          prefix: "When",
          suffix: "→ I pause and breathe for 2 seconds before continuing.",
          placeholder: "e.g., I close my phone and open my laptop with intention",
        },
      ],
      xp: 25,
      ctaLabel: "I commit",
    },
    {
      id: "focus_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Great job — today’s training is complete.",
      description: "",
      bullets: [
        "Frequent context switches drain energy fast.",
        "A 2-second pause protects clarity between tasks.",
        "Writing a personal rule increases the chance you'll apply it.",
      ],
      anchorDescription: "When I switch context, I pause for 2 seconds.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "focus_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "When I switch context, I pause for 2 seconds.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};

const FOCUS_ENERGY_SHORT_RO: DailyPathConfig = {
  cluster: "focus_energy_cluster",
  nodes: [
    {
      id: "focus_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Energie & recuperare mentală (rapid)",
      description:
        "Astăzi faci o versiune scurtă de antrenament. Înveți unde pierzi energie și exersezi pauza de 2 secunde.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "focus_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Bateria ta mentală",
      description:
        "Nu obosești doar de la muncă. Comutările dese între telefon, email și task-uri îți golesc energia.\nPauza de 2 secunde reduce scurgerea mentală.",
      xp: 5,
    },
    {
      id: "focus_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: pauza de 2 secunde",
      description:
        "Inspiră 2 secunde când cercul se umple.\nExpiră 2 secunde când se golește.\nRepetă câteva cicluri.",
      xp: 10,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "focus_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Recunoaște zgomotul",
      description: "Ce te obosește cel mai tare în mod invizibil?",
      quizOptions: [
        { id: "A", label: "40 min de lucru concentrat." },
        { id: "B", label: "Verificări dese telefon → email → chat." },
        { id: "C", label: "O pauză de 10 min fără telefon." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exact. Comutările dese sunt cele care te obosesc.",
        incorrect: "Aproape. Lucrul concentrat nu e problema, ci schimbările dese.",
      },
      xp: 10,
    },
    {
      id: "focus_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Provocarea ta de azi",
      description: "Scrie contextul și regula pentru pauza ta de 2 secunde.",
      fields: [
        {
          id: "context",
          label: "Când întâlnesc situația:",
          placeholder: "ex: închid telefonul și mă apuc de lucru",
        },
        {
          id: "rule",
          label: "Regula mea de azi:",
          prefix: "Când",
          suffix: "→ respir 2 secunde.",
          placeholder: "ex: închid notificările și revin la task",
        },
      ],
      xp: 20,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "focus_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Felicitări — versiunea scurtă e gata.",
      description: "",
      bullets: [
        "Comutările dese consumă energia.",
        "Pauza de 2 secunde o protejează.",
        "Regula scrisă o aduce în viața reală.",
      ],
      anchorDescription: "O pauză mică. O zi mai clară.",
      xp: 0,
      ctaLabel: "Vezi progresul tău",
    },
    {
      id: "focus_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "O pauză mică. O zi mai clară.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};

const FOCUS_ENERGY_SHORT_EN: DailyPathConfig = {
  cluster: "focus_energy_cluster",
  nodes: [
    {
      id: "focus_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Mental Energy & Recovery (Quick)",
      description:
        "Today you’ll do a short version of this training. You’ll learn where energy leaks and practice the 2-second pause.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "focus_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Your mental battery",
      description:
        "You don’t get tired only from work — constant micro-switching drains you.\nA 2-second pause reduces this hidden energy loss.",
      xp: 5,
    },
    {
      id: "focus_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: 2-second reset",
      description: "Inhale when the circle fills. Exhale when it empties. Repeat a few cycles.",
      xp: 10,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Exercise done",
    },
    {
      id: "focus_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Quick quiz",
      description: "What drains your mental energy the most?",
      quizOptions: [
        { id: "A", label: "40 minutes of focused work." },
        { id: "B", label: "Frequent checking: phone → email → chat." },
        { id: "C", label: "A short break without your phone." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Correct. Frequent micro-switching is the hidden drain.",
        incorrect: "Almost. Focused work is not the problem — constant switching is.",
      },
      xp: 10,
    },
    {
      id: "focus_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Your quick challenge",
      description: "Write your situation and rule.",
      fields: [
        {
          id: "context",
          label: "A situation today:",
          placeholder: "e.g., I close my phone and start work",
        },
        {
          id: "rule",
          label: "My rule:",
          prefix: "When",
          suffix: "→ I pause for 2 seconds.",
          placeholder: "e.g., I switch tabs intentionally",
        },
      ],
      xp: 20,
      ctaLabel: "I commit",
    },
    {
      id: "focus_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Quick training complete",
      description: "",
      bullets: [
        "Switching drains energy.",
        "A 2-second pause protects you.",
        "Writing the rule brings it into real life.",
      ],
      anchorDescription: "A small pause. A clearer day.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "focus_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "A small pause. A clearer day.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};

const CLARITY_DEEP_RO: DailyPathConfig = {
  cluster: "clarity_cluster",
  autonomyNodeId: "clarity_a1",
  nodes: [
    {
      id: "clarity_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Claritate mentală & direcție",
      description:
        "Astăzi lucrezi la o abilitate simplă, dar rar folosită: să spui în O propoziție ce vrei să faci. Cu cât îți clarifici mai repede intenția, cu atât risipești mai puțin timp, energie și stres.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "clarity_l1",
      kind: "LEARN",
      shape: "circle",
      title: "Ce este, de fapt, claritatea mentală?",
      description:
        "Claritate mentală înseamnă să poți răspunde simplu la întrebarea: „Ce fac acum și de ce?”\nNu e perfecționism, nu e „să știi tot”. Este abilitatea de a formula în cuvinte:\n– care e rezultatul pe care îl vrei,\n– care este întrebarea la care răspunzi,\n– care este următorul pas concret.",
      xp: 5,
    },
    {
      id: "clarity_example1",
      kind: "LEARN",
      shape: "circle",
      title: "O zi „plină”, dar fără direcție",
      description:
        "Maria își deschide laptopul și zice: „Trebuie să rezolv o grămadă de lucruri.” Răspunde la câteva mailuri fără prioritate clară, intră într-un document, sare pe WhatsApp, se apucă de prezentare, se oprește, caută ceva pe Google, mai deschide două tab-uri.\nSeara e obosită și are senzația că „a fost ocupată toată ziua”, dar nu poate spune clar: „Asta am urmărit. Asta am terminat.” Asta e lipsa de claritate, nu lipsa de voință.",
      xp: 5,
    },
    {
      id: "clarity_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Recunoaște claritatea",
      description: "În care dintre situațiile de mai jos există cea mai multă claritate mentală?",
      quizOptions: [
        { id: "A", label: "Mă așez la birou și zic: am o zi plină, vedem ce apuc." },
        { id: "B", label: "Îmi spun: în următoarele 40 de minute scriu primul draft pentru raportul X." },
        { id: "C", label: "Deschid mailul, WhatsApp-ul și documentele, ca să văd ce mă inspiră." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exact. Claritatea înseamnă să numești în mod concret ce vrei să se întâmple în următoarele minute.",
        incorrect: "Nu chiar. Claritatea nu înseamnă să „vezi ce apare”, ci să numești explicit ce rezultat urmărești acum.",
      },
      xp: 10,
    },
    {
      id: "clarity_l2",
      kind: "LEARN",
      shape: "circle",
      title: "Regula unei singure propoziții",
      description:
        "Un mod simplu de a testa claritatea este: „Pot să spun în O propoziție clară ce fac în următoarele 20–40 de minute?”\nExemple:\n– „Scriu introducerea pentru raport.”\n– „Răspund la 3 mailuri importante, nu la toate.”\n– „Clarific structura prezentării, fără să o finisez.”\nDacă propoziția e vagă, confuză sau conține 4-5 obiective deodată, nu este claritate.",
      xp: 5,
    },
    {
      id: "clarity_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Aplică regula",
      description: "Vrei să lucrezi la prezentarea de mâine. Care formulare este cea mai clară?",
      quizOptions: [
        { id: "A", label: "Trebuie să mă ocup și de prezentarea aia, plus multe altele." },
        { id: "B", label: "În următoarele 30 de minute definitivez structura slide-urilor 1–5." },
        { id: "C", label: "Mă apuc de prezentare și văd eu cum merge." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Da. O propoziție clară are un interval de timp, un rezultat concret și un obiectiv singular.",
        incorrect: "Aproape. O propoziție de claritate nu este „vedem”, ci: timp limitat + rezultat clar + un singur obiectiv.",
      },
      xp: 10,
    },
    {
      id: "clarity_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: O propoziție, nimic altceva",
      description:
        "Alege acum un mic lucru real pe care vrei să-l faci după acest exercițiu. Când pornește cercul, ai 20 de secunde în care repeți în minte O propoziție clară despre ce vei face. Dacă apar alte gânduri („și aia, și cealaltă”), revii la propoziție.",
      xp: 15,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "clarity_a1",
      kind: "ACTION",
      shape: "star",
      title: "Cum simți după primul exercițiu?",
      description: "Ai testat regula unei singure propoziții. Ce simți că ai nevoie acum?",
      xp: 0,
    },
    {
      id: "clarity_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "Extra training: o altă propoziție",
      description:
        "Alege un alt mic task real (nu imaginar): un telefon, un mesaj, un micro-task de azi. Repetă același lucru: 20 de secunde în care ții mintea pe O propoziție clară despre ce vei face. Dacă apar 3–4 obiective deodată, redu-le la unul singur.",
      xp: 5,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "clarity_fog",
      kind: "LEARN",
      shape: "circle",
      title: "Ceață mentală vs. claritate",
      description:
        "Ceața mentală nu înseamnă că ești „slab” sau „leneș”. De cele mai multe ori, înseamnă:\n– prea multe intenții amestecate,\n– niciuna formulată clar,\n– niciun pas imediat stabilit.\nClaritatea apare când:\n– alegi o singură intenție pentru următoarele minute,\n– o formulezi în cuvinte,\n– începi doar cu acel pas.",
      xp: 5,
    },
    {
      id: "clarity_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Provocarea ta reală de azi",
      description: "Alege o situație reală în care vei folosi regula unei singure propoziții înainte să începi.",
      fields: [
        {
          id: "context",
          label: "Azi, mă voi opri și voi clarifica înainte să încep când:",
          placeholder: "ex: deschid laptopul după pauza de prânz",
        },
        {
          id: "rule",
          label: "Propoziția mea clară va suna așa:",
          placeholder: "În următoarele 30 de minute scriu draftul pentru slide-urile 1–5.",
        },
      ],
      xp: 25,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "clarity_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Felicitări, ai terminat antrenamentul de claritate de azi.",
      description: "",
      bullets: [
        "Lipsa de claritate nu e lipsă de voință, e lipsă de decizie explicită.",
        "Poți testa claritatea cu regula unei singure propoziții.",
        "Dacă legi această propoziție de momente concrete, simți energie și progres real.",
      ],
      anchorDescription: "Înainte să încep, spun clar ce fac.",
      xp: 0,
      ctaLabel: "Vezi progresul tău",
    },
    {
      id: "clarity_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "Înainte să încep, spun clar ce fac.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};

const CLARITY_DEEP_EN: DailyPathConfig = {
  cluster: "clarity_cluster",
  autonomyNodeId: "clarity_a1",
  nodes: [
    {
      id: "clarity_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Mental Clarity & Direction",
      description:
        "Today you’ll train a simple but rare skill: saying in ONE sentence what you’re about to do. The faster you clarify your intent, the less time and energy you waste.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "clarity_l1",
      kind: "LEARN",
      shape: "circle",
      title: "What is mental clarity?",
      description:
        "Mental clarity means you can answer: “What am I doing now and why?”\nIt’s not perfectionism and not “knowing everything”. It’s the ability to state:\n– the outcome you want,\n– the question you’re answering,\n– the next concrete step.",
      xp: 5,
    },
    {
      id: "clarity_example1",
      kind: "LEARN",
      shape: "circle",
      title: "A busy day with no direction",
      description:
        "Maria opens her laptop: “I have a lot to handle today.” She answers random emails, jumps into a doc, checks WhatsApp, touches a presentation, Googles something, opens two more tabs.\nAt night she’s tired but can’t say: “This is what I was aiming for. This is what I finished.” That’s not lack of willpower, it’s lack of clarity.",
      xp: 5,
    },
    {
      id: "clarity_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Spot the clarity",
      description: "Which situation shows the most mental clarity?",
      quizOptions: [
        { id: "A", label: "I sit down and think: I have a full day, let’s see what I can do." },
        { id: "B", label: "For the next 40 minutes I write the first draft of report X." },
        { id: "C", label: "I open email, WhatsApp, and docs to see what inspires me." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Correct. Clarity means naming exactly what you want to happen in the next minutes.",
        incorrect: "Not quite. Clarity isn’t “let’s see what appears”, it’s explicitly stating the outcome you want now.",
      },
      xp: 10,
    },
    {
      id: "clarity_l2",
      kind: "LEARN",
      shape: "circle",
      title: "The one-sentence rule",
      description:
        "A simple clarity test: “Can I say in ONE sentence what I’ll do in the next 20–40 minutes?”\nIf the sentence is vague or packs 4–5 goals, you don’t have clarity.",
      xp: 5,
    },
    {
      id: "clarity_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Apply it",
      description: "You want to work on tomorrow’s presentation. Which sentence is clearest?",
      quizOptions: [
        { id: "A", label: "I really need to deal with that presentation and many other things." },
        { id: "B", label: "For the next 30 minutes I finalize the structure for slides 1–5." },
        { id: "C", label: "I’ll start the presentation and see how it goes." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exactly. A clear sentence has a time frame, a concrete result, and one objective.",
        incorrect: "Almost. A clarity sentence isn’t “we’ll see”, it’s time + clear result + one goal.",
      },
      xp: 10,
    },
    {
      id: "clarity_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: One sentence, nothing else",
      description:
        "Pick a real small task you’ll do after this. While the circle runs, repeat ONE clear sentence about that task. If your mind jumps to other goals, return to the sentence.",
      xp: 15,
      ctaLabel: "Exercise done",
    },
    {
      id: "clarity_a1",
      kind: "ACTION",
      shape: "star",
      title: "How does it feel after the drill?",
      description: "You tested the one-sentence rule. What do you need next?",
      xp: 0,
    },
    {
      id: "clarity_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "Extra drill: another sentence",
      description:
        "Pick another real micro-task (a call, a message, a tiny step). Hold ONE clear sentence in mind while the timer runs. If more goals show up, reduce them to one.",
      xp: 5,
      ctaLabel: "Exercise done",
    },
    {
      id: "clarity_fog",
      kind: "LEARN",
      shape: "circle",
      title: "Mental fog vs. clarity",
      description:
        "Mental fog often means: too many mixed intentions, none clearly stated, no immediate next step chosen. Clarity comes when you pick one intention, put it into words, and start with that step only.",
      xp: 5,
    },
    {
      id: "clarity_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Today’s real challenge",
      description: "Pick a real scenario where you’ll use the one-sentence rule before starting.",
      fields: [
        {
          id: "context",
          label: "Today I’ll pause and clarify before starting when:",
          placeholder: "e.g., I open my laptop after lunch",
        },
        {
          id: "rule",
          label: "My sentence will be:",
          placeholder: "In the next 30 minutes I finalize slides 1–5.",
        },
      ],
      xp: 25,
      ctaLabel: "I commit",
    },
    {
      id: "clarity_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Great job — today’s clarity training is complete.",
      description: "",
      bullets: [
        "Lack of clarity is often lack of explicit decision, not lack of willpower.",
        "You can test clarity with the one-sentence rule.",
        "Linking the sentence to real situations increases energy and visible progress.",
      ],
      anchorDescription: "Before I start, I say clearly what I’ll do.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "clarity_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "Before I start, I say clearly what I’ll do.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};

const CLARITY_SHORT_RO: DailyPathConfig = {
  cluster: "clarity_cluster",
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
        "Alege un mic task real de azi. Când pornește cercul, repetă în minte O propoziție clară despre ce vei face după exercițiu. Dacă mintea alunecă spre altceva, revino la propoziție.",
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

const CLARITY_SHORT_EN: DailyPathConfig = {
  cluster: "clarity_cluster",
  nodes: [
    {
      id: "clarity_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Mental Clarity (Quick)",
      description:
        "Today you’ll do a short training. You’ll learn to use one clear sentence before you start a task.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "clarity_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "The clarity test",
      description:
        "Simple test: “Can I say in one sentence what I’ll do in the next 20–30 minutes?” If the sentence is vague or overloaded, clarity is missing.",
      xp: 5,
    },
    {
      id: "clarity_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Quick quiz",
      description: "Which sentence is clearest for the next half hour?",
      quizOptions: [
        { id: "A", label: "I’ll work a bit on slides and a bit on emails." },
        { id: "B", label: "For the next 30 minutes I finalize the structure for the first 5 slides." },
        { id: "C", label: "I’ll start several things and see what happens." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exactly. A good sentence is time + outcome + one objective.",
        incorrect: "Not quite. If the sentence is vague or packs several goals, clarity is missing.",
      },
      xp: 10,
    },
    {
      id: "clarity_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: one sentence",
      description:
        "Pick a real task. While the circle runs, repeat one clear sentence about what you’ll do next. When your mind drifts, return to the sentence.",
      xp: 10,
      ctaLabel: "Exercise done",
    },
    {
      id: "clarity_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Your challenge today",
      description: "Write where you’ll use a clear sentence and what it is.",
      fields: [
        {
          id: "context",
          label: "Where will you use a clear sentence:",
          placeholder: "e.g., when I sit back at my desk tonight",
        },
        {
          id: "rule",
          label: "My sentence:",
          placeholder: "In the next 30 minutes I finalize the key structure.",
        },
      ],
      xp: 20,
      ctaLabel: "I commit",
    },
    {
      id: "clarity_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Quick clarity training done",
      description: "",
      bullets: [
        "Clarity starts with one simple sentence.",
        "A good sentence has time + outcome + one objective.",
        "Linking it to a real moment makes it usable.",
      ],
      anchorDescription: "One clear sentence. A calmer mind.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "clarity_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "One clear sentence. A calmer mind.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};

const EMOTIONAL_FLEX_DEEP_RO: DailyPathConfig = {
  cluster: "emotional_flex_cluster",
  autonomyNodeId: "emoflex_a1",
  nodes: [
    {
      id: "emoflex_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Flexibilitate Emoțională",
      description:
        "Astăzi antrenezi abilitatea care decide dacă o situație dificilă te blochează sau o traversezi calm: flexibilitatea emoțională.\nVei învăța cum apar emoțiile, cum să creezi spațiu mental și cum să răspunzi — nu doar să reacționezi.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "emoflex_learn1",
      kind: "LEARN",
      shape: "circle",
      title: "De ce emoțiile ne scurtcircuitează",
      description:
        "Când atenția se lipește de o emoție, opțiunile dispar.\nFlexibilitatea începe în clipa în care observi emoția, fără să devii emoția.",
      xp: 5,
    },
    {
      id: "emoflex_example1",
      kind: "LEARN",
      shape: "circle",
      title: "Un exemplu real",
      description:
        "Imaginează-ți că primești un mesaj care te irită.\nPentru câteva secunde, totul se îngustează.\nCreierul se pregătește să se apere — nu să aleagă.\nFlexibilitatea întrerupe exact acest micro-moment.",
      xp: 5,
    },
    {
      id: "emoflex_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Test de recunoaștere",
      description: "Care este primul semn că începe hijack-ul emoțional?",
      quizOptions: [
        { id: "A", label: "Emoție puternică + atenție îngustată" },
        { id: "B", label: "Când deja ai acționat" },
        { id: "C", label: "Când emoția dispare" },
      ],
      correctOptionIds: ["A"],
      quizFeedback: {
        correct: "Exact. Atenția care se îngustează este primul semn că ai nevoie de flexibilitate.",
        incorrect: "Dacă deja ești în reacție, ai ratat momentul de flexibilitate. Observă semnele timpurii.",
      },
      xp: 10,
    },
    {
      id: "emoflex_learn2",
      kind: "LEARN",
      shape: "circle",
      title: "Fereastra de 2 secunde",
      description:
        "Există mereu un micro-spațiu între ce simți și ce alegi.\nFlexibilitatea înseamnă:\n\nObservă emoția.\n\nCreează 2 secunde de spațiu.\n\nAlege acțiunea potrivită.",
      xp: 5,
    },
    {
      id: "emoflex_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Aplicare rapidă",
      description: "Ce te menține flexibil într-un moment dificil?",
      quizOptions: [
        { id: "A", label: "Să aștepți să se liniștească emoția" },
        { id: "B", label: "Să creezi 2 secunde de spațiu" },
        { id: "C", label: "Să reprimi emoția" },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Corect. Flexibilitatea începe cu spațiu, nu cu reprimare.",
        incorrect: "Nu e nevoie să reprimi emoția. Creezi spațiu și apoi alegi răspunsul.",
      },
      xp: 10,
    },
    {
      id: "emoflex_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Drill de flexibilitate",
      description:
        "Pentru următoarele 20 secunde, exersează micro-pauza:\n\nInspiră ușor\n\nObservă\n\nExpiră lent\nNotă → Pauză → Alegere.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 15,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "emoflex_a1",
      kind: "ACTION",
      shape: "star",
      title: "Cum te simți acum?",
      description:
        "Vrei încă o rundă de antrenament sigur sau ești pregătit pentru provocarea din viața reală?",
      xp: 0,
    },
    {
      id: "emoflex_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "A doua rundă",
      description:
        "Repetă micro-pauza într-o variantă puțin mai dificilă: Observ → Denumesc emoția → Expir lent.\nÎntărești reflexul de flexibilitate.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 5,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "emoflex_learn3",
      kind: "LEARN",
      shape: "circle",
      title: "Puterea numirii emoției",
      description:
        "A numi emoția (“Simt tensiune”, “Simt iritare”) reduce reactivitatea cu 30–40%.\nPregătește-te pentru aplicarea în context real.",
      xp: 0,
    },
    {
      id: "emoflex_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Flexibilitate în viața reală",
      description:
        "Alege o situație de azi în care obișnuiești să simți tensiune.\nDefinește-o, apoi stabilește acțiunea ta de 2 secunde.",
      fields: [
        {
          id: "context",
          label: "Când în mod obișnuit simt tensiune…",
          placeholder: "ex: înainte să răspund la mesajele tensionate",
        },
        {
          id: "rule",
          label: "Acțiunea mea:",
          prefix: "În acel moment → Creez 2 secunde de spațiu și",
          placeholder: "ex: inspir, numesc emoția și abia apoi răspund.",
        },
      ],
      xp: 25,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "emoflex_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Transformarea de azi",
      description: "",
      bullets: [
        "Ai recunoscut semnele timpurii ale tensiunii emoționale.",
        "Ai exersat fereastra de flexibilitate de 2 secunde.",
        "Ai definit o acțiune reală pentru azi.",
      ],
      anchorDescription: "Spațiul creează alegere. Alegerea creează libertate.",
      xp: 0,
      ctaLabel: "Vezi progresul",
    },
    {
      id: "emoflex_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "Spațiul creează alegere. Alegerea creează libertate.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};

const EMOTIONAL_FLEX_DEEP_EN: DailyPathConfig = {
  cluster: "emotional_flex_cluster",
  autonomyNodeId: "emoflex_a1",
  nodes: [
    {
      id: "emoflex_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Emotional Flexibility",
      description:
        "Today you’ll train the skill that decides whether your day collapses under pressure or bends and recovers: emotional flexibility.\nYou’ll learn how emotions arise, how to create mental space, and how to respond—not react.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "emoflex_learn1",
      kind: "LEARN",
      shape: "circle",
      title: "Why emotions hijack action",
      description:
        "When your attention fuses with an emotion, you stop seeing options.\nFlexibility begins when you notice the emotion instead of becoming it.",
      xp: 5,
    },
    {
      id: "emoflex_example1",
      kind: "LEARN",
      shape: "circle",
      title: "A real example",
      description:
        "Imagine a message that triggers irritation.\nFor 2–3 seconds, nothing else exists.\nIn that moment, your brain prepares to defend—not to choose.\nFlexibility interrupts this micro-hijack.",
      xp: 5,
    },
    {
      id: "emoflex_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Recognition check",
      description: "What is the FIRST sign that emotional hijack is happening?",
      quizOptions: [
        { id: "A", label: "Strong emotion + narrow focus" },
        { id: "B", label: "When you already start acting" },
        { id: "C", label: "When the feeling disappears" },
      ],
      correctOptionIds: ["A"],
      quizFeedback: {
        correct: "Exactly. Narrowed attention is the earliest sign that flexibility is needed.",
        incorrect: "If you already acted, you missed the window. Catch the moment when attention narrows.",
      },
      xp: 10,
    },
    {
      id: "emoflex_learn2",
      kind: "LEARN",
      shape: "circle",
      title: "The 2-second window",
      description:
        "There is always a micro-space between what you feel and what you choose.\nFlexibility means:\n\nNotice the feeling.\n\nCreate 2 seconds of space.\n\nChoose the next move.",
      xp: 5,
    },
    {
      id: "emoflex_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Application check",
      description: "What keeps you flexible in a difficult moment?",
      quizOptions: [
        { id: "A", label: "Waiting for calmness" },
        { id: "B", label: "Creating 2 seconds of space" },
        { id: "C", label: "Suppressing emotions" },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Correct. Flexibility starts with space, not suppression.",
        incorrect: "You don’t need to suppress the emotion. Create space, then respond.",
      },
      xp: 10,
    },
    {
      id: "emoflex_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Flexibility Drill",
      description:
        "For the next 20 seconds, practice the micro-pause:\n\nInhale gently\n\nHold awareness\n\nExhale slowly\nLet your mind notice → pause → choose.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 15,
      ctaLabel: "Exercise done",
    },
    {
      id: "emoflex_a1",
      kind: "ACTION",
      shape: "star",
      title: "How do you feel now?",
      description: "Do you want one more round of safe practice, or are you ready to test this in real life?",
      xp: 0,
    },
    {
      id: "emoflex_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "Second flexibility drill",
      description:
        "Repeat the micro-pause in a slightly harder version:\nNotice → Name the emotion → Slow exhale.\nYou’re solidifying the flexibility reflex.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 5,
      ctaLabel: "Exercise done",
    },
    {
      id: "emoflex_learn3",
      kind: "LEARN",
      shape: "circle",
      title: "The power of naming",
      description:
        "Naming the emotion (“I feel tension”, “I feel irritation”) reduces reactivity by 30–40%.\nYou're preparing for real-world application.",
      xp: 0,
    },
    {
      id: "emoflex_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Real-world flexibility",
      description:
        "Choose a situation today where emotional tension usually appears.\nDefine it, then choose your 2-second response.",
      fields: [
        {
          id: "context",
          label: "When I usually get tense…",
          placeholder: "e.g., before replying to a tense message",
        },
        {
          id: "rule",
          label: "My 2-second action:",
          prefix: "In that moment → I create 2 seconds of space and",
          placeholder: "e.g., inhale, name the feeling, then respond.",
        },
      ],
      xp: 25,
      ctaLabel: "I commit",
    },
    {
      id: "emoflex_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Today’s transformation",
      description: "",
      bullets: [
        "You recognized the early signs of emotional hijack.",
        "You practiced the 2-second space drill.",
        "You prepared a real-world flexibility action.",
      ],
      anchorDescription: "Space creates choice. Choice creates freedom.",
      xp: 0,
      ctaLabel: "View progress",
    },
    {
      id: "emoflex_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "Space creates choice. Choice creates freedom.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};

const EMOTIONAL_FLEX_SHORT_RO: DailyPathConfig = {
  cluster: "emotional_flex_cluster",
  nodes: [
    {
      id: "emoflex_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Flexibilitate emoțională — Scurt",
      description: "Un antrenament scurt și clar care te ajută să rămâi flexibil sub presiune.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "emoflex_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Capcana tensiune → reacție",
      description: "Emoțiile îngustează atenția. Flexibilitatea o lărgește înainte de acțiune.",
      xp: 5,
    },
    {
      id: "emoflex_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Observă momentul critic",
      description: "Ce te ajută să eviți hijack-ul emoțional?",
      quizOptions: [
        { id: "A", label: "Să aștepți să treacă emoția" },
        { id: "B", label: "Să creezi 2 secunde de spațiu" },
        { id: "C", label: "Să ignori ce simți" },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exact. Spațiul de 2 secunde îți păstrează flexibilitatea.",
        incorrect: "Ignorarea emoției nu funcționează. Creează spațiu înainte să reacționezi.",
      },
      xp: 10,
    },
    {
      id: "emoflex_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Micro-pauză de 2 secunde",
      description: "Exersează un ciclu: Observ → Pauză → Expir lent. Acesta este comutatorul tău de flexibilitate.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 10,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "emoflex_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Folosește-l în viața reală",
      description:
        "Alege o situație de azi unde poate apărea tensiune și stabilește acțiunea ta de 2 secunde.",
      fields: [
        {
          id: "context",
          label: "Un moment azi în care pot simți tensiune…",
          placeholder: "ex: înainte de statusul de după-amiază",
        },
        {
          id: "rule",
          label: "Acțiunea mea:",
          prefix: "În acel moment → Pauzez 2 secunde și",
          placeholder: "ex: inspir, numesc emoția și formulez răspunsul.",
        },
      ],
      xp: 20,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "emoflex_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Azi ai antrenat flexibilitatea",
      description: "",
      bullets: [
        "Ai identificat tensiunea emoțională devreme.",
        "Ai exersat micro-pauza.",
        "Ai stabilit o acțiune pentru context real.",
      ],
      anchorDescription: "Încetinește momentul și vei schimba rezultatul.",
      xp: 0,
      ctaLabel: "Vezi progresul",
    },
    {
      id: "emoflex_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "Încetinește momentul și vei schimba rezultatul.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};

const EMOTIONAL_FLEX_SHORT_EN: DailyPathConfig = {
  cluster: "emotional_flex_cluster",
  nodes: [
    {
      id: "emoflex_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Emotional Flexibility — Quick Session",
      description: "Short, sharp training to help you stay flexible under pressure.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "emoflex_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "The tension → reaction trap",
      description: "Emotions narrow attention. Flexibility expands it before acting.",
      xp: 5,
    },
    {
      id: "emoflex_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Spot the moment",
      description: "What helps you avoid emotional hijack?",
      quizOptions: [
        { id: "A", label: "Waiting for emotions to fade" },
        { id: "B", label: "Creating 2 seconds of space" },
        { id: "C", label: "Ignoring the feeling" },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exactly. The 2-second pause keeps you flexible.",
        incorrect: "Ignoring the feeling leads to a hijack. Create space before you act.",
      },
      xp: 10,
    },
    {
      id: "emoflex_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "2-second micro-pause",
      description: "Practice one cycle: Notice → Pause → Exhale. This is your flexibility switch.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 10,
      ctaLabel: "Exercise done",
    },
    {
      id: "emoflex_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Apply in one real context",
      description: "Pick a situation where tension appears and define your 2-second response.",
      fields: [
        {
          id: "context",
          label: "A moment today where I might feel tension…",
          placeholder: "e.g., before the afternoon status meeting",
        },
        {
          id: "rule",
          label: "My action:",
          prefix: "In that moment → I pause 2 seconds and",
          placeholder: "e.g., inhale, name the feeling, then respond intentionally.",
        },
      ],
      xp: 20,
      ctaLabel: "I commit",
    },
    {
      id: "emoflex_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "You trained flexibility today",
      description: "",
      bullets: [
        "You identified emotional tension early.",
        "You practiced the micro-pause.",
        "You set one real-life action.",
      ],
      anchorDescription: "Slow the moment, change the outcome.",
      xp: 0,
      ctaLabel: "View progress",
    },
    {
      id: "emoflex_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "Slow the moment, change the outcome.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};

export const DAILY_PATHS_DEEP_RO: Partial<Record<AdaptiveCluster, DailyPathConfig>> = {
  focus_energy_cluster: FOCUS_ENERGY_DEEP_RO,
  clarity_cluster: CLARITY_DEEP_RO,
  emotional_flex_cluster: EMOTIONAL_FLEX_DEEP_RO,
};

export const DAILY_PATHS_DEEP_EN: Partial<Record<AdaptiveCluster, DailyPathConfig>> = {
  focus_energy_cluster: FOCUS_ENERGY_DEEP_EN,
  clarity_cluster: CLARITY_DEEP_EN,
  emotional_flex_cluster: EMOTIONAL_FLEX_DEEP_EN,
};

export const DAILY_PATHS_SHORT_RO: Partial<Record<AdaptiveCluster, DailyPathConfig>> = {
  focus_energy_cluster: FOCUS_ENERGY_SHORT_RO,
  clarity_cluster: CLARITY_SHORT_RO,
  emotional_flex_cluster: EMOTIONAL_FLEX_SHORT_RO,
};

export const DAILY_PATHS_SHORT_EN: Partial<Record<AdaptiveCluster, DailyPathConfig>> = {
  focus_energy_cluster: FOCUS_ENERGY_SHORT_EN,
  clarity_cluster: CLARITY_SHORT_EN,
  emotional_flex_cluster: EMOTIONAL_FLEX_SHORT_EN,
};

export const DAILY_PATHS_DEEP = {
  ro: DAILY_PATHS_DEEP_RO,
  en: DAILY_PATHS_DEEP_EN,
};

export const DAILY_PATHS_SHORT = {
  ro: DAILY_PATHS_SHORT_RO,
  en: DAILY_PATHS_SHORT_EN,
};

export const DAILY_PATHS: DailyPathConfig[] = [
  {
    cluster: "focus_energy_cluster",
    autonomyNodeId: "focus_a1",
    nodes: [
      {
        id: "focus_intro",
        kind: "INTRO",
        shape: "circle",
        title: "Mental Energy & Recovery",
        description:
          "Today you’ll work on your mental battery. You’ll see where energy leaks throughout the day and learn a simple 2-second reset that protects your clarity whenever you switch tasks.",
        xp: 0,
      },
      {
        id: "focus_example1",
        kind: "LEARN",
        shape: "circle",
        title: "O zi care golește bateria",
        description:
          "Andrei își începe ziua hotărât: vrea să termine un raport.\nDar sare între email, WhatsApp, banking, apeluri și tab-uri noi.\nSeara e obosit și raportul e abia început.\nNu munca l-a obosit, ci schimbările haotice de context.",
        xp: 5,
      },
      {
        id: "focus_l1",
        kind: "LEARN",
        shape: "circle",
        title: "Ce este energia mentală?",
        description:
          "Imagine a hidden battery for attention and decisions.\nYou don’t get mentally tired just because you work a lot — your battery drains every time you are interrupted, jump between tasks, or hold too many things in mind at once.\nMental energy = your capacity to stay present, clear, and intentional.",
        xp: 5,
      },
      {
        id: "focus_quiz1",
        kind: "QUIZ_SINGLE",
        shape: "circle",
        title: "Quick check",
        description: "Which situation drains your mental energy the most?",
        quizOptions: [
          { id: "A", label: "Three hours of focused work with short breaks." },
          { id: "B", label: "Jumping dozens of times between email, chat, and notifications." },
          { id: "C", label: "A 30-minute walk without your phone." },
        ],
        correctOptionIds: ["B"],
        xp: 10,
      },
      {
        id: "focus_l2",
        kind: "LEARN",
        shape: "circle",
        title: "Why context switching breaks you",
        description:
          "Every time you shift tasks, your mind needs to “move the scene”:\n– release what you were doing,\n– load what matters now.\nDo this 50–100 times a day and your energy collapses.\nThe solution: a simple 2-second pause.",
        xp: 5,
      },
      {
        id: "focus_quiz2",
        kind: "QUIZ_SINGLE",
        shape: "circle",
        title: "Apply the rule",
        description: "You finish a task and want to start the next one. What protects your energy best?",
        quizOptions: [
          { id: "A", label: "Open a new tab and check social media for 1–2 minutes." },
          { id: "B", label: "Pause for 2 seconds → inhale 2 sec, exhale 2 sec → then start intentionally." },
          { id: "C", label: "Open three tabs in parallel and decide based on impulse." },
        ],
        correctOptionIds: ["B"],
        xp: 10,
      },
      {
        id: "focus_sim1",
        kind: "SIMULATOR",
        shape: "circle",
        badge: "simulator",
        title: "Simulator: pauza ta de 2 secunde",
        description:
          "Antrenezi reflexul de reset. Când cercul se umple: inspiră 2 secunde. Când se golește: expiră 2 secunde. Repetă 2–3 cicluri.",
        xp: 15,
        simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      },
      {
        id: "focus_a1",
        kind: "ACTION",
        shape: "star",
        title: "How do you feel after the first rounds?",
        description: "Choose your next step.",
        xp: 0,
      },
      {
        id: "focus_sim2",
        kind: "SIMULATOR",
        shape: "hollow",
        badge: "simulator",
        softPathOnly: true,
        title: "Extra training",
        description: "Încă 2–3 cicluri de pauză 2–2 îți consolidează reflexul.",
        xp: 5,
        simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      },
      {
        id: "energy_context_learn",
        kind: "LEARN",
        shape: "circle",
        title: "What “context switching” actually is",
        description:
          "Context switching is not abstract. It happens whenever you:\n– move from phone to laptop,\n– end a call and dive into emails,\n– leave a meeting and open a new document.\nEntering the next activity on autopilot drains energy.\nYour new reflex: a conscious 2-second pause.",
        xp: 0,
      },
      {
        id: "focus_real1",
        kind: "REAL_WORLD",
        shape: "star",
        badge: "viata_reala",
        title: "Your real challenge for today",
        description:
          "Write your own rule for today.\nToday, when I encounter a situation like: ______\nMy rule: When [____] → I pause and breathe for 2 seconds before continuing.",
        xp: 25,
      },
      {
        id: "focus_summary",
        kind: "SUMMARY",
        shape: "circle",
        title: "Great job — today’s training is complete.",
        description:
          "1) Frequent context switches drain energy fast.\n2) A 2-second pause protects clarity between tasks.\n3) Writing a personal rule increases the chance you'll apply it.",
        xp: 0,
      },
      {
        id: "focus_anchor",
        kind: "ANCHOR",
        shape: "circle",
        title: "Ancora zilei",
        description: "When I switch context, I pause for 2 seconds.",
        xp: 0,
      },
    ],
  },
  CLARITY_DEEP_RO,
];


export function getDailyPathForCluster(cluster: AdaptiveCluster, lang: "ro" | "en" = "ro"): DailyPathConfig | null {
  const langMap = lang === "en" ? DAILY_PATHS_DEEP_EN : DAILY_PATHS_DEEP_RO;
  const direct = langMap[cluster];
  if (direct) return direct;
  const fallback = lang === "en" ? DAILY_PATHS_DEEP_RO[cluster] : DAILY_PATHS_DEEP_EN[cluster];
  if (fallback) return fallback;
  return DAILY_PATHS.find((path) => path.cluster === cluster) ?? null;
}
