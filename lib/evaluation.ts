export type LikertScale = {
  id: string;
  prompt: string;
  min: number;
  max: number;
  reverse?: boolean;
};

export type EvaluationSection = {
  key: "pss" | "gse" | "maas" | "panas" | "svs";
  title: string;
  description: string;
  items: LikertScale[];
  scaleLabels: string[];
};

export const evaluationSections: EvaluationSection[] = [
  {
    key: "pss",
    title: "PSS-10 – Perceived Stress Scale",
    description:
      "Răspunsuri: 1 = Niciodată · 5 = Foarte des (itemii marcați sunt inversați la scorare)",
    scaleLabels: ["Niciodată", "Rareori", "Uneori", "Destul de des", "Foarte des"],
    items: [
      { id: "pss1", prompt: "În ultima lună, cât de des te-ai supărat din cauza unor lucruri care s-au întâmplat pe neașteptate?", min: 1, max: 5 },
      { id: "pss2", prompt: "În ultima lună, cât de des te-ai simțit incapabil să controlezi lucruri importante din viața ta?", min: 1, max: 5 },
      { id: "pss3", prompt: "În ultima lună, cât de des te-ai simțit nervos sau stresat?", min: 1, max: 5 },
      { id: "pss4", prompt: "În ultima lună, cât de des ai simțit că reușești să faci față lucrurilor iritante din viața ta?", min: 1, max: 5, reverse: true },
      { id: "pss5", prompt: "În ultima lună, cât de des ai simțit că te descurci bine cu schimbările importante care apar?", min: 1, max: 5, reverse: true },
      { id: "pss6", prompt: "În ultima lună, cât de des ai simțit că ai control asupra lucrurilor din viața ta?", min: 1, max: 5, reverse: true },
      { id: "pss7", prompt: "În ultima lună, cât de des ai fost încrezător în capacitatea ta de a rezolva probleme personale?", min: 1, max: 5, reverse: true },
      { id: "pss8", prompt: "În ultima lună, cât de des ai simțit că lucrurile scapă de sub control?", min: 1, max: 5 },
      { id: "pss9", prompt: "În ultima lună, cât de des te-ai simțit copleșit de tot ceea ce aveai de făcut?", min: 1, max: 5 },
      { id: "pss10", prompt: "În ultima lună, cât de des ai simțit că dificultățile tale se acumulează atât de mult încât nu le mai poți depăși?", min: 1, max: 5 },
    ],
  },
  {
    key: "gse",
    title: "GSE – General Self-Efficacy Scale",
    description: "Răspunsuri: 1 = Deloc adevărat · 4 = Exact adevărat",
    scaleLabels: ["Deloc", "Mai degrabă", "În mare parte", "Exact"],
    items: [
      { id: "gse1", prompt: "Dacă cineva se opune, pot găsi modalități de a obține ceea ce vreau.", min: 1, max: 4 },
      { id: "gse2", prompt: "Chiar dacă întâmpin dificultăți, rămân perseverent până când reușesc.", min: 1, max: 4 },
      { id: "gse3", prompt: "Îmi este ușor să îmi ating obiectivele.", min: 1, max: 4 },
      { id: "gse4", prompt: "Am încredere că mă pot descurca eficient în situații neașteptate.", min: 1, max: 4 },
      { id: "gse5", prompt: "Datorită resurselor mele, pot face față surprizelor.", min: 1, max: 4 },
      { id: "gse6", prompt: "Chiar dacă sunt probleme, le pot rezolva.", min: 1, max: 4 },
      { id: "gse7", prompt: "Dacă trebuie, știu cum să gestionez situațiile dificile.", min: 1, max: 4 },
      { id: "gse8", prompt: "În general, găsesc soluții la orice problemă.", min: 1, max: 4 },
      { id: "gse9", prompt: "Pot rezolva majoritatea provocărilor dacă depun efortul necesar.", min: 1, max: 4 },
      { id: "gse10", prompt: "Dacă am o problemă, de obicei găsesc mai multe moduri de a o rezolva.", min: 1, max: 4 },
    ],
  },
  {
    key: "maas",
    title: "MAAS – Mindful Attention Awareness Scale",
    description:
      "Răspunsuri: 1 = Aproape mereu · 6 = Aproape niciodată (itemii de mai jos, cu excepția celui pozitiv, se inversează)",
    scaleLabels: ["Aproape mereu", "Foarte des", "Destul de des", "Uneori", "Rar", "Aproape niciodată"],
    items: [
      { id: "maas1", prompt: "Mă trezesc făcând lucruri fără să fiu pe deplin conștient de ele.", min: 1, max: 6, reverse: true },
      { id: "maas2", prompt: "Am tendința de a fi distras sau grăbit fără să fiu atent la prezent.", min: 1, max: 6, reverse: true },
      { id: "maas3", prompt: "Fac lucruri automat, fără să îmi dau seama ce fac.", min: 1, max: 6, reverse: true },
      { id: "maas4", prompt: "Mă concentrez pe ceea ce fac în momentul prezent.", min: 1, max: 6 },
      { id: "maas5", prompt: "Mă prind că ascult pe cineva fără să fiu atent la ce spune.", min: 1, max: 6, reverse: true },
      { id: "maas6", prompt: "Am tendința să nu observ senzațiile fizice atunci când sunt ocupat cu alte lucruri.", min: 1, max: 6, reverse: true },
    ],
  },
  {
    key: "panas",
    title: "PANAS – Positive and Negative Affect Schedule",
    description: "Răspunsuri: 1 = Deloc · 5 = Extrem (ultima săptămână)",
    scaleLabels: ["Deloc", "Puțin", "Moderat", "Mult", "Extrem"],
    items: [
      { id: "panas1", prompt: "Entuziast", min: 1, max: 5 },
      { id: "panas2", prompt: "Hotărât", min: 1, max: 5 },
      { id: "panas3", prompt: "Activ", min: 1, max: 5 },
      { id: "panas4", prompt: "Inspirat", min: 1, max: 5 },
      { id: "panas5", prompt: "Atent", min: 1, max: 5 },
      { id: "panas6", prompt: "Neliniștit", min: 1, max: 5 },
      { id: "panas7", prompt: "Nervos", min: 1, max: 5 },
      { id: "panas8", prompt: "Abătut", min: 1, max: 5 },
      { id: "panas9", prompt: "Iritat", min: 1, max: 5 },
      { id: "panas10", prompt: "Îngrijorat", min: 1, max: 5 },
    ],
  },
  {
    key: "svs",
    title: "SVS – Subjective Vitality Scale",
    description: "Răspunsuri: 1 = Deloc adevărat · 7 = Complet adevărat",
    scaleLabels: ["1", "2", "3", "4", "5", "6", "7"],
    items: [
      {
        id: "svs1",
        prompt: "În general, mă simt plin de energie și vitalitate.",
        min: 1,
        max: 7,
      },
    ],
  },
];

export type EvaluationFormValues = Record<string, number | "">;

export const initialEvaluationValues: EvaluationFormValues = evaluationSections.reduce(
  (acc, section) => {
    section.items.forEach((item) => {
      acc[item.id] = "";
    });
    return acc;
  },
  {} as EvaluationFormValues
);

export type EvaluationScores = {
  pssTotal: number;
  gseTotal: number;
  maasTotal: number;
  panasPositive: number;
  panasNegative: number;
  svs: number;
};

export function computeScores(values: EvaluationFormValues): EvaluationScores {
  const getValue = (id: string) => Number(values[id] ?? 0);

  const pssReverseIds = ["pss4", "pss5", "pss6", "pss7"];
  const pssTotal = evaluationSections
    .find((s) => s.key === "pss")!
    .items.reduce((sum, item) => {
      const raw = getValue(item.id);
      if (!raw) return sum;
      return sum + (pssReverseIds.includes(item.id) ? 6 - raw : raw);
    }, 0);

  const gseTotal = evaluationSections
    .find((s) => s.key === "gse")!
    .items.reduce((sum, item) => sum + getValue(item.id), 0);

  const maasReverse = ["maas1", "maas2", "maas3", "maas5", "maas6"];
  const maasSum = evaluationSections
    .find((s) => s.key === "maas")!
    .items.reduce((sum, item) => {
      const raw = getValue(item.id);
      if (!raw) return sum;
      if (maasReverse.includes(item.id)) {
        return sum + (7 - raw);
      }
      return sum + raw;
    }, 0);
  const maasTotal = maasSum / evaluationSections.find((s) => s.key === "maas")!.items.length;

  const panasItems = evaluationSections.find((s) => s.key === "panas")!.items;
  const panasPositive = panasItems
    .slice(0, 5)
    .reduce((sum, item) => sum + getValue(item.id), 0);
  const panasNegative = panasItems
    .slice(5)
    .reduce((sum, item) => sum + getValue(item.id), 0);

  const svs = getValue("svs1");

  return { pssTotal, gseTotal, maasTotal: Number(maasTotal.toFixed(2)), panasPositive, panasNegative, svs };
}
