import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoRelatiiQuestions: OmniKunoQuestion[] = [
  {
    id: 'relatii_q1_pattern_ascultare',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 1,
    type: 'singleChoice',
    style: 'knowledge',
    isOnboarding: true,
    text:
      'Când simți că nu ești prea ascultat(ă) într-o relație importantă, ce descrie mai bine situația de obicei?',
    options: [
      { id: 'A', label: 'Îmi este greu să spun clar ce am nevoie.' },
      { id: 'B', label: 'Spun ce am nevoie, dar discuția este adesea minimalizată sau evitată.' },
      { id: 'C', label: 'Prefer să tac, ca să evit tensiunile.' },
      { id: 'D', label: 'Nu am un tipar clar, situațiile sunt foarte diferite.' },
    ],
    defaultFeedback:
      'A deveni conștient(ă) de tiparul dominant în modul de comunicare este un prim pas realist spre schimbare în relații.',
  },
  {
    id: 'relatii_q2_conflict_research',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 2,
    type: 'singleChoice',
    style: 'knowledge',
    isOnboarding: true,
    text: 'Cercetările despre relații apropiate arată că relațiile sănătoase sunt, de obicei:',
    options: [
      { id: 'A', label: 'Fără conflicte, dacă oamenii se potrivesc cu adevărat.' },
      { id: 'B', label: 'Nu lipsite de conflicte, ci caracterizate de modul în care sunt gestionate tensiunile.' },
      { id: 'C', label: 'Definite de câte lucruri fac împreună, nu de calitatea discuțiilor.' },
    ],
    feedbackByOption: {
      A: 'Așteptarea de a nu exista deloc conflicte poate crea presiune și dezamăgire; accentul util este pe modul în care sunt gestionate diferențele.',
      B: 'Gestionarea conflictelor și felul în care oamenii revin după tensiuni sunt indicatori importanți ai sănătății relației.',
      C: 'Activitățile comune ajută, dar calitatea discuțiilor și modul de gestionare a neînțelegerilor au impact mare pe termen lung.',
    },
  },
  {
    id: 'relatii_q3_mod_reactie_conflict',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 3,
    type: 'singleChoice',
    style: 'scenario',
    isOnboarding: true,
    facet: 'conflict_style',
    text: 'Când apare un conflict important într-o relație apropiată, ce reacție e mai frecventă la tine?',
    options: [
      { id: 'A', label: 'Tind să spun tot ce am pe suflet, chiar dacă tonul devine dur.' },
      { id: 'B', label: 'Tind să evit discuția și sper să treacă de la sine.' },
      { id: 'C', label: 'Încep calm, dar renunț repede dacă celălalt ridică tonul.' },
      { id: 'D', label: 'Reacțiile mele sunt foarte variabile, fără un tipar clar.' },
    ],
    defaultFeedback:
      'Observarea modului tipic de reacție în conflict permite ulterior exersarea unor alternative mai potrivite pentru obiectivele tale în relații.',
  },
  {
    id: 'relatii_q4_limite',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 4,
    type: 'singleChoice',
    style: 'knowledge',
    isOnboarding: true,
    facet: 'limits',
    text: 'În relațiile importante, limitele sănătoase sunt cel mai bine descrise de:',
    options: [
      { id: 'A', label: 'A nu accepta nicio critică sau feedback.' },
      { id: 'B', label: 'A spune clar ce te rănește sau te epuizează, fără a rupe automat relația.' },
      { id: 'C', label: 'A accepta aproape orice, pentru a nu pierde persoana.' },
    ],
    feedbackByOption: {
      A: 'Respingerile ferme ale oricărei critici pot bloca discuțiile utile; limitele includ și disponibilitatea de a asculta.',
      B: 'Formularea clară a limitelor personale, cu respect față de celălalt, este o componentă centrală a relațiilor funcționale.',
      C: 'Acceptarea constantă a ceea ce te afectează negativ poate menține relația, dar adesea în detrimentul stării tale pe termen lung.',
    },
  },
  {
    id: 'relatii_q5_epuizare_conflicte',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 5,
    type: 'singleChoice',
    style: 'reflection',
    isOnboarding: true,
    facet: 'conflict_burden',
    text: 'Când conflictele te epuizează, ce simți că te consumă cel mai mult, în general?',
    options: [
      { id: 'A', label: 'Intensitatea emoțiilor (furie, teamă, tristețe).' },
      { id: 'B', label: 'Gândurile repetate despre ce s-a întâmplat.' },
      { id: 'C', label: 'Teama de consecințe (respingeri, reproșuri, pierderea relației).' },
      { id: 'D', label: 'O combinație dintre cele de mai sus.' },
    ],
    defaultFeedback:
      'Epuizarea din conflicte este adesea un amestec de emoții intense, gânduri repetate și îngrijorare; a identifica componenta dominantă ajută la alegerea exercițiilor potrivite.',
  },
  {
    id: 'relatii_q6_disponibilitate_experiment',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 6,
    type: 'singleChoice',
    style: 'reflection',
    isOnboarding: true,
    facet: 'readiness',
    text: 'Cât de realist simți că poți testa un mic exercițiu legat de relații în următoarea săptămână?',
    options: [
      { id: 'A', label: 'Deocamdată foarte puțin; abia fac față la ce am deja.' },
      { id: 'B', label: 'Aș putea încerca ceva foarte scurt (câteva minute).' },
      { id: 'C', label: 'Sunt dispus(ă) să aloc timp pentru un exercițiu mai structurat.' },
      { id: 'D', label: 'Nu sunt sigur(ă) încă.' },
    ],
    defaultFeedback:
      'Este util ca ritmul exercițiilor să fie calibrat la resursele reale; chiar și pașii foarte mici pot susține schimbarea în timp.',
  },
  {
    id: 'relatii_q7_suport_social',
    topicKey: 'relatii',
    subtopicKey: 'general',
    order: 7,
    type: 'singleChoice',
    style: 'reflection',
    isOnboarding: true,
    facet: 'social_support',
    text: 'Când treci prin dificultăți în relații, cât de mult simți că ai cu cine să discuți deschis despre asta?',
    options: [
      { id: 'A', label: 'Aproape pe nimeni, de obicei păstrez totul pentru mine.' },
      { id: 'B', label: '1–2 persoane, dar evit să intru prea des în detalii.' },
      { id: 'C', label: 'Am cel puțin o persoană cu care pot vorbi destul de deschis.' },
      { id: 'D', label: 'Prefer să nu vorbesc deloc, chiar dacă aș putea.' },
    ],
    defaultFeedback:
      'Disponibilitatea de a vorbi cu cineva despre dificultățile din relații poate fi un factor de protecție important și poate completa munca interioară personală.',
  },
];

export const omniKunoRelatiiMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'relatii',
  questionIds: [
    'relatii_q1_pattern_ascultare',
    'relatii_q2_conflict_research',
    'relatii_q3_mod_reactie_conflict',
    'relatii_q4_limite',
    'relatii_q5_epuizare_conflicte',
    'relatii_q6_disponibilitate_experiment',
    'relatii_q7_suport_social',
  ],
};
