export type OmniKunoArcZoneKey = "trezire" | "primele_ciocniri" | "profunzime" | "maestrie";

export type OmniKunoScreenKind = "content" | "checkpoint" | "quiz" | "reflection" | "protocol" | "arcIntro";

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
      explanation?: string;
    }
  | {
      id?: string;
      kind: "reflection";
      title: string;
      prompt: string;
    }
  | {
      id?: string;
      kind: "protocol";
      title: string;
      body?: string;
      steps?: string[];
    }
  | {
      id?: string;
      kind: "arcIntro";
      title: string;
      body: string;
    };

export type OmniKunoLessonContent = {
  lessonId: string;
  screens: OmniKunoLessonScreen[];
};

export type OmniKunoArcIntro = {
  id: string;
  title: string;
  body: string;
};

export type OmniKunoArcIntroGroup = Record<OmniKunoArcZoneKey, OmniKunoArcIntro>;

export type OmniKunoModuleContent = {
  id: string;
  title: string;
  arcIntros: OmniKunoArcIntroGroup;
  lessons: OmniKunoLessonContent[];
};

export type OmniKunoArcIntroGroups = Record<string, OmniKunoArcIntroGroup>;

export const OMNI_KUNO_MODULE_CONTENT: Record<string, OmniKunoModuleContent> = {
  "emotional_balance": {
    "id": "emotional_balance",
    "title": "Echilibru Emoțional",
    "arcIntros": {
      "trezire": {
        "id": "emotional_balance_arc_01_trezire",
        "title": "Trezirea",
        "body": "Începutul nu este despre schimbare, ci despre a învăța să vezi. În primele momente de lucru cu emoțiile nu trebuie să rezolvi nimic, doar să observi cum arată lumea ta interioară: respirația, ritmul, tensiunea, gândurile. Tot ce simți este permis și fiecare semn îți arată că ești prezent. Când privești lucrurile fără grabă apare trezirea, acel spațiu mic dintre stimul și reacție din care poți alege."
      },
      "primele_ciocniri": {
        "id": "emotional_balance_arc_02_primele_ciocniri",
        "title": "Primele Ciocniri",
        "body": "Pe măsură ce devii mai atent apar provocări: un ton ridicat, un mesaj sec, o critică, o discuție care se aprinde. Nu sunt obstacole, ci invitații care îți arată ce te atinge cel mai mult. Aici înveți respirația mai lentă, prezența în corp și pauza scurtă înainte de răspuns, nu ca să pari calm, ci ca să rămâi conectat la tine când exteriorul se mișcă repede."
      },
      "profunzime": {
        "id": "emotional_balance_arc_03_profunzime",
        "title": "Profunzime",
        "body": "Când mergi mai departe ies la suprafață emoții mai adânci: rușinea, vinovăția, teama de a dezamăgi, dorința de a te retrage. Nu sunt dușmani, ci straturi vechi care cer atenție. Înveți să stai cu ele fără să lupți, să nu le împingi deoparte și nici să te pierzi în ele. Respiri, observi și lași liniștea să se așeze chiar dacă nu există rezolvări rapide."
      },
      "maestrie": {
        "id": "emotional_balance_arc_04_maestrie",
        "title": "Maestrie",
        "body": "Echilibrul emoțional nu înseamnă control total și nici eliminarea reacțiilor. Maestria apare când îți cunoști ritmul și poți rămâne prezent chiar și în momente tensionate. În viața de zi cu zi înseamnă să alegi răspunsul, nu impulsul, în discuții reale, în oboseală sau sub presiune. Nu urmărești perfecțiunea, ci capacitatea de a folosi un protocol de reglare chiar și în zilele grele. Asta este maestria: o liniște activă, simplă și aplicată, pe care o poți lua cu tine oriunde."
      }
    },
    "lessons": [
      {
        "lessonId": "emotional_balance_l1_01_foundations",
        "screens": [
          {
            "kind": "content",
            "title": "Calmul activ",
            "body": "Calmul activ apare când nu grăbești nimic și nu împingi nimic. Doar observi ce trăiești, fără să te pierzi în reacție. Nu este pasivitate. Este claritate.",
            "id": "emotional_balance_l1_01_foundations-screen-1"
          },
          {
            "kind": "quiz",
            "title": "Tensiunea este un mesaj?",
            "question": "Ești de acord că recunoașterea tensiunii îți oferă un spațiu mic între impuls și acțiune?",
            "options": [
              "O observ, respir și folosesc protocolul de reglare înainte de răspuns.",
              "O ignor până dispare, altfel mă blochez.",
              "Încerc să nu mai simt nimic ca să pot continua."
            ],
            "correctIndex": 0,
            "explanation": "Observarea + protocolul îți dau timp să alegi răspunsul conștient, nu un impuls reflex.",
            "id": "emotional_balance_l1_01_foundations-screen-2"
          },
          {
            "kind": "content",
            "title": "Reține",
            "body": "Când tensiunea apare în corp, nu trebuie eliminată pe loc. Recunoașterea ei îți oferă acel spațiu dintre impuls și acțiune.",
            "id": "emotional_balance_l1_01_foundations-screen-3"
          },
          {
            "kind": "checkpoint",
            "title": "Unde sunt acum?",
            "steps": [
              "Gândește-te la un moment recent în care ai simțit tensiune.",
              "Observă-l fără să îl judeci."
            ],
            "helper": "Observarea este primul pas al calmului activ.",
            "id": "emotional_balance_l1_01_foundations-screen-4"
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
            "id": "emotional_balance_l1_01_foundations-screen-5"
          },
          {
            "kind": "reflection",
            "title": "O propoziție simplă",
            "prompt": "Completează: „Calmul activ pentru mine înseamnă ___.”",
            "id": "emotional_balance_l1_01_foundations-screen-6"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_02_triggers",
        "screens": [
          {
            "kind": "content",
            "title": "Ce pornește reacția",
            "body": "Uneori, nu situația în sine e problema, ci modul în care corpul reacționează la ea. Observarea declanșatorilor îți face reacțiile mai previzibile.",
            "id": "emotional_balance_l1_02_triggers-screen-1"
          },
          {
            "kind": "content",
            "title": "Trei semnale",
            "body": "Un ton ridicat, un mesaj scurt sau o privire pot aprinde reacții vechi. Nu e vina ta. Este doar un tipar.",
            "id": "emotional_balance_l1_02_triggers-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Declanșatorul meu",
            "steps": [
              "Adu-ți aminte un moment în care te-ai activat rapid.",
              "Ce anume a declanșat reacția?"
            ],
            "helper": "Identificarea declanșatorului reduce intensitatea viitoare.",
            "id": "emotional_balance_l1_02_triggers-screen-3"
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
            "id": "emotional_balance_l1_02_triggers-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O observare blândă",
            "prompt": "Completează: „Un declanșator frecvent pentru mine este ___.”",
            "id": "emotional_balance_l1_02_triggers-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_03_body_scan",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul vede primul",
            "body": "Emoțiile apar mai întâi în corp, nu în gânduri. Un maxilar strâns sau umeri ridicați sunt semne timpurii ale tensiunii.",
            "id": "emotional_balance_l1_03_body_scan-screen-1"
          },
          {
            "kind": "content",
            "title": "20 de secunde",
            "body": "Observă pe rând maxilarul, umerii și respirația. Nu încerca să schimbi nimic. Doar vezi ce este acolo.",
            "id": "emotional_balance_l1_03_body_scan-screen-2"
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
            "id": "emotional_balance_l1_03_body_scan-screen-3"
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
            "id": "emotional_balance_l1_03_body_scan-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O notă scurtă",
            "prompt": "Completează: „Astăzi, corpul meu se simte ___.”",
            "id": "emotional_balance_l1_03_body_scan-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_04_micro_choices",
        "screens": [
          {
            "kind": "content",
            "title": "Spațiul dintre impuls și acțiune",
            "body": "Între ceea ce simți și ceea ce faci există un spațiu mic. În el se află alegerile tale.",
            "id": "emotional_balance_l1_04_micro_choices-screen-1"
          },
          {
            "kind": "content",
            "title": "Micro-decizii",
            "body": "O micro-decizie este o mică alegere: respiri înainte să răspunzi, lași telefonul jos, privești o secundă în jos înainte de a continua.",
            "id": "emotional_balance_l1_04_micro_choices-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "O decizie mică",
            "steps": [
              "Adu-ți aminte un moment în care ai reacționat rapid.",
              "Imaginează-ți că introduci o pauză de o respirație."
            ],
            "helper": "O pauză mică schimbă direcția.",
            "id": "emotional_balance_l1_04_micro_choices-screen-3"
          },
          {
            "kind": "protocol",
            "title": "Protocolul mini pentru impulsuri",
            "body": "Folosește acest protocol de fiecare dată când simți că impulsul devine mai rapid decât tine.",
            "id": "emotional_balance_l1_04_micro_choices-screen-4"
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
            "id": "emotional_balance_l1_04_micro_choices-screen-5"
          },
          {
            "kind": "reflection",
            "title": "O alegere pentru azi",
            "prompt": "Completează: „Azi vreau să introduc o pauză înainte de ___.”",
            "id": "emotional_balance_l1_04_micro_choices-screen-6"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_05_breath_basics",
        "screens": [
          {
            "kind": "content",
            "title": "Respirația te sprijină",
            "body": "Respirația lentă trimite semnal de siguranță sistemului tău nervos. Nu ai nevoie de tehnici complicate.",
            "id": "emotional_balance_l1_05_breath_basics-screen-1"
          },
          {
            "kind": "content",
            "title": "Ritm simplu",
            "body": "Inspiră pe 4 timp, expiră puțin mai lung. Este suficient ca tensiunea să înceapă să scadă.",
            "id": "emotional_balance_l1_05_breath_basics-screen-2"
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
            "id": "emotional_balance_l1_05_breath_basics-screen-3"
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
            "id": "emotional_balance_l1_05_breath_basics-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Intenție scurtă",
            "prompt": "Completează: „Voi folosi respirația lentă când simt ___.”",
            "id": "emotional_balance_l1_05_breath_basics-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_06_pause_button",
        "screens": [
          {
            "kind": "content",
            "title": "Puterea pauzei",
            "body": "Nu trebuie să răspunzi imediat. O pauză nu este slăbiciune. Este claritate.",
            "id": "emotional_balance_l1_06_pause_button-screen-1"
          },
          {
            "kind": "content",
            "title": "Pauză declarată",
            "body": "Poți spune simplu: „Revin în câteva minute.” Așa îți protejezi răspunsul, nu te retragi.",
            "id": "emotional_balance_l1_06_pause_button-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Pauză mentală",
            "steps": [
              "Alege o situație în care ai răspuns prea repede.",
              "Imaginează o pauză scurtă acolo."
            ],
            "helper": "Pauza schimbă tonul.",
            "id": "emotional_balance_l1_06_pause_button-screen-3"
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
            "id": "emotional_balance_l1_06_pause_button-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție utilă",
            "prompt": "Completează: „Când am nevoie de pauză, pot spune: ___.”",
            "id": "emotional_balance_l1_06_pause_button-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_07_boundaries",
        "screens": [
          {
            "kind": "content",
            "title": "Limite blânde",
            "body": "Limitele nu sunt ziduri. Sunt spații sănătoase în care poți respira. Ele apar atunci când spui ce este potrivit pentru tine, fără agresivitate, fără grabă.",
            "id": "emotional_balance_l1_07_boundaries-screen-1"
          },
          {
            "kind": "content",
            "title": "Un „nu” calm",
            "body": "Un „nu” spus liniștit nu rupe relațiile. Le clarifică. Îți protejează timpul, atenția și energia.",
            "id": "emotional_balance_l1_07_boundaries-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare simplă",
            "steps": [
              "Alege o situație în care ai spus „da”, dar simțeai „nu”.",
              "Observă ce emoție era acolo."
            ],
            "helper": "Limitele bune protejează, nu atacă.",
            "id": "emotional_balance_l1_07_boundaries-screen-3"
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
            "id": "emotional_balance_l1_07_boundaries-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O limită mică",
            "prompt": "Completează: „O limită pe care vreau să o respect mai des este ___.”",
            "id": "emotional_balance_l1_07_boundaries-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l1_08_self_talk",
        "screens": [
          {
            "kind": "content",
            "title": "Vocea din interior",
            "body": "Ce îți spui în minte influențează direct cum te simți. Un ton critic ridică tensiunea. Un ton blând o reduce.",
            "id": "emotional_balance_l1_08_self_talk-screen-1"
          },
          {
            "kind": "content",
            "title": "Din critic în ghid",
            "body": "Nu trebuie să elimini vocea critică. Doar să o transformi. În loc de „nu pot”, poți spune „încă învăț”.",
            "id": "emotional_balance_l1_08_self_talk-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă tonul",
            "steps": [
              "Adu în minte o frază dură pe care ți-o spui des.",
              "Reformuleaz-o într-o propoziție mai blândă."
            ],
            "helper": "Nu minți și nu exagera. Doar scoate duritatea.",
            "id": "emotional_balance_l1_08_self_talk-screen-3"
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
            "id": "emotional_balance_l1_08_self_talk-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O frază de sprijin",
            "prompt": "Completează: „Fraza pe care vreau să o folosesc mai des este: ___.”",
            "id": "emotional_balance_l1_08_self_talk-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_09_voice_tone",
        "screens": [
          {
            "kind": "content",
            "title": "Tonul schimbă totul",
            "body": "Nu doar cuvintele, ci și tonul influențează cum te simți. Uneori reacționezi la ton, nu la mesaj.",
            "id": "emotional_balance_l2_09_voice_tone-screen-1"
          },
          {
            "kind": "content",
            "title": "Separă cele două",
            "body": "Dacă separi tonul de conținut, devine mai ușor să înțelegi ce ți se transmite. Claritatea vine în pași mici.",
            "id": "emotional_balance_l2_09_voice_tone-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă diferența",
            "steps": [
              "Amintește-ți o discuție tensionată.",
              "Separă tonul de mesajul real."
            ],
            "helper": "Claritatea nu vine din grabă.",
            "id": "emotional_balance_l2_09_voice_tone-screen-3"
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
            "id": "emotional_balance_l2_09_voice_tone-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Reformulare calmă",
            "prompt": "Completează: „În discuții dificile vreau să-mi reamintesc să ___.”",
            "id": "emotional_balance_l2_09_voice_tone-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_10_criticism",
        "screens": [
          {
            "kind": "content",
            "title": "Critica te activează",
            "body": "Critica atinge zone sensibile. E normal să te activezi. Reacția nu este o greșeală.",
            "id": "emotional_balance_l2_10_criticism-screen-1"
          },
          {
            "kind": "content",
            "title": "Un pas în lateral",
            "body": "Poți să faci un pas mental în lateral. Îți dă spațiu între emoție și răspuns.",
            "id": "emotional_balance_l2_10_criticism-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Doar un pas",
            "steps": [
              "Alege o critică recentă.",
              "Observă cum ai reacționat atunci."
            ],
            "helper": "Spațiul interior reduce intensitatea.",
            "id": "emotional_balance_l2_10_criticism-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Primul pas în critică",
            "question": "Ce te ajută când primești critică?",
            "options": [
              "Să respiri, să observi ce emoție a fost atinsă și să faci un pas mental în lateral înainte de răspuns.",
              "Să te justifici imediat ca să nu pari slab.",
              "Să asculți doar ca să pregătești contraargumentul perfect."
            ],
            "correctIndex": 1,
            "explanation": "Pasul mental + observarea emoției îți dau spațiu pentru un răspuns mai potrivit decât impulsul defensiv.",
            "id": "emotional_balance_l2_10_criticism-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un gând util",
            "prompt": "Completează: „Când primesc critică, vreau să-mi amintesc că ___.”",
            "id": "emotional_balance_l2_10_criticism-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_11_conflict_opening",
        "screens": [
          {
            "kind": "content",
            "title": "Începuturile unui conflict",
            "body": "Cele mai tensionate momente sunt primele secunde. Ele decid ritmul discuției.",
            "id": "emotional_balance_l2_11_conflict_opening-screen-1"
          },
          {
            "kind": "content",
            "title": "Rămâi în corp",
            "body": "Începutul unui conflict devine gestionabil dacă rămâi conectat la corp: respirație lentă, umeri jos, privire stabilă.",
            "id": "emotional_balance_l2_11_conflict_opening-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Primul moment",
            "steps": [
              "Adu în minte un conflict.",
              "Observă care a fost primul impuls."
            ],
            "helper": "Impulsul nu este finalul.",
            "id": "emotional_balance_l2_11_conflict_opening-screen-3"
          },
          {
            "kind": "protocol",
            "title": "Protocol pentru început de conflict",
            "body": "Folosește mini-protocolul înainte de primul răspuns ca să aduci ritmul discuției înapoi la tine.",
            "id": "emotional_balance_l2_11_conflict_opening-screen-4"
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
            "id": "emotional_balance_l2_11_conflict_opening-screen-5"
          },
          {
            "kind": "reflection",
            "title": "O decizie mică",
            "prompt": "Completează: „În conflicte, vreau să încep cu ___.”",
            "id": "emotional_balance_l2_11_conflict_opening-screen-6"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_12_focus_under_stress",
        "screens": [
          {
            "kind": "content",
            "title": "Când stresul crește",
            "body": "Sub stres, atenția se îngustează. Vezi mai puține soluții. E normal.",
            "id": "emotional_balance_l2_12_focus_under_stress-screen-1"
          },
          {
            "kind": "content",
            "title": "O privire mai largă",
            "body": "Dacă ridici privirea și respiri mai lent, câmpul atenției se lărgește. Soluțiile apar.",
            "id": "emotional_balance_l2_12_focus_under_stress-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Lărgirea atenției",
            "steps": [
              "Gândește-te la un moment de stres recent.",
              "Observă ce s-a întâmplat cu atenția ta."
            ],
            "helper": "Respirația schimbă calitatea atenției.",
            "id": "emotional_balance_l2_12_focus_under_stress-screen-3"
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
            "id": "emotional_balance_l2_12_focus_under_stress-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O ancoră pentru atenție",
            "prompt": "Completează: „Când simt stres, vreau să-mi lărgesc atenția prin ___.”",
            "id": "emotional_balance_l2_12_focus_under_stress-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_13_low_energy",
        "screens": [
          {
            "kind": "content",
            "title": "Când energia scade",
            "body": "Când ești obosit, emoțiile se amplifică. Claritatea se reduce. Nu este lipsă de disciplină.",
            "id": "emotional_balance_l2_13_low_energy-screen-1"
          },
          {
            "kind": "content",
            "title": "Un ritm mai lent",
            "body": "Uneori răspunsul corect este încetinirea. O pauză, o respirație, un pas în spate.",
            "id": "emotional_balance_l2_13_low_energy-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă oboseala",
            "steps": [
              "Adu în minte o situație în care ai fost iritabil.",
              "Observă cât de obosit erai."
            ],
            "helper": "Oboseala schimbă reacția.",
            "id": "emotional_balance_l2_13_low_energy-screen-3"
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
            "id": "emotional_balance_l2_13_low_energy-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O intenție simplă",
            "prompt": "Completează: „Când sunt obosit, vreau să îmi amintesc că ___.”",
            "id": "emotional_balance_l2_13_low_energy-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_14_multitasking",
        "screens": [
          {
            "kind": "content",
            "title": "Multitasking-ul nu ajută emoțiile",
            "body": "Când faci prea multe lucruri odată, corpul percepe presiune. Reacțiile devin mai rapide.",
            "id": "emotional_balance_l2_14_multitasking-screen-1"
          },
          {
            "kind": "content",
            "title": "Revenire",
            "body": "Alege un singur lucru pentru câteva minute. Ritmul se schimbă când îl simplify.",
            "id": "emotional_balance_l2_14_multitasking-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Un singur lucru",
            "steps": [
              "Observă ce faci des în paralel.",
              "Alege unu dintre ele și încetinește ritmul."
            ],
            "helper": "Claritatea vine din simplitate.",
            "id": "emotional_balance_l2_14_multitasking-screen-3"
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
            "id": "emotional_balance_l2_14_multitasking-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O alegere mică",
            "prompt": "Completează: „Azi vreau să fac mai lent ___.”",
            "id": "emotional_balance_l2_14_multitasking-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_15_fast_reactions",
        "screens": [
          {
            "kind": "content",
            "title": "Reacțiile rapide",
            "body": "Când reacționezi foarte repede, emoția decide pentru tine. Conștientizarea încetinește ritmul.",
            "id": "emotional_balance_l2_15_fast_reactions-screen-1"
          },
          {
            "kind": "content",
            "title": "Un moment înainte",
            "body": "Dacă poți observa impulsul înainte de acțiune, totul se schimbă.",
            "id": "emotional_balance_l2_15_fast_reactions-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă impulsul",
            "steps": [
              "Amintește-ți o reacție rapidă.",
              "Observă ce ai simțit în corp chiar înainte."
            ],
            "helper": "Impulsul devine vizibil prin atenție.",
            "id": "emotional_balance_l2_15_fast_reactions-screen-3"
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
            "id": "emotional_balance_l2_15_fast_reactions-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție calmă",
            "prompt": "Completează: „Când impulsul apare, vreau să ___.”",
            "id": "emotional_balance_l2_15_fast_reactions-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l2_16_pressure_moments",
        "screens": [
          {
            "kind": "content",
            "title": "Momente sub presiune",
            "body": "Sub presiune, corpul vrea să grăbească totul. Claritatea vine dacă încetinești măcar un gest.",
            "id": "emotional_balance_l2_16_pressure_moments-screen-1"
          },
          {
            "kind": "content",
            "title": "Un ritm propriu",
            "body": "Nu trebuie să ții ritmul altcuiva. Poți alege ritmul tău.",
            "id": "emotional_balance_l2_16_pressure_moments-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Un gest încetinit",
            "steps": [
              "Adu-ți aminte un moment tensionat.",
              "Imaginează-ți că încetinești doar primul tău gest."
            ],
            "helper": "Ritmul se schimbă cu un singur gest.",
            "id": "emotional_balance_l2_16_pressure_moments-screen-3"
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
            "id": "emotional_balance_l2_16_pressure_moments-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O alegere calmă",
            "prompt": "Completează: „Când presiunea crește, vreau să ___.”",
            "id": "emotional_balance_l2_16_pressure_moments-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_17_shame",
        "screens": [
          {
            "kind": "content",
            "title": "Rușinea apare în liniște",
            "body": "Rușinea este o emoție care te face să te micșorezi. Nu pentru că ai făcut ceva greșit, ci pentru că îți pasă prea mult.",
            "id": "emotional_balance_l3_17_shame-screen-1"
          },
          {
            "kind": "content",
            "title": "Nu fugi de ea",
            "body": "Dacă încerci să o ascunzi, se adâncește. Dacă o privești cu blândețe, începe să se dizolve.",
            "id": "emotional_balance_l3_17_shame-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare blândă",
            "steps": [
              "Amintește-ți un moment recent de rușine.",
              "Observă-l fără critică, ca un gând trecător."
            ],
            "helper": "Rușinea scade când este privită, nu ascunsă.",
            "id": "emotional_balance_l3_17_shame-screen-3"
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
            "id": "emotional_balance_l3_17_shame-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție de sprijin",
            "prompt": "Completează: „Când apare rușinea, îmi amintesc că ___.”",
            "id": "emotional_balance_l3_17_shame-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_18_guilt",
        "screens": [
          {
            "kind": "content",
            "title": "Vinovăția spune o poveste",
            "body": "Vinovăția apare când simți că ai făcut mai puțin decât ai fi putut. Este emoția responsabilității, nu a defectului.",
            "id": "emotional_balance_l3_18_guilt-screen-1"
          },
          {
            "kind": "content",
            "title": "Fără autocritică",
            "body": "Nu te ajută să te lovești mental. Te ajută să privești situația cu mai multă claritate.",
            "id": "emotional_balance_l3_18_guilt-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă mesajul",
            "steps": [
              "Alege o situație de vinovăție.",
              "Observă dacă este vina faptelor sau a așteptărilor prea mari."
            ],
            "helper": "Vinovăția sănătoasă ghidă, nu apasă.",
            "id": "emotional_balance_l3_18_guilt-screen-3"
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
            "id": "emotional_balance_l3_18_guilt-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O clarificare simplă",
            "prompt": "Completează: „Din situația aceea am învățat că ___.”",
            "id": "emotional_balance_l3_18_guilt-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_19_withdrawal",
        "screens": [
          {
            "kind": "content",
            "title": "Retragerea",
            "body": "Uneori te retragi pentru că este prea mult. Este un mecanism de protecție, nu o slăbiciune.",
            "id": "emotional_balance_l3_19_withdrawal-screen-1"
          },
          {
            "kind": "content",
            "title": "Întoarcerea",
            "body": "Nu trebuie să revii imediat. Doar să rămâi conectat la tine cât timp faci un pas înapoi.",
            "id": "emotional_balance_l3_19_withdrawal-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă motivul",
            "steps": [
              "Gândește-te la o situație în care te-ai retras.",
              "Ce anume te-a copleșit?"
            ],
            "helper": "Claritatea vine înainte de întoarcere.",
            "id": "emotional_balance_l3_19_withdrawal-screen-3"
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
            "id": "emotional_balance_l3_19_withdrawal-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O revenire blândă",
            "prompt": "Completează: „Când mă retrag, vreau să revin după ce ___.”",
            "id": "emotional_balance_l3_19_withdrawal-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_20_hard_conversations",
        "screens": [
          {
            "kind": "content",
            "title": "Discuțiile dificile",
            "body": "Discuțiile grele cer prezență, nu perfecțiune. Corpul simte tensiunea înaintea cuvintelor.",
            "id": "emotional_balance_l3_20_hard_conversations-screen-1"
          },
          {
            "kind": "content",
            "title": "Început calm",
            "body": "Dacă respiri lent înainte de a începe, discuția ia altă direcție.",
            "id": "emotional_balance_l3_20_hard_conversations-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Pregătirea",
            "steps": [
              "Adu în minte o discuție grea.",
              "Cum ai vrea să începi data viitoare?"
            ],
            "helper": "Începutul calmează restul.",
            "id": "emotional_balance_l3_20_hard_conversations-screen-3"
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
            "id": "emotional_balance_l3_20_hard_conversations-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Prima frază",
            "prompt": "Completează: „Când încep o discuție grea, pot spune: ___.”",
            "id": "emotional_balance_l3_20_hard_conversations-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_21_restoring_balance",
        "screens": [
          {
            "kind": "content",
            "title": "Când te pierzi pe drum",
            "body": "Toți ne pierdem echilibrul uneori. Nu este eșec. E doar un semn că ai nevoie de o pauză.",
            "id": "emotional_balance_l3_21_restoring_balance-screen-1"
          },
          {
            "kind": "content",
            "title": "Revenirea",
            "body": "O revenire începe cu cel mai mic gest: o respirație, o observare, o clipă de liniște.",
            "id": "emotional_balance_l3_21_restoring_balance-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Mic gest",
            "steps": [
              "Alege o zi în care ai pierdut echilibrul.",
              "Ce mic gest te-ar fi ajutat?"
            ],
            "helper": "Revenirea este un proces, nu un moment.",
            "id": "emotional_balance_l3_21_restoring_balance-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Cum revii la echilibru?",
            "question": "Ce este cel mai util?",
            "options": [
              "Să revii la un gest mic (respirație, notițe, protocol) și apoi să alegi răspunsul.",
              "Să te critici dur ca să nu repeți greșeala.",
              "Să ignori emoția și să te arunci într-un nou task."
            ],
            "correctIndex": 0,
            "explanation": "Revenirea reală vine dintr-un gest mic conștient care îți redeschide spațiul de alegere, nu din critică sau evitare.",
            "id": "emotional_balance_l3_21_restoring_balance-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O alegere pentru mine",
            "prompt": "Completează: „Când simt că mă pierd, pot începe prin ___.”",
            "id": "emotional_balance_l3_21_restoring_balance-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_22_presence_under_fire",
        "screens": [
          {
            "kind": "content",
            "title": "Prezența în momente grele",
            "body": "În tensiune mare, corpul vrea să accelereze. Prezența apare când încetinești doar un singur lucru: respirația, vocea, gestul.",
            "id": "emotional_balance_l3_22_presence_under_fire-screen-1"
          },
          {
            "kind": "content",
            "title": "În centru",
            "body": "Când rămâi în centru, nu ești împins de val, chiar dacă emoția este puternică.",
            "id": "emotional_balance_l3_22_presence_under_fire-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Un pas spre prezență",
            "steps": [
              "Alege o situație intensă.",
              "Observă ce ai putea încetini data viitoare."
            ],
            "helper": "Prezența vine prin încetinire.",
            "id": "emotional_balance_l3_22_presence_under_fire-screen-3"
          },
          {
            "kind": "protocol",
            "title": "Protocol scurt pentru momente intense",
            "body": "Repetă protocolul în versiunea scurtă (observ, respir, simt corpul, aleg răspunsul) când simți că totul se accelerează.",
            "id": "emotional_balance_l3_22_presence_under_fire-screen-4"
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
            "id": "emotional_balance_l3_22_presence_under_fire-screen-5"
          },
          {
            "kind": "reflection",
            "title": "Un anchor mic",
            "prompt": "Completează: „Când totul e intens, pot încetini ___.”",
            "id": "emotional_balance_l3_22_presence_under_fire-screen-6"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_23_centering",
        "screens": [
          {
            "kind": "content",
            "title": "Așezarea în tine",
            "body": "Centrarea nu este o tehnică. Este o revenire la un punct interior stabil.",
            "id": "emotional_balance_l3_23_centering-screen-1"
          },
          {
            "kind": "content",
            "title": "Trei respirații",
            "body": "Trei respirații lente sunt suficiente pentru a simți schimbarea.",
            "id": "emotional_balance_l3_23_centering-screen-2"
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
            "id": "emotional_balance_l3_23_centering-screen-3"
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
            "id": "emotional_balance_l3_23_centering-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un pas spre centru",
            "prompt": "Completează: „Mă pot centra rapid prin ___.”",
            "id": "emotional_balance_l3_23_centering-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_24_soft_strength",
        "screens": [
          {
            "kind": "content",
            "title": "Puterea blândă",
            "body": "Echilibrul emoțional nu este rigiditate. Este o formă blândă de forță care nu rănește și nu împinge.",
            "id": "emotional_balance_l3_24_soft_strength-screen-1"
          },
          {
            "kind": "content",
            "title": "Întreg",
            "body": "Când te simți întreg, răspunsurile tale sunt simple, clare și calme.",
            "id": "emotional_balance_l3_24_soft_strength-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă puterea ta",
            "steps": [
              "Adu-ți aminte un moment în care ai răspuns calm.",
              "Observă ce te-a ajutat atunci."
            ],
            "helper": "Puterea blândă se construiește.",
            "id": "emotional_balance_l3_24_soft_strength-screen-3"
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
            "id": "emotional_balance_l3_24_soft_strength-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție finală",
            "prompt": "Completează: „Pentru mine, puterea blândă înseamnă ___.”",
            "id": "emotional_balance_l3_24_soft_strength-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_13_body_to_mind",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul influențează intensitatea emoțiilor",
            "body": "Când glicemia este instabilă sau corpul este flămând ori tensionat, emoțiile devin mai puternice și mai greu de reglat. Nu este „slăbiciune”; este un răspuns fizic.",
            "id": "emotional_balance_l3_13_body_to_mind-screen-1"
          },
          {
            "kind": "content",
            "title": "Reacție sau realitate?",
            "body": "De multe ori, iritarea, furia sau anxietatea cresc pentru că organismul este în stare de alarmă metabolică.",
            "id": "emotional_balance_l3_13_body_to_mind-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la o perioadă în care ai reacționat disproporționat.",
              "Cum era corpul tău atunci? Flămând, obosit, deshidratat?"
            ],
            "helper": "Uneori emoțiile nu reflectă situația, ci starea corpului.",
            "id": "emotional_balance_l3_13_body_to_mind-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Corp și emoții",
            "question": "Ce poate amplifica emoțiile?",
            "options": [
              "Doar gândurile negative.",
              "Glicemia instabilă, foamea sau oboseala."
            ],
            "correctIndex": 1,
            "id": "emotional_balance_l3_13_body_to_mind-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Conștientizare",
            "prompt": "„O situație în care corpul mi-a amplificat emoțiile a fost ___.”",
            "id": "emotional_balance_l3_13_body_to_mind-screen-5"
          }
        ]
      },
      {
        "lessonId": "emotional_balance_l3_14_mind_to_body",
        "screens": [
          {
            "kind": "content",
            "title": "Emoțiile influențează corpul",
            "body": "Când ești stresat sau supărat, corpul intră în tensiune: respirația se scurtează, pulsul crește, digestia încetinește.",
            "id": "emotional_balance_l3_14_mind_to_body-screen-1"
          },
          {
            "kind": "content",
            "title": "Reglarea emoțiilor prin corp",
            "body": "O respirație lentă sau o mică mișcare poate reduce tensiunea și poate calma valul emoțional fără să forțezi nimic mental.",
            "id": "emotional_balance_l3_14_mind_to_body-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă",
            "steps": [
              "Gândește-te la ultimul moment de furie sau anxietate.",
              "Unde ai simțit tensiunea în corp?"
            ],
            "helper": "Emoțiile lăsate nesupravegheate rămân în corp.",
            "id": "emotional_balance_l3_14_mind_to_body-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Minte și corp",
            "question": "Cum poți calma o emoție ridicată?",
            "options": [
              "Doar prin analiză mentală.",
              "Prin reglarea corpului: respirație, relaxare, mișcare blândă."
            ],
            "correctIndex": 1,
            "id": "emotional_balance_l3_14_mind_to_body-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Integrare",
            "prompt": "„Un gest corporal care îmi calmează emoțiile este ___.”",
            "id": "emotional_balance_l3_14_mind_to_body-screen-5"
          }
        ]
      }
    ]
  },
  "focus_clarity": {
    "id": "focus_clarity",
    "title": "Claritate și Focus",
    "arcIntros": {
      "trezire": {
        "id": "focus_clarity_arc_01_trezire",
        "title": "Trezirea",
        "body": "Claritatea nu apare când forțezi mintea să decidă mai repede. Apare când încetinești suficient cât să vezi ce este important și ce este doar zgomot. În această primă etapă, înveți să observi fără să reacționezi imediat. Nu trebuie să schimbi tot. Este suficient să vezi mai clar ce se întâmplă în tine și în jurul tău."
      },
      "primele_ciocniri": {
        "id": "focus_clarity_arc_02_primele_ciocniri",
        "title": "Primele ciocniri",
        "body": "Când începi să aduci claritate, apar și ciocniri: sarcini care se bat cap în cap, presiune, întreruperi, oameni care vor lucruri diferite de la tine. Aici nu cauți perfecțiune. Cauți să recunoști mai repede momentele în care e prea mult și să revii la un singur punct de atenție, măcar pentru câteva minute."
      },
      "profunzime": {
        "id": "focus_clarity_arc_03_profunzime",
        "title": "Profunzime",
        "body": "Mai departe, observi că nu doar task-urile îți consumă atenția, ci și comparațiile, criticile interioare, așteptările nerealiste. Claritatea devine mai profundă când începi să vezi ce contează cu adevărat pentru tine și ce poți lăsa să treacă. Aici lucrezi cu valori și cu felul în care te raportezi la tine."
      },
      "maestrie": {
        "id": "focus_clarity_arc_04_maestrie",
        "title": "Maestrie",
        "body": "Maestria în claritate nu înseamnă să fii organizat perfect sau să nu mai fii distras niciodată. Înseamnă să știi să revii, din nou și din nou, la un singur pas clar. În viața de zi cu zi, asta înseamnă să alegi conștient ce faci acum, în loc să te lași împins de notificări, grabă sau presiune. Nu cauți control total, ci capacitatea de a folosi un mic protocol de claritate chiar și în zilele aglomerate."
      }
    },
    "lessons": [
      {
        "lessonId": "focus_clarity_l1_01_noise",
        "screens": [
          {
            "kind": "content",
            "title": "Zgomot exterior, zgomot interior",
            "body": "Mintea se umple ușor de zgomot: notificări, cereri, gânduri, griji. Când totul este amestecat, devine greu să știi ce vrei de fapt să faci.",
            "id": "focus_clarity_l1_01_noise-screen-1"
          },
          {
            "kind": "content",
            "title": "Un pas înapoi",
            "body": "Primul pas spre claritate nu este să rezolvi tot. Este să ieși un moment din amestec și să observi ce se întâmplă, fără să judeci.",
            "id": "focus_clarity_l1_01_noise-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la ultima jumătate de oră.",
              "Câte lucruri ți-au cerut atenția?"
            ],
            "helper": "Observarea este primul filtru.",
            "id": "focus_clarity_l1_01_noise-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Primul pas spre claritate",
            "question": "Ce este un prim pas sănătos spre claritate?",
            "options": [
              "Să rezolvi totul cât mai repede.",
              "Să observi ce se întâmplă, fără să judeci imediat.",
              "Să ignori complet tot ce se întâmplă."
            ],
            "correctIndex": 1,
            "explanation": "Nu poți clarifica ceva ce nu vezi.",
            "id": "focus_clarity_l1_01_noise-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție",
            "prompt": "Completează: „Mintea mea este plină acum în special de ___.”",
            "id": "focus_clarity_l1_01_noise-screen-5"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_02_single_point",
        "screens": [
          {
            "kind": "content",
            "title": "Un singur punct de atenție",
            "body": "Atenția se așază mai ușor pe un singur lucru. Când te împarți în prea multe direcții, oboseala și confuzia cresc.",
            "id": "focus_clarity_l1_02_single_point-screen-1"
          },
          {
            "kind": "content",
            "title": "Un lucru pe rând",
            "body": "Alege un singur lucru pentru câteva minute. Nu trebuie să fie cel mai important din viață. Doar să fie unic în acel moment.",
            "id": "focus_clarity_l1_02_single_point-screen-2"
          },
          {
            "kind": "protocol",
            "title": "Protocol de claritate (FOCUS)",
            "steps": [
              "Mă opresc câteva secunde.",
              "Aleg un singur punct de atenție.",
              "Fac două respirații lente.",
              "Îmi propun un pas mic și clar în direcția acelui punct."
            ],
            "id": "focus_clarity_l1_02_single_point-screen-3"
          },
          {
            "kind": "checkpoint",
            "title": "Aplicare",
            "steps": [
              "Gândește-te la 3 lucruri pe care le ai de făcut azi.",
              "Alege unul singur pentru următoarele 10 minute."
            ],
            "helper": "Claritatea începe cu un singur punct.",
            "id": "focus_clarity_l1_02_single_point-screen-4"
          },
          {
            "kind": "quiz",
            "title": "Atenția",
            "question": "Ce te ajută cel mai mult să îți adâncești atenția?",
            "options": [
              "Să lucrezi la mai multe lucruri în paralel.",
              "Să alegi un singur lucru pentru o perioadă scurtă.",
              "Să verifici constant notificările."
            ],
            "correctIndex": 1,
            "explanation": "Atenția profundă are nevoie de selecție, nu de dispersie.",
            "id": "focus_clarity_l1_02_single_point-screen-5"
          },
          {
            "kind": "reflection",
            "title": "Un punct clar",
            "prompt": "Completează: „Astăzi vreau să acord 10 minute doar pentru ___.”",
            "id": "focus_clarity_l1_02_single_point-screen-6"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_03_values",
        "screens": [
          {
            "kind": "content",
            "title": "Ce contează pentru tine",
            "body": "Claritatea nu este doar despre task-uri. Este și despre ce este important pentru tine. Când știi ce contează, devine mai ușor să spui „da” sau „nu”.",
            "id": "focus_clarity_l1_03_values-screen-1"
          },
          {
            "kind": "content",
            "title": "Trei lucruri importante",
            "body": "Gândește-te la trei lucruri care sunt cu adevărat importante pentru tine în această perioadă: oameni, proiecte, sănătate, învățare.",
            "id": "focus_clarity_l1_03_values-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Mic inventar",
            "steps": [
              "Alege trei lucruri importante pentru tine acum.",
              "Spune-le în minte pe nume."
            ],
            "helper": "Când au nume, deciziile devin mai ușoare.",
            "id": "focus_clarity_l1_03_values-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Claritate și valori",
            "question": "De ce ajută să știi ce este important pentru tine?",
            "options": [
              "Te încurcă în a lua decizii rapide.",
              "Te ajută să alegi mai ușor ce merită atenția ta.",
              "Nu are nicio legătură cu deciziile."
            ],
            "correctIndex": 1,
            "explanation": "Claritatea direcției vine din ceea ce contează pentru tine, nu doar din ce apare în fața ta.",
            "id": "focus_clarity_l1_03_values-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un lucru principal",
            "prompt": "Completează: „În perioada asta, un lucru important pentru mine este ___.”",
            "id": "focus_clarity_l1_03_values-screen-5"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_04_scatter",
        "screens": [
          {
            "kind": "content",
            "title": "Mintea împrăștiată",
            "body": "Când mintea sare continuu de la un lucru la altul, ești ocupat, dar nu neapărat eficient. Oboseala crește, claritatea scade.",
            "id": "focus_clarity_l1_04_scatter-screen-1"
          },
          {
            "kind": "content",
            "title": "Încetinire",
            "body": "Dacă reduci viteza cu puțin, apare mai mult spațiu de gândire. Claritatea are nevoie de un ritm care nu te strivește.",
            "id": "focus_clarity_l1_04_scatter-screen-2"
          },
          {
            "kind": "protocol",
            "title": "Protocol de claritate în mijlocul haosului",
            "steps": [
              "Observ că sar de la un lucru la altul.",
              "Aleg un singur lucru la care mă întorc.",
              "Respiri de două ori lent.",
              "Notez, mental sau pe hârtie, următorul pas concret."
            ],
            "id": "focus_clarity_l1_04_scatter-screen-3"
          },
          {
            "kind": "checkpoint",
            "title": "Observă ritmul",
            "steps": [
              "Observă cât de des îți verifici telefonul într-o oră.",
              "Observă între câte sarcini sari în 30 de minute."
            ],
            "helper": "Ritmul actual îți arată de ce e greu să te clarifici.",
            "id": "focus_clarity_l1_04_scatter-screen-4"
          },
          {
            "kind": "quiz",
            "title": "Ritm și claritate",
            "question": "Ce ajută claritatea într-o zi încărcată?",
            "options": [
              "Să crești viteza și mai mult.",
              "Să încetinești puțin și să revii la un singur lucru.",
              "Să te ocupi doar de ce strigă cel mai tare."
            ],
            "correctIndex": 1,
            "explanation": "Un ritm prea rapid îngustează atenția și reduce claritatea.",
            "id": "focus_clarity_l1_04_scatter-screen-5"
          },
          {
            "kind": "reflection",
            "title": "O ajustare mică",
            "prompt": "Completează: „Aș vrea să încetinesc un pic ritmul atunci când ___.”",
            "id": "focus_clarity_l1_04_scatter-screen-6"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_05_priorities",
        "screens": [
          {
            "kind": "content",
            "title": "Nu poți face totul la fel de bine",
            "body": "Dacă toate lucrurile sunt „prioritare”, niciunul nu mai este. Claritatea înseamnă să accepți că unele vor merge mai lent.",
            "id": "focus_clarity_l1_05_priorities-screen-1"
          },
          {
            "kind": "content",
            "title": "Primul, nu toate",
            "body": "Întreabă-te: „Care este un singur lucru care, dacă merge bine azi, mă ajută cel mai mult?”.",
            "id": "focus_clarity_l1_05_priorities-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Alegerea",
            "steps": [
              "Notează mental trei lucruri de făcut azi.",
              "Alege unul singur ca fiind „primul”."
            ],
            "helper": "Primul lucru clar reduce confuzia.",
            "id": "focus_clarity_l1_05_priorities-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Priorități",
            "question": "Ce descrie cel mai bine o prioritate?",
            "options": [
              "Orice lucru care apare în fața ta.",
              "Un lucru ales conștient, înaintea celorlalte.",
              "Ce îți cere primul mesaj din telefon."
            ],
            "correctIndex": 1,
            "explanation": "Prioritatea este o alegere, nu un reflex.",
            "id": "focus_clarity_l1_05_priorities-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Primul lucru",
            "prompt": "Completează: „Astăzi, prioritatea mea principală este ___.”",
            "id": "focus_clarity_l1_05_priorities-screen-5"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_06_inner_clutter",
        "screens": [
          {
            "kind": "content",
            "title": "Zgomot interior",
            "body": "Grijile, comparațiile și criticile interioare consumă atenția la fel de mult ca notificările și task-urile.",
            "id": "focus_clarity_l1_06_inner_clutter-screen-1"
          },
          {
            "kind": "content",
            "title": "O notă mai blândă",
            "body": "Când reduci tonul critic față de tine, mintea se liniștește și vede mai clar ce ai de făcut.",
            "id": "focus_clarity_l1_06_inner_clutter-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă vocea",
            "steps": [
              "Observă ce îți spui în minte când nu termini tot ce ți-ai propus.",
              "Întreabă-te: „Aș vorbi așa cu cineva drag mie?”."
            ],
            "helper": "Un ton mai blând eliberează spațiu mental.",
            "id": "focus_clarity_l1_06_inner_clutter-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Dialogul interior și claritatea",
            "question": "Cum influențează dialogul interior claritatea?",
            "options": [
              "Nu are niciun efect.",
              "Un dialog blând reduce zgomotul și îți dă mai multă energie de gândire.",
              "Critica dură te face automat mai clar."
            ],
            "correctIndex": 1,
            "explanation": "Claritatea are nevoie de spațiu, nu de atac.",
            "id": "focus_clarity_l1_06_inner_clutter-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O frază nouă",
            "prompt": "Completează: „Data viitoare când nu reușesc tot, pot să îmi spun: ___.”",
            "id": "focus_clarity_l1_06_inner_clutter-screen-5"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_07_planning_light",
        "screens": [
          {
            "kind": "content",
            "title": "Plan simplu",
            "body": "Un plan bun nu trebuie să fie complicat. Ai nevoie mai ales să știi ce faci acum și ce vine după.",
            "id": "focus_clarity_l1_07_planning_light-screen-1"
          },
          {
            "kind": "content",
            "title": "Structură ușoară",
            "body": "Poți folosi structura: acum – după – mai târziu. Doar trei pași simpli, fără detalii inutile.",
            "id": "focus_clarity_l1_07_planning_light-screen-2"
          },
          {
            "kind": "protocol",
            "title": "Protocol de planificare ușoară",
            "steps": [
              "Întreb: „Ce fac acum?” și numesc un singur lucru.",
              "Întreb: „Ce vine după?” și aleg un pas realist.",
              "Întreb: „Ce poate aștepta mai târziu?” și accept că nu le fac pe toate acum."
            ],
            "id": "focus_clarity_l1_07_planning_light-screen-3"
          },
          {
            "kind": "checkpoint",
            "title": "Mic plan",
            "steps": [
              "Alege o sarcină din ziua de azi.",
              "Împarte-o în: acum, după, mai târziu."
            ],
            "helper": "Planul simplu păstrează claritatea și energia.",
            "id": "focus_clarity_l1_07_planning_light-screen-4"
          },
          {
            "kind": "quiz",
            "title": "Planificare",
            "question": "Ce este util într-un plan simplu?",
            "options": [
              "Să aibă zeci de detalii și scenarii.",
              "Să aibă pași clari: acum, după, mai târziu.",
              "Să rămână doar în minte, fără să fie formulat clar."
            ],
            "correctIndex": 1,
            "explanation": "Claritatea vine din pași simpli și concreți, nu din complexitate.",
            "id": "focus_clarity_l1_07_planning_light-screen-5"
          },
          {
            "kind": "reflection",
            "title": "Un pas clar",
            "prompt": "Completează: „Pasul meu ‘acum’ pentru un lucru important este ___.”",
            "id": "focus_clarity_l1_07_planning_light-screen-6"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l1_08_daily_reset",
        "screens": [
          {
            "kind": "content",
            "title": "Reset zilnic",
            "body": "La finalul zilei, mintea poate rămâne blocată pe ce nu ai făcut. Un reset scurt aduce ordine și îți protejează energia.",
            "id": "focus_clarity_l1_08_daily_reset-screen-1"
          },
          {
            "kind": "content",
            "title": "Trei întrebări",
            "body": "La final de zi, poți să te întrebi: „Ce a mers bine azi?”, „Ce pot îmbunătăți?”, „Care este un lucru important pentru mâine?”.",
            "id": "focus_clarity_l1_08_daily_reset-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Privire înapoi",
            "steps": [
              "Răspunde mental la cele trei întrebări pentru ziua de azi sau pentru ieri."
            ],
            "helper": "Aceasta este o închidere, nu un proces-verbal de critică.",
            "id": "focus_clarity_l1_08_daily_reset-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Rolul resetului",
            "question": "Ce rol are resetul zilnic?",
            "options": [
              "Să te critici pentru tot ce nu ai făcut.",
              "Să îți așeze mintea și să îți clarifice direcția pentru mâine.",
              "Să adaugi și mai multe lucruri pe listă."
            ],
            "correctIndex": 1,
            "explanation": "Un reset scurt eliberează spațiu și îți dă o direcție clară.",
            "id": "focus_clarity_l1_08_daily_reset-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O intenție pentru mâine",
            "prompt": "Completează: „Mâine aș vrea să acord atenție în special la ___.”",
            "id": "focus_clarity_l1_08_daily_reset-screen-5"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l3_13_body_to_mind",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul influențează focusul",
            "body": "Atunci când ești flămând, deshidratat sau ai glicemia oscilantă, creierul prioritizează supraviețuirea, nu atenția.",
            "id": "focus_clarity_l3_13_body_to_mind-screen-1"
          },
          {
            "kind": "content",
            "title": "Stabilitate metabolică = claritate",
            "body": "Două mese stabile și o hidratare minimă susțin focusul mai mult decât motivația pură.",
            "id": "focus_clarity_l3_13_body_to_mind-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la ultimul moment în care nu te puteai concentra.",
              "Cum era corpul tău atunci?"
            ],
            "helper": "Focusul începe în corp.",
            "id": "focus_clarity_l3_13_body_to_mind-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Claritate și corp",
            "question": "Ce ajută cel mai mult focusul?",
            "options": [
              "Să sari peste mese.",
              "Un corp stabil: hrană, hidratare, respirație."
            ],
            "correctIndex": 1,
            "id": "focus_clarity_l3_13_body_to_mind-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Reglați",
            "prompt": "„Un gest mic care îmi îmbunătățește focusul este ___.”",
            "id": "focus_clarity_l3_13_body_to_mind-screen-5"
          }
        ]
      },
      {
        "lessonId": "focus_clarity_l3_14_mind_to_body",
        "screens": [
          {
            "kind": "content",
            "title": "Mintea influențează tensiunea corporală",
            "body": "Gândurile grăbite, anxioase sau critique cresc tensiunea musculară și scurtează respirația, reducând claritatea.",
            "id": "focus_clarity_l3_14_mind_to_body-screen-1"
          },
          {
            "kind": "content",
            "title": "Atenție și relaxare",
            "body": "Când îți domolești ritmul mental, corpul răspunde cu relaxare, iar focusul revine.",
            "id": "focus_clarity_l3_14_mind_to_body-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Observă cum respiră corpul tău când ești foarte încărcat mental."
            ],
            "helper": "Mintea tensionată creează corp tensionat.",
            "id": "focus_clarity_l3_14_mind_to_body-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Minte → corp",
            "question": "Ce se întâmplă când gândurile se accelerează?",
            "options": [
              "Corpul se relaxează.",
              "Corpul intră în tensiune și focusul scade."
            ],
            "correctIndex": 1,
            "id": "focus_clarity_l3_14_mind_to_body-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un gest mental",
            "prompt": "„Un gând sau o frază care îmi calmează corpul este ___.”",
            "id": "focus_clarity_l3_14_mind_to_body-screen-5"
          }
        ]
      }
    ]
  },
  "relationships_communication": {
    "id": "relationships_communication",
    "title": "Relații și Comunicare",
    "arcIntros": {
      "trezire": {
        "id": "relationships_communication_arc_01_trezire",
        "title": "Trezirea",
        "body": "Relațiile nu se schimbă prin forță sau argumente perfecte. Se schimbă atunci când ești dispus să vezi ce se întâmplă cu adevărat între tine și celălalt. În această etapă, înveți să observi tonul, ritmul și reacțiile tale, fără să sari imediat la apărare sau critică. Claritatea în comunicare începe cu o privire calmă spre propriile impulsuri."
      },
      "primele_ciocniri": {
        "id": "relationships_communication_arc_02_primele_ciocniri",
        "title": "Primele Ciocniri",
        "body": "Când începi să comunica mai conștient, apar inevitabil ciocniri: tensiuni, neînțelegeri, diferențe de stil. Aici nu urmărești să câștigi, ci să rămâi prezent. Înveți să recunoști momentul în care te încordezi, momentul în care ridici tonul, momentul în care mintea îți sare în defensivă. Comunicarea matură începe atunci când observi acele clipe fără să le lași să te conducă."
      },
      "profunzime": {
        "id": "relationships_communication_arc_03_profunzime",
        "title": "Profunzime",
        "body": "Pe măsură ce pășești mai adânc, vezi că nu doar cuvintele contează, ci și ce porți în tine: vechi obișnuințe, teamă de respingere, rușine, dorința de a fi înțeles. Aici înveți să exprimi ceea ce simți cu calm și sinceritate. Descoperi că apropierea reală apare atunci când spui lucruri simple: „Asta simt acum”, „Asta am nevoie”, fără acuză, fără mască."
      },
      "maestrie": {
        "id": "relationships_communication_arc_04_maestrie",
        "title": "Maestrie",
        "body": "Maestria în relații nu înseamnă să vorbești impecabil sau să ai mereu răspunsurile potrivite. Înseamnă să știi să revii la calmul interior în mijlocul tensiunilor. Să poți asculta chiar și atunci când e greu. Să pui limite fără agresivitate. Să recunoști un impuls, să respiri, și să alegi un răspuns care nu rănește nici pe tine, nici pe celălalt. Este puterea de a rămâne deschis fără să te pierzi."
      }
    },
    "lessons": [
      {
        "lessonId": "relationships_communication_protocol",
        "screens": [
          {
            "kind": "protocol",
            "title": "Protocol de comunicare calmă",
            "steps": [
              "Observ impulsul: tensiune, ton ridicat, grăbire.",
              "Respir lent de două ori și las umerii să coboare.",
              "Formulez în minte: „Ce simt? Ce vreau să transmit?”",
              "Aleg un răspuns clar și blând, fără atac, fără apărare."
            ],
            "id": "relationships_communication_protocol-screen-1"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l1_01_listening",
        "screens": [
          {
            "kind": "content",
            "title": "Ascultare reală",
            "body": "Ascultarea nu începe cu cuvintele celuilalt, ci cu liniștea din tine. Asta te ajută să nu sari imediat la apărare sau soluții.",
            "id": "relationships_communication_l1_01_listening-screen-1"
          },
          {
            "kind": "content",
            "title": "A primi, nu a repara",
            "body": "În comunicare, oamenii caută mai întâi să fie primiți, nu reparați. Să simtă că sunt văzuți.",
            "id": "relationships_communication_l1_01_listening-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă",
            "steps": [
              "Adu-ți aminte o conversație recentă.",
              "A fost mai multă ascultare sau explicație?"
            ],
            "helper": "O bună ascultare reduce tensiunea înainte să apară.",
            "id": "relationships_communication_l1_01_listening-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Ce este ascultarea?",
            "question": "Ce descrie cel mai bine ascultarea reală?",
            "options": [
              "Să aștepți rândul să vorbești.",
              "Să lași spațiu și să primești ce spune celălalt.",
              "Să pregătești rapid soluția corectă."
            ],
            "correctIndex": 1,
            "explanation": "Ascultarea liniștește relația înainte de cuvinte.",
            "id": "relationships_communication_l1_01_listening-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O frază",
            "prompt": "Completează: „Într-o conversație grea, vreau să ascult mai mult prin ___.”",
            "id": "relationships_communication_l1_01_listening-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l1_02_tone",
        "screens": [
          {
            "kind": "content",
            "title": "Tonul deschide sau închide",
            "body": "O propoziție calmă poate opri un conflict. Aceeași propoziție, spusă cu asprime, îl aprinde.",
            "id": "relationships_communication_l1_02_tone-screen-1"
          },
          {
            "kind": "content",
            "title": "Tonul transmite intenția",
            "body": "În multe situații, oamenii nu reacționează la cuvinte, ci la ton.",
            "id": "relationships_communication_l1_02_tone-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Amintește-ți o situație tensionată.",
              "Ce ai transmis prin tonul tău?"
            ],
            "helper": "Tonul e primul limbaj în relații.",
            "id": "relationships_communication_l1_02_tone-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Rolul tonului",
            "question": "De ce contează tonul?",
            "options": [
              "Pentru că schimbă complet mesajul.",
              "Pentru că e doar un detaliu tehnic.",
              "Nu are nicio influență."
            ],
            "correctIndex": 0,
            "explanation": "Tonul modelează felul în care este primit mesajul.",
            "id": "relationships_communication_l1_02_tone-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ajustare",
            "prompt": "Completează: „Când simt tensiune, pot să îmi cobor tonul prin ___.”",
            "id": "relationships_communication_l1_02_tone-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l1_03_pause",
        "screens": [
          {
            "kind": "content",
            "title": "Pauza calmă",
            "body": "O secundă de pauză poate preveni un conflict de o oră. Pauza îți oferă timp să alegi.",
            "id": "relationships_communication_l1_03_pause-screen-1"
          },
          {
            "kind": "protocol",
            "title": "Protocol de comunicare calmă",
            "steps": [
              "Observ impulsul: tensiune sau grabă.",
              "Respir lent de două ori.",
              "Clarific: „Ce vreau să transmit?”",
              "Aleg un răspuns blând."
            ],
            "id": "relationships_communication_l1_03_pause-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Amintește-ți",
            "steps": [
              "Gândește-te la ultima oară când ai fi avut nevoie de o pauză scurtă."
            ],
            "helper": "Pauza nu este slăbiciune; este control.",
            "id": "relationships_communication_l1_03_pause-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Pauză vs reacție",
            "question": "Ce permite o pauză scurtă?",
            "options": [
              "Să ripostezi mai eficient.",
              "Să alegi răspunsul în locul impulsului.",
              "Să eviți orice conversație."
            ],
            "correctIndex": 1,
            "explanation": "Pauza îți oferă spațiu interior pentru a alege și reduce reacția impulsivă.",
            "id": "relationships_communication_l1_03_pause-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Pauza mea",
            "prompt": "Completează: „Vreau să folosesc o pauză scurtă atunci când ___.”",
            "id": "relationships_communication_l1_03_pause-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l1_04_honesty",
        "screens": [
          {
            "kind": "content",
            "title": "Sinceritate calmă",
            "body": "Sinceritatea nu trebuie să fie tăioasă. Poți spune adevărul fără să distrugi relația.",
            "id": "relationships_communication_l1_04_honesty-screen-1"
          },
          {
            "kind": "content",
            "title": "Spune ce simți, nu ce acuză",
            "body": "Când spui ce simți, deschizi. Când acuzi, închizi.",
            "id": "relationships_communication_l1_04_honesty-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Gândește-te",
            "steps": [
              "Adu-ți aminte o conversație dificilă.",
              "Ai exprimat ceea ce simți sau ai acuzat?"
            ],
            "helper": "Emoțiile sincere apropie mai mult decât critica.",
            "id": "relationships_communication_l1_04_honesty-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Sinceritate vs acuză",
            "question": "Ce ajută o comunicare matură?",
            "options": [
              "Să spui direct ce te enervează la celălalt.",
              "Să exprimi ce simți fără a ataca.",
              "Să eviți tot ce este dificil."
            ],
            "correctIndex": 1,
            "explanation": "Sinceritatea fără acuză scade defensiva și păstrează relația deschisă.",
            "id": "relationships_communication_l1_04_honesty-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O frază sinceră",
            "prompt": "Completează: „Aș putea spune mai des: ‘Simt ___ când se întâmplă asta.’”",
            "id": "relationships_communication_l1_04_honesty-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l2_05_boundaries",
        "screens": [
          {
            "kind": "content",
            "title": "Limite liniștite",
            "body": "O limită bună protejează, nu pedepsește. Spui ce e potrivit pentru tine fără atac.",
            "id": "relationships_communication_l2_05_boundaries-screen-1"
          },
          {
            "kind": "content",
            "title": "Limita stabilește spațiul",
            "body": "Ea spune: „Asta e în regulă pentru mine, asta nu.”",
            "id": "relationships_communication_l2_05_boundaries-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Identificare",
            "steps": [
              "Gândește-te la o situație în care ai spus „da”, deși simțeai „nu”."
            ],
            "helper": "O limită bună previne conflictul, nu îl creează.",
            "id": "relationships_communication_l2_05_boundaries-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Limitele",
            "question": "Ce este o limită sănătoasă?",
            "options": [
              "O formă de control asupra celuilalt.",
              "O clarificare liniștită a ce este potrivit pentru tine.",
              "O metodă de a evita discuțiile."
            ],
            "correctIndex": 1,
            "explanation": "Limitele clare protejează relația și clarifică ce este potrivit pentru tine.",
            "id": "relationships_communication_l2_05_boundaries-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un „nu” calm",
            "prompt": "Completează: „Aș vrea să pun o limită calmă în situația ___.”",
            "id": "relationships_communication_l2_05_boundaries-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l2_06_conflict",
        "screens": [
          {
            "kind": "content",
            "title": "Conflictul nu este un eșec",
            "body": "Un conflict poate apropia două persoane dacă este gestionat cu calm.",
            "id": "relationships_communication_l2_06_conflict-screen-1"
          },
          {
            "kind": "protocol",
            "title": "Protocol în conflict",
            "steps": [
              "Observ impulsul de a ridica tonul.",
              "Respir lent de două ori.",
              "Formulez un mesaj clar și scurt.",
              "Ascult 10 secunde înainte să răspund."
            ],
            "id": "relationships_communication_l2_06_conflict-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Care este impulsul tău principal într-un conflict: atac, retragere sau grabă?"
            ],
            "helper": "Impulsul recunoscut își pierde forța.",
            "id": "relationships_communication_l2_06_conflict-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Conflict sănătos",
            "question": "Ce este esențial într-un conflict matur?",
            "options": [
              "Să câștigi.",
              "Să rămâi prezent și calm.",
              "Să demonstrezi că ai dreptate."
            ],
            "correctIndex": 1,
            "explanation": "Calmul și prezența transformă conflictul într-un dialog util.",
            "id": "relationships_communication_l2_06_conflict-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O alegere",
            "prompt": "Completează: „Într-un conflict, vreau să rămân prezent prin ___.”",
            "id": "relationships_communication_l2_06_conflict-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l2_07_clarity",
        "screens": [
          {
            "kind": "content",
            "title": "Clarificările scurte",
            "body": "Multe conflicte prelungite pot fi rezolvate cu două fraze clare.",
            "id": "relationships_communication_l2_07_clarity-screen-1"
          },
          {
            "kind": "content",
            "title": "Ce vreau să transmit?",
            "body": "Când nu știi asta, discuția devine un labirint.",
            "id": "relationships_communication_l2_07_clarity-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Clarificare",
            "steps": [
              "Formulează în minte un mesaj simplu despre o situație dificilă."
            ],
            "helper": "Claritatea scurtează tensiunea.",
            "id": "relationships_communication_l2_07_clarity-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Claritate",
            "question": "Ce aduce o clarificare scurtă?",
            "options": [
              "Grăbire.",
              "Spațiu.",
              "Confuzie."
            ],
            "correctIndex": 1,
            "explanation": "Când clarifici, reduci confuzia și emoția scade.",
            "id": "relationships_communication_l2_07_clarity-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție clară",
            "prompt": "Completează: „Ceea ce vreau să transmit este ___.”",
            "id": "relationships_communication_l2_07_clarity-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l2_08_hurt",
        "screens": [
          {
            "kind": "content",
            "title": "Calm când doare",
            "body": "A vorbi calm când ești rănit este un act de maturitate, nu de slăbiciune.",
            "id": "relationships_communication_l2_08_hurt-screen-1"
          },
          {
            "kind": "content",
            "title": "Emoția nu e vinovată",
            "body": "Poți simți intens și totuși să comunici liniștit.",
            "id": "relationships_communication_l2_08_hurt-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Identifică o situație recentă în care te-ai simțit rănit."
            ],
            "helper": "Nu e nevoie să ascunzi emoția; doar să nu vorbești prin ea.",
            "id": "relationships_communication_l2_08_hurt-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Calm în emoții",
            "question": "Ce ajută cel mai mult?",
            "options": [
              "Să acoperi emoția.",
              "Să respiri și să exprimi ce simți fără acuză.",
              "Să eviți subiectul."
            ],
            "correctIndex": 1,
            "explanation": "Un moment de calm îți permite să răspunzi, nu să reacționezi.",
            "id": "relationships_communication_l2_08_hurt-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O frază calmă",
            "prompt": "Completează: „Data viitoare pot spune: ‘Simt ___, dar vreau să înțeleg.’”",
            "id": "relationships_communication_l2_08_hurt-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l3_09_vulnerability",
        "screens": [
          {
            "kind": "content",
            "title": "Vulnerabilitatea matură",
            "body": "Vulnerabilitatea nu este expunere necontrolată. Este alegerea calmă de a spune ce e adevărat.",
            "id": "relationships_communication_l3_09_vulnerability-screen-1"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Care este o emoție pe care o ascunzi de obicei în discuții?"
            ],
            "helper": "Ce ascunzi cel mai mult cere cel mai mult spațiu.",
            "id": "relationships_communication_l3_09_vulnerability-screen-2"
          },
          {
            "kind": "quiz",
            "title": "Vulnerabilitate",
            "question": "Ce este vulnerabilitatea sănătoasă?",
            "options": [
              "A spune totul în orice moment.",
              "A exprima cu claritate ce simți, fără dramă și fără acuză.",
              "A evita orice emoție."
            ],
            "correctIndex": 1,
            "explanation": "Vulnerabilitatea sănătoasă exprimă ce simți fără a cere salvare.",
            "id": "relationships_communication_l3_09_vulnerability-screen-3"
          },
          {
            "kind": "reflection",
            "title": "Un pas mic",
            "prompt": "Completează: „Pot fi vulnerabil(ă) într-un mod calm atunci când ___.”",
            "id": "relationships_communication_l3_09_vulnerability-screen-4"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l3_10_repair",
        "screens": [
          {
            "kind": "content",
            "title": "Reparare liniștită",
            "body": "În orice relație apar rupturi. Reparația este cea care păstrează legătura.",
            "id": "relationships_communication_l3_10_repair-screen-1"
          },
          {
            "kind": "content",
            "title": "Două fraze simple",
            "body": "„Îmi pare rău pentru partea mea.” „Vreau să înțeleg ce ai simțit.”",
            "id": "relationships_communication_l3_10_repair-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Reflectare",
            "steps": [
              "Adu-ți aminte o situație nerezolvată.",
              "Ce ai putea spune pentru a restabili legătura?"
            ],
            "helper": "Reparația cere curaj blând.",
            "id": "relationships_communication_l3_10_repair-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Reparare",
            "question": "Ce ajută reparația?",
            "options": [
              "Să ignori ce s-a întâmplat.",
              "Să asculți și să-ți asumi partea ta.",
              "Să repeți cine are dreptate."
            ],
            "correctIndex": 1,
            "explanation": "Reparația reală recunoaște impactul și oferă un pas concret acum.",
            "id": "relationships_communication_l3_10_repair-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O propoziție de reparare",
            "prompt": "Completează: „Aș putea începe cu: ‘Îmi pare rău pentru ___.’”",
            "id": "relationships_communication_l3_10_repair-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l3_11_stay_open",
        "screens": [
          {
            "kind": "content",
            "title": "Deschidere matură",
            "body": "A fi deschis nu înseamnă să lași totul să treacă. Înseamnă să fii receptiv fără a renunța la tine.",
            "id": "relationships_communication_l3_11_stay_open-screen-1"
          },
          {
            "kind": "checkpoint",
            "title": "Clarifică",
            "steps": [
              "Ce situație te face să te închizi?"
            ],
            "helper": "Deschiderea calmă este o alegere, nu o obligație.",
            "id": "relationships_communication_l3_11_stay_open-screen-2"
          },
          {
            "kind": "quiz",
            "title": "Deschidere",
            "question": "Ce înseamnă deschiderea sănătoasă?",
            "options": [
              "Să accepți tot, oricând.",
              "Să fii prezent fără să renunți la limitele tale.",
              "Să nu îți exprimi niciodată emoțiile."
            ],
            "correctIndex": 1,
            "explanation": "Deschiderea sănătoasă înseamnă să rămâi prezent și curios, nu să te expui haotic.",
            "id": "relationships_communication_l3_11_stay_open-screen-3"
          },
          {
            "kind": "reflection",
            "title": "O alegere calmă",
            "prompt": "Completează: „Pot rămâne deschis(ă) și totuși stabil(ă) atunci când ___.”",
            "id": "relationships_communication_l3_11_stay_open-screen-4"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l3_12_connection",
        "screens": [
          {
            "kind": "content",
            "title": "Conexiune autentică",
            "body": "Conexiunea reală apare când doi oameni sunt sinceri fără a fi aspri și prezenți fără a controla.",
            "id": "relationships_communication_l3_12_connection-screen-1"
          },
          {
            "kind": "content",
            "title": "A vedea și a fi văzut",
            "body": "Uneori, singurul lucru de care ai nevoie este să fii văzut calm, nu rezolvat.",
            "id": "relationships_communication_l3_12_connection-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Cine este o persoană cu care vrei o relație mai calmă?"
            ],
            "helper": "Conexiunea începe cu intenție.",
            "id": "relationships_communication_l3_12_connection-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Conexiune",
            "question": "Ce întărește conexiunea cel mai mult?",
            "options": [
              "Controlul și insistența.",
              "Prezența calmă și sinceră.",
              "Evitarea discuțiilor grele."
            ],
            "correctIndex": 1,
            "explanation": "Conexiunea crește prin prezență calmă și gesturi mici, nu prin control.",
            "id": "relationships_communication_l3_12_connection-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O intenție",
            "prompt": "Completează: „Vreau să fiu mai prezent(ă) în relația cu ___.”",
            "id": "relationships_communication_l3_12_connection-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l3_13_body_to_mind",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul influențează tonul",
            "body": "Foamea, oboseala și tensiunea scad empatia și cresc reactivitatea. Nu este „doar personalitate”; este și biochimie.",
            "id": "relationships_communication_l3_13_body_to_mind-screen-1"
          },
          {
            "kind": "content",
            "title": "Corp reglat = ton calm",
            "body": "O respirație lentă, o gură de apă sau o gustare mică pot reduce impulsivitatea verbală.",
            "id": "relationships_communication_l3_13_body_to_mind-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la o discuție în care ai reacționat prea tăios.",
              "Cum era corpul tău în acel moment?"
            ],
            "helper": "Corpul tău era probabil în stare de alertă.",
            "id": "relationships_communication_l3_13_body_to_mind-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Corp & comunicare",
            "question": "Ce susține comunicarea calmă?",
            "options": [
              "Să ignori corpul complet.",
              "Un corp stabil și regulat metabolic."
            ],
            "correctIndex": 1,
            "id": "relationships_communication_l3_13_body_to_mind-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Pregătire",
            "prompt": "„Înainte de o discuție importantă, mă ajută dacă ___.”",
            "id": "relationships_communication_l3_13_body_to_mind-screen-5"
          }
        ]
      },
      {
        "lessonId": "relationships_communication_l3_14_mind_to_body",
        "screens": [
          {
            "kind": "content",
            "title": "Comunicare → tensiune corporală",
            "body": "Confruntările și neînțelegerile aprind sistemul nervos: umeri ridicați, stomac încordat, respirație scurtă.",
            "id": "relationships_communication_l3_14_mind_to_body-screen-1"
          },
          {
            "kind": "content",
            "title": "Calmul verbal calmează corpul",
            "body": "Când alegi un ton mai lent și mai clar, corpul răspunde cu relaxare, chiar dacă subiectul rămâne dificil.",
            "id": "relationships_communication_l3_14_mind_to_body-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Observă cum reacționează corpul la tonul tău propriu într-o discuție tensionată."
            ],
            "helper": "Comunicarea nu e doar mentală, ci și fizică.",
            "id": "relationships_communication_l3_14_mind_to_body-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Tonul și corpul",
            "question": "Ce liniștește corpul în comunicare?",
            "options": [
              "Graba și tonul ridicat.",
              "Ritmul lent, tonul calm și pauzele scurte."
            ],
            "correctIndex": 1,
            "id": "relationships_communication_l3_14_mind_to_body-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Micro-reglare",
            "prompt": "„Un gest care îmi relaxează corpul în conversații este ___.”",
            "id": "relationships_communication_l3_14_mind_to_body-screen-5"
          }
        ]
      }
    ]
  },
  "energy_body": {
    "id": "energy_body",
    "title": "Energie & Corp",
    "arcIntros": {
      "trezire": {
        "id": "energy_body_arc_01_trezire",
        "title": "Trezirea",
        "body": "Energia ta nu este doar o chestiune de voință. Corpul îți trimite semnale tot timpul: oboseală, agitație, tensiune, claritate. În această etapă, înveți să le vezi ca mesaje, nu ca probleme. Trezirea nu înseamnă să devii perfect, ci să începi să observi ce îți spune corpul în loc să îl forțezi să tacă."
      },
      "primele_ciocniri": {
        "id": "energy_body_arc_02_primele_ciocniri",
        "title": "Primele Ciocniri",
        "body": "Când începi să îți respecți energia, te lovești de obiceiuri vechi: nopți lungi, ecrane până târziu, mese sărite, mișcare puțină. Aici nu cauți să schimbi totul dintr-odată. Înveți să recunoști momentele în care corpul spune „ajunge” și să faci o singură alegere mai bună, nu zece deodată."
      },
      "profunzime": {
        "id": "energy_body_arc_03_profunzime",
        "title": "Profunzime",
        "body": "Mai adânc de oboseală sau agitație stau ritmurile tale reale: cum respiri, cum dormi, cum te miști, cum mănânci. În această etapă, descoperi că energia nu vine doar din odihnă, ci și din felul în care îți tratezi corpul de-a lungul zilei. Înveți să îți asculți limitele și să le accepți fără rușine."
      },
      "maestrie": {
        "id": "energy_body_arc_04_maestrie",
        "title": "Maestrie",
        "body": "Maestria în energie nu înseamnă să fii mereu plin de forță. Înseamnă să știi să te reglezi: să revii la un ritm sănătos după stres, să îți protejezi somnul, să introduci mișcare și respirație conștientă în zilele aglomerate. Nu urmărești control total, ci capacitatea de a folosi câteva ritualuri simple, chiar și atunci când viața nu te menajează."
      }
    },
    "lessons": [
      {
        "lessonId": "energy_body_protocol",
        "screens": [
          {
            "kind": "protocol",
            "title": "Protocol scurt de resetare a energiei",
            "steps": [
              "Observ ce simt în corp: oboseală, agitație, tensiune.",
              "Respir lent de două ori (inspir numărând până la 4, expir până la 6).",
              "Relaxez umerii și îmi simt tălpile pe podea sau contactul cu scaunul.",
              "Aleg un pas mic: mă ridic, mă întind, beau apă sau iau o pauză de 1 minut."
            ],
            "id": "energy_body_protocol-screen-1"
          }
        ]
      },
      {
        "lessonId": "energy_body_l1_01_signals",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul vorbește",
            "body": "Corpul vorbește prin semnale simple: greutate în cap, ochi obosiți, încordare în ceafă, agitație în piept, stomac strâns. De multe ori le ignori până când nu mai poți.",
            "id": "energy_body_l1_01_signals-screen-1"
          },
          {
            "kind": "content",
            "title": "Semnale, nu defecte",
            "body": "Aceste semnale nu spun că e ceva „greșit” cu tine. Ele spun doar: „Am nevoie de alt ritm acum.”",
            "id": "energy_body_l1_01_signals-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la ziua de azi sau de ieri.",
              "Ce semnal ți-a trimis corpul cel mai des?"
            ],
            "helper": "Semnalele repetate îți arată unde îți consumi energia.",
            "id": "energy_body_l1_01_signals-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Semnale de energie",
            "question": "Ce este cel mai sănătos mod de a privi semnalele corpului?",
            "options": [
              "Ca pe defecte pe care trebuie să le ignori.",
              "Ca pe mesaje despre nevoile tale de energie și ritm.",
              "Ca pe dovezi că ești mai slab decât alții."
            ],
            "correctIndex": 1,
            "explanation": "Semnalele sunt informații, nu verdicte.",
            "id": "energy_body_l1_01_signals-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un semnal",
            "prompt": "Completează: „Un semnal pe care îl ignor des este ___.”",
            "id": "energy_body_l1_01_signals-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l1_02_breath",
        "screens": [
          {
            "kind": "content",
            "title": "Respirația și energia",
            "body": "Respirația este puntea dintre corp și minte. Când e scurtă și grăbită, corpul crede că ești în pericol. Când e mai lungă și mai lentă, transmite siguranță.",
            "id": "energy_body_l1_02_breath-screen-1"
          },
          {
            "kind": "content",
            "title": "Două respirații conștiente",
            "body": "Nu ai nevoie de tehnici complicate. Două respirații lente pot schimba modul în care te simți pentru câteva momente.",
            "id": "energy_body_l1_02_breath-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Experiment",
            "steps": [
              "Inspiră numărând până la 4.",
              "Expiră numărând până la 6.",
              "Repetă de două ori."
            ],
            "helper": "Observă dacă tensiunea scade măcar puțin.",
            "id": "energy_body_l1_02_breath-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Rolul respirației",
            "question": "Ce face o respirație lentă?",
            "options": [
              "Îți crește automat pulsul.",
              "Trimite corpului semnalul că este puțin mai în siguranță.",
              "Nu are niciun efect real."
            ],
            "correctIndex": 1,
            "explanation": "Respirația este unul dintre cele mai rapide moduri de reglare a energiei.",
            "id": "energy_body_l1_02_breath-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un moment pentru respirație",
            "prompt": "Completează: „Aș putea folosi două respirații lente înainte de ___.”",
            "id": "energy_body_l1_02_breath-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l1_03_posture",
        "screens": [
          {
            "kind": "content",
            "title": "Postură și tensiune",
            "body": "Felul în care stai îți influențează energia. O postură prăbușită îți poate accentua oboseala și lipsa de chef. O postură ușor deschisă, fără rigiditate, îți dă puțin mai mult aer.",
            "id": "energy_body_l1_03_posture-screen-1"
          },
          {
            "kind": "content",
            "title": "Mică ajustare",
            "body": "Nu trebuie să stai „perfect”. E suficient să te ridici puțin din umeri, să îți lași pieptul să se deschidă și să simți spatele susținut.",
            "id": "energy_body_l1_03_posture-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă acum",
            "steps": [
              "Observă cum stai chiar în acest moment.",
              "Fă o ajustare mică: îndreaptă coloana ușor, relaxează umerii."
            ],
            "helper": "Schimbările mici de postură schimbă modul în care circulă energia.",
            "id": "energy_body_l1_03_posture-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Postura",
            "question": "Ce este realist să cauți în postură?",
            "options": [
              "Perfecțiune rigidă.",
              "O poziție un pic mai deschisă și mai relaxată.",
              "Să nu te miști deloc."
            ],
            "correctIndex": 1,
            "explanation": "O postură ușor deschisă reduce tensiunea și lasă energia să circule, fără rigiditate.",
            "id": "energy_body_l1_03_posture-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O ajustare frecventă",
            "prompt": "Completează: „Aș putea să îmi ajustez postura de fiecare dată când ___.”",
            "id": "energy_body_l1_03_posture-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l1_04_microbreaks",
        "screens": [
          {
            "kind": "content",
            "title": "Pauze mici, efect mare",
            "body": "Energia nu se pierde doar în maratoane de lucru. Se pierde și atunci când nu iei nicio pauză mică, ore în șir.",
            "id": "energy_body_l1_04_microbreaks-screen-1"
          },
          {
            "kind": "content",
            "title": "Pauza de un minut",
            "body": "O pauză de un minut nu îți strică fluxul. Îl protejează. Te ajută să revii mai clar și mai prezent.",
            "id": "energy_body_l1_04_microbreaks-screen-2"
          },
          {
            "kind": "protocol",
            "title": "Protocol scurt de resetare a energiei",
            "steps": [
              "Observ ce simt în corp.",
              "Respir lent de două ori.",
              "Mă ridic sau îmi mișc ușor corpul.",
              "Aleg ce fac în următoarele 10 minute."
            ],
            "id": "energy_body_l1_04_microbreaks-screen-3"
          },
          {
            "kind": "checkpoint",
            "title": "Unde lipsesc pauzele?",
            "steps": [
              "Gândește-te la o parte din zi în care trec ore fără nicio pauză."
            ],
            "helper": "Acolo se scurge o mare parte din energia ta.",
            "id": "energy_body_l1_04_microbreaks-screen-4"
          },
          {
            "kind": "quiz",
            "title": "Pauzele",
            "question": "Ce rol are o pauză scurtă?",
            "options": [
              "Te scoate complet din ritm.",
              "Îți protejează energia și atenția.",
              "Îți dovedește că ești mai slab."
            ],
            "correctIndex": 1,
            "explanation": "Pauzele scurte sunt mini-reseturi care împiedică scurgerile lente de energie.",
            "id": "energy_body_l1_04_microbreaks-screen-5"
          },
          {
            "kind": "reflection",
            "title": "Pauza mea de 1 minut",
            "prompt": "Completează: „Aș putea să îmi iau o pauză de 1 minut după ___.”",
            "id": "energy_body_l1_04_microbreaks-screen-6"
          }
        ]
      },
      {
        "lessonId": "energy_body_l2_05_sleep_ritual",
        "screens": [
          {
            "kind": "content",
            "title": "Somnul ca resetare",
            "body": "Somnul este cel mai puternic reset pentru energie. Fără un minim de calitate, orice strategie de productivitate se prăbușește.",
            "id": "energy_body_l2_05_sleep_ritual-screen-1"
          },
          {
            "kind": "content",
            "title": "Un ritual simplu",
            "body": "Nu ai nevoie de reguli perfecte. Ai nevoie de un mic ritual repetat: aceeași oră aproximativă, mai puțină lumină puternică, mai puține ecrane înainte de culcare.",
            "id": "energy_body_l2_05_sleep_ritual-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă-ți seara",
            "steps": [
              "Gândește-te la ultima oră înainte de culcare.",
              "Ce faci de obicei în acel timp?"
            ],
            "helper": "Ce repeți în fiecare seară îți modelează somnul.",
            "id": "energy_body_l2_05_sleep_ritual-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Somn și energie",
            "question": "Ce ajută cel mai mult somnul?",
            "options": [
              "Să adormi cu telefonul în mână.",
              "Un ritual simplu, repetat, care liniștește mintea și corpul.",
              "Să îți schimbi ora de culcare de la o zi la alta."
            ],
            "correctIndex": 1,
            "explanation": "Un ritual repetat semnalează corpului că poate coborî ritmul și pregătește un somn mai adânc.",
            "id": "energy_body_l2_05_sleep_ritual-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un gest pentru somn",
            "prompt": "Completează: „Un gest mic pe care îl pot face pentru un somn mai bun este ___.”",
            "id": "energy_body_l2_05_sleep_ritual-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l2_06_rhythm",
        "screens": [
          {
            "kind": "content",
            "title": "Ritmul zilei",
            "body": "Corpul tău are momente în care are mai multă energie și momente în care scade. Dacă le ignori, ajungi să forțezi când ești deja gol.",
            "id": "energy_body_l2_06_rhythm-screen-1"
          },
          {
            "kind": "content",
            "title": "Ferestre de energie",
            "body": "Observă când te simți cel mai lucid și când îți cade natural energia. Nu trebuie să fie perfect. E suficient să vezi un tipar aproximativ.",
            "id": "energy_body_l2_06_rhythm-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Mică hartă",
            "steps": [
              "Gândește-te la ziua ta obișnuită.",
              "În ce intervale te simți de obicei mai treaz și mai clar?"
            ],
            "helper": "Acolo merită puse lucrurile mai importante.",
            "id": "energy_body_l2_06_rhythm-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Ritm și priorități",
            "question": "Cum poți folosi ritmul natural al energiei?",
            "options": [
              "Ignorându-l complet.",
              "Programând sarcinile mai grele în perioadele de energie mai bună.",
              "Făcând totul la întâmplare."
            ],
            "correctIndex": 1,
            "explanation": "Când sincronizezi sarcinile importante cu ferestrele bune, obții mai mult din energia disponibilă.",
            "id": "energy_body_l2_06_rhythm-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O ajustare de ritm",
            "prompt": "Completează: „Aș putea muta un lucru important în intervalul ___, când am mai multă energie.”",
            "id": "energy_body_l2_06_rhythm-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l2_07_movement",
        "screens": [
          {
            "kind": "content",
            "title": "Mișcare mică, impact mare",
            "body": "Nu ai nevoie de antrenamente perfecte ca să îți ajuți energia. Mișcarea scurtă, repetată, schimbă mult modul în care te simți.",
            "id": "energy_body_l2_07_movement-screen-1"
          },
          {
            "kind": "content",
            "title": "Ridică-te, nu doar rezista",
            "body": "Câteva ridicări de pe scaun, câțiva pași, întinderi simple pot opri acumularea de tensiune.",
            "id": "energy_body_l2_07_movement-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Mișcare realistă",
            "steps": [
              "Gândește-te la un tip de mișcare pe care îl poți face în mai puțin de două minute."
            ],
            "helper": "Idealul nu ajută dacă nu îl aplici. Contează ce poți repeta.",
            "id": "energy_body_l2_07_movement-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Mișcarea",
            "question": "Ce fel de mișcare este utilă pentru energie?",
            "options": [
              "Doar sesiunile lungi și perfecte.",
              "Orice mișcare scurtă și repetată, adaptată la viața ta.",
              "Mișcarea nu contează."
            ],
            "correctIndex": 1,
            "explanation": "Mișcările scurte și dese eliberează tensiunea acumulată chiar dacă nu sunt perfecte.",
            "id": "energy_body_l2_07_movement-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Mișcarea mea scurtă",
            "prompt": "Completează: „Mișcarea scurtă pe care aș putea să o fac de câteva ori pe zi este ___.”",
            "id": "energy_body_l2_07_movement-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l2_08_fuel",
        "screens": [
          {
            "kind": "content",
            "title": "Combustibilul",
            "body": "Energia ta depinde și de ce mănânci și bei. Nu ai nevoie de perfecțiune, dar corpul are nevoie de un minim de combustibil stabil.",
            "id": "energy_body_l2_08_fuel-screen-1"
          },
          {
            "kind": "content",
            "title": "Stabil în loc de extrem",
            "body": "Să sari peste multe mese și apoi să mănânci foarte mult deodată îți poate da vârfuri și prăbușiri de energie.",
            "id": "energy_body_l2_08_fuel-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare simplă",
            "steps": [
              "Gândește-te la o zi recentă.",
              "Ai avut măcar două momente în care ai mâncat liniștit?"
            ],
            "helper": "Stabilitatea vine din obiceiuri mici, nu din reguli dure.",
            "id": "energy_body_l2_08_fuel-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Combustibil și energie",
            "question": "Ce sprijină mai bine energia?",
            "options": [
              "Haos total în mese.",
              "Câteva momente de mâncat în liniște, fără grabă extremă.",
              "Doar cafeaua."
            ],
            "correctIndex": 1,
            "explanation": "Mesele liniștite și ritmate previn vârfurile și prăbușirile de energie pe parcursul zilei.",
            "id": "energy_body_l2_08_fuel-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un pas spre stabilitate",
            "prompt": "Completează: „Aș putea să îmi protejez energia având grijă ca ___.”",
            "id": "energy_body_l2_08_fuel-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l3_09_stress_energy",
        "screens": [
          {
            "kind": "content",
            "title": "Stres și energie",
            "body": "Stresul nu este doar dușman. Uneori te activează și te ajută să te mobilizezi. Problema apare când nu mai cobori din acel nivel ridicat.",
            "id": "energy_body_l3_09_stress_energy-screen-1"
          },
          {
            "kind": "content",
            "title": "Activare și prăbușire",
            "body": "Dacă stai prea mult în stare de stres, corpul trece de la „activat” la „epuizat”. Înveți să recunoști când ești prea sus de prea mult timp.",
            "id": "energy_body_l3_09_stress_energy-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Când ai simțit ultima dată că ești „pe muchie” prea mult timp?"
            ],
            "helper": "Acolo se consumă rezervele cele mai mari.",
            "id": "energy_body_l3_09_stress_energy-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Stres și epuizare",
            "question": "Ce este important de făcut după perioade de stres intens?",
            "options": [
              "Să continui în același ritm.",
              "Să îți oferi perioade de revenire și resetare.",
              "Să ignori complet ce simți."
            ],
            "correctIndex": 1,
            "explanation": "După stres intens, corpul își reface rezervele doar dacă îi oferi perioade de revenire.",
            "id": "energy_body_l3_09_stress_energy-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un semn de „prea mult”",
            "prompt": "Completează: „Știu că am depășit limita când ___.”",
            "id": "energy_body_l3_09_stress_energy-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l3_10_crash_repair",
        "screens": [
          {
            "kind": "content",
            "title": "După ce ai forțat prea mult",
            "body": "Toți avem momente în care forțăm corpul peste limite. Important nu este să nu se întâmple niciodată, ci cum repari după.",
            "id": "energy_body_l3_10_crash_repair-screen-1"
          },
          {
            "kind": "content",
            "title": "Reparație, nu vină",
            "body": "Vinovăția nu îți reface energia. Micile gesturi de grijă, da: somn, hidratare, mișcare blândă, hrană simplă.",
            "id": "energy_body_l3_10_crash_repair-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Plan de reparare",
            "steps": [
              "Gândește-te la o perioadă recentă în care ai forțat mult.",
              "Ce ai putea face diferit în următoarele zile pentru a te reface?"
            ],
            "helper": "Reparația cere gesturi mici, repetate.",
            "id": "energy_body_l3_10_crash_repair-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Reparația",
            "question": "Ce ajută după epuizare?",
            "options": [
              "Să te critici și să ignori corpul.",
              "Să introduci câteva zile cu mai mult somn și mai multă blândețe față de tine.",
              "Să crești ritmul și mai mult."
            ],
            "correctIndex": 1,
            "explanation": "Reparația vine din gesturi blânde și somn suplimentar, nu din critică sau forțare.",
            "id": "energy_body_l3_10_crash_repair-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un gest de reparare",
            "prompt": "Completează: „Un gest mic de reparare pentru mine ar fi ___.”",
            "id": "energy_body_l3_10_crash_repair-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l3_11_listening_limits",
        "screens": [
          {
            "kind": "content",
            "title": "A asculta limitele",
            "body": "Limitele corpului nu sunt dușmanul tău. Ele îți arată cât poți duce acum, nu cât ești „valoros”.",
            "id": "energy_body_l3_11_listening_limits-screen-1"
          },
          {
            "kind": "content",
            "title": "Fără rușine",
            "body": "A recunoaște o limită nu înseamnă că renunți. Înseamnă că vezi realitatea și o respecți ca să poți continua pe termen lung.",
            "id": "energy_body_l3_11_listening_limits-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Clarificare",
            "steps": [
              "Unde îți depășești constant limitele?"
            ],
            "helper": "Ce refuzi să recunoști se întoarce împotriva ta mai târziu.",
            "id": "energy_body_l3_11_listening_limits-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Limite și valoare",
            "question": "Ce este adevărat despre limitele corpului?",
            "options": [
              "Îți arată cât valorezi ca om.",
              "Îți arată unde e nevoie de alt ritm și altă strategie.",
              "Trebuie ignorate dacă vrei rezultate."
            ],
            "correctIndex": 1,
            "explanation": "Limitele arată unde trebuie schimbat ritmul, iar respectarea lor îți prelungește autonomia.",
            "id": "energy_body_l3_11_listening_limits-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O limită respectată",
            "prompt": "Completează: „Aș putea începe să respect mai mult limita mea când ___.”",
            "id": "energy_body_l3_11_listening_limits-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l3_12_personal_ritual",
        "screens": [
          {
            "kind": "content",
            "title": "Ritualul tău de energie",
            "body": "Nu există un singur ritual perfect de energie. Există ritualul care ți se potrivește ție și pe care îl poți repeta.",
            "id": "energy_body_l3_12_personal_ritual-screen-1"
          },
          {
            "kind": "content",
            "title": "3 elemente simple",
            "body": "Un ritual bun are de obicei trei componente: un pic de mișcare, un pic de respirație, un pic de liniște sau reflecție.",
            "id": "energy_body_l3_12_personal_ritual-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Schițează ritualul",
            "steps": [
              "Alege o mișcare scurtă, o formă de respirație și un moment de liniște."
            ],
            "helper": "Nu trebuie să fie lung. Trebuie să fie repetabil.",
            "id": "energy_body_l3_12_personal_ritual-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Ritual",
            "question": "Ce face un ritual bun de energie?",
            "options": [
              "Este complicat și greu de făcut.",
              "Este simplu, clar și ușor de repetat.",
              "Este perfect, altfel nu merită."
            ],
            "correctIndex": 1,
            "explanation": "Doar ritualurile simple și clare pot fi repetate zilnic și devin ancore reale pentru energie.",
            "id": "energy_body_l3_12_personal_ritual-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ritualul meu",
            "prompt": "Completează: „Ritualul meu scurt de energie ar putea fi: ___.”",
            "id": "energy_body_l3_12_personal_ritual-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l3_13_body_to_mind",
        "screens": [
          {
            "kind": "content",
            "title": "Alimentele influențează energia mentală",
            "body": "Zaharurile rapide, mesele foarte grele sau mesele sărite provoacă fluctuații mari de energie și dispoziție.",
            "id": "energy_body_l3_13_body_to_mind-screen-1"
          },
          {
            "kind": "content",
            "title": "Hrană stabilă, energie stabilă",
            "body": "Corpul răspunde bine la obiceiuri regulate: mese relativ stabile, nu haos total.",
            "id": "energy_body_l3_13_body_to_mind-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Când ți-a scăzut energia foarte mult ultima dată?",
              "Cum arăta ziua ta ca alimentație?"
            ],
            "helper": "Energia este legată direct de modul în care îți hrănești corpul.",
            "id": "energy_body_l3_13_body_to_mind-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Energie",
            "question": "Ce menține energia stabilă?",
            "options": [
              "Haos alimentar.",
              "Hrană și hidratare regulate."
            ],
            "correctIndex": 1,
            "id": "energy_body_l3_13_body_to_mind-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ajustare",
            "prompt": "„Un obicei alimentar care îmi stabilizează energia este ___.”",
            "id": "energy_body_l3_13_body_to_mind-screen-5"
          }
        ]
      },
      {
        "lessonId": "energy_body_l3_14_mind_to_body",
        "screens": [
          {
            "kind": "content",
            "title": "Mintea influențează corpul",
            "body": "Dialogul interior stresant, presiunea mentală și graba constantă cresc cortizolul și pun corpul în alertă.",
            "id": "energy_body_l3_14_mind_to_body-screen-1"
          },
          {
            "kind": "content",
            "title": "Calm mental, corp mai odihnit",
            "body": "Când încetinești ritmul mental și reduci auto-critica, corpul răspunde cu o stare metabolică mai echilibrată.",
            "id": "energy_body_l3_14_mind_to_body-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la o zi în care ai fost foarte dur cu tine mental.",
              "Cum s-a simțit corpul tău?"
            ],
            "helper": "Mintea tensionată consumă energia corpului.",
            "id": "energy_body_l3_14_mind_to_body-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Minte și energie",
            "question": "Ce eliberează corpul de stres?",
            "options": [
              "Continuarea criticii interioare.",
              "O atitudine mentală mai blândă și pauze scurte."
            ],
            "correctIndex": 1,
            "id": "energy_body_l3_14_mind_to_body-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Reset mental",
            "prompt": "„Un gând sau un ritual mental care îmi relaxează corpul este ___.”",
            "id": "energy_body_l3_14_mind_to_body-screen-5"
          }
        ]
      }
    ]
  },
  "self_trust": {
    "id": "self_trust",
    "title": "Încredere în Sine",
    "arcIntros": {
      "trezire": {
        "id": "self_trust_arc_01_trezire",
        "title": "Trezirea",
        "body": "Încrederea în tine nu apare din cuvinte mari, ci din promisiuni mici pe care le respecți. De câte ori spui „o să fac asta” și nu faci, ceva în tine se retrage. În această etapă, începi să observi cât de des te lași pe tine la urmă și cât de ușor îți explici asta."
      },
      "primele_ciocniri": {
        "id": "self_trust_arc_02_primele_ciocniri",
        "title": "Primele Ciocniri",
        "body": "Când începi să iei în serios promisiunile față de tine, te lovești de vechile obiceiuri: amânare, „nu acum”, „nu e chiar așa de important”. Aici nu cauți perfecțiune. Cauți să vezi mai clar momentele în care te trădezi pe tine, chiar în lucruri mici."
      },
      "profunzime": {
        "id": "self_trust_arc_03_profunzime",
        "title": "Profunzime",
        "body": "Mai adânc de amânări și scuze se află felul în care vorbești cu tine: vocea critică, vocea rușinată, vocea care spune că „nu are rost”. În această etapă, înveți să nu mai lași vocea critică să fie singura care comentează. Descoperi că poți construi o voce interioară care te sprijină, nu doar te judecă."
      },
      "maestrie": {
        "id": "self_trust_arc_04_maestrie",
        "title": "Maestrie",
        "body": "Maestria în încrederea în sine nu înseamnă să nu mai greșești niciodată. Înseamnă să poți spune: „Am greșit, repar” fără să te distrugi. Să îți alegi promisiunile cu mai multă grijă și să le duci până la capăt suficient de des încât să știi, calm: „Pot să am încredere în mine.”"
      }
    },
    "lessons": [
      {
        "lessonId": "self_trust_protocol",
        "screens": [
          {
            "kind": "protocol",
            "title": "Protocol de promisiune realistă",
            "steps": [
              "Mă întreb sincer: „Chiar vreau asta acum, sau doar sună bine?”",
              "Verific dacă am spațiu real de timp și energie pentru acest lucru.",
              "Aleg cea mai mică versiune de promisiune pe care o pot respecta.",
              "O formulez clar: „Astăzi fac ___ până la ora ___.”"
            ],
            "id": "self_trust_protocol-screen-1"
          }
        ]
      },
      {
        "lessonId": "self_trust_l1_01_definition",
        "screens": [
          {
            "kind": "content",
            "title": "Ce înseamnă încrederea în tine",
            "body": "Încrederea în tine nu este doar curaj sau imagine bună. Este sentimentul că te poți baza pe tine, că atunci când spui „fac asta”, există o șansă reală să se întâmple.",
            "id": "self_trust_l1_01_definition-screen-1"
          },
          {
            "kind": "content",
            "title": "Baza încrederii",
            "body": "Când îți încalci promisiunile tot timpul, chiar și cele mici, în interior se instalează un mesaj: „Nu pot conta pe mine.”",
            "id": "self_trust_l1_01_definition-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la o promisiune mică pe care ți-ai făcut-o în ultimele zile.",
              "Ai respectat-o sau ai lăsat-o să se piardă?"
            ],
            "helper": "Ce repeți devine mesajul tău interior despre tine.",
            "id": "self_trust_l1_01_definition-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Definiția încrederii în sine",
            "question": "Ce descrie cel mai bine încrederea în sine?",
            "options": [
              "Să te simți superior celorlalți.",
              "Să te poți baza pe tine când îți faci o promisiune.",
              "Să nu recunoști niciodată că greșești."
            ],
            "correctIndex": 1,
            "id": "self_trust_l1_01_definition-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O promisiune mică",
            "prompt": "Completează: „O promisiune mică pe care aș vrea să o respect azi este ___.”",
            "id": "self_trust_l1_01_definition-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l1_02_inner_voice",
        "screens": [
          {
            "kind": "content",
            "title": "Vocea din interior",
            "body": "Fiecare are o voce interioară care comentează: „iar n-ai făcut”, „nu ești în stare”, „nu are rost”. Când această voce devine singura, încrederea în tine se subțiază.",
            "id": "self_trust_l1_02_inner_voice-screen-1"
          },
          {
            "kind": "content",
            "title": "Critic vs aliat",
            "body": "Nu ai nevoie să reduci la tăcere orice critică. Ai nevoie să ai și o voce de aliat care spune: „Ai greșit, dar se poate repara.”",
            "id": "self_trust_l1_02_inner_voice-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă dialogul interior",
            "steps": [
              "Gândește-te la ultima oară când nu ți-ai respectat un plan.",
              "Ce ți-ai spus în gând după aceea?"
            ],
            "helper": "Tonul cu care vorbești cu tine construiește sau distruge încrederea.",
            "id": "self_trust_l1_02_inner_voice-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Vocea interioară",
            "question": "Ce ajută cel mai mult în încrederea în sine?",
            "options": [
              "Să te insulți ca să „te motivezi”.",
              "Să vezi clar ce ai făcut și să îți vorbești ca unui prieten.",
              "Să ignori complet orice greșeală."
            ],
            "correctIndex": 1,
            "id": "self_trust_l1_02_inner_voice-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O frază de aliat",
            "prompt": "Completează: „În loc de ‘sunt varză’, aș putea spune: ‘___.’”",
            "id": "self_trust_l1_02_inner_voice-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l1_03_small_promises",
        "screens": [
          {
            "kind": "content",
            "title": "Puterea promisiunilor mici",
            "body": "Cele mai mari schimbări în încrederea în sine vin din promisiuni mici și realiste, duse la capăt. Nu din planuri uriașe care se prăbușesc după două zile.",
            "id": "self_trust_l1_03_small_promises-screen-1"
          },
          {
            "kind": "protocol",
            "title": "Protocol de promisiune realistă",
            "steps": [
              "Mă întreb ce vreau cu adevărat.",
              "Verific timpul și energia.",
              "Aleg versiunea cea mai mică de pas.",
              "Formulez clar ce fac azi."
            ],
            "id": "self_trust_l1_03_small_promises-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Mic pas",
            "steps": [
              "Gândește-te la un domeniu unde vrei să progresezi.",
              "Care ar fi un pas mic, de 5–10 minute, pe care îl poți face azi?"
            ],
            "helper": "Un pas mic respectat cântărește mai mult decât un plan mare abandonat.",
            "id": "self_trust_l1_03_small_promises-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Promisiuni realiste",
            "question": "Ce este mai bun pentru încrederea în sine?",
            "options": [
              "Să îți propui enorm și să renunți rapid.",
              "Să îți propui puțin, dar să respecți consecvent.",
              "Să nu îți propui nimic."
            ],
            "correctIndex": 1,
            "id": "self_trust_l1_03_small_promises-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Pasul de azi",
            "prompt": "Completează: „Astăzi, promisiunea mea mică și realistă este să ___.”",
            "id": "self_trust_l1_03_small_promises-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l1_04_tracking_wins",
        "screens": [
          {
            "kind": "content",
            "title": "A nota ce respecți",
            "body": "Mintea are tendința să rețină mai mult ce nu faci decât ce duci la capăt. Dacă nu notezi ce respecți, ai impresia că „nu faci destul” la nesfârșit.",
            "id": "self_trust_l1_04_tracking_wins-screen-1"
          },
          {
            "kind": "content",
            "title": "Jurnalul de mici victorii",
            "body": "Două-trei rânduri seara, cu ce ai dus la capăt, pot schimba felul în care te vezi.",
            "id": "self_trust_l1_04_tracking_wins-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Lista de azi",
            "steps": [
              "Gândește-te la 2–3 lucruri mici pe care le-ai făcut azi.",
              "Ar fi putut intra într-un jurnal de „promisiuni respectate”?"
            ],
            "helper": "Când vezi pe hârtie ceea ce faci, încrederea devine mai concretă.",
            "id": "self_trust_l1_04_tracking_wins-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Notarea progresului",
            "question": "De ce este util să notezi promisiunile respectate?",
            "options": [
              "Ca să te lauzi.",
              "Ca să vezi real ce funcționează și să întărești încrederea în tine.",
              "Nu este util; doar te încurcă."
            ],
            "correctIndex": 1,
            "id": "self_trust_l1_04_tracking_wins-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un obicei mic",
            "prompt": "Completează: „Aș putea să notez în fiecare seară cel puțin ___ lucru(i) pe care le-am dus la capăt.”",
            "id": "self_trust_l1_04_tracking_wins-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l2_05_mistakes",
        "screens": [
          {
            "kind": "content",
            "title": "Greșeli și încredere",
            "body": "Nu pierzi încrederea în tine pentru că greșești. O pierzi când, după greșeli, te zdrobești sau abandonezi complet.",
            "id": "self_trust_l2_05_mistakes-screen-1"
          },
          {
            "kind": "content",
            "title": "A vedea și a repara",
            "body": "Când spui: „Am greșit, îmi asum partea mea și repar cât pot”, încrederea în tine se întărește chiar dacă ai eșuat.",
            "id": "self_trust_l2_05_mistakes-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "O greșeală recentă",
            "steps": [
              "Adu-ți aminte o greșeală care încă te apasă.",
              "Te-ai criticat sau ai și reparat ceva concret?"
            ],
            "helper": "Repararea, nu vinovăția, reconstruiește încrederea.",
            "id": "self_trust_l2_05_mistakes-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Greșeli",
            "question": "Ce este mai util pentru încrederea în sine?",
            "options": [
              "Să te pedepsești ore în șir.",
              "Să vezi clar ce ai greșit și să faci un pas de reparare.",
              "Să negi că s-a întâmplat ceva."
            ],
            "correctIndex": 1,
            "id": "self_trust_l2_05_mistakes-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un pas de reparare",
            "prompt": "Completează: „Un pas mic de reparare pe care îl pot face este ___.”",
            "id": "self_trust_l2_05_mistakes-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l2_06_saying_no",
        "screens": [
          {
            "kind": "content",
            "title": "A spune „nu” ca formă de încredere",
            "body": "De multe ori spui „da” celorlalți și „nu” ție. Pe termen lung, asta sapă încrederea în tine: simți că tu ești mereu ultimul pe listă.",
            "id": "self_trust_l2_06_saying_no-screen-1"
          },
          {
            "kind": "content",
            "title": "Un „nu” calm",
            "body": "Poți spune „nu” fără agresivitate. Spui doar: „Acum nu pot”, „Am nevoie să termin întâi ce mi-am propus.”",
            "id": "self_trust_l2_06_saying_no-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Unde te trădezi",
            "steps": [
              "Gândește-te la o situație recentă în care ai spus „da”, deși nu voiai."
            ],
            "helper": "Acolo, încrederea în tine a mai pierdut un punct.",
            "id": "self_trust_l2_06_saying_no-screen-3"
          },
          {
            "kind": "quiz",
            "title": "„Nu” sănătos",
            "question": "Ce face un „nu” spus la timp?",
            "options": [
              "Te transformă într-o persoană egoistă.",
              "Îți protejează energia și îți întărește încrederea în tine.",
              "Distruge orice relație."
            ],
            "correctIndex": 1,
            "id": "self_trust_l2_06_saying_no-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un „nu” pe care îl datorezi",
            "prompt": "Completează: „Dacă aș fi sincer(ă) cu mine, aș spune ‘nu’ la ___.”",
            "id": "self_trust_l2_06_saying_no-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l2_07_overcommit",
        "screens": [
          {
            "kind": "content",
            "title": "Prea multe promisiuni",
            "body": "Când promiți prea mult, chiar cu intenții bune, ajungi să nu duci nimic până la capăt. În interior, se formează mesajul: „Eu nu termin ce încep.”",
            "id": "self_trust_l2_07_overcommit-screen-1"
          },
          {
            "kind": "content",
            "title": "Mai puțin, mai solid",
            "body": "Încrederea în tine crește când promiți mai puține lucruri și le duci cu adevărat la final.",
            "id": "self_trust_l2_07_overcommit-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Inventar",
            "steps": [
              "Fă o listă mentală a promisiunilor pe care le ai acum (muncă, personal, sănătate)."
            ],
            "helper": "Lista prea plină strică calitatea, nu o demonstrează.",
            "id": "self_trust_l2_07_overcommit-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Supra-încărcare",
            "question": "Ce ajută mai mult încrederea în sine?",
            "options": [
              "Să spui „da” la tot.",
              "Să reduci promisiunile și să le respecți pe cele rămase.",
              "Să nu îți mai propui nimic."
            ],
            "correctIndex": 1,
            "id": "self_trust_l2_07_overcommit-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O promisiune de scos",
            "prompt": "Completează: „O promisiune nerealistă pe care aș putea să o ajustez sau să o anulez este ___.”",
            "id": "self_trust_l2_07_overcommit-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l2_08_values",
        "screens": [
          {
            "kind": "content",
            "title": "Valorile tale",
            "body": "Încrederea în tine este mai puternică atunci când deciziile sunt legate de ceea ce contează cu adevărat pentru tine, nu doar de ce se așteaptă ceilalți.",
            "id": "self_trust_l2_08_values-screen-1"
          },
          {
            "kind": "content",
            "title": "Mică aliniere",
            "body": "Nu trebuie să ai clar toate valorile. E suficient să observi: „Asta e important pentru mine acum” și să iei măcar o decizie în acord cu asta.",
            "id": "self_trust_l2_08_values-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Ce contează",
            "steps": [
              "Gândește-te la ceva ce îți pasă cu adevărat în perioada asta (sănătate, relații, lucru, liniște)."
            ],
            "helper": "Când acțiunile tale se apropie de ceea ce contează, încrederea în tine crește.",
            "id": "self_trust_l2_08_values-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Valori și încredere",
            "question": "Ce întărește încrederea în sine?",
            "options": [
              "Să îți ignori valorile ca să mulțumești pe toată lumea.",
              "Să iei decizii mici în acord cu ce contează pentru tine.",
              "Să îți schimbi părerea de la o oră la alta."
            ],
            "correctIndex": 1,
            "id": "self_trust_l2_08_values-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O decizie aliniată",
            "prompt": "Completează: „O decizie mică pe care aș putea să o iau în acord cu valorile mele este ___.”",
            "id": "self_trust_l2_08_values-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l3_09_listen_self",
        "screens": [
          {
            "kind": "content",
            "title": "A te asculta pe tine",
            "body": "Uneori știi foarte bine ce ai nevoie sau ce vrei, dar te ignori: „nu acum”, „mai târziu”, „nu contează”.",
            "id": "self_trust_l3_09_listen_self-screen-1"
          },
          {
            "kind": "content",
            "title": "Semnalele tale",
            "body": "Încrederea în tine crește când începi să iei în serios propriile semnale: oboseală, interes, repulsie, curiozitate.",
            "id": "self_trust_l3_09_listen_self-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "A nu te mai ignora complet",
            "steps": [
              "Gândește-te la o situație în care ai simțit clar un „nu” sau un „da” interior și l-ai ignorat."
            ],
            "helper": "De fiecare dată când te ignori complet, ceva din încrederea ta în tine scade.",
            "id": "self_trust_l3_09_listen_self-screen-3"
          },
          {
            "kind": "quiz",
            "title": "A te asculta",
            "question": "Ce ajută încrederea în sine?",
            "options": [
              "Să ignori ce simți ca să nu deranjezi.",
              "Să ții cont, măcar parțial, de semnalele tale interioare.",
              "Să te obligi mereu împotriva a tot ce simți."
            ],
            "correctIndex": 1,
            "id": "self_trust_l3_09_listen_self-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un „da” sau „nu” respectat",
            "prompt": "Completează: „Aș putea să respect data viitoare sentimentul meu de ___ în situațiile de tip ___.”",
            "id": "self_trust_l3_09_listen_self-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l3_10_repair_self",
        "screens": [
          {
            "kind": "content",
            "title": "A repara încrederea după ce te-ai trădat",
            "body": "Când îți promiți ceva și nu faci, poți fie să te lovești la nesfârșit, fie să repari. Repararea înseamnă: recunosc, înțeleg de ce, ajustez promisiunea.",
            "id": "self_trust_l3_10_repair_self-screen-1"
          },
          {
            "kind": "content",
            "title": "Fără dramă, cu claritate",
            "body": "Nu ai nevoie de discursuri dure. Ai nevoie de: „Am promis X, n-am făcut. De ce? Ce pot promite mai realist data viitoare?”",
            "id": "self_trust_l3_10_repair_self-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Un episod",
            "steps": [
              "Amintește-ți un plan pe care l-ai abandonat.",
              "Ce ai putea învăța de acolo, în loc să te judeci?"
            ],
            "helper": "Lecția învățată + promisiune ajustată = reparație.",
            "id": "self_trust_l3_10_repair_self-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Reparație",
            "question": "Ce reconstruiește cel mai mult încrederea în sine?",
            "options": [
              "Să te faci praf în mintea ta și atât.",
              "Să înveți din ce s-a întâmplat și să ajustezi promisiunea.",
              "Să ignori totul și să speri să se schimbe singur."
            ],
            "correctIndex": 1,
            "id": "self_trust_l3_10_repair_self-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O ajustare",
            "prompt": "Completează: „Pentru următoarea promisiune, aș putea să o fac mai realistă reducând-o la ___.”",
            "id": "self_trust_l3_10_repair_self-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l3_11_decisions",
        "screens": [
          {
            "kind": "content",
            "title": "Deciziile ca acord cu tine",
            "body": "Fiecare decizie este, într-un fel, un acord cu tine. Când iei decizii care te trădează constant, încrederea în tine scade.",
            "id": "self_trust_l3_11_decisions-screen-1"
          },
          {
            "kind": "content",
            "title": "Mică pauză înainte de „da”",
            "body": "O secundă de pauză înainte să spui „da” sau „nu” îți dă timp să verifici dacă decizia este în acord cu tine.",
            "id": "self_trust_l3_11_decisions-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la o decizie recentă luată din grabă.",
              "A fost în acord cu tine sau doar din reflex?"
            ],
            "helper": "Pauza scurtă, repetată, îți protejează încrederea în tine.",
            "id": "self_trust_l3_11_decisions-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Decizii",
            "question": "Ce ajută încrederea în sine legat de decizii?",
            "options": [
              "Să răspunzi impulsiv la orice.",
              "Să îți oferi o scurtă pauză și să verifici dacă decizia e în acord cu tine.",
              "Să amâni la nesfârșit orice decizie."
            ],
            "correctIndex": 1,
            "id": "self_trust_l3_11_decisions-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Pauza mea de acord",
            "prompt": "Completează: „Aș putea să îmi iau o secundă de pauză înainte să spun ‘da’ mai ales în situațiile ___.”",
            "id": "self_trust_l3_11_decisions-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l3_12_ritual",
        "screens": [
          {
            "kind": "content",
            "title": "Ritualul tău de încredere",
            "body": "Încrederea în sine nu se construiește într-o zi. Se construiește din gesturi repetate: promisiuni mici, respectate, reparate când nu reușești.",
            "id": "self_trust_l3_12_ritual-screen-1"
          },
          {
            "kind": "content",
            "title": "Trei elemente",
            "body": "Un ritual de încredere în tine poate avea trei lucruri: o promisiune mică dimineața, o pauză de verificare în timpul zilei, o scurtă notare seara.",
            "id": "self_trust_l3_12_ritual-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Schița ritualului",
            "steps": [
              "Alege o promisiune mică de dimineață.",
              "Alege un moment în care să verifici cum ești.",
              "Alege un moment în care să notezi 1–2 lucruri duse la capăt."
            ],
            "helper": "Când îți respecți propriul ritual, îți transmiți că ești important.",
            "id": "self_trust_l3_12_ritual-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Ritual de încredere",
            "question": "Ce face un ritual bun de încredere în sine?",
            "options": [
              "Este complicat și greu de ținut.",
              "Este simplu, realist și repetabil.",
              "Se schimbă complet în fiecare zi."
            ],
            "correctIndex": 1,
            "id": "self_trust_l3_12_ritual-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ritualul meu",
            "prompt": "Completează: „Ritualul meu simplu de încredere în mine ar putea fi: dimineața ___, în timpul zilei ___, seara ___.”",
            "id": "self_trust_l3_12_ritual-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l3_13_body_to_mind",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul influențează promisiunile",
            "body": "Când ești epuizat sau flămând, promisiunile par greu de respectat, iar încrederea în tine scade fără să-ți dai seama.",
            "id": "self_trust_l3_13_body_to_mind-screen-1"
          },
          {
            "kind": "content",
            "title": "Protejează baza fizică",
            "body": "Înainte să te critici că „nu ești disciplinat”, verifică dacă baza fizică este în regulă (somn, hrană, hidratare).",
            "id": "self_trust_l3_13_body_to_mind-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Gândește-te la o promisiune ratată.",
              "Cum era corpul tău în acea perioadă?"
            ],
            "helper": "Uneori corpul obosit sabotează promisiuni altfel realiste.",
            "id": "self_trust_l3_13_body_to_mind-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Corpul și promisiunile",
            "question": "Ce susține promisiunile respectate?",
            "options": [
              "Să ignori corpul și să forțezi mereu.",
              "Un corp minim stabil: somn, hrană, recuperare."
            ],
            "correctIndex": 1,
            "id": "self_trust_l3_13_body_to_mind-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ajustare fizică",
            "prompt": "„Un gest fizic care mă ajută să-mi respect promisiunile este ___.”",
            "id": "self_trust_l3_13_body_to_mind-screen-5"
          }
        ]
      },
      {
        "lessonId": "self_trust_l3_14_mind_to_body",
        "screens": [
          {
            "kind": "content",
            "title": "Mintea influențează corpul în auto-încredere",
            "body": "Dialogul interior dur crește cortizolul și îți consumă energia, ceea ce face promisiunile și mai greu de dus la capăt.",
            "id": "self_trust_l3_14_mind_to_body-screen-1"
          },
          {
            "kind": "content",
            "title": "Ton blând, corp cooperant",
            "body": "Când îți vorbești ca unui aliat, corpul se relaxează și îți oferă energia necesară pentru a continua promisiunile.",
            "id": "self_trust_l3_14_mind_to_body-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Observă cum te simți în corp după ce te critici."
            ],
            "helper": "Tonul interior dă semnale directe corpului.",
            "id": "self_trust_l3_14_mind_to_body-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Minte și auto-încredere",
            "question": "Ce ajută corpul să fie de partea ta?",
            "options": [
              "Auto-critica constantă.",
              "O voce interioară mai blândă și realistă."
            ],
            "correctIndex": 1,
            "id": "self_trust_l3_14_mind_to_body-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Fraza de aliat",
            "prompt": "„O frază pe care i-o pot spune corpului meu pentru a rămâne de partea mea este ___.”",
            "id": "self_trust_l3_14_mind_to_body-screen-5"
          }
        ]
      }
    ]
  },
  "decision_discernment": {
    "id": "decision_discernment",
    "title": "Discernământ & Decizii",
    "arcIntros": {
      "trezire": {
        "id": "decision_discernment_arc_01_trezire",
        "title": "Trezirea",
        "body": "Deciziile tale îți desenează viața, pas cu pas. De multe ori alegi pe fugă: „merge și așa”, „vedem noi”. În această etapă, începi să observi când deciziile tale sunt reacții automate și când sunt alegeri reale. Trezirea înseamnă să vezi că poți încetini puțin înainte de „da” sau „nu”."
      },
      "primele_ciocniri": {
        "id": "decision_discernment_arc_02_primele_ciocniri",
        "title": "Primele Ciocniri",
        "body": "Când încerci să iei decizii mai conștiente, te lovești de frică, grabă și presiune: „dacă pierd șansa?”, „dacă aleg prost?”. În loc să cauți siguranță totală, înveți să cauți claritate suficientă pentru următorul pas. Nu ai nevoie de certitudine absolută; ai nevoie de pași care au sens acum."
      },
      "profunzime": {
        "id": "decision_discernment_arc_03_profunzime",
        "title": "Profunzime",
        "body": "Mai adânc de frica de a greși se află valorile tale și criteriile după care simți că o decizie este bună pentru tine. În această etapă, descoperi că o decizie bună nu este doar cea care „iese bine” la final, ci cea care este luată în acord cu ce contează pentru tine, cu informațiile pe care le aveai atunci."
      },
      "maestrie": {
        "id": "decision_discernment_arc_04_maestrie",
        "title": "Maestrie",
        "body": "Maestria în decizii nu înseamnă să alegi perfect de fiecare dată. Înseamnă să știi să te oprești o clipă, să clarifici ce vrei, ce riști și ce e important pentru tine, apoi să accepți consecințele cu calm. Chiar și când iese altfel decât ai sperat, te poți uita înapoi și spune: „Am ales cât de bine am putut, în acord cu mine.”"
      }
    },
    "lessons": [
      {
        "lessonId": "decision_discernment_protocol",
        "screens": [
          {
            "kind": "protocol",
            "title": "Protocol de decizie calmă",
            "steps": [
              "Clarific ce decizie am de luat, în cuvinte simple.",
              "Întreb: „Ce vreau cu adevărat?” și „Ce e important pentru mine aici?”",
              "Notez rapid două-trei opțiuni și un risc principal pentru fiecare.",
              "Aleg pasul următor suficient de bun, nu perfect, și accept că voi ajusta dacă e nevoie."
            ],
            "id": "decision_discernment_protocol-screen-1"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l1_01_what_is_discernment",
        "screens": [
          {
            "kind": "content",
            "title": "Ce este discernământul",
            "body": "Discernământul este capacitatea de a vedea mai clar înainte să alegi. Nu este magie, ci un mod de a te opri o clipă, de a pune întrebări simple și de a nu confunda emoția de moment cu realitatea întreagă.",
            "id": "decision_discernment_l1_01_what_is_discernment-screen-1"
          },
          {
            "kind": "content",
            "title": "Decizie vs impuls",
            "body": "Un impuls este „fac acum, fără să mă gândesc”. O decizie este „mă gândesc puțin, aleg și îmi asum”.",
            "id": "decision_discernment_l1_01_what_is_discernment-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observă",
            "steps": [
              "Gândește-te la o alegere recentă.",
              "A fost mai mult impuls sau decizie?"
            ],
            "helper": "Doar această diferențiere îți schimbă felul în care alegi pe viitor.",
            "id": "decision_discernment_l1_01_what_is_discernment-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Discernământ",
            "question": "Ce este cel mai aproape de discernământ?",
            "options": [
              "Să amâni orice decizie.",
              "Să îți pui câteva întrebări simple înainte să alegi.",
              "Să alegi doar pe baza emoției de moment."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l1_01_what_is_discernment-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O decizie recentă",
            "prompt": "Completează: „O decizie pe care am luat-o mai mult din impuls a fost ___.”",
            "id": "decision_discernment_l1_01_what_is_discernment-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l1_02_slowing_down",
        "screens": [
          {
            "kind": "content",
            "title": "Încetinirea scurtă",
            "body": "Nu ai nevoie de ore ca să iei o decizie mai bună. Uneori sunt suficiente câteva secunde în care să îți pui întrebarea: „Ce fac acum, de fapt?”",
            "id": "decision_discernment_l1_02_slowing_down-screen-1"
          },
          {
            "kind": "content",
            "title": "Pauza care schimbă direcția",
            "body": "Acea mică pauză creează spațiu între stimul și răspuns. Acolo apare discernământul.",
            "id": "decision_discernment_l1_02_slowing_down-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Pauza mea",
            "steps": [
              "Gândește-te la o situație în care ai fi avut nevoie de 5 secunde în plus înainte de a acționa."
            ],
            "helper": "Pauza nu este slăbiciune; este control asupra direcției tale.",
            "id": "decision_discernment_l1_02_slowing_down-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Pauza și decizia",
            "question": "Ce permite o pauză scurtă înainte de decizie?",
            "options": [
              "Să reacționezi mai repede.",
              "Să alegi răspunsul în loc de impulsul automat.",
              "Să scapi de orice responsabilitate."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l1_02_slowing_down-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un loc pentru pauză",
            "prompt": "Completează: „Aș putea introduce o pauză scurtă înainte de a decide în situații de tip ___.”",
            "id": "decision_discernment_l1_02_slowing_down-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l1_03_simple_questions",
        "screens": [
          {
            "kind": "content",
            "title": "Întrebări simple, efect mare",
            "body": "Înainte de o decizie, două întrebări pot schimba tot: „Ce vreau, de fapt, aici?” și „Ce risc dacă fac asta?”.",
            "id": "decision_discernment_l1_03_simple_questions-screen-1"
          },
          {
            "kind": "content",
            "title": "Fără filozofie grea",
            "body": "Nu ai nevoie de analize complexe. Ai nevoie să nu sari direct la „da” sau „nu” fără să vezi ce urmărești și ce pui în joc.",
            "id": "decision_discernment_l1_03_simple_questions-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Pune întrebarea",
            "steps": [
              "Gândește-te la o decizie pe care o ai acum de luat.",
              "Răspunde simplu: „Ce vreau?” și „Ce risc?”"
            ],
            "helper": "Decizia devine mai clară când o privești din aceste două unghiuri.",
            "id": "decision_discernment_l1_03_simple_questions-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Întrebări utile",
            "question": "Ce întrebare ajută cel mai mult discernământul?",
            "options": [
              "„Ce ar spune toți ceilalți?”",
              "„Ce vreau cu adevărat și ce risc dacă aleg asta?”",
              "„Cum evit să simt orice emoție?”"
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l1_03_simple_questions-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Două întrebări",
            "prompt": "Completează: „Înainte de următoarea decizie importantă, îmi voi pune întrebările: ‘Ce vreau?’ și ‘Ce risc dacă ___.’”",
            "id": "decision_discernment_l1_03_simple_questions-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l1_04_small_decisions",
        "screens": [
          {
            "kind": "content",
            "title": "Deciziile mici contează",
            "body": "Nu doar deciziile mari îți modelează viața. Alegerile zilnice aparent mici îți consumă sau îți construiesc energia, timpul și direcția.",
            "id": "decision_discernment_l1_04_small_decisions-screen-1"
          },
          {
            "kind": "content",
            "title": "Exersezi în mic, nu în situații extreme",
            "body": "E mai ușor să exersezi discernământul în decizii mici, când nu e totul la limită.",
            "id": "decision_discernment_l1_04_small_decisions-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "O decizie mică",
            "steps": [
              "Gândește-te la o decizie mică de azi (ce faci în următoarea oră, ce alegi pentru tine)."
            ],
            "helper": "Acolo începe antrenamentul real.",
            "id": "decision_discernment_l1_04_small_decisions-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Decizii mici",
            "question": "Unde este cel mai ușor de exersat discernământul?",
            "options": [
              "Doar în situații extreme.",
              "În deciziile mici și frecvente.",
              "Niciodată; se naște sau nu."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l1_04_small_decisions-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O alegere de azi",
            "prompt": "Completează: „Astăzi pot exersa o decizie puțin mai conștientă alegând să ___.”",
            "id": "decision_discernment_l1_04_small_decisions-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l2_05_criteria",
        "screens": [
          {
            "kind": "content",
            "title": "Criteriile tale",
            "body": "O decizie devine mai clară când știi după ce criterii o judeci: timp, bani, energie, sănătate, relații, învățare.",
            "id": "decision_discernment_l2_05_criteria-screen-1"
          },
          {
            "kind": "content",
            "title": "Nu poți avea totul",
            "body": "Uneori, un criteriu trebuie pus mai sus decât altul. Nu poți maximiza totul simultan.",
            "id": "decision_discernment_l2_05_criteria-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Alege criteriul principal",
            "steps": [
              "Gândește-te la o decizie actuală.",
              "Care este criteriul tău principal: timp, bani, energie, altceva?"
            ],
            "helper": "Un criteriu clar îți simplifică decizia.",
            "id": "decision_discernment_l2_05_criteria-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Criterii",
            "question": "Ce ajută cel mai mult în clarificarea unei decizii?",
            "options": [
              "Să te gândești la toate în același timp, fără ordine.",
              "Să alegi un criteriu principal care contează acum.",
              "Să ignori orice criteriu."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l2_05_criteria-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Criteriul meu",
            "prompt": "Completează: „Pentru decizia ___, criteriul meu principal este ___.”",
            "id": "decision_discernment_l2_05_criteria-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l2_06_risk",
        "screens": [
          {
            "kind": "content",
            "title": "Riscul văzut, nu imaginat vag",
            "body": "Frica de decizii crește când riscul este o ceață generală: „și dacă iese rău?”. Când numești concret riscul, devine mai gestionabil.",
            "id": "decision_discernment_l2_06_risk-screen-1"
          },
          {
            "kind": "content",
            "title": "Cel mai relevant risc",
            "body": "Nu trebuie să prevezi tot. E suficient să vezi „care este riscul principal aici”.",
            "id": "decision_discernment_l2_06_risk-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Numește riscul",
            "steps": [
              "Alege o decizie.",
              "Numește clar un risc principal dacă alegi într-un fel și unul dacă nu alegi."
            ],
            "helper": "Când riscul are nume, nu mai pare un monstru invizibil.",
            "id": "decision_discernment_l2_06_risk-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Risc și decizie",
            "question": "Ce ajută cel mai mult când te temi de o decizie?",
            "options": [
              "Să nu te mai gândești deloc.",
              "Să numești clar riscul principal și să vezi dacă îl poți accepta.",
              "Să ceri cât mai multe păreri până te blochezi."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l2_06_risk-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un risc clar",
            "prompt": "Completează: „Pentru decizia ___, riscul principal pe care mi-l asum este ___.”",
            "id": "decision_discernment_l2_06_risk-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l2_07_values_alignment",
        "screens": [
          {
            "kind": "content",
            "title": "Decizii în acord cu valorile",
            "body": "O decizie poate arăta bine pe hârtie, dar să fie grea în interior pentru că se bate cap în cap cu valorile tale.",
            "id": "decision_discernment_l2_07_values_alignment-screen-1"
          },
          {
            "kind": "content",
            "title": "„Are sens pentru mine?”",
            "body": "O întrebare simplă ajută: „Decizia asta este în direcția lucrurilor care contează pentru mine sau doar arată bine în exterior?”",
            "id": "decision_discernment_l2_07_values_alignment-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Verificare de sens",
            "steps": [
              "Gândește-te la o decizie mai mare.",
              "Pe o scară de la 1 la 10, cât simți că este în acord cu valorile tale?"
            ],
            "helper": "Un scor foarte mic semnalează disconfort pe termen lung.",
            "id": "decision_discernment_l2_07_values_alignment-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Valori și decizie",
            "question": "Ce definește o decizie bună în sensul acestui modul?",
            "options": [
              "Doar rezultatul final.",
              "Și felul în care a fost luată, în acord cu valorile tale.",
              "Doar ce cred ceilalți despre ea."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l2_07_values_alignment-screen-4"
          },
          {
            "kind": "reflection",
            "title": "O decizie mai aliniată",
            "prompt": "Completează: „Aș putea ajusta decizia ___ ca să fie mai în acord cu valoarea mea de ___.”",
            "id": "decision_discernment_l2_07_values_alignment-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l2_08_small_experiments",
        "screens": [
          {
            "kind": "content",
            "title": "Experimente mici, nu verdict final",
            "body": "Uneori blochezi o decizie pentru că simți că „dacă aleg, e pentru totdeauna”. Dar multe decizii pot fi transformate în experimente mici.",
            "id": "decision_discernment_l2_08_small_experiments-screen-1"
          },
          {
            "kind": "content",
            "title": "Perioadă de test",
            "body": "Poți decide: „Testez asta 7 zile / o lună și apoi reevaluez.”",
            "id": "decision_discernment_l2_08_small_experiments-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Transformă în experiment",
            "steps": [
              "Alege o decizie de care îți e teamă.",
              "Cum ai putea să o transformi într-un test pe termen scurt?"
            ],
            "helper": "Experimentele îți dau informații, nu verdict definitiv.",
            "id": "decision_discernment_l2_08_small_experiments-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Experiment",
            "question": "Ce este o decizie-experiment?",
            "options": [
              "O decizie pe viață.",
              "O alegere limitată în timp, după care tragi concluzii.",
              "O decizie luată la întâmplare."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l2_08_small_experiments-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Experimentul meu",
            "prompt": "Completează: „Aș putea transforma decizia ___ într-un experiment de ___ zile.”",
            "id": "decision_discernment_l2_08_small_experiments-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l3_09_uncertainty",
        "screens": [
          {
            "kind": "content",
            "title": "Trăitul cu incertitudine",
            "body": "Nu există decizie fără incertitudine. Dacă aștepți siguranță totală, rămâi blocat.",
            "id": "decision_discernment_l3_09_uncertainty-screen-1"
          },
          {
            "kind": "content",
            "title": "Suficient de clar",
            "body": "De multe ori nu ai nevoie de „sigur”, ai nevoie de „suficient de clar pentru următorul pas”.",
            "id": "decision_discernment_l3_09_uncertainty-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Acceptarea incertitudinii",
            "steps": [
              "Gândește-te la o decizie pe care o tot amâni.",
              "Ce parte din ea rămâne inevitabil incertă, orice ai face?"
            ],
            "helper": "Acceptarea unei părți din incertitudine îți deblochează mișcarea.",
            "id": "decision_discernment_l3_09_uncertainty-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Incertitudine",
            "question": "Ce este realist într-o decizie?",
            "options": [
              "Să ai 100% siguranță.",
              "Să ai claritate suficientă și să accepți o parte de incertitudine.",
              "Să nu simți niciodată teamă."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l3_09_uncertainty-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Un pas cu incertitudine",
            "prompt": "Completează: „Pot accepta să iau decizia ___ chiar dacă nu știu sigur ___.”",
            "id": "decision_discernment_l3_09_uncertainty-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l3_10_regret",
        "screens": [
          {
            "kind": "content",
            "title": "Frica de regret",
            "body": "Mulți rămân blocați în decizii de teamă să nu regrete. Dar regretul apare și când nu alegi nimic și lași lucrurile să curgă la întâmplare.",
            "id": "decision_discernment_l3_10_regret-screen-1"
          },
          {
            "kind": "content",
            "title": "Regret gestionat",
            "body": "Poți alege să trăiești cu regretul mic, gestionabil, al unei decizii asumate, în locul regretului mare al blocajului.",
            "id": "decision_discernment_l3_10_regret-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Regretul actual",
            "steps": [
              "Gândește-te la un regret pe care îl porți acum.",
              "Ține mai mult de o decizie luată sau de una ne-luată?"
            ],
            "helper": "Și decizia de a nu decide este tot o decizie.",
            "id": "decision_discernment_l3_10_regret-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Regret",
            "question": "Ce abordare este aliniată cu modulul?",
            "options": [
              "Să nu mai iei nicio decizie ca să nu regreți.",
              "Să iei decizii asumate, știind că un oarecare regret este uneori inevitabil.",
              "Să negi orice regret."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l3_10_regret-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Regret și mișcare",
            "prompt": "Completează: „Aș prefera să risc un regret mic, asumat, legat de decizia ___, decât regretul de a nu fi încercat deloc.”",
            "id": "decision_discernment_l3_10_regret-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l3_11_meta_decision",
        "screens": [
          {
            "kind": "content",
            "title": "Decizia de a decide",
            "body": "Uneori e important să decizi chiar dacă nu ai toate detaliile perfecte. Și asta este o decizie: „Aleg să nu mai amân și să stabilesc un termen.”",
            "id": "decision_discernment_l3_11_meta_decision-screen-1"
          },
          {
            "kind": "content",
            "title": "Data-limită",
            "body": "O decizie fără dată-limită rămâne adesea doar o idee.",
            "id": "decision_discernment_l3_11_meta_decision-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Termen clar",
            "steps": [
              "Alege o decizie pe care o tot amâni.",
              "Stabilește o dată până la care vei decide, chiar dacă nu ai toate informațiile."
            ],
            "helper": "Termenul clar îți structurează atenția.",
            "id": "decision_discernment_l3_11_meta_decision-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Decizia de a decide",
            "question": "Ce poate debloca o decizie amânată la nesfârșit?",
            "options": [
              "Să aștepți încă „un pic”.",
              "Să stabilești o dată clară până la care vei decide și să o respecți.",
              "Să ignori complet subiectul."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l3_11_meta_decision-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Termenul meu",
            "prompt": "Completează: „Pentru decizia ___, îmi propun să aleg până la data de ___.”",
            "id": "decision_discernment_l3_11_meta_decision-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l3_12_ritual",
        "screens": [
          {
            "kind": "content",
            "title": "Ritualul tău de decizie",
            "body": "Un ritual simplu te ajută să nu te pierzi în fiecare situație. Nu ai nevoie de proceduri complicate, ci de câțiva pași repetați.",
            "id": "decision_discernment_l3_12_ritual-screen-1"
          },
          {
            "kind": "content",
            "title": "3 pași repetați",
            "body": "Un ritual de decizie poate conține: clarific decizia, aplic protocolul de decizie calmă, stabilesc următorul pas și o dată de revizuire.",
            "id": "decision_discernment_l3_12_ritual-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Schița ritualului",
            "steps": [
              "Alege cum vrei să clarifici deciziile.",
              "Alege când aplici protocolul de decizie calmă.",
              "Alege cum notezi deciziile importante (scurt)."
            ],
            "helper": "Când urmezi ritualul, nu mai reinventezi roata de fiecare dată.",
            "id": "decision_discernment_l3_12_ritual-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Ritual de decizie",
            "question": "Ce face un ritual bun de decizie?",
            "options": [
              "Este complex și greu de urmat.",
              "Este simplu, clar și repetabil.",
              "Se schimbă complet la fiecare situație."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l3_12_ritual-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ritualul meu de decizie",
            "prompt": "Completează: „Ritualul meu simplu de decizie ar putea fi: întâi ___, apoi ___, la final ___.”",
            "id": "decision_discernment_l3_12_ritual-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l3_13_body_to_mind",
        "screens": [
          {
            "kind": "content",
            "title": "Corpul influențează decizia",
            "body": "Când ești flămând, deshidratat sau foarte obosit, creierul alege impulsiv și caută recompense rapide. Nu este lipsă de voință, ci biochimie.",
            "id": "decision_discernment_l3_13_body_to_mind-screen-1"
          },
          {
            "kind": "content",
            "title": "Decizii după ce îți reglezi corpul",
            "body": "O gustare mică, apă sau o pauză de respirație pot schimba felul în care gândești opțiunile.",
            "id": "decision_discernment_l3_13_body_to_mind-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Amintește-ți o decizie luată „pe fugă”.",
              "Cum era corpul tău atunci?"
            ],
            "helper": "Deciziile bune încep cu un corp măcar stabil.",
            "id": "decision_discernment_l3_13_body_to_mind-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Corpul și decizia",
            "question": "Ce susține discernământul?",
            "options": [
              "Să ignori corpul complet.",
              "Să ai corpul minim stabil (hrană, apă, mișcare)."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l3_13_body_to_mind-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ajustare corporală",
            "prompt": "„Înaintea unei decizii importante, pot avea grijă de corpul meu astfel: ___.”",
            "id": "decision_discernment_l3_13_body_to_mind-screen-5"
          }
        ]
      },
      {
        "lessonId": "decision_discernment_l3_14_mind_to_body",
        "screens": [
          {
            "kind": "content",
            "title": "Mintea influențează corpul în decizii",
            "body": "Analiza excesivă, frica și criticile interioare ridică nivelul de adrenalină și te țin blocat.",
            "id": "decision_discernment_l3_14_mind_to_body-screen-1"
          },
          {
            "kind": "content",
            "title": "Decizie calmă",
            "body": "Când îți pui întrebări simple și accepți o parte de incertitudine, corpul se calmează și îți permite să alegi mai clar.",
            "id": "decision_discernment_l3_14_mind_to_body-screen-2"
          },
          {
            "kind": "checkpoint",
            "title": "Observare",
            "steps": [
              "Observă cum reacționează corpul când te critici pentru o decizie."
            ],
            "helper": "Mintea calmă creează corp calm.",
            "id": "decision_discernment_l3_14_mind_to_body-screen-3"
          },
          {
            "kind": "quiz",
            "title": "Minte și corp în decizie",
            "question": "Cum reduci blocajul corporal?",
            "options": [
              "Continuând să te agiți mental.",
              "Acceptând incertitudinea și punând întrebări scurte (ce vreau? ce risc?)."
            ],
            "correctIndex": 1,
            "id": "decision_discernment_l3_14_mind_to_body-screen-4"
          },
          {
            "kind": "reflection",
            "title": "Ritual mental",
            "prompt": "„Pentru a-mi calma corpul când iau decizii, pot repeta: ___.”",
            "id": "decision_discernment_l3_14_mind_to_body-screen-5"
          }
        ]
      }
    ]
  }
};

export const OMNI_KUNO_ARC_INTROS: OmniKunoArcIntroGroups = {
  "emotional_balance": {
    "trezire": {
      "id": "emotional_balance_arc_01_trezire",
      "title": "Trezirea",
      "body": "Începutul nu este despre schimbare, ci despre a învăța să vezi. În primele momente de lucru cu emoțiile nu trebuie să rezolvi nimic, doar să observi cum arată lumea ta interioară: respirația, ritmul, tensiunea, gândurile. Tot ce simți este permis și fiecare semn îți arată că ești prezent. Când privești lucrurile fără grabă apare trezirea, acel spațiu mic dintre stimul și reacție din care poți alege."
    },
    "primele_ciocniri": {
      "id": "emotional_balance_arc_02_primele_ciocniri",
      "title": "Primele Ciocniri",
      "body": "Pe măsură ce devii mai atent apar provocări: un ton ridicat, un mesaj sec, o critică, o discuție care se aprinde. Nu sunt obstacole, ci invitații care îți arată ce te atinge cel mai mult. Aici înveți respirația mai lentă, prezența în corp și pauza scurtă înainte de răspuns, nu ca să pari calm, ci ca să rămâi conectat la tine când exteriorul se mișcă repede."
    },
    "profunzime": {
      "id": "emotional_balance_arc_03_profunzime",
      "title": "Profunzime",
      "body": "Când mergi mai departe ies la suprafață emoții mai adânci: rușinea, vinovăția, teama de a dezamăgi, dorința de a te retrage. Nu sunt dușmani, ci straturi vechi care cer atenție. Înveți să stai cu ele fără să lupți, să nu le împingi deoparte și nici să te pierzi în ele. Respiri, observi și lași liniștea să se așeze chiar dacă nu există rezolvări rapide."
    },
    "maestrie": {
      "id": "emotional_balance_arc_04_maestrie",
      "title": "Maestrie",
      "body": "Echilibrul emoțional nu înseamnă control total și nici eliminarea reacțiilor. Maestria apare când îți cunoști ritmul și poți rămâne prezent chiar și în momente tensionate. În viața de zi cu zi înseamnă să alegi răspunsul, nu impulsul, în discuții reale, în oboseală sau sub presiune. Nu urmărești perfecțiunea, ci capacitatea de a folosi un protocol de reglare chiar și în zilele grele. Asta este maestria: o liniște activă, simplă și aplicată, pe care o poți lua cu tine oriunde."
    }
  },
  "focus_clarity": {
    "trezire": {
      "id": "focus_clarity_arc_01_trezire",
      "title": "Trezirea",
      "body": "Claritatea nu apare când forțezi mintea să decidă mai repede. Apare când încetinești suficient cât să vezi ce este important și ce este doar zgomot. În această primă etapă, înveți să observi fără să reacționezi imediat. Nu trebuie să schimbi tot. Este suficient să vezi mai clar ce se întâmplă în tine și în jurul tău."
    },
    "primele_ciocniri": {
      "id": "focus_clarity_arc_02_primele_ciocniri",
      "title": "Primele ciocniri",
      "body": "Când începi să aduci claritate, apar și ciocniri: sarcini care se bat cap în cap, presiune, întreruperi, oameni care vor lucruri diferite de la tine. Aici nu cauți perfecțiune. Cauți să recunoști mai repede momentele în care e prea mult și să revii la un singur punct de atenție, măcar pentru câteva minute."
    },
    "profunzime": {
      "id": "focus_clarity_arc_03_profunzime",
      "title": "Profunzime",
      "body": "Mai departe, observi că nu doar task-urile îți consumă atenția, ci și comparațiile, criticile interioare, așteptările nerealiste. Claritatea devine mai profundă când începi să vezi ce contează cu adevărat pentru tine și ce poți lăsa să treacă. Aici lucrezi cu valori și cu felul în care te raportezi la tine."
    },
    "maestrie": {
      "id": "focus_clarity_arc_04_maestrie",
      "title": "Maestrie",
      "body": "Maestria în claritate nu înseamnă să fii organizat perfect sau să nu mai fii distras niciodată. Înseamnă să știi să revii, din nou și din nou, la un singur pas clar. În viața de zi cu zi, asta înseamnă să alegi conștient ce faci acum, în loc să te lași împins de notificări, grabă sau presiune. Nu cauți control total, ci capacitatea de a folosi un mic protocol de claritate chiar și în zilele aglomerate."
    }
  },
  "relationships_communication": {
    "trezire": {
      "id": "relationships_communication_arc_01_trezire",
      "title": "Trezirea",
      "body": "Relațiile nu se schimbă prin forță sau argumente perfecte. Se schimbă atunci când ești dispus să vezi ce se întâmplă cu adevărat între tine și celălalt. În această etapă, înveți să observi tonul, ritmul și reacțiile tale, fără să sari imediat la apărare sau critică. Claritatea în comunicare începe cu o privire calmă spre propriile impulsuri."
    },
    "primele_ciocniri": {
      "id": "relationships_communication_arc_02_primele_ciocniri",
      "title": "Primele Ciocniri",
      "body": "Când începi să comunica mai conștient, apar inevitabil ciocniri: tensiuni, neînțelegeri, diferențe de stil. Aici nu urmărești să câștigi, ci să rămâi prezent. Înveți să recunoști momentul în care te încordezi, momentul în care ridici tonul, momentul în care mintea îți sare în defensivă. Comunicarea matură începe atunci când observi acele clipe fără să le lași să te conducă."
    },
    "profunzime": {
      "id": "relationships_communication_arc_03_profunzime",
      "title": "Profunzime",
      "body": "Pe măsură ce pășești mai adânc, vezi că nu doar cuvintele contează, ci și ce porți în tine: vechi obișnuințe, teamă de respingere, rușine, dorința de a fi înțeles. Aici înveți să exprimi ceea ce simți cu calm și sinceritate. Descoperi că apropierea reală apare atunci când spui lucruri simple: „Asta simt acum”, „Asta am nevoie”, fără acuză, fără mască."
    },
    "maestrie": {
      "id": "relationships_communication_arc_04_maestrie",
      "title": "Maestrie",
      "body": "Maestria în relații nu înseamnă să vorbești impecabil sau să ai mereu răspunsurile potrivite. Înseamnă să știi să revii la calmul interior în mijlocul tensiunilor. Să poți asculta chiar și atunci când e greu. Să pui limite fără agresivitate. Să recunoști un impuls, să respiri, și să alegi un răspuns care nu rănește nici pe tine, nici pe celălalt. Este puterea de a rămâne deschis fără să te pierzi."
    }
  },
  "energy_body": {
    "trezire": {
      "id": "energy_body_arc_01_trezire",
      "title": "Trezirea",
      "body": "Energia ta nu este doar o chestiune de voință. Corpul îți trimite semnale tot timpul: oboseală, agitație, tensiune, claritate. În această etapă, înveți să le vezi ca mesaje, nu ca probleme. Trezirea nu înseamnă să devii perfect, ci să începi să observi ce îți spune corpul în loc să îl forțezi să tacă."
    },
    "primele_ciocniri": {
      "id": "energy_body_arc_02_primele_ciocniri",
      "title": "Primele Ciocniri",
      "body": "Când începi să îți respecți energia, te lovești de obiceiuri vechi: nopți lungi, ecrane până târziu, mese sărite, mișcare puțină. Aici nu cauți să schimbi totul dintr-odată. Înveți să recunoști momentele în care corpul spune „ajunge” și să faci o singură alegere mai bună, nu zece deodată."
    },
    "profunzime": {
      "id": "energy_body_arc_03_profunzime",
      "title": "Profunzime",
      "body": "Mai adânc de oboseală sau agitație stau ritmurile tale reale: cum respiri, cum dormi, cum te miști, cum mănânci. În această etapă, descoperi că energia nu vine doar din odihnă, ci și din felul în care îți tratezi corpul de-a lungul zilei. Înveți să îți asculți limitele și să le accepți fără rușine."
    },
    "maestrie": {
      "id": "energy_body_arc_04_maestrie",
      "title": "Maestrie",
      "body": "Maestria în energie nu înseamnă să fii mereu plin de forță. Înseamnă să știi să te reglezi: să revii la un ritm sănătos după stres, să îți protejezi somnul, să introduci mișcare și respirație conștientă în zilele aglomerate. Nu urmărești control total, ci capacitatea de a folosi câteva ritualuri simple, chiar și atunci când viața nu te menajează."
    }
  },
  "self_trust": {
    "trezire": {
      "id": "self_trust_arc_01_trezire",
      "title": "Trezirea",
      "body": "Încrederea în tine nu apare din cuvinte mari, ci din promisiuni mici pe care le respecți. De câte ori spui „o să fac asta” și nu faci, ceva în tine se retrage. În această etapă, începi să observi cât de des te lași pe tine la urmă și cât de ușor îți explici asta."
    },
    "primele_ciocniri": {
      "id": "self_trust_arc_02_primele_ciocniri",
      "title": "Primele Ciocniri",
      "body": "Când începi să iei în serios promisiunile față de tine, te lovești de vechile obiceiuri: amânare, „nu acum”, „nu e chiar așa de important”. Aici nu cauți perfecțiune. Cauți să vezi mai clar momentele în care te trădezi pe tine, chiar în lucruri mici."
    },
    "profunzime": {
      "id": "self_trust_arc_03_profunzime",
      "title": "Profunzime",
      "body": "Mai adânc de amânări și scuze se află felul în care vorbești cu tine: vocea critică, vocea rușinată, vocea care spune că „nu are rost”. În această etapă, înveți să nu mai lași vocea critică să fie singura care comentează. Descoperi că poți construi o voce interioară care te sprijină, nu doar te judecă."
    },
    "maestrie": {
      "id": "self_trust_arc_04_maestrie",
      "title": "Maestrie",
      "body": "Maestria în încrederea în sine nu înseamnă să nu mai greșești niciodată. Înseamnă să poți spune: „Am greșit, repar” fără să te distrugi. Să îți alegi promisiunile cu mai multă grijă și să le duci până la capăt suficient de des încât să știi, calm: „Pot să am încredere în mine.”"
    }
  },
  "decision_discernment": {
    "trezire": {
      "id": "decision_discernment_arc_01_trezire",
      "title": "Trezirea",
      "body": "Deciziile tale îți desenează viața, pas cu pas. De multe ori alegi pe fugă: „merge și așa”, „vedem noi”. În această etapă, începi să observi când deciziile tale sunt reacții automate și când sunt alegeri reale. Trezirea înseamnă să vezi că poți încetini puțin înainte de „da” sau „nu”."
    },
    "primele_ciocniri": {
      "id": "decision_discernment_arc_02_primele_ciocniri",
      "title": "Primele Ciocniri",
      "body": "Când încerci să iei decizii mai conștiente, te lovești de frică, grabă și presiune: „dacă pierd șansa?”, „dacă aleg prost?”. În loc să cauți siguranță totală, înveți să cauți claritate suficientă pentru următorul pas. Nu ai nevoie de certitudine absolută; ai nevoie de pași care au sens acum."
    },
    "profunzime": {
      "id": "decision_discernment_arc_03_profunzime",
      "title": "Profunzime",
      "body": "Mai adânc de frica de a greși se află valorile tale și criteriile după care simți că o decizie este bună pentru tine. În această etapă, descoperi că o decizie bună nu este doar cea care „iese bine” la final, ci cea care este luată în acord cu ce contează pentru tine, cu informațiile pe care le aveai atunci."
    },
    "maestrie": {
      "id": "decision_discernment_arc_04_maestrie",
      "title": "Maestrie",
      "body": "Maestria în decizii nu înseamnă să alegi perfect de fiecare dată. Înseamnă să știi să te oprești o clipă, să clarifici ce vrei, ce riști și ce e important pentru tine, apoi să accepți consecințele cu calm. Chiar și când iese altfel decât ai sperat, te poți uita înapoi și spune: „Am ales cât de bine am putut, în acord cu mine.”"
    }
  }
};

export const OMNI_KUNO_LESSON_CONTENT: Record<string, OmniKunoLessonContent> = {
  "emotional_balance_l1_01_foundations": {
    "lessonId": "emotional_balance_l1_01_foundations",
    "screens": [
      {
        "kind": "content",
        "title": "Calmul activ",
        "body": "Calmul activ apare când nu grăbești nimic și nu împingi nimic. Doar observi ce trăiești, fără să te pierzi în reacție. Nu este pasivitate. Este claritate.",
        "id": "emotional_balance_l1_01_foundations-screen-1"
      },
      {
        "kind": "quiz",
        "title": "Tensiunea este un mesaj?",
        "question": "Ești de acord că recunoașterea tensiunii îți oferă un spațiu mic între impuls și acțiune?",
        "options": [
          "O observ, respir și folosesc protocolul de reglare înainte de răspuns.",
          "O ignor până dispare, altfel mă blochez.",
          "Încerc să nu mai simt nimic ca să pot continua."
        ],
        "correctIndex": 0,
        "explanation": "Observarea + protocolul îți dau timp să alegi răspunsul conștient, nu un impuls reflex.",
        "id": "emotional_balance_l1_01_foundations-screen-2"
      },
      {
        "kind": "content",
        "title": "Reține",
        "body": "Când tensiunea apare în corp, nu trebuie eliminată pe loc. Recunoașterea ei îți oferă acel spațiu dintre impuls și acțiune.",
        "id": "emotional_balance_l1_01_foundations-screen-3"
      },
      {
        "kind": "checkpoint",
        "title": "Unde sunt acum?",
        "steps": [
          "Gândește-te la un moment recent în care ai simțit tensiune.",
          "Observă-l fără să îl judeci."
        ],
        "helper": "Observarea este primul pas al calmului activ.",
        "id": "emotional_balance_l1_01_foundations-screen-4"
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
        "id": "emotional_balance_l1_01_foundations-screen-5"
      },
      {
        "kind": "reflection",
        "title": "O propoziție simplă",
        "prompt": "Completează: „Calmul activ pentru mine înseamnă ___.”",
        "id": "emotional_balance_l1_01_foundations-screen-6"
      }
    ]
  },
  "emotional_balance_l1_02_triggers": {
    "lessonId": "emotional_balance_l1_02_triggers",
    "screens": [
      {
        "kind": "content",
        "title": "Ce pornește reacția",
        "body": "Uneori, nu situația în sine e problema, ci modul în care corpul reacționează la ea. Observarea declanșatorilor îți face reacțiile mai previzibile.",
        "id": "emotional_balance_l1_02_triggers-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei semnale",
        "body": "Un ton ridicat, un mesaj scurt sau o privire pot aprinde reacții vechi. Nu e vina ta. Este doar un tipar.",
        "id": "emotional_balance_l1_02_triggers-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Declanșatorul meu",
        "steps": [
          "Adu-ți aminte un moment în care te-ai activat rapid.",
          "Ce anume a declanșat reacția?"
        ],
        "helper": "Identificarea declanșatorului reduce intensitatea viitoare.",
        "id": "emotional_balance_l1_02_triggers-screen-3"
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
        "id": "emotional_balance_l1_02_triggers-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O observare blândă",
        "prompt": "Completează: „Un declanșator frecvent pentru mine este ___.”",
        "id": "emotional_balance_l1_02_triggers-screen-5"
      }
    ]
  },
  "emotional_balance_l1_03_body_scan": {
    "lessonId": "emotional_balance_l1_03_body_scan",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul vede primul",
        "body": "Emoțiile apar mai întâi în corp, nu în gânduri. Un maxilar strâns sau umeri ridicați sunt semne timpurii ale tensiunii.",
        "id": "emotional_balance_l1_03_body_scan-screen-1"
      },
      {
        "kind": "content",
        "title": "20 de secunde",
        "body": "Observă pe rând maxilarul, umerii și respirația. Nu încerca să schimbi nimic. Doar vezi ce este acolo.",
        "id": "emotional_balance_l1_03_body_scan-screen-2"
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
        "id": "emotional_balance_l1_03_body_scan-screen-3"
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
        "id": "emotional_balance_l1_03_body_scan-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O notă scurtă",
        "prompt": "Completează: „Astăzi, corpul meu se simte ___.”",
        "id": "emotional_balance_l1_03_body_scan-screen-5"
      }
    ]
  },
  "emotional_balance_l1_04_micro_choices": {
    "lessonId": "emotional_balance_l1_04_micro_choices",
    "screens": [
      {
        "kind": "content",
        "title": "Spațiul dintre impuls și acțiune",
        "body": "Între ceea ce simți și ceea ce faci există un spațiu mic. În el se află alegerile tale.",
        "id": "emotional_balance_l1_04_micro_choices-screen-1"
      },
      {
        "kind": "content",
        "title": "Micro-decizii",
        "body": "O micro-decizie este o mică alegere: respiri înainte să răspunzi, lași telefonul jos, privești o secundă în jos înainte de a continua.",
        "id": "emotional_balance_l1_04_micro_choices-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "O decizie mică",
        "steps": [
          "Adu-ți aminte un moment în care ai reacționat rapid.",
          "Imaginează-ți că introduci o pauză de o respirație."
        ],
        "helper": "O pauză mică schimbă direcția.",
        "id": "emotional_balance_l1_04_micro_choices-screen-3"
      },
      {
        "kind": "protocol",
        "title": "Protocolul mini pentru impulsuri",
        "body": "Folosește acest protocol de fiecare dată când simți că impulsul devine mai rapid decât tine.",
        "id": "emotional_balance_l1_04_micro_choices-screen-4"
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
        "id": "emotional_balance_l1_04_micro_choices-screen-5"
      },
      {
        "kind": "reflection",
        "title": "O alegere pentru azi",
        "prompt": "Completează: „Azi vreau să introduc o pauză înainte de ___.”",
        "id": "emotional_balance_l1_04_micro_choices-screen-6"
      }
    ]
  },
  "emotional_balance_l1_05_breath_basics": {
    "lessonId": "emotional_balance_l1_05_breath_basics",
    "screens": [
      {
        "kind": "content",
        "title": "Respirația te sprijină",
        "body": "Respirația lentă trimite semnal de siguranță sistemului tău nervos. Nu ai nevoie de tehnici complicate.",
        "id": "emotional_balance_l1_05_breath_basics-screen-1"
      },
      {
        "kind": "content",
        "title": "Ritm simplu",
        "body": "Inspiră pe 4 timp, expiră puțin mai lung. Este suficient ca tensiunea să înceapă să scadă.",
        "id": "emotional_balance_l1_05_breath_basics-screen-2"
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
        "id": "emotional_balance_l1_05_breath_basics-screen-3"
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
        "id": "emotional_balance_l1_05_breath_basics-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Intenție scurtă",
        "prompt": "Completează: „Voi folosi respirația lentă când simt ___.”",
        "id": "emotional_balance_l1_05_breath_basics-screen-5"
      }
    ]
  },
  "emotional_balance_l1_06_pause_button": {
    "lessonId": "emotional_balance_l1_06_pause_button",
    "screens": [
      {
        "kind": "content",
        "title": "Puterea pauzei",
        "body": "Nu trebuie să răspunzi imediat. O pauză nu este slăbiciune. Este claritate.",
        "id": "emotional_balance_l1_06_pause_button-screen-1"
      },
      {
        "kind": "content",
        "title": "Pauză declarată",
        "body": "Poți spune simplu: „Revin în câteva minute.” Așa îți protejezi răspunsul, nu te retragi.",
        "id": "emotional_balance_l1_06_pause_button-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Pauză mentală",
        "steps": [
          "Alege o situație în care ai răspuns prea repede.",
          "Imaginează o pauză scurtă acolo."
        ],
        "helper": "Pauza schimbă tonul.",
        "id": "emotional_balance_l1_06_pause_button-screen-3"
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
        "id": "emotional_balance_l1_06_pause_button-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție utilă",
        "prompt": "Completează: „Când am nevoie de pauză, pot spune: ___.”",
        "id": "emotional_balance_l1_06_pause_button-screen-5"
      }
    ]
  },
  "emotional_balance_l1_07_boundaries": {
    "lessonId": "emotional_balance_l1_07_boundaries",
    "screens": [
      {
        "kind": "content",
        "title": "Limite blânde",
        "body": "Limitele nu sunt ziduri. Sunt spații sănătoase în care poți respira. Ele apar atunci când spui ce este potrivit pentru tine, fără agresivitate, fără grabă.",
        "id": "emotional_balance_l1_07_boundaries-screen-1"
      },
      {
        "kind": "content",
        "title": "Un „nu” calm",
        "body": "Un „nu” spus liniștit nu rupe relațiile. Le clarifică. Îți protejează timpul, atenția și energia.",
        "id": "emotional_balance_l1_07_boundaries-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare simplă",
        "steps": [
          "Alege o situație în care ai spus „da”, dar simțeai „nu”.",
          "Observă ce emoție era acolo."
        ],
        "helper": "Limitele bune protejează, nu atacă.",
        "id": "emotional_balance_l1_07_boundaries-screen-3"
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
        "id": "emotional_balance_l1_07_boundaries-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O limită mică",
        "prompt": "Completează: „O limită pe care vreau să o respect mai des este ___.”",
        "id": "emotional_balance_l1_07_boundaries-screen-5"
      }
    ]
  },
  "emotional_balance_l1_08_self_talk": {
    "lessonId": "emotional_balance_l1_08_self_talk",
    "screens": [
      {
        "kind": "content",
        "title": "Vocea din interior",
        "body": "Ce îți spui în minte influențează direct cum te simți. Un ton critic ridică tensiunea. Un ton blând o reduce.",
        "id": "emotional_balance_l1_08_self_talk-screen-1"
      },
      {
        "kind": "content",
        "title": "Din critic în ghid",
        "body": "Nu trebuie să elimini vocea critică. Doar să o transformi. În loc de „nu pot”, poți spune „încă învăț”.",
        "id": "emotional_balance_l1_08_self_talk-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă tonul",
        "steps": [
          "Adu în minte o frază dură pe care ți-o spui des.",
          "Reformuleaz-o într-o propoziție mai blândă."
        ],
        "helper": "Nu minți și nu exagera. Doar scoate duritatea.",
        "id": "emotional_balance_l1_08_self_talk-screen-3"
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
        "id": "emotional_balance_l1_08_self_talk-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază de sprijin",
        "prompt": "Completează: „Fraza pe care vreau să o folosesc mai des este: ___.”",
        "id": "emotional_balance_l1_08_self_talk-screen-5"
      }
    ]
  },
  "emotional_balance_l2_09_voice_tone": {
    "lessonId": "emotional_balance_l2_09_voice_tone",
    "screens": [
      {
        "kind": "content",
        "title": "Tonul schimbă totul",
        "body": "Nu doar cuvintele, ci și tonul influențează cum te simți. Uneori reacționezi la ton, nu la mesaj.",
        "id": "emotional_balance_l2_09_voice_tone-screen-1"
      },
      {
        "kind": "content",
        "title": "Separă cele două",
        "body": "Dacă separi tonul de conținut, devine mai ușor să înțelegi ce ți se transmite. Claritatea vine în pași mici.",
        "id": "emotional_balance_l2_09_voice_tone-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă diferența",
        "steps": [
          "Amintește-ți o discuție tensionată.",
          "Separă tonul de mesajul real."
        ],
        "helper": "Claritatea nu vine din grabă.",
        "id": "emotional_balance_l2_09_voice_tone-screen-3"
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
        "id": "emotional_balance_l2_09_voice_tone-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Reformulare calmă",
        "prompt": "Completează: „În discuții dificile vreau să-mi reamintesc să ___.”",
        "id": "emotional_balance_l2_09_voice_tone-screen-5"
      }
    ]
  },
  "emotional_balance_l2_10_criticism": {
    "lessonId": "emotional_balance_l2_10_criticism",
    "screens": [
      {
        "kind": "content",
        "title": "Critica te activează",
        "body": "Critica atinge zone sensibile. E normal să te activezi. Reacția nu este o greșeală.",
        "id": "emotional_balance_l2_10_criticism-screen-1"
      },
      {
        "kind": "content",
        "title": "Un pas în lateral",
        "body": "Poți să faci un pas mental în lateral. Îți dă spațiu între emoție și răspuns.",
        "id": "emotional_balance_l2_10_criticism-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Doar un pas",
        "steps": [
          "Alege o critică recentă.",
          "Observă cum ai reacționat atunci."
        ],
        "helper": "Spațiul interior reduce intensitatea.",
        "id": "emotional_balance_l2_10_criticism-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Primul pas în critică",
        "question": "Ce te ajută când primești critică?",
        "options": [
          "Să respiri, să observi ce emoție a fost atinsă și să faci un pas mental în lateral înainte de răspuns.",
          "Să te justifici imediat ca să nu pari slab.",
          "Să asculți doar ca să pregătești contraargumentul perfect."
        ],
        "correctIndex": 1,
        "explanation": "Pasul mental + observarea emoției îți dau spațiu pentru un răspuns mai potrivit decât impulsul defensiv.",
        "id": "emotional_balance_l2_10_criticism-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un gând util",
        "prompt": "Completează: „Când primesc critică, vreau să-mi amintesc că ___.”",
        "id": "emotional_balance_l2_10_criticism-screen-5"
      }
    ]
  },
  "emotional_balance_l2_11_conflict_opening": {
    "lessonId": "emotional_balance_l2_11_conflict_opening",
    "screens": [
      {
        "kind": "content",
        "title": "Începuturile unui conflict",
        "body": "Cele mai tensionate momente sunt primele secunde. Ele decid ritmul discuției.",
        "id": "emotional_balance_l2_11_conflict_opening-screen-1"
      },
      {
        "kind": "content",
        "title": "Rămâi în corp",
        "body": "Începutul unui conflict devine gestionabil dacă rămâi conectat la corp: respirație lentă, umeri jos, privire stabilă.",
        "id": "emotional_balance_l2_11_conflict_opening-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Primul moment",
        "steps": [
          "Adu în minte un conflict.",
          "Observă care a fost primul impuls."
        ],
        "helper": "Impulsul nu este finalul.",
        "id": "emotional_balance_l2_11_conflict_opening-screen-3"
      },
      {
        "kind": "protocol",
        "title": "Protocol pentru început de conflict",
        "body": "Folosește mini-protocolul înainte de primul răspuns ca să aduci ritmul discuției înapoi la tine.",
        "id": "emotional_balance_l2_11_conflict_opening-screen-4"
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
        "id": "emotional_balance_l2_11_conflict_opening-screen-5"
      },
      {
        "kind": "reflection",
        "title": "O decizie mică",
        "prompt": "Completează: „În conflicte, vreau să încep cu ___.”",
        "id": "emotional_balance_l2_11_conflict_opening-screen-6"
      }
    ]
  },
  "emotional_balance_l2_12_focus_under_stress": {
    "lessonId": "emotional_balance_l2_12_focus_under_stress",
    "screens": [
      {
        "kind": "content",
        "title": "Când stresul crește",
        "body": "Sub stres, atenția se îngustează. Vezi mai puține soluții. E normal.",
        "id": "emotional_balance_l2_12_focus_under_stress-screen-1"
      },
      {
        "kind": "content",
        "title": "O privire mai largă",
        "body": "Dacă ridici privirea și respiri mai lent, câmpul atenției se lărgește. Soluțiile apar.",
        "id": "emotional_balance_l2_12_focus_under_stress-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Lărgirea atenției",
        "steps": [
          "Gândește-te la un moment de stres recent.",
          "Observă ce s-a întâmplat cu atenția ta."
        ],
        "helper": "Respirația schimbă calitatea atenției.",
        "id": "emotional_balance_l2_12_focus_under_stress-screen-3"
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
        "id": "emotional_balance_l2_12_focus_under_stress-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O ancoră pentru atenție",
        "prompt": "Completează: „Când simt stres, vreau să-mi lărgesc atenția prin ___.”",
        "id": "emotional_balance_l2_12_focus_under_stress-screen-5"
      }
    ]
  },
  "emotional_balance_l2_13_low_energy": {
    "lessonId": "emotional_balance_l2_13_low_energy",
    "screens": [
      {
        "kind": "content",
        "title": "Când energia scade",
        "body": "Când ești obosit, emoțiile se amplifică. Claritatea se reduce. Nu este lipsă de disciplină.",
        "id": "emotional_balance_l2_13_low_energy-screen-1"
      },
      {
        "kind": "content",
        "title": "Un ritm mai lent",
        "body": "Uneori răspunsul corect este încetinirea. O pauză, o respirație, un pas în spate.",
        "id": "emotional_balance_l2_13_low_energy-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă oboseala",
        "steps": [
          "Adu în minte o situație în care ai fost iritabil.",
          "Observă cât de obosit erai."
        ],
        "helper": "Oboseala schimbă reacția.",
        "id": "emotional_balance_l2_13_low_energy-screen-3"
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
        "id": "emotional_balance_l2_13_low_energy-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O intenție simplă",
        "prompt": "Completează: „Când sunt obosit, vreau să îmi amintesc că ___.”",
        "id": "emotional_balance_l2_13_low_energy-screen-5"
      }
    ]
  },
  "emotional_balance_l2_14_multitasking": {
    "lessonId": "emotional_balance_l2_14_multitasking",
    "screens": [
      {
        "kind": "content",
        "title": "Multitasking-ul nu ajută emoțiile",
        "body": "Când faci prea multe lucruri odată, corpul percepe presiune. Reacțiile devin mai rapide.",
        "id": "emotional_balance_l2_14_multitasking-screen-1"
      },
      {
        "kind": "content",
        "title": "Revenire",
        "body": "Alege un singur lucru pentru câteva minute. Ritmul se schimbă când îl simplify.",
        "id": "emotional_balance_l2_14_multitasking-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un singur lucru",
        "steps": [
          "Observă ce faci des în paralel.",
          "Alege unu dintre ele și încetinește ritmul."
        ],
        "helper": "Claritatea vine din simplitate.",
        "id": "emotional_balance_l2_14_multitasking-screen-3"
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
        "id": "emotional_balance_l2_14_multitasking-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere mică",
        "prompt": "Completează: „Azi vreau să fac mai lent ___.”",
        "id": "emotional_balance_l2_14_multitasking-screen-5"
      }
    ]
  },
  "emotional_balance_l2_15_fast_reactions": {
    "lessonId": "emotional_balance_l2_15_fast_reactions",
    "screens": [
      {
        "kind": "content",
        "title": "Reacțiile rapide",
        "body": "Când reacționezi foarte repede, emoția decide pentru tine. Conștientizarea încetinește ritmul.",
        "id": "emotional_balance_l2_15_fast_reactions-screen-1"
      },
      {
        "kind": "content",
        "title": "Un moment înainte",
        "body": "Dacă poți observa impulsul înainte de acțiune, totul se schimbă.",
        "id": "emotional_balance_l2_15_fast_reactions-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă impulsul",
        "steps": [
          "Amintește-ți o reacție rapidă.",
          "Observă ce ai simțit în corp chiar înainte."
        ],
        "helper": "Impulsul devine vizibil prin atenție.",
        "id": "emotional_balance_l2_15_fast_reactions-screen-3"
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
        "id": "emotional_balance_l2_15_fast_reactions-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție calmă",
        "prompt": "Completează: „Când impulsul apare, vreau să ___.”",
        "id": "emotional_balance_l2_15_fast_reactions-screen-5"
      }
    ]
  },
  "emotional_balance_l2_16_pressure_moments": {
    "lessonId": "emotional_balance_l2_16_pressure_moments",
    "screens": [
      {
        "kind": "content",
        "title": "Momente sub presiune",
        "body": "Sub presiune, corpul vrea să grăbească totul. Claritatea vine dacă încetinești măcar un gest.",
        "id": "emotional_balance_l2_16_pressure_moments-screen-1"
      },
      {
        "kind": "content",
        "title": "Un ritm propriu",
        "body": "Nu trebuie să ții ritmul altcuiva. Poți alege ritmul tău.",
        "id": "emotional_balance_l2_16_pressure_moments-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un gest încetinit",
        "steps": [
          "Adu-ți aminte un moment tensionat.",
          "Imaginează-ți că încetinești doar primul tău gest."
        ],
        "helper": "Ritmul se schimbă cu un singur gest.",
        "id": "emotional_balance_l2_16_pressure_moments-screen-3"
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
        "id": "emotional_balance_l2_16_pressure_moments-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere calmă",
        "prompt": "Completează: „Când presiunea crește, vreau să ___.”",
        "id": "emotional_balance_l2_16_pressure_moments-screen-5"
      }
    ]
  },
  "emotional_balance_l3_17_shame": {
    "lessonId": "emotional_balance_l3_17_shame",
    "screens": [
      {
        "kind": "content",
        "title": "Rușinea apare în liniște",
        "body": "Rușinea este o emoție care te face să te micșorezi. Nu pentru că ai făcut ceva greșit, ci pentru că îți pasă prea mult.",
        "id": "emotional_balance_l3_17_shame-screen-1"
      },
      {
        "kind": "content",
        "title": "Nu fugi de ea",
        "body": "Dacă încerci să o ascunzi, se adâncește. Dacă o privești cu blândețe, începe să se dizolve.",
        "id": "emotional_balance_l3_17_shame-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare blândă",
        "steps": [
          "Amintește-ți un moment recent de rușine.",
          "Observă-l fără critică, ca un gând trecător."
        ],
        "helper": "Rușinea scade când este privită, nu ascunsă.",
        "id": "emotional_balance_l3_17_shame-screen-3"
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
        "id": "emotional_balance_l3_17_shame-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție de sprijin",
        "prompt": "Completează: „Când apare rușinea, îmi amintesc că ___.”",
        "id": "emotional_balance_l3_17_shame-screen-5"
      }
    ]
  },
  "emotional_balance_l3_18_guilt": {
    "lessonId": "emotional_balance_l3_18_guilt",
    "screens": [
      {
        "kind": "content",
        "title": "Vinovăția spune o poveste",
        "body": "Vinovăția apare când simți că ai făcut mai puțin decât ai fi putut. Este emoția responsabilității, nu a defectului.",
        "id": "emotional_balance_l3_18_guilt-screen-1"
      },
      {
        "kind": "content",
        "title": "Fără autocritică",
        "body": "Nu te ajută să te lovești mental. Te ajută să privești situația cu mai multă claritate.",
        "id": "emotional_balance_l3_18_guilt-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă mesajul",
        "steps": [
          "Alege o situație de vinovăție.",
          "Observă dacă este vina faptelor sau a așteptărilor prea mari."
        ],
        "helper": "Vinovăția sănătoasă ghidă, nu apasă.",
        "id": "emotional_balance_l3_18_guilt-screen-3"
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
        "id": "emotional_balance_l3_18_guilt-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O clarificare simplă",
        "prompt": "Completează: „Din situația aceea am învățat că ___.”",
        "id": "emotional_balance_l3_18_guilt-screen-5"
      }
    ]
  },
  "emotional_balance_l3_19_withdrawal": {
    "lessonId": "emotional_balance_l3_19_withdrawal",
    "screens": [
      {
        "kind": "content",
        "title": "Retragerea",
        "body": "Uneori te retragi pentru că este prea mult. Este un mecanism de protecție, nu o slăbiciune.",
        "id": "emotional_balance_l3_19_withdrawal-screen-1"
      },
      {
        "kind": "content",
        "title": "Întoarcerea",
        "body": "Nu trebuie să revii imediat. Doar să rămâi conectat la tine cât timp faci un pas înapoi.",
        "id": "emotional_balance_l3_19_withdrawal-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă motivul",
        "steps": [
          "Gândește-te la o situație în care te-ai retras.",
          "Ce anume te-a copleșit?"
        ],
        "helper": "Claritatea vine înainte de întoarcere.",
        "id": "emotional_balance_l3_19_withdrawal-screen-3"
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
        "id": "emotional_balance_l3_19_withdrawal-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O revenire blândă",
        "prompt": "Completează: „Când mă retrag, vreau să revin după ce ___.”",
        "id": "emotional_balance_l3_19_withdrawal-screen-5"
      }
    ]
  },
  "emotional_balance_l3_20_hard_conversations": {
    "lessonId": "emotional_balance_l3_20_hard_conversations",
    "screens": [
      {
        "kind": "content",
        "title": "Discuțiile dificile",
        "body": "Discuțiile grele cer prezență, nu perfecțiune. Corpul simte tensiunea înaintea cuvintelor.",
        "id": "emotional_balance_l3_20_hard_conversations-screen-1"
      },
      {
        "kind": "content",
        "title": "Început calm",
        "body": "Dacă respiri lent înainte de a începe, discuția ia altă direcție.",
        "id": "emotional_balance_l3_20_hard_conversations-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Pregătirea",
        "steps": [
          "Adu în minte o discuție grea.",
          "Cum ai vrea să începi data viitoare?"
        ],
        "helper": "Începutul calmează restul.",
        "id": "emotional_balance_l3_20_hard_conversations-screen-3"
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
        "id": "emotional_balance_l3_20_hard_conversations-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Prima frază",
        "prompt": "Completează: „Când încep o discuție grea, pot spune: ___.”",
        "id": "emotional_balance_l3_20_hard_conversations-screen-5"
      }
    ]
  },
  "emotional_balance_l3_21_restoring_balance": {
    "lessonId": "emotional_balance_l3_21_restoring_balance",
    "screens": [
      {
        "kind": "content",
        "title": "Când te pierzi pe drum",
        "body": "Toți ne pierdem echilibrul uneori. Nu este eșec. E doar un semn că ai nevoie de o pauză.",
        "id": "emotional_balance_l3_21_restoring_balance-screen-1"
      },
      {
        "kind": "content",
        "title": "Revenirea",
        "body": "O revenire începe cu cel mai mic gest: o respirație, o observare, o clipă de liniște.",
        "id": "emotional_balance_l3_21_restoring_balance-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mic gest",
        "steps": [
          "Alege o zi în care ai pierdut echilibrul.",
          "Ce mic gest te-ar fi ajutat?"
        ],
        "helper": "Revenirea este un proces, nu un moment.",
        "id": "emotional_balance_l3_21_restoring_balance-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Cum revii la echilibru?",
        "question": "Ce este cel mai util?",
        "options": [
          "Să revii la un gest mic (respirație, notițe, protocol) și apoi să alegi răspunsul.",
          "Să te critici dur ca să nu repeți greșeala.",
          "Să ignori emoția și să te arunci într-un nou task."
        ],
        "correctIndex": 0,
        "explanation": "Revenirea reală vine dintr-un gest mic conștient care îți redeschide spațiul de alegere, nu din critică sau evitare.",
        "id": "emotional_balance_l3_21_restoring_balance-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere pentru mine",
        "prompt": "Completează: „Când simt că mă pierd, pot începe prin ___.”",
        "id": "emotional_balance_l3_21_restoring_balance-screen-5"
      }
    ]
  },
  "emotional_balance_l3_22_presence_under_fire": {
    "lessonId": "emotional_balance_l3_22_presence_under_fire",
    "screens": [
      {
        "kind": "content",
        "title": "Prezența în momente grele",
        "body": "În tensiune mare, corpul vrea să accelereze. Prezența apare când încetinești doar un singur lucru: respirația, vocea, gestul.",
        "id": "emotional_balance_l3_22_presence_under_fire-screen-1"
      },
      {
        "kind": "content",
        "title": "În centru",
        "body": "Când rămâi în centru, nu ești împins de val, chiar dacă emoția este puternică.",
        "id": "emotional_balance_l3_22_presence_under_fire-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un pas spre prezență",
        "steps": [
          "Alege o situație intensă.",
          "Observă ce ai putea încetini data viitoare."
        ],
        "helper": "Prezența vine prin încetinire.",
        "id": "emotional_balance_l3_22_presence_under_fire-screen-3"
      },
      {
        "kind": "protocol",
        "title": "Protocol scurt pentru momente intense",
        "body": "Repetă protocolul în versiunea scurtă (observ, respir, simt corpul, aleg răspunsul) când simți că totul se accelerează.",
        "id": "emotional_balance_l3_22_presence_under_fire-screen-4"
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
        "id": "emotional_balance_l3_22_presence_under_fire-screen-5"
      },
      {
        "kind": "reflection",
        "title": "Un anchor mic",
        "prompt": "Completează: „Când totul e intens, pot încetini ___.”",
        "id": "emotional_balance_l3_22_presence_under_fire-screen-6"
      }
    ]
  },
  "emotional_balance_l3_23_centering": {
    "lessonId": "emotional_balance_l3_23_centering",
    "screens": [
      {
        "kind": "content",
        "title": "Așezarea în tine",
        "body": "Centrarea nu este o tehnică. Este o revenire la un punct interior stabil.",
        "id": "emotional_balance_l3_23_centering-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei respirații",
        "body": "Trei respirații lente sunt suficiente pentru a simți schimbarea.",
        "id": "emotional_balance_l3_23_centering-screen-2"
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
        "id": "emotional_balance_l3_23_centering-screen-3"
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
        "id": "emotional_balance_l3_23_centering-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un pas spre centru",
        "prompt": "Completează: „Mă pot centra rapid prin ___.”",
        "id": "emotional_balance_l3_23_centering-screen-5"
      }
    ]
  },
  "emotional_balance_l3_24_soft_strength": {
    "lessonId": "emotional_balance_l3_24_soft_strength",
    "screens": [
      {
        "kind": "content",
        "title": "Puterea blândă",
        "body": "Echilibrul emoțional nu este rigiditate. Este o formă blândă de forță care nu rănește și nu împinge.",
        "id": "emotional_balance_l3_24_soft_strength-screen-1"
      },
      {
        "kind": "content",
        "title": "Întreg",
        "body": "Când te simți întreg, răspunsurile tale sunt simple, clare și calme.",
        "id": "emotional_balance_l3_24_soft_strength-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă puterea ta",
        "steps": [
          "Adu-ți aminte un moment în care ai răspuns calm.",
          "Observă ce te-a ajutat atunci."
        ],
        "helper": "Puterea blândă se construiește.",
        "id": "emotional_balance_l3_24_soft_strength-screen-3"
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
        "id": "emotional_balance_l3_24_soft_strength-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție finală",
        "prompt": "Completează: „Pentru mine, puterea blândă înseamnă ___.”",
        "id": "emotional_balance_l3_24_soft_strength-screen-5"
      }
    ]
  },
  "emotional_balance_l3_13_body_to_mind": {
    "lessonId": "emotional_balance_l3_13_body_to_mind",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul influențează intensitatea emoțiilor",
        "body": "Când glicemia este instabilă sau corpul este flămând ori tensionat, emoțiile devin mai puternice și mai greu de reglat. Nu este „slăbiciune”; este un răspuns fizic.",
        "id": "emotional_balance_l3_13_body_to_mind-screen-1"
      },
      {
        "kind": "content",
        "title": "Reacție sau realitate?",
        "body": "De multe ori, iritarea, furia sau anxietatea cresc pentru că organismul este în stare de alarmă metabolică.",
        "id": "emotional_balance_l3_13_body_to_mind-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la o perioadă în care ai reacționat disproporționat.",
          "Cum era corpul tău atunci? Flămând, obosit, deshidratat?"
        ],
        "helper": "Uneori emoțiile nu reflectă situația, ci starea corpului.",
        "id": "emotional_balance_l3_13_body_to_mind-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Corp și emoții",
        "question": "Ce poate amplifica emoțiile?",
        "options": [
          "Doar gândurile negative.",
          "Glicemia instabilă, foamea sau oboseala."
        ],
        "correctIndex": 1,
        "id": "emotional_balance_l3_13_body_to_mind-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Conștientizare",
        "prompt": "„O situație în care corpul mi-a amplificat emoțiile a fost ___.”",
        "id": "emotional_balance_l3_13_body_to_mind-screen-5"
      }
    ]
  },
  "emotional_balance_l3_14_mind_to_body": {
    "lessonId": "emotional_balance_l3_14_mind_to_body",
    "screens": [
      {
        "kind": "content",
        "title": "Emoțiile influențează corpul",
        "body": "Când ești stresat sau supărat, corpul intră în tensiune: respirația se scurtează, pulsul crește, digestia încetinește.",
        "id": "emotional_balance_l3_14_mind_to_body-screen-1"
      },
      {
        "kind": "content",
        "title": "Reglarea emoțiilor prin corp",
        "body": "O respirație lentă sau o mică mișcare poate reduce tensiunea și poate calma valul emoțional fără să forțezi nimic mental.",
        "id": "emotional_balance_l3_14_mind_to_body-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă",
        "steps": [
          "Gândește-te la ultimul moment de furie sau anxietate.",
          "Unde ai simțit tensiunea în corp?"
        ],
        "helper": "Emoțiile lăsate nesupravegheate rămân în corp.",
        "id": "emotional_balance_l3_14_mind_to_body-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Minte și corp",
        "question": "Cum poți calma o emoție ridicată?",
        "options": [
          "Doar prin analiză mentală.",
          "Prin reglarea corpului: respirație, relaxare, mișcare blândă."
        ],
        "correctIndex": 1,
        "id": "emotional_balance_l3_14_mind_to_body-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Integrare",
        "prompt": "„Un gest corporal care îmi calmează emoțiile este ___.”",
        "id": "emotional_balance_l3_14_mind_to_body-screen-5"
      }
    ]
  },
  "focus_clarity_l1_01_noise": {
    "lessonId": "focus_clarity_l1_01_noise",
    "screens": [
      {
        "kind": "content",
        "title": "Zgomot exterior, zgomot interior",
        "body": "Mintea se umple ușor de zgomot: notificări, cereri, gânduri, griji. Când totul este amestecat, devine greu să știi ce vrei de fapt să faci.",
        "id": "focus_clarity_l1_01_noise-screen-1"
      },
      {
        "kind": "content",
        "title": "Un pas înapoi",
        "body": "Primul pas spre claritate nu este să rezolvi tot. Este să ieși un moment din amestec și să observi ce se întâmplă, fără să judeci.",
        "id": "focus_clarity_l1_01_noise-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la ultima jumătate de oră.",
          "Câte lucruri ți-au cerut atenția?"
        ],
        "helper": "Observarea este primul filtru.",
        "id": "focus_clarity_l1_01_noise-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Primul pas spre claritate",
        "question": "Ce este un prim pas sănătos spre claritate?",
        "options": [
          "Să rezolvi totul cât mai repede.",
          "Să observi ce se întâmplă, fără să judeci imediat.",
          "Să ignori complet tot ce se întâmplă."
        ],
        "correctIndex": 1,
        "explanation": "Nu poți clarifica ceva ce nu vezi.",
        "id": "focus_clarity_l1_01_noise-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție",
        "prompt": "Completează: „Mintea mea este plină acum în special de ___.”",
        "id": "focus_clarity_l1_01_noise-screen-5"
      }
    ]
  },
  "focus_clarity_l1_02_single_point": {
    "lessonId": "focus_clarity_l1_02_single_point",
    "screens": [
      {
        "kind": "content",
        "title": "Un singur punct de atenție",
        "body": "Atenția se așază mai ușor pe un singur lucru. Când te împarți în prea multe direcții, oboseala și confuzia cresc.",
        "id": "focus_clarity_l1_02_single_point-screen-1"
      },
      {
        "kind": "content",
        "title": "Un lucru pe rând",
        "body": "Alege un singur lucru pentru câteva minute. Nu trebuie să fie cel mai important din viață. Doar să fie unic în acel moment.",
        "id": "focus_clarity_l1_02_single_point-screen-2"
      },
      {
        "kind": "protocol",
        "title": "Protocol de claritate (FOCUS)",
        "steps": [
          "Mă opresc câteva secunde.",
          "Aleg un singur punct de atenție.",
          "Fac două respirații lente.",
          "Îmi propun un pas mic și clar în direcția acelui punct."
        ],
        "id": "focus_clarity_l1_02_single_point-screen-3"
      },
      {
        "kind": "checkpoint",
        "title": "Aplicare",
        "steps": [
          "Gândește-te la 3 lucruri pe care le ai de făcut azi.",
          "Alege unul singur pentru următoarele 10 minute."
        ],
        "helper": "Claritatea începe cu un singur punct.",
        "id": "focus_clarity_l1_02_single_point-screen-4"
      },
      {
        "kind": "quiz",
        "title": "Atenția",
        "question": "Ce te ajută cel mai mult să îți adâncești atenția?",
        "options": [
          "Să lucrezi la mai multe lucruri în paralel.",
          "Să alegi un singur lucru pentru o perioadă scurtă.",
          "Să verifici constant notificările."
        ],
        "correctIndex": 1,
        "explanation": "Atenția profundă are nevoie de selecție, nu de dispersie.",
        "id": "focus_clarity_l1_02_single_point-screen-5"
      },
      {
        "kind": "reflection",
        "title": "Un punct clar",
        "prompt": "Completează: „Astăzi vreau să acord 10 minute doar pentru ___.”",
        "id": "focus_clarity_l1_02_single_point-screen-6"
      }
    ]
  },
  "focus_clarity_l1_03_values": {
    "lessonId": "focus_clarity_l1_03_values",
    "screens": [
      {
        "kind": "content",
        "title": "Ce contează pentru tine",
        "body": "Claritatea nu este doar despre task-uri. Este și despre ce este important pentru tine. Când știi ce contează, devine mai ușor să spui „da” sau „nu”.",
        "id": "focus_clarity_l1_03_values-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei lucruri importante",
        "body": "Gândește-te la trei lucruri care sunt cu adevărat importante pentru tine în această perioadă: oameni, proiecte, sănătate, învățare.",
        "id": "focus_clarity_l1_03_values-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mic inventar",
        "steps": [
          "Alege trei lucruri importante pentru tine acum.",
          "Spune-le în minte pe nume."
        ],
        "helper": "Când au nume, deciziile devin mai ușoare.",
        "id": "focus_clarity_l1_03_values-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Claritate și valori",
        "question": "De ce ajută să știi ce este important pentru tine?",
        "options": [
          "Te încurcă în a lua decizii rapide.",
          "Te ajută să alegi mai ușor ce merită atenția ta.",
          "Nu are nicio legătură cu deciziile."
        ],
        "correctIndex": 1,
        "explanation": "Claritatea direcției vine din ceea ce contează pentru tine, nu doar din ce apare în fața ta.",
        "id": "focus_clarity_l1_03_values-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un lucru principal",
        "prompt": "Completează: „În perioada asta, un lucru important pentru mine este ___.”",
        "id": "focus_clarity_l1_03_values-screen-5"
      }
    ]
  },
  "focus_clarity_l1_04_scatter": {
    "lessonId": "focus_clarity_l1_04_scatter",
    "screens": [
      {
        "kind": "content",
        "title": "Mintea împrăștiată",
        "body": "Când mintea sare continuu de la un lucru la altul, ești ocupat, dar nu neapărat eficient. Oboseala crește, claritatea scade.",
        "id": "focus_clarity_l1_04_scatter-screen-1"
      },
      {
        "kind": "content",
        "title": "Încetinire",
        "body": "Dacă reduci viteza cu puțin, apare mai mult spațiu de gândire. Claritatea are nevoie de un ritm care nu te strivește.",
        "id": "focus_clarity_l1_04_scatter-screen-2"
      },
      {
        "kind": "protocol",
        "title": "Protocol de claritate în mijlocul haosului",
        "steps": [
          "Observ că sar de la un lucru la altul.",
          "Aleg un singur lucru la care mă întorc.",
          "Respiri de două ori lent.",
          "Notez, mental sau pe hârtie, următorul pas concret."
        ],
        "id": "focus_clarity_l1_04_scatter-screen-3"
      },
      {
        "kind": "checkpoint",
        "title": "Observă ritmul",
        "steps": [
          "Observă cât de des îți verifici telefonul într-o oră.",
          "Observă între câte sarcini sari în 30 de minute."
        ],
        "helper": "Ritmul actual îți arată de ce e greu să te clarifici.",
        "id": "focus_clarity_l1_04_scatter-screen-4"
      },
      {
        "kind": "quiz",
        "title": "Ritm și claritate",
        "question": "Ce ajută claritatea într-o zi încărcată?",
        "options": [
          "Să crești viteza și mai mult.",
          "Să încetinești puțin și să revii la un singur lucru.",
          "Să te ocupi doar de ce strigă cel mai tare."
        ],
        "correctIndex": 1,
        "explanation": "Un ritm prea rapid îngustează atenția și reduce claritatea.",
        "id": "focus_clarity_l1_04_scatter-screen-5"
      },
      {
        "kind": "reflection",
        "title": "O ajustare mică",
        "prompt": "Completează: „Aș vrea să încetinesc un pic ritmul atunci când ___.”",
        "id": "focus_clarity_l1_04_scatter-screen-6"
      }
    ]
  },
  "focus_clarity_l1_05_priorities": {
    "lessonId": "focus_clarity_l1_05_priorities",
    "screens": [
      {
        "kind": "content",
        "title": "Nu poți face totul la fel de bine",
        "body": "Dacă toate lucrurile sunt „prioritare”, niciunul nu mai este. Claritatea înseamnă să accepți că unele vor merge mai lent.",
        "id": "focus_clarity_l1_05_priorities-screen-1"
      },
      {
        "kind": "content",
        "title": "Primul, nu toate",
        "body": "Întreabă-te: „Care este un singur lucru care, dacă merge bine azi, mă ajută cel mai mult?”.",
        "id": "focus_clarity_l1_05_priorities-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Alegerea",
        "steps": [
          "Notează mental trei lucruri de făcut azi.",
          "Alege unul singur ca fiind „primul”."
        ],
        "helper": "Primul lucru clar reduce confuzia.",
        "id": "focus_clarity_l1_05_priorities-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Priorități",
        "question": "Ce descrie cel mai bine o prioritate?",
        "options": [
          "Orice lucru care apare în fața ta.",
          "Un lucru ales conștient, înaintea celorlalte.",
          "Ce îți cere primul mesaj din telefon."
        ],
        "correctIndex": 1,
        "explanation": "Prioritatea este o alegere, nu un reflex.",
        "id": "focus_clarity_l1_05_priorities-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Primul lucru",
        "prompt": "Completează: „Astăzi, prioritatea mea principală este ___.”",
        "id": "focus_clarity_l1_05_priorities-screen-5"
      }
    ]
  },
  "focus_clarity_l1_06_inner_clutter": {
    "lessonId": "focus_clarity_l1_06_inner_clutter",
    "screens": [
      {
        "kind": "content",
        "title": "Zgomot interior",
        "body": "Grijile, comparațiile și criticile interioare consumă atenția la fel de mult ca notificările și task-urile.",
        "id": "focus_clarity_l1_06_inner_clutter-screen-1"
      },
      {
        "kind": "content",
        "title": "O notă mai blândă",
        "body": "Când reduci tonul critic față de tine, mintea se liniștește și vede mai clar ce ai de făcut.",
        "id": "focus_clarity_l1_06_inner_clutter-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă vocea",
        "steps": [
          "Observă ce îți spui în minte când nu termini tot ce ți-ai propus.",
          "Întreabă-te: „Aș vorbi așa cu cineva drag mie?”."
        ],
        "helper": "Un ton mai blând eliberează spațiu mental.",
        "id": "focus_clarity_l1_06_inner_clutter-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Dialogul interior și claritatea",
        "question": "Cum influențează dialogul interior claritatea?",
        "options": [
          "Nu are niciun efect.",
          "Un dialog blând reduce zgomotul și îți dă mai multă energie de gândire.",
          "Critica dură te face automat mai clar."
        ],
        "correctIndex": 1,
        "explanation": "Claritatea are nevoie de spațiu, nu de atac.",
        "id": "focus_clarity_l1_06_inner_clutter-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază nouă",
        "prompt": "Completează: „Data viitoare când nu reușesc tot, pot să îmi spun: ___.”",
        "id": "focus_clarity_l1_06_inner_clutter-screen-5"
      }
    ]
  },
  "focus_clarity_l1_07_planning_light": {
    "lessonId": "focus_clarity_l1_07_planning_light",
    "screens": [
      {
        "kind": "content",
        "title": "Plan simplu",
        "body": "Un plan bun nu trebuie să fie complicat. Ai nevoie mai ales să știi ce faci acum și ce vine după.",
        "id": "focus_clarity_l1_07_planning_light-screen-1"
      },
      {
        "kind": "content",
        "title": "Structură ușoară",
        "body": "Poți folosi structura: acum – după – mai târziu. Doar trei pași simpli, fără detalii inutile.",
        "id": "focus_clarity_l1_07_planning_light-screen-2"
      },
      {
        "kind": "protocol",
        "title": "Protocol de planificare ușoară",
        "steps": [
          "Întreb: „Ce fac acum?” și numesc un singur lucru.",
          "Întreb: „Ce vine după?” și aleg un pas realist.",
          "Întreb: „Ce poate aștepta mai târziu?” și accept că nu le fac pe toate acum."
        ],
        "id": "focus_clarity_l1_07_planning_light-screen-3"
      },
      {
        "kind": "checkpoint",
        "title": "Mic plan",
        "steps": [
          "Alege o sarcină din ziua de azi.",
          "Împarte-o în: acum, după, mai târziu."
        ],
        "helper": "Planul simplu păstrează claritatea și energia.",
        "id": "focus_clarity_l1_07_planning_light-screen-4"
      },
      {
        "kind": "quiz",
        "title": "Planificare",
        "question": "Ce este util într-un plan simplu?",
        "options": [
          "Să aibă zeci de detalii și scenarii.",
          "Să aibă pași clari: acum, după, mai târziu.",
          "Să rămână doar în minte, fără să fie formulat clar."
        ],
        "correctIndex": 1,
        "explanation": "Claritatea vine din pași simpli și concreți, nu din complexitate.",
        "id": "focus_clarity_l1_07_planning_light-screen-5"
      },
      {
        "kind": "reflection",
        "title": "Un pas clar",
        "prompt": "Completează: „Pasul meu ‘acum’ pentru un lucru important este ___.”",
        "id": "focus_clarity_l1_07_planning_light-screen-6"
      }
    ]
  },
  "focus_clarity_l1_08_daily_reset": {
    "lessonId": "focus_clarity_l1_08_daily_reset",
    "screens": [
      {
        "kind": "content",
        "title": "Reset zilnic",
        "body": "La finalul zilei, mintea poate rămâne blocată pe ce nu ai făcut. Un reset scurt aduce ordine și îți protejează energia.",
        "id": "focus_clarity_l1_08_daily_reset-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei întrebări",
        "body": "La final de zi, poți să te întrebi: „Ce a mers bine azi?”, „Ce pot îmbunătăți?”, „Care este un lucru important pentru mâine?”.",
        "id": "focus_clarity_l1_08_daily_reset-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Privire înapoi",
        "steps": [
          "Răspunde mental la cele trei întrebări pentru ziua de azi sau pentru ieri."
        ],
        "helper": "Aceasta este o închidere, nu un proces-verbal de critică.",
        "id": "focus_clarity_l1_08_daily_reset-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Rolul resetului",
        "question": "Ce rol are resetul zilnic?",
        "options": [
          "Să te critici pentru tot ce nu ai făcut.",
          "Să îți așeze mintea și să îți clarifice direcția pentru mâine.",
          "Să adaugi și mai multe lucruri pe listă."
        ],
        "correctIndex": 1,
        "explanation": "Un reset scurt eliberează spațiu și îți dă o direcție clară.",
        "id": "focus_clarity_l1_08_daily_reset-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O intenție pentru mâine",
        "prompt": "Completează: „Mâine aș vrea să acord atenție în special la ___.”",
        "id": "focus_clarity_l1_08_daily_reset-screen-5"
      }
    ]
  },
  "focus_clarity_l3_13_body_to_mind": {
    "lessonId": "focus_clarity_l3_13_body_to_mind",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul influențează focusul",
        "body": "Atunci când ești flămând, deshidratat sau ai glicemia oscilantă, creierul prioritizează supraviețuirea, nu atenția.",
        "id": "focus_clarity_l3_13_body_to_mind-screen-1"
      },
      {
        "kind": "content",
        "title": "Stabilitate metabolică = claritate",
        "body": "Două mese stabile și o hidratare minimă susțin focusul mai mult decât motivația pură.",
        "id": "focus_clarity_l3_13_body_to_mind-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la ultimul moment în care nu te puteai concentra.",
          "Cum era corpul tău atunci?"
        ],
        "helper": "Focusul începe în corp.",
        "id": "focus_clarity_l3_13_body_to_mind-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Claritate și corp",
        "question": "Ce ajută cel mai mult focusul?",
        "options": [
          "Să sari peste mese.",
          "Un corp stabil: hrană, hidratare, respirație."
        ],
        "correctIndex": 1,
        "id": "focus_clarity_l3_13_body_to_mind-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Reglați",
        "prompt": "„Un gest mic care îmi îmbunătățește focusul este ___.”",
        "id": "focus_clarity_l3_13_body_to_mind-screen-5"
      }
    ]
  },
  "focus_clarity_l3_14_mind_to_body": {
    "lessonId": "focus_clarity_l3_14_mind_to_body",
    "screens": [
      {
        "kind": "content",
        "title": "Mintea influențează tensiunea corporală",
        "body": "Gândurile grăbite, anxioase sau critique cresc tensiunea musculară și scurtează respirația, reducând claritatea.",
        "id": "focus_clarity_l3_14_mind_to_body-screen-1"
      },
      {
        "kind": "content",
        "title": "Atenție și relaxare",
        "body": "Când îți domolești ritmul mental, corpul răspunde cu relaxare, iar focusul revine.",
        "id": "focus_clarity_l3_14_mind_to_body-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Observă cum respiră corpul tău când ești foarte încărcat mental."
        ],
        "helper": "Mintea tensionată creează corp tensionat.",
        "id": "focus_clarity_l3_14_mind_to_body-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Minte → corp",
        "question": "Ce se întâmplă când gândurile se accelerează?",
        "options": [
          "Corpul se relaxează.",
          "Corpul intră în tensiune și focusul scade."
        ],
        "correctIndex": 1,
        "id": "focus_clarity_l3_14_mind_to_body-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un gest mental",
        "prompt": "„Un gând sau o frază care îmi calmează corpul este ___.”",
        "id": "focus_clarity_l3_14_mind_to_body-screen-5"
      }
    ]
  },
  "relationships_communication_protocol": {
    "lessonId": "relationships_communication_protocol",
    "screens": [
      {
        "kind": "protocol",
        "title": "Protocol de comunicare calmă",
        "steps": [
          "Observ impulsul: tensiune, ton ridicat, grăbire.",
          "Respir lent de două ori și las umerii să coboare.",
          "Formulez în minte: „Ce simt? Ce vreau să transmit?”",
          "Aleg un răspuns clar și blând, fără atac, fără apărare."
        ],
        "id": "relationships_communication_protocol-screen-1"
      }
    ]
  },
  "relationships_communication_l1_01_listening": {
    "lessonId": "relationships_communication_l1_01_listening",
    "screens": [
      {
        "kind": "content",
        "title": "Ascultare reală",
        "body": "Ascultarea nu începe cu cuvintele celuilalt, ci cu liniștea din tine. Asta te ajută să nu sari imediat la apărare sau soluții.",
        "id": "relationships_communication_l1_01_listening-screen-1"
      },
      {
        "kind": "content",
        "title": "A primi, nu a repara",
        "body": "În comunicare, oamenii caută mai întâi să fie primiți, nu reparați. Să simtă că sunt văzuți.",
        "id": "relationships_communication_l1_01_listening-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă",
        "steps": [
          "Adu-ți aminte o conversație recentă.",
          "A fost mai multă ascultare sau explicație?"
        ],
        "helper": "O bună ascultare reduce tensiunea înainte să apară.",
        "id": "relationships_communication_l1_01_listening-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ce este ascultarea?",
        "question": "Ce descrie cel mai bine ascultarea reală?",
        "options": [
          "Să aștepți rândul să vorbești.",
          "Să lași spațiu și să primești ce spune celălalt.",
          "Să pregătești rapid soluția corectă."
        ],
        "correctIndex": 1,
        "explanation": "Ascultarea liniștește relația înainte de cuvinte.",
        "id": "relationships_communication_l1_01_listening-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază",
        "prompt": "Completează: „Într-o conversație grea, vreau să ascult mai mult prin ___.”",
        "id": "relationships_communication_l1_01_listening-screen-5"
      }
    ]
  },
  "relationships_communication_l1_02_tone": {
    "lessonId": "relationships_communication_l1_02_tone",
    "screens": [
      {
        "kind": "content",
        "title": "Tonul deschide sau închide",
        "body": "O propoziție calmă poate opri un conflict. Aceeași propoziție, spusă cu asprime, îl aprinde.",
        "id": "relationships_communication_l1_02_tone-screen-1"
      },
      {
        "kind": "content",
        "title": "Tonul transmite intenția",
        "body": "În multe situații, oamenii nu reacționează la cuvinte, ci la ton.",
        "id": "relationships_communication_l1_02_tone-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Amintește-ți o situație tensionată.",
          "Ce ai transmis prin tonul tău?"
        ],
        "helper": "Tonul e primul limbaj în relații.",
        "id": "relationships_communication_l1_02_tone-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Rolul tonului",
        "question": "De ce contează tonul?",
        "options": [
          "Pentru că schimbă complet mesajul.",
          "Pentru că e doar un detaliu tehnic.",
          "Nu are nicio influență."
        ],
        "correctIndex": 0,
        "explanation": "Tonul modelează felul în care este primit mesajul.",
        "id": "relationships_communication_l1_02_tone-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ajustare",
        "prompt": "Completează: „Când simt tensiune, pot să îmi cobor tonul prin ___.”",
        "id": "relationships_communication_l1_02_tone-screen-5"
      }
    ]
  },
  "relationships_communication_l1_03_pause": {
    "lessonId": "relationships_communication_l1_03_pause",
    "screens": [
      {
        "kind": "content",
        "title": "Pauza calmă",
        "body": "O secundă de pauză poate preveni un conflict de o oră. Pauza îți oferă timp să alegi.",
        "id": "relationships_communication_l1_03_pause-screen-1"
      },
      {
        "kind": "protocol",
        "title": "Protocol de comunicare calmă",
        "steps": [
          "Observ impulsul: tensiune sau grabă.",
          "Respir lent de două ori.",
          "Clarific: „Ce vreau să transmit?”",
          "Aleg un răspuns blând."
        ],
        "id": "relationships_communication_l1_03_pause-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Amintește-ți",
        "steps": [
          "Gândește-te la ultima oară când ai fi avut nevoie de o pauză scurtă."
        ],
        "helper": "Pauza nu este slăbiciune; este control.",
        "id": "relationships_communication_l1_03_pause-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Pauză vs reacție",
        "question": "Ce permite o pauză scurtă?",
        "options": [
          "Să ripostezi mai eficient.",
          "Să alegi răspunsul în locul impulsului.",
          "Să eviți orice conversație."
        ],
        "correctIndex": 1,
        "explanation": "Pauza îți oferă spațiu interior pentru a alege și reduce reacția impulsivă.",
        "id": "relationships_communication_l1_03_pause-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Pauza mea",
        "prompt": "Completează: „Vreau să folosesc o pauză scurtă atunci când ___.”",
        "id": "relationships_communication_l1_03_pause-screen-5"
      }
    ]
  },
  "relationships_communication_l1_04_honesty": {
    "lessonId": "relationships_communication_l1_04_honesty",
    "screens": [
      {
        "kind": "content",
        "title": "Sinceritate calmă",
        "body": "Sinceritatea nu trebuie să fie tăioasă. Poți spune adevărul fără să distrugi relația.",
        "id": "relationships_communication_l1_04_honesty-screen-1"
      },
      {
        "kind": "content",
        "title": "Spune ce simți, nu ce acuză",
        "body": "Când spui ce simți, deschizi. Când acuzi, închizi.",
        "id": "relationships_communication_l1_04_honesty-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Gândește-te",
        "steps": [
          "Adu-ți aminte o conversație dificilă.",
          "Ai exprimat ceea ce simți sau ai acuzat?"
        ],
        "helper": "Emoțiile sincere apropie mai mult decât critica.",
        "id": "relationships_communication_l1_04_honesty-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Sinceritate vs acuză",
        "question": "Ce ajută o comunicare matură?",
        "options": [
          "Să spui direct ce te enervează la celălalt.",
          "Să exprimi ce simți fără a ataca.",
          "Să eviți tot ce este dificil."
        ],
        "correctIndex": 1,
        "explanation": "Sinceritatea fără acuză scade defensiva și păstrează relația deschisă.",
        "id": "relationships_communication_l1_04_honesty-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază sinceră",
        "prompt": "Completează: „Aș putea spune mai des: ‘Simt ___ când se întâmplă asta.’”",
        "id": "relationships_communication_l1_04_honesty-screen-5"
      }
    ]
  },
  "relationships_communication_l2_05_boundaries": {
    "lessonId": "relationships_communication_l2_05_boundaries",
    "screens": [
      {
        "kind": "content",
        "title": "Limite liniștite",
        "body": "O limită bună protejează, nu pedepsește. Spui ce e potrivit pentru tine fără atac.",
        "id": "relationships_communication_l2_05_boundaries-screen-1"
      },
      {
        "kind": "content",
        "title": "Limita stabilește spațiul",
        "body": "Ea spune: „Asta e în regulă pentru mine, asta nu.”",
        "id": "relationships_communication_l2_05_boundaries-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Identificare",
        "steps": [
          "Gândește-te la o situație în care ai spus „da”, deși simțeai „nu”."
        ],
        "helper": "O limită bună previne conflictul, nu îl creează.",
        "id": "relationships_communication_l2_05_boundaries-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Limitele",
        "question": "Ce este o limită sănătoasă?",
        "options": [
          "O formă de control asupra celuilalt.",
          "O clarificare liniștită a ce este potrivit pentru tine.",
          "O metodă de a evita discuțiile."
        ],
        "correctIndex": 1,
        "explanation": "Limitele clare protejează relația și clarifică ce este potrivit pentru tine.",
        "id": "relationships_communication_l2_05_boundaries-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un „nu” calm",
        "prompt": "Completează: „Aș vrea să pun o limită calmă în situația ___.”",
        "id": "relationships_communication_l2_05_boundaries-screen-5"
      }
    ]
  },
  "relationships_communication_l2_06_conflict": {
    "lessonId": "relationships_communication_l2_06_conflict",
    "screens": [
      {
        "kind": "content",
        "title": "Conflictul nu este un eșec",
        "body": "Un conflict poate apropia două persoane dacă este gestionat cu calm.",
        "id": "relationships_communication_l2_06_conflict-screen-1"
      },
      {
        "kind": "protocol",
        "title": "Protocol în conflict",
        "steps": [
          "Observ impulsul de a ridica tonul.",
          "Respir lent de două ori.",
          "Formulez un mesaj clar și scurt.",
          "Ascult 10 secunde înainte să răspund."
        ],
        "id": "relationships_communication_l2_06_conflict-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Care este impulsul tău principal într-un conflict: atac, retragere sau grabă?"
        ],
        "helper": "Impulsul recunoscut își pierde forța.",
        "id": "relationships_communication_l2_06_conflict-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Conflict sănătos",
        "question": "Ce este esențial într-un conflict matur?",
        "options": [
          "Să câștigi.",
          "Să rămâi prezent și calm.",
          "Să demonstrezi că ai dreptate."
        ],
        "correctIndex": 1,
        "explanation": "Calmul și prezența transformă conflictul într-un dialog util.",
        "id": "relationships_communication_l2_06_conflict-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere",
        "prompt": "Completează: „Într-un conflict, vreau să rămân prezent prin ___.”",
        "id": "relationships_communication_l2_06_conflict-screen-5"
      }
    ]
  },
  "relationships_communication_l2_07_clarity": {
    "lessonId": "relationships_communication_l2_07_clarity",
    "screens": [
      {
        "kind": "content",
        "title": "Clarificările scurte",
        "body": "Multe conflicte prelungite pot fi rezolvate cu două fraze clare.",
        "id": "relationships_communication_l2_07_clarity-screen-1"
      },
      {
        "kind": "content",
        "title": "Ce vreau să transmit?",
        "body": "Când nu știi asta, discuția devine un labirint.",
        "id": "relationships_communication_l2_07_clarity-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Clarificare",
        "steps": [
          "Formulează în minte un mesaj simplu despre o situație dificilă."
        ],
        "helper": "Claritatea scurtează tensiunea.",
        "id": "relationships_communication_l2_07_clarity-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Claritate",
        "question": "Ce aduce o clarificare scurtă?",
        "options": [
          "Grăbire.",
          "Spațiu.",
          "Confuzie."
        ],
        "correctIndex": 1,
        "explanation": "Când clarifici, reduci confuzia și emoția scade.",
        "id": "relationships_communication_l2_07_clarity-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție clară",
        "prompt": "Completează: „Ceea ce vreau să transmit este ___.”",
        "id": "relationships_communication_l2_07_clarity-screen-5"
      }
    ]
  },
  "relationships_communication_l2_08_hurt": {
    "lessonId": "relationships_communication_l2_08_hurt",
    "screens": [
      {
        "kind": "content",
        "title": "Calm când doare",
        "body": "A vorbi calm când ești rănit este un act de maturitate, nu de slăbiciune.",
        "id": "relationships_communication_l2_08_hurt-screen-1"
      },
      {
        "kind": "content",
        "title": "Emoția nu e vinovată",
        "body": "Poți simți intens și totuși să comunici liniștit.",
        "id": "relationships_communication_l2_08_hurt-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Identifică o situație recentă în care te-ai simțit rănit."
        ],
        "helper": "Nu e nevoie să ascunzi emoția; doar să nu vorbești prin ea.",
        "id": "relationships_communication_l2_08_hurt-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Calm în emoții",
        "question": "Ce ajută cel mai mult?",
        "options": [
          "Să acoperi emoția.",
          "Să respiri și să exprimi ce simți fără acuză.",
          "Să eviți subiectul."
        ],
        "correctIndex": 1,
        "explanation": "Un moment de calm îți permite să răspunzi, nu să reacționezi.",
        "id": "relationships_communication_l2_08_hurt-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază calmă",
        "prompt": "Completează: „Data viitoare pot spune: ‘Simt ___, dar vreau să înțeleg.’”",
        "id": "relationships_communication_l2_08_hurt-screen-5"
      }
    ]
  },
  "relationships_communication_l3_09_vulnerability": {
    "lessonId": "relationships_communication_l3_09_vulnerability",
    "screens": [
      {
        "kind": "content",
        "title": "Vulnerabilitatea matură",
        "body": "Vulnerabilitatea nu este expunere necontrolată. Este alegerea calmă de a spune ce e adevărat.",
        "id": "relationships_communication_l3_09_vulnerability-screen-1"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Care este o emoție pe care o ascunzi de obicei în discuții?"
        ],
        "helper": "Ce ascunzi cel mai mult cere cel mai mult spațiu.",
        "id": "relationships_communication_l3_09_vulnerability-screen-2"
      },
      {
        "kind": "quiz",
        "title": "Vulnerabilitate",
        "question": "Ce este vulnerabilitatea sănătoasă?",
        "options": [
          "A spune totul în orice moment.",
          "A exprima cu claritate ce simți, fără dramă și fără acuză.",
          "A evita orice emoție."
        ],
        "correctIndex": 1,
        "explanation": "Vulnerabilitatea sănătoasă exprimă ce simți fără a cere salvare.",
        "id": "relationships_communication_l3_09_vulnerability-screen-3"
      },
      {
        "kind": "reflection",
        "title": "Un pas mic",
        "prompt": "Completează: „Pot fi vulnerabil(ă) într-un mod calm atunci când ___.”",
        "id": "relationships_communication_l3_09_vulnerability-screen-4"
      }
    ]
  },
  "relationships_communication_l3_10_repair": {
    "lessonId": "relationships_communication_l3_10_repair",
    "screens": [
      {
        "kind": "content",
        "title": "Reparare liniștită",
        "body": "În orice relație apar rupturi. Reparația este cea care păstrează legătura.",
        "id": "relationships_communication_l3_10_repair-screen-1"
      },
      {
        "kind": "content",
        "title": "Două fraze simple",
        "body": "„Îmi pare rău pentru partea mea.” „Vreau să înțeleg ce ai simțit.”",
        "id": "relationships_communication_l3_10_repair-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Reflectare",
        "steps": [
          "Adu-ți aminte o situație nerezolvată.",
          "Ce ai putea spune pentru a restabili legătura?"
        ],
        "helper": "Reparația cere curaj blând.",
        "id": "relationships_communication_l3_10_repair-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Reparare",
        "question": "Ce ajută reparația?",
        "options": [
          "Să ignori ce s-a întâmplat.",
          "Să asculți și să-ți asumi partea ta.",
          "Să repeți cine are dreptate."
        ],
        "correctIndex": 1,
        "explanation": "Reparația reală recunoaște impactul și oferă un pas concret acum.",
        "id": "relationships_communication_l3_10_repair-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O propoziție de reparare",
        "prompt": "Completează: „Aș putea începe cu: ‘Îmi pare rău pentru ___.’”",
        "id": "relationships_communication_l3_10_repair-screen-5"
      }
    ]
  },
  "relationships_communication_l3_11_stay_open": {
    "lessonId": "relationships_communication_l3_11_stay_open",
    "screens": [
      {
        "kind": "content",
        "title": "Deschidere matură",
        "body": "A fi deschis nu înseamnă să lași totul să treacă. Înseamnă să fii receptiv fără a renunța la tine.",
        "id": "relationships_communication_l3_11_stay_open-screen-1"
      },
      {
        "kind": "checkpoint",
        "title": "Clarifică",
        "steps": [
          "Ce situație te face să te închizi?"
        ],
        "helper": "Deschiderea calmă este o alegere, nu o obligație.",
        "id": "relationships_communication_l3_11_stay_open-screen-2"
      },
      {
        "kind": "quiz",
        "title": "Deschidere",
        "question": "Ce înseamnă deschiderea sănătoasă?",
        "options": [
          "Să accepți tot, oricând.",
          "Să fii prezent fără să renunți la limitele tale.",
          "Să nu îți exprimi niciodată emoțiile."
        ],
        "correctIndex": 1,
        "explanation": "Deschiderea sănătoasă înseamnă să rămâi prezent și curios, nu să te expui haotic.",
        "id": "relationships_communication_l3_11_stay_open-screen-3"
      },
      {
        "kind": "reflection",
        "title": "O alegere calmă",
        "prompt": "Completează: „Pot rămâne deschis(ă) și totuși stabil(ă) atunci când ___.”",
        "id": "relationships_communication_l3_11_stay_open-screen-4"
      }
    ]
  },
  "relationships_communication_l3_12_connection": {
    "lessonId": "relationships_communication_l3_12_connection",
    "screens": [
      {
        "kind": "content",
        "title": "Conexiune autentică",
        "body": "Conexiunea reală apare când doi oameni sunt sinceri fără a fi aspri și prezenți fără a controla.",
        "id": "relationships_communication_l3_12_connection-screen-1"
      },
      {
        "kind": "content",
        "title": "A vedea și a fi văzut",
        "body": "Uneori, singurul lucru de care ai nevoie este să fii văzut calm, nu rezolvat.",
        "id": "relationships_communication_l3_12_connection-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Cine este o persoană cu care vrei o relație mai calmă?"
        ],
        "helper": "Conexiunea începe cu intenție.",
        "id": "relationships_communication_l3_12_connection-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Conexiune",
        "question": "Ce întărește conexiunea cel mai mult?",
        "options": [
          "Controlul și insistența.",
          "Prezența calmă și sinceră.",
          "Evitarea discuțiilor grele."
        ],
        "correctIndex": 1,
        "explanation": "Conexiunea crește prin prezență calmă și gesturi mici, nu prin control.",
        "id": "relationships_communication_l3_12_connection-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O intenție",
        "prompt": "Completează: „Vreau să fiu mai prezent(ă) în relația cu ___.”",
        "id": "relationships_communication_l3_12_connection-screen-5"
      }
    ]
  },
  "relationships_communication_l3_13_body_to_mind": {
    "lessonId": "relationships_communication_l3_13_body_to_mind",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul influențează tonul",
        "body": "Foamea, oboseala și tensiunea scad empatia și cresc reactivitatea. Nu este „doar personalitate”; este și biochimie.",
        "id": "relationships_communication_l3_13_body_to_mind-screen-1"
      },
      {
        "kind": "content",
        "title": "Corp reglat = ton calm",
        "body": "O respirație lentă, o gură de apă sau o gustare mică pot reduce impulsivitatea verbală.",
        "id": "relationships_communication_l3_13_body_to_mind-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la o discuție în care ai reacționat prea tăios.",
          "Cum era corpul tău în acel moment?"
        ],
        "helper": "Corpul tău era probabil în stare de alertă.",
        "id": "relationships_communication_l3_13_body_to_mind-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Corp & comunicare",
        "question": "Ce susține comunicarea calmă?",
        "options": [
          "Să ignori corpul complet.",
          "Un corp stabil și regulat metabolic."
        ],
        "correctIndex": 1,
        "id": "relationships_communication_l3_13_body_to_mind-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Pregătire",
        "prompt": "„Înainte de o discuție importantă, mă ajută dacă ___.”",
        "id": "relationships_communication_l3_13_body_to_mind-screen-5"
      }
    ]
  },
  "relationships_communication_l3_14_mind_to_body": {
    "lessonId": "relationships_communication_l3_14_mind_to_body",
    "screens": [
      {
        "kind": "content",
        "title": "Comunicare → tensiune corporală",
        "body": "Confruntările și neînțelegerile aprind sistemul nervos: umeri ridicați, stomac încordat, respirație scurtă.",
        "id": "relationships_communication_l3_14_mind_to_body-screen-1"
      },
      {
        "kind": "content",
        "title": "Calmul verbal calmează corpul",
        "body": "Când alegi un ton mai lent și mai clar, corpul răspunde cu relaxare, chiar dacă subiectul rămâne dificil.",
        "id": "relationships_communication_l3_14_mind_to_body-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Observă cum reacționează corpul la tonul tău propriu într-o discuție tensionată."
        ],
        "helper": "Comunicarea nu e doar mentală, ci și fizică.",
        "id": "relationships_communication_l3_14_mind_to_body-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Tonul și corpul",
        "question": "Ce liniștește corpul în comunicare?",
        "options": [
          "Graba și tonul ridicat.",
          "Ritmul lent, tonul calm și pauzele scurte."
        ],
        "correctIndex": 1,
        "id": "relationships_communication_l3_14_mind_to_body-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Micro-reglare",
        "prompt": "„Un gest care îmi relaxează corpul în conversații este ___.”",
        "id": "relationships_communication_l3_14_mind_to_body-screen-5"
      }
    ]
  },
  "energy_body_protocol": {
    "lessonId": "energy_body_protocol",
    "screens": [
      {
        "kind": "protocol",
        "title": "Protocol scurt de resetare a energiei",
        "steps": [
          "Observ ce simt în corp: oboseală, agitație, tensiune.",
          "Respir lent de două ori (inspir numărând până la 4, expir până la 6).",
          "Relaxez umerii și îmi simt tălpile pe podea sau contactul cu scaunul.",
          "Aleg un pas mic: mă ridic, mă întind, beau apă sau iau o pauză de 1 minut."
        ],
        "id": "energy_body_protocol-screen-1"
      }
    ]
  },
  "energy_body_l1_01_signals": {
    "lessonId": "energy_body_l1_01_signals",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul vorbește",
        "body": "Corpul vorbește prin semnale simple: greutate în cap, ochi obosiți, încordare în ceafă, agitație în piept, stomac strâns. De multe ori le ignori până când nu mai poți.",
        "id": "energy_body_l1_01_signals-screen-1"
      },
      {
        "kind": "content",
        "title": "Semnale, nu defecte",
        "body": "Aceste semnale nu spun că e ceva „greșit” cu tine. Ele spun doar: „Am nevoie de alt ritm acum.”",
        "id": "energy_body_l1_01_signals-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la ziua de azi sau de ieri.",
          "Ce semnal ți-a trimis corpul cel mai des?"
        ],
        "helper": "Semnalele repetate îți arată unde îți consumi energia.",
        "id": "energy_body_l1_01_signals-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Semnale de energie",
        "question": "Ce este cel mai sănătos mod de a privi semnalele corpului?",
        "options": [
          "Ca pe defecte pe care trebuie să le ignori.",
          "Ca pe mesaje despre nevoile tale de energie și ritm.",
          "Ca pe dovezi că ești mai slab decât alții."
        ],
        "correctIndex": 1,
        "explanation": "Semnalele sunt informații, nu verdicte.",
        "id": "energy_body_l1_01_signals-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un semnal",
        "prompt": "Completează: „Un semnal pe care îl ignor des este ___.”",
        "id": "energy_body_l1_01_signals-screen-5"
      }
    ]
  },
  "energy_body_l1_02_breath": {
    "lessonId": "energy_body_l1_02_breath",
    "screens": [
      {
        "kind": "content",
        "title": "Respirația și energia",
        "body": "Respirația este puntea dintre corp și minte. Când e scurtă și grăbită, corpul crede că ești în pericol. Când e mai lungă și mai lentă, transmite siguranță.",
        "id": "energy_body_l1_02_breath-screen-1"
      },
      {
        "kind": "content",
        "title": "Două respirații conștiente",
        "body": "Nu ai nevoie de tehnici complicate. Două respirații lente pot schimba modul în care te simți pentru câteva momente.",
        "id": "energy_body_l1_02_breath-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Experiment",
        "steps": [
          "Inspiră numărând până la 4.",
          "Expiră numărând până la 6.",
          "Repetă de două ori."
        ],
        "helper": "Observă dacă tensiunea scade măcar puțin.",
        "id": "energy_body_l1_02_breath-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Rolul respirației",
        "question": "Ce face o respirație lentă?",
        "options": [
          "Îți crește automat pulsul.",
          "Trimite corpului semnalul că este puțin mai în siguranță.",
          "Nu are niciun efect real."
        ],
        "correctIndex": 1,
        "explanation": "Respirația este unul dintre cele mai rapide moduri de reglare a energiei.",
        "id": "energy_body_l1_02_breath-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un moment pentru respirație",
        "prompt": "Completează: „Aș putea folosi două respirații lente înainte de ___.”",
        "id": "energy_body_l1_02_breath-screen-5"
      }
    ]
  },
  "energy_body_l1_03_posture": {
    "lessonId": "energy_body_l1_03_posture",
    "screens": [
      {
        "kind": "content",
        "title": "Postură și tensiune",
        "body": "Felul în care stai îți influențează energia. O postură prăbușită îți poate accentua oboseala și lipsa de chef. O postură ușor deschisă, fără rigiditate, îți dă puțin mai mult aer.",
        "id": "energy_body_l1_03_posture-screen-1"
      },
      {
        "kind": "content",
        "title": "Mică ajustare",
        "body": "Nu trebuie să stai „perfect”. E suficient să te ridici puțin din umeri, să îți lași pieptul să se deschidă și să simți spatele susținut.",
        "id": "energy_body_l1_03_posture-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă acum",
        "steps": [
          "Observă cum stai chiar în acest moment.",
          "Fă o ajustare mică: îndreaptă coloana ușor, relaxează umerii."
        ],
        "helper": "Schimbările mici de postură schimbă modul în care circulă energia.",
        "id": "energy_body_l1_03_posture-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Postura",
        "question": "Ce este realist să cauți în postură?",
        "options": [
          "Perfecțiune rigidă.",
          "O poziție un pic mai deschisă și mai relaxată.",
          "Să nu te miști deloc."
        ],
        "correctIndex": 1,
        "explanation": "O postură ușor deschisă reduce tensiunea și lasă energia să circule, fără rigiditate.",
        "id": "energy_body_l1_03_posture-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O ajustare frecventă",
        "prompt": "Completează: „Aș putea să îmi ajustez postura de fiecare dată când ___.”",
        "id": "energy_body_l1_03_posture-screen-5"
      }
    ]
  },
  "energy_body_l1_04_microbreaks": {
    "lessonId": "energy_body_l1_04_microbreaks",
    "screens": [
      {
        "kind": "content",
        "title": "Pauze mici, efect mare",
        "body": "Energia nu se pierde doar în maratoane de lucru. Se pierde și atunci când nu iei nicio pauză mică, ore în șir.",
        "id": "energy_body_l1_04_microbreaks-screen-1"
      },
      {
        "kind": "content",
        "title": "Pauza de un minut",
        "body": "O pauză de un minut nu îți strică fluxul. Îl protejează. Te ajută să revii mai clar și mai prezent.",
        "id": "energy_body_l1_04_microbreaks-screen-2"
      },
      {
        "kind": "protocol",
        "title": "Protocol scurt de resetare a energiei",
        "steps": [
          "Observ ce simt în corp.",
          "Respir lent de două ori.",
          "Mă ridic sau îmi mișc ușor corpul.",
          "Aleg ce fac în următoarele 10 minute."
        ],
        "id": "energy_body_l1_04_microbreaks-screen-3"
      },
      {
        "kind": "checkpoint",
        "title": "Unde lipsesc pauzele?",
        "steps": [
          "Gândește-te la o parte din zi în care trec ore fără nicio pauză."
        ],
        "helper": "Acolo se scurge o mare parte din energia ta.",
        "id": "energy_body_l1_04_microbreaks-screen-4"
      },
      {
        "kind": "quiz",
        "title": "Pauzele",
        "question": "Ce rol are o pauză scurtă?",
        "options": [
          "Te scoate complet din ritm.",
          "Îți protejează energia și atenția.",
          "Îți dovedește că ești mai slab."
        ],
        "correctIndex": 1,
        "explanation": "Pauzele scurte sunt mini-reseturi care împiedică scurgerile lente de energie.",
        "id": "energy_body_l1_04_microbreaks-screen-5"
      },
      {
        "kind": "reflection",
        "title": "Pauza mea de 1 minut",
        "prompt": "Completează: „Aș putea să îmi iau o pauză de 1 minut după ___.”",
        "id": "energy_body_l1_04_microbreaks-screen-6"
      }
    ]
  },
  "energy_body_l2_05_sleep_ritual": {
    "lessonId": "energy_body_l2_05_sleep_ritual",
    "screens": [
      {
        "kind": "content",
        "title": "Somnul ca resetare",
        "body": "Somnul este cel mai puternic reset pentru energie. Fără un minim de calitate, orice strategie de productivitate se prăbușește.",
        "id": "energy_body_l2_05_sleep_ritual-screen-1"
      },
      {
        "kind": "content",
        "title": "Un ritual simplu",
        "body": "Nu ai nevoie de reguli perfecte. Ai nevoie de un mic ritual repetat: aceeași oră aproximativă, mai puțină lumină puternică, mai puține ecrane înainte de culcare.",
        "id": "energy_body_l2_05_sleep_ritual-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă-ți seara",
        "steps": [
          "Gândește-te la ultima oră înainte de culcare.",
          "Ce faci de obicei în acel timp?"
        ],
        "helper": "Ce repeți în fiecare seară îți modelează somnul.",
        "id": "energy_body_l2_05_sleep_ritual-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Somn și energie",
        "question": "Ce ajută cel mai mult somnul?",
        "options": [
          "Să adormi cu telefonul în mână.",
          "Un ritual simplu, repetat, care liniștește mintea și corpul.",
          "Să îți schimbi ora de culcare de la o zi la alta."
        ],
        "correctIndex": 1,
        "explanation": "Un ritual repetat semnalează corpului că poate coborî ritmul și pregătește un somn mai adânc.",
        "id": "energy_body_l2_05_sleep_ritual-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un gest pentru somn",
        "prompt": "Completează: „Un gest mic pe care îl pot face pentru un somn mai bun este ___.”",
        "id": "energy_body_l2_05_sleep_ritual-screen-5"
      }
    ]
  },
  "energy_body_l2_06_rhythm": {
    "lessonId": "energy_body_l2_06_rhythm",
    "screens": [
      {
        "kind": "content",
        "title": "Ritmul zilei",
        "body": "Corpul tău are momente în care are mai multă energie și momente în care scade. Dacă le ignori, ajungi să forțezi când ești deja gol.",
        "id": "energy_body_l2_06_rhythm-screen-1"
      },
      {
        "kind": "content",
        "title": "Ferestre de energie",
        "body": "Observă când te simți cel mai lucid și când îți cade natural energia. Nu trebuie să fie perfect. E suficient să vezi un tipar aproximativ.",
        "id": "energy_body_l2_06_rhythm-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mică hartă",
        "steps": [
          "Gândește-te la ziua ta obișnuită.",
          "În ce intervale te simți de obicei mai treaz și mai clar?"
        ],
        "helper": "Acolo merită puse lucrurile mai importante.",
        "id": "energy_body_l2_06_rhythm-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ritm și priorități",
        "question": "Cum poți folosi ritmul natural al energiei?",
        "options": [
          "Ignorându-l complet.",
          "Programând sarcinile mai grele în perioadele de energie mai bună.",
          "Făcând totul la întâmplare."
        ],
        "correctIndex": 1,
        "explanation": "Când sincronizezi sarcinile importante cu ferestrele bune, obții mai mult din energia disponibilă.",
        "id": "energy_body_l2_06_rhythm-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O ajustare de ritm",
        "prompt": "Completează: „Aș putea muta un lucru important în intervalul ___, când am mai multă energie.”",
        "id": "energy_body_l2_06_rhythm-screen-5"
      }
    ]
  },
  "energy_body_l2_07_movement": {
    "lessonId": "energy_body_l2_07_movement",
    "screens": [
      {
        "kind": "content",
        "title": "Mișcare mică, impact mare",
        "body": "Nu ai nevoie de antrenamente perfecte ca să îți ajuți energia. Mișcarea scurtă, repetată, schimbă mult modul în care te simți.",
        "id": "energy_body_l2_07_movement-screen-1"
      },
      {
        "kind": "content",
        "title": "Ridică-te, nu doar rezista",
        "body": "Câteva ridicări de pe scaun, câțiva pași, întinderi simple pot opri acumularea de tensiune.",
        "id": "energy_body_l2_07_movement-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mișcare realistă",
        "steps": [
          "Gândește-te la un tip de mișcare pe care îl poți face în mai puțin de două minute."
        ],
        "helper": "Idealul nu ajută dacă nu îl aplici. Contează ce poți repeta.",
        "id": "energy_body_l2_07_movement-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Mișcarea",
        "question": "Ce fel de mișcare este utilă pentru energie?",
        "options": [
          "Doar sesiunile lungi și perfecte.",
          "Orice mișcare scurtă și repetată, adaptată la viața ta.",
          "Mișcarea nu contează."
        ],
        "correctIndex": 1,
        "explanation": "Mișcările scurte și dese eliberează tensiunea acumulată chiar dacă nu sunt perfecte.",
        "id": "energy_body_l2_07_movement-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Mișcarea mea scurtă",
        "prompt": "Completează: „Mișcarea scurtă pe care aș putea să o fac de câteva ori pe zi este ___.”",
        "id": "energy_body_l2_07_movement-screen-5"
      }
    ]
  },
  "energy_body_l2_08_fuel": {
    "lessonId": "energy_body_l2_08_fuel",
    "screens": [
      {
        "kind": "content",
        "title": "Combustibilul",
        "body": "Energia ta depinde și de ce mănânci și bei. Nu ai nevoie de perfecțiune, dar corpul are nevoie de un minim de combustibil stabil.",
        "id": "energy_body_l2_08_fuel-screen-1"
      },
      {
        "kind": "content",
        "title": "Stabil în loc de extrem",
        "body": "Să sari peste multe mese și apoi să mănânci foarte mult deodată îți poate da vârfuri și prăbușiri de energie.",
        "id": "energy_body_l2_08_fuel-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare simplă",
        "steps": [
          "Gândește-te la o zi recentă.",
          "Ai avut măcar două momente în care ai mâncat liniștit?"
        ],
        "helper": "Stabilitatea vine din obiceiuri mici, nu din reguli dure.",
        "id": "energy_body_l2_08_fuel-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Combustibil și energie",
        "question": "Ce sprijină mai bine energia?",
        "options": [
          "Haos total în mese.",
          "Câteva momente de mâncat în liniște, fără grabă extremă.",
          "Doar cafeaua."
        ],
        "correctIndex": 1,
        "explanation": "Mesele liniștite și ritmate previn vârfurile și prăbușirile de energie pe parcursul zilei.",
        "id": "energy_body_l2_08_fuel-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un pas spre stabilitate",
        "prompt": "Completează: „Aș putea să îmi protejez energia având grijă ca ___.”",
        "id": "energy_body_l2_08_fuel-screen-5"
      }
    ]
  },
  "energy_body_l3_09_stress_energy": {
    "lessonId": "energy_body_l3_09_stress_energy",
    "screens": [
      {
        "kind": "content",
        "title": "Stres și energie",
        "body": "Stresul nu este doar dușman. Uneori te activează și te ajută să te mobilizezi. Problema apare când nu mai cobori din acel nivel ridicat.",
        "id": "energy_body_l3_09_stress_energy-screen-1"
      },
      {
        "kind": "content",
        "title": "Activare și prăbușire",
        "body": "Dacă stai prea mult în stare de stres, corpul trece de la „activat” la „epuizat”. Înveți să recunoști când ești prea sus de prea mult timp.",
        "id": "energy_body_l3_09_stress_energy-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Când ai simțit ultima dată că ești „pe muchie” prea mult timp?"
        ],
        "helper": "Acolo se consumă rezervele cele mai mari.",
        "id": "energy_body_l3_09_stress_energy-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Stres și epuizare",
        "question": "Ce este important de făcut după perioade de stres intens?",
        "options": [
          "Să continui în același ritm.",
          "Să îți oferi perioade de revenire și resetare.",
          "Să ignori complet ce simți."
        ],
        "correctIndex": 1,
        "explanation": "După stres intens, corpul își reface rezervele doar dacă îi oferi perioade de revenire.",
        "id": "energy_body_l3_09_stress_energy-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un semn de „prea mult”",
        "prompt": "Completează: „Știu că am depășit limita când ___.”",
        "id": "energy_body_l3_09_stress_energy-screen-5"
      }
    ]
  },
  "energy_body_l3_10_crash_repair": {
    "lessonId": "energy_body_l3_10_crash_repair",
    "screens": [
      {
        "kind": "content",
        "title": "După ce ai forțat prea mult",
        "body": "Toți avem momente în care forțăm corpul peste limite. Important nu este să nu se întâmple niciodată, ci cum repari după.",
        "id": "energy_body_l3_10_crash_repair-screen-1"
      },
      {
        "kind": "content",
        "title": "Reparație, nu vină",
        "body": "Vinovăția nu îți reface energia. Micile gesturi de grijă, da: somn, hidratare, mișcare blândă, hrană simplă.",
        "id": "energy_body_l3_10_crash_repair-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Plan de reparare",
        "steps": [
          "Gândește-te la o perioadă recentă în care ai forțat mult.",
          "Ce ai putea face diferit în următoarele zile pentru a te reface?"
        ],
        "helper": "Reparația cere gesturi mici, repetate.",
        "id": "energy_body_l3_10_crash_repair-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Reparația",
        "question": "Ce ajută după epuizare?",
        "options": [
          "Să te critici și să ignori corpul.",
          "Să introduci câteva zile cu mai mult somn și mai multă blândețe față de tine.",
          "Să crești ritmul și mai mult."
        ],
        "correctIndex": 1,
        "explanation": "Reparația vine din gesturi blânde și somn suplimentar, nu din critică sau forțare.",
        "id": "energy_body_l3_10_crash_repair-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un gest de reparare",
        "prompt": "Completează: „Un gest mic de reparare pentru mine ar fi ___.”",
        "id": "energy_body_l3_10_crash_repair-screen-5"
      }
    ]
  },
  "energy_body_l3_11_listening_limits": {
    "lessonId": "energy_body_l3_11_listening_limits",
    "screens": [
      {
        "kind": "content",
        "title": "A asculta limitele",
        "body": "Limitele corpului nu sunt dușmanul tău. Ele îți arată cât poți duce acum, nu cât ești „valoros”.",
        "id": "energy_body_l3_11_listening_limits-screen-1"
      },
      {
        "kind": "content",
        "title": "Fără rușine",
        "body": "A recunoaște o limită nu înseamnă că renunți. Înseamnă că vezi realitatea și o respecți ca să poți continua pe termen lung.",
        "id": "energy_body_l3_11_listening_limits-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Clarificare",
        "steps": [
          "Unde îți depășești constant limitele?"
        ],
        "helper": "Ce refuzi să recunoști se întoarce împotriva ta mai târziu.",
        "id": "energy_body_l3_11_listening_limits-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Limite și valoare",
        "question": "Ce este adevărat despre limitele corpului?",
        "options": [
          "Îți arată cât valorezi ca om.",
          "Îți arată unde e nevoie de alt ritm și altă strategie.",
          "Trebuie ignorate dacă vrei rezultate."
        ],
        "correctIndex": 1,
        "explanation": "Limitele arată unde trebuie schimbat ritmul, iar respectarea lor îți prelungește autonomia.",
        "id": "energy_body_l3_11_listening_limits-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O limită respectată",
        "prompt": "Completează: „Aș putea începe să respect mai mult limita mea când ___.”",
        "id": "energy_body_l3_11_listening_limits-screen-5"
      }
    ]
  },
  "energy_body_l3_12_personal_ritual": {
    "lessonId": "energy_body_l3_12_personal_ritual",
    "screens": [
      {
        "kind": "content",
        "title": "Ritualul tău de energie",
        "body": "Nu există un singur ritual perfect de energie. Există ritualul care ți se potrivește ție și pe care îl poți repeta.",
        "id": "energy_body_l3_12_personal_ritual-screen-1"
      },
      {
        "kind": "content",
        "title": "3 elemente simple",
        "body": "Un ritual bun are de obicei trei componente: un pic de mișcare, un pic de respirație, un pic de liniște sau reflecție.",
        "id": "energy_body_l3_12_personal_ritual-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Schițează ritualul",
        "steps": [
          "Alege o mișcare scurtă, o formă de respirație și un moment de liniște."
        ],
        "helper": "Nu trebuie să fie lung. Trebuie să fie repetabil.",
        "id": "energy_body_l3_12_personal_ritual-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ritual",
        "question": "Ce face un ritual bun de energie?",
        "options": [
          "Este complicat și greu de făcut.",
          "Este simplu, clar și ușor de repetat.",
          "Este perfect, altfel nu merită."
        ],
        "correctIndex": 1,
        "explanation": "Doar ritualurile simple și clare pot fi repetate zilnic și devin ancore reale pentru energie.",
        "id": "energy_body_l3_12_personal_ritual-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ritualul meu",
        "prompt": "Completează: „Ritualul meu scurt de energie ar putea fi: ___.”",
        "id": "energy_body_l3_12_personal_ritual-screen-5"
      }
    ]
  },
  "energy_body_l3_13_body_to_mind": {
    "lessonId": "energy_body_l3_13_body_to_mind",
    "screens": [
      {
        "kind": "content",
        "title": "Alimentele influențează energia mentală",
        "body": "Zaharurile rapide, mesele foarte grele sau mesele sărite provoacă fluctuații mari de energie și dispoziție.",
        "id": "energy_body_l3_13_body_to_mind-screen-1"
      },
      {
        "kind": "content",
        "title": "Hrană stabilă, energie stabilă",
        "body": "Corpul răspunde bine la obiceiuri regulate: mese relativ stabile, nu haos total.",
        "id": "energy_body_l3_13_body_to_mind-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Când ți-a scăzut energia foarte mult ultima dată?",
          "Cum arăta ziua ta ca alimentație?"
        ],
        "helper": "Energia este legată direct de modul în care îți hrănești corpul.",
        "id": "energy_body_l3_13_body_to_mind-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Energie",
        "question": "Ce menține energia stabilă?",
        "options": [
          "Haos alimentar.",
          "Hrană și hidratare regulate."
        ],
        "correctIndex": 1,
        "id": "energy_body_l3_13_body_to_mind-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ajustare",
        "prompt": "„Un obicei alimentar care îmi stabilizează energia este ___.”",
        "id": "energy_body_l3_13_body_to_mind-screen-5"
      }
    ]
  },
  "energy_body_l3_14_mind_to_body": {
    "lessonId": "energy_body_l3_14_mind_to_body",
    "screens": [
      {
        "kind": "content",
        "title": "Mintea influențează corpul",
        "body": "Dialogul interior stresant, presiunea mentală și graba constantă cresc cortizolul și pun corpul în alertă.",
        "id": "energy_body_l3_14_mind_to_body-screen-1"
      },
      {
        "kind": "content",
        "title": "Calm mental, corp mai odihnit",
        "body": "Când încetinești ritmul mental și reduci auto-critica, corpul răspunde cu o stare metabolică mai echilibrată.",
        "id": "energy_body_l3_14_mind_to_body-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la o zi în care ai fost foarte dur cu tine mental.",
          "Cum s-a simțit corpul tău?"
        ],
        "helper": "Mintea tensionată consumă energia corpului.",
        "id": "energy_body_l3_14_mind_to_body-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Minte și energie",
        "question": "Ce eliberează corpul de stres?",
        "options": [
          "Continuarea criticii interioare.",
          "O atitudine mentală mai blândă și pauze scurte."
        ],
        "correctIndex": 1,
        "id": "energy_body_l3_14_mind_to_body-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Reset mental",
        "prompt": "„Un gând sau un ritual mental care îmi relaxează corpul este ___.”",
        "id": "energy_body_l3_14_mind_to_body-screen-5"
      }
    ]
  },
  "self_trust_protocol": {
    "lessonId": "self_trust_protocol",
    "screens": [
      {
        "kind": "protocol",
        "title": "Protocol de promisiune realistă",
        "steps": [
          "Mă întreb sincer: „Chiar vreau asta acum, sau doar sună bine?”",
          "Verific dacă am spațiu real de timp și energie pentru acest lucru.",
          "Aleg cea mai mică versiune de promisiune pe care o pot respecta.",
          "O formulez clar: „Astăzi fac ___ până la ora ___.”"
        ],
        "id": "self_trust_protocol-screen-1"
      }
    ]
  },
  "self_trust_l1_01_definition": {
    "lessonId": "self_trust_l1_01_definition",
    "screens": [
      {
        "kind": "content",
        "title": "Ce înseamnă încrederea în tine",
        "body": "Încrederea în tine nu este doar curaj sau imagine bună. Este sentimentul că te poți baza pe tine, că atunci când spui „fac asta”, există o șansă reală să se întâmple.",
        "id": "self_trust_l1_01_definition-screen-1"
      },
      {
        "kind": "content",
        "title": "Baza încrederii",
        "body": "Când îți încalci promisiunile tot timpul, chiar și cele mici, în interior se instalează un mesaj: „Nu pot conta pe mine.”",
        "id": "self_trust_l1_01_definition-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la o promisiune mică pe care ți-ai făcut-o în ultimele zile.",
          "Ai respectat-o sau ai lăsat-o să se piardă?"
        ],
        "helper": "Ce repeți devine mesajul tău interior despre tine.",
        "id": "self_trust_l1_01_definition-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Definiția încrederii în sine",
        "question": "Ce descrie cel mai bine încrederea în sine?",
        "options": [
          "Să te simți superior celorlalți.",
          "Să te poți baza pe tine când îți faci o promisiune.",
          "Să nu recunoști niciodată că greșești."
        ],
        "correctIndex": 1,
        "id": "self_trust_l1_01_definition-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O promisiune mică",
        "prompt": "Completează: „O promisiune mică pe care aș vrea să o respect azi este ___.”",
        "id": "self_trust_l1_01_definition-screen-5"
      }
    ]
  },
  "self_trust_l1_02_inner_voice": {
    "lessonId": "self_trust_l1_02_inner_voice",
    "screens": [
      {
        "kind": "content",
        "title": "Vocea din interior",
        "body": "Fiecare are o voce interioară care comentează: „iar n-ai făcut”, „nu ești în stare”, „nu are rost”. Când această voce devine singura, încrederea în tine se subțiază.",
        "id": "self_trust_l1_02_inner_voice-screen-1"
      },
      {
        "kind": "content",
        "title": "Critic vs aliat",
        "body": "Nu ai nevoie să reduci la tăcere orice critică. Ai nevoie să ai și o voce de aliat care spune: „Ai greșit, dar se poate repara.”",
        "id": "self_trust_l1_02_inner_voice-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă dialogul interior",
        "steps": [
          "Gândește-te la ultima oară când nu ți-ai respectat un plan.",
          "Ce ți-ai spus în gând după aceea?"
        ],
        "helper": "Tonul cu care vorbești cu tine construiește sau distruge încrederea.",
        "id": "self_trust_l1_02_inner_voice-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Vocea interioară",
        "question": "Ce ajută cel mai mult în încrederea în sine?",
        "options": [
          "Să te insulți ca să „te motivezi”.",
          "Să vezi clar ce ai făcut și să îți vorbești ca unui prieten.",
          "Să ignori complet orice greșeală."
        ],
        "correctIndex": 1,
        "id": "self_trust_l1_02_inner_voice-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O frază de aliat",
        "prompt": "Completează: „În loc de ‘sunt varză’, aș putea spune: ‘___.’”",
        "id": "self_trust_l1_02_inner_voice-screen-5"
      }
    ]
  },
  "self_trust_l1_03_small_promises": {
    "lessonId": "self_trust_l1_03_small_promises",
    "screens": [
      {
        "kind": "content",
        "title": "Puterea promisiunilor mici",
        "body": "Cele mai mari schimbări în încrederea în sine vin din promisiuni mici și realiste, duse la capăt. Nu din planuri uriașe care se prăbușesc după două zile.",
        "id": "self_trust_l1_03_small_promises-screen-1"
      },
      {
        "kind": "protocol",
        "title": "Protocol de promisiune realistă",
        "steps": [
          "Mă întreb ce vreau cu adevărat.",
          "Verific timpul și energia.",
          "Aleg versiunea cea mai mică de pas.",
          "Formulez clar ce fac azi."
        ],
        "id": "self_trust_l1_03_small_promises-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Mic pas",
        "steps": [
          "Gândește-te la un domeniu unde vrei să progresezi.",
          "Care ar fi un pas mic, de 5–10 minute, pe care îl poți face azi?"
        ],
        "helper": "Un pas mic respectat cântărește mai mult decât un plan mare abandonat.",
        "id": "self_trust_l1_03_small_promises-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Promisiuni realiste",
        "question": "Ce este mai bun pentru încrederea în sine?",
        "options": [
          "Să îți propui enorm și să renunți rapid.",
          "Să îți propui puțin, dar să respecți consecvent.",
          "Să nu îți propui nimic."
        ],
        "correctIndex": 1,
        "id": "self_trust_l1_03_small_promises-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Pasul de azi",
        "prompt": "Completează: „Astăzi, promisiunea mea mică și realistă este să ___.”",
        "id": "self_trust_l1_03_small_promises-screen-5"
      }
    ]
  },
  "self_trust_l1_04_tracking_wins": {
    "lessonId": "self_trust_l1_04_tracking_wins",
    "screens": [
      {
        "kind": "content",
        "title": "A nota ce respecți",
        "body": "Mintea are tendința să rețină mai mult ce nu faci decât ce duci la capăt. Dacă nu notezi ce respecți, ai impresia că „nu faci destul” la nesfârșit.",
        "id": "self_trust_l1_04_tracking_wins-screen-1"
      },
      {
        "kind": "content",
        "title": "Jurnalul de mici victorii",
        "body": "Două-trei rânduri seara, cu ce ai dus la capăt, pot schimba felul în care te vezi.",
        "id": "self_trust_l1_04_tracking_wins-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Lista de azi",
        "steps": [
          "Gândește-te la 2–3 lucruri mici pe care le-ai făcut azi.",
          "Ar fi putut intra într-un jurnal de „promisiuni respectate”?"
        ],
        "helper": "Când vezi pe hârtie ceea ce faci, încrederea devine mai concretă.",
        "id": "self_trust_l1_04_tracking_wins-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Notarea progresului",
        "question": "De ce este util să notezi promisiunile respectate?",
        "options": [
          "Ca să te lauzi.",
          "Ca să vezi real ce funcționează și să întărești încrederea în tine.",
          "Nu este util; doar te încurcă."
        ],
        "correctIndex": 1,
        "id": "self_trust_l1_04_tracking_wins-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un obicei mic",
        "prompt": "Completează: „Aș putea să notez în fiecare seară cel puțin ___ lucru(i) pe care le-am dus la capăt.”",
        "id": "self_trust_l1_04_tracking_wins-screen-5"
      }
    ]
  },
  "self_trust_l2_05_mistakes": {
    "lessonId": "self_trust_l2_05_mistakes",
    "screens": [
      {
        "kind": "content",
        "title": "Greșeli și încredere",
        "body": "Nu pierzi încrederea în tine pentru că greșești. O pierzi când, după greșeli, te zdrobești sau abandonezi complet.",
        "id": "self_trust_l2_05_mistakes-screen-1"
      },
      {
        "kind": "content",
        "title": "A vedea și a repara",
        "body": "Când spui: „Am greșit, îmi asum partea mea și repar cât pot”, încrederea în tine se întărește chiar dacă ai eșuat.",
        "id": "self_trust_l2_05_mistakes-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "O greșeală recentă",
        "steps": [
          "Adu-ți aminte o greșeală care încă te apasă.",
          "Te-ai criticat sau ai și reparat ceva concret?"
        ],
        "helper": "Repararea, nu vinovăția, reconstruiește încrederea.",
        "id": "self_trust_l2_05_mistakes-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Greșeli",
        "question": "Ce este mai util pentru încrederea în sine?",
        "options": [
          "Să te pedepsești ore în șir.",
          "Să vezi clar ce ai greșit și să faci un pas de reparare.",
          "Să negi că s-a întâmplat ceva."
        ],
        "correctIndex": 1,
        "id": "self_trust_l2_05_mistakes-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un pas de reparare",
        "prompt": "Completează: „Un pas mic de reparare pe care îl pot face este ___.”",
        "id": "self_trust_l2_05_mistakes-screen-5"
      }
    ]
  },
  "self_trust_l2_06_saying_no": {
    "lessonId": "self_trust_l2_06_saying_no",
    "screens": [
      {
        "kind": "content",
        "title": "A spune „nu” ca formă de încredere",
        "body": "De multe ori spui „da” celorlalți și „nu” ție. Pe termen lung, asta sapă încrederea în tine: simți că tu ești mereu ultimul pe listă.",
        "id": "self_trust_l2_06_saying_no-screen-1"
      },
      {
        "kind": "content",
        "title": "Un „nu” calm",
        "body": "Poți spune „nu” fără agresivitate. Spui doar: „Acum nu pot”, „Am nevoie să termin întâi ce mi-am propus.”",
        "id": "self_trust_l2_06_saying_no-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Unde te trădezi",
        "steps": [
          "Gândește-te la o situație recentă în care ai spus „da”, deși nu voiai."
        ],
        "helper": "Acolo, încrederea în tine a mai pierdut un punct.",
        "id": "self_trust_l2_06_saying_no-screen-3"
      },
      {
        "kind": "quiz",
        "title": "„Nu” sănătos",
        "question": "Ce face un „nu” spus la timp?",
        "options": [
          "Te transformă într-o persoană egoistă.",
          "Îți protejează energia și îți întărește încrederea în tine.",
          "Distruge orice relație."
        ],
        "correctIndex": 1,
        "id": "self_trust_l2_06_saying_no-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un „nu” pe care îl datorezi",
        "prompt": "Completează: „Dacă aș fi sincer(ă) cu mine, aș spune ‘nu’ la ___.”",
        "id": "self_trust_l2_06_saying_no-screen-5"
      }
    ]
  },
  "self_trust_l2_07_overcommit": {
    "lessonId": "self_trust_l2_07_overcommit",
    "screens": [
      {
        "kind": "content",
        "title": "Prea multe promisiuni",
        "body": "Când promiți prea mult, chiar cu intenții bune, ajungi să nu duci nimic până la capăt. În interior, se formează mesajul: „Eu nu termin ce încep.”",
        "id": "self_trust_l2_07_overcommit-screen-1"
      },
      {
        "kind": "content",
        "title": "Mai puțin, mai solid",
        "body": "Încrederea în tine crește când promiți mai puține lucruri și le duci cu adevărat la final.",
        "id": "self_trust_l2_07_overcommit-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Inventar",
        "steps": [
          "Fă o listă mentală a promisiunilor pe care le ai acum (muncă, personal, sănătate)."
        ],
        "helper": "Lista prea plină strică calitatea, nu o demonstrează.",
        "id": "self_trust_l2_07_overcommit-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Supra-încărcare",
        "question": "Ce ajută mai mult încrederea în sine?",
        "options": [
          "Să spui „da” la tot.",
          "Să reduci promisiunile și să le respecți pe cele rămase.",
          "Să nu îți mai propui nimic."
        ],
        "correctIndex": 1,
        "id": "self_trust_l2_07_overcommit-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O promisiune de scos",
        "prompt": "Completează: „O promisiune nerealistă pe care aș putea să o ajustez sau să o anulez este ___.”",
        "id": "self_trust_l2_07_overcommit-screen-5"
      }
    ]
  },
  "self_trust_l2_08_values": {
    "lessonId": "self_trust_l2_08_values",
    "screens": [
      {
        "kind": "content",
        "title": "Valorile tale",
        "body": "Încrederea în tine este mai puternică atunci când deciziile sunt legate de ceea ce contează cu adevărat pentru tine, nu doar de ce se așteaptă ceilalți.",
        "id": "self_trust_l2_08_values-screen-1"
      },
      {
        "kind": "content",
        "title": "Mică aliniere",
        "body": "Nu trebuie să ai clar toate valorile. E suficient să observi: „Asta e important pentru mine acum” și să iei măcar o decizie în acord cu asta.",
        "id": "self_trust_l2_08_values-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Ce contează",
        "steps": [
          "Gândește-te la ceva ce îți pasă cu adevărat în perioada asta (sănătate, relații, lucru, liniște)."
        ],
        "helper": "Când acțiunile tale se apropie de ceea ce contează, încrederea în tine crește.",
        "id": "self_trust_l2_08_values-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Valori și încredere",
        "question": "Ce întărește încrederea în sine?",
        "options": [
          "Să îți ignori valorile ca să mulțumești pe toată lumea.",
          "Să iei decizii mici în acord cu ce contează pentru tine.",
          "Să îți schimbi părerea de la o oră la alta."
        ],
        "correctIndex": 1,
        "id": "self_trust_l2_08_values-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O decizie aliniată",
        "prompt": "Completează: „O decizie mică pe care aș putea să o iau în acord cu valorile mele este ___.”",
        "id": "self_trust_l2_08_values-screen-5"
      }
    ]
  },
  "self_trust_l3_09_listen_self": {
    "lessonId": "self_trust_l3_09_listen_self",
    "screens": [
      {
        "kind": "content",
        "title": "A te asculta pe tine",
        "body": "Uneori știi foarte bine ce ai nevoie sau ce vrei, dar te ignori: „nu acum”, „mai târziu”, „nu contează”.",
        "id": "self_trust_l3_09_listen_self-screen-1"
      },
      {
        "kind": "content",
        "title": "Semnalele tale",
        "body": "Încrederea în tine crește când începi să iei în serios propriile semnale: oboseală, interes, repulsie, curiozitate.",
        "id": "self_trust_l3_09_listen_self-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "A nu te mai ignora complet",
        "steps": [
          "Gândește-te la o situație în care ai simțit clar un „nu” sau un „da” interior și l-ai ignorat."
        ],
        "helper": "De fiecare dată când te ignori complet, ceva din încrederea ta în tine scade.",
        "id": "self_trust_l3_09_listen_self-screen-3"
      },
      {
        "kind": "quiz",
        "title": "A te asculta",
        "question": "Ce ajută încrederea în sine?",
        "options": [
          "Să ignori ce simți ca să nu deranjezi.",
          "Să ții cont, măcar parțial, de semnalele tale interioare.",
          "Să te obligi mereu împotriva a tot ce simți."
        ],
        "correctIndex": 1,
        "id": "self_trust_l3_09_listen_self-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un „da” sau „nu” respectat",
        "prompt": "Completează: „Aș putea să respect data viitoare sentimentul meu de ___ în situațiile de tip ___.”",
        "id": "self_trust_l3_09_listen_self-screen-5"
      }
    ]
  },
  "self_trust_l3_10_repair_self": {
    "lessonId": "self_trust_l3_10_repair_self",
    "screens": [
      {
        "kind": "content",
        "title": "A repara încrederea după ce te-ai trădat",
        "body": "Când îți promiți ceva și nu faci, poți fie să te lovești la nesfârșit, fie să repari. Repararea înseamnă: recunosc, înțeleg de ce, ajustez promisiunea.",
        "id": "self_trust_l3_10_repair_self-screen-1"
      },
      {
        "kind": "content",
        "title": "Fără dramă, cu claritate",
        "body": "Nu ai nevoie de discursuri dure. Ai nevoie de: „Am promis X, n-am făcut. De ce? Ce pot promite mai realist data viitoare?”",
        "id": "self_trust_l3_10_repair_self-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Un episod",
        "steps": [
          "Amintește-ți un plan pe care l-ai abandonat.",
          "Ce ai putea învăța de acolo, în loc să te judeci?"
        ],
        "helper": "Lecția învățată + promisiune ajustată = reparație.",
        "id": "self_trust_l3_10_repair_self-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Reparație",
        "question": "Ce reconstruiește cel mai mult încrederea în sine?",
        "options": [
          "Să te faci praf în mintea ta și atât.",
          "Să înveți din ce s-a întâmplat și să ajustezi promisiunea.",
          "Să ignori totul și să speri să se schimbe singur."
        ],
        "correctIndex": 1,
        "id": "self_trust_l3_10_repair_self-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O ajustare",
        "prompt": "Completează: „Pentru următoarea promisiune, aș putea să o fac mai realistă reducând-o la ___.”",
        "id": "self_trust_l3_10_repair_self-screen-5"
      }
    ]
  },
  "self_trust_l3_11_decisions": {
    "lessonId": "self_trust_l3_11_decisions",
    "screens": [
      {
        "kind": "content",
        "title": "Deciziile ca acord cu tine",
        "body": "Fiecare decizie este, într-un fel, un acord cu tine. Când iei decizii care te trădează constant, încrederea în tine scade.",
        "id": "self_trust_l3_11_decisions-screen-1"
      },
      {
        "kind": "content",
        "title": "Mică pauză înainte de „da”",
        "body": "O secundă de pauză înainte să spui „da” sau „nu” îți dă timp să verifici dacă decizia este în acord cu tine.",
        "id": "self_trust_l3_11_decisions-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la o decizie recentă luată din grabă.",
          "A fost în acord cu tine sau doar din reflex?"
        ],
        "helper": "Pauza scurtă, repetată, îți protejează încrederea în tine.",
        "id": "self_trust_l3_11_decisions-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Decizii",
        "question": "Ce ajută încrederea în sine legat de decizii?",
        "options": [
          "Să răspunzi impulsiv la orice.",
          "Să îți oferi o scurtă pauză și să verifici dacă decizia e în acord cu tine.",
          "Să amâni la nesfârșit orice decizie."
        ],
        "correctIndex": 1,
        "id": "self_trust_l3_11_decisions-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Pauza mea de acord",
        "prompt": "Completează: „Aș putea să îmi iau o secundă de pauză înainte să spun ‘da’ mai ales în situațiile ___.”",
        "id": "self_trust_l3_11_decisions-screen-5"
      }
    ]
  },
  "self_trust_l3_12_ritual": {
    "lessonId": "self_trust_l3_12_ritual",
    "screens": [
      {
        "kind": "content",
        "title": "Ritualul tău de încredere",
        "body": "Încrederea în sine nu se construiește într-o zi. Se construiește din gesturi repetate: promisiuni mici, respectate, reparate când nu reușești.",
        "id": "self_trust_l3_12_ritual-screen-1"
      },
      {
        "kind": "content",
        "title": "Trei elemente",
        "body": "Un ritual de încredere în tine poate avea trei lucruri: o promisiune mică dimineața, o pauză de verificare în timpul zilei, o scurtă notare seara.",
        "id": "self_trust_l3_12_ritual-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Schița ritualului",
        "steps": [
          "Alege o promisiune mică de dimineață.",
          "Alege un moment în care să verifici cum ești.",
          "Alege un moment în care să notezi 1–2 lucruri duse la capăt."
        ],
        "helper": "Când îți respecți propriul ritual, îți transmiți că ești important.",
        "id": "self_trust_l3_12_ritual-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ritual de încredere",
        "question": "Ce face un ritual bun de încredere în sine?",
        "options": [
          "Este complicat și greu de ținut.",
          "Este simplu, realist și repetabil.",
          "Se schimbă complet în fiecare zi."
        ],
        "correctIndex": 1,
        "id": "self_trust_l3_12_ritual-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ritualul meu",
        "prompt": "Completează: „Ritualul meu simplu de încredere în mine ar putea fi: dimineața ___, în timpul zilei ___, seara ___.”",
        "id": "self_trust_l3_12_ritual-screen-5"
      }
    ]
  },
  "self_trust_l3_13_body_to_mind": {
    "lessonId": "self_trust_l3_13_body_to_mind",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul influențează promisiunile",
        "body": "Când ești epuizat sau flămând, promisiunile par greu de respectat, iar încrederea în tine scade fără să-ți dai seama.",
        "id": "self_trust_l3_13_body_to_mind-screen-1"
      },
      {
        "kind": "content",
        "title": "Protejează baza fizică",
        "body": "Înainte să te critici că „nu ești disciplinat”, verifică dacă baza fizică este în regulă (somn, hrană, hidratare).",
        "id": "self_trust_l3_13_body_to_mind-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Gândește-te la o promisiune ratată.",
          "Cum era corpul tău în acea perioadă?"
        ],
        "helper": "Uneori corpul obosit sabotează promisiuni altfel realiste.",
        "id": "self_trust_l3_13_body_to_mind-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Corpul și promisiunile",
        "question": "Ce susține promisiunile respectate?",
        "options": [
          "Să ignori corpul și să forțezi mereu.",
          "Un corp minim stabil: somn, hrană, recuperare."
        ],
        "correctIndex": 1,
        "id": "self_trust_l3_13_body_to_mind-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ajustare fizică",
        "prompt": "„Un gest fizic care mă ajută să-mi respect promisiunile este ___.”",
        "id": "self_trust_l3_13_body_to_mind-screen-5"
      }
    ]
  },
  "self_trust_l3_14_mind_to_body": {
    "lessonId": "self_trust_l3_14_mind_to_body",
    "screens": [
      {
        "kind": "content",
        "title": "Mintea influențează corpul în auto-încredere",
        "body": "Dialogul interior dur crește cortizolul și îți consumă energia, ceea ce face promisiunile și mai greu de dus la capăt.",
        "id": "self_trust_l3_14_mind_to_body-screen-1"
      },
      {
        "kind": "content",
        "title": "Ton blând, corp cooperant",
        "body": "Când îți vorbești ca unui aliat, corpul se relaxează și îți oferă energia necesară pentru a continua promisiunile.",
        "id": "self_trust_l3_14_mind_to_body-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Observă cum te simți în corp după ce te critici."
        ],
        "helper": "Tonul interior dă semnale directe corpului.",
        "id": "self_trust_l3_14_mind_to_body-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Minte și auto-încredere",
        "question": "Ce ajută corpul să fie de partea ta?",
        "options": [
          "Auto-critica constantă.",
          "O voce interioară mai blândă și realistă."
        ],
        "correctIndex": 1,
        "id": "self_trust_l3_14_mind_to_body-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Fraza de aliat",
        "prompt": "„O frază pe care i-o pot spune corpului meu pentru a rămâne de partea mea este ___.”",
        "id": "self_trust_l3_14_mind_to_body-screen-5"
      }
    ]
  },
  "decision_discernment_protocol": {
    "lessonId": "decision_discernment_protocol",
    "screens": [
      {
        "kind": "protocol",
        "title": "Protocol de decizie calmă",
        "steps": [
          "Clarific ce decizie am de luat, în cuvinte simple.",
          "Întreb: „Ce vreau cu adevărat?” și „Ce e important pentru mine aici?”",
          "Notez rapid două-trei opțiuni și un risc principal pentru fiecare.",
          "Aleg pasul următor suficient de bun, nu perfect, și accept că voi ajusta dacă e nevoie."
        ],
        "id": "decision_discernment_protocol-screen-1"
      }
    ]
  },
  "decision_discernment_l1_01_what_is_discernment": {
    "lessonId": "decision_discernment_l1_01_what_is_discernment",
    "screens": [
      {
        "kind": "content",
        "title": "Ce este discernământul",
        "body": "Discernământul este capacitatea de a vedea mai clar înainte să alegi. Nu este magie, ci un mod de a te opri o clipă, de a pune întrebări simple și de a nu confunda emoția de moment cu realitatea întreagă.",
        "id": "decision_discernment_l1_01_what_is_discernment-screen-1"
      },
      {
        "kind": "content",
        "title": "Decizie vs impuls",
        "body": "Un impuls este „fac acum, fără să mă gândesc”. O decizie este „mă gândesc puțin, aleg și îmi asum”.",
        "id": "decision_discernment_l1_01_what_is_discernment-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observă",
        "steps": [
          "Gândește-te la o alegere recentă.",
          "A fost mai mult impuls sau decizie?"
        ],
        "helper": "Doar această diferențiere îți schimbă felul în care alegi pe viitor.",
        "id": "decision_discernment_l1_01_what_is_discernment-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Discernământ",
        "question": "Ce este cel mai aproape de discernământ?",
        "options": [
          "Să amâni orice decizie.",
          "Să îți pui câteva întrebări simple înainte să alegi.",
          "Să alegi doar pe baza emoției de moment."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l1_01_what_is_discernment-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O decizie recentă",
        "prompt": "Completează: „O decizie pe care am luat-o mai mult din impuls a fost ___.”",
        "id": "decision_discernment_l1_01_what_is_discernment-screen-5"
      }
    ]
  },
  "decision_discernment_l1_02_slowing_down": {
    "lessonId": "decision_discernment_l1_02_slowing_down",
    "screens": [
      {
        "kind": "content",
        "title": "Încetinirea scurtă",
        "body": "Nu ai nevoie de ore ca să iei o decizie mai bună. Uneori sunt suficiente câteva secunde în care să îți pui întrebarea: „Ce fac acum, de fapt?”",
        "id": "decision_discernment_l1_02_slowing_down-screen-1"
      },
      {
        "kind": "content",
        "title": "Pauza care schimbă direcția",
        "body": "Acea mică pauză creează spațiu între stimul și răspuns. Acolo apare discernământul.",
        "id": "decision_discernment_l1_02_slowing_down-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Pauza mea",
        "steps": [
          "Gândește-te la o situație în care ai fi avut nevoie de 5 secunde în plus înainte de a acționa."
        ],
        "helper": "Pauza nu este slăbiciune; este control asupra direcției tale.",
        "id": "decision_discernment_l1_02_slowing_down-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Pauza și decizia",
        "question": "Ce permite o pauză scurtă înainte de decizie?",
        "options": [
          "Să reacționezi mai repede.",
          "Să alegi răspunsul în loc de impulsul automat.",
          "Să scapi de orice responsabilitate."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l1_02_slowing_down-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un loc pentru pauză",
        "prompt": "Completează: „Aș putea introduce o pauză scurtă înainte de a decide în situații de tip ___.”",
        "id": "decision_discernment_l1_02_slowing_down-screen-5"
      }
    ]
  },
  "decision_discernment_l1_03_simple_questions": {
    "lessonId": "decision_discernment_l1_03_simple_questions",
    "screens": [
      {
        "kind": "content",
        "title": "Întrebări simple, efect mare",
        "body": "Înainte de o decizie, două întrebări pot schimba tot: „Ce vreau, de fapt, aici?” și „Ce risc dacă fac asta?”.",
        "id": "decision_discernment_l1_03_simple_questions-screen-1"
      },
      {
        "kind": "content",
        "title": "Fără filozofie grea",
        "body": "Nu ai nevoie de analize complexe. Ai nevoie să nu sari direct la „da” sau „nu” fără să vezi ce urmărești și ce pui în joc.",
        "id": "decision_discernment_l1_03_simple_questions-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Pune întrebarea",
        "steps": [
          "Gândește-te la o decizie pe care o ai acum de luat.",
          "Răspunde simplu: „Ce vreau?” și „Ce risc?”"
        ],
        "helper": "Decizia devine mai clară când o privești din aceste două unghiuri.",
        "id": "decision_discernment_l1_03_simple_questions-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Întrebări utile",
        "question": "Ce întrebare ajută cel mai mult discernământul?",
        "options": [
          "„Ce ar spune toți ceilalți?”",
          "„Ce vreau cu adevărat și ce risc dacă aleg asta?”",
          "„Cum evit să simt orice emoție?”"
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l1_03_simple_questions-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Două întrebări",
        "prompt": "Completează: „Înainte de următoarea decizie importantă, îmi voi pune întrebările: ‘Ce vreau?’ și ‘Ce risc dacă ___.’”",
        "id": "decision_discernment_l1_03_simple_questions-screen-5"
      }
    ]
  },
  "decision_discernment_l1_04_small_decisions": {
    "lessonId": "decision_discernment_l1_04_small_decisions",
    "screens": [
      {
        "kind": "content",
        "title": "Deciziile mici contează",
        "body": "Nu doar deciziile mari îți modelează viața. Alegerile zilnice aparent mici îți consumă sau îți construiesc energia, timpul și direcția.",
        "id": "decision_discernment_l1_04_small_decisions-screen-1"
      },
      {
        "kind": "content",
        "title": "Exersezi în mic, nu în situații extreme",
        "body": "E mai ușor să exersezi discernământul în decizii mici, când nu e totul la limită.",
        "id": "decision_discernment_l1_04_small_decisions-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "O decizie mică",
        "steps": [
          "Gândește-te la o decizie mică de azi (ce faci în următoarea oră, ce alegi pentru tine)."
        ],
        "helper": "Acolo începe antrenamentul real.",
        "id": "decision_discernment_l1_04_small_decisions-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Decizii mici",
        "question": "Unde este cel mai ușor de exersat discernământul?",
        "options": [
          "Doar în situații extreme.",
          "În deciziile mici și frecvente.",
          "Niciodată; se naște sau nu."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l1_04_small_decisions-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O alegere de azi",
        "prompt": "Completează: „Astăzi pot exersa o decizie puțin mai conștientă alegând să ___.”",
        "id": "decision_discernment_l1_04_small_decisions-screen-5"
      }
    ]
  },
  "decision_discernment_l2_05_criteria": {
    "lessonId": "decision_discernment_l2_05_criteria",
    "screens": [
      {
        "kind": "content",
        "title": "Criteriile tale",
        "body": "O decizie devine mai clară când știi după ce criterii o judeci: timp, bani, energie, sănătate, relații, învățare.",
        "id": "decision_discernment_l2_05_criteria-screen-1"
      },
      {
        "kind": "content",
        "title": "Nu poți avea totul",
        "body": "Uneori, un criteriu trebuie pus mai sus decât altul. Nu poți maximiza totul simultan.",
        "id": "decision_discernment_l2_05_criteria-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Alege criteriul principal",
        "steps": [
          "Gândește-te la o decizie actuală.",
          "Care este criteriul tău principal: timp, bani, energie, altceva?"
        ],
        "helper": "Un criteriu clar îți simplifică decizia.",
        "id": "decision_discernment_l2_05_criteria-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Criterii",
        "question": "Ce ajută cel mai mult în clarificarea unei decizii?",
        "options": [
          "Să te gândești la toate în același timp, fără ordine.",
          "Să alegi un criteriu principal care contează acum.",
          "Să ignori orice criteriu."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l2_05_criteria-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Criteriul meu",
        "prompt": "Completează: „Pentru decizia ___, criteriul meu principal este ___.”",
        "id": "decision_discernment_l2_05_criteria-screen-5"
      }
    ]
  },
  "decision_discernment_l2_06_risk": {
    "lessonId": "decision_discernment_l2_06_risk",
    "screens": [
      {
        "kind": "content",
        "title": "Riscul văzut, nu imaginat vag",
        "body": "Frica de decizii crește când riscul este o ceață generală: „și dacă iese rău?”. Când numești concret riscul, devine mai gestionabil.",
        "id": "decision_discernment_l2_06_risk-screen-1"
      },
      {
        "kind": "content",
        "title": "Cel mai relevant risc",
        "body": "Nu trebuie să prevezi tot. E suficient să vezi „care este riscul principal aici”.",
        "id": "decision_discernment_l2_06_risk-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Numește riscul",
        "steps": [
          "Alege o decizie.",
          "Numește clar un risc principal dacă alegi într-un fel și unul dacă nu alegi."
        ],
        "helper": "Când riscul are nume, nu mai pare un monstru invizibil.",
        "id": "decision_discernment_l2_06_risk-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Risc și decizie",
        "question": "Ce ajută cel mai mult când te temi de o decizie?",
        "options": [
          "Să nu te mai gândești deloc.",
          "Să numești clar riscul principal și să vezi dacă îl poți accepta.",
          "Să ceri cât mai multe păreri până te blochezi."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l2_06_risk-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un risc clar",
        "prompt": "Completează: „Pentru decizia ___, riscul principal pe care mi-l asum este ___.”",
        "id": "decision_discernment_l2_06_risk-screen-5"
      }
    ]
  },
  "decision_discernment_l2_07_values_alignment": {
    "lessonId": "decision_discernment_l2_07_values_alignment",
    "screens": [
      {
        "kind": "content",
        "title": "Decizii în acord cu valorile",
        "body": "O decizie poate arăta bine pe hârtie, dar să fie grea în interior pentru că se bate cap în cap cu valorile tale.",
        "id": "decision_discernment_l2_07_values_alignment-screen-1"
      },
      {
        "kind": "content",
        "title": "„Are sens pentru mine?”",
        "body": "O întrebare simplă ajută: „Decizia asta este în direcția lucrurilor care contează pentru mine sau doar arată bine în exterior?”",
        "id": "decision_discernment_l2_07_values_alignment-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Verificare de sens",
        "steps": [
          "Gândește-te la o decizie mai mare.",
          "Pe o scară de la 1 la 10, cât simți că este în acord cu valorile tale?"
        ],
        "helper": "Un scor foarte mic semnalează disconfort pe termen lung.",
        "id": "decision_discernment_l2_07_values_alignment-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Valori și decizie",
        "question": "Ce definește o decizie bună în sensul acestui modul?",
        "options": [
          "Doar rezultatul final.",
          "Și felul în care a fost luată, în acord cu valorile tale.",
          "Doar ce cred ceilalți despre ea."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l2_07_values_alignment-screen-4"
      },
      {
        "kind": "reflection",
        "title": "O decizie mai aliniată",
        "prompt": "Completează: „Aș putea ajusta decizia ___ ca să fie mai în acord cu valoarea mea de ___.”",
        "id": "decision_discernment_l2_07_values_alignment-screen-5"
      }
    ]
  },
  "decision_discernment_l2_08_small_experiments": {
    "lessonId": "decision_discernment_l2_08_small_experiments",
    "screens": [
      {
        "kind": "content",
        "title": "Experimente mici, nu verdict final",
        "body": "Uneori blochezi o decizie pentru că simți că „dacă aleg, e pentru totdeauna”. Dar multe decizii pot fi transformate în experimente mici.",
        "id": "decision_discernment_l2_08_small_experiments-screen-1"
      },
      {
        "kind": "content",
        "title": "Perioadă de test",
        "body": "Poți decide: „Testez asta 7 zile / o lună și apoi reevaluez.”",
        "id": "decision_discernment_l2_08_small_experiments-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Transformă în experiment",
        "steps": [
          "Alege o decizie de care îți e teamă.",
          "Cum ai putea să o transformi într-un test pe termen scurt?"
        ],
        "helper": "Experimentele îți dau informații, nu verdict definitiv.",
        "id": "decision_discernment_l2_08_small_experiments-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Experiment",
        "question": "Ce este o decizie-experiment?",
        "options": [
          "O decizie pe viață.",
          "O alegere limitată în timp, după care tragi concluzii.",
          "O decizie luată la întâmplare."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l2_08_small_experiments-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Experimentul meu",
        "prompt": "Completează: „Aș putea transforma decizia ___ într-un experiment de ___ zile.”",
        "id": "decision_discernment_l2_08_small_experiments-screen-5"
      }
    ]
  },
  "decision_discernment_l3_09_uncertainty": {
    "lessonId": "decision_discernment_l3_09_uncertainty",
    "screens": [
      {
        "kind": "content",
        "title": "Trăitul cu incertitudine",
        "body": "Nu există decizie fără incertitudine. Dacă aștepți siguranță totală, rămâi blocat.",
        "id": "decision_discernment_l3_09_uncertainty-screen-1"
      },
      {
        "kind": "content",
        "title": "Suficient de clar",
        "body": "De multe ori nu ai nevoie de „sigur”, ai nevoie de „suficient de clar pentru următorul pas”.",
        "id": "decision_discernment_l3_09_uncertainty-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Acceptarea incertitudinii",
        "steps": [
          "Gândește-te la o decizie pe care o tot amâni.",
          "Ce parte din ea rămâne inevitabil incertă, orice ai face?"
        ],
        "helper": "Acceptarea unei părți din incertitudine îți deblochează mișcarea.",
        "id": "decision_discernment_l3_09_uncertainty-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Incertitudine",
        "question": "Ce este realist într-o decizie?",
        "options": [
          "Să ai 100% siguranță.",
          "Să ai claritate suficientă și să accepți o parte de incertitudine.",
          "Să nu simți niciodată teamă."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l3_09_uncertainty-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Un pas cu incertitudine",
        "prompt": "Completează: „Pot accepta să iau decizia ___ chiar dacă nu știu sigur ___.”",
        "id": "decision_discernment_l3_09_uncertainty-screen-5"
      }
    ]
  },
  "decision_discernment_l3_10_regret": {
    "lessonId": "decision_discernment_l3_10_regret",
    "screens": [
      {
        "kind": "content",
        "title": "Frica de regret",
        "body": "Mulți rămân blocați în decizii de teamă să nu regrete. Dar regretul apare și când nu alegi nimic și lași lucrurile să curgă la întâmplare.",
        "id": "decision_discernment_l3_10_regret-screen-1"
      },
      {
        "kind": "content",
        "title": "Regret gestionat",
        "body": "Poți alege să trăiești cu regretul mic, gestionabil, al unei decizii asumate, în locul regretului mare al blocajului.",
        "id": "decision_discernment_l3_10_regret-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Regretul actual",
        "steps": [
          "Gândește-te la un regret pe care îl porți acum.",
          "Ține mai mult de o decizie luată sau de una ne-luată?"
        ],
        "helper": "Și decizia de a nu decide este tot o decizie.",
        "id": "decision_discernment_l3_10_regret-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Regret",
        "question": "Ce abordare este aliniată cu modulul?",
        "options": [
          "Să nu mai iei nicio decizie ca să nu regreți.",
          "Să iei decizii asumate, știind că un oarecare regret este uneori inevitabil.",
          "Să negi orice regret."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l3_10_regret-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Regret și mișcare",
        "prompt": "Completează: „Aș prefera să risc un regret mic, asumat, legat de decizia ___, decât regretul de a nu fi încercat deloc.”",
        "id": "decision_discernment_l3_10_regret-screen-5"
      }
    ]
  },
  "decision_discernment_l3_11_meta_decision": {
    "lessonId": "decision_discernment_l3_11_meta_decision",
    "screens": [
      {
        "kind": "content",
        "title": "Decizia de a decide",
        "body": "Uneori e important să decizi chiar dacă nu ai toate detaliile perfecte. Și asta este o decizie: „Aleg să nu mai amân și să stabilesc un termen.”",
        "id": "decision_discernment_l3_11_meta_decision-screen-1"
      },
      {
        "kind": "content",
        "title": "Data-limită",
        "body": "O decizie fără dată-limită rămâne adesea doar o idee.",
        "id": "decision_discernment_l3_11_meta_decision-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Termen clar",
        "steps": [
          "Alege o decizie pe care o tot amâni.",
          "Stabilește o dată până la care vei decide, chiar dacă nu ai toate informațiile."
        ],
        "helper": "Termenul clar îți structurează atenția.",
        "id": "decision_discernment_l3_11_meta_decision-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Decizia de a decide",
        "question": "Ce poate debloca o decizie amânată la nesfârșit?",
        "options": [
          "Să aștepți încă „un pic”.",
          "Să stabilești o dată clară până la care vei decide și să o respecți.",
          "Să ignori complet subiectul."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l3_11_meta_decision-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Termenul meu",
        "prompt": "Completează: „Pentru decizia ___, îmi propun să aleg până la data de ___.”",
        "id": "decision_discernment_l3_11_meta_decision-screen-5"
      }
    ]
  },
  "decision_discernment_l3_12_ritual": {
    "lessonId": "decision_discernment_l3_12_ritual",
    "screens": [
      {
        "kind": "content",
        "title": "Ritualul tău de decizie",
        "body": "Un ritual simplu te ajută să nu te pierzi în fiecare situație. Nu ai nevoie de proceduri complicate, ci de câțiva pași repetați.",
        "id": "decision_discernment_l3_12_ritual-screen-1"
      },
      {
        "kind": "content",
        "title": "3 pași repetați",
        "body": "Un ritual de decizie poate conține: clarific decizia, aplic protocolul de decizie calmă, stabilesc următorul pas și o dată de revizuire.",
        "id": "decision_discernment_l3_12_ritual-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Schița ritualului",
        "steps": [
          "Alege cum vrei să clarifici deciziile.",
          "Alege când aplici protocolul de decizie calmă.",
          "Alege cum notezi deciziile importante (scurt)."
        ],
        "helper": "Când urmezi ritualul, nu mai reinventezi roata de fiecare dată.",
        "id": "decision_discernment_l3_12_ritual-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Ritual de decizie",
        "question": "Ce face un ritual bun de decizie?",
        "options": [
          "Este complex și greu de urmat.",
          "Este simplu, clar și repetabil.",
          "Se schimbă complet la fiecare situație."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l3_12_ritual-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ritualul meu de decizie",
        "prompt": "Completează: „Ritualul meu simplu de decizie ar putea fi: întâi ___, apoi ___, la final ___.”",
        "id": "decision_discernment_l3_12_ritual-screen-5"
      }
    ]
  },
  "decision_discernment_l3_13_body_to_mind": {
    "lessonId": "decision_discernment_l3_13_body_to_mind",
    "screens": [
      {
        "kind": "content",
        "title": "Corpul influențează decizia",
        "body": "Când ești flămând, deshidratat sau foarte obosit, creierul alege impulsiv și caută recompense rapide. Nu este lipsă de voință, ci biochimie.",
        "id": "decision_discernment_l3_13_body_to_mind-screen-1"
      },
      {
        "kind": "content",
        "title": "Decizii după ce îți reglezi corpul",
        "body": "O gustare mică, apă sau o pauză de respirație pot schimba felul în care gândești opțiunile.",
        "id": "decision_discernment_l3_13_body_to_mind-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Amintește-ți o decizie luată „pe fugă”.",
          "Cum era corpul tău atunci?"
        ],
        "helper": "Deciziile bune încep cu un corp măcar stabil.",
        "id": "decision_discernment_l3_13_body_to_mind-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Corpul și decizia",
        "question": "Ce susține discernământul?",
        "options": [
          "Să ignori corpul complet.",
          "Să ai corpul minim stabil (hrană, apă, mișcare)."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l3_13_body_to_mind-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ajustare corporală",
        "prompt": "„Înaintea unei decizii importante, pot avea grijă de corpul meu astfel: ___.”",
        "id": "decision_discernment_l3_13_body_to_mind-screen-5"
      }
    ]
  },
  "decision_discernment_l3_14_mind_to_body": {
    "lessonId": "decision_discernment_l3_14_mind_to_body",
    "screens": [
      {
        "kind": "content",
        "title": "Mintea influențează corpul în decizii",
        "body": "Analiza excesivă, frica și criticile interioare ridică nivelul de adrenalină și te țin blocat.",
        "id": "decision_discernment_l3_14_mind_to_body-screen-1"
      },
      {
        "kind": "content",
        "title": "Decizie calmă",
        "body": "Când îți pui întrebări simple și accepți o parte de incertitudine, corpul se calmează și îți permite să alegi mai clar.",
        "id": "decision_discernment_l3_14_mind_to_body-screen-2"
      },
      {
        "kind": "checkpoint",
        "title": "Observare",
        "steps": [
          "Observă cum reacționează corpul când te critici pentru o decizie."
        ],
        "helper": "Mintea calmă creează corp calm.",
        "id": "decision_discernment_l3_14_mind_to_body-screen-3"
      },
      {
        "kind": "quiz",
        "title": "Minte și corp în decizie",
        "question": "Cum reduci blocajul corporal?",
        "options": [
          "Continuând să te agiți mental.",
          "Acceptând incertitudinea și punând întrebări scurte (ce vreau? ce risc?)."
        ],
        "correctIndex": 1,
        "id": "decision_discernment_l3_14_mind_to_body-screen-4"
      },
      {
        "kind": "reflection",
        "title": "Ritual mental",
        "prompt": "„Pentru a-mi calma corpul când iau decizii, pot repeta: ___.”",
        "id": "decision_discernment_l3_14_mind_to_body-screen-5"
      }
    ]
  }
};
