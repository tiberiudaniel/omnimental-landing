export type OmniKunoScreenKind = "content" | "checkpoint" | "quiz" | "reflection";

export type OmniKunoLessonScreen =
  | {
      id?: string;
      kind: "content";
      title: string;
      body: string;
      bullets?: string[];
    }
  | {
      id?: string;
      kind: "checkpoint";
      title: string;
      steps: string[];
      helper?: string;
    }
  | {
      id?: string;
      kind: "quiz";
      title: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | {
      id?: string;
      kind: "reflection";
      title: string;
      prompt: string;
    };

export type OmniKunoLessonContent = {
  lessonId: string;
  screens: OmniKunoLessonScreen[];
};

export const OMNI_KUNO_LESSON_CONTENT: Record<string, OmniKunoLessonContent> = {
  "calm_l1_01_foundations": {
    "lessonId": "calm_l1_01_foundations",
    "screens": [
      {
        "kind": "content",
        "title": "Calmul activ",
        "body": "Calmul activ apare când nu grăbești nimic și nu împingi nimic. Doar observi ce trăiești, fără să te pierzi în reacție. Nu este pasivitate. Este claritate.",
        "id": "calm_l1_01_foundations-screen-1"
      },
      {
        "kind": "quiz",
        "title": "Tensiunea este un mesaj?",
        "question": "Ești de acord că recunoașterea tensiunii îți oferă un spațiu mic între impuls și acțiune?",
        "options": [
          "Da, o recunosc și respir înainte să acționez.",
          "Nu, trebuie să o elimin imediat ca să pot continua."
        ],
        "correctIndex": 0,
        "explanation": "Observarea tensiunii te ajută să alegi răspunsul conștient, nu impulsul.",
        "id": "calm_l1_01_foundations-screen-2"
      },
      {
        "kind": "content",
        "title": "Reține",
        "body": "Când tensiunea apare în corp, nu trebuie eliminată pe loc. Recunoașterea ei îți oferă acel spațiu dintre impuls și acțiune.",
        "id": "calm_l1_01_foundations-screen-3"
      },
      {
        "kind": "checkpoint",
        "title": "Unde sunt acum?",
        "steps": [
          "Gândește-te la un moment recent în care ai simțit tensiune.",
          "Observă-l fără să îl judeci."
        ],
        "helper": "Observarea este primul pas al calmului activ.",
        "id": "calm_l1_01_foundations-screen-4"
      },
      {
        "kind": "quiz",
        "title": "Ce este calmul activ?",
        "question": "Care idee descrie cel mai bine calmul activ?",
        "options": [
          "Absența emoțiilor.",
          "Claritatea din mijlocul emoțiilor.",
          "Evitarea situațiilor dificile."
        ],
        "correctIndex": 1,
        "explanation": "Calmul activ nu înseamnă să nu simți, ci să rămâi prezent.",
        "id": "calm_l1_01_foundations-screen-5"
      },
      {
        "kind": "reflection",
        "title": "O propoziție simplă",
        "prompt": "Completează: „Calmul activ pentru mine înseamnă ___.”",
        "id": "calm_l1_01_foundations-screen-6"
      }
    ]
  },
  "calm_l1_02_triggers": {
    "lessonId": "calm_l1_02_triggers",
    "screens": [
      {
        "kind": "content",
        "title": "Ce pornește reacția",
        "body": "Uneori, nu situația în sine e problema, ci modul în care corpul reacționează la ea. Observarea declanșatorilor îți face reacțiile mai previzibile.",
        "id": "calm_l1_02_triggers-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei semnale",
        "body": "Un ton ridicat, un mesaj scurt sau o privire pot aprinde reacții vechi. Nu e vina ta. Este doar un tipar.",
        "id": "calm_l1_02_triggers-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Declanșatorul meu",
        "steps": [
          "Adu-ți aminte un moment în care te-ai activat rapid.",
          "Ce anume a declanșat reacția?"
        ],
        "helper": "Identificarea declanșatorului reduce intensitatea viitoare.",
        "id": "calm_l1_02_triggers-screen-3"
      },
      {
        "kind": "quiz",
        "title": "De ce contează declanșatorii?",
        "question": "Ce beneficiu ai când îți cunoști declanșatorii?",
        "options": [
          "Poți evita tot ce te deranjează.",
          "Poți recunoaște momentul în care începe reacția.",
          "Poți controla oamenii din jur."
        ],
        "correctIndex": 1,
        "explanation": "Claritatea asupra declanșatorilor îți dă timp să alegi.",
        "id": "calm_l1_02_triggers-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O observare blândă",
        "prompt": "Completează: „Un declanșator frecvent pentru mine este ___.”",
        "id": "calm_l1_02_triggers-screen-5"
      }
    ]
  },
  "calm_l1_03_body_scan": {
    "lessonId": "calm_l1_03_body_scan",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul vede primul",
        "body": "Emoțiile apar mai întâi în corp, nu în gânduri. Un maxilar strâns sau umeri ridicați sunt semne timpurii ale tensiunii.",
        "id": "calm_l1_03_body_scan-screen-1"
      },
      {
        "kind": "content",
        "title": "20 de secunde",
        "body": "Observă pe rând maxilarul, umerii și respirația. Nu încerca să schimbi nimic. Doar vezi ce este acolo.",
        "id": "calm_l1_03_body_scan-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mică scanare",
        "steps": [
          "Cum îți simți maxilarul?",
          "Cum îți simți umerii?",
          "Cum este respirația?"
        ],
        "helper": "Observarea corpului reduce impulsivitatea.",
        "id": "calm_l1_03_body_scan-screen-3"
      },
      {
        "kind": "quiz",
        "title": "De ce ajută scanarea corpului?",
        "question": "Ce aduce scanarea corpului?",
        "options": [
          "Elimină emoțiile.",
          "Face vizibilă tensiunea, astfel încât să poți acționa conștient.",
          "Te obligă să fii calm."
        ],
        "correctIndex": 1,
        "explanation": "Ce devine vizibil devine și gestionabil.",
        "id": "calm_l1_03_body_scan-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O notă scurtă",
        "prompt": "Completează: „Astăzi, corpul meu se simte ___.”",
        "id": "calm_l1_03_body_scan-screen-5"
      }
    ]
  },
  "calm_l1_04_micro_choices": {
    "lessonId": "calm_l1_04_micro_choices",
    "screens": [
      {
        "kind": "content",
        "title": "Spațiul dintre impuls și acțiune",
        "body": "Între ceea ce simți și ceea ce faci există un spațiu mic. În el se află alegerile tale.",
        "id": "calm_l1_04_micro_choices-screen-1"
      },
      {
        "kind": "content",
        "title": "Micro-decizii",
        "body": "O micro-decizie este o mică alegere: respiri înainte să răspunzi, lași telefonul jos, privești o secundă în jos înainte de a continua.",
        "id": "calm_l1_04_micro_choices-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "O decizie mică",
        "steps": [
          "Adu-ți aminte un moment în care ai reacționat rapid.",
          "Imaginează-ți că introduci o pauză de o respirație."
        ],
        "helper": "O pauză mică schimbă direcția.",
        "id": "calm_l1_04_micro_choices-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce este o micro-decizie?",
        "question": "Cum descrii cel mai bine o micro-decizie?",
        "options": [
          "O schimbare mare.",
          "O alegere mică înainte de impuls.",
          "Evitarea situației."
        ],
        "correctIndex": 1,
        "explanation": "O micro-decizie îți oferă timp și claritate.",
        "id": "calm_l1_04_micro_choices-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere pentru azi",
        "prompt": "Completează: „Azi vreau să introduc o pauză înainte de ___.”",
        "id": "calm_l1_04_micro_choices-screen-5"
      }
    ]
  },
  "calm_l1_05_breath_basics": {
    "lessonId": "calm_l1_05_breath_basics",
    "screens": [
      {
        "kind": "content",
        "title": "Respirația te sprijină",
        "body": "Respirația lentă trimite semnal de siguranță sistemului tău nervos. Nu ai nevoie de tehnici complicate.",
        "id": "calm_l1_05_breath_basics-screen-1"
      },
      {
        "kind": "content",
        "title": "Ritm simplu",
        "body": "Inspiră pe 4 timp, expiră puțin mai lung. Este suficient ca tensiunea să înceapă să scadă.",
        "id": "calm_l1_05_breath_basics-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "3 cicluri",
        "steps": [
          "Inspir 4 timp.",
          "Expir 5–6 timp.",
          "Repet de trei ori."
        ],
        "helper": "Lent nu înseamnă forțat.",
        "id": "calm_l1_05_breath_basics-screen-3"
      },
      {
        "kind": "quiz",
        "title": "De ce expirul contează?",
        "question": "Ce rol are expirul mai lung?",
        "options": [
          "Creează presiune.",
          "Trimite semnal de calm corpului.",
          "Grăbește ritmul."
        ],
        "correctIndex": 1,
        "explanation": "Expărul lung activează liniștirea fiziologică.",
        "id": "calm_l1_05_breath_basics-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Intenție scurtă",
        "prompt": "Completează: „Voi folosi respirația lentă când simt ___.”",
        "id": "calm_l1_05_breath_basics-screen-5"
      }
    ]
  },
  "calm_l1_06_pause_button": {
    "lessonId": "calm_l1_06_pause_button",
    "screens": [
      {
        "kind": "content",
        "title": "Puterea pauzei",
        "body": "Nu trebuie să răspunzi imediat. O pauză nu este slăbiciune. Este claritate.",
        "id": "calm_l1_06_pause_button-screen-1"
      },
      {
        "kind": "content",
        "title": "Pauză declarată",
        "body": "Poți spune simplu: „Revin în câteva minute.” Așa îți protejezi răspunsul, nu te retragi.",
        "id": "calm_l1_06_pause_button-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Pauză mentală",
        "steps": [
          "Alege o situație în care ai răspuns prea repede.",
          "Imaginează o pauză scurtă acolo."
        ],
        "helper": "Pauza schimbă tonul.",
        "id": "calm_l1_06_pause_button-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce este o pauză sănătoasă?",
        "question": "Cum arată o pauză sănătoasă?",
        "options": [
          "Ignori complet discuția.",
          "Spui că revii după ce respiri.",
          "Pleci fără să spui nimic."
        ],
        "correctIndex": 1,
        "explanation": "Pauza sănătoasă include intenția de a reveni.",
        "id": "calm_l1_06_pause_button-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție utilă",
        "prompt": "Completează: „Când am nevoie de pauză, pot spune: ___.”",
        "id": "calm_l1_06_pause_button-screen-5"
      }
    ]
  },
  "calm_l1_07_boundaries": {
    "lessonId": "calm_l1_07_boundaries",
    "screens": [
      {
        "kind": "content",
        "title": "Limite blânde",
        "body": "Limitele nu sunt ziduri. Sunt spații sănătoase în care poți respira. Ele apar atunci când spui ce este potrivit pentru tine, fără agresivitate, fără grabă.",
        "id": "calm_l1_07_boundaries-screen-1"
      },
      {
        "kind": "content",
        "title": "Un „nu” calm",
        "body": "Un „nu” spus liniștit nu rupe relațiile. Le clarifică. Îți protejează timpul, atenția și energia.",
        "id": "calm_l1_07_boundaries-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare simplă",
        "steps": [
          "Alege o situație în care ai spus „da”, dar simțeai „nu”.",
          "Observă ce emoție era acolo."
        ],
        "helper": "Limitele bune protejează, nu atacă.",
        "id": "calm_l1_07_boundaries-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Rolul limitelor",
        "question": "Care este rolul principal al limitelor sănătoase?",
        "options": [
          "Să îi îndepărtezi pe oameni.",
          "Să îți protejezi energia și claritatea.",
          "Să câștigi controlul într-o discuție."
        ],
        "correctIndex": 1,
        "explanation": "Limitele calme susțin echilibrul tău interior.",
        "id": "calm_l1_07_boundaries-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O limită mică",
        "prompt": "Completează: „O limită pe care vreau să o respect mai des este ___.”",
        "id": "calm_l1_07_boundaries-screen-5"
      }
    ]
  },
  "calm_l1_08_self_talk": {
    "lessonId": "calm_l1_08_self_talk",
    "screens": [
      {
        "kind": "content",
        "title": "Vocea din interior",
        "body": "Ce îți spui în minte influențează direct cum te simți. Un ton critic ridică tensiunea. Un ton blând o reduce.",
        "id": "calm_l1_08_self_talk-screen-1"
      },
      {
        "kind": "content",
        "title": "Din critic în ghid",
        "body": "Nu trebuie să elimini vocea critică. Doar să o transformi. În loc de „nu pot”, poți spune „încă învăț”.",
        "id": "calm_l1_08_self_talk-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă tonul",
        "steps": [
          "Adu în minte o frază dură pe care ți-o spui des.",
          "Reformuleaz-o într-o propoziție mai blândă."
        ],
        "helper": "Nu minți și nu exagera. Doar scoate duritatea.",
        "id": "calm_l1_08_self_talk-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Care este un dialog interior sănătos?",
        "question": "Care propoziție este mai utilă?",
        "options": [
          "„Sunt un dezastru.”",
          "„Învăț și pot îmbunătăți lucrurile pas cu pas.”",
          "„Nu are rost să încerc.”"
        ],
        "correctIndex": 1,
        "explanation": "Un dialog interior blând te ajută să continui, nu să te blochezi.",
        "id": "calm_l1_08_self_talk-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază de sprijin",
        "prompt": "Completează: „Fraza pe care vreau să o folosesc mai des este: ___.”",
        "id": "calm_l1_08_self_talk-screen-5"
      }
    ]
  },
  "calm_l2_09_voice_tone": {
    "lessonId": "calm_l2_09_voice_tone",
    "screens": [
      {
        "kind": "content",
        "title": "Tonul schimbă totul",
        "body": "Nu doar cuvintele, ci și tonul influențează cum te simți. Uneori reacționezi la ton, nu la mesaj.",
        "id": "calm_l2_09_voice_tone-screen-1"
      },
      {
        "kind": "content",
        "title": "Separă cele două",
        "body": "Dacă separi tonul de conținut, devine mai ușor să înțelegi ce ți se transmite. Claritatea vine în pași mici.",
        "id": "calm_l2_09_voice_tone-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă diferența",
        "steps": [
          "Amintește-ți o discuție tensionată.",
          "Separă tonul de mesajul real."
        ],
        "helper": "Claritatea nu vine din grabă.",
        "id": "calm_l2_09_voice_tone-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ton vs mesaj",
        "question": "Ce poți face când tonul este intens?",
        "options": [
          "Răspunzi imediat.",
          "Separi tonul de conținut.",
          "Te retragi complet."
        ],
        "correctIndex": 1,
        "explanation": "Separarea reduce tensiunea și crește înțelegerea.",
        "id": "calm_l2_09_voice_tone-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Reformulare calmă",
        "prompt": "Completează: „În discuții dificile vreau să-mi reamintesc să ___.”",
        "id": "calm_l2_09_voice_tone-screen-5"
      }
    ]
  },
  "calm_l2_10_criticism": {
    "lessonId": "calm_l2_10_criticism",
    "screens": [
      {
        "kind": "content",
        "title": "Critica te activează",
        "body": "Critica atinge zone sensibile. E normal să te activezi. Reacția nu este o greșeală.",
        "id": "calm_l2_10_criticism-screen-1"
      },
      {
        "kind": "content",
        "title": "Un pas în lateral",
        "body": "Poți să faci un pas mental în lateral. Îți dă spațiu între emoție și răspuns.",
        "id": "calm_l2_10_criticism-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Doar un pas",
        "steps": [
          "Alege o critică recentă.",
          "Observă cum ai reacționat atunci."
        ],
        "helper": "Spațiul interior reduce intensitatea.",
        "id": "calm_l2_10_criticism-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Primul pas în critică",
        "question": "Ce te ajută când primești critică?",
        "options": [
          "Să răspunzi repede.",
          "Un pas mental în lateral.",
          "Să dovedești că ai dreptate."
        ],
        "correctIndex": 1,
        "explanation": "Pasul mental calmează sistemul.",
        "id": "calm_l2_10_criticism-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un gând util",
        "prompt": "Completează: „Când primesc critică, vreau să-mi amintesc că ___.”",
        "id": "calm_l2_10_criticism-screen-5"
      }
    ]
  },
  "calm_l2_11_conflict_opening": {
    "lessonId": "calm_l2_11_conflict_opening",
    "screens": [
      {
        "kind": "content",
        "title": "Începuturile unui conflict",
        "body": "Cele mai tensionate momente sunt primele secunde. Ele decid ritmul discuției.",
        "id": "calm_l2_11_conflict_opening-screen-1"
      },
      {
        "kind": "content",
        "title": "Rămâi în corp",
        "body": "Începutul unui conflict devine gestionabil dacă rămâi conectat la corp: respirație lentă, umeri jos, privire stabilă.",
        "id": "calm_l2_11_conflict_opening-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Primul moment",
        "steps": [
          "Adu în minte un conflict.",
          "Observă care a fost primul impuls."
        ],
        "helper": "Impulsul nu este finalul.",
        "id": "calm_l2_11_conflict_opening-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce te ajută în conflicte?",
        "question": "Care este primul pas util?",
        "options": [
          "Te concentrezi pe a câștiga.",
          "Revii la corp și respiri.",
          "Ridici vocea."
        ],
        "correctIndex": 1,
        "explanation": "Corpul calmează mintea.",
        "id": "calm_l2_11_conflict_opening-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O decizie mică",
        "prompt": "Completează: „În conflicte, vreau să încep cu ___.”",
        "id": "calm_l2_11_conflict_opening-screen-5"
      }
    ]
  },
  "calm_l2_12_focus_under_stress": {
    "lessonId": "calm_l2_12_focus_under_stress",
    "screens": [
      {
        "kind": "content",
        "title": "Când stresul crește",
        "body": "Sub stres, atenția se îngustează. Vezi mai puține soluții. E normal.",
        "id": "calm_l2_12_focus_under_stress-screen-1"
      },
      {
        "kind": "content",
        "title": "O privire mai largă",
        "body": "Dacă ridici privirea și respiri mai lent, câmpul atenției se lărgește. Soluțiile apar.",
        "id": "calm_l2_12_focus_under_stress-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Lărgirea atenției",
        "steps": [
          "Gândește-te la un moment de stres recent.",
          "Observă ce s-a întâmplat cu atenția ta."
        ],
        "helper": "Respirația schimbă calitatea atenției.",
        "id": "calm_l2_12_focus_under_stress-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Efectul stresului",
        "question": "Ce efect are stresul asupra atenției?",
        "options": [
          "O lărgește.",
          "O îngustează.",
          "O oprește complet."
        ],
        "correctIndex": 1,
        "explanation": "Stresul îngustează focusul.",
        "id": "calm_l2_12_focus_under_stress-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O ancoră pentru atenție",
        "prompt": "Completează: „Când simt stres, vreau să-mi lărgesc atenția prin ___.”",
        "id": "calm_l2_12_focus_under_stress-screen-5"
      }
    ]
  },
  "calm_l2_13_low_energy": {
    "lessonId": "calm_l2_13_low_energy",
    "screens": [
      {
        "kind": "content",
        "title": "Când energia scade",
        "body": "Când ești obosit, emoțiile se amplifică. Claritatea se reduce. Nu este lipsă de disciplină.",
        "id": "calm_l2_13_low_energy-screen-1"
      },
      {
        "kind": "content",
        "title": "Un ritm mai lent",
        "body": "Uneori răspunsul corect este încetinirea. O pauză, o respirație, un pas în spate.",
        "id": "calm_l2_13_low_energy-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă oboseala",
        "steps": [
          "Adu în minte o situație în care ai fost iritabil.",
          "Observă cât de obosit erai."
        ],
        "helper": "Oboseala schimbă reacția.",
        "id": "calm_l2_13_low_energy-screen-3"
      },
      {
        "kind": "quiz",
        "title": "De ce ne activăm mai ușor când suntem obosiți?",
        "question": "Care este cel mai probabil motiv?",
        "options": [
          "Emoțiile dispar.",
          "Claritatea scade.",
          "Suntem mai calmi."
        ],
        "correctIndex": 1,
        "explanation": "Oboseala reduce resursele interne.",
        "id": "calm_l2_13_low_energy-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O intenție simplă",
        "prompt": "Completează: „Când sunt obosit, vreau să îmi amintesc că ___.”",
        "id": "calm_l2_13_low_energy-screen-5"
      }
    ]
  },
  "calm_l2_14_multitasking": {
    "lessonId": "calm_l2_14_multitasking",
    "screens": [
      {
        "kind": "content",
        "title": "Multitasking-ul nu ajută emoțiile",
        "body": "Când faci prea multe lucruri odată, corpul percepe presiune. Reacțiile devin mai rapide.",
        "id": "calm_l2_14_multitasking-screen-1"
      },
      {
        "kind": "content",
        "title": "Revenire",
        "body": "Alege un singur lucru pentru câteva minute. Ritmul se schimbă când îl simplify.",
        "id": "calm_l2_14_multitasking-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un singur lucru",
        "steps": [
          "Observă ce faci des în paralel.",
          "Alege unu dintre ele și încetinește ritmul."
        ],
        "helper": "Claritatea vine din simplitate.",
        "id": "calm_l2_14_multitasking-screen-3"
      },
      {
        "kind": "quiz",
        "title": "De ce multitasking-ul crește tensiunea?",
        "question": "Care este motivul principal?",
        "options": [
          "Reduce presiunea.",
          "Crește ritmul intern.",
          "Te face mai calm."
        ],
        "correctIndex": 1,
        "explanation": "Ritmul intern influențează reacțiile emoționale.",
        "id": "calm_l2_14_multitasking-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere mică",
        "prompt": "Completează: „Azi vreau să fac mai lent ___.”",
        "id": "calm_l2_14_multitasking-screen-5"
      }
    ]
  },
  "calm_l2_15_fast_reactions": {
    "lessonId": "calm_l2_15_fast_reactions",
    "screens": [
      {
        "kind": "content",
        "title": "Reacțiile rapide",
        "body": "Când reacționezi foarte repede, emoția decide pentru tine. Conștientizarea încetinește ritmul.",
        "id": "calm_l2_15_fast_reactions-screen-1"
      },
      {
        "kind": "content",
        "title": "Un moment înainte",
        "body": "Dacă poți observa impulsul înainte de acțiune, totul se schimbă.",
        "id": "calm_l2_15_fast_reactions-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă impulsul",
        "steps": [
          "Amintește-ți o reacție rapidă.",
          "Observă ce ai simțit în corp chiar înainte."
        ],
        "helper": "Impulsul devine vizibil prin atenție.",
        "id": "calm_l2_15_fast_reactions-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce te ajută să nu reacționezi prea repede?",
        "question": "Ce acțiune este utilă?",
        "options": [
          "Urmezi impulsul.",
          "Observi impulsul înainte.",
          "Crești volumul."
        ],
        "correctIndex": 1,
        "explanation": "Observarea schimbă direcția.",
        "id": "calm_l2_15_fast_reactions-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție calmă",
        "prompt": "Completează: „Când impulsul apare, vreau să ___.”",
        "id": "calm_l2_15_fast_reactions-screen-5"
      }
    ]
  },
  "calm_l2_16_pressure_moments": {
    "lessonId": "calm_l2_16_pressure_moments",
    "screens": [
      {
        "kind": "content",
        "title": "Momente sub presiune",
        "body": "Sub presiune, corpul vrea să grăbească totul. Claritatea vine dacă încetinești măcar un gest.",
        "id": "calm_l2_16_pressure_moments-screen-1"
      },
      {
        "kind": "content",
        "title": "Un ritm propriu",
        "body": "Nu trebuie să ții ritmul altcuiva. Poți alege ritmul tău.",
        "id": "calm_l2_16_pressure_moments-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un gest încetinit",
        "steps": [
          "Adu-ți aminte un moment tensionat.",
          "Imaginează-ți că încetinești doar primul tău gest."
        ],
        "helper": "Ritmul se schimbă cu un singur gest.",
        "id": "calm_l2_16_pressure_moments-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce te ajută sub presiune?",
        "question": "Care acțiune este utilă?",
        "options": [
          "Să accelerezi.",
          "Să încetinești primul gest.",
          "Să te critici."
        ],
        "correctIndex": 1,
        "explanation": "Primul gest stabilește tonul.",
        "id": "calm_l2_16_pressure_moments-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere calmă",
        "prompt": "Completează: „Când presiunea crește, vreau să ___.”",
        "id": "calm_l2_16_pressure_moments-screen-5"
      }
    ]
  },
  "calm_l3_17_shame": {
    "lessonId": "calm_l3_17_shame",
    "screens": [
      {
        "kind": "content",
        "title": "Rușinea apare în liniște",
        "body": "Rușinea este o emoție care te face să te micșorezi. Nu pentru că ai făcut ceva greșit, ci pentru că îți pasă prea mult.",
        "id": "calm_l3_17_shame-screen-1"
      },
      {
        "kind": "content",
        "title": "Nu fugi de ea",
        "body": "Dacă încerci să o ascunzi, se adâncește. Dacă o privești cu blândețe, începe să se dizolve.",
        "id": "calm_l3_17_shame-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare blândă",
        "steps": [
          "Amintește-ți un moment recent de rușine.",
          "Observă-l fără critică, ca un gând trecător."
        ],
        "helper": "Rușinea scade când este privită, nu ascunsă.",
        "id": "calm_l3_17_shame-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Cum se liniștește rușinea?",
        "question": "Care este primul pas util?",
        "options": [
          "Să o respingi.",
          "Să o privești fără judecată.",
          "Să te critici."
        ],
        "correctIndex": 1,
        "explanation": "Blândețea reduce intensitatea.",
        "id": "calm_l3_17_shame-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție de sprijin",
        "prompt": "Completează: „Când apare rușinea, îmi amintesc că ___.”",
        "id": "calm_l3_17_shame-screen-5"
      }
    ]
  },
  "calm_l3_18_guilt": {
    "lessonId": "calm_l3_18_guilt",
    "screens": [
      {
        "kind": "content",
        "title": "Vinovăția spune o poveste",
        "body": "Vinovăția apare când simți că ai făcut mai puțin decât ai fi putut. Este emoția responsabilității, nu a defectului.",
        "id": "calm_l3_18_guilt-screen-1"
      },
      {
        "kind": "content",
        "title": "Fără autocritică",
        "body": "Nu te ajută să te lovești mental. Te ajută să privești situația cu mai multă claritate.",
        "id": "calm_l3_18_guilt-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă mesajul",
        "steps": [
          "Alege o situație de vinovăție.",
          "Observă dacă este vina faptelor sau a așteptărilor prea mari."
        ],
        "helper": "Vinovăția sănătoasă ghidă, nu apasă.",
        "id": "calm_l3_18_guilt-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce rol poate avea vinovăția?",
        "question": "Varianta utilă este:",
        "options": [
          "Să te blocheze.",
          "Să te ghideze spre un pas mai bun.",
          "Să te critici."
        ],
        "correctIndex": 1,
        "explanation": "Vinovăția sănătoasă indică direcția.",
        "id": "calm_l3_18_guilt-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O clarificare simplă",
        "prompt": "Completează: „Din situația aceea am învățat că ___.”",
        "id": "calm_l3_18_guilt-screen-5"
      }
    ]
  },
  "calm_l3_19_withdrawal": {
    "lessonId": "calm_l3_19_withdrawal",
    "screens": [
      {
        "kind": "content",
        "title": "Retragerea",
        "body": "Uneori te retragi pentru că este prea mult. Este un mecanism de protecție, nu o slăbiciune.",
        "id": "calm_l3_19_withdrawal-screen-1"
      },
      {
        "kind": "content",
        "title": "Întoarcerea",
        "body": "Nu trebuie să revii imediat. Doar să rămâi conectat la tine cât timp faci un pas înapoi.",
        "id": "calm_l3_19_withdrawal-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă motivul",
        "steps": [
          "Gândește-te la o situație în care te-ai retras.",
          "Ce anume te-a copleșit?"
        ],
        "helper": "Claritatea vine înainte de întoarcere.",
        "id": "calm_l3_19_withdrawal-screen-3"
      },
      {
        "kind": "quiz",
        "title": "De ce ne retragem uneori?",
        "question": "Care este cel mai probabil motiv?",
        "options": [
          "Pentru că nu ne pasă.",
          "Pentru că e prea mult într-un timp scurt.",
          "Pentru a controla situația."
        ],
        "correctIndex": 1,
        "explanation": "Retragerea este protecție, nu dezinteres.",
        "id": "calm_l3_19_withdrawal-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O revenire blândă",
        "prompt": "Completează: „Când mă retrag, vreau să revin după ce ___.”",
        "id": "calm_l3_19_withdrawal-screen-5"
      }
    ]
  },
  "calm_l3_20_hard_conversations": {
    "lessonId": "calm_l3_20_hard_conversations",
    "screens": [
      {
        "kind": "content",
        "title": "Discuțiile dificile",
        "body": "Discuțiile grele cer prezență, nu perfecțiune. Corpul simte tensiunea înaintea cuvintelor.",
        "id": "calm_l3_20_hard_conversations-screen-1"
      },
      {
        "kind": "content",
        "title": "Început calm",
        "body": "Dacă respiri lent înainte de a începe, discuția ia altă direcție.",
        "id": "calm_l3_20_hard_conversations-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Pregătirea",
        "steps": [
          "Adu în minte o discuție grea.",
          "Cum ai vrea să începi data viitoare?"
        ],
        "helper": "Începutul calmează restul.",
        "id": "calm_l3_20_hard_conversations-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce ajută înaintea unei discuții grele?",
        "question": "Care acțiune e utilă?",
        "options": [
          "Începi imediat.",
          "Respiri lent și clarifici ce vrei să transmiți.",
          "Ridici tonul."
        ],
        "correctIndex": 1,
        "explanation": "Pregătirea interioară schimbă calitatea discuției.",
        "id": "calm_l3_20_hard_conversations-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Prima frază",
        "prompt": "Completează: „Când încep o discuție grea, pot spune: ___.”",
        "id": "calm_l3_20_hard_conversations-screen-5"
      }
    ]
  },
  "calm_l3_21_restoring_balance": {
    "lessonId": "calm_l3_21_restoring_balance",
    "screens": [
      {
        "kind": "content",
        "title": "Când te pierzi pe drum",
        "body": "Toți ne pierdem echilibrul uneori. Nu este eșec. E doar un semn că ai nevoie de o pauză.",
        "id": "calm_l3_21_restoring_balance-screen-1"
      },
      {
        "kind": "content",
        "title": "Revenirea",
        "body": "O revenire începe cu cel mai mic gest: o respirație, o observare, o clipă de liniște.",
        "id": "calm_l3_21_restoring_balance-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mic gest",
        "steps": [
          "Alege o zi în care ai pierdut echilibrul.",
          "Ce mic gest te-ar fi ajutat?"
        ],
        "helper": "Revenirea este un proces, nu un moment.",
        "id": "calm_l3_21_restoring_balance-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Cum revii la echilibru?",
        "question": "Ce este cel mai util?",
        "options": [
          "Să ignori totul.",
          "Un gest mic de revenire.",
          "Să te critici."
        ],
        "correctIndex": 1,
        "explanation": "Pașii mici sunt cei mai eficienți.",
        "id": "calm_l3_21_restoring_balance-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere pentru mine",
        "prompt": "Completează: „Când simt că mă pierd, pot începe prin ___.”",
        "id": "calm_l3_21_restoring_balance-screen-5"
      }
    ]
  },
  "calm_l3_22_presence_under_fire": {
    "lessonId": "calm_l3_22_presence_under_fire",
    "screens": [
      {
        "kind": "content",
        "title": "Prezența în momente grele",
        "body": "În tensiune mare, corpul vrea să accelereze. Prezența apare când încetinești doar un singur lucru: respirația, vocea, gestul.",
        "id": "calm_l3_22_presence_under_fire-screen-1"
      },
      {
        "kind": "content",
        "title": "În centru",
        "body": "Când rămâi în centru, nu ești împins de val, chiar dacă emoția este puternică.",
        "id": "calm_l3_22_presence_under_fire-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un pas spre prezență",
        "steps": [
          "Alege o situație intensă.",
          "Observă ce ai putea încetini data viitoare."
        ],
        "helper": "Prezența vine prin încetinire.",
        "id": "calm_l3_22_presence_under_fire-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce te ajută să rămâi prezent?",
        "question": "Ce acțiune este utilă?",
        "options": [
          "Să accelerezi ritmul.",
          "Să încetinești un singur element.",
          "Să ridici vocea."
        ],
        "correctIndex": 1,
        "explanation": "Încetinirea aduce control intern.",
        "id": "calm_l3_22_presence_under_fire-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un anchor mic",
        "prompt": "Completează: „Când totul e intens, pot încetini ___.”",
        "id": "calm_l3_22_presence_under_fire-screen-5"
      }
    ]
  },
  "calm_l3_23_centering": {
    "lessonId": "calm_l3_23_centering",
    "screens": [
      {
        "kind": "content",
        "title": "Așezarea în tine",
        "body": "Centrarea nu este o tehnică. Este o revenire la un punct interior stabil.",
        "id": "calm_l3_23_centering-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei respirații",
        "body": "Trei respirații lente sunt suficiente pentru a simți schimbarea.",
        "id": "calm_l3_23_centering-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Revenire la centru",
        "steps": [
          "Inspir lent.",
          "Expir mai lung.",
          "Privesc un punct fix."
        ],
        "helper": "Simplitatea este putere.",
        "id": "calm_l3_23_centering-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce definește centrarea?",
        "question": "Care idee este corectă?",
        "options": [
          "Control total.",
          "O revenire la un punct interior stabil.",
          "Eliminarea emoțiilor."
        ],
        "correctIndex": 1,
        "explanation": "Centrarea stabilește ritmul interior.",
        "id": "calm_l3_23_centering-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un pas spre centru",
        "prompt": "Completează: „Mă pot centra rapid prin ___.”",
        "id": "calm_l3_23_centering-screen-5"
      }
    ]
  },
  "calm_l3_24_soft_strength": {
    "lessonId": "calm_l3_24_soft_strength",
    "screens": [
      {
        "kind": "content",
        "title": "Puterea blândă",
        "body": "Echilibrul emoțional nu este rigiditate. Este o formă blândă de forță care nu rănește și nu împinge.",
        "id": "calm_l3_24_soft_strength-screen-1"
      },
      {
        "kind": "content",
        "title": "Întreg",
        "body": "Când te simți întreg, răspunsurile tale sunt simple, clare și calme.",
        "id": "calm_l3_24_soft_strength-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă puterea ta",
        "steps": [
          "Adu-ți aminte un moment în care ai răspuns calm.",
          "Observă ce te-a ajutat atunci."
        ],
        "helper": "Puterea blândă se construiește.",
        "id": "calm_l3_24_soft_strength-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce este puterea blândă?",
        "question": "Cum ai descrie această formă de putere?",
        "options": [
          "Forță agresivă.",
          "Rigiditate.",
          "Claritate și calm în același timp."
        ],
        "correctIndex": 2,
        "explanation": "Puterea blândă este matură și stabilă.",
        "id": "calm_l3_24_soft_strength-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție finală",
        "prompt": "Completează: „Pentru mine, puterea blândă înseamnă ___.”",
        "id": "calm_l3_24_soft_strength-screen-5"
      }
    ]
  }
};
