# DOCS/ARCHITECTURE/omnimental-taxonomy-v1.md

## OmniMental Taxonomy (v1)
**Scope:** stabilește terminologia canonică + unde aparține fiecare lucru (Worlds / Zones / Journeys / Sessions / Modules / Lessons), inclusiv cum mapăm structura actuală (Flow Studio “worlds” vechi) în noua schemă.

---

## 0) North Star
OmniMental se structurează pe 3 straturi distincte, care NU se amestecă:

1) **Worlds (Competence tiers)** – nivelul de competență al utilizatorului (macro).
2) **Zones / Areas (Product surfaces)** – suprafețe funcționale din produs (UI / features).
3) **Journeys (Programs)** – trasee curatate (overlay) care folosesc Zones pentru a livra progres.

Opțional (mai târziu):
4) **Seasons** – overlay comercial/tematic peste Worlds & Journeys (nu competență).

---

## 1) Glossary (terminologie canonică)

### 1.1 Worlds (Competence)
**World = bandă de competență (macro).**  
- **INITIATION** – inițiere + familiarizare (ritual devine ușor/automat)
- **PERFORMING** – practică + performanță (măsurare + progres consistent)
- **MASTERING** – personalizare avansată + coaching (AI, planuri, adaptivitate)

> World nu este “un ecran” și nu este “o colecție de route-uri”. World e nivel de competență + intensitatea sistemelor active.

### 1.2 Zones / Areas (Product surfaces)
**Zone = arie funcțională (UI surface).** O zonă are rute + componente + logică asociată.

**Setul final (user-facing) propus: 8 Zones**  
1) **Public** (Acquisition) – landing, pagini publice, marketing
2) **Intro** – prim contact + setare direcție
3) **Sessions (Today)** – bucla zilnică (sesiuni time-based)
4) **Calibration (Assessments)** – evaluări, CAT-lite, calibrări pe nivel
5) **Progress** – progres, streak, facts, dashboards (gradual pe Worlds)
6) **Arenas (Training)** – tasks/arenas, training executiv, scoruri
7) **Library (OmniKuno)** – bibliotecă / curriculum de lecții
8) **Account & Settings** – cont, billing, setări

**Zone internă (non-user-facing):**  
9) **Admin / Studio** – Flow Studio, diagnostics, tooling intern

> Admin/Studio există, dar NU intră în schema “user product”. E tooling.

### 1.3 Journey (Program)
**Journey = program curatat**, compus din Sessions și interacțiuni în Zones.  
Ex: “Initiation – 7 zile (repetabil până la familiarizare)”.

### 1.4 Session (Unitate de timp)
**Session = unitate de timp** (de ex. 10–12 minute), poate conține:
- 1–2 Lessons (Initiation bank)
- 1 Vocab moment (opțional)
- 1 mini-checkin / self-report (opțional)
- 1 Arena taste (opțional, în Initiation)
- 1 micro “real-world action” / commit (opțional)

> Session ≠ Lesson. Session este container time-based.

### 1.5 Lesson (Unitate atomică de conținut)
**Lesson = unitate atomică livrată în Session** (ce numim azi “moduleId” în dailyPaths/WOW e semantic “LessonId”).

### 1.6 Module (Pachet de lecții)
**Module = pachet de 4–6 Lessons** (temă coerentă).  
Ex: `init_clarity_foundations` = 5 lecții.

### 1.7 Step (micro-step)
**Step = subcomponentă / pas intern** într-o Lesson sau Session (StepRunner nodes, DailyPathRunner nodes etc.)

### 1.8 Season (overlay)
**Season = overlay tematic/comercial** peste Worlds/Journeys. Nu definește competență.

---

## 2) Content Banks (2 mari, canon)

### Bank A — Initiation Content Bank (unificat)
**Conținut:** WOW + DailyPaths (unificare semantică sub “Lessons”).  
**Rol:** livrare în Sessions (Today) în World 1 (și parțial în World 2).

**Regulă:** WOW și DailyPath sunt aceeași categorie semantică: **Initiation Lessons**.

### Bank B — OmniKuno Library
**Conținut:** OmniKuno lessons (library/curriculum).  
**Rol:** folosit puternic în World 2 (Performing), extins în World 3.

---

## 3) Mapping: rute → Zones (regulă simplă)
Aceasta este “harta adevărului” pentru orice route.

**Public**
- `app/(public)/*` (ex: `/`, `/privacy`, etc.)

**Intro**
- `/intro/*`

**Sessions (Today)**
- `/today*`, `/session/*` (runner + complete)

**Calibration**
- `/onboarding/*` (evaluări), rutele de CAT-lite / calibration

**Progress**
- `/progress/*` (dashboards, facts, journal)

**Arenas**
- `/arenas/*`, `/training/*` (dacă există rute separate)

**Library**
- `/library/*` (OmniKuno, curriculum)

**Account & Settings**
- `/account/*` (billing, settings)

**Admin / Studio (intern)**
- `/admin/*`

---

## 4) Migrarea: “worlds” vechi din Flow Studio → Zones noi
În varianta veche, Flow Studio avea ~11 “worlds” (de fapt chunks/arii). Unele sunt redundante sau sunt Journeys.

**Lista veche (din doc canonic Flow Studio):**
1. Public / Acquisition
2. Entry / Intro
3. Guided Day-1
4. Onboarding / Calibration
5. Daily Loop (Today)
6. Progress Map
7. Training / Arenas
8. Curriculum / Library
9. Module Hubs
10. Advanced / Wizard / Coaching
11. Account / Billing / Admin / Legacy

**Decizie v1 (curățare la 8 Zones + 1 intern):**
- 1 → **Public**
- 2 → **Intro**
- 3 (Guided Day-1) → **NU e Zone**. Devine **Journey** (program) în World 1.
- 4 → **Calibration**
- 5 → **Sessions (Today)**
- 6 → **Progress**
- 7 → **Arenas**
- 8 → **Library**
- 9 (Module Hubs) → **se elimină ca zonă separată** (redundant).  
  Se acoperă prin:
  - **Sessions (Today)** (pentru Initiation bank) și/sau
  - **Library** (pentru OmniKuno)
- 10 (Advanced/Wizard/Coaching) → **Zone viitoare** în World 3.  
  În schema de 8 Zones, o tratăm ca extensie a **Library** sau ca zonă nouă în viitor:
  - opțiunea A: **Coach & Plans** (adăugată în v2 când există real)
  - opțiunea B: rămâne “feature set” în World 3 fără meniu separat la început
- 11 (Account/Billing/Admin/Legacy) → separăm:
  - **Account & Settings** (user-facing)
  - **Admin / Studio** (intern)
  - “Legacy” nu este zonă

**Rezultat:** nu mai avem 11–12 “worlds”; avem 8 Zones reale + Admin intern. Restul sunt Journeys sau categorii de feature.

---

## 5) Reguli de denumire (anti-confuzie)
- Nu folosim “World” pentru arii funcționale.
- Nu folosim “Module” pentru o lecție singulară.
- În UI user-facing:
  - “Session” = experiența de 10–12 min
  - “Lesson” = conținut atomic
  - “Module” = pachet de 4–6 lessons
  - “Journey” = program ghidat (7 zile etc.)

---

## 6) Single Source of Truth (v1)
Acest document este sursa de adevăr pentru:
- terminologie
- zone mapping
- structură de programe

Implementarea în cod va introduce:
- `lib/taxonomy/*`
- `config/taxonomy/*`
- `config/content/initiations/lessons.registry.ts`
- `config/content/initiations/modules.ts`
- `config/sessions/templates.ts`

Orice feature nou trebuie să declare:
- `zone`
- `world availability`
- ce entity folosește (session/lesson/module/journey)

---
