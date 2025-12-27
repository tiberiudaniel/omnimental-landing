import type { CatAxisId } from "@/lib/profileEngine";

export const VOCAB_TAGS = [
  "clarity_low",
  "focus_scattered",
  "pace_hurried",
  "energy_low",
  "tension_high",
  "reactive",
  "self_critical",
  "stuck",
  "rigid",
  "sunk_cost",
  "change_resistance",
  "identity_loop",
  "meta_observe",
] as const;

export type CatVocabTag = (typeof VOCAB_TAGS)[number];

export type CatVocabCard = {
  id: string;
  axisId: CatAxisId;
  domainId: string;
  stateLabel: {
    ro: string;
    en: string;
  };
  command: {
    ro: string;
    en: string;
  };
  scienceLabel: string;
  definition: {
    ro: string;
    en: string;
  };
  bridge: string;
  promise: string;
  antiPattern: string;
  microAction: string;
  tokens: {
    ro: string[];
    en?: string[];
  };
  tagsPrimary: [CatVocabTag];
  tagsSecondary?: CatVocabTag[];
  weight?: number;
  isBuffer?: boolean;
  isTopCommand?: boolean;
};

const VOCAB_CARDS: CatVocabCard[] = [
  {
    id: "clarity_fog",
    axisId: "clarity",
    domainId: "decisionalClarity",
    stateLabel: { ro: "În ceață", en: "Foggy" },
    command: { ro: "Reality check.", en: "Reality check." },
    scienceLabel: "Ceață mentală (brain fog)",
    definition: {
      ro: "O stare temporară în care gândirea devine încețoșată: îți este greu să te concentrezi, să iei decizii sau să procesezi informațiile clar, ca și cum mintea ar fi acoperită de ceață.",
      en: "O stare temporară în care gândirea devine încețoșată: îți este greu să te concentrezi, să iei decizii sau să procesezi informațiile clar, ca și cum mintea ar fi acoperită de ceață.",
    },
    bridge: "Apare frecvent când mintea e suprasolicitată sau obosită.",
    promise: "Claritatea se poate recâștiga pas cu pas. Vom aborda asta în sesiuni scurte.",
    antiPattern: "inventez explicații / presupun",
    microAction: "spune 1 fapt verificabil acum",
    tokens: { ro: ["ceață", "confuz", "nu înțeleg", "neclar"] },
    tagsPrimary: ["clarity_low"],
  },
  {
    id: "clarity_story_strip",
    axisId: "clarity",
    domainId: "decisionalClarity",
    stateLabel: { ro: "Îmi fac filme", en: "Spinning stories" },
    command: { ro: "Strip the story.", en: "Strip the story." },
    scienceLabel: "Simulare mentală anxioasă (ruminație anticipativă)",
    definition: {
      ro: "Mintea completează golurile cu scenarii: îți imaginezi ce ar putea merge prost sau ce ar putea însemna ceva, chiar fără dovezi clare.",
      en: "Mintea completează golurile cu scenarii: îți imaginezi ce ar putea merge prost sau ce ar putea însemna ceva, chiar fără dovezi clare.",
    },
    bridge: "E un mod comun prin care creierul caută control în incertitudine.",
    promise: "Există metode simple de a reveni la fapte și prezent. Le exersăm gradual.",
    antiPattern: "narațiune → anxietate",
    microAction: "separă: fapt vs interpretare (1 linie / 1 linie)",
    tokens: { ro: ["filme", "poveste", "scenariu", "interpretare"] },
    tagsPrimary: ["clarity_low"],
    tagsSecondary: ["reactive"],
  },
  {
    id: "focus_scattered",
    axisId: "focus",
    domainId: "executiveControl",
    stateLabel: { ro: "Împrăștiată", en: "Scattered" },
    command: { ro: "Single thread.", en: "Single thread." },
    scienceLabel: "Atenție fragmentată (attention fragmentation)",
    definition: {
      ro: "Atenția sare între lucruri și îți e greu să rămâi pe un singur fir. Simți că începi multe, dar nu se leagă clar.",
      en: "Atenția sare între lucruri și îți e greu să rămâi pe un singur fir. Simți că începi multe, dar nu se leagă clar.",
    },
    bridge: "Se întâmplă des când sunt prea multe stimuli sau presiune.",
    promise: "Atenția se poate re-antrena. Vom face pași mici, fără efort mare.",
    antiPattern: "3 taskuri începute, 0 terminate",
    microAction: "alege 1 lucru, închide 1 pas",
    tokens: { ro: ["împrăștiat", "nu mă pot concentra", "sar", "mă pierd"] },
    tagsPrimary: ["focus_scattered"],
  },
  {
    id: "focus_hurried",
    axisId: "focus",
    domainId: "executiveControl",
    stateLabel: { ro: "Grăbită", en: "Rushed" },
    command: { ro: "Slow the body.", en: "Slow the body." },
    scienceLabel: "Presiune temporală (time pressure)",
    definition: {
      ro: "Ritmul interior e accelerat: simți că trebuie să te miști repede, iar mintea nu apucă să așeze lucrurile.",
      en: "Ritmul interior e accelerat: simți că trebuie să te miști repede, iar mintea nu apucă să așeze lucrurile.",
    },
    bridge: "Sub presiune de timp, claritatea și calmul scad natural.",
    promise: "Putem regla ritmul intern și reveni la control. Urmează o sesiune scurtă.",
    antiPattern: "viteză = erori",
    microAction: "expir lung 2 ori, apoi 1 acțiune",
    tokens: { ro: ["grăbit", "pe fugă", "nu am timp", "repede"] },
    tagsPrimary: ["pace_hurried"],
    tagsSecondary: ["tension_high"],
  },
  {
    id: "energy_tired",
    axisId: "energy",
    domainId: "functionalEnergy",
    stateLabel: { ro: "Obosită", en: "Tired" },
    command: { ro: "Energy first.", en: "Energy first." },
    scienceLabel: "Oboseală cognitivă (mental fatigue)",
    definition: {
      ro: "Simți că mintea ‘nu mai are combustibil’: scade răbdarea, scade claritatea, iar lucrurile simple par grele.",
      en: "Simți că mintea ‘nu mai are combustibil’: scade răbdarea, scade claritatea, iar lucrurile simple par grele.",
    },
    bridge: "E frecvent după perioade lungi de stres, somn slab sau suprasolicitare.",
    promise: "Energia mentală se recuperează și se gestionează. Vom lucra gradual.",
    antiPattern: "decid lucruri grele pe baterie goală",
    microAction: "alege versiunea minimă (2 minute)",
    tokens: { ro: ["obosit", "rupt", "fără energie", "epuizat"] },
    tagsPrimary: ["energy_low"],
  },
  {
    id: "energy_live_tomorrow",
    axisId: "energy",
    domainId: "functionalEnergy",
    stateLabel: { ro: "Forțez prea mult", en: "Overpushing" },
    command: { ro: "Live to play tomorrow.", en: "Live to play tomorrow." },
    scienceLabel: "Suprasolicitare (overexertion)",
    definition: {
      ro: "Te împingi peste limite ca să ‘ții pasul’, chiar când corpul și mintea cer pauză. Pe termen scurt merge, apoi costă.",
      en: "Te împingi peste limite ca să ‘ții pasul’, chiar când corpul și mintea cer pauză. Pe termen scurt merge, apoi costă.",
    },
    bridge: "Forțarea constantă duce la scădere de claritate și iritabilitate.",
    promise: "Există un mod mai eficient de ritm și recuperare. Îl construim în timp.",
    antiPattern: "încă un pas → prăbușire",
    microAction: "oprește elegant: închide bucla, notează next step",
    tokens: { ro: ["forțez", "nu mă opresc", "încă puțin", "trag de mine"] },
    tagsPrimary: ["energy_low"],
    tagsSecondary: ["pace_hurried"],
    isTopCommand: true,
  },
  {
    id: "emo_tense",
    axisId: "emotionalStability",
    domainId: "emotionRegulation",
    stateLabel: { ro: "Încordată", en: "Tense" },
    command: { ro: "Name the state.", en: "Name the state." },
    scienceLabel: "Tensiune psihofiziologică (heightened arousal)",
    definition: {
      ro: "Corpul e în alertă: mușchii sunt strânși, respirația mai scurtă, iar mintea se simte ‘pe margine’.",
      en: "Corpul e în alertă: mușchii sunt strânși, respirația mai scurtă, iar mintea se simte ‘pe margine’.",
    },
    bridge: "Când sistemul e în alertă, gândirea devine mai rigidă.",
    promise: "Putem reduce tensiunea și reveni la calm în pași mici.",
    antiPattern: "mă contopesc cu starea",
    microAction: "spune: ‘observ tensiune/frică/iritare’",
    tokens: { ro: ["încordat", "tensionat", "stres", "iritat"] },
    tagsPrimary: ["tension_high"],
  },
  {
    id: "emo_watch_mind",
    axisId: "emotionalStability",
    domainId: "emotionRegulation",
    stateLabel: { ro: "Îmi sare reacția", en: "Reactive" },
    command: { ro: "Watch the mind.", en: "Watch the mind." },
    scienceLabel: "Reactivitate (emotional reactivity)",
    definition: {
      ro: "Reacționezi mai repede decât ai vrea: iritare, defensivă sau impuls. Abia după îți dai seama că a fost prea mult.",
      en: "Reacționezi mai repede decât ai vrea: iritare, defensivă sau impuls. Abia după îți dai seama că a fost prea mult.",
    },
    bridge: "Când oboseala și stresul cresc, pragul de reacție scade.",
    promise: "Există metode de a crea o pauză între stimul și reacție. Le antrenăm.",
    antiPattern: "impuls → acțiune imediată",
    microAction: "observ 3 secunde fără să fac nimic",
    tokens: { ro: ["mă enervez", "mă aprind", "impuls", "reacționez"] },
    tagsPrimary: ["reactive"],
    isTopCommand: true,
  },
  {
    id: "emo_train_not_judge",
    axisId: "emotionalStability",
    domainId: "emotionRegulation",
    stateLabel: { ro: "Mă critic", en: "Self-judging" },
    command: { ro: "Train, not judge.", en: "Train, not judge." },
    scienceLabel: "Autocritică (self-criticism)",
    definition: {
      ro: "Mintea te judecă dur: ‘nu ești suficient’, ‘iar ai greșit’. Asta consumă energie și scade motivația.",
      en: "Mintea te judecă dur: ‘nu ești suficient’, ‘iar ai greșit’. Asta consumă energie și scade motivația.",
    },
    bridge: "Autocritica pare utilă pe moment, dar de obicei blochează.",
    promise: "Putem schimba tonul interior fără să pierzi standardele. Pas cu pas.",
    antiPattern: "critică → blocaj",
    microAction: "1 corecție concretă, 0 insulte",
    tokens: { ro: ["mă cert", "sunt prost", "n-am fost în stare", "rușine"] },
    tagsPrimary: ["self_critical"],
    isTopCommand: true,
  },
  {
    id: "recal_stop_frame",
    axisId: "recalibration",
    domainId: "metacognition",
    stateLabel: { ro: "Mă ia valul", en: "Swept away" },
    command: { ro: "Stop-frame.", en: "Stop-frame." },
    scienceLabel: "Pierderea pauzei (low impulse control / automaticity)",
    definition: {
      ro: "Intri pe pilot automat: faci, spui sau continui fără să apuci să observi. După apare ‘cum am ajuns aici?’",
      en: "Intri pe pilot automat: faci, spui sau continui fără să apuci să observi. După apare ‘cum am ajuns aici?’",
    },
    bridge: "Când mintea e încărcată, automatismul crește.",
    promise: "Putem construi o ‘pauză scurtă’ înainte de reacție. O exersăm gradual.",
    antiPattern: "acționez în primul val",
    microAction: "pauză 3 secunde + 1 întrebare",
    tokens: { ro: ["val", "m-am pierdut", "mă ia", "nu gândesc"] },
    tagsPrimary: ["reactive"],
    tagsSecondary: ["meta_observe"],
    isTopCommand: true,
    isBuffer: true,
    weight: 0.2,
  },
  {
    id: "recal_change_not_failure",
    axisId: "recalibration",
    domainId: "metacognition",
    stateLabel: { ro: "Îmi e greu să schimb", en: "Resisting change" },
    command: { ro: "Change is not failure.", en: "Change is not failure." },
    scienceLabel: "Inerție comportamentală (behavioral inertia)",
    definition: {
      ro: "Vrei să schimbi ceva, dar pare că te trage înapoi vechiul obicei. Nu e lipsă de voință, e inerție.",
      en: "Vrei să schimbi ceva, dar pare că te trage înapoi vechiul obicei. Nu e lipsă de voință, e inerție.",
    },
    bridge: "Schimbarea cere energie și claritate; când sunt jos, rezistența crește.",
    promise: "Există un mod de a face schimbarea mai ușoară, în pași mici.",
    antiPattern: "țin de plan ca să-mi apăr ego-ul",
    microAction: "spune: ‘update’, apoi schimbă 1 parametru",
    tokens: { ro: ["nu vreau să schimb", "țin cu dinții", "încă merge", "nu cedez"] },
    tagsPrimary: ["change_resistance"],
    isTopCommand: true,
  },
  {
    id: "recal_pattern",
    axisId: "recalibration",
    domainId: "metacognition",
    stateLabel: { ro: "Iar sunt așa", en: "Here we go again" },
    command: { ro: "This is a pattern.", en: "This is a pattern." },
    scienceLabel: "Buclă de auto-etichetare (self-label loop)",
    definition: {
      ro: "Observi un tipar și îl transformi într-o etichetă: ‘așa sunt eu’. Asta poate da resemnare și scade agenția.",
      en: "Observi un tipar și îl transformi într-o etichetă: ‘așa sunt eu’. Asta poate da resemnare și scade agenția.",
    },
    bridge: "Când ești obosit, mintea simplifică prin etichete.",
    promise: "Putem separa ‘ce simți acum’ de ‘cine ești’. Învățăm asta treptat.",
    antiPattern: "identitate → vină",
    microAction: "numește pattern-ul (2 cuvinte)",
    tokens: { ro: ["iar", "mereu", "din nou", "așa sunt eu"] },
    tagsPrimary: ["identity_loop"],
    tagsSecondary: ["self_critical"],
    isTopCommand: true,
  },
  {
    id: "flex_adapt_not_defend",
    axisId: "flexibility",
    domainId: "executiveControl",
    stateLabel: { ro: "Mă încăpățânez", en: "Digging in" },
    command: { ro: "Adapt, don’t defend.", en: "Adapt, don’t defend." },
    scienceLabel: "Rigiditate cognitivă (cognitive rigidity)",
    definition: {
      ro: "Mintea rămâne fixată pe un plan sau o idee, chiar când contextul s-a schimbat. Adaptarea pare greu de făcut.",
      en: "Mintea rămâne fixată pe un plan sau o idee, chiar când contextul s-a schimbat. Adaptarea pare greu de făcut.",
    },
    bridge: "Rigiditatea apare frecvent sub stres și presiune.",
    promise: "Flexibilitatea se poate antrena fără să pierzi fermitatea. Începem simplu.",
    antiPattern: "apăr strategia moartă",
    microAction: "alege: schimb / ies / simplific",
    tokens: { ro: ["încăpățânat", "nu renunț", "am dreptate", "nu schimb"] },
    tagsPrimary: ["rigid"],
    isTopCommand: true,
  },
  {
    id: "flex_abort_sunk_cost",
    axisId: "flexibility",
    domainId: "executiveControl",
    stateLabel: { ro: "Mă agăț", en: "Clinging" },
    command: { ro: "Abort sunk cost.", en: "Abort sunk cost." },
    scienceLabel: "Efectul costului irecuperabil (sunk cost)",
    definition: {
      ro: "Continui ceva doar pentru că ai investit deja timp/efort, chiar dacă nu te mai ajută. E greu să te oprești.",
      en: "Continui ceva doar pentru că ai investit deja timp/efort, chiar dacă nu te mai ajută. E greu să te oprești.",
    },
    bridge: "Creierul urăște ideea de ‘pierdere’, de aceea se agață.",
    promise: "Putem învăța să oprim la timp, fără vină. Pas cu pas.",
    antiPattern: "am investit → continui prost",
    microAction: "oprește și salvează resursele",
    tokens: { ro: ["mă agăț", "prea târziu", "am băgat mult", "nu pot opri"] },
    tagsPrimary: ["sunk_cost"],
    isTopCommand: true,
  },
  {
    id: "conf_tiny_action_now",
    axisId: "adaptiveConfidence",
    domainId: "selfDirection",
    stateLabel: { ro: "Blocat(ă)", en: "Stuck" },
    command: { ro: "Tiny action now.", en: "Tiny action now." },
    scienceLabel: "Blocaj decizional (decision freeze)",
    definition: {
      ro: "Știi că ai de făcut ceva, dar nu pornești. Pare că totul e prea mult sau prea neclar ca să alegi un pas.",
      en: "Știi că ai de făcut ceva, dar nu pornești. Pare că totul e prea mult sau prea neclar ca să alegi un pas.",
    },
    bridge: "Blocajul apare când mintea nu vede un ‘următor pas’ sigur.",
    promise: "Există tehnici de a micșora pasul până devine posibil. Le înveți treptat.",
    antiPattern: "aștept să am chef / claritate perfectă",
    microAction: "alege pas de 2 minute",
    tokens: { ro: ["blocat", "nu pot începe", "mă paralizez", "amân"] },
    tagsPrimary: ["stuck"],
    isTopCommand: true,
  },
  {
    id: "conf_finish_slice",
    axisId: "adaptiveConfidence",
    domainId: "selfDirection",
    stateLabel: { ro: "Încep multe", en: "Starting too much" },
    command: { ro: "Finish the slice.", en: "Finish the slice." },
    scienceLabel: "Inițiere fără închidere (task-switching / low completion)",
    definition: {
      ro: "Pornești mai multe lucruri, dar îți e greu să finalizezi. Pe parcurs apare oboseală, pierzi firul sau te muți la altceva.",
      en: "Pornești mai multe lucruri, dar îți e greu să finalizezi. Pe parcurs apare oboseală, pierzi firul sau te muți la altceva.",
    },
    bridge: "Când energia sau claritatea scad, creierul caută ‘nou’ ca să evite efortul.",
    promise: "Putem construi finalizarea în felii mici. O luăm pas cu pas.",
    antiPattern: "deschid bucle fără închidere",
    microAction: "închide un lucru mic complet",
    tokens: { ro: ["încep multe", "nu termin", "las pe mâine", "neterminat"] },
    tagsPrimary: ["focus_scattered"],
    tagsSecondary: ["pace_hurried"],
    isTopCommand: true,
  },
  {
    id: "buffer_space",
    axisId: "clarity",
    domainId: "decisionalClarity",
    stateLabel: { ro: "Spațiu mental", en: "Mental space" },
    command: { ro: "Respiră spațiul.", en: "Breathe space." },
    scienceLabel: "Decompresie cognitivă (cognitive decompression)",
    definition: {
      ro: "Un moment scurt în care mintea se aerisește și revine din aglomerație. Nu rezolvi, doar faci loc.",
      en: "Un moment scurt în care mintea se aerisește și revine din aglomerație. Nu rezolvi, doar faci loc.",
    },
    bridge: "Uneori primul lucru util e să reduci presiunea, nu să explici tot.",
    promise: "În următoarele sesiuni construim claritate și ritm stabil.",
    antiPattern: "strâng totul într-o singură secundă",
    microAction: "închide ochii 5 secunde, spune ce observi",
    tokens: { ro: ["spațiu", "pauză", "respir"] },
    tagsPrimary: ["meta_observe"],
    isBuffer: true,
    weight: 0.2,
  },
  {
    id: "buffer_rhythm",
    axisId: "energy",
    domainId: "functionalEnergy",
    stateLabel: { ro: "Ritm intern", en: "Inner rhythm" },
    command: { ro: "Reia ritmul tău.", en: "Claim your rhythm." },
    scienceLabel: "Reglaj de ritm (self-regulation)",
    definition: {
      ro: "Ritmul cu care te miști și gândești în interior: prea rapid, prea lent sau inconstant. Când se reglează, totul devine mai ușor.",
      en: "Ritmul cu care te miști și gândești în interior: prea rapid, prea lent sau inconstant. Când se reglează, totul devine mai ușor.",
    },
    bridge: "Ritmul intern influențează atenția, energia și reacțiile.",
    promise: "Îl putem regla în pași mici, fără presiune.",
    antiPattern: "iau ritmul altora și mă ard",
    microAction: "inspiri 4, expiri 6, notezi 1 pas lent",
    tokens: { ro: ["ritm", "calm", "încet"] },
    tagsPrimary: ["pace_hurried"],
    isBuffer: true,
    weight: 0.2,
  },
];

export const CAT_VOCABULARY: Record<string, CatVocabCard> = VOCAB_CARDS.reduce(
  (acc, card) => {
    acc[card.id] = card;
    return acc;
  },
  {} as Record<string, CatVocabCard>,
);

export function getVocabByAxis(axisId: CatAxisId): CatVocabCard[] {
  return VOCAB_CARDS.filter((card) => card.axisId === axisId);
}

export function getDefaultVocabForAxis(axisId: CatAxisId): CatVocabCard {
  const cards = getVocabByAxis(axisId);
  if (cards.length > 0) return cards[0];
  return CAT_VOCABULARY.clarity_fog;
}

function hashDayKey(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickWordOfDay({
  axisId,
  unlockedIds = [],
  dayKey,
}: {
  axisId: CatAxisId | null | undefined;
  unlockedIds?: string[];
  dayKey: string;
}): CatVocabCard {
  const targetAxis = axisId ?? "clarity";
  const axisCards = getVocabByAxis(targetAxis);
  const available = axisCards.filter((card) => unlockedIds.includes(card.id));
  const pool = available.length ? available : axisCards.length ? axisCards : [CAT_VOCABULARY.clarity_fog];
  if (pool.length === 1) return pool[0];
  const index = hashDayKey(`${dayKey}:${targetAxis}:${unlockedIds.sort().join("-")}`) % pool.length;
  return pool[index];
}
