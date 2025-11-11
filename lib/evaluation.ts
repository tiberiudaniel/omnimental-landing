export type TimeHorizon = "days" | "weeks" | "months";
export type BudgetLevel = "low" | "medium" | "high";
export type GoalType = "single" | "few" | "broad";
export type EmotionalState = "stable" | "fluctuating" | "unstable";
export type FormatPreference = "individual" | "group" | "unsure";
export type ResolutionSpeed = TimeHorizon;
export type BudgetPreference = BudgetLevel;

export interface EvaluationAnswers {
  urgency: number;
  timeHorizon: TimeHorizon;
  determination: number;
  hoursPerWeek: number;
  budgetLevel: BudgetLevel;
  goalType: GoalType;
  emotionalState: EmotionalState;
  groupComfort: number;
  learnFromOthers: number;
  scheduleFit: number;
  formatPreference: FormatPreference;
  cloudFocusCount: number;
}

export type EvaluationSectionKey = "pss" | "gse" | "maas" | "panas" | "svs";

export type EvaluationSection = {
  key: EvaluationSectionKey;
  title: string;
  description: string;
  scaleLabels: string[];
  items: Array<{
    id: string;
    prompt: string;
    min: number;
    max: number;
    reverse?: boolean;
    subScale?: "positive" | "negative";
  }>;
};

export const evaluationSections: readonly EvaluationSection[] = [
  {
    key: "pss",
    title: "PSS – Stres perceput",
    description: "În ce măsură simți că situațiile de zi cu zi sunt dificile de controlat.",
    scaleLabels: ["Niciodată", "Rareori", "Uneori", "Destul de des", "Foarte des"],
    items: [
      { id: "pss_01", prompt: "Cât de des te-ai simțit deranjat de ceva neașteptat?", min: 0, max: 4 },
      { id: "pss_02", prompt: "Cât de des ai simțit că nu poți controla lucrurile importante din viață?", min: 0, max: 4 },
      { id: "pss_03", prompt: "Cât de des te-ai simțit nervos sau stresat?", min: 0, max: 4 },
      { id: "pss_04", prompt: "Cât de des te-ai simțit încrezător că îți rezolvi problemele personale?", min: 0, max: 4, reverse: true },
      { id: "pss_05", prompt: "Cât de des ai simțit că lucrurile merg în direcția potrivită?", min: 0, max: 4, reverse: true },
      { id: "pss_06", prompt: "Cât de des ai simțit că nu faci față tuturor lucrurilor pe care trebuie să le faci?", min: 0, max: 4 },
      { id: "pss_07", prompt: "Cât de des ai reușit să controlezi iritările din viață?", min: 0, max: 4, reverse: true },
      { id: "pss_08", prompt: "Cât de des ai simțit că deții controlul asupra situațiilor?", min: 0, max: 4, reverse: true },
      { id: "pss_09", prompt: "Cât de des ai fost supărat pentru lucruri pe care nu le poți controla?", min: 0, max: 4 },
      { id: "pss_10", prompt: "Cât de des ai simțit că problemele se tot adună?", min: 0, max: 4 },
    ],
  },
  {
    key: "gse",
    title: "GSE – Autoeficacitate",
    description: "Încrederea ta că poți gestiona provocările și obstacolele.",
    scaleLabels: ["Nu este adevărat", "Mai degrabă nu", "Mai degrabă da", "Exact așa este"],
    items: [
      { id: "gse_01", prompt: "Întotdeauna găsesc o cale să rezolv problemele dificile.", min: 1, max: 4 },
      { id: "gse_02", prompt: "Dacă cineva îmi blochează drumul, găsesc alternative.", min: 1, max: 4 },
      { id: "gse_03", prompt: "Pot obține ceea ce îmi propun dacă persist.", min: 1, max: 4 },
      { id: "gse_04", prompt: "Pot rezolva probleme neprevăzute.", min: 1, max: 4 },
      { id: "gse_05", prompt: "Mă pot baza pe calitățile mele chiar și în criză.", min: 1, max: 4 },
      { id: "gse_06", prompt: "Rămân calm când întâmpin dificultăți.", min: 1, max: 4 },
      { id: "gse_07", prompt: "Fac față eficient la orice.", min: 1, max: 4 },
      { id: "gse_08", prompt: "Când mă confrunt cu o problemă, o abordez cu idei multiple.", min: 1, max: 4 },
      { id: "gse_09", prompt: "Știu cum să gestionez situațiile neașteptate.", min: 1, max: 4 },
      { id: "gse_10", prompt: "Pot rezolva orice dacă mă implic.", min: 1, max: 4 },
    ],
  },
  {
    key: "maas",
    title: "MAAS – Prezență conștientă",
    description: "Cum observi momentele vieții fără să decuplezi pilotul automat.",
    scaleLabels: [
      "Aproape niciodată",
      "Rareori",
      "Uneori",
      "Destul de des",
      "Foarte des",
      "Aproape mereu",
    ],
    items: [
      { id: "maas_01", prompt: "Funcționez pe pilot automat fără să fiu atent la ce fac.", min: 1, max: 6, reverse: true },
      { id: "maas_02", prompt: "Mă surprind pierdut în gânduri în loc să fiu prezent.", min: 1, max: 6, reverse: true },
      { id: "maas_03", prompt: "Fac lucruri fără să observ că le fac.", min: 1, max: 6, reverse: true },
      { id: "maas_04", prompt: "Mă implic într-o activitate dar mintea îmi este în altă parte.", min: 1, max: 6, reverse: true },
      { id: "maas_05", prompt: "Nu observ senzațiile fizice până când sunt intense.", min: 1, max: 6, reverse: true },
      { id: "maas_06", prompt: "Fac lucruri în grabă fără să acord atenție pașilor.", min: 1, max: 6, reverse: true },
    ],
  },
  {
    key: "panas",
    title: "PANAS – Afect pozitiv și negativ",
    description: "Ce emoții ai simțit în ultima perioadă.",
    scaleLabels: ["Deloc", "Puțin", "Moderate", "Mult", "Foarte mult"],
    items: [
      { id: "panas_p1", prompt: "Entuziasmat(ă)", min: 1, max: 5, subScale: "positive" },
      { id: "panas_p2", prompt: "Determinată", min: 1, max: 5, subScale: "positive" },
      { id: "panas_p3", prompt: "Inspirat(ă)", min: 1, max: 5, subScale: "positive" },
      { id: "panas_p4", prompt: "Energetic(ă)", min: 1, max: 5, subScale: "positive" },
      { id: "panas_p5", prompt: "Plin(ă) de bucurie", min: 1, max: 5, subScale: "positive" },
      { id: "panas_n1", prompt: "Agitat(ă)", min: 1, max: 5, subScale: "negative" },
      { id: "panas_n2", prompt: "Tensionat(ă)", min: 1, max: 5, subScale: "negative" },
      { id: "panas_n3", prompt: "Iritat(ă)", min: 1, max: 5, subScale: "negative" },
      { id: "panas_n4", prompt: "Îngrijorat(ă)", min: 1, max: 5, subScale: "negative" },
      { id: "panas_n5", prompt: "Abătut(ă)", min: 1, max: 5, subScale: "negative" },
    ],
  },
  {
    key: "svs",
    title: "SVS – Vitalitate subiectivă",
    description: "Câtă energie interioară simți că ai în acest moment.",
    scaleLabels: [
      "Deloc adevărat",
      "Foarte puțin",
      "Puțin",
      "Neutru",
      "Destul de mult",
      "Foarte mult",
      "Complet adevărat",
    ],
    items: [
      { id: "svs_01", prompt: "Mă simt plin(ă) de viață.", min: 1, max: 7 },
      { id: "svs_02", prompt: "Simt că am energie.", min: 1, max: 7 },
      { id: "svs_03", prompt: "Sunt entuziast(ă) în ceea ce fac.", min: 1, max: 7 },
      { id: "svs_04", prompt: "Mă simt alert(ă) și prezent(ă).", min: 1, max: 7 },
      { id: "svs_05", prompt: "Mă simt puternic(ă) și energic(ă).", min: 1, max: 7 },
      { id: "svs_06", prompt: "Corpul meu se simte plin de viață.", min: 1, max: 7 },
      { id: "svs_07", prompt: "Am o vitalitate autentică.", min: 1, max: 7 },
    ],
  },
] as const;

type EvaluationSections = typeof evaluationSections;
type EvaluationItemId = EvaluationSections[number]["items"][number]["id"];

export type EvaluationFormValues = Record<EvaluationItemId, number | "">;

export const initialEvaluationValues = evaluationSections.reduce(
  (acc, section) => {
    section.items.forEach((item) => {
      acc[item.id as EvaluationItemId] = "";
    });
    return acc;
  },
  {} as EvaluationFormValues,
);

const reverseValue = (value: number, min: number, max: number) => max + min - value;

const getNumericValue = (answers: EvaluationFormValues, id: EvaluationItemId) => {
  const value = answers[id];
  return typeof value === "number" ? value : 0;
};

export function computeScores(answers: EvaluationFormValues) {
  const getSum = (sectionKey: EvaluationSectionKey) => {
    const section = evaluationSections.find((entry) => entry.key === sectionKey);
    if (!section) return 0;
    return section.items.reduce((total, item) => {
      const value = getNumericValue(answers, item.id as EvaluationItemId);
      const scored = item.reverse ? reverseValue(value, item.min, item.max) : value;
      return total + scored;
    }, 0);
  };

  const pssTotal = getSum("pss");
  const gseTotal = getSum("gse");

  const maasSection = evaluationSections.find((entry) => entry.key === "maas");
  const maasValues =
    maasSection?.items.map((item) => {
      const value = getNumericValue(answers, item.id as EvaluationItemId);
      const scored = item.reverse ? reverseValue(value, item.min, item.max) : value;
      return scored;
    }) ?? [];
  const maasTotal =
    maasValues.length > 0
      ? Number((maasValues.reduce((sum, value) => sum + value, 0) / maasValues.length).toFixed(2))
      : 0;

  const panasSection = evaluationSections.find((entry) => entry.key === "panas");
  const panasPositive =
    panasSection?.items
      .filter((item) => item.subScale === "positive")
      .reduce((total, item) => total + getNumericValue(answers, item.id as EvaluationItemId), 0) ?? 0;
  const panasNegative =
    panasSection?.items
      .filter((item) => item.subScale === "negative")
      .reduce((total, item) => total + getNumericValue(answers, item.id as EvaluationItemId), 0) ?? 0;

  const svsSection = evaluationSections.find((entry) => entry.key === "svs");
  const svsValues =
    svsSection?.items.map((item) => getNumericValue(answers, item.id as EvaluationItemId)) ?? [];
  const svs =
    svsValues.length > 0
      ? Number((svsValues.reduce((sum, value) => sum + value, 0) / svsValues.length).toFixed(2))
      : 0;

  return {
    pssTotal,
    gseTotal,
    maasTotal,
    panasPositive,
    panasNegative,
    svs,
  };
}
