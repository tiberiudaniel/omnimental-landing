This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Development

1) Environment
- Enable Firebase Auth: Email link (passwordless)
- Add app origin to Firebase Auth “Authorized domains”
- `.env.local` must include Firebase config and:
  - `NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL` = app origin (e.g. http://localhost:3000)

2) Install & run
```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Wizard Funnel Notes

- The onboarding wizard persists its state (journal entry, cloud selections, evaluation answers, and current step) in `localStorage` via `components/wizardStorage.ts`.
- `useWizardData` + `useWizardSteps` hydrate from storage on mount and write back after each change; storage clears automatically after a journey choice is saved.
- `components/WizardProgress.tsx` renders the responsive milestone header + linear progress bar on every step beyond the intro animation.
- `components/RecommendationStep.tsx` now ends with a follow-up CTA (“Email me the recap”) that reuses `components/CTAButton` and writes to the `signups` collection.

### Local Dev TLS (next/font)

- If Turbopack logs TLS errors fetching Google Fonts, we enable system CA usage via `experimental.turbopackUseSystemTlsCerts: true` in `next.config.ts`.
- Alternatively, set the env var when starting dev:
  - Windows: `set NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 && npm run dev`
  - WSL/Linux/macOS: `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run dev`

### QA Checklist

1. Fill the wizard, refresh, and confirm inputs persist.
2. Complete the flow and check `localStorage.getItem("omnimental_wizard_state_v1")` is `null`.
3. Submit the recap CTA and verify the new entry in Firestore.

### DailyPath QA Links

- Add `NEXT_PUBLIC_SHOW_QA_LINKS=true` to `.env.local` (restart dev server) to display a QA helper panel on `/recommendation`.
- The panel lists shortcut links for every cluster (energy, clarity, emotional_flex), mode (deep, short), and language (RO, EN). Each link simply opens `/recommendation` with the appropriate query (`?cluster=energy&mode=short&lang=en`, etc.).
- You can also hit those URLs directly without the panel; removing the env var hides the QA controls for production builds.

## Flow Studio

1. **Bootstrap admin config** – set the `FLOW_STUDIO_ADMINS="you@example.com"` env variable (comma-separated list) and run `npm run bootstrap:flowstudio`. This writes `adminConfig/flowStudio` with the whitelist + timezone used by the admin gate.
2. **Sync routes** – whenever routes change run `npm run gen:routes` followed by `npm run sync:routes` (requires Firebase Admin env vars). This scans `app/**/page.tsx`, rebuilds `generated/routes.generated.json`, and upserts every route into `adminRoutes` for Flow Studio to consume.
3. **Edit flows + copy** – sign in with an approved admin account and open `/admin/flow-studio`. Use the Routes tab to add screens, the Flows tab to edit nodes/edges, and the sidebar copy editor to override H1/subtitle/CTA strings (saved in `copyOverrides/{screenId}`). Runtime screens now consume these overrides through `useCopy`.

## How to test

1. Run `npm run dev` and sign in with a non-admin + admin user to check telemetry captures both contexts.
2. Visit `/today` (or any route) and verify the console logs `[telemetry] screen_view`.
3. In Firestore, confirm new docs appear in `telemetryEvents` with your userId + route path.
4. Open `/admin/flow-studio`, toggle the Observed overlay, and ensure node stats + events refresh when switching windows or segments.
5. Reload Flow Studio to confirm saved nodes/edges (with handle positions) and observed overlays persist.

## Scripts

- `npm run dev` — start development
- `npm run build` — production build
- `npm start` — run production build
- `npm run lint` — lint project
- `npm run test:logic` — run logic tests (scoring/recommendation/consistency)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1) Create a Vercel project from this repo
2) Add Environment Variables (NEXT_PUBLIC_* Firebase + NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL)
3) Publish Firestore rules (firestore.rules) in Firebase Console
4) Deploy main branch

CLI alternative:
```bash
vercel link
vercel env pull .env.local
vercel --prod
```
