# OmniKuno – Advanced Engine v2

Acest document rezumă versiunea actuală a engine-ului OmniKuno, după turul doi de rafinare. Este un „cheat sheet” pentru echipa de produs și dev, astfel încât toți să avem aceeași imagine despre date, UX și mecanica meta (XP, center, adaptive).

## Scopul programului

- OmniKuno este academia noastră ghidată – fiecare modul (Echilibru Emoțional, Claritate & Focus, etc.) este o mini-journey de tip Hero’s Journey cu intro ARC, 20+ lecții, protocoale recurente și mini-test final.
- Utilizatorul trece prin „misiuni” zilnice pe /omni-kuno, dar primește și recomandări rapide în Dashboard, OmniAbil și OmniFlex. Totul este conectat la aceleași module și la aceeași noțiune de XP/level.
- călătoria este adaptivă: logica din `lib/omniKunoAdaptive.ts` ajustează dificultatea lecțiilor, iar UI-ul arată notificări discrete când treci la un nivel mai greu sau mai ușor.

## Structură de date și content

- `config/omniKunoLessons.ts` descrie scheletul modulelor: ordine, tip (lesson/quiz), rezumat, dificultate, screensCount, durata și meta noi: `center` („mind/body/heart/combined”), `tags`, `learningObjectives`. Modulele sunt indexate de `OmniKunoModuleId` (id-urile oficiale din `config/omniKunoModules.ts`).
- `config/omniKunoLessonContent.ts` păstrează ecranele efective pentru fiecare lecție – tot conținutul parse-ului MD (screen.kind = content/checkpoint/quiz/reflection/protocol + arcIntro). `OMNI_KUNO_ARC_INTROS` expune cele patru zone (Trezire → Maestrie).
- `config/omniKunoFinalTests.ts` mapează mini-testele (singleChoice, scenario, fillBlank, reflection). Id-urile sunt `{moduleId}_final_test`. După finalizare, UI-ul afișează un summary cu badge și recomandare de pas următor.
- `scripts/generate_omni_kuno_content.py` transformă MD-urile (ex. `DOCS/DOCS/omniKuno_emotional_balance.md`) în config. `scripts/validateOmniKunoLessons.mjs` verifică rapid dacă există lecții prezente în DOCS dar lipsă din config, și invers.
- Datele runtime vin din `kunoFacts` (hook-ul `useProgressFacts`). `normalizeKunoFacts` standardizează XP global, lecții completate și snapshot-urile de performanță pentru fiecare modul. XP-ul este interpretat prin `lib/omniKunoXp.ts` (niveluri 0–99 / 100–249 / 250–499 / 500+).

## Flow-ul UX: /omni-kuno

1. **Header + Arc Hero** – `KunoModuleHeader` afișează tema activă, progresul (X/Y lecții) și rezumatul XP real (`XP: {total} · Nivel {n} · Următorul nivel la {threshold || "Nivel maxim atins"}`). `ModuleArcHero` arată ARC-ul zonei curente (Trezire/Primele Ciocniri/Profunzime/Maestrie).
2. **Next Best Step** – `KunoActivePanel` prezintă progresul, XP-ul și cardul „Continuă misiunea”. După completarea unei lecții, logica selectează automat următoarea lecție activă, astfel încât userul simte că înaintează natural.
3. **Timeline adaptiv** – `KunoTimeline` grupează lecțiile în zone, colorează statusul (done/active/locked) și afișează badge-ul `center` (Mind, Body, Heart, Combined). Zonele includ intro screen-uri (arcIntro) la schimbarea capitolului.
4. **LessonView** – ecranele sunt redate unul câte unul. Quiz-urile și reflecțiile au gating clar (hint text când trebuie să mai scrii 1–2 propoziții). Există data-testids pentru Playwright (e2e flow „omniKuno-lesson-flow”).
5. **Final Test** – când toate misiunile sunt finalizate, `KunoFinalTestBanner` afișează callout-ul pentru mini-test. După test, userul vede un ecran de „module completed” cu badge și CTA spre modul următor / dashboard.

## Alte suprafețe conectate

- **Dashboard** – `KunoMissionCard` rezumă tema activă („OmniKuno – Misiunea ta de azi”), XP, lecții făcute și butonul „Continuă OmniKuno mission” care duce în modul și lecția activă. Statusul folosește aceleași date de timeline ca /omni-kuno, astfel încât progresul este consistent.
- **Kuno Learn & Practice** – paginile `/kuno/learn` și `/kuno/practice` reutilizează aceleași componente, dar într-o versiune concentrată (sesiuni rapide). La final, utilizatorul primește CTA „Continuă în OmniKuno”.
- **Recomandări & Facts** – wizard-ul, recomandările și modulul OmniKnowledge lucrează cu același set de module (`OMNIKUNO_MODULES`). Tot ceea ce salvează `moduleId` trebuie să folosească `OmniKunoModuleId`, fără aliasuri istorice.

## Meta Mind / Body / Heart

- `center` este vizibil în timeline și lesson view ca mic badge (ex: Mind pentru lecțiile de focus, Body pentru respirație/energie, Heart pentru ritualuri și compasiune, Combined pentru lecțiile integrate).
- Emotional Balance, Claritate & Focus și Energie & Corp au centre individuale marcate manual în `config/omniKunoLessons.ts`, astfel încât UI-ul poate afișa mixul de meta competențe pe parcursul modulului.
- Acest meta va hrăni recomandări cross-modul, rapoarte din dashboard și eventual modulul Mind–Body (lecțiile overview deja există în `omniKuno_mind_body_overview.md` ca sursă pentru extinderi).

## Practică & QA

- După orice modificare de content:
  1. Actualizează MD-ul, rulează `python3 scripts/generate_omni_kuno_content.py`.
  2. Rulează `node scripts/validateOmniKunoLessons.mjs` pentru a depista lecții lipsă.
  3. Rulează `npm run lint`, `npm run build` și `npx playwright test --grep "Kuno|OmniKuno"`.
- Pentru QA manual: accesează `/omni-kuno?e2e=1`, finalizează o lecție cu reflection (min. 3 caractere), verifică gating-ul quiz/reflection, finalizează modulul și rulează mini-testul. Confirmă că Dashboard → card OmniKuno reflectă progresul proaspăt.

Acest overview ar trebui să fie suficient pentru a conecta content-ul din DOCS, logica TS și UX-ul final al OmniKuno v2, fără a scormoni prin fiecare fișier lung. Pentru detalii avansate rămâne referința completă `DOCS/DOCS/omniKuno_engine_master.md`.
