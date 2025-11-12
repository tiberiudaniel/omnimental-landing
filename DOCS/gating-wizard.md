OmniMental — Gating & Wizard

Scop
- Clarifică regulile de acces (gating) și comportamentul wizard‑ului: rute, query‑uri, stări, garduri, demo.

Ce s-a implementat
- Profil cu `selection: "none" | "individual" | "group"` (default: none)
  - Jurnalul este ascuns până la alegere.
  - Recomandarea completă necesită alegere (guard pe /recommendation).

- Hub de alegere: `/choose`
  - Opțiuni: OmniScop Lite, Micro‑teste OmniCuno, Programare scurtă, Renunță (Exit Modal cu aceleași 4 CTA‑uri).
  - Bannere context: `?from=reco|lite|quick`.

- Wizard (onboarding) pe homepage, cu alias `/wizard`
  - URL: `/?step=n` (Back/Next/Skip), autosave discret în header.
  - `?resume=1`: sare la primul pas incomplet (firstInput → intent → intentSummary → cards → details).
  - Escape hatch: “Părăsește wizardul” → confirmare → `/choose?from=wizard`.
  - Guard: dacă evaluarea e completă => `/omniscop`.

- OmniScop alias: `/omniscop`
  - Dacă intent + evaluare complete ⇒ redirecționează către Recomandare.
  - Dacă incomplet ⇒ `/?resume=1&step=firstInput`.

- Demo & QA
  - Switcher demo (dev) pentru `?demo=1|2|3` (setați `NEXT_PUBLIC_ENABLE_DEMOS=1`).
  - Badge “Demo” pe Progres/ Recomandare.
  - Demo facts/timeline generate local (fără scrieri Firestore).

Rute & Query flags
- `/wizard?step=...&resume=1&lang=ro|en&open=journal`
- `/omniscop` (alias Recomandare completă)
- `/choose?from=reco|lite|quick|wizard`
- `/omniscop-lite`, `/omnicuno/quick-start`
- `/progress?open=journal&demo=1|2|3`

Garduri
- `selection === none`:
  - Jurnal ascuns (header, deep-link ignorat).
  - `/recommendation` ⇒ redirect la `/choose?from=reco`.
  - Acces permis: `/omniscop-lite`, `/omnicuno/quick-start`, `/choose`.

Componente & Lib
- components/SiteHeader.tsx — `wizardMode`, autosave label, jurnal ascuns până la alegere.
- components/WizardRouter.tsx — FAB “Jurnal” pe mobil la `reflectionSummary` (doar după alegere).
- components/DemoUserSwitcher.tsx — switcher demo (activ cu `NEXT_PUBLIC_ENABLE_DEMOS=1`).
- components/QueryLangSync.tsx — sincronizează `?lang` global (în Suspense din layout).
- lib/selection.ts — helper pentru setarea selection în profil.
- lib/progressFacts.ts — analytics simple: `recordExitModalShown`, `recordCtaClicked`.

Stabilitate Next.js
- Toate paginile care folosesc `useSearchParams()` sunt învelite în `Suspense`:
  - app/layout.tsx (QueryLangSync), app/progress/page.tsx, app/recommendation/page.tsx, app/wizard/page.tsx, app/choose/page.tsx,
    app/auth/page.tsx, app/unsubscribe/page.tsx, app/antrenament/page.tsx.

Env & Config
- `.env.local`:
  - `NEXT_PUBLIC_ENABLE_DEMOS=1` — activează switcherul demo.
  - Firebase keys + `NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL` setate corect.

QA — Tur ghidat
1) First-time anon: `/wizard?step=firstInput&lang=ro` → parcurge pașii → verifică autosave, progress bar, Escape.
2) Gating: `/choose` → Exit Modal; `/choose?from=reco` banner.
3) Lite/Quick: `/omniscop-lite`, `/omnicuno/quick-start` (badge Demo, fără jurnal).
4) Demo switcher: `/progress?demo=1` și `/recommendation?demo=1` (badge Demo, schimbă varianta).
5) Wizard resume: completează parțial apoi `/wizard?resume=1` (sare la pasul corect).
6) Guards: logat cu `selection=none` pe `/recommendation` ⇒ `/choose?from=reco`; `/omniscop` ⇒ Recomandare sau resume wizard.
7) Jurnal deep-link: `/progress?open=journal` — funcționează doar după alegere.
8) Banner “Re-evaluează”: pe `/progress` cu intent+evaluare → buton către `/wizard?resume=1`.

Analytics (best‑effort în Progress Facts)
- `recordExitModalShown(source)` — ex: `"/choose"`.
- `recordCtaClicked(variant)` — `omniscop_lite | omnicuno_quick | book_intro | quit`.

