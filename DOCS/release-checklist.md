OmniMental — Release Checklist (Staging/Prod)

Preflight
- Pull latest main; ensure build + lint: `npm run build` and `npm run lint`
- Verify CHANGELOG and docs updated (gating-wizard.md)

Environment
- Set `.env` (prod):
  - `NEXT_PUBLIC_ENABLE_DEMOS=0`
  - Firebase public keys for prod project
  - `NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL=https://<prod-domain>/auth`
  - `NEXT_PUBLIC_USE_CLOUD_INSIGHTS=1` (serve Insight of the Day din Firestore) sau `0` (fallback local)
  - `NEXT_PUBLIC_ENABLE_SEED=0` (ascunde `/admin/seed-insights` în prod)
  - `NEXT_PUBLIC_DISABLE_PROGRESS_WRITES=0` (permite scrieri de progres)

Firestore Rules
- Deploy `firestore.rules` to the target project
- Confirm:
  - Profiles only owner read/write; `selection` ∈ {none,individual,group}
  - Progress facts only owner read/write; recommendation paths valid
  - Insights: read public; writes admin‑only (custom claim `admin: true`)
  - Vezi `DOCS/admin-claims.md` pentru scripturile de setare claim + seeding cu Admin SDK

Build & Smoke Tests
- Build: `npm run build` (prod env)
- Smoke test routes (logged-out & logged-in):
  - `/wizard?step=firstInput` → flow + resume `?resume=1`
  - `/choose` → Exit Modal + CTA routing
  - `/omniscop` → redirect per status (completed/incomplete)
  - `/progress?open=journal` → journal opens only after selection
  - `/recommendation` → guard to `/choose?from=reco` if selection=none
  - `/progress` → Insight card arată badge “Cloud” când `NEXT_PUBLIC_USE_CLOUD_INSIGHTS=1` și colecția `insights` este populată; fallback local când flag=0
  - `/admin/seed-insights` → nu e accesibilă în prod (flag `NEXT_PUBLIC_ENABLE_SEED=0`)

Feature Toggles
- Demo switcher hidden on prod (`NEXT_PUBLIC_ENABLE_DEMOS=0`)
 - Cloud insights activ doar dacă `NEXT_PUBLIC_USE_CLOUD_INSIGHTS=1`
 - Seeding tools ascunse (`NEXT_PUBLIC_ENABLE_SEED=0`)

Analytics (best-effort)
- Verify progress facts receive events when:
  - Re‑evaluate clicked (re_evaluate)
  - Journal opened via query (open_journal)
  - Book call from recommendation (book_call)

Post‑release
- Monitor console and Firestore write errors (resource-exhausted, permission)
- Collect quick UX feedback on resume wizard and choose flow
