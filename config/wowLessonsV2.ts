import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

export type WowCardContext = {
  eyebrow: string;
  title: string;
  description: string;
  question: string;
  options: string[];
};

export type WowCardExercise = {
  title: string;
  steps: string[];
  durationHint?: string;
};

export type WowCardReflection = {
  title: string;
  prompt: string;
  placeholder: string;
  mapping: string;
};

export type WowLessonDefinition = {
  moduleKey: string;
  title: string;
  summary: string;
  traitPrimary: CatAxisId;
  traitSecondary?: CatAxisId;
  canonDomain: CanonDomainId;
  context: WowCardContext;
  exercise: WowCardExercise;
  reflection: WowCardReflection;
};

export const WOW_LESSONS_V2: Record<string, WowLessonDefinition> = {
  clarity_01_illusion_of_clarity: {
    moduleKey: "clarity_01_illusion_of_clarity",
    title: "Iluzia clarității",
    summary: "Îți verifici claritatea reală formulând o singură propoziție decisivă.",
    traitPrimary: "clarity",
    traitSecondary: "focus",
    canonDomain: "decisionalClarity",
    context: {
      eyebrow: "Context",
      title: "Cât de clar este cu adevărat?",
      description:
        "Faptul că ceva îți pare clar în cap nu înseamnă că este clar. Creierul confundă familiaritatea cu claritatea.",
      question: "Cât de des te trezești că explici greu ce ai de făcut?",
      options: ["Rar", "Din când în când", "Foarte des"],
    },
    exercise: {
      title: "L3 · O propoziție reală",
      steps: [
        "Închide ochii pentru 3 respirații lente.",
        "Scrie o singură propoziție despre decizia reală din următoarele 20 de minute.",
        "Repetă propoziția cu voce joasă și observă dacă este concretă (timp + rezultat).",
      ],
      durationHint: "~2 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce situație aplici regula unei singure propoziții azi?",
      placeholder: "Ex.: înainte de ședința de 14:00 scriu propoziția și o citesc.",
      mapping: "Lucrezi pe Claritate decizională și susții Focusul.",
    },
  },
  clarity_02_one_real_thing: {
    moduleKey: "clarity_02_one_real_thing",
    title: "Un singur lucru real",
    summary: "Identifici decizia reală care mută situația și tai activitățile care doar ocupă timp.",
    traitPrimary: "clarity",
    traitSecondary: "focus",
    canonDomain: "decisionalClarity",
    context: {
      eyebrow: "Context",
      title: "Activitate vs progres",
      description:
        "Când totul pare important uiți întrebarea „Ce mută cu adevărat situația?”. Ziua se umple de volum, dar fără progres.",
      question: "Cât de des închei ziua fără să poți numi o decizie clară?",
      options: ["Foarte rar", "Uneori", "Des"],
    },
    exercise: {
      title: "L3 · Decizia reală",
      steps: [
        "Gândește-te la cea mai apăsătoare situație din prezent.",
        "Scrie într-o singură propoziție ce decizie reală trebuie luată (verb clar + termen).",
        "Notează rapid trei activități și marchează dacă susțin direct acea decizie.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce moment din zi aplici întrebarea «Ce decizie mută tot?»",
      placeholder: "Ex.: înainte de stand-up scriu decizia reală și termenul limită.",
      mapping: "Lucrezi pe Claritate decizională și îți antrenezi Focusul.",
    },
  },
  clarity_03_fog_vs_fatigue: {
    moduleKey: "clarity_03_fog_vs_fatigue",
    title: "Ceață vs. oboseală",
    summary: "Diagnostichezi dacă blocajul vine din claritate sau energie și alegi acțiunea corectă.",
    traitPrimary: "clarity",
    traitSecondary: "energy",
    canonDomain: "decisionalClarity",
    context: {
      eyebrow: "Context",
      title: "Confuzie sau oboseală?",
      description:
        "Confuzia se tratează cu clarificare, oboseala cu reset. Dacă le amesteci, consumi energie și frustrezi echipa.",
      question: "Ce faci când și task-urile simple devin grele?",
      options: ["Forțez până ies", "Caut o pauză scurtă", "Clarific înainte să continui"],
    },
    exercise: {
      title: "L3 · Diagnostic rapid",
      steps: [
        "Notează blocajul actual și întreabă-te: „Dacă aveam energie maximă era clar?”",
        "Dacă răspunsul e DA: ridică-te, respiră 4-6 de patru ori și relaxează umerii.",
        "Dacă răspunsul e NU: scrie două întrebări concrete care ar clarifica problema.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Ce semnal folosești azi ca să știi dacă trebuie pauză sau clarificare?",
      placeholder: "Ex.: înainte de decizii grele scriu „Energie?” / „Claritate?” și aleg ritualul potrivit.",
      mapping: "Lucrezi pe Claritate decizională și protejezi Energia funcțională.",
    },
  },
  clarity_04_brutal_writing: {
    moduleKey: "clarity_04_brutal_writing",
    title: "Scriere brutală",
    summary: "Testezi gândirea scriind două propoziții brute: problema și succesul.",
    traitPrimary: "clarity",
    traitSecondary: "focus",
    canonDomain: "decisionalClarity",
    context: {
      eyebrow: "Context",
      title: "Scrisul testează claritatea",
      description:
        "Dacă nu poți scrie clar, nu gândești clar. Blocajul nu e vocabularul, ci lipsa structurii ideii.",
      question: "Cât de des te blochezi când trebuie să pui în scris un plan?",
      options: ["Rar", "Din când în când", "Foarte des"],
    },
    exercise: {
      title: "L3 · Brut writing x2",
      steps: [
        "Alege tema care te blochează și scrie o propoziție (max 20 cuvinte) „Problema este…”.",
        "Scrie o a doua propoziție „Succes = …” (max 15 cuvinte).",
        "Citește-le cu voce joasă; rescrie până când fiecare conține acțiune + timp.",
      ],
      durationHint: "~4 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "La ce task aplici astăzi regula «Problema este… / Succes = …»?",
      placeholder: "Ex.: înainte de emailul pentru board scriu cele două propoziții brute.",
      mapping: "Lucrezi pe Claritate decizională și întărești Focusul.",
    },
  },
  clarity_05_decisions_without_data: {
    moduleKey: "clarity_05_decisions_without_data",
    title: "Decizii fără date perfecte",
    summary: "Definești decizia minimă reversibilă și feedback-ul care îți aduce claritate reală.",
    traitPrimary: "clarity",
    traitSecondary: "adaptiveConfidence",
    canonDomain: "decisionalClarity",
    context: {
      eyebrow: "Context",
      title: "Așteptarea costă",
      description:
        "Datele perfecte nu apar. Așteptarea unei certitudini totale devine o decizie scumpă prin inacțiune.",
      question: "Ce faci când nu ai toate datele pentru o decizie?",
      options: ["Amân până aflu tot", "Testez o variantă mică", "Caut confirmare la alții"],
    },
    exercise: {
      title: "L3 · Decizia minimă reversibilă",
      steps: [
        "Completează rapid: „Dacă nu decid acum, cel mai probabil ____ va costa ____.”",
        "Definește decizia minimă pe care o iei azi și ce feedback primești în 48h.",
        "Notează cum revii dacă ipoteza e greșită.",
      ],
      durationHint: "~4 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Ce decizie minimă reversibilă iei azi și ce indicator vei urmări în 48h?",
      placeholder: "Ex.: decid să lansez beta limitat și mă uit la 10 răspunsuri clienți în două zile.",
      mapping: "Lucrezi pe Claritate decizională și Adaptive Confidence.",
    },
  },
  focus_energy_01_energy_not_motivation: {
    moduleKey: "focus_energy_01_energy_not_motivation",
    title: "Energia ≠ motivație",
    summary: "Înveți să-ți separi energia de motivație și să folosești micro-reseturi de corp.",
    traitPrimary: "energy",
    traitSecondary: "flexibility",
    canonDomain: "functionalEnergy",
    context: {
      eyebrow: "Context",
      title: "De ce scade energia?",
      description:
        "Motivația nu pornește fără energie minimă. Dacă ignori corpul, creierul apasă frâna.",
      question: "Ce faci de obicei când simți că energia scade?",
      options: ["Forțez și continui", "Caut o distragere", "Îmi iau un micro-reset"],
    },
    exercise: {
      title: "L3 · Reset corp + minte",
      steps: [
        "Ridică-te în picioare și inspiră pe nas 4 secunde, expiră pe gură 6 secunde (3 repetări).",
        "Scutură ușor umerii și coapsele 10 secunde.",
        "Notează un singur semnal real de oboseală pe care îl vei monitoriza azi.",
      ],
      durationHint: "~2 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Ce micro-reset aplici azi și la ce oră?",
      placeholder: "Ex.: la 16:30 fac resetul respirație + scuturare înainte de call.",
      mapping: "Lucrezi pe Energie funcțională și susții Flexibilitatea mentală.",
    },
  },
  focus_energy_02_cognitive_fragmentation_cost: {
    moduleKey: "focus_energy_02_cognitive_fragmentation_cost",
    title: "Costul fragmentării cognitive",
    summary: "Calculezi taxa de comutare și creezi blocuri protejate care păstrează energia mentală.",
    traitPrimary: "energy",
    traitSecondary: "focus",
    canonDomain: "functionalEnergy",
    context: {
      eyebrow: "Context",
      title: "Săritul între task-uri",
      description:
        "Fiecare comutare aparent mică consumă 5–15 minute de focus. Fragmentarea produce oboseală invizibilă.",
      question: "Cum arată ultima oră de lucru pentru tine?",
      options: ["Lucrez cu telefonul lângă", "Îmi fac blocuri scurte", "Opresc notificările complet"],
    },
    exercise: {
      title: "L3 · Audit + bloc protejat",
      steps: [
        "Închide ochii 10 secunde și revede ultima oră; notează câte comutări ai făcut.",
        "Alege un task critic și setează 30 minute fără întreruperi (telefon departe, tab-uri închise).",
        "La final notează nivelul de energie (1–5) și ce ai câștigat.",
      ],
      durationHint: "~4 minute + blocul protejat",
    },
    reflection: {
      title: "Transfer",
      prompt: "Care sunt cele două momente din zi pe care le protejezi fără comutări?",
      placeholder: "Ex.: între 10:00–10:30 scriu raportul cu notificările închise.",
      mapping: "Lucrezi pe Energie funcțională și susții Focusul.",
    },
  },
  focus_energy_03_entering_state_vs_forcing: {
    moduleKey: "focus_energy_03_entering_state_vs_forcing",
    title: "Intră în stare, nu forța",
    summary: "Folosești un ritual de 30 secunde ca să intri în stare și să pornești primele minute fără rezistență.",
    traitPrimary: "energy",
    traitSecondary: "flexibility",
    canonDomain: "functionalEnergy",
    context: {
      eyebrow: "Context",
      title: "Forțare vs stare",
      description:
        "Când forțezi, corpul devine rigid și pierzi energie. În stare, atenția curge și apare tracțiune.",
      question: "Ce faci înainte de un task greu?",
      options: ["Mă arunc direct", "Îmi iau un minut să respir", "Amân până mă simt pregătit"],
    },
    exercise: {
      title: "L3 · Ritual 30s",
      steps: [
        "Fă o pauză scurtă și respiră 4-6 de trei ori.",
        "Întreabă-te: „Care este primul pas clar de 2 minute?” și scrie-l într-o propoziție.",
        "Pornește cronometrul și execută acel pas, observând cum energia rămâne stabilă.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Pentru ce bloc critic folosești azi ritualul de intrare în stare?",
      placeholder: "Ex.: înainte de prezentarea de la 15:00 fac ritualul 30s + primul pas.",
      mapping: "Lucrezi pe Energie funcțională și Flexibilitatea mentală.",
    },
  },
  focus_energy_04_real_signals_of_exhaustion: {
    moduleKey: "focus_energy_04_real_signals_of_exhaustion",
    title: "Semnale reale de epuizare",
    summary: "Recunoști semnalele timpurii (irritabilitate, rigiditate) și aplici micro-resetul înainte de burnout.",
    traitPrimary: "energy",
    traitSecondary: "emotionalStability",
    canonDomain: "functionalEnergy",
    context: {
      eyebrow: "Context",
      title: "Burnout-ul începe subtil",
      description:
        "Epuizarea nu arată ca lipsa de chef, ci ca decizii proaste, sarcasm și corp rigid. Dacă le ignori intri în overdrive.",
      question: "Ce faci când observi primele semne de iritabilitate?",
      options: ["Continui ca și cum nimic nu e", "Încetinesc 2–3 minute", "Amân tot blocul"],
    },
    exercise: {
      title: "L3 · Scanare + reset",
      steps: [
        "Scanează corpul (maxilar, umeri, respirație) și notează dacă simți rigiditate.",
        "Dacă răspunsul e DA: ia 3 minute, mergi sau întinde-te, fă 5 respirații 4-6 și relaxează maxilarul.",
        "Loghează „Semnal? (Da/Nu) — Acțiune făcută” pentru două momente din zi.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Ce semnal concret monitorizezi azi ca să previi overdrive-ul?",
      placeholder: "Ex.: când simt sarcasm în voce, iau pauza 4-6 + mers 3 minute.",
      mapping: "Lucrezi pe Energie funcțională și Reglarea emoțională.",
    },
  },
  focus_energy_05_minimum_energy_rule: {
    moduleKey: "focus_energy_05_minimum_energy_rule",
    title: "Regula energiei minime",
    summary: "Creezi o versiune minimă a activităților-cheie astfel încât continuitatea să supraviețuiască zilelor slabe.",
    traitPrimary: "energy",
    traitSecondary: "focus",
    canonDomain: "functionalEnergy",
    context: {
      eyebrow: "Context",
      title: "Zilele slabe",
      description:
        "Ceri standardul perfect și renunți când nu-l atingi. Cerințele mici mențin identitatea și sistemul în viață.",
      question: "Cum reacționezi într-o zi cu energie mică?",
      options: ["Renunț complet", "Forțez același nivel", "Caut o versiune minimă"],
    },
    exercise: {
      title: "L3 · Minimul azi",
      steps: [
        "Alege activitatea-cheie (scris, antrenament, revizuire).",
        "Întreabă: „Care este cea mai mică versiune acceptabilă?” și scrie propoziția „Minimul azi = ____”.",
        "Pornește un timer de 3–5 minute și execută doar acel minim, observând cum scade rezistența.",
      ],
      durationHint: "~4 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Pentru ce două activități aplici regula energiei minime în următoarele trei zile?",
      placeholder: "Ex.: minimul pentru scris = 5 minute / minimul pentru sport = 10 genuflexiuni.",
      mapping: "Lucrezi pe Energie funcțională și Focus.",
    },
  },
  emotional_flex_01_automatic_reaction_amygdala: {
    moduleKey: "emotional_flex_01_automatic_reaction_amygdala",
    title: "Reacția automată",
    summary: "Identifici primul semnal de activare și inserezi o micro-pauză înainte de răspuns.",
    traitPrimary: "emotionalStability",
    traitSecondary: "recalibration",
    canonDomain: "emotionalRegulation",
    context: {
      eyebrow: "Context",
      title: "Ce face amigdala",
      description: "Amigdala răspunde în 200 ms. Dacă nu inserezi o pauză, răspunzi după reflex, nu după valori.",
      question: "Cât de des îți dai seama că ai răspuns prea repede?",
      options: ["Rar", "Uneori", "Des"],
    },
    exercise: {
      title: "L3 · Pauză de 5 respirații",
      steps: [
        "Adu-ți aminte ultima discuție tensionată.",
        "Simulează scena și fă 5 respirații lente înainte să răspunzi.",
        "Notează ce s-ar fi schimbat dacă răspunsul venea după pauză.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce context real vei folosi pauza de 5 respirații azi?",
      placeholder: "Ex.: înainte de ședința 1:1, respir 5 ori înainte de a răspunde.",
      mapping: "Lucrezi pe Reglare emoțională și susții Recalibrarea.",
    },
  },
  emotional_flex_02_facts_vs_interpretations: {
    moduleKey: "emotional_flex_02_facts_vs_interpretations",
    title: "Fapte vs. interpretări",
    summary: "Separi informația filmabilă de povestea din cap și reduci intensitatea emoției.",
    traitPrimary: "emotionalStability",
    traitSecondary: "clarity",
    canonDomain: "emotionalRegulation",
    context: {
      eyebrow: "Context",
      title: "Povestea doare mai mult",
      description:
        "Mesajul în sine nu aprinde emoția, ci sensul pe care îl atașezi. Fără separare reacționezi la ipoteze.",
      question: "Ce faci când primești un mesaj ambiguu?",
      options: ["Completez cu o poveste", "Aștept clarificări", "Întreb ce e de fapt"],
    },
    exercise: {
      title: "L3 · Fapt / Interpretare",
      steps: [
        "Alege o situație recentă tensionată și scrie două coloane: FAPT / INTERPRETARE.",
        "Completează o propoziție pentru fiecare coloană.",
        "Transformă interpretarea în întrebări („Este sigur? Există altă explicație?”).",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce context real vei scrie azi «Fapt = … / Interpretare = …» înainte să răspunzi?",
      placeholder: "Ex.: înainte de call-ul cu partenerul notez faptul și interpretarea mea.",
      mapping: "Lucrezi pe Reglare emoțională și Claritate.",
    },
  },
  emotional_flex_03_discomfort_tolerance: {
    moduleKey: "emotional_flex_03_discomfort_tolerance",
    title: "Toleranța la disconfort",
    summary: "Crești capacitatea de a sta cu disconfortul prin expunere controlată de 30–60 secunde.",
    traitPrimary: "emotionalStability",
    traitSecondary: "flexibility",
    canonDomain: "emotionalRegulation",
    context: {
      eyebrow: "Context",
      title: "Disconfortul e temporar",
      description:
        "Evitarea unui disconfort mic îl face permanent. Expunerea ghidată scade intensitatea și îți păstrează identitatea.",
      question: "Cum reacționezi la următorul trigger emoțional?",
      options: ["Fug imediat", "Negociez cu mine", "Rămân câteva secunde"],
    },
    exercise: {
      title: "L3 · Expunere ghidată",
      steps: [
        "Identifică un disconfort mic (mesaj, conversație, task).",
        "Setează 30 secunde, respiră constant și observă corpul fără soluții.",
        "Repetă mental „Pot rămâne 30 secunde cu asta.”",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "Ce trigger real tratezi azi cu exercițiul de expunere controlată?",
      placeholder: "Ex.: înainte să dau feedback dificil stau 30 secunde cu disconfortul.",
      mapping: "Lucrezi pe Reglare emoțională și Flexibilitate.",
    },
  },
  emotional_flex_04_fast_emotional_reset: {
    moduleKey: "emotional_flex_04_fast_emotional_reset",
    title: "Reset emoțional rapid",
    summary: "Reglezi starea prin protocolul 4-6 + release înainte să analizezi situația.",
    traitPrimary: "emotionalStability",
    traitSecondary: "recalibration",
    canonDomain: "emotionalRegulation",
    context: {
      eyebrow: "Context",
      title: "Corpul schimbă starea",
      description:
        "Nu ieși dintr-o emoție doar gândind-o la rece. Sistemul nervos se calmează prin respirație, postură și mișcare.",
      question: "Ce faci când emoția te copleșește?",
      options: ["Analizez și rămân blocat", "Respir scurt și continui", "Rulez un protocol fizic complet"],
    },
    exercise: {
      title: "L3 · Protocol 4-6 + release",
      steps: [
        "Inspiră pe nas 4 secunde, expiră pe gură 6 secunde (5 repetări).",
        "Ridică-te și scutură umerii/coapsele 10 secunde.",
        "Pune palma pe piept și observă pulsul 10 secunde înainte să răspunzi.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "În ce moment al zilei vei folosi protocolul complet înainte să reacționezi?",
      placeholder: "Ex.: înainte de call-ul tensionat rulez 4-6 + release complet.",
      mapping: "Lucrezi pe Reglare emoțională și Recalibrare.",
    },
  },
  emotional_flex_05_choice_of_response: {
    moduleKey: "emotional_flex_05_choice_of_response",
    title: "Alegerea reacției",
    summary: "Creezi spațiu între stimul și răspuns cu secvența Pauză – Respir – Aleg.",
    traitPrimary: "emotionalStability",
    traitSecondary: "flexibility",
    canonDomain: "emotionalRegulation",
    context: {
      eyebrow: "Context",
      title: "Spațiul dintre",
      description:
        "Între stimul și reacție există un spațiu mic. Dacă îl antrenezi, reacția automată devine răspuns deliberat.",
      question: "Cum răspunzi la următorul mesaj acid?",
      options: ["Dau replica imediat", "Respir dar răspund impulsiv", "Număr și aleg răspunsul"],
    },
    exercise: {
      title: "L3 · Pauză – Respir – Aleg",
      steps: [
        "Adu-ți aminte un trigger recent și repetă mental secvența „Pauză – Respir – Aleg”.",
        "La următorul impuls numără 1-2-3, fă o respirație adâncă și abia apoi răspunde.",
        "După două interacțiuni notează „Am ales / Am reacționat” pentru fiecare.",
      ],
      durationHint: "~3 minute",
    },
    reflection: {
      title: "Transfer",
      prompt: "La ce interacțiune din următoarele 24h vei aplica secvența Pauză – Respir – Aleg?",
      placeholder: "Ex.: înainte de ședința 1:1 număr 1-2-3 și respir înainte de răspuns.",
      mapping: "Lucrezi pe Reglare emoțională și Flexibilitate.",
    },
  },
};

export function getWowLessonDefinition(moduleKey: string | null | undefined): WowLessonDefinition | null {
  if (!moduleKey) return null;
  return WOW_LESSONS_V2[moduleKey] ?? null;
}

export function getWowLessonTraitPrimary(moduleKey: string | null | undefined): CatAxisId | null {
  return getWowLessonDefinition(moduleKey)?.traitPrimary ?? null;
}

export function resolveTraitPrimaryForModule(
  moduleKey: string | null | undefined,
  fallback?: CatAxisId | null,
): CatAxisId | null {
  const trait = getWowLessonTraitPrimary(moduleKey);
  if (trait) {
    return trait;
  }
  if (fallback) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[wow-lessons] Missing traitPrimary for module ${moduleKey ?? "unknown"}; falling back to plan trait ${fallback}.`);
    }
    return fallback;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[wow-lessons] Missing traitPrimary mapping for module ${moduleKey ?? "unknown"}; XP not awarded.`);
  }
  return null;
}
