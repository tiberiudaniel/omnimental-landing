Calculi și surse — OmniMental

1) Clarificare intenție (Page 3)
- Intrări: tag‑uri selectate în Intent Cloud (țintă 5–7), plus jurnal text opțional.
- Colectare:
  - `components/IntentCloud.tsx` — parole (IntentCloudWord) cu categorie primară.
  - Se emit: `tags[]`, `categories[]` (șir + count), `selectionIds[]`.
- Persistare:
  - `userIntentTags` (tags + categories pentru telemetrie punctuală).
  - În pasul „rezumat intenție”: `userIntentSnapshots` + `userIntentInsights`.
  - Mirror în profil: `userProgressFacts.intent` via `recordIntentProgressFact`.

2) Agregare categorii (sursa unică)
- Fișier: `lib/intentSelection.ts`.
  - `INTENT_MIN_SELECTION = 5`, `INTENT_MAX_SELECTION = 7`.
  - `computeCategoryCounts(words, selectionIds)` → `{ categories, total }` sortate desc.
- Folosit în: `components/IntentCloud.tsx` (emiterea rezultatului consistent).

3) Hartă teme → indicatori (radar)
- Fișier: `lib/indicators.ts`.
  - `intentCategoryToIndicator` mapează chei semantice la 5 dimensiuni (clarity, relationships, calm, energy, performance).
  - `buildIndicatorSummary(categories)` → `{ sourceCounts, chart, shares }` pentru radar; shares = pondere din selecții, în [0..1].

4) Scoruri pe dimensiuni (pentru recomandare)
- Fișier: `lib/scoring.ts`.
  - `computeDimensionScores(categories, urgency)` — agregă și normalizează pe 6 dimensiuni, factor urgență.

5) Recomandare sesiuni
- Fișier: `lib/recommendation.ts`.
  - `recommendSession({ urgency, primaryCategory, dimensionScores, hasProfile })` → `recommendedPath` + `reasonKey`.

6) Consistență și scor OmniIntel
- Fișier: `lib/omniIntel.ts`.
  - Agregă knowledge/skills/directionMotivation/consistency într‑un indice.
- Persistare: `progressFacts.omni.*` și timeline evaluări.

7) Principii de afişare număr selecții
- Doar un format: `selectate / maxim` (ex.: `2 / 7`), cu hint țintă `5–7`.
- Suma totală a categoriilor = `numărul de selecții`.
- Singura sursă pentru total/număr categorii: `computeCategoryCounts`.

8) Validări de date
- Tag‑uri: `sanitizeTags()` — trim, limită 50.
- Jurnal: tăiere la 1000 caractere, gol ignorat.
- Categorii: filtrare intrări invalide, count > 0.

9) Persistări
- `userIntentTags`: eveniment brut din cloud.
- `userIntentSnapshots`: instantaneu + evaluare + meta (algo, recommendation etc.).
- `userIntentInsights`: extras pentru analize.
- `userProgressFacts`: mirror incremental (intent/motivation/recommendation/omni).

10) Testare
- Verificare: `sum(categories.count) === tags.length` pentru orice snapshot.
- Radar: sumă pe surse = sumă pe categorii re‑mapată.
