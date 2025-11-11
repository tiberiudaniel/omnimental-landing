"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import {
  computeScores,
  evaluationSections,
  initialEvaluationValues,
  type EvaluationFormValues,
} from "../lib/evaluation";
import {
  submitEvaluation,
  type EvalPayload,
  saveQuestSuggestions,
} from "@/lib/submitEvaluation";
import { useI18n } from "./I18nProvider";
import { omniKnowledgeModules, computeOmniKnowledgeScore } from "../lib/omniKnowledge";
import { generateQuestSuggestions, type QuestSuggestion } from "@/lib/quests";
import { recordEvaluationProgressFact, recordEvaluationSubmitStarted, recordEvaluationSubmitFinished } from "@/lib/progressFacts";

type StepConfig = {
  key: string;
  label: string;
  sections?: Array<(typeof evaluationSections)[number]["key"]>;
};

const STEP_CONFIG: StepConfig[] = [
  { key: "info", label: "Profil participant" },
  { key: "resilience", label: "Stres & autoeficacitate", sections: ["pss", "gse"] },
  { key: "presence", label: "Prezență conștientă", sections: ["maas"] },
  { key: "emotions", label: "Starea emoțională", sections: ["panas"] },
  { key: "vitality", label: "Vitalitate", sections: ["svs"] },
];

const STAGES = [
  { value: "t0", label: "Start (săptămâna 0)", helper: "Baseline inițial" },
  { value: "t1", label: "3 săptămâni", helper: "Primul checkpoint" },
  { value: "t2", label: "6 săptămâni", helper: "Jumătatea programului" },
  { value: "t3", label: "9 săptămâni", helper: "Faza de consolidare" },
  { value: "t4", label: "Final (12 săptămâni)", helper: "Raport final" },
];

const submissionFormatter = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const knowledgeModuleLabels = omniKnowledgeModules.reduce<Record<string, string>>((acc, module) => {
  acc[module.key] = module.title;
  return acc;
}, {});

type FormState = {
  name: string;
  email: string;
  stage: string;
  journal: string;
  submitting: boolean;
  submitted: boolean;
  savedLocally: boolean;
  errors: string[];
};

const initialFormState: FormState = {
  name: "",
  email: "",
  stage: "t0",
  journal: "",
  submitting: false,
  submitted: false,
  savedLocally: false,
  errors: [],
};

type EvaluationSubmission = {
  name: string;
  email: string | null;
  stage: string;
  journal: string | null;
  scores: ReturnType<typeof computeScores>;
  answers: EvaluationFormValues;
  knowledge: {
    answers: Record<string, number>;
    raw: number;
    max: number;
    percent: number;
    breakdown: Record<string, { raw: number; max: number; percent: number }>;
  };
};

type StoredEvaluation = {
  timestamp: number;
  lang: "ro" | "en";
  data: EvaluationSubmission;
};

const LOCAL_STORAGE_KEY = "omnimental_pending_evaluations";

function loadPendingEvaluations(): StoredEvaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredEvaluation[];
    return parsed.map((entry) => ({
      ...entry,
      lang: entry.lang === "en" ? "en" : "ro",
      data: entry.data?.knowledge
        ? entry.data
        : {
            ...entry.data,
            knowledge: {
              answers: {},
              raw: 0,
              max: 0,
              percent: 0,
              breakdown: {},
            },
          },
    }));
  } catch (error) {
    console.error("load pending failed", error);
    return [];
  }
}

function persistPendingEvaluations(entries: StoredEvaluation[]) {
  if (typeof window === "undefined") return;
  try {
    if (!entries.length) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
    }
  } catch (error) {
    console.error("persist pending failed", error);
  }
}

function saveEvaluationLocally(entry: Omit<StoredEvaluation, "timestamp">): number {
  try {
    const existing = loadPendingEvaluations();
    existing.push({ timestamp: Date.now(), ...entry });
    persistPendingEvaluations(existing);
    return existing.length;
  } catch (error) {
    console.error("local save failed", error);
    return 0;
  }
}

export default function EvaluationForm({
  mode = "full",
  onSubmitted,
}: {
  mode?: "full" | "intelOnly";
  onSubmitted?: () => void;
}) {
  const { lang } = useI18n();
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [answers, setAnswers] = useState<EvaluationFormValues>({ ...initialEvaluationValues });
  const [scores, setScores] = useState<ReturnType<typeof computeScores> | null>(null);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const createKnowledgeDefaults = () => {
    const map: Record<string, number | null> = {};
    omniKnowledgeModules.forEach((module) => {
      module.questions.forEach((question) => {
        map[question.id] = null;
      });
    });
    return map;
  };
  const [knowledgeAnswers, setKnowledgeAnswers] = useState<Record<string, number | null>>(
    createKnowledgeDefaults,
  );
  const [questSuggestions, setQuestSuggestions] = useState<QuestSuggestion[]>([]);
  const [questCompletions, setQuestCompletions] = useState<Record<string, boolean>>({});

  const totalRequired = useMemo(
    () => Object.keys(initialEvaluationValues).length,
    []
  );

  const completedCount = useMemo(() => {
    return Object.values(answers).filter((value) => value !== "").length;
  }, [answers]);
  const knowledgeCompleted = useMemo(() => {
    if (mode !== "full") {
      return true;
    }
    return Object.values(knowledgeAnswers).every((value) => typeof value === "number");
  }, [knowledgeAnswers, mode]);
  const knowledgeScore = useMemo(() => computeOmniKnowledgeScore(knowledgeAnswers), [knowledgeAnswers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const count = loadPendingEvaluations().length;
    if (count > 0) {
      const raf = window.requestAnimationFrame(() => setPendingCount(count));
      return () => window.cancelAnimationFrame(raf);
    }
  }, []);

  useEffect(() => {
    if (!scores || typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      const target = document.getElementById("evaluation-progress");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [scores]);

  const handleLikertChange = (id: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };
  const handleKnowledgeChange = (questionId: string, value: number) => {
    setKnowledgeAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const sectionsByKey = useMemo(() => {
    return evaluationSections.reduce<Record<string, (typeof evaluationSections)[number]>>(
      (acc, section) => {
        acc[section.key] = section;
        return acc;
      },
      {}
    );
  }, []);

  const getSectionsForStep = (step: StepConfig) => {
    if (!step.sections) return [];
    return step.sections.map((key) => sectionsByKey[key]).filter(Boolean);
  };

  const infoStepComplete = formState.name.trim().length > 0;

  const isSectionGroupComplete = (step: StepConfig) => {
    const sections = getSectionsForStep(step);
    if (!sections.length) return true;
    return sections.every((section) =>
      section.items.every((item) => answers[item.id] !== "")
    );
  };

  const isCurrentStepComplete = () => {
    const step = STEP_CONFIG[currentStep];
    if (!step) return false;
    if (step.key === "info") return infoStepComplete;
    return isSectionGroupComplete(step);
  };

  const handleNextStep = () => {
    if (currentStep < STEP_CONFIG.length - 1) {
      setFormState((prev) => ({ ...prev, errors: [] }));
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setFormState((prev) => ({ ...prev, errors: [] }));
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const scrollToTrend = () => {
    if (typeof window === "undefined") return;
    document.getElementById("evaluation-progress")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep < STEP_CONFIG.length - 1) {
      if (isCurrentStepComplete()) {
        handleNextStep();
      } else {
        setFormState((prev) => ({
          ...prev,
          errors: ["Te rugăm să completezi toate întrebările din această etapă."],
        }));
      }
      return;
    }

    const errors: string[] = [];

    if (!formState.name.trim()) {
      errors.push("Introdu numele tău pentru a salva evaluarea.");
    }

    if (completedCount < totalRequired) {
      errors.push("Te rugăm să răspunzi la toate întrebările înainte de trimitere.");
    }

    const stageValid = STAGES.some((stage) => stage.value === formState.stage);
    if (!stageValid) {
      errors.push("Selectează etapa evaluării (ex. Start, 3 săptămâni).");
    }

    if (mode === "full" && !knowledgeCompleted) {
      errors.push("Completează toate întrebările Omni-Cunoaștere.");
    }

    if (errors.length) {
      setFormState((prev) => ({ ...prev, errors }));
      return;
    }

    const computed = computeScores(answers);
    const submissionData: EvaluationSubmission = {
      name: formState.name.trim(),
      email: formState.email.trim() || null,
      stage: formState.stage,
      journal: formState.journal.trim() || null,
      scores: computed,
      answers,
      knowledge: {
        answers: mode === "full"
          ? Object.entries(knowledgeAnswers).reduce<Record<string, number>>((acc, [id, value]) => {
              if (typeof value === "number") {
                acc[id] = value;
              }
              return acc;
            }, {})
          : {},
        raw: mode === "full" ? knowledgeScore.raw : 0,
        max: mode === "full" ? knowledgeScore.max : 0,
        percent: mode === "full" ? knowledgeScore.percent : 0,
        breakdown: mode === "full" ? knowledgeScore.breakdown : {},
      },
    };
    const payload: EvalPayload = {
      lang: normalizedLang,
      answers: submissionData,
    };

    try {
      setFormState((prev) => ({ ...prev, submitting: true, errors: [] }));
      void recordEvaluationSubmitStarted(formState.stage, normalizedLang);

      const snapshotId = await submitEvaluation(payload);

      const submittedAt = new Date();
      setScores(computed);
      setLastSubmittedAt(submittedAt);
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitted: true,
        savedLocally: false,
        errors: [],
      }));
      setPendingCount(loadPendingEvaluations().length);
      setRetryMessage(null);

      void recordEvaluationProgressFact({
        scores: computed,
        knowledge: mode === "full" ? knowledgeScore : undefined,
        stageValue: formState.stage,
        lang: normalizedLang,
      }).catch((progressError) => {
        console.error("progress fact evaluation failed", progressError);
      });

      const stageMeta = STAGES.find((stage) => stage.value === formState.stage) ?? STAGES[0];
      const knowledgeGapTitles = (() => {
        if (mode !== "full") return [] as string[];
        const gaps = Object.entries(knowledgeScore.breakdown)
          .filter(([, value]) => (value?.percent ?? 0) <= 60)
          .map(([key]) => knowledgeModuleLabels[key] ?? key)
          .slice(0, 3);
        if (knowledgeCompleted) {
          return gaps;
        }
        return gaps.length
          ? gaps
          : [normalizedLang === "ro" ? "Evaluarea Omni-Cunoaștere" : "Omni-Knowledge quiz"];
      })();
      const questContext = {
        lang: normalizedLang,
        stageValue: formState.stage,
        stageLabel: stageMeta.label,
        scores: computed,
        knowledgePercent: knowledgeScore.percent,
        knowledgeGaps: knowledgeGapTitles,
      };
      const generatedQuests = generateQuestSuggestions(questContext);
      setQuestSuggestions(generatedQuests);
      setQuestCompletions({});

      if (snapshotId && generatedQuests.length) {
        void saveQuestSuggestions({
          lang: normalizedLang,
          stage: formState.stage,
          snapshotId,
          quests: generatedQuests,
        }).catch((questError) => {
          console.error("quest save failed", questError);
        });
      }

      onSubmitted?.();
      void recordEvaluationSubmitFinished(formState.stage, normalizedLang, true);
    } catch (error) {
      console.error("evaluation submit failed", error);

      const errorMessage =
        error instanceof Error ? error.message : "Eroare necunoscută";

      // Persistăm local pentru a nu pierde datele completate
      const entry = {
        lang: normalizedLang,
        data: submissionData,
      } satisfies Omit<StoredEvaluation, "timestamp">;
      const newPendingLength = saveEvaluationLocally(entry);

      setScores(computed);
      setLastSubmittedAt(new Date());
      setQuestSuggestions([]);
      setQuestCompletions({});
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitted: true,
        savedLocally: true,
        errors: [
          "Nu am putut trimite evaluarea către server. Am salvat răspunsurile local și le vom retransmite la următoarea completare.",
          `Detalii tehnice: ${errorMessage}`,
        ],
      }));
      setPendingCount(newPendingLength);
      setRetryMessage("Evaluarea a fost salvată local și va putea fi retrimisă când conexiunea revine.");
      void recordEvaluationSubmitFinished(formState.stage, normalizedLang, false);
    }
  };

  const handleReset = () => {
    setFormState(initialFormState);
    setAnswers({ ...initialEvaluationValues });
    setScores(null);
    setLastSubmittedAt(null);
    setQuestSuggestions([]);
    setQuestCompletions({});
    setKnowledgeAnswers(createKnowledgeDefaults());
    setRetryMessage(null);
    setCurrentStep(0);
  };

  const retryPendingEvaluations = async () => {
    if (retrying) return;
    const stored = loadPendingEvaluations();
    if (!stored.length) {
      setRetryMessage("Nu există evaluări nesincronizate.");
      setFormState((prev) => ({ ...prev, savedLocally: false, errors: [] }));
      setPendingCount(0);
      return;
    }

    setRetrying(true);
    setRetryMessage(null);
    setFormState((prev) => ({ ...prev, errors: [] }));

    const failed: StoredEvaluation[] = [];

    for (const entry of stored) {
      try {
        await submitEvaluation({
          lang: entry.lang,
          answers: entry.data,
        });
      } catch (error) {
        console.error("retry submission failed", error);
        failed.push(entry);
      }
    }

    persistPendingEvaluations(failed);
    setPendingCount(failed.length);
    setRetrying(false);
    setFormState((prev) => ({ ...prev, savedLocally: failed.length > 0 }));
    setRetryMessage(
      failed.length === 0
        ? "Toate evaluările nesincronizate au fost trimise cu succes."
        : `Nu am reușit să retrimitem ${failed.length} evaluări. Vor rămâne salvate local.`
    );
  };

  const currentStepConfig = STEP_CONFIG[currentStep] ?? STEP_CONFIG[0];
  const sectionsForCurrentStep = getSectionsForStep(currentStepConfig);
  const progressPercentage = ((currentStep + 1) / STEP_CONFIG.length) * 100;

  return (
    <div className="space-y-8">
      <header className="space-y-2 border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Evaluare Mental Coaching</h1>
        <p className="text-sm text-[#2C2C2C]">
          Completează evaluarea la începutul programului și la fiecare 3 săptămâni. Durează aproximativ 10 minute.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-[#A08F82]">
          <span>{completedCount}/{totalRequired} itemi completați</span>
          {formState.submitted && <span className="text-[#2C2C2C]">Evaluare salvată ✓</span>}
        </div>
      </header>

      {pendingCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#FFF2D9] bg-[#FFF9ED] px-4 py-3 text-xs uppercase tracking-[0.25em] text-[#A08F82]">
          <span>{pendingCount} evaluări nesincronizate</span>
          <button
            type="button"
            onClick={retryPendingEvaluations}
            disabled={retrying}
            className="rounded-[6px] border border-[#2C2C2C] px-4 py-2 text-[10px] font-semibold text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retrying ? "Se retrimite..." : "Retrimite acum"}
          </button>
        </div>
      )}
      {retryMessage && (
        <div className="border border-[#D8C6B6] bg-white px-4 py-3 text-sm text-[#2C2C2C]">
          {retryMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#A08F82]">
            <span>
              Pas {currentStep + 1}/{STEP_CONFIG.length}
            </span>
            <span>{currentStepConfig?.label}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F6F2EE]">
            <div
              className="h-full rounded-full bg-[#E60012] transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {currentStepConfig?.key === "info" ? (
          <section className="grid gap-4 border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
              Nume participant
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                className="rounded-[6px] border border-[#D8C6B6] px-4 py-2 focus:border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
              Email (opțional)
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
                className="rounded-[6px] border border-[#D8C6B6] px-4 py-2 focus:border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm text-[#2C2C2C] md:col-span-2">
              <span>Etapă program</span>
              <StageSelector
                value={formState.stage}
                onChange={(stage) => setFormState((prev) => ({ ...prev, stage }))}
              />
            </div>
            <label className="flex flex-col gap-2 text-sm text-[#2C2C2C] md:col-span-2">
              Notițe despre starea actuală (opțional)
              <textarea
                value={formState.journal}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, journal: event.target.value }))
                }
                rows={4}
                className="rounded-[6px] border border-[#D8C6B6] px-4 py-2 focus:border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                placeholder="Ce observi acum față de începutul programului?"
              />
            </label>
          </section>
        ) : (
          sectionsForCurrentStep.map((section) => (
            <section
              key={section.key}
              className="space-y-4 border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
            >
              <header className="space-y-1">
                <h2 className="text-lg font-semibold text-[#1F1F1F]">{section.title}</h2>
                <p className="text-sm text-[#2C2C2C]/80">{section.description}</p>
              </header>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.id} className="space-y-2 text-sm text-[#2C2C2C]">
                    <div className="flex items-center gap-2">
                      <span>{item.prompt}</span>
                      {item.reverse && (
                        <span className="rounded-full bg-[#F6F2EE] px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-[#A08F82]">
                          inversat
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({ length: item.max - item.min + 1 }).map((_, index) => {
                        const value = item.min + index;
                        const id = `${item.id}-${value}`;
                        return (
                          <label
                            key={id}
                            className={`flex cursor-pointer flex-col items-center gap-1 rounded-[6px] border px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                              answers[item.id] === value
                                ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                                : "border-[#D8C6B6] text-[#2C2C2C] hover:border-[#2C2C2C]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={item.id}
                              value={value}
                              checked={answers[item.id] === value}
                              onChange={() => handleLikertChange(item.id, value)}
                              className="hidden"
                            />
                            <span>{value}</span>
                            <span className="text-[10px] font-semibold">
                              {section.scaleLabels[value - item.min] ?? ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {mode === "full" ? (
        <section className="space-y-6 border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Omni-Cunoaștere</p>
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Ce știi despre instrumente și practici</h2>
            <p className="text-sm text-[#2C2C2C]/80">
              Răspunde la întrebările din fiecare modul pentru a primi scorul de cunoaștere (OC). Scor curent:{" "}
              <span className="font-semibold text-[#2C2C2C]">
                {knowledgeCompleted ? `${knowledgeScore.percent}%` : "în curs"}
              </span>
              .
            </p>
          </header>
          <div className="space-y-6">
            {omniKnowledgeModules.map((module) => {
              const moduleScore = knowledgeScore.breakdown[module.key];
              return (
                <div
                  key={module.key}
                  className="space-y-4 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-base font-semibold text-[#2C2C2C]">{module.title}</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
                      {moduleScore ? `${moduleScore.percent}% complet` : "0% complet"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {module.questions.map((question) => {
                      const selected = knowledgeAnswers[question.id];
                      const isCorrect =
                        typeof selected === "number" && selected === question.correctIndex;
                      const showFeedback = typeof selected === "number";
                      return (
                        <div key={question.id} className="space-y-2 rounded-[8px] border border-[#F6EDE2] bg-white px-3 py-3 text-sm text-[#2C2C2C]">
                          <p className="font-medium">{question.question}</p>
                          <div className="flex flex-col gap-2">
                            {question.options.map((option, index) => (
                              <label
                                key={`${question.id}-${index}`}
                                className={`flex cursor-pointer items-center gap-2 rounded-[6px] border px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                                  selected === index
                                    ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                                    : "border-[#D8C6B6] text-[#2C2C2C] hover:border-[#2C2C2C]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={index}
                                  checked={selected === index}
                                  onChange={() => handleKnowledgeChange(question.id, index)}
                                  className="hidden"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                          {showFeedback && (
                            <p
                              className={`text-xs ${
                                isCorrect ? "text-[#0F6D45]" : "text-[#B8000E]"
                              }`}
                            >
                              {isCorrect ? "Corect" : "Răspuns corect: " + question.options[question.correctIndex]}
                              {" • "}
                              {question.rationale}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        ) : null}

        {formState.errors.length > 0 && (
          <div className="space-y-2 border border-[#E60012] bg-[#FBE9EB] px-4 py-3 text-sm text-[#2C2C2C]">
            {formState.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="inline-flex items-center gap-2 rounded-[6px] border border-[#D8C6B6] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#F6F2EE] focus:outline-none focus:ring-1 focus:ring-[#D8C6B6]"
              >
                Înapoi
              </button>
            )}
            {currentStep < STEP_CONFIG.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isCurrentStepComplete()}
                className="inline-flex items-center gap-2 rounded-[6px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continuă
              </button>
            ) : (
              <button
                type="submit"
                disabled={formState.submitting || !isCurrentStepComplete() || !knowledgeCompleted}
                className="inline-flex items-center gap-2 rounded-[6px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formState.submitting ? "Se salvează..." : "Trimite evaluarea"}
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-[6px] border border-[#D8C6B6] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] transition hover:bg-[#F6F2EE] focus:outline-none focus:ring-1 focus:ring-[#D8C6B6]"
            >
              Reset formular
            </button>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A08F82]">
            <span>Progres XP: {Math.round((completedCount / totalRequired) * 100)}%</span>
          </p>
        </div>
      </form>

      {scores && (
        <section className="space-y-4 border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <h2 className="text-lg font-semibold text-[#1F1F1F]">
            Rezultate și interpretare
          </h2>
          <SubmissionSummaryCard
            stageValue={formState.stage}
            submittedAt={lastSubmittedAt}
            mode={mode}
            knowledgePercent={mode === "full" ? knowledgeScore.percent : undefined}
          />
          {formState.savedLocally && (
            <div className="border border-[#E6C200] bg-[#FFF9DB] px-4 py-3 text-sm text-[#2C2C2C]">
              Evaluarea a fost salvată local (conexiune instabilă). O vom reîncerca automat data viitoare sau poți reface trimiterea manual.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <ScoreCard
              label="PSS – Stres perceput"
              value={scores.pssTotal}
              max={40}
              invert
              helper={interpretPSS(scores.pssTotal)}
            />
            <ScoreCard
              label="GSE – Autoeficacitate"
              value={scores.gseTotal}
              max={40}
              helper={scores.gseTotal < 25 ? "Încredere scăzută" : "Încredere bună"}
            />
            <ScoreCard
              label="MAAS – Prezență conștientă"
              value={scores.maasTotal}
              max={6}
              helper={scores.maasTotal > 4.5 ? "Bună conștiență" : "Spațiu de creștere"}
            />
            <ScoreCard
              label="PANAS – Afect pozitiv"
              value={scores.panasPositive}
              max={25}
              helper="Valorile mai mari indică energie pozitivă"
            />
            <ScoreCard
              label="PANAS – Afect negativ"
              value={scores.panasNegative}
              max={25}
              invert
              helper="Valorile mai mici indică echilibru emoțional"
            />
            <ScoreCard
              label="SVS – Vitalitate"
              value={scores.svs}
              max={7}
              helper={scores.svs > 5 ? "Vitalitate ridicată" : "Poate fi îmbunătățită"}
            />
            {mode === "full" ? (
              <ScoreCard
                label="Omni-Cunoaștere (OC)"
                value={knowledgeScore.percent}
                max={100}
                helper={
                  knowledgeScore.percent >= 70
                    ? "Ai o bază solidă de concepte."
                    : "Revizitează modulele cu scor mai mic."
                }
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-4 text-sm text-[#4A3A30] md:flex-row md:items-center md:justify-between">
            <p>
              Urmărește graficele și baseline-ul complet în secțiunea „Progres”. Fiecare evaluare nouă
              actualizează automat trendul.
            </p>
            <button
              type="button"
              onClick={scrollToTrend}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              Vezi progresul
            </button>
          </div>
          {questSuggestions.length > 0 && (
            <QuestSuggestionList
              quests={questSuggestions}
              completions={questCompletions}
              onToggle={(questId) =>
                setQuestCompletions((prev) => ({ ...prev, [questId]: !prev[questId] }))
              }
              lang={normalizedLang}
            />
          )}
        </section>
      )}
    </div>
  );
}

type ScoreCardProps = {
  label: string;
  value: number;
  max: number;
  helper?: string;
  invert?: boolean;
};

function ScoreCard({ label, value, max, helper, invert }: ScoreCardProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = invert ? "bg-[#E60012]" : "bg-[#2C2C2C]";

  return (
    <div className="space-y-2 border border-[#F6F2EE] px-4 py-4">
      <div className="flex items-center justify-between text-sm text-[#2C2C2C]">
        <span className="font-semibold">{label}</span>
        <span>{value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-[#F6F2EE]">
        <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>
      {helper && <p className="text-xs text-[#2C2C2C]/70">{helper}</p>}
    </div>
  );
}

function interpretPSS(score: number) {
  if (score <= 13) return "Stres scăzut";
  if (score <= 26) return "Stres moderat";
  return "Stres ridicat";
}

type StageSelectorProps = {
  value: string;
  onChange: (stage: string) => void;
};

function StageSelector({ value, onChange }: StageSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {STAGES.map((stage) => {
        const active = stage.value === value;
        return (
          <button
            key={stage.value}
            type="button"
            onClick={() => onChange(stage.value)}
            aria-pressed={active}
            className={`rounded-[10px] border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#2C2C2C] ${
              active
                ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                : "border-[#E4D8CE] bg-white text-[#2C2C2C] hover:border-[#2C2C2C]"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.35em] text-current">{stage.helper}</p>
            <p className="text-sm font-semibold text-current">{stage.label}</p>
          </button>
        );
      })}
    </div>
  );
}

type SubmissionSummaryCardProps = {
  stageValue: string;
  submittedAt: Date | null;
  mode: "full" | "intelOnly";
  knowledgePercent?: number;
};

function SubmissionSummaryCard({
  stageValue,
  submittedAt,
  mode,
  knowledgePercent,
}: SubmissionSummaryCardProps) {
  const stageMeta = STAGES.find((stage) => stage.value === stageValue) ?? STAGES[0];
  const submittedText = submittedAt
    ? submissionFormatter.format(submittedAt)
    : "Se va completa automat după trimitere.";

  return (
    <div className="rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-4 text-sm text-[#4A3A30]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C07963]">Etapă evaluare</p>
          <p className="text-lg font-semibold text-[#1F1F1F]">{stageMeta.label}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{stageMeta.helper}</p>
        </div>
        <div className="space-y-1 text-xs uppercase tracking-[0.2em] text-[#5C4F45]">
          <p className="font-semibold text-[#1F1F1F]">Ultima trimitere</p>
          <p>{submittedText}</p>
        </div>
        {mode === "full" ? (
          <div className="space-y-1 text-xs uppercase tracking-[0.2em] text-[#5C4F45]">
            <p className="font-semibold text-[#1F1F1F]">Omni-Cuno</p>
            <p>{typeof knowledgePercent === "number" ? `${knowledgePercent}%` : "în curs"}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type QuestSuggestionListProps = {
  quests: QuestSuggestion[];
  completions: Record<string, boolean>;
  onToggle: (id: string) => void;
  lang: "ro" | "en";
};

function QuestSuggestionList({ quests, completions, onToggle, lang }: QuestSuggestionListProps) {
  if (!quests.length) return null;
  return (
    <section className="space-y-4 rounded-[14px] border border-[#E4D8CE] bg-white px-4 py-5">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
          {lang === "ro" ? "Quest recomandat" : "Recommended quest"}
        </p>
        <h3 className="text-lg font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "Aplică rezultatele" : "Apply your results"}
        </h3>
        <p className="text-sm text-[#5C4F45]">
          {lang === "ro"
            ? "Bifează când finalizezi și treci la următorul."
            : "Check each quest off once you complete it."}
        </p>
      </header>
      <div className="space-y-3">
        {quests.map((quest) => {
          const done = Boolean(completions[quest.id]);
          return (
            <div
              key={quest.id}
              className={`space-y-2 rounded-[12px] border px-4 py-3 text-sm transition ${
                done ? "border-[#CBE8D7] bg-[#F3FFF8]" : "border-[#F0E6DA] bg-[#FFFBF7]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold text-[#1F1F1F]">{quest.title}</h4>
                <span className="rounded-full border border-[#D8C6B6] px-2 py-[2px] text-[10px] uppercase tracking-[0.3em] text-[#5C4F45]">
                  {quest.type}
                </span>
              </div>
              <p className="text-[#4A3A30]">{quest.body}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggle(quest.id)}
                  className={`rounded-[10px] border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition ${
                    done
                      ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                      : "border-[#2C2C2C] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                  }`}
                >
                  {done
                    ? lang === "ro"
                      ? "Marcat ca făcut"
                      : "Marked done"
                    : quest.ctaLabel}
                </button>
                <p className="text-xs text-[#A08F82]">{quest.contextSummary}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
