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

Goal: a **single stable skeleton** that we stop reinventing. All UX and product experiments must live *inside* this structure, not create new flows.

---

## 1. Canonical User Journey (High-Level)

### 1.1 Stages

1. **Stage 0 – Cinematic Intro**
   - Identity, tone, promise.
   - Single CTA:  
     `Încep evaluarea și primul antrenament (~7–10 min)`

2. **Stage 1 – CAT Baseline Lite (Day 0)**
   - 4 axes from CAT v2.
   - 1 item per axis (state-based).
   - Output: `catBaseline_initial_lite`.

3. **Stage 2 – First Daily Session (Short)**
   - Daily Path style WOW (5–8 min):
     - INTRO → EXPERIENCE → MINI-REFLECTION → SUMMARY.
   - Focus: weakest axis from CAT lite + light cross-training.

4. **Stage 3 – OS Glimpse (Temples)**
   - Show only:
     - Which traits were trained.
     - Which Temple was touched (e.g. Clarity/Energy).
   - CTA → `/today`.

5. **Stage 4 – Standard Today Loop (Days 1–∞)**
   - Every time user opens the app:
     - Option A: `Sesiunea zilnică recomandată (5–10 min)` – **Daily mode**.
     - Option B: `Sesiune intensivă (30–45 min)` – **Intensive mode** (gated for free).

6. **Stage 5 – Goal Wizard (Weeks 3–4+)**
   - Late unlock, only after enough practice.
   - Maps trained traits → 1–2 real-life objectives, not at onboarding.

---

## 2. Routes & Navigation

### 2.1 Core Routes

- `/` → marketing / landing.
- `/intro` → Cinematic Intro → redirects to onboarding pipeline.
- `/onboarding`:
  - `?step=cat-lite`
  - `?step=first-session`
  - `?step=first-temple`
- `/today` → Daily + Intensive options, current Arc.
- `/temple/[traitId]` → Temple view for trait (Clarity/Energy/etc.).
- `/arenas` → Arena hub (gated).
- `/omnikuno` → lesson campaigns hub (gated).
- `/wizard/goals` → Goal Wizard (late unlock).
- `/upgrade` → Stripe / subscription.

### 2.2 Redirections

- `/intro-da-vinci` and old flows:
  - kept only as *legacy* or marketing, NOT linked from core onboarding.
- `/wizard` (old objective-first flow):
  - deprecated as entry; only accessible via `/wizard/goals` once unlocked.

---

## 3. CAT Profile v2 – 7 Axes, Staged

### 3.1 Axes

1. **Claritate cognitivă**  
   How well you define problems and separate signal from noise.

2. **Focus și continuitate**  
   Ability to sustain attention and continuity on what matters.

3. **Recalibrare după greșeli**  
   Speed of turning mistakes into concrete adjustments, without getting stuck.

4. **Energie și recuperare**  
   Perceived energy level and ability to recover resources.

5. **Flexibilitate mentală**  
   How easily you change perspective, strategy, explanations when reality demands it.

6. **Încredere adaptativă**  
   Belief that you can adapt and learn what’s needed in new contexts.

7. **Stabilitate emoțională**  
   How stable you stay under stress, pressure, uncertainty.

Each axis is represented by:
```ts
type CatAxisId =
  | "clarity"
  | "focus"
  | "recalibration"
  | "energy"
  | "flexibility"
  | "adaptiveConfidence"
  | "emotionalStability";

type CatAxisState = {
  score: number | null;      // 0–10
  confidence: "unknown" | "low" | "medium" | "high";
  lastUpdated: string | null; // ISO date
};
3.2 Item Structure
2 items per axis:

stateItem: subjective state (today / last week).

behaviorItem: typical pattern / behavior under stress.

Total full CAT = 14 items (2 × 7).

3.3 CAT in Stages
Stage A – CAT Baseline Lite (Day 0)
Axes included:

clarity, energy, emotionalStability, focus.

One stateItem per axis.

Delivered as one short screen with 4 sliders.

Output:

ts
Copy code
type CatProfile = {
  version: "v2";
  axes: Record<CatAxisId, CatAxisState>;
};

catProfile.axes = {
  clarity:           { score: n0, confidence: "low", lastUpdated: Day0 },
  energy:            { score: n1, confidence: "low", lastUpdated: Day0 },
  emotionalStability:{ score: n2, confidence: "low", lastUpdated: Day0 },
  focus:             { score: n3, confidence: "low", lastUpdated: Day0 },
  flexibility:       { score: null, confidence: "unknown", lastUpdated: null },
  adaptiveConfidence:{ score: null, confidence: "unknown", lastUpdated: null },
  recalibration:     { score: null, confidence: "unknown", lastUpdated: null }
};
Used for:

Choosing primary weak trait.

Seeding first Arc.

Stage B – Deep CAT (Days 3–7)
Interleaved micro-screens after sessions.

2 items/session max.

Goals over first week:

fill behaviorItem for initial 4 axes,

introduce flexibility, adaptiveConfidence, recalibration.

When an axis has ≥2 items answered:

Recompute score (average or weighted).

Set confidence: "medium" or "high".

Stage C – Weekly Recalibration
Once per week:

1 item/axis (last-week summary).

Used for:

catDelta_weekly (per axis),

adjusting arcs & difficulty.

4. Domains (Life Context) Without Early Goals
We personalize early by domain, not by explicit goals.

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
How they are collected:

During first week, at the end of selected sessions:

Q1: „Unde ai simțit cea mai mare tensiune în ultima vreme?” (work/personal/relatii/growth)

Q2: „Unde vrei cel mai mult să folosești exercițiul de azi?” (same set)

Each answer updates userDomains weights.
Session recommender uses these weights for context examples and module selection.

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

Free: limited (e.g. 1 / week).

Premium: practically unlimited with soft guardrails.

Content:

stack of 3–5 modules from same ecosystem (Daily Path / OmniKuno / OmniAbil).

at least one integration/real-life task.

Example SessionPlan:

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

6. WOW Modules v2 – Compliance Ladder
6.1 Compliance Levels
L1 – Micro-engagement (0–30 sec)

One slider or short question.

Minimal effort, establishes participation.

L2 – Micro-exercise (30–60 sec)

Example: 3 breaths, a short focus task.

Always preceded by a short explanation:

„De ce fac asta?” + „Ce voi simți/obține în următorul minut?”.

L3 – Full exercise (90–180 sec)

Example: full 4–6 breathing sequence, mini-Stroop, short mental drill.

6.2 Standard WOW Structure
Every WOW lesson used in initial arcs must follow:

Card 1 – Context + L1

Clear heading: „Ce facem acum”

1–2 very short lines explaining:

what the exercise is,

why it matters.

L1 engagement: slider / yes-no / 3-option choice.

Card 2 – L2/L3 Exercise

Timer visible.

Minimal instructions.

No dense paragraphs.

Card 3 – Reflection + Trait + Domain

1–2 micro questions:

„Cum te simți acum față de început?” (slider).

„În ce zonă din viață te ajută asta mai mult azi?” (domain selection).

Explicit mapping:

„Ai lucrat la: Claritate & Energie.”

WOW modules are just Daily Path lessons with stricter UX constraints and short duration, used heavily in Day 0–7.

7. Arcs, Temples, Arenas & OS
7.1 Arcs
Definition:

ts
Copy code
type ArcDifficulty = "easy" | "medium" | "hard";

type Arc = {
  id: string;                     // e.g. "clarity_01"
  name: string;                   // human label
  traitPrimary: CatAxisId;
  traitSecondary: CatAxisId[];
  lengthDays: number;             // 7 or 14
  difficulty: ArcDifficulty;
  entryRequirements: {
    minSessionsCompleted: number;
    minCatLevel?: Partial<Record<CatAxisId, number>>; // optional thresholds
  };
  moduleIds: string[];            // ordered modules per day
};
Rules:

Free users: max 1 active Arc.

Premium users: max 2–3 Arcs active (engine decides which one is surfaced on Today).

Progression:

Days 1–2: mostly WOW-style, L1/L2.

Days 3–5: more complex drills / quizzes.

Days 6–7: integration + OmniAbil mini-missions.

7.2 Temples
One Temple per key trait:

Temple of Clarity, Temple of Energy, etc.

Arcs are segments inside a Temple.

Temple progress logic:

Each completed Arc increases a trait’s Temple level.

Temple view shows:

completed arcs,

current active arc,

next recommended arc.

7.3 Arenas
Dedicated section for:

executive control, Stroop-type tasks,

ambiguity tolerance, etc.

Gated features (strong premium driver).

Arena run:

ts
Copy code
type ArenaRun = {
  id: string;
  arenaId: string;        // e.g. "executive_control"
  timestamp: string;
  scoreRaw: number;       // task-specific score
  scoreNormalized: number;// 0–100 normalized to population
  traitImpact: CatAxisId[];
};
Free:

1 demo run per arena.

Premium:

full access, history, comparisons.

8. Monetization & Gating (Stripe)
8.1 User Subscription Model
ts
Copy code
type SubscriptionStatus = "free" | "trial" | "premium";

type UserProfile = {
  id: string;
  subscription: {
    status: SubscriptionStatus;
    provider: "stripe";
    currentPeriodEnd?: string; // ISO
  };
  // link to catProfile, domains, arcs, stats...
};
8.2 Free vs Premium Capabilities
Free / Trial:

Cinematic Intro.

CAT Baseline Lite + staged completion.

1 Daily session / day.

1 Intensive session / week.

1 active Arc.

Temple view minimal (current arc + a few cells).

1 Arena demo run.

Limited OmniKuno access: teaser modules (e.g. 1–2 lessons/arch).

Premium:

Daily + Intensive sessions without artificial caps (within safety limits).

Multiple arcs (2–3 parallel).

Full Temples overview, arc history.

Full Arenas access + scoreboard / trends.

Full OmniKuno campaigns (full 8–12 lesson arcs).

Early Goal Wizard unlock (ex: after 10 days vs 21).

Omni-SensAI full capabilities (dynamic suggestions, advanced progress analysis).

8.3 Gating Moments
After first completed Arc (7 days)

Show weekly report + prompt:

„Vrei mai multe sesiuni / zi, Arene complete și plan avansat? → /upgrade”

Second session in one day (free user)

Block with:

„Ai făcut deja sesiunea recomandată.
Sesiunile intensive nelimitate sunt disponibile în OmniMental Premium.”

Second Arena run

After a free demo:

second run asks for Premium.

Goal Wizard activation

Basic mapping free.

Extended AI-powered mapping (Omni-SensAI) behind Premium.

9. Engines – Responsibilities
9.1 ProfileEngine
Manages:

CAT profile,

domains,

difficulty preferences,

subscription status.

Exposes:

getUserProfileSnapshot(userId): UserProfileSnapshot

ts
Copy code
type UserProfileSnapshot = {
  userId: string;
  catProfile: CatProfile;
  domains: DomainPreference[];
  subscriptionStatus: SubscriptionStatus;
  sessionsCompleted: number;
  daysActive: number;
  preferredSessionLength: "short" | "medium" | "long";
};
9.2 ArcEngine
Chooses:

current active Arc,

next Arc,

when an Arc is complete.

Uses:

CAT deltas,

sessions completed inside arc,

adherence (days with completion).

API example:

ts
Copy code
getActiveArc(user: UserProfileSnapshot): Arc | null;
getNextArcRecommendation(user: UserProfileSnapshot): Arc;
9.3 SessionRecommenderEngine
Inputs:

UserProfileSnapshot

active Arc(s)

subscription status

engagement stats (time of day, dropout).

Outputs:

SessionPlan for /today:

Daily or Intensive plan,

modules, trait focus, domain context.

API:

ts
Copy code
getTodayPlan(user: UserProfileSnapshot): SessionPlan;
getIntensivePlan(user: UserProfileSnapshot): SessionPlan;
9.4 ContentAssemblyEngine
Takes SessionPlan.modules and builds UI lesson structure from config:

intro card,

step cards,

reflection, summary.

Unified for DailyPath and OmniKuno modules (same brick schema).

9.5 DifficultyEngine
Adjusts:

exercise depth (L1/L2/L3),

quiz complexity,

number of modules per Intensive session.

Signals:

user feedback (too_easy, too_hard, just_right),

completion vs dropouts.

9.6 RewardEngine
XP, badges, streaks.

Trait-level progress labels (e.g. „Clarity: +2 vs baseline”).

9.7 OmniKunoEngine
Runs structured learning arcs with:

INTRO → LEARN → QUIZ → SIMULATOR → AUTONOMY → SUMMARY.

Viewed as a special type of SessionPlan with more learning-heavy modules.

Integrated into ArcEngine (OmniKuno arcs can be used as Arcs, not separate world).

9.8 OmniAbilEngine
Manages real-world missions:

exposure tasks,

behavior change tasks.

Connects to:

Arc’s final days,

Intensive sessions that end with missions.

9.9 ArenaEngine
Runs concentrated performance tasks:

Stroop, delay discounting, etc.

Outputs normalized scores and mapping to CAT traits.

10. Omni-SensAI – AI Mentorship Layer
Omni-SensAI is not a separate UX mode only; it is the AI orchestration brain sitting on top of all engines.

10.1 Roles
Observer

Reads:

UserProfileSnapshot,

CAT history & deltas,

Arc progression,

session feedback (hard/easy/boring),

domains usage.

Orchestrator

Calls:

SessionRecommenderEngine with nuanced parameters,

ArcEngine for next arcs,

DifficultyEngine for progression.

Decides:

whether to propose Daily vs Intensive,

when to surface Goal Wizard,

when to slow down or simplify.

Mentor (Conversational)

Offers:

explanations of what is happening („de ce te simți mai obosit azi”),

reframing („nu ești leneș, ești suprasolicitat energetic”),

micro-coaching around progress and setbacks.

10.2 Integration in Flow
Onboarding

Uses CAT lite + 1–2 domain questions to form UserProfileSnapshot_initial.

Selects first Arc.

Daily / Intensive Plan

When user lands on /today, Omni-SensAI has already:

chosen SessionPlan,

determined copy like „Astăzi lucrăm pe Claritate în context de job (7 min).”

Adaptive Loop

After each session:

uses signals to adjust difficulty and future plans.

Visual Map & Reports

Curates what’s shown:

trait improvements,

domain distribution (job/personal/relatii/growth),

arcs completed.

11. Goal Wizard (Late Unlock)
11.1 Unlock Conditions
Example (tunable constants):

ts
Copy code
const GOAL_WIZARD_UNLOCK = {
  minSessionsCompleted: 15,
  minDaysActive: 10,
  minCatConfidence: 2 // e.g. at least 2 axes with confidence "medium"
};
11.2 Wizard Structure
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

Omni-SensAI links:

selected goal → required traits & arcs.

Example:

Work + performance → Claritate + Focus arcs, Energy support.

Goal data model:

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
12. Implementation Notes
All new logic must conform to this v4 architecture.

Legacy flows (intro-da-vinci, old wizard entry) to be clearly tagged as deprecated in code and hidden from core user paths.

Engines should be implemented as separate service modules (pure or mostly pure logic), not tangled in React components.

Configs for Arcs, modules, CAT items, and domains must be stored in config/ and validated by scripts (existing validator pipeline extended to v4 schema).

This document is the reference for:

onboarding flows,

engine interactions,

gating strategy,

Omni-SensAI integration.

All future changes should be extensions or parameter tweaks of this skeleton, not new parallel architectures.