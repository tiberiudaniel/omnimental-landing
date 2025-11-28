# Onboarding / Inițiere OmniMental – Brief v2 (Variantă A – „Călătoria inițială completă”)

## 0. Scop

- Să stabilim **un singur flow oficial de inițiere**:  
  `/experience-onboarding?flow=initiation&step=welcome`
- Să facem experiența de inițiere **cinematică, coerentă și aliniată vizual** cu:
  - cardurile OmniKuno (stil, tone, layout),
  - ProgressDashboard (carduri, culori, copy).
- Să folosim **ilustrațiile sepia cu drum + soare** ca suport vizual (nu schimbă grid-ul, doar estetica).
- Să păstrăm logica de date deja implementată:  
  `progressFacts`, `recordPracticeSession`, `recordOmniPatch`, `recordActivityEvent`, `journals`, etc.

Flow-ul real are 10 „micro-pași” (stepId), dar este gândit ca **o călătorie inițială coerentă** împărțită în 7–8 momente clare.

---

## 1. Puncte de intrare (unificare routing)

### 1.1. Ruta canonică

- **Ruta standard de inițiere:**
  - `/experience-onboarding?flow=initiation&step=welcome`

### 1.2. Toate butoanele care trebuie să ducă aici

1. **Header – buton „Inițiere”**
   - În `SiteHeader` / `useNavigationLinks`:
   - Asigură-te că link-ul pentru Inițiere este:
     - `/experience-onboarding?flow=initiation&step=welcome`

2. **OmniKuno hub (`/kuno`) – „Încearcă experiența ghidată”**
   - Actual:
     - trimite spre `/experience-onboarding?start=1` (flow „default”).
   - Dorit:
     - schimbă link-ul în:
       - `/experience-onboarding?flow=initiation&step=welcome&from=kuno`

3. **Wizard – mini-Kuno / „Încearcă acum”**
   - Actual:
     - `StepMiniKunoStart` deschide direct `flow=initiation&step=omnikuno-test`.
   - Dorit:
     - toate CTA-urile care „trimit spre inițiere” să ducă în:
       - `/experience-onboarding?flow=initiation&step=welcome&from=wizard`
     - Nu mai sărim în mijlocul flow-ului.

4. **Alias / rute vechi**
   - `/onboarding`:
     - dacă există, redirect permanent (sau `router.replace`) la:
       - `/experience-onboarding?flow=initiation&step=welcome&from=legacy`
   - `/experience-onboarding` fără query:
     - redirect la:
       - `/experience-onboarding?flow=initiation&step=welcome`

---

## 2. Flow-ul de inițiere – structură și intenție

### 2.1. StepId-uri actuale (nu le schimbăm, doar le ordonăm)

```ts
type InitiationStepId =
  | "welcome"
  | "intro"
  | "omnikuno-test"
  | "first-action"
  | "omnikuno-context"
  | "journal"
  | "omniscope"
  | "daily-state"
  | "omnikuno-lesson"
  | "omnikuno-lesson-quiz";
Ordinea oficială pentru breadcrumb (deja prezentă în page.tsx):

ts
Copy code
const order: InitiationStepId[] = [
  "welcome",
  "intro",
  "omnikuno-test",
  "first-action",
  "omnikuno-context",
  "journal",
  "omniscope",
  "daily-state",
  "omnikuno-lesson",
  "omnikuno-lesson-quiz",
];
Breadcrumb-ul deja afișează „Pas X/Y” pe baza acestui array.
Ținta pentru v2: nu schimbăm logica de routing, doar rafinăm UX + copy + imagini.

2.2. „Călătoria” – viziune narativă
Fază 1 – Intrarea în lume (StepId: welcome)
Componentă: InitiationStepWelcome.

Rol:

Prim contact cinematic: drum spre soare, geometrie, tema în focus (din progressFacts).

Setează tonul: „începi o călătorie ghidată, nu un test”.

Modificări:

În loc de fotografia actuală onboarding-welcome.jpg, folosim una dintre ilustrațiile atașate (drum + soare + cercuri).

Propunere: nou asset public/assets/onboarding-init-hero.jpg.

Cod:

ts
Copy code
import onboardingHero from "@/public/assets/onboarding-init-hero.jpg";
Text sub buton:

acum: „7 pași ghidați · 12 minute…”

nou:

tsx
Copy code
{lang === "ro"
  ? "10 pași ghidați · aproximativ 12–15 minute."
  : "10 guided steps · about 12–15 minutes."}
Roadmap tooltips rămân (Omni-Scop, Omni-Kuno, etc.), dar copy-ul să fie puțin mai scurt (Codex poate ajusta, menținând ideea).

Fază 2 – OmniKuno ca „hartă” (StepId: intro)
Componentă: StepIntro.

Rol:

Explică de ce începem cu OmniKuno, în stil de card „hero” OmniKuno.

Modificări:

Elimină textul hardcodat „Pas 1/7 / Step 1/7” din interior.

În header deja avem breadcrumb-ul din ExperienceOnboarding.

În StepIntro înlocuim header-ul cu ceva neutru:

tsx
Copy code
<div className="mb-3 text-xs uppercase tracking-[0.4em] text-[#96705B]">
  {lang === "ro" ? "Start Omni-Kuno" : "Start Omni-Kuno"}
</div>
Opțional: adaugă o imagine discretă în background, folosind ilustrația cu drum + panouri (grafice, checklist, busolă).

Nou asset de ex.: public/assets/onboarding-kuno-signs.jpg.

Poate fi pus într-un absolute inset-0 opacity-[0.25] mix-blend-multiply sub gradient.

Fază 3 – Lecția 0 – Inițiere (StepId: omnikuno-test)
Componentă: components/onboarding/InitiationLesson.

Rol:

Micro-lecție în stil OmniKuno: explică mecanismele mentale de bază (claritate, balans, energie etc.).

Modificări:

Componenta este deja în stilul corect.

Doar asigură-te că:

themeLabel (din focusThemeLabel) este transmis corect din page.tsx:

tsx
Copy code
{step === "omnikuno-test" && (
  <InitiationLesson
    themeLabel={focusThemeLabel}
    onContinue={() => go("first-action")}
  />
)}
Poți folosi ca background de pagină o variantă mai „sacred geometry” dintre ilustrații (cercuri mari peste peisaj).

Fază 4 – OmniKuno context & mini-întrebări (StepId: omnikuno-context)
Componentă: InitiationStepKunoContext.

Rol:

3–4 întrebări de tip OmniKuno (reflection + scenario) pentru tema principală.

Obiectiv: userul simte că aplică imediat cunoașterea, nu doar citește.

Modificări:

Componenta e deja în formatul dorit (folosește TestQuestionCard și recordPracticeSession('reflection')).

UX:

La final, butonul „Continuă” duce la step="journal" (deja implementat):

tsx
Copy code
onContinue={() => go("journal")}
Poți adăuga un mic text Typewriter sus:

„Testezi cum gândești, nu cât știi.”

Fază 5 – Jurnal scurt (StepId: journal)
Componentă actuală: InitiationStepJournal (redirect la /progress).

Dorit: în această fază rămânem în onboarding, NU facem redirect.

Schimbare de design:

În loc de InitiationStepJournal se va folosi StepJournal direct:

tsx
Copy code
{step === "journal" && (
  <StepJournal
    userId={profile?.id ?? null}
    onSaved={() => go("omniscope")}
    onSkip={() => go("omniscope")}
  />
)}
Componenta StepJournal deja:

salvează în Firestore (journals),

apelează recordPracticeSession("journaling", ...),

apelează recordRecentEntry.

Stil:

Păstrăm GuideCard, dar folosim imaginea cu persoana care scrie în jurnal ca mic header vizual:

Nou asset: public/assets/onboarding-journal-hero.jpg.

În StepJournal, deasupra cardului:

tsx
Copy code
<div className="mb-3 flex justify-center">
  <Image
    src={journalHero}
    alt={lang === "ro" ? "Jurnal lângă un drum sinuos" : "Journal near a winding path"}
    width={420}
    height={280}
    className="rounded-[18px] border border-[#E4DAD1] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
  />
</div>
Componenta InitiationStepJournal.tsx poate rămâne în proiect (nu e folosită în flow-ul oficial).

Fază 6 – OmniScope + Daily State (StepId: omniscope și daily-state)
Componente:

InitiationStepOmniScope (impact / readiness / frequency).

InitiationStepDailyState (energy, stress, sleep, clarity, confidence, focus).

Rol:

Să calibrăm „harta” temei în focus + starea zilnică.

Datele se duc în progressFacts și vor hrăni dashboard-ul.

Modificare conceptuală:

Nu schimbăm StepId-urile (rămân două ecrane consecutive).

Din punct de vedere UX se prezintă ca un singur bloc de „calibrare”:

omniscope: text Typewriter „Unde ești acum pe hartă în raport cu tema în focus?”

daily-state: text Typewriter „Cum arată azi resursele tale interne?”

Vizual:

Folosește una dintre ilustrații ca background foarte discret (opacity mic, mix-blend).

De ex. pentru InitiationStepOmniScope:

ilustrația cu cercuri mari + drum.

Pentru InitiationStepDailyState:

ilustrația cu săgeata care urcă pe drum (orientare de progres).

Fază 7 – Micro-lecție aplicată (StepId: omnikuno-lesson)
Componentă: InitiationStepLesson.

Rol:

Lecție reală OmniKuno legată de tema principală, cu:

Goal,

3 idei cheie,

Example,

Exercise,

câmp text scurt („cum vei aplica azi?”).

Modificări:

Componenta este deja aliniată la cardurile OmniKuno (SmallCard, icons etc.).

onNext este deja utilizat pentru a merge la quiz:

tsx
Copy code
{step === "omnikuno-lesson" && (
  <InitiationStepLesson
    userId={profile?.id ?? null}
    onNext={() => go("omnikuno-lesson-quiz")}
  />
)}
Când onNext există, componenta nu intră în branch-ul done, deci summary-ul intern rămâne de backup.

Fază 8 – Mini-quiz + Final (StepId: omnikuno-lesson-quiz)
Componentă: InitiationStepLessonQuiz.

Rol:

2 întrebări rapide din lecția de mai sus.

Logare în recordActivityEvent (knowledge).

Redirect final către /progress?from=initiation&completed=1.

Extindere pentru v2:

După zona de quiz + scor, adaugă un mic card de summary + CTA triplă:

tsx
Copy code
<section className="mt-6 rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
    {lang === "ro" ? "Inițiere completă" : "Initiation complete"}
  </h3>
  <p className="mt-2 text-sm text-[#4A3A30]">
    {lang === "ro"
      ? "Ai calibrat tema în focus, ți-ai notat prima acțiune și ai parcurs o micro-lecție aplicată."
      : "You calibrated your focus theme, captured a first action, and completed an applied micro-lesson."}
  </p>
  <ul className="mt-3 list-disc pl-5 text-sm text-[#4A3A30]">
    <li>{lang === "ro" ? "Ai deschis jurnalul cu o primă reflecție." : "You opened the journal with a first reflection."}</li>
    <li>{lang === "ro" ? "Ai măsurat starea de azi și motivația pentru tema aleasă." : "You measured today’s state and motivation for your theme."}</li>
    <li>{lang === "ro" ? "Ai testat cunoașterea de bază în zona aleasă." : "You tested your baseline knowledge in the chosen area."}</li>
  </ul>
  <div className="mt-4 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={submit} // păstrează logica existentă, apoi router.push
      className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-sm font-medium tracking-[0.12em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
      data-testid="init-lesson-quiz-submit"
    >
      {lang === "ro" ? "Mergi la progres" : "Go to progress"}
    </button>
    <a
      href="/recommendation?from=initiation"
      className="rounded-[10px] border border-[#D8C6B6] px-5 py-2 text-sm font-medium tracking-[0.12em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]"
    >
      {lang === "ro" ? "Vezi recomandarea ta" : "See your recommendation"}
    </a>
  </div>
</section>
submit() rămâne responsabil să cheme recordActivityEvent și apoi onDone() care face router.push('/progress?from=initiation&completed=1').

3. Ajustări vizuale și tehnice
3.1. Folosirea ilustrațiilor noi
Ilustrațiile sepia atașate se folosesc astfel (numele de fișiere pot fi ajustate în cod, ideea este să fie clare pentru designer):

onboarding-init-hero.jpg

scena cu drum + soare + geometrie clară (fără panouri, fără săgeți).

Folosită în InitiationStepWelcome (hero principal) și ca fundal pentru FirstAction.

onboarding-kuno-signs.jpg

drum + panouri (grafice, checklist, busolă).

Folosită în StepIntro ca background subtil.

onboarding-journal-hero.jpg

persoană care scrie în jurnal, cu drum în fundal.

Folosită în StepJournal.

onboarding-path-geometry.jpg

drum + soare + cercuri mari geometrice.

Folosită în InitiationStepOmniScope.

onboarding-path-arrow.jpg

drum + săgeată ascendentă, elemente geometrice.

Folosită în InitiationStepDailyState sau FirstAction.

Toate imaginile:

plasate în public/assets/,

importate explicit acolo unde fac parte din layout,

sau folosite prin style={{ backgroundImage: "url('/assets/...')" }} acolo unde deja există un pattern (ex. FirstAction).

3.2. Coerență cu OmniKuno și Dashboard
Toate butoanele de acțiune din onboarding/initiere trebuie să folosească aceeași schemă:

tsx
Copy code
className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-sm font-medium tracking-[0.12em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
Headline-urile de tip „eticheta mică”:

tsx
Copy code
className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]"
Text body: text-sm sau text-base, culoare #4A3A30 / #3D1C10.

Carduri:

GuideCard sau div cu:

rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm.

3.3. Componente atinse (sumar)
app/(app)/experience-onboarding/page.tsx

unificare entrypoints,

înlocuire InitiationStepJournal cu StepJournal pentru step === "journal",

breadcrumb rămâne, dar fără schimbări majore.

app/(app)/experience-onboarding/steps/InitiationStepWelcome.tsx

schimbare asset,

update tagline „10 pași ghidați…”.

app/(app)/experience-onboarding/steps/StepIntro.tsx

eliminare „Pas 1/7” din interior; replace cu label neutru.

components/onboarding/FirstAction.tsx

schimbare background image (onboarding-init-hero.jpg sau onboarding-path-arrow.jpg),

copy ușor scurtat dacă e nevoie, dar păstrată logica de recordOmniPatch.

app/(app)/experience-onboarding/steps/StepJournal.tsx

adăugare imagine mică deasupra cardului,

text Typewriter actual e ok.

app/(app)/experience-onboarding/steps/InitiationStepOmniScope.tsx și InitiationStepDailyState.tsx

ajustări de copy (2–3 texte Typewriter),

opțional: background geometric discret.

app/(app)/experience-onboarding/steps/InitiationStepLessonQuiz.tsx

extindere cu summary card + CTA dublu (progres + recomandări).

app/(app)/experience-onboarding/steps/InitiationStepJournal.tsx

rămâne ca fallback / poate fi marcată ca „legacy”; nu folosită în flow-ul standard.

4. E2E & QA
Actualizează testele Playwright relevante:

tests/e2e/experience-onboarding.spec.ts

să pornească doar flow-ul initiation:

/experience-onboarding?flow=initiation&step=welcome&e2e=1

să verifice:

că după welcome → intro → omnikuno-test → first-action → omnikuno-context → journal → omniscope → daily-state → omnikuno-lesson → omnikuno-lesson-quiz
se ajunge la /progress?from=initiation&completed=1.

că jurnalul salvează ceva (eo-journal-text → recordRecentEntry).

că există buton către /recommendation?from=initiation în final.

Nu este nevoie să modifici onboarding.spec.ts decât pentru redirect-uri (/onboarding → flow nou).

5. Rezumat implementare (checklist)
Standardizează ruta de intrare în inițiere (flow=initiation&step=welcome) pentru header, OmniKuno hub și wizard.

Actualizează InitiationStepWelcome:

nou asset ilustrat,

tagline „10 pași ghidați · 12–15 minute”.

Curăță StepIntro de „Pas 1/7”; păstrează doar label „Start Omni-Kuno”.

Înlocuiește în ExperienceOnboarding step-ul journal cu StepJournal (fără redirect la /progress).

Adaugă imaginea de jurnal în StepJournal.

Ajustează vizual InitiationStepOmniScope și InitiationStepDailyState (background geometric + Typewriter clar).

Extinde InitiationStepLessonQuiz cu summary card + CTA „Go to progress” + link „See your recommendation”.

Actualizează testele E2E pentru noul flow oficial și verifică npm run lint + npm run build.



## Delta v2.1 – Corecții UX pentru pașii 2–5 (flow=initiation)

Scop: după primul ciclu de implementare, e nevoie să ajustăm pașii 2–5 ca să fie 100% aliniați cu viziunea „Călătoria inițială completă” și cu ceea ce se vede acum în UI (screenshot-uri).

### Context

- Flow actual: `welcome` (1/10) → `intro` (2/10) → `omnikuno-test` (3/10) → `first-action` (4/10) → `journal` (5/10) → `omniscope` → `daily-state` → `omnikuno-lesson` → `omnikuno-lesson-quiz`.
- Problema:
  - `StepIntro` descrie încă vechiul onboarding (mini-test + jurnal + respirație).
  - `FirstAction` este un card full-screen închis la culoare, care combină respirație + mini-jurnal.
  - Jurnalul nu este un pas separat clar (ar trebui să fie `step="journal"` cu `StepJournal`).

Țintă:  
- Pasul 2 să introducă clar **călătoria OmniKuno / Inițiere**, nu vechiul flow.  
- Pasul 4 să fie despre **primul pas concret + protocol mental scurt**, nu despre jurnal.  
- Pasul 5 să fie **jurnalul de inițiere**, cu componenta standard `StepJournal`, cu imaginea de jurnal și salvare în Firestore.

---

### 1. PAS 2/10 – `intro` → `StepIntro.tsx`

Rol: scurt context pentru OmniKuno și pentru călătoria de inițiere (nu descrierea vechiului onboarding).

#### Cerințe

1. Păstrează structura vizuală actuală (banner crem + card Omni-Kuno).  
2. Schimbă **doar copy-ul** din bannerul superior, astfel:

- Label mic (deja ok): `START OMNI-KUNO`.
- Titlu / paragraf principal (RO):

  > „Bine ai venit în inițierea OmniMental. În următoarele minute clarificăm tema ta în focus și calibrăm trei lucruri esențiale: ce știi deja, cum te simți acum și care este primul pas concret pe care îl poți face.”

- Subtext (dacă există / îl păstrăm):

  > „Vei trece printr-o mini-lecție, o acțiune ghidată, un jurnal scurt și o calibrare a stării de azi.”

3. Nu mai menționăm explicit „exercițiu de respirație” sau „mini-test” ca elemente principale; respirația este parte din `first-action`.

4. Pentru EN, traducere directă:

  > „Welcome to the OmniMental initiation. In the next minutes we’ll clarify your focus theme and calibrate three essentials: what you already know, how you feel right now, and the first concrete step you can take.”

  > „You’ll go through a mini-lesson, a guided action, a short journal and a calibration of today’s state.”

---

### 2. PAS 3/10 – `omnikuno-test` → `InitiationStepLesson.tsx`

Rol: „Lecția 0 – Inițiere” (micro-lecție în stil OmniKuno).

- Aici nu cerem modificări de design.  
- Doar confirmăm:
  - Titlul rămâne de tip: `LECȚIA 0 — INIȚIERE` + heading în stil OmniKuno.
  - Bullets sunt max 4–5, clare, fără text prea lung la fiecare.

Dacă e nevoie, textul se poate ajusta ulterior, dar la nivel de structură e în regulă.

---

### 3. PAS 4/10 – `first-action` → `components/onboarding/FirstAction.tsx`

Rol: „Prima ta acțiune” – decizia concretă pe următoarele 24h, plus un protocol mental scurt (respirație).

#### Cerințe UX

1. **Design**:
   - Renunțăm la cardul full-screen brun foarte închis (high contrast).  
   - Folosim același stil de card ca în restul inițierii:
     - background `bg-white`,
     - `border border-[#E4DAD1]`,
     - `rounded-[24px]` sau `[20px]`,
     - text în culoarea standard #3D1C10 / #4A3A30.
   - Putem păstra ca background foarte discret (în spate, cu opacity mic) ilustrația cu drumul și săgeata (`onboarding-path-arrow.jpg`).

2. **Structură conținut**:

   - Label mic (sus în card):

     > `ACȚIUNE GHIDATĂ`

   - Titlu (RO):

     > `Prima ta acțiune`

   - Text scurt de context:

     > „Activezi protocolul mental înainte de primul exercițiu real. Îți stabilești o singură acțiune clară pe care o vei face în următoarele 24 de ore.”

   - Secțiune „Respirație” (text simplu, nu trebuie să fie super vizibil, poate fi high-level):

     > „Respirație (opțional, 3 cicluri):
     > – Inspiră 4 secunde adânc.  
     > – Ține aerul 4 secunde, observă tensiunea.  
     > – Expiră lent 6 secunde.”  

     Textul poate fi într-un mic box subtitrat („Protocol scurt, fără presiune”).

   - Câmp pentru acțiune concretă:

     - Label:

       > „Ce acțiune concretă vrei să faci în următoarele 24 de ore?”

     - Input: `textarea` scurtă (2–3 rânduri) sau `input` text extins.

3. **Logica de date**:

   - Păstrăm logica existentă de `recordOmniPatch` / salvare, dar centrată pe **acțiune**.
   - De exemplu:

     - câmp intern: `firstActionPlan` (sau re-folosește key-ul deja existent dacă Codex a creat unul).
     - La click pe butonul principal:

       > `Salvează acțiunea`

       – se apelează `onSaveFirstAction(actionText)` care:
       - validează minim 3–5 caractere,
       - apelează `recordOmniPatch(userId, { initiation: { firstAction: actionText } })` sau structura deja folosită în cod.

   - Butonul de navigație:

     - `Continuă inițierea` → `go("journal")`.

   - Flow concret:
     - User completează acțiunea → apasă „Salvează acțiunea” (poate fi combinat cu „Continuă inițierea” într-un singur buton:
       - la click: salvezi și apoi `go("journal")`.

4. **Ce NU trebuie să mai fie în acest pas**:

   - Nu mai punem `Mini-jurnal` cu întrebarea „Ce ți-a rămas din această lecție?”.  
   - Jurnalul se mută complet în pasul `journal` (StepJournal).

---

### 4. PAS 5/10 – `journal` → `StepJournal.tsx` (folosit în flow)

Rol: jurnal scurt de inițiere, separat și recognoscibil.

#### Cerințe

1. Pentru `step === "journal"` în `ExperienceOnboarding`:

   - trebuie să folosim **direct** `StepJournal`, cu:

     ```tsx
     <StepJournal
       userId={profile?.id ?? null}
       onSaved={() => go("omniscope")}
       onSkip={() => go("omniscope")}
     />
     ```

   - Fără redirect la `/progress` în interiorul `StepJournal`.

2. În `StepJournal.tsx`:

   - Deasupra cardului, imaginea de jurnal:

     - `onboarding-journal-hero.jpg` (persoana cu jurnal).
     - dimensiuni moderate: ~400–450px lățime, border + shadow discret.

   - Textul Typewriter / label să clarifice că e **jurnalul tău de inițiere**, nu unul generic:

     - Label mic:

       > `JURNAL – INIȚIERE`

     - Text scurt:

       > „Notează în câteva rânduri cum te simți acum și ce ți-ai propus să schimbi în perioada următoare.”

   - Placeholder pentru text:

     > „Ce simți acum legat de tema ta în focus?”

3. Logica de salvare rămâne neschimbată:
   - scrie în `journals`,
   - `recordPracticeSession("journaling", ...)`,
   - `recordRecentEntry`.

---

### 5. Recapitulare flow (2–5)

1. **PAS 2/10 – intro (StepIntro)**  
   - Text actualizat: descrie clar călătoria (mini-lecție + acțiune + jurnal + calibrare stare).

2. **PAS 3/10 – omnikuno-test (InitiationStepLesson)**  
   - Lecția 0, neschimbată ca structură.

3. **PAS 4/10 – first-action (FirstAction)**  
   - Card alb, stil OmniKuno.  
   - Respirație scurtă + un câmp de „acțiune concretă în 24h”.  
   - La submit: salvează acțiunea + `go("journal")`.

4. **PAS 5/10 – journal (StepJournal)**  
   - Imagine de jurnal, text clar „Jurnal – Inițiere”.  
   - Salvare standard + `onSaved/onSkip` → `go("omniscope")`.



simplificare și o aliniere a onboarding-ului de inițiere cu designul OmniKuno, pe baza fișierelor actuale din app/(app)/experience-onboarding și components/onboarding.


Am deschis proiectul din zip și am urmărit efectiv flow-ul din cod:

app/(app)/experience-onboarding/page.tsx – flow flow=initiation cu pașii:

welcome → intro → omnikuno-test → first-action → omnikuno-context → journal → omniscope → daily-state → omnikuno-lesson → omnikuno-lesson-quiz.

Componente cheie:

steps/StepIntro.tsx

components/onboarding/InitiationLesson.tsx (Lecția 0 – Inițiere, folosit la step='omnikuno-test')

components/onboarding/FirstAction.tsx

steps/InitiationStepKunoContext.tsx

steps/StepJournal.tsx

steps/InitiationStepOmniScope.tsx

steps/InitiationStepDailyState.tsx

steps/InitiationStepLesson.tsx + steps/InitiationStepLessonQuiz.tsx

components/omniKuno/LessonView.tsx (modelul vizual pe care îl vrei).

În acest moment:

Step-urile de „lecție” (Lecția 0, lecția finală, quiz) NU arată ca LessonView.

Imaginile sepia (drumul, săgeata, semnele, jurnalul) sunt folosite mai mult ca background cu opacitate mică, nu ca ilustrații clare, cu text lângă ele.

Layout-ul e diferit de la pas la pas (uneori full-bleed, uneori card simplu) → senzație de „complicat”.

Mai jos ai o propunere clară, direct legată de fișiere, ca să ajungi la un onboarding simplu, profesionist, aliniat cu OmniKuno.

1. Concept: 2 tipuri de ecrane în Onboarding

Tip A – „Lecție”
– tot ce poartă numele de „lecție” să arate ca OmniKuno (LessonView): header + bară de progres + card central + butoane Înapoi / Continuă.

Astea sunt:

Lecția 0 – Inițiere (components/onboarding/InitiationLesson.tsx, step omnikuno-test)

Lecția din final (steps/InitiationStepLesson.tsx, step omnikuno-lesson)

Quizul final (steps/InitiationStepLessonQuiz.tsx, step omnikuno-lesson-quiz – aici poți păstra layoutul actual, dar îl putem încadra în aceeași „coajă” vizuală).

Tip B – „Pas ilustrat”
– ecrane cu o singură idee + o singură acțiune, cu imagine sepia clară + text lângă:

StepIntro (Start Omni-Kuno)

InitiationStepKunoContext

FirstAction

StepJournal

InitiationStepOmniScope

InitiationStepDailyState

Pentru asta propun două componente noi reutilizabile și apoi modificări punctuale.

2. Componentă nouă 1 – IllustratedStep

Fișier nou: components/onboarding/IllustratedStep.tsx

Rol: layout standard imagine + text (exact ce vrei: imagine întreagă, clară, cu text în stânga/dreapta, fluid).

"use client";

import { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";
import GuideCard from "@/components/onboarding/GuideCard";

type Orientation = "imageLeft" | "imageRight";

type IllustratedStepProps = {
  image: StaticImageData;
  imageAlt: string;
  label?: string;
  title?: string;
  body?: ReactNode;          // poate fi Typewriter sau text simplu
  orientation?: Orientation; // default: "imageLeft"
  children?: ReactNode;      // formulare, butoane etc.
};

export function IllustratedStep({
  image,
  imageAlt,
  label,
  title,
  body,
  orientation = "imageLeft",
  children,
}: IllustratedStepProps) {
  const imageFirst = orientation === "imageLeft";

  return (
    <section className="rounded-[24px] border-none bg-transparent px-0 py-0">
      <GuideCard>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-center">
          {imageFirst && (
            <div className="relative h-48 md:h-64">
              <Image
                src={image}
                alt={imageAlt}
                fill
                className="rounded-[20px] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                priority
              />
            </div>
          )}

          <div className="space-y-4 text-[#3D1C10]">
            {label ? (
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#B08A78]">
                {label}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-xl md:text-2xl font-bold leading-snug text-[#2C2C2C]">
                {title}
              </h2>
            ) : null}
            {body ? (
              <div className="text-sm md:text-base leading-relaxed text-[#4A3A30]">
                {body}
              </div>
            ) : null}
            {children ? <div className="space-y-4">{children}</div> : null}
          </div>

          {!imageFirst && (
            <div className="relative h-48 md:h-64">
              <Image
                src={image}
                alt={imageAlt}
                fill
                className="rounded-[20px] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                priority
              />
            </div>
          )}
        </div>
      </GuideCard>
    </section>
  );
}

3. Componentă nouă 2 – OnboardingLessonShell

Fișier nou: components/onboarding/OnboardingLessonShell.tsx

Rol: să copieze structura vizuală de lesson din components/omniKuno/LessonView.tsx:

label mic „Lecție”

titlu lecție

subtitlu

meta (ex. „Minte · Ușor · ~3 min”)

rând cu puncte de progres + „Pas X din Y”

card central cu conținut

butoane Înapoi / Continuă

Cod de bază:

"use client";

import { ReactNode } from "react";

type OnboardingLessonShellProps = {
  label: string;        // ex: "Lecția 0 — Inițiere"
  title: string;        // ex: "De ce se simte începutul complicat?"
  subtitle?: string;    // hint/descriere
  meta?: string;        // ex: "Minte · Ușor · ~3 min"
  stepIndex?: number;   // 0-based
  stepCount?: number;   // ex: 1, 3, 5
  children: ReactNode;  // conținutul real al lecției (bullets etc.)
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
};

export function OnboardingLessonShell({
  label,
  title,
  subtitle,
  meta,
  stepIndex = 0,
  stepCount = 1,
  children,
  onBack,
  onContinue,
  backLabel = "Înapoi",
  continueLabel = "Continuă",
}: OnboardingLessonShellProps) {
  const current = stepIndex + 1;

  return (
    <section className="space-y-4" data-testid="initiation-lesson-shell">
      {/* Header în stil LessonView */}
      <div className="rounded-[24px] border border-[#F3D8C4] bg-[#FFF8F4] px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#B08A78]">
              {label}
            </p>
            <h3 className="text-xl font-bold leading-tight text-[#2C2C2C]">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-[13px] text-[#7B6B60]">{subtitle}</p>
            ) : null}
          </div>
          {meta ? (
            <p className="text-[11px] text-[#7B6B60]">{meta}</p>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[#7B6B60]">
          <div className="flex gap-1">
            {Array.from({ length: stepCount }).map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full ${
                  idx === stepIndex ? "bg-[#C07963]" : "bg-[#E4DAD1]"
                }`}
              />
            ))}
          </div>
          <p>{`Pas ${current} din ${stepCount}`}</p>
        </div>
      </div>

      {/* Card central cu conținut */}
      <div className="rounded-[24px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
        {children}
        <div className="mt-6 flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-[999px] border border-[#E4DAD1] px-5 py-2 text-[13px] font-medium text-[#7B6B60] hover:border-[#C07963] hover:text-[#C07963]"
            >
              {backLabel}
            </button>
          ) : (
            <span />
          )}
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-[999px] border border-[#2C2C2C] px-6 py-2 text-[13px] font-semibold tracking-[0.18em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
            >
              {continueLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}


Codex poate ajusta culorile/clasele copiind exact din LessonView.tsx ca să fie 1:1 cu lecțiile OmniKuno.

4. Modificări concrete pe pași (fișier cu fișier)
4.1. steps/StepIntro.tsx – Start Omni-Kuno

Schimbă complet JSX-ul și folosește IllustratedStep.

Imagine: onboarding-kuno-signs.jpg (drumul cu panouri).
Import:
import onboardingKunoSigns from "@/public/assets/onboarding-kuno-signs.jpg";

Logică propusă:

import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { IllustratedStep } from "@/components/onboarding/IllustratedStep";
import onboardingKunoSigns from "@/public/assets/onboarding-kuno-signs.jpg";

export default function StepIntro({ onStart }: { onStart: () => void }) {
  const { lang } = useI18n();
  const isRo = lang === "ro";

  return (
    <IllustratedStep
      image={onboardingKunoSigns}
      imageAlt={isRo ? "Drum cu panouri de progres" : "Path with progress signs"}
      label="Start Omni-Kuno"
      title={isRo ? "Inițierea ta ghidată începe aici" : "Your guided initiation starts here"}
      body={
        <Typewriter
          className="text-sm md:text-base"
          text={
            isRo
              ? "În câteva minute clarificăm tema ta în focus și calibrăm trei lucruri esențiale: ce știi deja, cum te simți acum și care este primul pas concret pe care îl poți face."
              : "In the next minutes we’ll clarify your focus theme and calibrate three essentials: what you already know, how you feel right now, and the first concrete step you can take."
          }
        />
      }
      orientation="imageLeft"
    >
      <div className="flex justify-start">
        <button
          data-testid="eo-start"
          onClick={onStart}
          className="rounded-[999px] border border-[#2C2C2C] px-6 py-2 text-[13px] font-semibold tracking-[0.18em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
        >
          {isRo ? "ÎNCEPE" : "START"}
        </button>
      </div>
    </IllustratedStep>
  );
}


Rezultat: ecran ușor, imagine clară, text scurt, un singur buton.

4.2. components/onboarding/InitiationLesson.tsx – Lecția 0 în stil OmniKuno

În locul cardului simplu actual, folosește OnboardingLessonShell.

Importă noua componentă:

import { OnboardingLessonShell } from "@/components/onboarding/OnboardingLessonShell";


În return, înlocuiește div-ul principal cu:

  const shellLabel = normalizedLang === "ro" ? "3. Lecție" : "Lesson 3";
  // sau pur și simplu "Lecția 0 — Inițiere" dacă vrei să păstrezi exact așa

  return (
    <OnboardingLessonShell
      label={normalizedLang === "ro" ? "Lecția 0 — Inițiere" : "Lesson 0 — Initiation"}
      title={copy.title[normalizedLang]}
      subtitle={CTA_HINT[normalizedLang]}
      meta={
        normalizedLang === "ro"
          ? "Inițiere · Minte · ~3 min"
          : "Initiation · Mind · ~3 min"
      }
      stepIndex={0}
      stepCount={1}
      onContinue={() => {
        if (onContinue) onContinue();
        else router.push("/experience-onboarding?flow=initiation&step=first-action");
      }}
      continueLabel={CTA_LABEL[normalizedLang]}
    >
      <ol className="space-y-4 text-base leading-relaxed text-[#3D1C10]">
        {points.map((text, idx) => (
          <li
            key={`point-${idx}`}
            className="rounded-[14px] border border-[#F3D8C4] bg-[#FFFBF7] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
          >
            {text}
          </li>
        ))}
      </ol>
    </OnboardingLessonShell>
  );


Astfel, Lecția 0 are header + bară de progres + card central exact din familia vizuală OmniKuno.

4.3. components/onboarding/FirstAction.tsx – imagine clară + acțiune simplă

În momentul ăsta cardul e decent, dar imaginea e doar overlay. Folosește IllustratedStep + onboarding-path-arrow.jpg.

Import:

import { IllustratedStep } from "@/components/onboarding/IllustratedStep";
import onboardingPathArrow from "@/public/assets/onboarding-path-arrow.jpg";


În return, înlocuiește div-ul mare cu:

  const isRo = normalizedLang === "ro";

  return (
    <IllustratedStep
      image={onboardingPathArrow}
      imageAlt={isRo ? "Drum cu săgeată către următorul pas" : "Path with an arrow to the next step"}
      label={isRo ? "Acțiune ghidată" : "Guided action"}
      title={isRo ? "Prima ta acțiune" : "Your first action"}
      body={
        <p className="text-sm md:text-base leading-relaxed">
          {isRo
            ? "Stabilești o singură acțiune clară pe care o vei face în următoarele 24 de ore. Nu trebuie să fie perfectă, doar concretă și realistă."
            : "You’ll choose one concrete action to take in the next 24 hours. It doesn’t have to be perfect — just clear and realistic."}
        </p>
      }
      orientation="imageRight"
    >
      <div className="space-y-3 text-sm text-[#4A3A30]">
        <p className="font-semibold">
          {isRo ? "Protocol scurt de respirație (opțional):" : "Short breathing protocol (optional):"}
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{isRo ? "Inspiră 4 secunde adânc." : "Inhale for 4 seconds."}</li>
          <li>{isRo ? "Ține aerul 4 secunde, observă tensiunea." : "Hold for 4 seconds, notice the tension."}</li>
          <li>{isRo ? "Expiră lent 6 secunde." : "Exhale slowly for 6 seconds."}</li>
        </ul>

        <label className="mt-4 block text-[13px] font-semibold text-[#7B6B60]">
          {isRo
            ? "Ce acțiune concretă vrei să faci în următoarele 24 de ore?"
            : "What concrete action will you take in the next 24 hours?"}
        </label>
        <textarea
          value={action}
          onChange={(e) => setAction(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-[12px] border border-[#E4DAD1] bg-white px-3 py-2 text-sm text-[#2C2C2C] outline-none focus:border-[#C07963]"
        />
        {error ? <p className="text-xs text-[#D64045]">{error}</p> : null}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            data-testid="first-action-submit"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[999px] border border-[#2C2C2C] px-6 py-2 text-[13px] font-semibold tracking-[0.18em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRo ? "SALVEAZĂ ACȚIUNEA" : "SAVE ACTION"}
          </button>
        </div>
      </div>
    </IllustratedStep>
  );


Logica actuală de persistAction / recordOmniPatch rămâne neschimbată.

4.4. steps/StepJournal.tsx – e deja aproape corect

Codul folosește onboarding-journal-hero.jpg, dar imaginea e mică și cardul e separat.

Aici aș face doar un mic refactor: în return, în loc de layoutul actual, folosește și tu IllustratedStep:

Imagine: journalHero (deja importată).

Body: textul cu Typewriter.

În children: textarea + butoanele Salvează jurnalul / Sari peste.

Nu mai detaliez codul, schema e aceeași ca FirstAction.

4.5. steps/InitiationStepKunoContext.tsx, InitiationStepOmniScope.tsx, InitiationStepDailyState.tsx

Idea e identică: fiecare dintre ele:

importă IllustratedStep;

alege câte una din imaginile:

onboarding-path-geometry.jpg pentru OmniScope;

onboarding-path-geometry.jpg sau onboarding-welcome.jpg pentru DailyState;

pentru KunoContext, poți folosi tot onboarding-kuno-signs.jpg sau onboarding-path-geometry.jpg.

Mută textul introductiv + Typewriter în body;

pune întrebările / slider-ele / opțiunile în children.

Rezultatul: tot onboarding-ul va arăta unitar: imagine sepia stânga/dreapta + card Omni-style.

4.6. steps/InitiationStepLesson.tsx și steps/InitiationStepLessonQuiz.tsx

Aici nu intru foarte adânc în logică (salvări, patch-uri etc.), dar la nivel vizual:

În InitiationStepLesson, înlocuiește wrapper-ul de top cu OnboardingLessonShell exact cum am făcut la Lecția 0.

children să conțină conținutul actual (text, bullet-uri, ce folosește getMicroLesson).

Pentru LessonQuiz, poți folosi fie același OnboardingLessonShell, fie layout actual, dar cu header preluat din OnboardingLessonShell pentru coerență.
