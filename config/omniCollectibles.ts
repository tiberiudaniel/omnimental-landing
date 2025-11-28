/**
 * Collectible cards that unlock as users advance through OmniKuno lessons.
 * Each collectible is tied to an Arc and unlocks after specific lessons finish.
 */
export type OmniCollectible = {
  id: string;
  arcId: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  imageUrl?: string;
  unlockAfterLessonIds: string[];
};

export const OMNI_COLLECTIBLES: OmniCollectible[] = [
  {
    id: "protocol-respiratie-4-4-6",
    arcId: "claritate-energie",
    title: "Protocol Respirație 4-4-6",
    shortDescription: "Reset rapid de calm și energie în 2 minute.",
    longDescription:
      "Respirația ritmată 4-4-6 te ajută să reduci pulsațiile mentale după ședințe grele. Inspiri 4 secunde, ții 4 secunde, expiri 6 secunde și repeți ciclul de 10 ori, menținând atenția pe expir.",
    imageUrl: "https://placehold.co/600x360?text=Respiratie+4-4-6",
    unlockAfterLessonIds: ["emotional_balance_l1_03_body_scan", "energy_body_l1_02_breath"],
  },
  {
    id: "regula-3-checkpoints",
    arcId: "claritate-energie",
    title: "Regula celor 3 checkpoint-uri",
    shortDescription: "Trei scanări scurte pe zi pentru claritate emoțională.",
    longDescription:
      "Stabilește trei momente fixe pe zi (dimineață, prânz, seară) în care notezi într-o frază nivelul de claritate și energie. Repetarea creează o ancoră de auto-observare și reduce acumularea tensiunilor.",
    imageUrl: "https://placehold.co/600x360?text=Checkpointuri+Zilnice",
    unlockAfterLessonIds: ["emotional_balance_l1_02_triggers", "emotional_balance_l1_04_micro_choices"],
  },
  {
    id: "jurnal-2-minute",
    arcId: "claritate-energie",
    title: "Jurnalul de 2 minute",
    shortDescription: "Format minimalist pentru a fixa insight-urile serii.",
    longDescription:
      "La finalul zilei completezi trei linii: ce ai observat la tine, o victorie mică și o intenție pentru mâine. Scrisul scurt reduce ruminația și consolidează lecțiile din Arc 1.",
    imageUrl: "https://placehold.co/600x360?text=Jurnal+2+Minute",
    unlockAfterLessonIds: ["emotional_balance_l1_07_evening_reset", "emotional_balance_l1_08_micro_commit"],
  },
  {
    id: "protectie-somn-30min",
    arcId: "claritate-energie",
    title: "Ritual Protecție Somn",
    shortDescription: "30 de minute fără ecrane înainte de somn pentru reset energetic.",
    longDescription:
      "Un buffer de 30 de minute fără ecrane, cu lumină caldă și respirație calmă, pregătește sistemul nervos pentru somn profund. Folosește lista mini-activităților fără ecran pentru a transforma ritualul într-un moment de recompensă.",
    imageUrl: "https://placehold.co/600x360?text=Ritual+Somn",
    unlockAfterLessonIds: ["energy_body_protocol", "energy_body_l1_01_signals"],
  },
  {
    id: "pauza-energie-90sec",
    arcId: "claritate-energie",
    title: "Pauza de energie 90s",
    shortDescription: "Micro-reset combinat: respirație, poziție, intenție.",
    longDescription:
      "În 90 de secunde schimbi postura, respiri 6 cicluri 4-4 și reformulezi intenția pentru următoarea activitate. Protocolul previne căderile de energie între meeting-uri.",
    imageUrl: "https://placehold.co/600x360?text=Pauza+90s",
    unlockAfterLessonIds: ["energy_body_l1_02_breath", "energy_body_l1_01_signals"],
  },
  {
    id: "arc1-body-scan-window",
    arcId: "claritate-energie",
    title: "Fereastra Body Scan",
    shortDescription: "Extinzi body scan-ul în mini-ritual dimineața.",
    longDescription:
      "După lecția 3, transformi body scan-ul într-o „fereastră” de 5 minute în care observi sistematic umeri, diafragmă și maxilar pentru a detecta tensiunile incipiente. Include recomandări de jurnal pentru a nota ce declanșează semnalele.",
    imageUrl: "https://placehold.co/600x360?text=Body+Scan",
    unlockAfterLessonIds: ["emotional_balance_l1_03_body_scan"],
  },
  {
    id: "arc1-story-reset",
    arcId: "claritate-energie",
    title: "Story Reset în 4 cadre",
    shortDescription: "Re-scrii povestea emoțională în 4 pași rapizi.",
    longDescription:
      "După lecția 6, folosești structura în 4 cadre (fapt, emoție, nevoie, alegere) pentru a rescrie narațiunile tensionate. Protocolul include replici concrete și exemple pentru situații de conflict.",
    imageUrl: "https://placehold.co/600x360?text=Story+Reset",
    unlockAfterLessonIds: ["emotional_balance_l1_06_story_line"],
  },
  {
    id: "arc1-intent-commit",
    arcId: "claritate-energie",
    title: "Contractul de 24h",
    shortDescription: "Micro-angajament scris după lecția de micro-commit.",
    longDescription:
      "După lecția 9, semnezi un contract scurt de 24 de ore cu tine: alegi un comportament, definești condiții și stabilești o micro-recompensă. Formatul include template printabil și exemple pentru planuri de focus.",
    imageUrl: "https://placehold.co/600x360?text=Contract+24h",
    unlockAfterLessonIds: ["emotional_balance_l1_08_micro_commit"],
  },
  {
    id: "arc1-energy-loop",
    arcId: "claritate-energie",
    title: "Circuit Energie Matinală",
    shortDescription: "4 exerciții de activare corelate cu lecția de respirație.",
    longDescription:
      "După lecția 12, combini respirația ritmată, întinderi pentru coloană, focalizare vizuală și un micro-plan pentru primele 90 de minute ale zilei. Protocolul este gândit ca un loop de maximum 6 minute.",
    imageUrl: "https://placehold.co/600x360?text=Energy+Loop",
    unlockAfterLessonIds: ["energy_body_l1_02_breath"],
  },
];
