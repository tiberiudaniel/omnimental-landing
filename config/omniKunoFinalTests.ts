import type { OmniKunoModuleId } from "./omniKunoModules";

export type OmniKunoFinalTestQuestion =
  | {
      id?: string;
      type: "singleChoice" | "scenario";
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }
  | {
      id?: string;
      type: "fillBlank";
      question: string;
      answer: string;
      variations?: string[];
    }
  | {
      id?: string;
      type: "reflectionShort";
      question: string;
      prompt: string;
    };

export type OmniKunoFinalTest = {
  testId: string;
  moduleId: OmniKunoModuleId;
  intro: { title: string; body: string };
  questions: OmniKunoFinalTestQuestion[];
  completion?: {
    title: string;
    body: string;
    suggestions?: string[];
    badge?: string;
  };
};

export const OMNI_KUNO_FINAL_TESTS: Record<string, OmniKunoFinalTest> = {
  emotional_balance_final_test: {
    testId: "emotional_balance_final_test",
    moduleId: "emotional_balance",
    intro: {
      title: "Mini-Test — Echilibru Emoțional",
      body: "Un test scurt pentru a verifica ce ai învățat. Nu există note — doar claritate.",
    },
    questions: [
      {
        id: "calm_final_q1",
        type: "singleChoice",
        question: "Ce ai exersat de fapt în acest modul?",
        options: [
          "Să elimini emoțiile.",
          "Să tolerezi emoțiile și să alegi un răspuns mai potrivit.",
          "Să eviți situațiile dificile.",
        ],
        correctIndex: 1,
        explanation: "Echilibrul emoțional înseamnă să poți sta cu emoția și să alegi răspunsul potrivit, nu să o elimini.",
      },
      {
        id: "calm_final_q2",
        type: "singleChoice",
        question: "Care este primul pas util când tonul cuiva te activează?",
        options: [
          "Răspunzi imediat.",
          "Separi tonul de mesaj.",
          "Pleci fără să spui nimic.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q3",
        type: "scenario",
        question: "Într-o ședință, cineva te critică brusc și ridică vocea. Simți impulsul să răspunzi imediat. Ce alegi?",
        options: [
          "Să reacționezi pe loc, ridicând vocea peste cealaltă persoană.",
          "Să ieși din sală ca să eviți emoția.",
          "Să observi impulsul, să respiri lent, să simți corpul și abia apoi să răspunzi.",
        ],
        correctIndex: 2,
        explanation: "Protocolul CALM (observ, respir, simt corpul, aleg răspunsul) îți păstrează claritatea.",
      },
      {
        id: "calm_final_q4",
        type: "fillBlank",
        question: "Completează propoziția: „O micro-decizie este ___.”",
        answer: "o alegere mică înainte de impuls",
        variations: [
          "o mică alegere înainte de impuls",
          "o pauză scurtă înainte să acționez",
        ],
      },
      {
        id: "calm_final_q5",
        type: "singleChoice",
        question: "Ce te ajută într-un moment cu presiune mare?",
        options: [
          "Să accelerezi ca să termini mai repede.",
          "Să încetinești primul gest.",
          "Să ignori corpul.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q6",
        type: "singleChoice",
        question: "Ce este „puterea blândă”?",
        options: [
          "Forță rigidă.",
          "Claritate și calm în același timp.",
          "Eliminarea emoțiilor.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q7",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "Un lucru pe care vreau să-l aplic mai des este ___",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Echilibru Emoțional.",
      body: "Dacă simți că unele concepte nu sunt încă clare, revino rapid la lecțiile despre calmul activ, protocolul mini sau revenirea la echilibru ori de câte ori apare o zi agitată.",
      suggestions: [
        "Relansează exercițiile despre micro-decizii atunci când impulsurile devin puternice.",
        "Aplică protocolul CALM în următoarele conversații reale din această săptămână.",
      ],
      badge: "Badge · Ai o bază solidă de tehnici pentru reglare emoțională. Următorul pas: modul Energie Activă.",
    },
  },
  focus_clarity_final_test: {
    testId: "focus_clarity_final_test",
    moduleId: "focus_clarity",
    intro: {
      title: "Mini-Test — Claritate și Focus",
      body: "Un test scurt pentru a vedea ce ai integrat despre atenție, priorități și zgomot mental. Nu este un examen. Este un feedback pentru tine.",
    },
    questions: [
      {
        id: "focus_final_q1",
        type: "singleChoice",
        question: "Ce descrie cel mai bine claritatea în acest modul?",
        options: [
          "Să faci cât mai multe lucruri în același timp.",
          "Să știi ce este important acum și să alegi un singur pas clar.",
          "Să nu mai ai niciodată gânduri sau griji.",
        ],
        correctIndex: 1,
      },
      {
        id: "focus_final_q2",
        type: "singleChoice",
        question: "Ce te ajută cel mai mult să îți adâncești atenția într-un moment aglomerat?",
        options: [
          "Să verifici toate notificările înainte de a continua.",
          "Să alegi un singur lucru pentru câteva minute și să reduci viteza.",
          "Să începi toate sarcinile în paralel.",
        ],
        correctIndex: 1,
      },
      {
        id: "focus_final_q3",
        type: "scenario",
        question: "Ai cinci lucruri de făcut și te simți copleșit. Ce acțiune e aliniată cu modulul Claritate și Focus?",
        options: [
          "Să alegi un singur lucru ca prioritate și să aplici protocolul (mă opresc, aleg, respir, pas mic).",
          "Să te apuci de toate puțin, fără să clarifici.",
          "Să amâni totul și să ignori situația.",
        ],
        correctIndex: 0,
      },
      {
        id: "focus_final_q4",
        type: "fillBlank",
        question: "Completează: „O prioritate este ___.”",
        answer: "un lucru ales conștient înaintea celorlalte",
        variations: [
          "un lucru ales constient inaintea celorlalte",
          "un lucru ales constient",
          "ceva ales constient ca fiind primul",
        ],
      },
      {
        id: "focus_final_q5",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "Un lucru concret pe care vreau să îl fac în următoarele 24 de ore pentru mai multă claritate este ___",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Claritate și Focus.",
      body: "Dacă simți că zgomotul mental revine, repetă mini-protocolul de focus și planul simplu acum–după–mai târziu.",
      suggestions: [
        "Folosește protocolul FOCUS (mă opresc, aleg un singur punct, respir, fac un pas mic) de câteva ori pe zi.",
        "Reia resetul zilnic de 3 întrebări la finalul zilei pentru a păstra claritatea.",
      ],
      badge: "Badge · Ai un protocol simplu pentru a-ți recăpăta claritatea în zilele aglomerate.",
    },
  },
  relationships_communication_final_test: {
    testId: "relationships_communication_final_test",
    moduleId: "relationships_communication",
    intro: {
      title: "Mini-Test — Relații și Comunicare",
      body: "Un test scurt pentru a verifica ce ai fixat despre ascultare, limitare calmă și reparații rapide.",
    },
    questions: [
      {
        id: "relationships_comm_q1",
        type: "singleChoice",
        question: "Ce este primul pas într-o discuție tensionată?",
        options: [
          "Să-ți construiești apărarea pe loc.",
          "Să respiri și să observi ce reacție apare în tine.",
          "Să dovedești că ai dreptate, chiar dacă tonul crește.",
        ],
        correctIndex: 1,
      },
      {
        id: "relationships_comm_q2",
        type: "scenario",
        question: "Partenerul ridică tonul și îți spune că îl ignori. Ce răspuns e aliniat cu modulul Relații & Comunicare?",
        options: [
          "Răspunzi cu același ton și îi amintești toate greșelile lui.",
          "Spui că exagerează și te retragi din conversație.",
          "Respiri, reflectezi ce ai auzit („Sună ca și cum te simți ignorat.”) și propui o limită clară.",
        ],
        correctIndex: 2,
      },
      {
        id: "relationships_comm_q3",
        type: "fillBlank",
        question: "Completează: „Când pun o limită, spun ce ___ și ce ___.”",
        answer: "accept și ce nu accept",
        variations: ["accept si ce nu accept", "accept și ce nu mai pot accepta"],
      },
      {
        id: "relationships_comm_q4",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "„Un lucru pe care îl pot spune data viitoare când tensiunea crește este ___.”",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Relații și Comunicare.",
      body: "Continuă să practici protocolul de comunicare calmă și să folosești limitele clare când simți impulsul să te închizi sau să ataci.",
      suggestions: [
        "Alege o discuție reală în care să practici ascultarea activă (reflect & label).",
        "Planifică o limită spusă calm în următoarea situație care te consumă.",
      ],
      badge: "Badge · Comunici cu mai multă claritate și grijă. Următorul pas: modulele despre energie și recuperare.",
    },
  },
  energy_body_final_test: {
    testId: "energy_body_final_test",
    moduleId: "energy_body",
    intro: {
      title: "Mini-Test — Energie & Corp",
      body: "Un test scurt care verifică ce ai integrat despre semnalele corpului, respirație, ritm, somn și reparația după stres.",
    },
    questions: [
      {
        id: "energy_body_q1",
        type: "singleChoice",
        question: "Cum este cel mai sănătos să privești semnalele corpului?",
        options: [
          "Ca pe defecte pe care trebuie să le ignori.",
          "Ca pe mesaje despre nevoile tale de ritm și energie.",
          "Ca pe dovezi că nu ești suficient de puternic.",
        ],
        correctIndex: 1,
      },
      {
        id: "energy_body_q2",
        type: "scenario",
        question:
          "După multe ore de lucru intens te simți gol de energie și apar greșeli dese. Ce acțiune este aliniată cu modulul?",
        options: [
          "Continui în același ritm, fără pauză.",
          "Folosești protocolul de resetare: observi, respiri, faci o pauză scurtă și ajustezi ritmul.",
          "Ignori starea ta și crești intensitatea.",
        ],
        correctIndex: 1,
      },
      {
        id: "energy_body_q3",
        type: "singleChoice",
        question: "Ce susține cel mai bine un somn mai bun?",
        options: [
          "Să adormi mereu cu ecranul în față.",
          "Un ritual simplu și repetat care îți liniștește mintea și corpul.",
          "Să schimbi ora de culcare în fiecare seară după cum se nimerește.",
        ],
        correctIndex: 1,
      },
      {
        id: "energy_body_q4",
        type: "fillBlank",
        question: "Completează: „După perioade de stres intens, corpul are nevoie de ___.”",
        answer: "perioade de revenire și gesturi mici de reparare",
        variations: [
          "perioade de revenire si gesturi mici de reparare",
          "timp de revenire si gesturi mici de reparare",
          "timp de revenire",
        ],
      },
      {
        id: "energy_body_q5",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "„Un lucru concret pe care îl fac în următoarele 24h pentru a-mi proteja energia este ___.”",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Energie & Corp.",
      body: "Continuă să folosești protocolul scurt de resetare și să protejezi somnul, respirația și mișcarea atunci când zilele devin solicitante.",
      suggestions: [
        "Planifică un micro-ritual de seară care să liniștească sistemul nervos înainte de somn.",
        "Pentru următoarele 3 zile, notează principalele semnale de oboseală și cum răspunzi la ele.",
      ],
      badge: "Badge · Îți cunoști ritmul și limitele. Următorul pas: folosește energia obținută în modulele de performanță.",
    },
  },
  self_trust_final_test: {
    testId: "self_trust_final_test",
    moduleId: "self_trust",
    intro: {
      title: "Mini-Test — Încredere în Sine",
      body: "Acest test scurt verifică ce ai integrat despre promisiuni realiste, voce interioară, limite și reparații rapide.",
    },
    questions: [
      {
        id: "self_trust_q1",
        type: "singleChoice",
        question: "Ce descrie cel mai bine încrederea în sine?",
        options: [
          "Să nu greșești niciodată.",
          "Să te poți baza pe tine că vei duce la capăt promisiunile realiste.",
          "Să pari mereu sigur(ă) pe tine în fața altora.",
        ],
        correctIndex: 1,
      },
      {
        id: "self_trust_q2",
        type: "scenario",
        question:
          "Ți-ai promis că lucrezi 30 de minute la un proiect personal și nu ai făcut nimic azi. Ce este aliniat cu modulul?",
        options: [
          "Te insulți în minte și decizi că „nu are rost”.",
          "Spui: „Nu am reușit azi, reduc promisiunea la 10 minute mâine și o trec în calendar.”",
          "Ignori complet situația.",
        ],
        correctIndex: 1,
      },
      {
        id: "self_trust_q3",
        type: "singleChoice",
        question: "Ce ajută cel mai mult reconstruirea încrederii în tine după multe promisiuni încălcate?",
        options: [
          "Să îți propui din nou un plan enorm.",
          "Să alegi promisiuni mult mai mici și să le respecți consecvent.",
          "Să renunți complet la orice plan.",
        ],
        correctIndex: 1,
      },
      {
        id: "self_trust_q4",
        type: "fillBlank",
        question: "Completează: „Încrederea în sine crește atunci când promisiunile mele devin mai ___ și mai ___.”",
        answer: "realiste și respectate",
        variations: ["realiste si respectate", "realiste si mai des respectate"],
      },
      {
        id: "self_trust_q5",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "„Un singur lucru concret pe care vreau să îl fac în următoarele 24 de ore pentru a-mi întări încrederea în mine este ___.”",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Încredere în Sine.",
      body: "Dacă simți că promisiunile devin din nou haotice, revino la protocolul realist și la reparațiile rapide fără dramă.",
      suggestions: [
        "Folosește protocolul de promisiune realistă în fiecare dimineață timp de 3 zile.",
        "Seara, notează 2 lucruri respectate pentru a ancora încrederea în tine.",
      ],
      badge: "Badge · Ți-ai consolidat încrederea prin promisiuni realiste. Următorul pas: modulul despre decizii și execuție.",
    },
  },
  decision_discernment_final_test: {
    testId: "decision_discernment_final_test",
    moduleId: "decision_discernment",
    intro: {
      title: "Mini-Test — Discernământ & Decizii",
      body: "Un test scurt despre diferența dintre impuls și decizie, criterii, risc, valori și ritualurile tale de decizie.",
    },
    questions: [
      {
        id: "decision_discernment_q1",
        type: "singleChoice",
        question: "Ce este cel mai aproape de o decizie bună, în sensul acestui modul?",
        options: [
          "O decizie fără nicio emoție.",
          "O decizie luată cu o pauză scurtă, în acord cu valorile tale și riscurile înțelese.",
          "O decizie luată doar ca să scapi de disconfort.",
        ],
        correctIndex: 1,
      },
      {
        id: "decision_discernment_q2",
        type: "scenario",
        question:
          "Ai o decizie importantă și te simți blocat de frica de a greși. Ce este aliniat cu modulul Discernământ & Decizii?",
        options: [
          "Amâni la nesfârșit până dispare orice urmă de frică.",
          "Numești riscul principal, alegi criteriul relevant și iei o decizie suficient de bună pentru pasul următor.",
          "Alegi complet la întâmplare ca să se termine.",
        ],
        correctIndex: 1,
      },
      {
        id: "decision_discernment_q3",
        type: "singleChoice",
        question: "Ce ajută cel mai mult când clarifici o decizie?",
        options: [
          "Să cauți perfecțiunea și siguranța totală.",
          "Să alegi un criteriu principal și să accepți o parte de incertitudine.",
          "Să te bazezi doar pe ce spun ceilalți.",
        ],
        correctIndex: 1,
      },
      {
        id: "decision_discernment_q4",
        type: "fillBlank",
        question: "Completează: „Multe decizii pot fi transformate în ___ pe termen scurt, nu în verdicte pentru totdeauna.”",
        answer: "experimente",
        variations: ["mici experimente", "experimente pe termen scurt"],
      },
      {
        id: "decision_discernment_q5",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "„Un lucru concret pe care vreau să îl schimb în felul în care iau decizii, începând de azi, este ___.”",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Discernământ & Decizii.",
      body: "Continuă să folosești protocolul de decizie calmă, criteriile clare și experimentele scurte ca să nu rămâi blocat.",
      suggestions: [
        "Aplică protocolul de decizie calmă la următoarea alegere importantă și notează ce ai învățat.",
        "Transformă o decizie grea într-un experiment de 7 zile și revizuiește rezultatul.",
      ],
      badge: "Badge · Ieși din blocaj și alegi în acord cu tine. Următorul pas: folosește aceste decizii în modulele de execuție.",
    },
  },
  willpower_perseverance_final_test: {
    testId: "willpower_perseverance_final_test",
    moduleId: "willpower_perseverance",
    intro: {
      title: "Mini-Test — Voință & Perseverență",
      body: "Acest test scurt verifică ce ai integrat despre voință ca resursă finită, pași mici, priorități și ritualuri de consistență.",
    },
    questions: [
      {
        id: "willpower_final_q1",
        type: "singleChoice",
        question: "Ce descrie corect voința?",
        options: [
          "Este o energie finită care trebuie protejată.",
          "Este infinită și ține doar de motivație.",
        ],
        correctIndex: 0,
      },
      {
        id: "willpower_final_q2",
        type: "scenario",
        question:
          "Încerci să începi 4 obiceiuri noi în aceeași săptămână și deja ai obosit. Ce alegi conform modulului?",
        options: [
          "Continui așa, este doar o chestiune de disciplină.",
          "Alegi un singur obicei principal și reduci restul pentru a păstra energie.",
          "Renunți complet la orice obicei.",
        ],
        correctIndex: 1,
      },
      {
        id: "willpower_final_q3",
        type: "singleChoice",
        question: "Ce start este mai sigur pe termen lung?",
        options: [
          "Un start intens și mare.",
          "Un start mic și repetabil.",
        ],
        correctIndex: 1,
      },
      {
        id: "willpower_final_q4",
        type: "fillBlank",
        question: "Completează: „În zilele grele, continuitatea este păstrată prin ___.”",
        answer: "minimum acceptabil",
        variations: ["minimul acceptabil", "nivelul minim acceptabil"],
      },
      {
        id: "willpower_final_q5",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "„Un lucru concret pe care îl voi aplica în următoarele 7 zile este ___.”",
      },
    ],
    completion: {
      title: "Ai finalizat modulul Voință & Perseverență.",
      body: "Continuă să revii la pașii mici, la minimul acceptabil și la ritualul de protecție a energiei ori de câte ori simți oboseală mentală.",
      suggestions: [
        "Aplică protocolul de protecție a voinței pentru următoarele 7 zile pe un singur obiectiv.",
        "Notează zilnic minimul acceptabil și revizuiește-l la final de săptămână.",
      ],
      badge: "Badge · Îți protejezi voința și perseverezi cu pași mici. Următorul pas: combină acest modul cu ritmurile de Energie & Corp.",
    },
  },

};
