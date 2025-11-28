export type CunoQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category?: 'clarity' | 'calm' | 'energy' | 'relationships' | 'performance' | 'health' | 'general';
  difficulty?: 1 | 2 | 3;
};

export const CUNO_QUESTIONS: CunoQuestion[] = [
  {
    id: "q1",
    question: "Care este primul pas util când simți că te copleșește stresul?",
    options: [
      "Să ignori senzațiile până trec",
      "Să observi respirația și ritmul cardiac 1–2 minute",
      "Să iei automat un stimulant",
      "Să forțezi concentrarea fără pauză",
    ],
    correctIndex: 1,
    explanation: "Observarea respirației și a ritmului cardiac activează autoreglarea și îți dă spațiu cognitiv.",
    category: 'calm',
    difficulty: 1,
  },
  {
    id: "q2",
    question: "Ce urmărește exercițiul de reframing cognitiv?",
    options: [
      "Să elimine complet emoțiile",
      "Să rescrie interpretarea astfel încât reacția să fie mai adaptivă",
      "Să dovedească altora că ai dreptate",
      "Să crești presiunea pentru performanță",
    ],
    correctIndex: 1,
    explanation: "Reframing-ul schimbă povestea internă ca să-ți ajustezi răspunsul emoțional și comportamental.",
    category: 'clarity',
    difficulty: 1,
  },
  {
    id: "q3",
    question: "Ce indică variabilitatea ridicată a ritmului cardiac (HRV) în repaus?",
    options: [
      "Sistemul nervos este mai flexibil și adaptabil",
      "Epuizare iminentă",
      "Lipsă de control",
      "Creștere de adrenalină constantă",
    ],
    correctIndex: 0,
    explanation: "HRV mai mare este corelat cu flexibilitate autonomă și capacitate de adaptare.",
    category: 'energy',
    difficulty: 1,
  },
  // Extins — claritate
  { id: 'q4', question: 'Care practică susține claritatea mentală în decizii rapide?', options: ['Journaling 1–2 min', 'Scroll fără scop', 'Amânare constantă', 'Ignorarea semnalelor'], correctIndex: 0, explanation: 'Jurnalizarea scurtă externalizează gândurile și crește claritatea.', category: 'clarity', difficulty: 2 },
  // calm
  { id: 'q5', question: 'Ce ritm respirator favorizează calmul?', options: ['6 resp/min', '18 resp/min', '30 resp/min', 'Nu contează'], correctIndex: 0, explanation: 'Respirația lentă (~6/min) stimulează vagul și induce calm.', category: 'calm', difficulty: 2 },
  // energy
  { id: 'q6', question: 'Ce indică scăderea susținută a energiei pe parcursul zilei?', options: ['Disreglare autonomă', 'Creștere performanță', 'Exces focus', 'Îmbunătățire somn'], correctIndex: 0, explanation: 'Energia în declin constant poate indica un balans simpatic/parasimpatic deficitar.', category: 'energy', difficulty: 2 },
  // relationships
  { id: 'q7', question: 'Ce întrebare susține relațiile în context de presiune?', options: ['Cine are dreptate?', 'Ce intenție are celălalt?', 'Cum câștig singur?', 'Cum evit discuția?'], correctIndex: 1, explanation: 'Explorarea intenției reduce reactivitatea și crește empatia.', category: 'relationships', difficulty: 2 },
  // performance
  { id: 'q8', question: 'Ce înseamnă “intrarea în zonă” (flow)?', options: ['Deblocare totală', 'Concentrare relaxată cu feedback rapid', 'Lipsa emoțiilor', 'Control total al contextului'], correctIndex: 1, explanation: 'Flow=concentrare relaxată, provocare potrivită și feedback imediat.', category: 'performance', difficulty: 2 },
  // health
  { id: 'q9', question: 'Un indiciu de sănătate metabolică în rutină?', options: ['Varietate în mișcare', 'Antrenament la epuizare zilnic', 'Ignorarea somnului', 'Cafea seara'], correctIndex: 0, explanation: 'Varietatea și recuperarea sunt cheie pentru sănătate.', category: 'health', difficulty: 2 },
  // clarity (more)
  { id: 'q10', question: 'Un pas eficient pentru claritatea intenției la început de zi?', options: ['Întreabă “care sunt 1–2 priorități?”', 'Deschide toate notificările', 'Începe fără plan', 'Amană deciziile critice'], correctIndex: 0, explanation: 'Prioritizarea scurtă creează claritate și momentum.', category: 'clarity', difficulty: 1 },
  { id: 'q11', question: 'Care practică reduce ruminația?', options: ['Jurnalizare ghidată', 'Scroll prelungit', 'Evita orice reflecție', 'Supraincarcă agenda'], correctIndex: 0, explanation: 'Jurnalizarea direcționează atenția și scade ruminația.', category: 'clarity', difficulty: 2 },
  // calm (more)
  { id: 'q12', question: 'Un marker simplu că ritmul respirator e eficient pt. calm?', options: ['Expirația mai lungă', 'Inspir scurt și alert', 'Țin aerul haotic', 'Nu contează'], correctIndex: 0, explanation: 'Expirația prelungită stimulează parasimpaticul.', category: 'calm', difficulty: 2 },
  { id: 'q13', question: 'Ce tip de pauză favorizează calmul în lucru?', options: ['Pauză scurtă, fără ecran', 'Pauză lungă cu multitasking', 'Deloc pauze', 'Pauză în trafic'], correctIndex: 0, explanation: 'Pauzele scurte fără ecran reduc supra-stimularea.', category: 'calm', difficulty: 1 },
  // energy (more)
  { id: 'q14', question: 'Care obicei sprijină energia pe parcursul zilei?', options: ['Expunere la lumină dimineața', 'Evita orice lumină naturală', 'Cafea seara', 'Somn aleator'], correctIndex: 0, explanation: 'Lumină dimineața ancorează ritmurile circadiene.', category: 'energy', difficulty: 1 },
  { id: 'q15', question: 'Semn că ai nevoie de reset de energie?', options: ['Scădere atenție susținută', 'Motivație constantă', 'Postură stabilă', 'Respirație calmă'], correctIndex: 0, explanation: 'Când atenția scade, un reset scurt ajută.', category: 'energy', difficulty: 2 },
  // relationships (more)
  { id: 'q16', question: 'Ce acțiune crește siguranța psihologică în discuții?', options: ['Reformulează ce ai înțeles', 'Întrerupe des', 'Vorbește peste ceilalți', 'Minimizează preocupările altora'], correctIndex: 0, explanation: 'Reflectarea crește încrederea și înțelegerea.', category: 'relationships', difficulty: 2 },
  { id: 'q17', question: 'Primul pas util când apare conflictul?', options: ['Clarifică obiectivul comun', 'Caută vinovatul', 'Escaladează tonul', 'Evită orice discuție'], correctIndex: 0, explanation: 'Obiectivul comun aliniază colaborarea.', category: 'relationships', difficulty: 1 },
  // performance (more)
  { id: 'q18', question: 'Ce setare ajută intrarea în flow?', options: ['Provocare potrivită abilității', 'Provocare prea mare', 'Provocare prea mică', 'Fără feedback'], correctIndex: 0, explanation: 'Provocarea potrivită + feedback => flow.', category: 'performance', difficulty: 2 },
  { id: 'q19', question: 'Indicator de ieșire din flow?', options: ['Distrageri dese', 'Feedback clar', 'Timp comprimat', 'Progres constant'], correctIndex: 0, explanation: 'Distragerile rup continuitatea atenției.', category: 'performance', difficulty: 1 },
  // health (more)
  { id: 'q20', question: 'Care minim zilnic susține sănătatea?', options: ['Plimbare 10–15 min', 'Ecran non-stop', 'Alimentație haotică', 'Somn neregulat'], correctIndex: 0, explanation: 'Mișcarea ușoară zilnică e ancoră metabolică.', category: 'health', difficulty: 1 },
  { id: 'q21', question: 'Ce favorizează recuperarea?', options: ['Rutine pre‑somn consistente', 'Stimulente seara', 'Lipsă orar', 'Zgomot intens la culcare'], correctIndex: 0, explanation: 'Rutinele pregătesc sistemul pentru somn.', category: 'health', difficulty: 2 },
  // general
  { id: 'q22', question: 'Un micro‑obicei cu impact transversal?', options: ['Respirație lentă 1–2 min', 'Salt peste mic dejun zilnic', 'Notificări continue', 'Fără pauze'], correctIndex: 0, explanation: 'Respirația lentă reglează și pregătește execuția.', category: 'general', difficulty: 1 },
  { id: 'q23', question: 'Primul pas pentru consecvență?', options: ['Ancore simple, repetitive', 'Obiective vagi', 'Complexitate maximă de la început', 'Schimbări zilnice drastice'], correctIndex: 0, explanation: 'Ancorele repetabile cresc aderența.', category: 'general', difficulty: 1 },
  // Psych flexibility (ACT) — general
  { id: 'pf1', question: 'Ce descrie cel mai bine flexibilitatea psihologică?', options: ['Evitarea emoțiilor neplăcute', 'Deschidere la experiență + adaptare în funcție de valori', 'Control total al gândurilor', 'Perfecționism în orice context'], correctIndex: 1, explanation: 'Flexibilitatea = deschidere, contact cu prezentul și acțiune ghidată de valori (ACT).', category: 'general', difficulty: 1 },
  { id: 'pf2', question: 'Un exemplu de “defusion” cognitiv (ACT) este…', options: ['Să crezi 100% orice gând', 'Să observi gândul ca pe un eveniment mental, nu ca pe un fapt', 'Să te forțezi să nu mai gândești', 'Să ignori corpul'], correctIndex: 1, explanation: 'Defusion: observi gândul fără să te identifici cu el, reducând influența automată.', category: 'general', difficulty: 2 },
  { id: 'pf3', question: 'Care acțiune reflectă “valori în acțiune”?', options: ['Amân pe termen nedefinit', 'Fac un pas mic azi în direcția valorilor mele', 'Caut aprobare constant', 'Evita orice risc'], correctIndex: 1, explanation: 'Acțiuni ghidate de valori, chiar și mici, cresc flexibilitatea și sentimentul de sens.', category: 'general', difficulty: 2 },
];
