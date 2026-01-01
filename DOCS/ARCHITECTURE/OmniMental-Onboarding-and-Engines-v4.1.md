# OmniMental Onboarding & Engines – v4
DOCS/ARCHITECTURE/OmniMental-Onboarding-and-Engines-v4.md

## 0. Purpose & Scope

This document defines the **canonical v4 architecture** for:

- First-contact onboarding (cinematic → CAT → first training).
- Daily & intensive training flows.
- CAT profile v2 (7 axes, staged).
- Arcs, Temples, Arenas, OmniKuno / OmniAbil / OmniScope integration.
- Gating + Stripe subscription strategy.
- Engine-level responsibilities.
- Omni-SensAI as AI orchestration layer.
- Compatibility with the Core Canon and existing Wizard / Need Survey data.

Goal: a **single stable skeleton**. All UX and product experiments must live *inside* this structure, not create new parallel flows.

---

## 1. Canonical User Journey (High-Level)

### 1.1 Stages

1. **Stage 0 – Cinematic Intro**
   - Identity, tone, promise.
   - Single CTA:  
     `Încep evaluarea și primul antrenament (~7–10 min)`

2. **Stage 1 – CAT Baseline Lite + Quick Task (Day 0)**
   - 4 CAT axes (self-report sliders).
   - 1 short digital cognitive task (baseline KPI).
   - Output:
     - `catBaseline_initial_lite`
     - `kpiBaseline_initial` (from the digital task).

3. **Stage 2 – First Daily Session (Short)**
   - Daily Path style WOW (5–8 min):
     - INTRO → EXPERIENCE → MINI-REFLECTION → SUMMARY.
   - Focus: weakest axis from CAT lite + light cross-training.
   - Emits both trait-level and KPI signals (self-report + task where applicable).

4. **Stage 3 – OS Glimpse (Temples)**
   - Show only:
     - Which traits were trained.
     - Which Temple was activated (e.g. Clarity/Energy).
   - CTA → `/today`.

5. **Stage 4 – Standard Today Loop (Days 1–∞)**
   - Every time user opens the app:
     - Option A: `Sesiunea zilnică recomandată (5–10 min)` – **Daily mode**.
     - Option B: `Sesiune intensivă (30–45 min)` – **Intensive mode** (gated for free).

6. **Stage 5 – Goal Wizard (Weeks 3–4+)**
   - Late unlock, only after enough practice.
   - Maps trained traits → 1–2 real-life objectives, not at onboarding.

---

## 1.b Alignment with Core Canon (Domains & KPIs)

Core Canon domains (from `Omnimental-core CANON-v1.0-Final.md`) remain the primary mental capacity pillars:

1. **Control executiv**
2. **Claritate decizională**
3. **Reglare emoțională**
4. **Energie funcțională**

v4 does **not** introduce new core domains.  
The CAT v2 axes are **measurement sub-facets**, mapped onto the four Canon domains as follows:

| CAT v2 axis              | Description (short)                                           | Canon domain mapping                                       |
|--------------------------|---------------------------------------------------------------|------------------------------------------------------------|
| Claritate cognitivă      | Define problems, separate signal from noise                  | Claritate decizională (primary), Control executiv (support) |
| Focus și continuitate    | Maintain attention and continuity                            | Control executiv (primary)                                 |
| Recalibrare după greșeli | Turn mistakes into concrete adjustments                      | Control executiv + Reglare emoțională                      |
| Energie și recuperare    | Perceived energy + recovery                                  | Energie funcțională (primary)                              |
| Flexibilitate mentală    | Switch perspective / strategy when reality changes           | Control executiv + Claritate decizională                   |
| Încredere adaptativă     | Belief in ability to adapt & learn in new contexts           | Meta-construct; informed by all four Canon domains         |
| Stabilitate emoțională   | Emotional stability under stress/uncertainty                 | Reglare emoțională (primary)                               |

Implementation rule:

- All CAT-related logic stores both:
  - `catAxisId` (fine-grained),
  - `canonDomainId` (one of the 4 core domains).
- No Canon version bump is required; v4 increases **measurement resolution**, not the number of fundamental domains.

KPIs:

- Every digital task is tagged with:
  - `indicatorId` (unique KPI id),
  - `canonDomainId`,
  - `catAxisIds[]` (sub-facets it informs).

---

## 2. Routes & Navigation

### 2.1 Core Routes

- `/` → marketing / landing.
- `/intro` → Cinematic Intro → redirects to onboarding pipeline.
- `/onboarding`:
  - `?step=cat-lite`
  - `?step=quick-task`
  - `?step=first-session`
  - `?step=first-temple`
- `/today` → Daily + Intensive options, current Arc.
- `/temple/[traitId]` → Temple view for trait (Clarity/Energy/etc.).
- `/arenas` → Arena hub (gated).
- `/omnikuno` → lesson campaigns hub (gated).
- `/wizard/goals` → Goal Wizard (late unlock).
- `/upgrade` → Stripe / subscription.

### 2.2 Legacy Routes & Deprecation

- `/intro-da-vinci` and old flows:
  - kept only as *legacy* or marketing, NOT linked from core onboarding.
- `/wizard` (old objectives-first flow):
  - deprecated as entry,
  - data is ingested into `ProfileEngine` (see §11),
  - user-facing access only via `/wizard/goals` when unlocked.

---

## 3. CAT Profile v2 – 7 Axes, Staged

### 3.1 Axes Definitions

```ts
type CatAxisId =
  | "clarity"
  | "focus"
  | "recalibration"
  | "energy"
  | "flexibility"
  | "adaptiveConfidence"
  | "emotionalStability";

type CanonDomainId =
  | "executiveControl"
  | "decisionalClarity"
  | "emotionalRegulation"
  | "functionalEnergy";

type CatAxisState = {
  score: number | null;      // 0–10
  confidence: "unknown" | "low" | "medium" | "high";
  lastUpdated: string | null; // ISO date
  canonDomain: CanonDomainId;
};
Each CAT axis is configured with a fixed canonDomain mapping per §1.b.

3.2 Item Structure
2 items per axis:

stateItem: subjective state (today / last week).

behaviorItem: typical pattern under stress.

Total full CAT = 14 items (2 × 7).

3.3 CAT in Stages
Stage A – CAT Baseline Lite (Day 0)
Axes included:

clarity, energy, emotionalStability, focus.

One stateItem per axis. Delivered as one short screen with 4 sliders.

Output:

ts
Copy code
type CatProfile = {
  version: "v2";
  axes: Record<CatAxisId, CatAxisState>;
};

catProfile.axes = {
  clarity:            { score: n0, confidence: "low", lastUpdated: Day0, canonDomain: "decisionalClarity" },
  energy:             { score: n1, confidence: "low", lastUpdated: Day0, canonDomain: "functionalEnergy" },
  emotionalStability: { score: n2, confidence: "low", lastUpdated: Day0, canonDomain: "emotionalRegulation" },
  focus:              { score: n3, confidence: "low", lastUpdated: Day0, canonDomain: "executiveControl" },
  flexibility:        { score: null, confidence: "unknown", lastUpdated: null, canonDomain: "executiveControl" },
  adaptiveConfidence: { score: null, confidence: "unknown", lastUpdated: null, canonDomain: "decisionalClarity" },
  recalibration:      { score: null, confidence: "unknown", lastUpdated: null, canonDomain: "executiveControl" },
};
Usage:

Choose primary weak trait.

Seed first Arc.

Stage A.1 – Day 0 Quick Cognitive Task
Immediately after sliders:

Short digital task tagged as executive-control KPI (e.g. simplified Stroop-like, flanker, or delay-choice micro-task).

Duration target: 60–90 sec.

Outputs numeric indicator:

ts
Copy code
type KpiBaseline = {
  indicatorId: string;          // e.g. "exec_control_quick_v1"
  canonDomain: CanonDomainId;   // e.g. "executiveControl"
  preValue: null;
  postValue: number;            // score from task
  timestamp: string;
};
This fulfills the Canon rule: baseline must include at least one digital KPI task, self-report is supplemental.

Stage B – Deep CAT (Days 3–7)
Interleaved micro-screens after sessions.

Max 2 items/session.

Goals for first week:

add behaviorItem for initial 4 axes,

introduce flexibility, adaptiveConfidence, recalibration.

When an axis has ≥2 items answered:

Recompute score (average or weighted).

Set confidence to "medium" or "high".

Stage C – Weekly Recalibration
Once per week:

1 item / axis (last-week summary).

Used for:

catDelta_weekly per axis,

Arc & difficulty adjustment.

4. Domains (Life Context) & Qualitative Inputs
Personalization in early weeks is by domain and qualitative intent, not hard goals.

4.1 Domains
ts
Copy code
type DomainId = "work" | "personal" | "relationships" | "growth";

type DomainPreference = {
  domainId: DomainId;
  weight: number;          // 0–1, normalized
  lastMentioned: string;   // ISO date
};
Collection:

ts
Copy code
userDomains: DomainPreference[];
Collection mechanics:

During first week, at the end of selected sessions:

Q1: „Unde ai simțit cea mai mare tensiune în ultima vreme?”
→ domain

Q2: „Unde vrei cel mai mult să folosești exercițiul de azi?”
→ domain

Each answer updates userDomains weights.

4.2 Reuse of Wizard / Need Survey Signals
Existing Wizard pipeline already collects:

Free-text intent.

Need tags (channels, focus areas).

Urgency sliders.

Self-efficacy / confidence ratings.

v4 does not discard these. Instead:

ts
Copy code
type IntentSnapshot = {
  textSummary: string;             // cleaned free-text intent
  tags: string[];                  // need categories / channels
  urgency: number | null;          // 0–10
  confidence: number | null;       // 0–10
  createdAt: string;
};
Mapping:

Need tags → DomainId weights (work/personal/relationships/growth).

Urgency → training intensity hints for DifficultyEngine.

Confidence → influences adaptiveConfidence initialization & messaging in Omni-SensAI.

Free-text summary → used by AI mentor for more human explanations.

ProfileEngine will:

Ingest legacy Wizard / Need Survey if present,

Merge it with early domain-weight answers into a unified userDomains + intentSnapshot.

5. Daily vs Intensive Modes
5.1 Session Types
ts
Copy code
type SessionType = "daily" | "intensive" | "arena" | "wizard" | "omnikuno";
5.2 Daily Mode (5–10 min)
Frequency: recommended 1×/day.

Content:

1 module (Daily Path style) per session.

Trait focus:

~70% time → primary weak trait (from CAT),

~30% → cross-training.

UX:

/today default CTA:

Sesiunea zilnică recomandată (5–10 min)

5.3 Intensive Mode (30–45 min, max 60)
Frequency:

Free: limited (e.g. 1/week).

Premium: practically unlimited with soft guardrails.

Content:

stack of 3–5 modules from same ecosystem (Daily Path / OmniKuno / OmniAbil),

at least one integration/real-life task,

at least one KPI-emitting piece (short task or structured drill).

Example:

ts
Copy code
type SessionPlan = {
  type: SessionType;            // "daily" | "intensive" | ...
  arcId: string | null;
  modules: string[];            // module IDs
  expectedDurationMinutes: number;
  traitPrimary: CatAxisId | null;
  traitSecondary: CatAxisId[];
  domainContext: DomainId | null;
};
UX:

Secondary CTA on /today:

Vreau o sesiune intensivă azi (30–45 min)

### 5.x. Trait mapping & XP rules în v4.1

Implementarea v4.1 respectă Canonul CAT prin următoarele reguli tehnice:

1. Fiecare modul WOW definit în `config/wowLessonsV2.ts` include:
   - `traitPrimary: CATAxisKey` (obligatoriu),
   - `traitSecondary?: CATAxisKey` (opțional).

2. Planner-ul de sesiuni (v4 SessionRecommender + ArcEngine):
   - folosește arcurile (`config/arcs.ts`) doar ca motor de secvențiere (ce modul vine în ce zi),
   - nu scrie direct în scorurile CAT.

3. La finalul fiecărei sesiuni de antrenament:
   - se emite `SessionTelemetry` cu `moduleId`, `arcId`, `traitPrimary` și XP-ul atribuit,
   - funcțiile de update de profil scriu XP DOAR în `xpByTrait[traitPrimary]`.

4. Scorurile CAT (profilul pe 7 axe) sunt actualizate doar de:
   - evaluări explicite (CAT Lite, CAT complet),
   - Arene și sarcini cognitive definite ca instrumente de măsurare în Canon,
   - eventuale funcții de recalibrare aprobate (ex.: „profile update vX” care combină scoruri de evaluare + istoric de training).

5. Raportarea de progres în `/admin/v4-debug` și în interfața userului:
   - afișează separat:
     - scoruri CAT (măsurare),
     - XP / volum de antrenament per trăsătură (training),
   - nu confundă XP-ul cu scorul CAT.

Aceste reguli fac ca arhitectura v4.1 să fie compatibilă cu cercetarea (scoruri interpretabile pe axe) și, în același timp, să păstreze flexibilitatea narativă și de design a modulelor WOW.


6. WOW Modules v2 – Compliance Ladder + KPIs
6.1 Compliance Levels
L1 – Micro-engagement (0–30 sec)

One slider or short question.

Minimal effort, establishes participation.

L2 – Micro-exercise (30–60 sec)

Example: 3 breaths, a short focus task.

Always preceded by short explanation:

what we do, why it matters in the next minute.

L3 – Full exercise (90–180 sec)

Example: 4–6 breathing protocol, mini-Stroop, short mental drill.

6.2 Standard WOW Structure
Every WOW lesson used in initial arcs must follow:

Card 1 – Context + L1

Heading: „Ce facem acum”

1–2 short lines:

what the exercise is,

why it matters.

L1 engagement: slider / yes-no / 3-option question.

Card 2 – L2/L3 Exercise

Timer visible.

Minimal instructions.

If the exercise is a KPI task, it must emit KpiEvent (see below).

If purely experiential (e.g. slow breathing), it must emit self-report signals.

Card 3 – Reflection + Trait + Domain

1–2 micro questions:

„Cum te simți acum față de început?” (slider).

„În ce zonă din viață te ajută asta mai mult azi?” (domain selection).

Explicit mapping:

„Ai lucrat la: Claritate & Energie (Canon: Claritate decizională + Energie funcțională).”

6.3 WOW → KPI & Trait Instrumentation
All modules (including WOW) must emit a telemetry payload:

ts
Copy code
type TraitSignal = {
  trait: CatAxisId;
  canonDomain: CanonDomainId;
  deltaSelfReport?: number;   // post - pre subjective change
  confidence: "low" | "medium" | "high";
};

type KpiEvent = {
  userId: string;
  indicatorId: string;        // e.g. "exec_control_micro_stroop_v1"
  source: "wow" | "arena" | "omnikuno" | "daily" | "intensive";
  canonDomain: CanonDomainId;
  catAxes: CatAxisId[];
  preValue?: number | null;   // if pre-task measurement exists
  postValue: number | null;   // numeric KPI result
  delta?: number | null;      // post - pre
  selfReport?: number | null; // e.g. perceived difficulty 1–10
  timestamp: string;
};

type SessionTelemetry = {
  sessionId: string;
  userId: string;
  sessionType: SessionType;
  arcId?: string | null;
  traitSignals: TraitSignal[];
  kpiEvents: KpiEvent[];
};
This keeps WOW modules grounded in measurable indicators, not just „feel-good” flows.

7. Arcs, Temples, Arenas & OS
7.1 Arcs
ts
Copy code
type ArcDifficulty = "easy" | "medium" | "hard";

type Arc = {
  id: string;                     // e.g. "clarity_01"
  name: string;
  canonDomain: CanonDomainId;     // primary Canon domain
  traitPrimary: CatAxisId;
  traitSecondary: CatAxisId[];
  lengthDays: number;             // 7 or 14
  difficulty: ArcDifficulty;
  entryRequirements: {
    minSessionsCompleted: number;
    minCatLevel?: Partial<Record<CatAxisId, number>>;
  };
  moduleIds: string[];            // ordered modules per day
};
Rules:

Free: max 1 active Arc.

Premium: max 2–3 active Arcs (but only one surfaced on Today).

Arc progression:

Days 1–2: WOW-style, L1/L2 heavy.

Days 3–5: more complex drills / quizzes / KPIs.

Days 6–7: integration + OmniAbil missions + Arena or KPI-heavy piece.

7.2 Temples
One Temple per Canon domain:

Temple of Executive Control

Temple of Decisional Clarity

Temple of Emotional Regulation

Temple of Functional Energy

Arcs are segments inside Temples.

Temple progress:

Each completed Arc increments domain-level Temple level.

Temple view shows:

completed arcs,

active arc,

recommended next arc.

7.3 Arenas
Dedicated space for KPI-heavy performance tasks:

executive control (Stroop-like),

ambiguity tolerance,

delay discounting, etc.

Arena run:

ts
Copy code
type ArenaRun = {
  id: string;
  arenaId: string;             // e.g. "executive_control"
  timestamp: string;
  indicatorId: string;
  scoreRaw: number;
  scoreNormalized: number;     // 0–100
  canonDomain: CanonDomainId;
  catAxes: CatAxisId[];
};
Free:

1 demo run per arena.

Premium:

full access, history, comparisons, progression charts.

8. Monetization & Gating (Stripe)
8.1 User Subscription Model
ts
Copy code
type SubscriptionStatus = "free" | "trial" | "premium";

type UserSubscription = {
  status: SubscriptionStatus;
  provider: "stripe";
  currentPeriodEnd?: string; // ISO
};

type UserProfile = {
  id: string;
  subscription: UserSubscription;
  // links to catProfile, domains, arcs, stats...
};
8.2 Free vs Premium Capabilities
Free / Trial:

Cinematic Intro.

CAT Baseline Lite + staged completion.

Day 0 quick KPI task.

1 Daily session / day.

1 Intensive session / week.

1 active Arc (easy or medium).

Minimal Temple view (current arc + a few cells).

1 Arena demo run.

Limited OmniKuno access (teaser modules).

Basic Omni-SensAI guidance (simple recommendations).

Premium:

Daily + Intensive sessions without hard caps (within safety limits).

Multiple Arcs (2–3 parallel).

Full Temples overview, arc history.

Full Arenas access + score trends.

Full OmniKuno campaigns (8–12 lesson arcs).

Early Goal Wizard unlock (e.g. after 10 days vs 21).

Omni-SensAI full capabilities:

adaptive difficulty,

dynamic scheduling,

deep progress explanations.

8.3 Gating Moments
After first completed Arc (7 days)
Weekly report + prompt:

„Vrei mai multe sesiuni / zi, Arene complete și plan avansat? → /upgrade”

Second session in one day (free user)

Block with:

„Ai făcut deja sesiunea recomandată. Sesiunile intensive nelimitate sunt în OmniMental Premium.”

Second Arena run

After free demo, second run → Premium prompt.

Goal Wizard activation

Basic mapping free.

Extended AI-assisted mapping behind Premium.

9. Engines – Responsibilities
9.1 ProfileEngine
Manages:

CAT profile,

domains,

intent snapshots (from Wizard / Need Survey),

subscription status,

difficulty preferences.

Exposes:

ts
Copy code
type UserProfileSnapshot = {
  userId: string;
  catProfile: CatProfile;
  domains: DomainPreference[];
  intentSnapshot?: IntentSnapshot | null;
  subscriptionStatus: SubscriptionStatus;
  sessionsCompleted: number;
  daysActive: number;
  preferredSessionLength: "short" | "medium" | "long";
};
9.2 ArcEngine
Chooses:

active Arc(s),

next Arc,

arc completion.

Uses:

CAT deltas (by axis & Canon domain),

sessions completed inside arcs,

adherence (days with completion).

APIs:

ts
Copy code
getActiveArc(user: UserProfileSnapshot): Arc | null;
getNextArcRecommendation(user: UserProfileSnapshot): Arc;
9.3 SessionRecommenderEngine
Inputs:

UserProfileSnapshot

active Arc(s)

subscription status

engagement stats (time of day, dropout patterns).

Outputs:

SessionPlan for /today, either Daily or Intensive.

APIs:

ts
Copy code
getTodayPlan(user: UserProfileSnapshot): SessionPlan;
getIntensivePlan(user: UserProfileSnapshot): SessionPlan;
9.4 ContentAssemblyEngine
Takes SessionPlan.modules and builds UI lesson structure from config:

intro card,

steps,

reflection,

summary.

Unified for DailyPath and OmniKuno (same brick schema).

9.5 DifficultyEngine
Adjusts:

exercise depth (L1/L2/L3),

quiz complexity,

number of modules per Intensive session.

Driven by:

user feedback (too_easy, too_hard, just_right),

completion vs dropouts,

urgency/confidence from IntentSnapshot.

9.6 RewardEngine
XP, badges, streaks.

Trait-level labels (e.g. „Claritate: +2 vs baseline”).

Domain-level stats (how much work/personal/relationships/growth).

9.7 OmniKunoEngine
Runs structured learning arcs with:

INTRO → LEARN → QUIZ → SIMULATOR → AUTONOMY → SUMMARY.

Treated as a special SessionPlan type with higher LEARN/QUIZ density.

Integrated with ArcEngine (OmniKuno arcs are just Arcs with educational emphasis).

9.8 OmniAbilEngine
Manages real-world missions:

behavior tasks, exposure, experiments.

Connected to:

final days of arcs,

intensive sessions.

9.9 ArenaEngine
Runs cognitive KPIs (Stroop-like, etc.).

Outputs ArenaRun and KpiEvent.

10. Omni-SensAI – AI Mentorship Layer
Omni-SensAI is the AI coordination layer on top of all engines.

10.1 Roles
Observer

Reads:

UserProfileSnapshot,

CAT history & deltas,

Arc progression,

session telemetry (KPI + self-report),

IntentSnapshot and domain weights.

Orchestrator

Calls:

SessionRecommenderEngine,

ArcEngine,

DifficultyEngine.

Decides:

Daily vs Intensive suggestions,

when to surface Goal Wizard,

when to slow down / simplify.

Mentor (Conversational)

Explains:

what is happening (state, fatigue, clarity),

reframes difficulties,

provides micro-coaching linked to KPIs and traits.

10.2 Integration Points
Onboarding:
Uses CAT lite + quick task + any Wizard/Need data to form UserProfileSnapshot_initial and pick first Arc.

Today:
Before rendering /today, Omni-SensAI has a SessionPlan ready with copy like
„Astăzi lucrăm pe Claritate în context de job (~7 min).”

Adaptive Loop:
After each session, uses SessionTelemetry to update profile and future plans.

Reports & Map:
Decides which changes to highlight (e.g. „Clarity +2 in 3 weeks”, „Most training in job domain”).

11. Goal Wizard (Late Unlock) & Legacy Wizard Integration
11.1 Unlock Conditions
Example constants:

ts
Copy code
const GOAL_WIZARD_UNLOCK = {
  minSessionsCompleted: 15,
  minDaysActive: 10,
  minCatAxesWithMediumConfidence: 2
};
11.2 Goal Wizard Structure
Choose main domain:

work / personal / relationships / growth.

Choose objective type:

performance,

stress/anxiety reduction,

energy/recovery,

relationships quality.

Define simple behavioral marker:

„45 min/zi focus fără întreruperi”

„Adorm în < 20 min”

„2 discuții săptămânale fără escaladare”.

AI mapping:

Omni-SensAI links goal → traits → arcs.

ts
Copy code
type UserGoal = {
  id: string;
  domain: DomainId;
  goalType: "performance" | "stress" | "energy" | "relationships";
  behaviorMarker: string;
  createdAt: string;
  active: boolean;
};
11.3 Legacy Wizard Data Migration
Existing components and logic (WizardRouter, Need Survey, scoring) are not discarded. v4 includes a compatibility layer:

On first run in v4:

If old wizard data exists:

parse intent text, tags, urgency, confidence;

create IntentSnapshot and update userDomains.

Existing scores from lib/scoring.ts / lib/recommendation.ts:

mapped to:

initial Arc recommendations,

initial trait emphasis (e.g. weighting Claritate vs Energie arcs).

/wizard route:

remains available only for legacy users until migration completes.

new onboarding does not direct users there.

post-migration, /wizard simply redirects to /wizard/goals using v4 Goal Wizard.

12. Implementation Notes
v4 is aligned with the Core Canon:

no new fundamental domains,

at least one Day 0 digital KPI task,

every training flow emits KPI/trait signals.

All new logic must conform to this architecture.

Legacy flows are clearly marked deprecated and hidden from first-time users.

Engines should be implemented as service modules (logic-only), consumed by React components.

Configs for Arcs, modules, CAT items, KPIs, and Domains live in config/ and are validated by existing tooling (extended for v4).

This document is the reference for:

onboarding,

engine interactions,

gating,

Omni-SensAI integration,

compatibility with Core Canon and existing Wizard/Need Survey data.

All future changes are extensions or parameter tweaks of this skeleton, not new parallel architectures.