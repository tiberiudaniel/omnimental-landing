# OmniKuno – Engine, Pagina principală și Cardul din Dashboard

Acest document definește, la nivel unitar:

- rolul OmniKuno în ecosistemul OmniMental,
- arhitectura pe straturi (conținut, testare, engine XP, UI),
- cum se leagă onboarding-ul de OmniKuno,
- cum arată și cum funcționează pagina OmniKuno,
- cum arată și cum funcționează cardul OmniKuno din Dashboard,
- regulile de scoring, XP și nivel.

Este „sursa oficială de adevăr” pentru Codex atunci când implementează sau extinde OmniKuno.

---

## 1. Poziționare – ce este OmniKuno

OmniKuno este **engine-ul de cunoștințe și testare educativă** din OmniMental.

- Tradus pentru user:
  - „locul unde înveți lucruri relevante pentru tine și îți testezi înțelegerea în pași mici”.
- Tradus pentru dev:
  - stratul de conținut + mini-testare care:
    - ia semnalele din onboarding (Intent, Cloud, mini-auto-evaluare),
    - construiește un „curriculum” personalizat,
    - oferă lecții + quiz-uri,
    - întoarce XP și nivel pe arii (calm, energie, relații, performanță, sens etc.).

OmniKuno apare în 3 locuri principale:

1. **Onboarding (mini-test Kuno)** – userul simte că „începe ceva” încă din primele minute.
2. **Pagina OmniKuno** – engine-ul complet de învățare (Academia).
3. **Cardul OmniKuno pe Dashboard** – widget de status + scurtătură spre pagina mare.

---

## 2. Arhitectură – straturi și responsabilități

OmniKuno funcționează pe 4 straturi:

1. **Stratul de conținut**  
   (definit în `DOCS/omnikuno-content-standard.md` + config TypeScript)

   - Lecții, micro-lecții, itemi de quiz, scale, reflecții, exerciții.
   - Organizate pe:
     - domeniu (ex. Biohacking & Sănătate, Flexibilitate psihologică, Relații etc.),
     - categorie (Calm, Energie, Relații, Performanță, Sens etc.),
     - sub-categorii,
     - nivel (Inițiere, Intermediar, Avansat).
   - Config în cod:
     - `config/omniKunoLessons.ts` – definește module (ex. `CALM_LEVEL1`) cu 8–11 „misiuni” (lecții + quiz-uri),
     - `lib/omniKuno*.ts` – definește întrebările pentru quiz-uri per topic.

2. **Stratul de testare (mini-test Kuno)**  
   (definit în `DOCS/kuno-teste-educative.md`)

   - Logica de matching:
     - din Intent + Cloud + mini-auto-evaluare → alege topic-ul principal,
     - definește `topicKey` (ex. `relatii`, `calm`, `energie` etc.).
   - Structura mini-testului:
     - întrebări de tip knowledge, scenariu, reflecție,
     - structurate ca TypeScript interfaces (`OmniKunoQuestion`, `OmniKunoOption` etc.).
   - Mini-testele:
     - se folosesc în onboarding ca „micro-quest” inițial,
     - se reutilizează ca quiz-uri în modulele OmniKuno.

3. **Stratul de engine XP / nivel**  
   (definit în `lib/engine.ts` și eventual `DOCS/engine.md` / `unified-engine.md`)

   - Există un singur engine de XP pentru întreaga platformă.
   - OmniKuno nu are engine separat; folosește:
     - `addXp(areaKey, amount)` pentru a adăuga XP pe o arie (calm, energie, relații etc.),
     - `getLevelForArea(areaKey)` pentru a citi nivelul curent,
     - `getRecommendedNextAction(userState)` pentru a sugera următoarea mișcare.
   - Decay (scădere XP / nivel) se aplică tot prin engine, nu în OmniKuno.

4. **Stratul de interfață (UI/UX)**

   - **Onboarding**:
     - q wizard cu Intent + Cloud + mini-auto-evaluare + mini-test Kuno.
   - **Pagina OmniKuno**:
     - harta completă a „Academiei” (teme, module, lecții, quiz-uri).
   - **Cardul OmniKuno pe Dashboard**:
     - widget de stare + scurtătură, nu engine propriu.

---

## 3. Data model – module, lecții, quiz-uri, progres

### 3.1. Module OmniKuno

Un modul OmniKuno este „o mini-campanie de învățare” pe o singură temă.

Exemple:

- `calm_level1` – Calm / Echilibru emoțional · Inițiere.
- `energy_level1` – Energie & oboseală · Inițiere.
- `relations_level1` – Relații & susținere · Inițiere.
- etc.

Reguli:

- Un modul nivel 1 are în mod ideal:
  - 8 lecții scurte (concept + exemplu + aplicare),
  - 2–3 quiz-uri (mix knowledge + scenariu).
- Total: 10–11 „misiuni” într-un modul.

În TypeScript (în `config/omniKunoLessons.ts`):

- `OmniKunoLesson` include:
  - `id`
  - `title`
  - `shortDescription`
  - `order`
  - `type` (`"lesson"` | `"quiz"`)
  - `quizTopicKey?` (pentru legătura cu întrebările din `lib/omniKuno*.ts`)

- `OMNIKUNO_MODULES` mapează:
  - `categoryKey` (ex. `calm`, `energy`, `relatii`) → `{ moduleId, topicKey, lessons[] }`.

### 3.2. Progres user OmniKuno

Progresul unui user se salvează în `facts.omni.kuno` (sau structura echivalentă):

- per `moduleId`:
  - `completedIds: string[]` – ID-urile misiunilor finalizate,
  - `lastLessonId?: string` – ultima misiune atinsă,
  - `lastUpdated: timestamp`.

Engine-ul XP stochează separat:

- XP per arie (calm, energie, relații etc.),
- nivel per arie,
- eventual „lastActiveAt” per arie.

---

## 4. Integrarea cu Onboarding

Onboarding-ul (vezi `master-onboarding-brief.md` și `onboarding-brief.md`) trebuie să:

1. **Detecteze tema principală (focus)**

   - Din:
     - Intent + Cloud (ce expresii a ales userul),
     - mini-auto-evaluare (energia, stres, claritate etc.),
     - mini-test Kuno (din `kuno-teste-educative.md`).

   - Rezultat:
     - `focusTheme` = { `area`, `categoryKey`, `reason` },
     - ex:
       - `area = "Echilibru emoțional"`
       - `categoryKey = "calm"`

2. **Inițializeze engine-ul XP**

   - Pe baza mini-testului:
     - generezi un scor inițial 0–100,
     - îl mapezi în XP pentru aria respectivă (vezi secțiunea 6).
   - Engine-ul reține:
     - XP inițial pentru aria `calm` (sau ce a rezultat),
     - nivelul inițial (de obicei Level 1).

3. **Seteze modul OmniKuno recomandat**

   - Din `categoryKey` → `OMNIKUNO_MODULES[categoryKey]`.
   - Salvezi:
     - `recommendedModuleId` pentru user (poate în `facts.omni.kuno` sau într-un câmp de profil).

4. **Transfer către Dashboard și pagina OmniKuno**

   - Dashboard:
     - cardul OmniKuno citește `focusTheme` + `recommendedModuleId` + progres,
     - afișează tema, modulul și misiunea activă.
   - Pagina OmniKuno:
     - deschide modulul recomandat by default,
     - explică: „această temă a fost aleasă pe baza răspunsurilor tale de la început”.

---

## 5. Pagina OmniKuno – Engine complet de învățare

### 5.1. URL și routing

Sugestie:

- `app/(app)/omni-kuno/page.tsx` (sau `/learn/omni-kuno` dacă vrei o zonă „Academy”).

Routing:

- `/omni-kuno` – intrare generală.
- `/omni-kuno?area=calm&module=calm_level1&lesson=calm_l3` – deep-link spre o misiune exactă.

### 5.2. Obiectiv UX

Când userul intră pe această pagină, trebuie să înțeleagă rapid:

1. **Pe ce temă lucrează acum** – focus topic.
2. **Cât de departe a ajuns** – modul, misiuni completate, nivel.
3. **Ce poate face ACUM** – un singur „next best step” clar.
4. **Ce alte teme există** – overview (nu haos, ci mapă clară).

Pagina este „Academia” completă – aici se consumă conținutul, se fac quiz-urile, se construiește XP.

### 5.3. Layout (recomandare)

Structură în 2–3 zone:

1. **Header OmniKuno (full width)**

   Elemente:

   - Titlu: `OmniKuno – Engine-ul tău de cunoștințe`.
   - Subtitlu scurt (RO + EN) – ce câștigă userul aici.
   - Badge:
     - „Focus actual: [area]”
     - ex. „Focus actual: Echilibru emoțional (Calm)”.
   - Rezumat nivel:
     - `Nivel 2 · 145 XP în zona Calm`.

2. **Sidebar tematic (stânga)**

   Listă de arii/tipuri:

   - Calm / Echilibru emoțional
   - Energie & oboseală
   - Relații & susținere
   - Performanță & focus
   - Sens & identitate

   Pentru fiecare:

   - mic chip cu numele ariei,
   - bară XP mică + Level,
   - icon simplu.

   Tema curentă (din `focusTheme`) are highlight.

   Interacțiune:

   - click pe o arie:
     - schimbă modulul activ (ex: de la `calm_level1` la `energy_level1`),
     - updat-ează timeline-ul de misiuni.

3. **Coloană principală – Misiune activă**

   Conținut:

   - Header local:
     - `Misiunea activă: [Numele modulului]` (ex. „Calm Level 1 – Fundamente”).
   - Progress:
     - bară cu `X / Y misiuni` + text clar.
   - Timeline de misiuni:
     - obținut din `OMNIKUNO_MODULES[moduleId].lessons`,
     - pentru fiecare misiune:
       - tip (Lecție / Quiz),
       - status: `locked` / `active` / `done`,
       - titlu + scurtă descriere,
       - icon mic:
         - done → check,
         - active → bullet accentuat,
         - locked → lacăt sau bullet pal.

   - „Next best step”:
     - deasupra timeline-ului sau chiar ca buton mare:
       - `Continuă de unde ai rămas`,
       - determinat de prima misiune cu `status = active`.

4. **Panel de conținut (sub timeline sau în dreapta)**

   Când userul selectează o misiune:

   - Dacă este **Lecție** (`type = "lesson"`):
     - se afișează:
       - titlu,
       - 1–2 paragrafe de context,
       - 3–5 bullet-uri cheie,
       - 1–2 mini-exemple,
       - 1–2 exerciții practice.
     - Butoane:
       - `Am înțeles / Am exersat` → marchează misiunea ca done + trimite XP în engine.
       - `Mai târziu` → nu marchează, dar poate memora „de revizitat”.

   - Dacă este **Quiz** (`type = "quiz"`):
     - se încarcă întrebările aferente (`quizTopicKey`) din `lib/omniKuno*.ts`.
     - Se rulează secvența de întrebări.
     - La final:
       - se calculează scor,
       - se scrie un feedback scurt,
       - se mapează scorul în XP,
       - se marchează misiunea ca `done`.

### 5.4. Stări UX critice

1. **User nou (doar onboarding)**

   - Are doar 1 modul recomandat (ex. `calm_level1`).
   - Pagina afișează:
     - „Începe de aici”,
     - primele 1–2 misiuni ca „active”,
     - celelalte teme vizibile, dar cu mesaje de tip „Se deblochează după ce termini 3 misiuni în Calm”.

2. **User în progres**

   - Vezi clar:
     - „Ai finalizat 4/10 misiuni în Calm Level 1.”
   - CTA:
     - „Continuă misiunea.”

3. **User inactiv de mult timp**

   - Engine-ul a aplicat decay.
   - Pagina poate afișa:
     - „Nu ai mai exersat în Calm de 14 zile. Începe cu un quiz recapitulativ.”  
       (quiz special de recap, sau primul quiz din modul).

---

## 6. Cardul OmniKuno pe Dashboard – widget de status, nu engine

Cardul OmniKuno de pe `/progress` este un **rezumat + scurtătură**, nu motorul de învățare.

### 6.1. Rol

Cardul trebuie să răspundă la 3 întrebări pentru user:

1. „Pe ce lucrez acum?”  
2. „Cât am progresat?”  
3. „Ce pot face chiar acum?”  

Și să ofere **un singur CTA clar**:

- `Continuă misiunea OmniKuno` → navighează la pagina OmniKuno, fix pe modul și misiunea activă.

### 6.2. Conținut

1. **Header**

   - Titlu card:
     - `OmniKuno – Misiunea ta de cunoștințe`.
   - Subtitlu scurt:
     - `Tema ta principală: [area]` (din `focusTheme`).
     - `Misiunea: acumulează cunoștințe pe tema asta.`

2. **Rezumat progres**

   - „4 / 10 misiuni finalizate în Calm Level 1”.
   - „Nivel 2 · 145 XP”.

3. **Misiuni următoare (mini-listă)**

   - Afișează DOAR 2–3 itemi:
     - misiunea activă,
     - încă 1–2 „coming next”.
   - Fiecare item:
     - icon (lecție/quiz, done/active/locked),
     - titlu scurt,
     - tag „Quiz” dacă este cazul.

4. **CTA principal**

   - Buton mare:
     - RO: `Continuă misiunea OmniKuno`
     - EN: `Continue OmniKuno mission`
   - OnClick:
     - navighează la:
       - `/omni-kuno?area=[focusArea]&module=[moduleId]&lesson=[activeLessonId]`.

5. **Link secundar (opțional)**

   - `Vezi toate misiunile OmniKuno` → `/omni-kuno`.

### 6.3. Ce NU trebuie să facă cardul

- Nu rulează quiz-uri complete.
- Nu afișează tot timeline-ul modulului (max 2–3 misiuni).
- Nu are engine XP separat.
- Nu conține logică de gating; doar citește statusul din engine/lessons și îl prezintă.

---

## 7. Scorare, XP și nivel

Reguli de bază (armonizate cu `omnikuno-content-standard.md`):

1. **Lecții**

   - Marcare ca `done` → `+5 XP` pe aria respectivă.
   - Dacă lecția e mai „grea” (flag în config) → `+8 XP`.

2. **Quiz-uri**

   - Scor 80–100% → `+15 XP` + eventual boost de nivel (dacă trece praguri).
   - Scor 50–79% → `+8 XP`.
   - Scor <50% → `+3 XP` + recomandare de recapitulare.

3. **Mini-test Kuno din onboarding**

   - Scor inițial (0–100) → mapat în XP inițial:
     - 0–33 → `XP 10`, Level 1 (mai jos în modul).
     - 34–66 → `XP 20`, Level 1 (mijloc de modul).
     - 67–100 → `XP 30`, Level 1 sau aproape de Level 2.

Mapping exact se documentează într-o secțiune comună de engine (ca să nu ai două formule paralele).

Important:

- TOT XP-ul intră prin `engine.addXp(areaKey, amount)`.
- OmniKuno doar decide **cât** XP dă pentru o acțiune.
- Nivelurile și decay-ul sunt calculate centralizat.

---

## 8. Gating și „status” misiuni

Status-urile pentru misiuni (lecție/quiz):

- `done` – userul a finalizat misiunea.
- `active` – următoarea misiune pe care o ai de făcut în modul.
- `locked` – viitoare misiuni din modul, încă neaccesibile.

Regulă simplă de gating într-un modul:

- toate misiunile în ordine,
- parcurgi `lessons[]`:
  - dacă `id` este în `completedIds` → `done`,
  - prima misiune care nu e în `completedIds` → primește `active`,
  - tot ce vine după → `locked`.

Pagina OmniKuno:

- afișează TOT timeline-ul (cu `done/active/locked`),
- permite click DOAR pe:
  - `active`,
  - `done` (pentru revizitare),
- afișează clar dacă o misiune e `locked`.

Cardul OmniKuno:

- **nu are nevoie** să știe gating complet; primește deja lista de misiuni cu status pre-calculat și afișează doar 2–3.

---

## 9. Separarea responsabilităților – pentru a fi ușor de upgradat

Pentru evoluție simplă pe termen lung:

1. **Conținut (text, structuri, taxonomie)**  
   – se definește și se schimbă în:
   - `DOCS/omnikuno-content-standard.md`,
   - `config/omniKunoLessons.ts`,
   - `lib/omniKuno*.ts`.

2. **Engine XP & nivel**  
   – se definește și se schimbă în:
   - `lib/engine.ts`,
   - eventual `DOCS/engine.md`.

3. **Onboarding (wizard + mini-test)**  
   – se definește în:
   - `DOCS/master-onboarding-brief.md`,
   - `DOCS/onboarding-brief.md`,
   - `DOCS/kuno-teste-educative.md` (structura mini-testelor),
   - componentele din `app/(app)/experience-onboarding/*`.

4. **Pagina OmniKuno**  
   – se definește în:
   - prezentul document (layout, flux),
   - componentele din `app/(app)/omni-kuno/*`.

5. **Cardul OmniKuno (Dashboard)**  
   – se definește în:
   - prezentul document (rol, conținut, CTA),
   - `DOCS/progress-dashboard-brief2.md` (grid general),
   - componentă React specifică, ex. `components/dashboard/KunoMissionCard.tsx`.

Principiu:  
Când vrei să faci upgrade (ex. „adăugăm un nou nivel pe tema Performanță”), modifici:

- DOAR content + config de module + eventual mapping XP,  
nu și tot onboarding-ul + dashboard-ul, pentru că structura rămâne aceeași.



