# OmniMental: Worlds + Tags + Portals — Canon & Implementation Plan (v1)

## Goal
Stabilizează arhitectura Flow Studio + user journey pentru 1–2 săptămâni de implementare, fără duplicări și fără haos:
- **Chunks = Worlds (experiențe/stage)**, max 8–12
- **Tags = Engines/Surface/Cluster/Gate/Type**
- **Portal nodes** pentru reutilizare cross-world (nu duplicăm pagini)
- **Today = Session Hub** (Quick/Deep/Explore), daily loop = default session (nu limită)
- **Gating** are o singură sursă de adevăr (runtime), nu “meta” în chunks

---

## Canon (non-negotiable rules)

### R1 — Chunks are Worlds only
Chunks reprezintă “lumi/levels” (unități de experiență user). Nu le folosim pentru a categorisi engines.

Worlds (target list, <=12):
- public
- entry_intro
- guided_day1
- onboarding
- daily_loop
- progress_map
- training_arenas
- curriculum_library
- module_hubs
- advanced_wizard
- account_admin_legacy
(recommendation rămâne engine; devine world doar dacă există un “Quest Board” distinct, persistent)

### R2 — Single Source of Route/Screen
Un route/ecran real există ca **un singur node real** în Flow Studio.
Orice reutilizare în alte worlds se face prin **Portal nodes** (alias/bridge), nu prin duplicare.

### R3 — Tags define Engines + Surface + Cluster + Gate + Type
Folosim `FlowNodeData.tags` cu un vocabular mic, stabil.

Tag vocabulary (standard):
- `engine:dailypath | vocab | assessment | arena | rewards | recommendation | sessionPlan`
- `surface:today | onboarding | library | map | wizard | arenas`
- `cluster:clarity | energy | flex | ...`
- `gate:progressTier>=0..5` (sau gate:tier0..tier5, dar consistent)
- `gate:membership=free|premium` (dacă e nevoie)
- `type:portal`
- `state:legacy` (pentru rute vechi)

### R4 — Canonical entry + canonical converge
- Există un “Front Door” canonic (intrarea principală).
- Guided Day1 + Onboarding trebuie să **converge** în `daily_loop` prin portal node către Today hub.
- Worlds de explorare (Arenas/Library/Wizard/Map) au întoarcere explicită (Portal back to Today/Map).

### R5 — Gating source-of-truth (runtime)
Nu bazăm gating runtime pe chunk meta. Chunk meta poate fi documentație, dar gating-ul real e determinist și centralizat.

### R6 — Daily loop is default session, not a limit
Daily loop nu blochează userul să facă mai mult.
“Today” trebuie să fie un **Session Hub**:
- Quick Loop (10–20 min)
- Deep Loop (30–60 min)
- Explore / Free Play (Arenas, Library, Wizard, Map)

Streak/XP:
- Streak se acordă pentru **orice sesiune validă** (loop/arena/wizard) peste un prag minim.
- Daily loop poate avea bonus, dar nu monopol.

---

## Implementation Plan (layered)

### Layer 1 — Flow Studio discipline (Tags + Portals + Filters)
1) Add UI support for tags:
- badge display pentru tags importante (engine/surface/type)
- filter multi-select by tags

2) Portal nodes:
- Naming convention: `PORTAL: To Today`, `PORTAL: Back to Today`, etc.
- Must have `type:portal` tag.
- Must specify target route/node.
- Portal must be visually distinct (badge + shows target).

3) Lint validations in Flow Studio:
- Node without chunkId => warning
- Portal without target => warning
- Duplicate nodes that represent same route => warning
- World with no entry/exit => warning (or info)

4) Audit snapshot export:
- chunks summary (counts, start nodes, unreachable)
- cross-chunk edges list
- lint warnings list
- export as JSON (and optionally MD)

Acceptance:
- Poți filtra: `engine:vocab` și vezi toate nodurile relevante indiferent de world.
- Poți identifica portal nodes rapid și target-ul lor.
- Export audit funcționează fără Firestore.

### Layer 2 — Today = Session Hub (Product)
1) Implement Today hub UI + routing:
- Quick (default)
- Deep
- Explore

2) Ensure no “hard lock”:
- Free user: Quick + limitat Explore (după plan)
- Premium: Quick + Deep + full Explore

3) Converge flows:
- guided_day1 ends with `PORTAL: To Today`
- onboarding ends with `PORTAL: To Today`
- wizard/library/arenas have `PORTAL: Back to Today`

Acceptance:
- User poate face Quick și apoi încă 1h în Explore fără blocaj.
- Today hub devine “home base” dar nu “cage”.

### Layer 3 — Persistent personalization (MindPacing)
- MindPacing must persist signal in progress facts/profile (nu doar localStorage).
- Signal is used for recommendation/sessionPlan selection.

Acceptance:
- refresh / new session păstrează semnalul.
- selection influențează cel puțin “recommended next”.

### Layer 4 — Tier semantics cleanup
Clarifică ambiguitatea:
- `progressTier` = 0..5 (deblocat prin progres)
- `membershipTier` = free/premium (plan/plată)

Acceptance:
- codul nu folosește același câmp/nume pentru ambele.

### Layer 5 — Tests
Unit:
- gating selectors
- tier derivation

E2E (Playwright):
- Free: entry → guided day1 → today quick
- Premium: today → deep + explore
- Wizard: enter → return to Today
- MindPacing persists after refresh

---

## Working Agreement (PR discipline)
Branch: `feat/canon-worlds-tags-portals`

Commit order suggestion:
1) docs: add this canon + vocab tags
2) flow-studio: tags badges + filters
3) flow-studio: portal node + lint + audit export
4) product: today session hub (quick/deep/explore)
5) flows: converge via portals (remove duplicates)
6) progress: mindpacing persistence
7) tests: unit + e2e
