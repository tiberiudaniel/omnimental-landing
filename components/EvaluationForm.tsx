"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  computeScores,
  evaluationSections,
  initialEvaluationValues,
  type EvaluationFormValues,
} from "../lib/evaluation";
import { db } from "../firebaseConfig";

const STAGES = [
  { value: "t0", label: "Start (săptămâna 0)" },
  { value: "t1", label: "3 săptămâni" },
  { value: "t2", label: "6 săptămâni" },
  { value: "t3", label: "9 săptămâni" },
  { value: "t4", label: "Final (12 săptămâni)" },
];

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

type StoredEvaluation = {
  timestamp: number;
  data: {
    name: string;
    email: string | null;
    stage: string;
    journal: string | null;
    scores: ReturnType<typeof computeScores>;
    answers: EvaluationFormValues;
  };
};

const LOCAL_STORAGE_KEY = "omnimental_pending_evaluations";

function loadPendingEvaluations(): StoredEvaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredEvaluation[]) : [];
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

function saveEvaluationLocally(entry: StoredEvaluation["data"]): number {
  try {
    const existing = loadPendingEvaluations();
    existing.push({ timestamp: Date.now(), data: entry });
    persistPendingEvaluations(existing);
    return existing.length;
  } catch (error) {
    console.error("local save failed", error);
    return 0;
  }
}

export default function EvaluationForm() {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [answers, setAnswers] = useState<EvaluationFormValues>({ ...initialEvaluationValues });
  const [scores, setScores] = useState<ReturnType<typeof computeScores> | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const totalRequired = useMemo(
    () => Object.keys(initialEvaluationValues).length,
    []
  );

  const completedCount = useMemo(() => {
    return Object.values(answers).filter((value) => value !== "").length;
  }, [answers]);

  useEffect(() => {
    setPendingCount(loadPendingEvaluations().length);
  }, []);

  const handleLikertChange = (id: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: string[] = [];

    if (!formState.name.trim()) {
      errors.push("Introdu numele tău pentru a salva evaluarea.");
    }

    if (completedCount < totalRequired) {
      errors.push("Te rugăm să răspunzi la toate întrebările înainte de trimitere.");
    }

    if (errors.length) {
      setFormState((prev) => ({ ...prev, errors }));
      return;
    }

    const computed = computeScores(answers);

    try {
      setFormState((prev) => ({ ...prev, submitting: true, errors: [] }));

      await addDoc(collection(db, "evaluations"), {
        name: formState.name.trim(),
        email: formState.email.trim() || null,
        stage: formState.stage,
        journal: formState.journal.trim() || null,
        scores: computed,
        answers,
        createdAt: serverTimestamp(),
      });

      setScores(computed);
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitted: true,
        savedLocally: false,
        errors: [],
      }));
      setPendingCount(loadPendingEvaluations().length);
      setRetryMessage(null);
    } catch (error) {
      console.error("evaluation submit failed", error);

      const errorMessage =
        error instanceof Error ? error.message : "Eroare necunoscută";

      // Persistăm local pentru a nu pierde datele completate
      const entry = {
        name: formState.name.trim(),
        email: formState.email.trim() || null,
        stage: formState.stage,
        journal: formState.journal.trim() || null,
        scores: computed,
        answers,
      } satisfies StoredEvaluation["data"];
      const newPendingLength = saveEvaluationLocally(entry);

      setScores(computed);
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
    }
  };

  const handleReset = () => {
    setFormState(initialFormState);
    setAnswers({ ...initialEvaluationValues });
    setScores(null);
    setRetryMessage(null);
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
        await addDoc(collection(db, "evaluations"), {
          name: entry.data.name,
          email: entry.data.email,
          stage: entry.data.stage,
          journal: entry.data.journal,
          scores: entry.data.scores,
          answers: entry.data.answers,
          createdAt: serverTimestamp(),
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

      <form onSubmit={handleSubmit} className="space-y-10">
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
          <label className="flex flex-col gap-2 text-sm text-[#2C2C2C]">
            Etapă program
            <select
              value={formState.stage}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, stage: event.target.value }))
              }
              className="rounded-[6px] border border-[#D8C6B6] px-4 py-2 focus:border-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
            >
              {STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>
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

        {evaluationSections.map((section) => (
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
        ))}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-x-3">
            <button
              type="submit"
              disabled={formState.submitting}
              className="inline-flex items-center gap-2 rounded-[6px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formState.submitting ? "Se salvează..." : "Trimite evaluarea"}
            </button>
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

        {formState.errors.length > 0 && (
          <div className="space-y-2 border border-[#E60012] bg-[#FBE9EB] px-4 py-3 text-sm text-[#2C2C2C]">
            {formState.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </form>

      {scores && (
        <section className="space-y-4 border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <h2 className="text-lg font-semibold text-[#1F1F1F]">
            Rezultate și interpretare
          </h2>
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
          </div>
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
