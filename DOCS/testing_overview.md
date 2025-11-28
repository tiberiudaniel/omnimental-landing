# Test Suite Overview

Acest document rezumă tipurile de teste din proiect, ce garantează fiecare și ce lipsește încă.

## E2E (end‑to‑end)

- `tests/e2e/dashboard-data-flow.spec.ts` — Jurnal + Kuno: salvează, actualizează „Însemnări recente” și validează metrici în dashboard.
- `tests/e2e/experience-kuno-to-progress.spec.ts` — Onboarding experiență → mini‑test; scorul apare ca Omni‑Cuno pe dashboard.
- `tests/e2e/experience-onboarding.spec.ts` — Flow demo: intro → auto‑evaluare → mini‑cuno → recomandare (cu pas opțional).
- `tests/e2e/kuno-learn.spec.ts` — Lecție Kuno: pornește, răspunde, finalizează și ajunge la /progress cu Omni‑Cuno vizibil.
- `tests/e2e/kuno-practice-cat.spec.ts` — Practică Kuno într‑o categorie; salvează și revine la /progress.
- `tests/e2e/kuno-practice-multi.spec.ts` — Practică adaptivă pe mai multe categorii; salvează și revine la /progress.
- `tests/e2e/onboarding.spec.ts` — Onboarding complet (demo) până la recomandare; verifică lipsa erorilor UI.
- `tests/e2e/progress-experience-cta.spec.ts` — CTA „Continuă experiența” pe /progress: afișare/ascundere după completare.
- `tests/e2e/progress-journal.spec.ts` — Jurnal din /progress: autosave/close, toast și „Însemnări recente”.
- `tests/e2e/progress.spec.ts` — Dashboard demo: toggle Zi/Săptămână și Minute/Sesiuni (trenduri) și vizibilitate grafice.
- `tests/e2e/wizard-edge-cases.spec.ts` — Wizard: cazuri limită (înapoi, schimbări de răspuns, valori extreme) până la recomandare.
- `tests/e2e/wizard-fuzz.spec.ts` — Wizard „fuzz”: alegeri random + rulari multiple (configurabil cu `E2E_FUZZ_RUNS`).
- `tests/e2e/wizard-multiple-users.spec.ts` — Wizard pentru 10 profile tipice, scenarii deterministe.
- `tests/e2e/wizard-stress-test.spec.ts` — Wizard stress: runde repetate, așteptări stricte de stabilitate și erori de consolă.

## Unit

- `tests/unit/progressAnalytics.test.cjs` — Funcții analytics: bucket‑uri zilnice/săptămânale, numărări, etichete locale și calcule auxiliare.

## Integrare

- `tests/integration/adaptProgressFacts.integration.test.cjs` — Integrare/transformare „progressFacts”; verifică coerența agregărilor la nivel de module.

## Logică generală

- `tests/logic.test.cjs` — Verificări rapide de logică la nivel de pachet (reguli/calcul simplu), pentru feedback imediat.

---

## Cum folosim testele

- **E2E**: validează fluxuri reale cap‑coadă (UI + stocare client + API/fallback). Folosite pentru regresii vizibile de utilizator și stabilitatea interacțiunilor.
- **Unit**: asigură corectitudinea funcțiilor pure sau a componentelor independente de UI complex.
- **Integrare**: confirmă că mai multe module lucrează coerent împreună (fără tot UI‑ul).
- **Logic**: rulează rapid niște aserții de bază pe părți centrale ale proiectului.

Scripturi utile:

- `npm run test:smoke` — 3 E2E critice (onboarding, progress, journal) pe `E2E_BASE_URL=http://localhost:3001`.
- `npm run test:all` — rulează logic, unit, integrare și toate E2E.

---

## GAPS & NEXT TESTS

Zone fără acoperire E2E sau cu acoperire parțială:

- Autentificare cu „invitat special” + magic link (formular e‑mail, trimitere link, mesaj de confirmare).
- Pagina `group-info` și „Enter as Special Guest” la final (CTA‑uri și jurnal/flow ulterior).
- Pagina `recommendation` (publică/membru): vizibilitate badge, sincronizare `readRecommendationCache`, butoane „Choose format/Book call/Group”.
- „First input” (pasul inițial): input liber + „Teme principale” (toggle), exclus dubluri în cloud.
- Comutarea limbii (ro/en) și etichete cheie (ex. „Azi/Today”, „Trend săptămânal/Weekly trend”).

Propuneri de teste noi:

1) `tests/e2e/auth-magic-link.spec.ts`
   - Parcurge: `group-info` → „Enter as Special Guest” → introduce e‑mail → confirmă feedback (fără a verifica e‑mail real). Verifică evenimentele `magic_open/magic_close/magic_sent` (dacă sunt vizibile în UI sau prin log).

2) `tests/e2e/recommendation-public-member.spec.ts`
   - Public: accesează `/recommendation` fără profil → vede „PublicRecommendationView”.
   - Membru: cu profil demo → vede „MemberRecommendationView”, badge, motive și CTA‑uri vizibile.

3) `tests/e2e/wizard-first-input.spec.ts`
   - La `/?step=firstInput`: scrie liber și continuă; apoi deschide „Inspiră‑te din exemple”, alege o expresie curated; verifică faptul că expresia aleasă nu reapare în cloud (excludere ID).

4) `tests/e2e/i18n-switch.spec.ts`
   - Schimbă limba la `?lang=en` și verifică etichete‑cheie (Today/Week/Minutes) pe dashboard și în wizard.

5) `tests/e2e/group-info-cta.spec.ts`
   - Accesează `/group-info`; verifică CTA‑ul „Enter as Special Guest” sus și jos; deschide modalul cont și închide (fără trimitere).

