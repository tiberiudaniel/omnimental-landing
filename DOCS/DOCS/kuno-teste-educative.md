
Gândește OmniKuno Onboarding ca un “micro-quest” ultra-personalizat: 7–8 întrebări care pornesc direct din tema și expresiile pe care le-a ales omul în Intent + Cloud.

Îți propun 3 niveluri:

Logica de matching (cum alegem mini-testul)

Structura generală a mini-testului

Un exemplu concret: mini-test pentru RELAȚII (cu întrebări gata de folosit)

1. Logica de matching: cum decide OmniKuno ce mini-test să dea

Ai deja:

Aria principală (ex: „Relații”) din Intent.

2–4 expresii din Cloud pe care le-a ales (ex: „mă simt neînțeles(ă)”, „mă consum în relațiile apropiate”, „mă epuizează conflictele”).

Definim pentru OmniKuno:

topicKey: relatii / calm / identitate / performanta / obiceiuri / etc.

subtopicKey pentru finețe în interiorul temei:

relatii_cuplu

relatii_familie

relatii_job

relatii_generale (dacă e amestec)

Mecanism:

Din Cloud: expresiile sunt mapate la taguri (ex: „relația de cuplu”, „singurătate”, „certuri cu părinții”, „tensiuni cu șeful”).

topicKey + subtopicKey → selectează un „set de bază” de 10–12 itemi OmniKuno pentru tema respectivă.

Din setul de bază, OmniKuno alege 7–8 întrebări:

2 întrebări inspirate direct din expresiile lui (se injectează textul exact).

3–4 întrebări standard educative (scenarii, true/false, alegeri).

1–2 întrebări de tip “ready for change” (motivație / resurse).

Mai jos ai tot ce-i trebuie lui Codex/Windsurf: structură de date + logică + exemplu complet de mini-test pentru categoria „relații”, cu feedback scurt, neutru, generalizabil.

1. Principii pentru OmniKuno Mini-Test

7–8 întrebări / mini-test.

Un mini-test per categorie principală din Cloud/Intent (relatii, calm, identitate, performanta, obiceiuri etc.).

Întrebările sunt:

1–2 de tip „oglindă” (stil, reacție tipică).

2–3 de tip educativ (true/false sau cu variante).

1–2 de scenariu („ce faci de obicei când…”).

1 de pregătire pentru schimbare (dispus să încerci X).

Feedback:

Neutru, 1–2 fraze max (ideal 1–1.5 rânduri).

General, nu excesiv de personalizat, chiar dacă folosește tema exprimată de user.

2. Structură de date propusă (TypeScript)
// lib/omniKunoTypes.ts

export type OmniKunoTopicKey =
  | "relatii"
  | "calm"
  | "identitate"
  | "performanta"
  | "obiceiuri"
  | "sens"
  | "energie"; // extins după cum aveți în Cloud

export type OmniKunoQuestionType =
  | "singleChoice"
  | "trueFalse"
  | "likert";

export interface OmniKunoOption {
  id: string;
  label: string;
}

export interface OmniKunoQuestion {
  id: string;
  topicKey: OmniKunoTopicKey;
  subtopicKey?: string; // ex: "cuplu", "familie", "job", "general"
  order: number;
  type: OmniKunoQuestionType;

  // Textul întrebării; poate conține placeholder generic,
  // dar nu e obligatoriu să injectăm exact expresia userului.
  text: string;

  options: OmniKunoOption[];

  // Feedback neutru, scurt; poate fi:
  // - același pentru toate opțiunile (defaultFeedback)
  // - sau mapare per opțiune (feedbackByOption)
  defaultFeedback?: string;
  feedbackByOption?: Record<string, string>;
}

// Config mini-test per topic
export interface OmniKunoMiniTestConfig {
  topicKey: OmniKunoTopicKey;
  questionIds: string[]; // ordinea întrebărilor pentru mini-testul de onboarding
}

3. Exemplu concret – Mini-test RELAȚII (7 întrebări)
// lib/omniKunoRelatii.ts

import {
  OmniKunoQuestion,
  OmniKunoMiniTestConfig,
} from "./omniKunoTypes";

export const omniKunoRelatiiQuestions: OmniKunoQuestion[] = [
  {
    id: "relatii_q1_pattern_ascultare",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 1,
    type: "singleChoice",
    text:
      "Când simți că nu ești prea ascultat(ă) într-o relație importantă, ce descrie mai bine situația de obicei?",
    options: [
      { id: "A", label: "Îmi este greu să spun clar ce am nevoie." },
      { id: "B", label: "Spun ce am nevoie, dar discuția este adesea minimalizată sau evitată." },
      { id: "C", label: "Prefer să tac, ca să evit tensiunile." },
      { id: "D", label: "Nu am un tipar clar, situațiile sunt foarte diferite." },
    ],
    defaultFeedback:
      "A deveni conștient(ă) de tiparul dominant în modul de comunicare este un prim pas realist spre schimbare în relații."
  },

  {
    id: "relatii_q2_conflict_research",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 2,
    type: "singleChoice",
    text:
      "Cercetările despre relații apropiate arată că relațiile sănătoase sunt, de obicei:",
    options: [
      { id: "A", label: "Fără conflicte, dacă oamenii se potrivesc cu adevărat." },
      { id: "B", label: "Nu lipsite de conflicte, ci caracterizate de modul în care sunt gestionate tensiunile." },
      { id: "C", label: "Definite de câte lucruri fac împreună, nu de calitatea discuțiilor." },
    ],
    feedbackByOption: {
      A: "Așteptarea de a nu exista deloc conflicte poate crea presiune și dezamăgire; accentul util este pe modul în care sunt gestionate diferențele.",
      B: "Gestionarea conflictelor și felul în care oamenii revin după tensiuni sunt indicatori importanți ai sănătății relației.",
      C: "Activitățile comune ajută, dar calitatea discuțiilor și modul de gestionare a neînțelegerilor au impact mare pe termen lung."
    }
  },

  {
    id: "relatii_q3_mod_reactie_conflict",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 3,
    type: "singleChoice",
    text:
      "Când apare un conflict important într-o relație apropiată, ce reacție e mai frecventă la tine?",
    options: [
      { id: "A", label: "Tind să spun tot ce am pe suflet, chiar dacă tonul devine dur." },
      { id: "B", label: "Tind să evit discuția și sper să treacă de la sine." },
      { id: "C", label: "Încep calm, dar renunț repede dacă celălalt ridică tonul." },
      { id: "D", label: "Reacțiile mele sunt foarte variabile, fără un tipar clar." },
    ],
    defaultFeedback:
      "Observarea modului tipic de reacție în conflict permite ulterior exersarea unor alternative mai potrivite pentru obiectivele tale în relații."
  },

  {
    id: "relatii_q4_limite",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 4,
    type: "singleChoice",
    text:
      "În relațiile importante, limitele sănătoase sunt cel mai bine descrise de:",
    options: [
      { id: "A", label: "A nu accepta nicio critică sau feedback." },
      { id: "B", label: "A spune clar ce te rănește sau te epuizează, fără a rupe automat relația." },
      { id: "C", label: "A accepta aproape orice, pentru a nu pierde persoana." },
    ],
    feedbackByOption: {
      A: "Respingerile ferme ale oricărei critici pot bloca discuțiile utile; limitele includ și disponibilitatea de a asculta.",
      B: "Formularea clară a limitelor personale, cu respect față de celălalt, este o componentă centrală a relațiilor funcționale.",
      C: "Acceptarea constantă a ceea ce te afectează negativ poate menține relația, dar adesea în detrimentul stării tale pe termen lung."
    }
  },

  {
    id: "relatii_q5_epuizare_conflicte",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 5,
    type: "singleChoice",
    text:
      "Când conflictele te epuizează, ce simți că te consumă cel mai mult, în general?",
    options: [
      { id: "A", label: "Intensitatea emoțiilor (furie, teamă, tristețe)." },
      { id: "B", label: "Gândurile repetate despre ce s-a întâmplat." },
      { id: "C", label: "Teama de consecințe (respingeri, reproșuri, pierderea relației)." },
      { id: "D", label: "O combinație dintre cele de mai sus." },
    ],
    defaultFeedback:
      "Epuizarea din conflicte este adesea un amestec de emoții intense, gânduri repetate și îngrijorare; a identifica componenta dominantă ajută la alegerea exercițiilor potrivite."
  },

  {
    id: "relatii_q6_disponibilitate_experiment",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 6,
    type: "singleChoice",
    text:
      "Cât de realist simți că poți testa un mic exercițiu legat de relații în următoarea săptămână?",
    options: [
      { id: "A", label: "Deocamdată foarte puțin; abia fac față la ce am deja." },
      { id: "B", label: "Aș putea încerca ceva foarte scurt (câteva minute)." },
      { id: "C", label: "Sunt dispus(ă) să aloc timp pentru un exercițiu mai structurat." },
      { id: "D", label: "Nu sunt sigur(ă) încă." },
    ],
    defaultFeedback:
      "Este util ca ritmul exercițiilor să fie calibrat la resursele reale; chiar și pașii foarte mici pot susține schimbarea în timp."
  },

  {
    id: "relatii_q7_suport_social",
    topicKey: "relatii",
    subtopicKey: "general",
    order: 7,
    type: "singleChoice",
    text:
      "Când treci prin dificultăți în relații, cât de mult simți că ai cu cine să discuți deschis despre asta?",
    options: [
      { id: "A", label: "Aproape pe nimeni, de obicei păstrez totul pentru mine." },
      { id: "B", label: "1–2 persoane, dar evit să intru prea des în detalii." },
      { id: "C", label: "Am cel puțin o persoană cu care pot vorbi destul de deschis." },
      { id: "D", label: "Prefer să nu vorbesc deloc, chiar dacă aș putea." },
    ],
    defaultFeedback:
      "Disponibilitatea de a vorbi cu cineva despre dificultățile din relații poate fi un factor de protecție important și poate completa munca interioară personală."
  },
];

export const omniKunoRelatiiMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: "relatii",
  questionIds: [
    "relatii_q1_pattern_ascultare",
    "relatii_q2_conflict_research",
    "relatii_q3_mod_reactie_conflict",
    "relatii_q4_limite",
    "relatii_q5_epuizare_conflicte",
    "relatii_q6_disponibilitate_experiment",
    "relatii_q7_suport_social",
  ],
};

4. Logica de matching pentru dev (simplificată)

Pseudocod pentru legătura dintre Intent + Cloud și mini-test:

// exemplu foarte simplificat
import {
  omniKunoRelatiiMiniTestConfig,
  omniKunoRelatiiQuestions,
} from "./lib/omniKunoRelatii";
// importă și celelalte topic-uri când sunt create

type PrimaryDimensionKey =
  | "relatii"
  | "calm"
  | "identitate"
  | "performanta"
  | "obiceiuri"
  | "sens"
  | "energie";

interface OnboardingContext {
  primaryDimension: PrimaryDimensionKey;
  cloudTags: string[]; // ex: ["conflicte", "lipsa_limite"]
}

export function getOmniKunoMiniTest(context: OnboardingContext) {
  switch (context.primaryDimension) {
    case "relatii": {
      // aici se pot folosi cloudTags mai în detaliu (cuplu/familie/job),
      // dar pentru v1 este suficient mini-testul general
      const config = omniKunoRelatiiMiniTestConfig;
      const allQuestions = omniKunoRelatiiQuestions;
      const questions = config.questionIds
        .map((id) => allQuestions.find((q) => q.id === id))
        .filter((q): q is typeof allQuestions[number] => Boolean(q));

      return {
        topicKey: config.topicKey,
        questions,
      };
    }

    // TODO: implementare similară pentru celelalte categorii din Cloud
    // case "calm": ...
    // case "identitate": ...
    // etc.

    default: {
      // fallback: dacă nu avem încă topicul implementat,
      // se poate alege un set generic sau se sare peste OmniKuno.
      return null;
    }
  }
}

5. Ce mai rămâne de făcut pentru celelalte categorii din Cloud

Pentru fiecare categorie principală (din Intent + Cloud):

Se definește un fișier similar cu omniKunoRelatii.ts, cu:

7–8 întrebări adaptate temei respective.

Feedback neutru, scurt, max 1–2 fraze.

Se adaugă în switch-ul din getOmniKunoMiniTest.

Opțional, se poate introduce subtopicKey (ex.: relatii_cuplu / relatii_familie / relatii_job), dacă vrei rafinare pe baza tag-urilor din Cloud.

Poți da direct codul de mai sus la Codex/Windsurf ca bază de implementare și îi spui doar:

să copie structura pentru celelalte topic-uri,

să păstreze stilul de feedback: neutru, general, scurt.


# ======== ========  ======


Standard Omni-Kuno v1.1 – structură generală

Patru straturi:

Model de date & scoruri

Model de item (întrebări / exerciții)

Flow-uri UX (Onboarding, Practice, Learn, Missions)

Gamification & personalizare

2.1. Model de date & scoruri

Dimensiuni (exemplu, tu poți redenumi, dar ideea rămâne):

claritate

calm

energie

relatii

identitate

performanta

obiceiuri

Pentru fiecare dimensiune:

masteryByCategory[dim] – 0–100 (cât de stăpânită e zona).

kunoKnowledgeIndex – scor global Omni-Kuno (deja ai knowledgeIndex).

kunoEngagementIndex – agregă cât de des intră în Kuno (sesiuni/săpt., streak, timp mediu).

signals – mici semnale de stil (ex.: “evitare conflict”, “overthinking”, “low energy morning”).

Scorare sugerată (MVP solid, dar ușor extensibil):

// la finalul unei sesiuni Kuno (onboarding sau practice):
sessionPercent = correctItems / knowledgeItems * 100

// pe categorie
categoryPercent[cat] = correctItemsInCat / knowledgeItemsInCat * 100

// update mastery cu EWMA (exemplu)
newMastery[cat] = 0.5 * oldMastery[cat] + 0.5 * categoryPercent[cat]

// knowledgeIndex global
newKnowledgeIndex = 0.3 * oldKnowledgeIndex + 0.7 * sessionPercent


Onboarding-ul poate avea și indici suplimentari:

readinessIndex (din itemii de tip “cât ești dispus să experimentezi”).

selfAwarenessIndex (din itemii de tip reflecție, nu corect/greșit, dar scorabil pe o scară).

Aceste indexuri pot fi folosite ulterior în recomandări (de ex. “e gata să intre direct în training intens” vs “începem cu psiho-educație soft”).

2.2. Model de item – “creierul” Omni-Kuno

Aici e locul unde ridicăm standardul față de un quiz obișnuit.

// lib/kunoTypes.ts

export type KunoCategory =
  | "claritate"
  | "calm"
  | "energie"
  | "relatii"
  | "identitate"
  | "performanta"
  | "obiceiuri";

export type KunoFacet =
  | "autoclarificare"
  | "gestionare_conflict"
  | "limite"
  | "ruminatie"
  | "reglare_fiziologica"
  | "focus"
  | "ritm_somn"
  | "autoeficacitate"
  // etc. – liber, dar stabil în timp

export type KunoItemStyle =
  | "knowledge"      // are răspuns corect/greșit
  | "reflection"     // fără corect, dar profilare / self-awareness
  | "scenario"       // stil comportamental, semnalează pattern
  | "microSkill";    // mic exercițiu cu micro-quiz legat

export interface KunoOption {
  id: string;
  label: string;
}

export interface KunoQuestion {
  id: string;

  // unde se încadrează
  category: KunoCategory;
  facet: KunoFacet;

  style: KunoItemStyle;
  difficulty: 1 | 2 | 3;

  text: string;
  options: KunoOption[];

  // doar la knowledge/microSkill
  correctOptionId?: string;

  // pentru /kuno/learn – explicație scurtă, nu neapărat afișată în onboarding
  explanation?: string;

  // XP implicit pentru item (poate fi override la nivel de sesiune)
  xpValue?: number;

  // taguri pentru matching cu Cloud / Intent (nu se văd userului)
  tags?: string[];

  // dacă e item dedicat onboarding-ului
  isOnboarding?: boolean;
}


Avantaj:

Poți amesteca, în aceeași sesiune, întrebări knowledge + reflection + scenario, fără să rupi engine-ul.

Scorul se bazează doar pe style === "knowledge" | "microSkill", dar reflection și scenario înregistrează semnale (pattern-uri) în signals.

Onboarding-ul poate folosi isOnboarding + tags pentru a selecta itemi relevanți temei principale din Intent + Cloud.

2.3. Standard pentru Onboarding Omni-Kuno

Obiectiv: onboarding-ul devine primul “modul Kuno”:

detectează dimensiunea principală + câteva pattern-uri,

dă userului sentimentul că “motorul mă vede”,

dă un start gamificat (XP, primul badge)

setează direcția de învățare.

Flow simplificat:

Din Intent + Cloud:

primaryCategory (ex. relatii)

secondaryCategory (ex. calm sau identitate)

cloudTags (ex. conflicte, lipsa_limite, oboseala)

Kuno selectează:

4–5 itemi isOnboarding=true pentru primaryCategory (mix: 2 knowledge, 1 reflection, 1 scenario, 1 microSkill).

2–3 itemi pentru secondaryCategory (knowledge/reflective).
Total: 7–8 întrebări.

Ce înregistrăm:

sessionPercent (doar knowledge).

categoryPercent pentru primary + secondary.

signals (ex. relatii.gestionare_conflict=evitare dacă userul alege opțiunea corespunzătoare).

readinessIndex din 1–2 itemi reflectivi de tip “cât ești dispus să încerci X”.

Ce îi dăm userului la final:

Un mini-summary neutru, simplu:

“În zona Relații, răspunsurile tale arată câteva tipare în modul în care gestionezi tensiunile și limitele.”

“Omni-Kuno va prioritiza exerciții scurte pentru [facet1] și [facet2].”

XP + badge: “Primul pas Omni-Kuno”

Buton: “Continuă cu exerciții practice” → /kuno/practice prefiltrat pe aceeași categorie.

2.4. Practice & Learn – standard
/kuno/practice

5–7 itemi, mix de stiluri, dar întotdeauna min. 3 knowledge.

Algoritm pickNext:

Dacă există categorie cu mastery < 50% → prefer item din categoria aceea.

Difficulty adaptiv:

dacă ultimele 3 knowledge au fost corecte → creștem difficulty.

dacă ultimele 3 au fost greșite → scădem difficulty.

Evită să repete același facet prea des.

La final:

Scor (percent) + 1–2 fraze neutre.

Recomandare: “Următorul pas util: lecția X din [categorie].”

XP + update mastery.

/kuno/learn

Lista de categorii, fiecare cu 1–3 lecții scurte.

Fiecare lecție:

Title (ex. “Clarificarea nevoilor în relații”).

3–5 paragrafe scurt-mediu.

1 micro-quiz (1–2 itemi knowledge/microSkill).

Opțional: un exercițiu de viață reală (“În următoarea discuție, încearcă să formulezi o cerere clară.”).

La finalul lecției:

XP (ex. +5).

Mic boost la masteryByCategory[cat] (ex. +2..5% dacă micro-quiz corect).

2.5. Gamification – regulile de bază

Propun:

// lib/kunoGamification.ts

export interface KunoGamificationState {
  xp: number;
  badges: string[]; // ex.: ["first_test", "first_lesson"]
  streakDays: number;
  lastActiveDate: string; // "YYYY-MM-DD"
}


Reguli:

XP:

+10 XP pentru un mini-test onboarding complet.

+8 XP pentru o sesiune practice completă.

+5 XP pentru o lecție /kuno/learn cu micro-quiz corect.

Streak:

Dacă userul face cel puțin o activitate Kuno într-o zi → streak++.

Dacă sare o zi → streak = 0.

Bonus XP: +2 XP per zi peste 3 zile streak (max +10).

Badge-uri:

first_test: prima sesiune Omni-Kuno.

first_lesson: prima lecție /kuno/learn terminată.

streak_7, streak_30: când streakDays atinge 7 sau 30.

mastery_60_relatii etc: când masteryByCategory[cat] ≥ 60.

Vizualizare (în /progress, sub Omni-Cuno):

XP + nivel (level = floor(xp / 50) sau similar).

3–5 badge-uri cheie vizibile.

Bare de mastery per categorie.

2.6. Ce poate implementa Codex concret (checklist)

Extindere kunoTypes.ts

Adaugă: category, facet, style, xpValue, isOnboarding.

Păstrează compatibilitatea cu ce există (poți marca temporar category?: KunoCategory etc., apoi migrezi).

Extindere bancă de itemi

În lib/cunoQuestions.ts (sau kunoBanks.ts):

Cel puțin 5–7 itemi per categorie, amestec de knowledge, reflection, scenario.

Marchează 2–3 per categorie ca isOnboarding=true.

Onboarding Omni-Kuno

Creează un helper getOnboardingQuestions(primaryCategory, secondaryCategory, cloudTags) care extrage 7–8 itemi isOnboarding cu mix de style.

În step-ul de Kuno din /experience-onboarding, folosește acest helper în loc de un set fix.

La final: calculează sessionPercent, categoryPercent, câteva signals simple (ex. “conflictStyle=avoidant/explosive”).

Patch în profil: omni.kuno.knowledgeIndex, omni.kuno.masteryByCategory, omni.kuno.gamification (XP + badge “first_test” dacă nu există).

Practice adaptiv

În lib/kunoScoring.ts, extinde pickNext astfel încât:

să ia în calcul masteryByCategory și difficulty.

să evite repetarea aceluiași facet.

/kuno/learn

Creează /kuno/learn cu:

listă de categorii;

două lecții inițiale (ex. claritate și calm), fiecare cu 1 micro-quiz.

La finalul lecției: update XP, mic update masteryByCategory[cat].

Gamification state

În recordOmniPatch sau un helper nou:

vezi dacă există omni.kuno.gamification; dacă nu, inițializează.

actualizează xp, streakDays, badges la fiecare sesiune Kuno (onboarding, practice, learn).