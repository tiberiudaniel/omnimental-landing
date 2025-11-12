OmniMental — Release Checklist (Staging/Prod)

Preflight
- Pull latest main; ensure build + lint: `npm run build` and `npm run lint`
- Verify CHANGELOG and docs updated (gating-wizard.md)

Environment
- Set `.env` (prod):
  - `NEXT_PUBLIC_ENABLE_DEMOS=0`
  - Firebase public keys for prod project
  - `NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL=https://<prod-domain>/auth`

Firestore Rules
- Deploy `firestore.rules` to the target project
- Confirm:
  - Profiles only owner read/write; `selection` ∈ {none,individual,group}
  - Progress facts only owner read/write; recommendation paths valid

Build & Smoke Tests
- Build: `npm run build` (prod env)
- Smoke test routes (logged-out & logged-in):
  - `/wizard?step=firstInput` → flow + resume `?resume=1`
  - `/choose` → Exit Modal + CTA routing
  - `/omniscop` → redirect per status (completed/incomplete)
  - `/progress?open=journal` → journal opens only after selection
  - `/recommendation` → guard to `/choose?from=reco` if selection=none

Feature Toggles
- Demo switcher hidden on prod (`NEXT_PUBLIC_ENABLE_DEMOS=0`)

Analytics (best-effort)
- Verify progress facts receive events when:
  - Re‑evaluate clicked (re_evaluate)
  - Journal opened via query (open_journal)
  - Book call from recommendation (book_call)

Post‑release
- Monitor console and Firestore write errors (resource-exhausted, permission)
- Collect quick UX feedback on resume wizard and choose flow

