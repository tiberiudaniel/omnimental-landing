SPEC CANON FINAL — Arena V1 + KpiEvent schema + Trait Engine (pentru Codex)
Obiectiv

Stabilim un set minim canon de Arenas V1 (task-uri executive “core”), o schemă unificată de telemetry/KPI (KpiEvent), și un trait engine care traduce KPI → “Cognitive Adaptive Traits” (acute vs baseline) pentru recomandări.
Cheie: Arena = măsurare + stres controlat, UI/game layer vine după (result → micro-drill → commit).

Principii non-negociabile

Arenas V1 sunt stabile, scurte, reproductibile (90–180s).

KPI nu folosește doar medii. Median + p90 + IQR/CV + slope.

Scorurile de trait sunt interne (nu trebuie expuse complet userului în V1).

Baseline = rolling pe N run-uri valide, nu “pe zile”.

Dacă există deja componente/helpers similare, reutilizează-le; nu crea paralele.

Zone de evitat / minimizat schimbări:

nu refactoriza masiv routing-ul App Router

nu schimba structura Firestore decât dacă e nevoie minimă pentru persistare

nu introduce “arena_trial” event dacă explodează volum (keep optional)

1) Arena V1 — Canon final (5 module)
1.1 Inhibitory Control
A1. Micro-Stroop (existent)

Stimuli: cuvinte congruente/incongruente (culoare vs text)
Durată: 90–150s
Dificultate (opțional): time pressure (strict deadline), proporție incongruent
Output KPI specific:

interferenceMs = rtMedianIncongruent - rtMedianCongruent

congruentAcc, incongruentAcc

incongruentErrRate, congruentErrRate

A2. Go / No-Go (nou)

Stimuli: 70–90% Go, 10–30% No-Go
Durată: 90–150s
Dificultate: crește No-Go rate, scade deadline, introduce distractori ușori
Output KPI specific:

commissionRate (No-Go apăsat)

omissionRate (Go ratat)

rtMedianGoMs, rtP90GoMs

1.2 Working Memory
B1. N-Back (2-back adaptiv) (nou)

Stimuli: secvență (vizual/simbol)
Durată: 120–180s
Dificultate: nivel (2,3), viteză, lure rate
Output KPI specific:

dPrime (d’) sau proxy dacă nu vrei SDT complet

levelReached

fatigueSlopeRt, fatigueSlopeAcc (pe trial index)

1.3 Cognitive Flexibility
C1. Task Switching A/B (nou)

Stimuli: item cu 2 reguli posibile (ex: par/impar vs mare/mic)
Durată: 120–180s
Dificultate: frecvența switch, deadline, cu/ fără cue explicit
Output KPI specific:

switchCostMs = rtMedianSwitch - rtMedianRepeat

switchCostAcc = accRepeat - accSwitch

perseverationRate (greșeli tip “regula veche” după switch)

(Trail Making A/B — NU în V1)

1.4 Sustained Attention
D1. SART / CPT-lite (nou)

Stimuli: stream rapid; 1 target rar / sau 1 non-target rar (SART)
Durată: 120–180s
Dificultate: ritm, raritate target, distractori subtili
Output KPI specific:

lapseRate (omissions în ferestre critice)

rtVar sau cvRT

vigilanceDrop (diferență early vs late, acc/rt)

2) KpiEvent — TypeScript schema unificată
2.1 Evenimente canonice (telemetry)

arena_run_started

arena_run_completed

arena_run_abandoned

arena_run_error (opțional, pentru debugging)

arena_trial (OPTIONAL; doar dacă volum ok)

2.2 Câmpuri comune (toate evenimentele)

identificare: arenaId, moduleId, variantId

context: sessionContext (onboarding/today/arena), language, deviceType

performanță runtime: fpsBucket, durationMs

indexare: attemptIndexToday, attemptIndexAllTime

presiune: pressureMode (low/normal/time-pressure)

metacogniție (post-run): selfRatedConfidence (1–5) (doar la completed)

TS types (canon)
export type ArenaId =
  | "stroop"
  | "goNoGo"
  | "nBack"
  | "taskSwitch"
  | "sart";

export type SessionContext = "onboarding" | "today" | "arena";
export type PressureMode = "low" | "normal" | "time-pressure";
export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

/** Keep as small buckets to avoid noise; compute from raf loop timing or perf APIs. */
export type FpsBucket = "lt30" | "30_45" | "45_55" | "55_60" | "gt60" | "unknown";

export type KpiEventName =
  | "arena_run_started"
  | "arena_run_completed"
  | "arena_run_abandoned"
  | "arena_run_error"
  | "arena_trial"; // optional

export type KpiStd = {
  acc?: number;              // 0..1
  errRate?: number;          // 0..1
  rtMedianMs?: number;
  rtP90Ms?: number;
  rtIqrMs?: number;
  cvRT?: number;             // coefficient of variation
  rtSlope?: number;          // ms per trialIndex (fatigue proxy)
  accSlope?: number;         // acc per trialIndex
  pauseCount?: number;
  retryCount?: number;
  rageTapCount?: number;     // optional, if detectable
};

export type KpiTaskSpecific =
  | {
      task: "stroop";
      interferenceMs?: number;
      congruentAcc?: number;
      incongruentAcc?: number;
      congruentErrRate?: number;
      incongruentErrRate?: number;
      rtMedianCongruentMs?: number;
      rtMedianIncongruentMs?: number;
    }
  | {
      task: "goNoGo";
      commissionRate?: number;
      omissionRate?: number;
      rtMedianGoMs?: number;
      rtP90GoMs?: number;
    }
  | {
      task: "nBack";
      dPrime?: number;          // recommended
      levelReached?: number;
      lureRate?: number;
    }
  | {
      task: "taskSwitch";
      switchCostMs?: number;
      switchCostAcc?: number;
      perseverationRate?: number;
      rtMedianSwitchMs?: number;
      rtMedianRepeatMs?: number;
      accSwitch?: number;
      accRepeat?: number;
    }
  | {
      task: "sart";
      lapseRate?: number;
      vigilanceDrop?: number;   // delta late - early (negative = worse)
    };

export type KpiEventBase = {
  name: KpiEventName;
  ts: number;                 // Date.now()
  userId?: string;            // if available
  arenaId: ArenaId;
  moduleId: string;           // arena module config id
  variantId?: string;         // A/B variants
  sessionContext: SessionContext;
  language: string;           // e.g. "ro", "en"
  deviceType: DeviceType;
  fpsBucket: FpsBucket;

  durationMs?: number;
  difficulty?: Record<string, number | string | boolean>; // e.g. { nBackLevel: 2 }

  attemptIndexToday?: number;
  attemptIndexAllTime?: number;

  pressureMode?: PressureMode;

  // only meaningful on completed:
  selfRatedConfidence?: 1 | 2 | 3 | 4 | 5;
};

export type KpiEvent =
  | (KpiEventBase & { name: "arena_run_started" })
  | (KpiEventBase & { name: "arena_run_abandoned"; reason?: "user_exit" | "timeout" | "app_background" })
  | (KpiEventBase & { name: "arena_run_error"; errorCode?: string })
  | (KpiEventBase & {
      name: "arena_run_completed";
      kpiStd: KpiStd;
      kpiTask: KpiTaskSpecific;
      // Optional compact distribution summary (avoid raw arrays in Firestore):
      rtHistogram?: { bucketMs: number; counts: number[] }; // e.g. 10 buckets
    })
  | (KpiEventBase & {
      name: "arena_trial";
      trialIndex: number;
      rtMs?: number;
      correct?: boolean;
      stimulusTag?: string; // congruent/incongruent, go/nogo, switch/repeat
    });

2.3 Persistență recomandată

Persistă ArenaRun (1 doc per run) cu kpiStd, kpiTask, metadata + summary distribution

KpiEvent poate fi:

fie log în collection de telemetry (opțional)

fie doar folosit intern pentru calcul + debugging (minimize cost)

3) Trait Engine — pseudo-code (acute vs baseline + delta)
3.1 Trait channels (canon)

inhibitoryControl

workingMemory

flexibility

sustainedAttention

stressReactivity (derivat, opțional în V1)

3.2 Normalizare (cheie)

Toate KPI-urile au unități diferite (ms, rate). Trebuie normalize:

pentru rate: higher is better (acc), lower is better (errRate, lapse)

pentru ms: lower is better (rtMedian, p90, interference, switchCost)

pentru slopes: positive rtSlope = oboseală; negative/near 0 = bine

Recomandare simplă V1:

folosești z-score robust pe baza baseline user (median/IQR) când există suficient N

altfel folosești clamp + scale cu praguri empirice (bootstrapping)

3.3 Pseudo-code
type TraitKey =
  | "inhibitoryControl"
  | "workingMemory"
  | "flexibility"
  | "sustainedAttention"
  | "stressReactivity";

type TraitScore = {
  trait: TraitKey;
  acute: number;      // 0..100
  baseline: number;   // 0..100
  delta: number;      // acute - baseline
  confidence: "low" | "medium" | "high"; // based on N runs
  nBaselineRuns: number;
  nAcuteRuns: number;
};

type ArenaRun = {
  arenaId: ArenaId;
  ts: number;
  pressureMode?: PressureMode;
  kpiStd: KpiStd;
  kpiTask: KpiTaskSpecific;
};

const MIN_BASELINE_RUNS = 8; // per trait, rolling
const BASELINE_WINDOW_DAYS = 30; // only as a max filter; primary is N runs
const ACUTE_WINDOW_HOURS = 24;

function computeTraitScores(runs: ArenaRun[], nowTs: number): TraitScore[] {
  const acuteRuns = runs.filter(r => nowTs - r.ts <= ACUTE_WINDOW_HOURS * 3600_000);
  const baselineRuns = runs.filter(r => nowTs - r.ts <= BASELINE_WINDOW_DAYS * 24 * 3600_000);

  // 1) Build per-trait feature sets from runs
  const featuresAcute = extractTraitFeatures(acuteRuns);
  const featuresBase = extractTraitFeatures(baselineRuns);

  // 2) For each trait, select last N valid runs for baseline (rolling N)
  const perTraitBase = selectRollingNRunsPerTrait(baselineRuns, MIN_BASELINE_RUNS);

  // 3) Compute baseline distribution stats (median/IQR) for each feature
  const baseStats = computeRobustStats(perTraitBase); // median & IQR per feature

  // 4) Score acute and baseline
  return (["inhibitoryControl","workingMemory","flexibility","sustainedAttention","stressReactivity"] as TraitKey[])
    .map(trait => {
      const acuteFeat = featuresAcute[trait];     // numeric features for trait
      const baseFeat  = featuresBase[trait];

      const nBase = perTraitBase[trait]?.length ?? 0;
      const nAcute = acuteFeat?.nRuns ?? 0;

      const confidence = nBase >= 12 ? "high" : nBase >= 8 ? "medium" : "low";

      const baselineScore = nBase >= MIN_BASELINE_RUNS
        ? scoreFromBaseline(baseFeat, baseStats[trait])    // robust z => 0..100
        : scoreFromPriors(baseFeat, trait);                // clamp/scale priors

      const acuteScore = nBase >= MIN_BASELINE_RUNS
        ? scoreFromBaseline(acuteFeat, baseStats[trait])
        : scoreFromPriors(acuteFeat, trait);

      return {
        trait,
        acute: round1(clamp01to100(acuteScore)),
        baseline: round1(clamp01to100(baselineScore)),
        delta: round1(acuteScore - baselineScore),
        confidence,
        nBaselineRuns: nBase,
        nAcuteRuns: nAcute,
      };
    });
}

/**
 * Extract trait features per run, aggregated.
 * Keep it small: medians + tail proxies + error proxies + fatigue proxies.
 */
function extractTraitFeatures(runs: ArenaRun[]) {
  // Example: aggregate by arenaId
  // For each trait, define feature vector:
  // inhibitory: (stroop interferenceMs, goNoGo commissionRate, rtP90, errRate)
  // workingMemory: (nBack dPrime, levelReached, rtSlope, accSlope)
  // flexibility: (switchCostMs, perseverationRate)
  // sustainedAttention: (lapseRate, cvRT, vigilanceDrop)
  // stressReactivity: delta tail under time-pressure vs normal (if both exist)
}

function scoreFromBaseline(features, stats) {
  // For each feature:
  // robustZ = (x - median) / (IQR + eps)
  // convert to a bounded component score (e.g., sigmoid)
  // weight features (sum weights = 1)
  // map to 0..100
}

function scoreFromPriors(features, trait) {
  // Use pragmatic thresholds for V1:
  // e.g. interferenceMs: 0..250ms, commissionRate: 0..0.35, lapseRate: 0..0.25, etc.
  // Convert to 0..100 with clamp and simple curves
}

3.4 Trait mapping (concret, minim V1)

inhibitoryControl uses:

stroop interferenceMs (lower better)

goNoGo commissionRate (lower better)

rtP90Ms (lower better) as tail-control proxy

workingMemory uses:

nBack dPrime (higher better) / fallback acc

rtSlope (lower better)

flexibility uses:

switching switchCostMs (lower better)

perseverationRate (lower better)

sustainedAttention uses:

sart lapseRate (lower better)

cvRT (lower better)

vigilanceDrop (higher better / less negative)

stressReactivity (optional):

compare rtP90Ms + errRate în time-pressure vs normal

4) Recomandare (hook minim pentru TodayPlan)

Nu implementa un motor complex în Etapa 1, dar pregătește semnalele.

Regulă simplă:

dacă inhibitoryControl.delta < -X sau stressReactivity.delta < -X → recomandă micro-drill “downshift”

dacă sustainedAttention.delta < -X → micro-drill “focus stabilization”

dacă workingMemory.delta < -X → micro-drill “chunking / update”

dacă flexibility.delta < -X → micro-drill “reframe / rule-switch prime”

5) Etape implementare (strict)
Etapa 1 — Canon + metrici

Finalizează Micro-Stroop scoring:

interferenceMs, rt percentiles, cvRT, abandon logic

Adaugă Go/No-Go

Implement KpiEvent schema + persist ArenaRun (completed/abandoned)

Agregare minimă “daily summary” (attemptIndex, last score)

Etapa 2 — Trait engine + baseline rolling

Build traitScores (acute/baseline/delta + confidence)

Persist daily trait snapshot

TodayPlan uses deficit signals

Etapa 3 — Product loop

Boss + badges + proof-of-progress + upsell anchored în stat growth

Deliverable pentru cod (fișiere sugerate)

lib/kpi/KpiEvent.ts (types)

lib/arena/scoring/*.ts (scoring per task)

lib/traits/traitEngine.ts (computeTraitScores)

lib/traits/traitMapping.ts (feature selection + weights + priors)

lib/arena/persistArenaRun.ts (storage)

lib/arena/attemptIndex.ts (attemptIndexToday / allTime)

Note finale (ca să nu apară “paralelisme”)

Dacă ai deja ArenaRun model / store / telemetry helpers, extinde-le cu câmpurile de mai sus în loc să creezi “KpiEvent2”, “ArenaRunV2” etc.

Dacă ai deja calcul RT stats, reutilizează-l pentru toate task-urile (median/p90/IQR/CV/slope).