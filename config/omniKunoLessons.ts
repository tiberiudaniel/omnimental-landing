export type OmniKunoLesson = {
  id: string;
  title: string;
  shortDescription: string;
  order: number;
};

export const OMNIKUNO_EMOTIONAL_BALANCE_LESSONS: OmniKunoLesson[] = [
  {
    id: "eb_l1",
    title: "Ce este echilibrul emoțional?",
    shortDescription: "Definim clar ce înseamnă, ce NU înseamnă și exemple concrete.",
    order: 1,
  },
  {
    id: "eb_l2",
    title: "Semnalele din corp",
    shortDescription: "Cum recunoști tensiunea, oboseala și semnalele timpurii.",
    order: 2,
  },
  {
    id: "eb_l3",
    title: "Gânduri care amplifică furtuna",
    shortDescription: "Tipare de gândire care cresc haosul emoțional.",
    order: 3,
  },
  {
    id: "eb_l4",
    title: "Micro-pauze și reglare în 60 de secunde",
    shortDescription: "2–3 micro-tehnici rapide pe care le poți testa imediat.",
    order: 4,
  },
];
