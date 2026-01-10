# DOCS/ARCHITECTURE/world-initiation-spec.md

## World Spec — INITIATION (v1)
**Intent:** INITIATION nu este “onboarding”. Este **inițiere + familiarizare prin repetiție**, până când ritualul devine ușor și plăcut.

---

## 0) Promisiunea World 1 (ce simte userul)
La finalul INITIATION, userul:
- intră fără efort într-o sesiune de 10–12 minute
- înțelege “ce primește azi” și “de ce”
- finalizează cu ușurință (fără confuzie, fără haos)
- are un minim de progres vizibil
- a gustat 1 arena simplă (opțional), fără să simtă complexitate

**Definiție:** INITIATION se termină când ritualul e familiar (ușor/automat), nu când “a văzut 3 ecrane”.

---

## 1) Zone active în INITIATION (granițe clare)
În INITIATION există doar aceste zone (restul sunt locked/teasers):

1) **Intro** (o singură dată + re-entry scurt)
2) **Sessions (Today)** – loop zilnic (time-based)
3) **Calibration L1** – evaluare scurtă (rar)
4) **Progress L1** – simplu (streak + sessions + next)
5) **Arenas L1 taste** – 1 task scurt (opțional)
6) **Library teaser** – 1 preview, nu library full

**Explicit OUT:** Wizard/Scope, coaching avansat, library full, dashboards complexe, flow studio.

---

## 2) Entities & naming (aplicate strict)
- **Session** = 10–12 min (container de timp)
- **Lesson** = unitate atomică (WOW/DailyPath unificate)
- **Module** = pachet de 4–6 lessons (temă)
- **Journey** = program “7 zile” (dar repetabil până la familiar)

---

## 3) Initiation Journey (programul canonic)
### 3.1 Durată: “7 zile” + repetare până la familiar
Programul este prezentat ca **7 zile**, dar sistemul permite:
- repetare (sau continuare) până când userul atinge criteriul de familiarizare
- trecerea la Performing este “eligible”, nu obligatorie

### 3.2 Inițializare (Day 1)
**Day 1 = session specială** (poate fi 12–15 min, acceptabil o singură dată):
- Intro steps (cinematic → mindpacing → vocab primer)
- Session template: `initiation_day1`
- Livrează prima Lesson din modulul ales (ex: Clarity Foundations)

---

## 4) Session Templates (time-based, INITIATION)
INITIATION folosește 2 template-uri (minimum):

### Template A — `initiation_10min` (default)
- (0:30) Start cue + “azi primești X”
- (6–8 min) 1 Lesson (Initiation bank)
- (1 min) Vocab moment (opțional)
- (1 min) Real-world micro-commit (1 acțiune)
- (0:30) Complete + reward cue

### Template B — `initiation_12min_deep` (opțional)
- (0:30) Start cue
- (6–8 min) Lesson #1
- (3–4 min) Lesson #2 sau reflecție ghidată
- (1 min) Commit + complete

### Template C — `initiation_with_arena_taste` (doar 1–2 ori în World 1)
- ca Template A
- + (2–3 min) Arena taste (task scurt)  
  *Introducere: “testăm frâna / focusul 2 minute”*  
  Arena taste nu devine încă “program de antrenament”.

---

## 5) Modules (4–6 Lessons grupate coerent)
INITIATION livrează Lessons din “Initiation bank” (WOW + DailyPath unificate), dar ordonate în Module.

**Module canonice (v1):**
- `init_clarity_foundations` (5 lessons)
- `init_energy_foundations` (5 lessons)
- `init_emoflex_foundations` (5 lessons)
- `init_wow_foundations` (5 lessons) *(sau WOW ca “mix module”)*

**Regulă:** Today alege “next lesson in module”, nu random.

---

## 6) Calibration în INITIATION (L1)
Calibration există, dar rar și scurt.

**Cadru:**
- L1 Calibration apare:
  - o dată în Day 1/2 (foarte scurt)
  - o dată în Day 5/6 (confirmare/ajustare)
- output-ul Calibration L1 influențează:
  - ce modul intră userul (clarity/energy/emoflex)
  - tonul copy-ului (“în ceață” etc.)
- Calibration L1 NU produce încă dashboards complexe.

---

## 7) Progress în INITIATION (L1)
Progress L1 trebuie să fie “low cognitive load”, dar satisfăcător.

**Minim obligatoriu:**
- `sessionsCompletedTotal`
- `streakDays`
- `lastSessionDate`
- `currentWorld = INITIATION`
- `currentModuleId` + `nextLessonId`
- “ce ai câștigat azi” (1 bullet)

**NU în INITIATION:**
- grafice multe
- scoruri psihometrice detaliate
- segmentation avansată

---

## 8) “Familiarizare”: criterii măsurabile (graduation gate)
INITIATION se termină când userul devine familiar, adică ritualul e ușor și stabil.

### 8.1 Semnale de familiarizare (minim v1)
- **Completări:** ≥ 5 sessions complete în ultimele 7 zile
- **Consistency:** completion rate ≥ 70% (din sessions started)
- **Fricțiune scăzută:**
  - “time_to_start_session” scade sau e sub prag (ex: < 20s median)
  - abandon după start e sub prag (ex: < 25%)
- **Self-report:** 1 item simplu, ocazional:
  - “Cât de ușor ți-a fost azi?” (1–5)
  - prag: media ultimelor 3 ≥ 4

### 8.2 FamiliarityScore (formula simplă, v1)
`familiarityScore = w1*completions + w2*consistency + w3*lowFriction + w4*selfReport`

**Prag:** `eligibleForPerforming = familiarityScore >= threshold`

> În v1, e suficient să implementăm `eligibleForPerforming` fără auto-switch.

---

## 9) UX rules în INITIATION (anti-haos)
- Un singur CTA dominant: “Start session”
- Fără meniuri grele / fără 10 opțiuni de explorare
- Re-entry simplu: “Continuă modulul”
- Copy repetitiv, stabil: userul trebuie să recunoască ritualul

---

## 10) Out of scope (explicit)
- Wizard / Scope / planuri complexe
- AI coaching interactiv
- OmniKuno library full (doar teaser)
- Arenas ca program complet (doar taste)
- Seasons / battle pass (doar design notes)

---

## 11) Implementation hooks (ce trebuie să existe în cod)
Pentru INITIATION v1, implementarea trebuie să introducă:
- `activeWorld` + `eligibleForPerforming`
- session templates (`config/sessions/templates.ts`)
- Initiation modules (4–6 lessons)
- unified Initiation lesson registry (WOW + DailyPath ca Lessons)
- telemetry minim:
  - `session_start`, `session_complete`
  - `lesson_complete`
  - `session_abandon`
  - `self_report_ease` (ocazional)

---
