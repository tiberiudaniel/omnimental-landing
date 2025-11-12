"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../components/I18nProvider";
import { useTStrings } from "../../components/useTStrings";
import { useProgressFacts } from "../../components/useProgressFacts";
import { computeDimensionScores, type DimensionScores } from "@/lib/scoring";
import { recommendSession } from "@/lib/recommendation";
import {
  recordMotivationProgressFact,
  recordRecommendationProgressFact,
  recordEvaluationProgressFact,
} from "@/lib/progressFacts";

type ResolutionSpeed = "days" | "weeks" | "months";
type BudgetLevel = "low" | "medium" | "high";
type GoalType = "single" | "few" | "broad";
type EmotionalState = "stable" | "fluctuating" | "unstable";
type FormatPreference = "individual" | "group" | "unsure";

export type EvaluationWizardAnswers = {
  urgency: number; // 1..10
  timeHorizon: ResolutionSpeed;
  determination: number; // 1..5
  hoursPerWeek: number; // 0..8
  budgetLevel: BudgetLevel;
  goalType: GoalType;
  emotionalState: EmotionalState;
  groupComfort: number; // 1..10
  learnFromOthers: number; // 1..10
  scheduleFit: number; // 1..10
  formatPreference: FormatPreference; // declared preference
};

const DEFAULT_ANSWERS: EvaluationWizardAnswers = {
  urgency: 6,
  timeHorizon: "weeks",
  determination: 3,
  hoursPerWeek: 3,
  budgetLevel: "medium",
  goalType: "few",
  emotionalState: "stable",
  groupComfort: 5,
  learnFromOthers: 5,
  scheduleFit: 6,
  formatPreference: "unsure",
};

const LOCAL_KEY = "eval.wizard.lastStep";

export default function EvaluationWizard() {
  const { lang } = useI18n();
  const { s, sa } = useTStrings();
  const { data: progress } = useProgressFacts();
  const [step, setStep] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 3 ? n : 0;
  });
  const [answers, setAnswers] = useState<EvaluationWizardAnswers>(DEFAULT_ANSWERS);
  // Compact objective scales (5 items each for now)
  const [pss, setPss] = useState<number[]>(() => Array(5).fill(3));
  const [gse, setGse] = useState<number[]>(() => Array(5).fill(3));
  const [maas, setMaas] = useState<number[]>(() => Array(5).fill(3));
  const [panasPos, setPanasPos] = useState<number[]>(() => Array(5).fill(3));
  const [panasNeg, setPanasNeg] = useState<number[]>(() => Array(5).fill(3));
  const [svs, setSvs] = useState<number[]>(() => Array(5).fill(3));
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const cloudFocusCount = useMemo(() => {
    const cats = progress?.intent?.categories || [];
    const total = Array.isArray(cats) ? cats.reduce((acc, c) => acc + (c.count || 0), 0) : 0;
    if (total <= 1) return 1;
    if (total <= 3) return 2; // 2–3
    return 4; // 4+
  }, [progress?.intent?.categories]);

  // Debounced incremental save to progress facts (motivation bucket)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSaving(true);
      void recordMotivationProgressFact({
        urgency: answers.urgency,
        timeHorizon: answers.timeHorizon,
        determination: answers.determination,
        hoursPerWeek: answers.hoursPerWeek,
        budgetLevel: answers.budgetLevel,
        goalType: answers.goalType,
        emotionalState: answers.emotionalState,
        groupComfort: answers.groupComfort,
        learnFromOthers: answers.learnFromOthers,
        scheduleFit: answers.scheduleFit,
        formatPreference: answers.formatPreference,
        cloudFocusCount,
      }).finally(() => setSaving(false));
    }, 600);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [answers, cloudFocusCount]);

  const setStepSafe = (n: number) => {
    setStep(n);
    if (typeof window !== "undefined") window.localStorage.setItem(LOCAL_KEY, String(n));
  };

  const categories = useMemo(
    () => (progress?.intent?.categories || []) as Array<{ category: string; count: number }>,
    [progress?.intent?.categories],
  );
  const dimensionScores: DimensionScores = useMemo(
    () => computeDimensionScores(categories, answers.urgency),
    [categories, answers.urgency],
  );

  const doSubmit = useCallback(async () => {
    // Compute recommendation in-context and persist
    const primary = categories[0]?.category;
    const rec = recommendSession({
      urgency: answers.urgency,
      primaryCategory: primary,
      dimensionScores,
      hasProfile: true,
    });
    const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
    const scores = {
      pssTotal: sum(pss),
      gseTotal: sum(gse),
      maasTotal: sum(maas),
      panasPositive: sum(panasPos),
      panasNegative: sum(panasNeg),
      svs: sum(svs),
    } as const;
    await recordEvaluationProgressFact({ scores, stageValue: "t1", lang });
    await recordRecommendationProgressFact({
      suggestedPath: rec.recommendedPath,
      reasonKey: rec.reasonKey,
      dimensionScores,
    });
  }, [answers.urgency, categories, dimensionScores, lang, pss, gse, maas, panasPos, panasNeg, svs]);

  const next = () => setStepSafe(Math.min(3, step + 1));
  const back = () => setStepSafe(Math.max(0, step - 1));

  const header = (
    <header className="mb-4 flex items-center justify-between">
      <div className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
        {s("evalWizardTitle", lang === "ro" ? "Mini‑evaluare" : "Mini evaluation")}
      </div>
      <div className="flex items-center gap-2 text-xs text-[#5C4F45]">
        <div className="flex h-2 w-40 overflow-hidden rounded-full bg-[#F0E6DA]">
          <div className="bg-[#2C2C2C]" style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
        <span>
          {step + 1} / 4
        </span>
      </div>
    </header>
  );

  const nav = (
    <div className="mt-4 flex items-center justify-between">
      <button
        type="button"
        onClick={back}
        disabled={step === 0}
        className="rounded-[10px] border border-[#E4D8CE] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60"
      >
        {lang === "ro" ? "Înapoi" : "Back"}
      </button>
      {step < 3 ? (
        <button
          type="button"
          onClick={next}
          disabled={!isStepValid(step)}
          className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
        >
          {lang === "ro" ? "Continuă" : "Next"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void doSubmit()}
          disabled={!isStepValid(step)}
          className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
        >
          {lang === "ro" ? "Finalizează" : "Submit"}
        </button>
      )}
    </div>
  );

  function isStepValid(cur: number) {
    if (cur === 0) {
      return isBounded(answers.urgency, 1, 10) && Boolean(answers.timeHorizon) && isBounded(answers.determination, 1, 5);
    }
    if (cur === 1) {
      return isBounded(answers.hoursPerWeek, 0, 8) && Boolean(answers.budgetLevel) && Boolean(answers.goalType);
    }
    if (cur === 2) {
      return Boolean(answers.emotionalState) && isBounded(answers.groupComfort, 1, 10) && isBounded(answers.learnFromOthers, 1, 10);
    }
    // final step: schedule fit + declared preference + all scales populated
    const arrays: number[][] = [pss, gse, maas, panasPos, panasNeg, svs];
    const allFilled = arrays.every((arr) => Array.isArray(arr) && arr.length > 0 && arr.every((v) => isBounded(v, 1, 5)));
    return isBounded(answers.scheduleFit, 1, 10) && Boolean(answers.formatPreference) && allFilled;
  }

  function isBounded(val: unknown, min: number, max: number) {
    const n = Number(val);
    return Number.isFinite(n) && n >= min && n <= max;
  }

  // Retrieve item prompts from i18n (fallback to 5 generic items)
  const pssItems = sa("eval.pss.items");
  const gseItems = sa("eval.gse.items");
  const maasItems = sa("eval.maas.items");
  const panasPosItems = sa("eval.panasPos.items");
  const panasNegItems = sa("eval.panasNeg.items");
  const svsItems = sa("eval.svs.items");

  const ensureLen = (arr: number[], n: number) => {
    if (n <= 0) return arr;
    if (arr.length === n) return arr;
    if (arr.length > n) return arr.slice(0, n);
    return [...arr, ...Array(n - arr.length).fill(3)];
  };

  // Normalize arrays for rendering without mutating state in effects
  const normPss = useMemo(() => ensureLen(pss, pssItems.length || 5), [pss, pssItems.length]);
  const normGse = useMemo(() => ensureLen(gse, gseItems.length || 5), [gse, gseItems.length]);
  const normMaas = useMemo(() => ensureLen(maas, maasItems.length || 5), [maas, maasItems.length]);
  const normPanasPos = useMemo(() => ensureLen(panasPos, panasPosItems.length || 5), [panasPos, panasPosItems.length]);
  const normPanasNeg = useMemo(() => ensureLen(panasNeg, panasNegItems.length || 5), [panasNeg, panasNegItems.length]);
  const normSvs = useMemo(() => ensureLen(svs, svsItems.length || 5), [svs, svsItems.length]);

  return (
    <section className="space-y-3 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
      {header}
      {step === 0 ? (
        <Step1 answers={answers} setAnswers={setAnswers} lang={lang} />
      ) : step === 1 ? (
        <Step2 answers={answers} setAnswers={setAnswers} lang={lang} />
      ) : step === 2 ? (
        <Step3 answers={answers} setAnswers={setAnswers} lang={lang} />
      ) : (
        <Step4
          answers={answers}
          setAnswers={setAnswers}
          lang={lang}
          pss={normPss}
          setPss={setPss}
          gse={normGse}
          setGse={setGse}
          maas={normMaas}
          setMaas={setMaas}
          panasPos={normPanasPos}
          setPanasPos={setPanasPos}
          panasNeg={normPanasNeg}
          setPanasNeg={setPanasNeg}
          svs={normSvs}
          setSvs={setSvs}
          pssItems={pssItems}
          gseItems={gseItems}
          maasItems={maasItems}
          panasPosItems={panasPosItems}
          panasNegItems={panasNegItems}
          svsItems={svsItems}
        />
      )}
      <div className="mt-1 text-[10px] text-[#7A6455]">
        {saving
          ? lang === "ro" ? "Se salvează…" : "Saving…"
          : lang === "ro" ? "Salvat" : "Saved"}
      </div>
      {nav}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3">{children}</div>;
}

type StepProps = {
  answers: EvaluationWizardAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<EvaluationWizardAnswers>>;
  lang: string;
};

function Step1({ answers, setAnswers, lang }: StepProps) {
  return (
    <div className="space-y-3">
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">
          {lang === "ro" ? "Cât de urgent simți să lucrezi acum?" : "How urgent does it feel to work on this now?"}
        </div>
        <div className="w-1/3 text-right">
          <input type="range" min={1} max={10} value={answers.urgency}
            onChange={(e) => setAnswers((a) => ({ ...a, urgency: Number(e.target.value) }))}
            className="w-full accent-[#2C2C2C]" />
          <div className="text-xs text-[#7A6455]">{answers.urgency} / 10</div>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">
          {lang === "ro" ? "În cât timp vrei rezultate vizibile?" : "How fast do you want visible results?"}
        </div>
        <div className="w-1/3 text-right">
          <select
            value={answers.timeHorizon}
            onChange={(e) => setAnswers((a) => ({ ...a, timeHorizon: e.target.value as ResolutionSpeed }))}
            className="w-full rounded-[8px] border border-[#E4D8CE] px-2 py-1 text-sm"
          >
            <option value="days">{lang === "ro" ? "Zile" : "Days"}</option>
            <option value="weeks">{lang === "ro" ? "Săptămâni" : "Weeks"}</option>
            <option value="months">{lang === "ro" ? "Luni" : "Months"}</option>
          </select>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">
          {lang === "ro" ? "Cât de hotărât(ă) ești să faci schimbări reale?" : "How determined are you to make real changes?"}
        </div>
        <div className="w-1/3 text-right">
          <input type="range" min={1} max={5} value={answers.determination}
            onChange={(e) => setAnswers((a) => ({ ...a, determination: Number(e.target.value) }))}
            className="w-full accent-[#2C2C2C]" />
          <div className="text-xs text-[#7A6455]">{answers.determination} / 5</div>
        </div>
      </Row>
    </div>
  );
}

function Step2({ answers, setAnswers, lang }: StepProps) {
  return (
    <div className="space-y-3">
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">
          {lang === "ro" ? "Timp pe săptămână (ore)" : "Hours per week"}
        </div>
        <div className="w-1/3 text-right">
          <input type="range" min={0} max={8} value={answers.hoursPerWeek}
            onChange={(e) => setAnswers((a) => ({ ...a, hoursPerWeek: Number(e.target.value) }))}
            className="w-full accent-[#2C2C2C]" />
          <div className="text-xs text-[#7A6455]">{answers.hoursPerWeek}h</div>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Buget realist" : "Realistic budget"}</div>
        <div className="w-1/3 text-right">
          <select
            value={answers.budgetLevel}
            onChange={(e) => setAnswers((a) => ({ ...a, budgetLevel: e.target.value as BudgetLevel }))}
            className="w-full rounded-[8px] border border-[#E4D8CE] px-2 py-1 text-sm"
          >
            <option value="low">{lang === "ro" ? "Minim" : "Low"}</option>
            <option value="medium">{lang === "ro" ? "Mediu" : "Medium"}</option>
            <option value="high">{lang === "ro" ? "Maxim" : "High"}</option>
          </select>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Cum ai descrie ce vrei să lucrezi?" : "How would you describe your focus?"}</div>
        <div className="w-1/3 text-right">
          <select
            value={answers.goalType}
            onChange={(e) => setAnswers((a) => ({ ...a, goalType: e.target.value as GoalType }))}
            className="w-full rounded-[8px] border border-[#E4D8CE] px-2 py-1 text-sm"
          >
            <option value="single">{lang === "ro" ? "Temă punctuală" : "Single"}</option>
            <option value="few">{lang === "ro" ? "2–3 zone" : "2–3 areas"}</option>
            <option value="broad">{lang === "ro" ? "Reorganizare amplă" : "Broad reorg"}</option>
          </select>
        </div>
      </Row>
    </div>
  );
}

function Step3({ answers, setAnswers, lang }: StepProps) {
  return (
    <div className="space-y-3">
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Stare emoțională (ultimele 2 săptămâni)" : "Emotional state (last 2 weeks)"}</div>
        <div className="w-1/3 text-right">
          <select
            value={answers.emotionalState}
            onChange={(e) => setAnswers((a) => ({ ...a, emotionalState: e.target.value as EmotionalState }))}
            className="w-full rounded-[8px] border border-[#E4D8CE] px-2 py-1 text-sm"
          >
            <option value="stable">{lang === "ro" ? "Stabilă" : "Stable"}</option>
            <option value="fluctuating">{lang === "ro" ? "Fluctuantă" : "Fluctuating"}</option>
            <option value="unstable">{lang === "ro" ? "Foarte instabilă" : "Unstable"}</option>
          </select>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Confort în grup" : "Group comfort"}</div>
        <div className="w-1/3 text-right">
          <input type="range" min={1} max={10} value={answers.groupComfort}
            onChange={(e) => setAnswers((a) => ({ ...a, groupComfort: Number(e.target.value) }))}
            className="w-full accent-[#2C2C2C]" />
          <div className="text-xs text-[#7A6455]">{answers.groupComfort} / 10</div>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Te ajută experiențele altora?" : "Do others' experiences help you?"}</div>
        <div className="w-1/3 text-right">
          <input type="range" min={1} max={10} value={answers.learnFromOthers}
            onChange={(e) => setAnswers((a) => ({ ...a, learnFromOthers: Number(e.target.value) }))}
            className="w-full accent-[#2C2C2C]" />
          <div className="text-xs text-[#7A6455]">{answers.learnFromOthers} / 10</div>
        </div>
      </Row>
    </div>
  );
}

function Step4({
  answers,
  setAnswers,
  lang,
  pss,
  setPss,
  gse,
  setGse,
  maas,
  setMaas,
  panasPos,
  setPanasPos,
  panasNeg,
  setPanasNeg,
  svs,
  setSvs,
  pssItems,
  gseItems,
  maasItems,
  panasPosItems,
  panasNegItems,
  svsItems,
}: StepProps & {
  pss: number[];
  setPss: (v: number[]) => void;
  gse: number[];
  setGse: (v: number[]) => void;
  maas: number[];
  setMaas: (v: number[]) => void;
  panasPos: number[];
  setPanasPos: (v: number[]) => void;
  panasNeg: number[];
  setPanasNeg: (v: number[]) => void;
  svs: number[];
  setSvs: (v: number[]) => void;
  pssItems: string[];
  gseItems: string[];
  maasItems: string[];
  panasPosItems: string[];
  panasNegItems: string[];
  svsItems: string[];
}) {
  return (
    <div className="space-y-3">
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Potrivit cu program fix (12 săpt.)" : "Fit for fixed schedule (12 weeks)"}</div>
        <div className="w-1/3 text-right">
          <input type="range" min={1} max={10} value={answers.scheduleFit}
            onChange={(e) => setAnswers((a) => ({ ...a, scheduleFit: Number(e.target.value) }))}
            className="w-full accent-[#2C2C2C]" />
          <div className="text-xs text-[#7A6455]">{answers.scheduleFit} / 10</div>
        </div>
      </Row>
      <Row>
        <div className="w-2/3 text-sm text-[#2C2C2C]">{lang === "ro" ? "Preferință declarată de format" : "Declared format preference"}</div>
        <div className="w-1/3 text-right">
          <select
            value={answers.formatPreference}
            onChange={(e) => setAnswers((a) => ({ ...a, formatPreference: e.target.value as FormatPreference }))}
            className="w-full rounded-[8px] border border-[#E4D8CE] px-2 py-1 text-sm"
          >
            <option value="unsure">{lang === "ro" ? "Am nevoie de recomandare" : "Need recommendation"}</option>
            <option value="individual">{lang === "ro" ? "Sesiuni individuale" : "Individual sessions"}</option>
            <option value="group">{lang === "ro" ? "Grup online" : "Group online"}</option>
          </select>
        </div>
      </Row>
      {/* Objective scales with i18n item prompts (compact layout) */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ScaleGroup title={lang === "ro" ? "PSS – Stres perceput" : "PSS – Perceived Stress"} values={pss} setValues={setPss} items={pssItems} />
        <ScaleGroup title={lang === "ro" ? "GSE – Auto‑eficacitate" : "GSE – Self‑Efficacy"} values={gse} setValues={setGse} items={gseItems} />
        <ScaleGroup title={lang === "ro" ? "MAAS – Atenție/Prezență" : "MAAS – Mindful Attention"} values={maas} setValues={setMaas} items={maasItems} />
        <ScaleGroup title={lang === "ro" ? "PANAS + Pozitiv" : "PANAS + Positive"} values={panasPos} setValues={setPanasPos} items={panasPosItems} />
        <ScaleGroup title={lang === "ro" ? "PANAS − Negativ" : "PANAS − Negative"} values={panasNeg} setValues={setPanasNeg} items={panasNegItems} />
        <ScaleGroup title={lang === "ro" ? "SVS – Vitalitate" : "SVS – Vitality"} values={svs} setValues={setSvs} items={svsItems} />
      </div>
    </div>
  );
}

function ScaleGroup({ title, values, setValues, items }: { title: string; values: number[]; setValues: (next: number[]) => void; items: string[] }) {
  return (
    <div className="rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3">
      <p className="mb-2 text-sm font-semibold text-[#2C2C2C]">{title}</p>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-xs text-[#7A6455]">{i + 1}.</span>
            <span className="flex-1 truncate text-xs text-[#5C4F45]">{items[i] || (title + " " + (i + 1))}</span>
            <input
              type="range"
              min={1}
              max={5}
              value={v}
              onChange={(e) => {
                const next = values.slice();
                next[i] = Number(e.target.value);
                setValues(next);
              }}
              className="w-full accent-[#2C2C2C]"
            />
            <span className="w-10 text-right text-xs text-[#7A6455]">{v}/5</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Note: single ScaleGroup implementation (the variant with i18n items is defined above)
