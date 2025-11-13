Insights seeding (Cloud)

Purpose
- Populate Firestore collection `insights` with daily-rotated micro‑texts, grouped by theme.

Schema
- Collection: `insights`
- Document IDs: `Calm`, `Clarity`, `Energy`, `Focus`
- Fields: `{ items: string[] }`

How to seed
1) Ensure Firebase env vars are set in `.env.local` and the app can sign in (anonymous is fine if rules allow authenticated users to write to `insights/*`).
2) Set `NEXT_PUBLIC_ENABLE_SEED=1` in `.env.local`.
3) Start the app, visit `/admin/seed-insights` and click “Seed now”.
4) After seeding, unset `NEXT_PUBLIC_ENABLE_SEED` (or set to 0) to hide the page.

Data source
- The items seeded come from `lib/insights.ts` (INSIGHTS constant). You can extend this list and re-run the seeder.

Notes
- If Firestore rules block writes to `insights/*`, temporarily allow authenticated write access or run the seeding with an admin tool.
- The dashboard reads cloud insights only when `NEXT_PUBLIC_USE_CLOUD_INSIGHTS=1`. Otherwise it falls back to local insights.

