export type PillarId = "intel" | "flex" | "kuno" | "abil" | "scop";

export interface PillarConfig {
  id: PillarId;
  title: string;
  subtitle: string;
  description: string;
  catLinks: string;
  index: number;
}

export const PILLARS: PillarConfig[] = [
  {
    id: "intel",
    index: 1,
    title: "Intel",
    subtitle: "Modul în care gândești",
    description:
      "Intel este felul în care îți clarifici problemele, filtrezi zgomotul și îți ordonezi gândirea. Când Intel este puternic, vezi mai repede esențialul și iei decizii mai curate.",
    catLinks: "Conectat în special cu: Claritate cognitivă și, parțial, cu Flexibilitate mentală.",
  },
  {
    id: "flex",
    index: 2,
    title: "Flex",
    subtitle: "Modul în care te adaptezi",
    description:
      "Flex este felul în care răspunzi când lucrurile nu merg conform planului: tensiune, conflict, surprize. Când Flex este puternic, poți să schimbi strategie fără să te prăbușești emoțional.",
    catLinks: "Conectat în special cu: Flexibilitate mentală, Stabilitate emoțională și Recalibrare după greșeli.",
  },
  {
    id: "kuno",
    index: 3,
    title: "Kuno",
    subtitle: "Modul în care înveți",
    description:
      "Kuno este felul în care înveți, integrezi și conectezi informațiile. Nu e doar ce știi, ci cum transformi ce știi în modele mentale utile.",
    catLinks: "Conectat în special cu: Claritate cognitivă, Încredere adaptativă și curiozitate flexibilă.",
  },
  {
    id: "abil",
    index: 4,
    title: "Abil",
    subtitle: "Modul în care execuți",
    description:
      "Abil este felul în care transformi ideile în acțiuni concrete. Când Abil este puternic, ai focus, ritm și capacitatea de a reveni la ceea ce ți-ai propus.",
    catLinks: "Conectat în special cu: Focus & continuitate, Energie și Încredere adaptativă.",
  },
  {
    id: "scop",
    index: 5,
    title: "Scop",
    subtitle: "Direcția în care îți miști mintea",
    description:
      "Scop este felul în care îți orientezi atenția, energia și antrenamentul. Nu este doar „ce vrei”, ci coerența dintre cine ești, ce valorizezi și ce construiești.",
    catLinks: "Conectat în special cu: Claritate, Focus și Încredere adaptativă.",
  },
];
