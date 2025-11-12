# OmniMental Landing – Context

## Scop
Evaluare + onboarding interactiv (wizard, progres mental, recomandări sesiuni).

Actualizare (Gating + Wizard + Demo)
- A fost implementat gating clar pentru Recomandare/Jurnal prin `profile.selection` (none/individual/group).
- Wizard resumé la primul pas incomplet (`/wizard?resume=1`), header minimal, escape către `/choose`.
- Alias rute: `/wizard`, `/omniscop` (redirijează în funcție de status), hub `/choose` cu Exit Modal.
- Paginile demo: `/omniscop-lite`, `/omnicuno/quick-start`. Switcher Demo activ cu `NEXT_PUBLIC_ENABLE_DEMOS=1`.
- `?lang` sincronizat global (vedeți components/QueryLangSync.tsx).
- Stabilizat CSR bailout: paginile cu `useSearchParams` sunt în `Suspense`.

Documentație: vezi `DOCS/gating-wizard.md` și `CHANGELOG.md` (secțiunea 2025‑11‑12).

## Structură principală
- `/app` – paginile principale (evaluare, rezultate, progres)
- `/components` – UI logic (TypewriterText, Dashboard, EvaluareSteps)
- `/lib` – logica Firestore și evaluare
- `/styles` – CSS global și variabile
- `/public` – imagini și favicon

## Versiune curentă
v1.3.0 – stabilă înainte de auditul AI

## Obiectiv audit
1. UX flow între evaluare → rezultate → progres.  
2. Structură cod, claritate TypeScript, modularitate.  
3. Optimizare performanță, reactivitate și UI.  
4. Recomandări pentru animații, interactivitate, claritate vizuală.
