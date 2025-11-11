"use client";

export type OmniKnowledgeQuestion = {
  id: string;
  module: string;
  question: string;
  options: string[];
  correctIndex: number;
  rationale: string;
  weight: number;
  tags: string[];
};

export type OmniKnowledgeModule = {
  key: string;
  title: string;
  questions: OmniKnowledgeQuestion[];
};

const buildModule = (
  key: string,
  title: string,
  questions: Omit<OmniKnowledgeQuestion, "id" | "module">[],
): OmniKnowledgeModule => ({
  key,
  title,
  questions: questions.map((question, index) => ({
    ...question,
    id: `${key}_${index + 1}`,
    module: key,
  })),
});

export const omniKnowledgeModules: OmniKnowledgeModule[] = [
  buildModule("hrv", "HRV & Biofeedback", [
    {
      question: "Ce descrie corect HRV?",
      options: [
        "Frecvența cardiacă medie",
        "Variabilitatea intervalelor R–R între bătăi",
        "Tensiunea arterială sistolică",
        "Consumul de oxigen la efort",
      ],
      correctIndex: 1,
      rationale: "HRV = variația intervalelor R–R, nu frecvența medie.",
      weight: 1,
      tags: ["HRV", "ANS"],
    },
    {
      question: "Ce ramură autonomă crește HRV în repaus?",
      options: ["Simpatic", "Parasimpatic (vagal)", "Somatic", "Endocrin"],
      correctIndex: 1,
      rationale: "Tonusul vagal mai mare → HRV mai mare în repaus.",
      weight: 1,
      tags: ["HRV", "vagus"],
    },
    {
      question: "Respirația la frecvența de rezonanță are efectul principal:",
      options: [
        "Scade baroreflexul",
        "Amplifică oscilațiile HRV și baroreflexul",
        "Crește lactatul",
        "Crește VO2max imediat",
      ],
      correctIndex: 1,
      rationale: "Rezonanța maximizează cuplajul cardio-respirator.",
      weight: 1,
      tags: ["resonance", "baroreflex"],
    },
    {
      question: "Un indicator uzual de HRV pe termen scurt este:",
      options: ["RMSSD", "Troponina T", "D-dimeri", "LDL"],
      correctIndex: 0,
      rationale: "RMSSD este robust la trenduri pe ferestre scurte.",
      weight: 1,
      tags: ["HRV", "RMSSD"],
    },
    {
      question: "Ce artefact strică cel mai mult calitatea HRV?",
      options: ["Respirație nazală", "Mișcări și ectopice necurățate", "Postură în șezut", "Hidratare"],
      correctIndex: 1,
      rationale: "Artefactele R-peak distorsionează intervalele R–R.",
      weight: 1,
      tags: ["artefacts"],
    },
    {
      question: "În biofeedback, un target realist la început este:",
      options: ["RMSSD x4 în 2 zile", "Coerență stabilă 5–10 min/zi", "LF/HF = 0", "FC sub 40 bpm mereu"],
      correctIndex: 1,
      rationale: "Consolidarea coerenței scurte zilnic e realistă.",
      weight: 1,
      tags: ["practice"],
    },
    {
      question: "Când scade HRV neobișnuit față de baseline:",
      options: ["Mărești intensitatea antrenamentului", "Prioritizezi somn/recuperare", "Crești cofeina", "Nu faci nimic"],
      correctIndex: 1,
      rationale: "HRV sub baseline semnalează nevoie de recuperare.",
      weight: 1,
      tags: ["readiness"],
    },
    {
      question: "Relația corectă HRV–stres acut:",
      options: [
        "Stresul acut crește HRV în repaus",
        "Stresul acut tinde să scadă HRV în repaus",
        "Nu există legătură",
        "Doar la sportivi",
      ],
      correctIndex: 1,
      rationale: "Activarea simpatică scade de regulă HRV în repaus.",
      weight: 1,
      tags: ["stress"],
    },
  ]),
  buildModule("sleep", "Somn & Energie", [
    {
      question: "Ce variabilă influențează cel mai mult recuperarea zilnică?",
      options: ["Ora constantă de culcare/trezire", "Suplimentele de weekend", "Lumina albastră seara", "Cafeaua de dimineață"],
      correctIndex: 0,
      rationale: "Regularitatea circadiană bate optimizările minore.",
      weight: 1,
      tags: ["sleep", "circadian"],
    },
    {
      question: "Expunerea la lumină dimineața ajută prin:",
      options: [
        "Scăderea cortizolului matinal",
        "Ancorarea ritmului circadian",
        "Creșterea melatoninei dimineața",
        "Blocarea serotoninei",
      ],
      correctIndex: 1,
      rationale: "Zeitgeber puternic pentru ritm circadian.",
      weight: 1,
      tags: ["light"],
    },
    {
      question: "Un semn clasic de „sleep debt” este:",
      options: ["Somnolență la prânz", "Sete crescută", "Piele uscată", "Pupilă dilatată"],
      correctIndex: 0,
      rationale: "Somnolența în aceeași fereastră indică deficit.",
      weight: 1,
      tags: ["sleep_debt"],
    },
    {
      question: "Ce strategie sprijină energia stabilă?",
      options: [
        "Gustări zaharoase dese",
        "Indice glicemic moderat și proteine la mic dejun",
        "Sări peste mic dejun mereu",
        "Cafea pe stomacul gol ca regulă",
      ],
      correctIndex: 1,
      rationale: "Bluntarea vârfurilor glicemice stabilizează energia.",
      weight: 1,
      tags: ["nutrition", "energy"],
    },
    {
      question: "Atletul de birou ar trebui să urmărească:",
      options: ["0 pași/zi", "5–8k pași + pauze active", "Doar HIIT seara", "Doar stretching"],
      correctIndex: 1,
      rationale: "NEAT și mișcări frecvente mențin tonusul.",
      weight: 1,
      tags: ["movement"],
    },
    {
      question: "Cina târzie bogată în grăsimi:",
      options: [
        "Îmbunătățește somnul profund garantat",
        "Poate reduce calitatea somnului la unii",
        "Nu are efect niciodată",
        "Mărește melatonina",
      ],
      correctIndex: 1,
      rationale: "Digestia tardivă poate fragmenta somnul.",
      weight: 1,
      tags: ["sleep_nutrition"],
    },
    {
      question: "Marker simplu de recuperare dimineața:",
      options: ["Greutatea ghiozdanului", "Senzația subiectivă + ritm respirator calm", "WPM la tastatură", "Tensiunea bicepsului"],
      correctIndex: 1,
      rationale: "Subjective readiness + respirație liniștită sunt valide.",
      weight: 1,
      tags: ["readiness", "subjective"],
    },
    {
      question: "Cofeina după ora 15:",
      options: ["Nu afectează pe nimeni", "Poate afecta latența somnului la mulți", "Îmbunătățește HRV la culcare", "Crește melatonina"],
      correctIndex: 1,
      rationale: "T1/2 cofeină 4–6h, la unii mai mult.",
      weight: 1,
      tags: ["caffeine"],
    },
  ]),
  buildModule("breath", "Respirație & Vagal Tone", [
    {
      question: "Respirația nazală față de cea orală în repaus:",
      options: [
        "Reduce variabilitatea HRV",
        "Favorizează diafragma și reglajul autonom",
        "Crește hiperventilația",
        "Nu există diferențe",
      ],
      correctIndex: 1,
      rationale: "Nazal = filtrare, NO, diafragmă, calm autonom.",
      weight: 1,
      tags: ["nasal_breathing"],
    },
    {
      question: "Semn al hiperventilației cronice:",
      options: [
        "Toleranță mare la CO₂",
        "Amețeală/înțepături, oftat frecvent",
        "Somnolență post-prandială",
        "Poftă de dulce",
      ],
      correctIndex: 1,
      rationale: "Spălarea CO₂ → simptome neurologice ușoare.",
      weight: 1,
      tags: ["hyperventilation"],
    },
    {
      question: "Tempo util pentru calm autonom:",
      options: ["12–16 respirații/min", "≈6 respirații/min", "2 respirații/min", "Nu contează tempo-ul"],
      correctIndex: 1,
      rationale: "≈6/min e aproape de rezonanță pentru mulți.",
      weight: 1,
      tags: ["pace"],
    },
    {
      question: "Expirația prelungită față de inspirație:",
      options: ["Crește simpaticul", "Favorizează activarea vagală", "Nu influențează ANS", "Scade baroreflexul"],
      correctIndex: 1,
      rationale: "Expirația lungă stimulează parasimpaticul.",
      weight: 1,
      tags: ["exhalation"],
    },
    {
      question: "„Box breathing” 4-4-4-4 face:",
      options: ["Doar crește VO2max", "Antrenează controlul ritmului și atenția", "Scade coerența HRV", "Nu e util în stres"],
      correctIndex: 1,
      rationale: "Tempo egal sprijină focus și calm.",
      weight: 1,
      tags: ["box_breathing"],
    },
    {
      question: "Test simplu toleranță CO₂ (BOLT) indică:",
      options: ["Capacitatea de sprint", "Confort la creșterea CO₂ și control respirator", "VO2max", "Lactat bazal"],
      correctIndex: 1,
      rationale: "BOLT corelează cu toleranța CO₂.",
      weight: 1,
      tags: ["BOLT"],
    },
    {
      question: "Vagal tone crește tipic la:",
      options: ["Apnee lungă încordată", "Respirație diafragmatică ritmată", "Hiperventilație", "Efort maximal"],
      correctIndex: 1,
      rationale: "Diafragmă ritmată → parasimpatic ↑.",
      weight: 1,
      tags: ["vagal_tone"],
    },
    {
      question: "Semn că tehnica de respirație e prea intensă:",
      options: [
        "Warmth plăcut",
        "Ușoară somnolență",
        "Amețeală persistentă și anxietate",
        "Calm și claritate",
      ],
      correctIndex: 2,
      rationale: "Reduce intensitatea; urmărește confortul.",
      weight: 1,
      tags: ["safety"],
    },
  ]),
  buildModule("cbt", "CBT/ACT/NLP & Reframing", [
    {
      question: "Reframing înseamnă:",
      options: ["Negarea problemei", "Schimbarea semnificației sau perspectivei", "Amânare strategică", "Supra-analiză"],
      correctIndex: 1,
      rationale: "Reatribuie sensul/încadrarea pentru flexibilitate.",
      weight: 1,
      tags: ["reframing"],
    },
    {
      question: "„Gândire automată” în CBT:",
      options: ["Decizii deliberate", "Judecăți rapide, adesea distorsionate", "Meditație", "Brainstorming"],
      correctIndex: 1,
      rationale: "Sunt rapide și pot conține erori cognitive.",
      weight: 1,
      tags: ["CBT"],
    },
    {
      question: "În ACT, „defusion” urmărește:",
      options: ["Contopirea cu gândurile", "Distanțarea de conținutul mental", "Înăsprirea controlului", "Negarea emoțiilor"],
      correctIndex: 1,
      rationale: "Observi gândurile ca evenimente mentale.",
      weight: 1,
      tags: ["ACT"],
    },
    {
      question: "Ancorarea (NLP) vizează:",
      options: ["Creșterea VO2max", "Asocierea deliberată a unei stări cu un stimul", "Hipnoză profundă obligatorie", "Terapie farmacologică"],
      correctIndex: 1,
      rationale: "Creezi un declanșator pentru stări utile.",
      weight: 1,
      tags: ["NLP", "anchoring"],
    },
    {
      question: "Distorsiune cognitivă tipică:",
      options: ["Testare ipoteze", "Gândire alb-negru", "Considerare nuanțe", "Întrebări socratice"],
      correctIndex: 1,
      rationale: "Dihotomizarea realității reduce acuratețea.",
      weight: 1,
      tags: ["bias"],
    },
    {
      question: "Tehnica „STOP” (Stop–Take a breath–Observe–Proceed) ajută la:",
      options: [
        "Accelerare impulsivă",
        "Interruperea reacțiilor automate",
        "Ignorarea contextului",
        "Supra-control rigid",
      ],
      correctIndex: 1,
      rationale: "Introduce o fereastră de alegere conștientă.",
      weight: 1,
      tags: ["self_regulation"],
    },
    {
      question: "„Valori” în ACT au rolul de:",
      options: [
        "Scopuri finite",
        "Direcție de viață care ghidează comportamentele",
        "Checklist zilnic",
        "Evitarea disconfortului",
      ],
      correctIndex: 1,
      rationale: "Sunt busola, nu destinația.",
      weight: 1,
      tags: ["values"],
    },
    {
      question: "Un protocol de desensibilizare progresivă urmărește:",
      options: ["Expunere graduală cu reglaj emoțional", "Evitare totală", "Hiperventilație", "Distragere permanentă"],
      correctIndex: 0,
      rationale: "Crește toleranța și reduce reactivitatea.",
      weight: 1,
      tags: ["exposure"],
    },
  ]),
  buildModule("ooda", "OODA & Decizie", [
    {
      question: "Ordinea corectă în OODA Loop:",
      options: [
        "Decide–Observe–Orient–Act",
        "Observe–Orient–Decide–Act",
        "Act–Decide–Observe–Orient",
        "Orient–Observe–Act–Decide",
      ],
      correctIndex: 1,
      rationale: "Secvența standard OODA.",
      weight: 1,
      tags: ["OODA"],
    },
    {
      question: "„Orient” în OODA implică:",
      options: ["Doar emoții", "Modele mentale, context, biasuri", "Doar date brute", "Doar intuiție"],
      correctIndex: 1,
      rationale: "Orientarea aliniază percepția cu modelul mental.",
      weight: 1,
      tags: ["orientation"],
    },
    {
      question: "Un semn de „tunel cognitiv” sub stres:",
      options: [
        "Percepție periferică largă",
        "Fixare pe un singur detaliu relevant sau nu",
        "Generare de scenarii alternative",
        "Pauză deliberată",
      ],
      correctIndex: 1,
      rationale: "Îngustarea atenției reduce calitatea deciziei.",
      weight: 1,
      tags: ["tunnel"],
    },
    {
      question: "„Pre-mortem” servește la:",
      options: [
        "Sărbătorirea succesului",
        "Identificarea motivelor posibile de eșec înainte",
        "Creșterea anxietății intenționat",
        "Eliminarea riscurilor emoționale",
      ],
      correctIndex: 1,
      rationale: "Te pregătește pentru erori probabile.",
      weight: 1,
      tags: ["premortem"],
    },
    {
      question: "„Switching” eficient al atenției înseamnă:",
      options: [
        "Multitasking intens",
        "Comutare clară între sarcini fără pierdere de calitate",
        "Evitarea pauzelor",
        "Ignorarea contextului",
      ],
      correctIndex: 1,
      rationale: "Comutare deliberată, nu „multitasking”.",
      weight: 1,
      tags: ["attention"],
    },
    {
      question: "Când e util „satisficing” în decizii?",
      options: [
        "Întotdeauna",
        "Când costul căutării perfecțiunii depășește beneficiul",
        "Niciodată",
        "Doar în știință",
      ],
      correctIndex: 1,
      rationale: "Heuristică eficientă în constrângeri reale.",
      weight: 1,
      tags: ["decision"],
    },
    {
      question: "Indicator practic de bias de confirmare:",
      options: [
        "Cauți activ informații contrare ipotezei",
        "Eviți datele opuse convingerii",
        "Îți notezi erorile",
        "Ceri peer-review",
      ],
      correctIndex: 1,
      rationale: "Evitarea contra-dovezilor semnalează bias puternic.",
      weight: 1,
      tags: ["bias"],
    },
    {
      question: "„Time-boxing” ajută prin:",
      options: [
        "Creșterea ruminării",
        "Limitarea deliberată a timpului de decizie/execuție",
        "Ignorarea priorităților",
        "Evitarea deadline-urilor",
      ],
      correctIndex: 1,
      rationale: "Reduce indecizia și optimizează execuția.",
      weight: 1,
      tags: ["execution"],
    },
  ]),
  buildModule("mindfulness", "Mindfulness & Jurnal", [
    {
      question: "Mindfulness înseamnă în primul rând:",
      options: ["Golirea minții", "Atenție non-judicativă la prezent", "Auto-critic sever", "Analiză continuă"],
      correctIndex: 1,
      rationale: "Observi fără a judeca sau agăța conținutul.",
      weight: 1,
      tags: ["mindfulness"],
    },
    {
      question: "Jurnalizarea eficientă include:",
      options: ["Doar evenimente externe", "Context–gând–emoție–acțiune–rezultat", "Liste fără reflecție", "Critică retroactivă"],
      correctIndex: 1,
      rationale: "Lanțul CGER leagă experiența de învățare.",
      weight: 1,
      tags: ["journaling"],
    },
    {
      question: "Vizualizarea utilă pentru performanță:",
      options: [
        "Imagini vagi fără detalii",
        "Simulare multi-sens (VAK) cu scenarii și obstacole",
        "Doar repetarea unui slogan",
        "Evitarea emoțiilor",
      ],
      correctIndex: 1,
      rationale: "Simularea bogată crește transferul la real.",
      weight: 1,
      tags: ["visualization"],
    },
    {
      question: "Micro-pauza conștientă servește la:",
      options: ["Ruperea inerției reactive", "Scăderea conștienței", "Creșterea distractibilității", "Evitarea muncii"],
      correctIndex: 0,
      rationale: "Creează spațiu de alegere deliberată.",
      weight: 1,
      tags: ["micro_pause"],
    },
    {
      question: "Un semn de progres în practică:",
      options: [
        "Zero gânduri vreodată",
        "Recunoști rătăcirea atenției și revii blând",
        "Judeci mai mult",
        "Oboseală extremă",
      ],
      correctIndex: 1,
      rationale: "Meta-atenția și revenirea sunt esențiale.",
      weight: 1,
      tags: ["progress"],
    },
    {
      question: "Format util pentru obiective personale:",
      options: ["Vagi și fără termen", "SMART sau WOOP", "Doar dorințe", "Doar rezultate, fără procese"],
      correctIndex: 1,
      rationale: "Cadrele SMART/WOOP cresc executabilitatea.",
      weight: 1,
      tags: ["goals"],
    },
    {
      question: "„Mental rehearsal” după sesiune:",
      options: [
        "Repetă emoția fără context",
        "Rulează scenariul cu triggeri reali și răspunsuri dorite",
        "Ignoră senzațiile",
        "Doar citește notițe",
      ],
      correctIndex: 1,
      rationale: "Leagă indiciile reale de comportamentul țintă.",
      weight: 1,
      tags: ["rehearsal"],
    },
    {
      question: "Semn că jurnalul devine productiv:",
      options: ["Numai text lung", "Extrage 1–2 învățăminte acționabile per zi", "Citate aleatorii", "Doar critică de sine"],
      correctIndex: 1,
      rationale: "Învățămintele aplicabile creează progres.",
      weight: 1,
      tags: ["reflection"],
    },
  ]),
];

export const totalOmniKnowledgeWeight = omniKnowledgeModules.reduce(
  (sum, module) => sum + module.questions.reduce((moduleSum, q) => moduleSum + (q.weight ?? 1), 0),
  0,
);

export type OmniKnowledgeScores = {
  raw: number;
  max: number;
  percent: number;
  breakdown: Record<string, { raw: number; max: number; percent: number }>;
};

export function computeOmniKnowledgeScore(
  answers: Record<string, number | null>,
): OmniKnowledgeScores {
  const breakdown: Record<string, { raw: number; max: number; percent: number }> = {};
  let raw = 0;
  let max = 0;
  omniKnowledgeModules.forEach((module) => {
    let moduleRaw = 0;
    let moduleMax = 0;
    module.questions.forEach((question) => {
      const weight = question.weight ?? 1;
      moduleMax += weight;
      const value = answers[question.id];
      if (typeof value === "number" && value === question.correctIndex) {
        moduleRaw += weight;
      }
    });
    breakdown[module.key] = {
      raw: moduleRaw,
      max: moduleMax,
      percent: moduleMax ? Math.round((moduleRaw / moduleMax) * 100) : 0,
    };
    raw += moduleRaw;
    max += moduleMax;
  });
  const percent = max ? Math.round((raw / max) * 100) : 0;
  return { raw, max, percent, breakdown };
}
