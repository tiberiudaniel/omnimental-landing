Demo users & links

Purpose
- Quickly preview flows without creating accounts or filling the full wizard.

Options
- Enable on-screen demo switcher (dev): set `NEXT_PUBLIC_ENABLE_DEMOS=1` in `.env.local`.
- Use direct links (work with or without the switcher):
  - `/progress?demo=1`
  - `/recommendation?demo=1`
  - `/omniscop-lite`
  - `/omnicuno/quick-start`
  - Convenience list: `/demo`

Notes
- `?demo=1|2|3` toggles UI variants and shows a Demo badge on certain pages. It does not impersonate a real user; Firestore reads still bind to your current auth user.
- For a full demo account with persisted data, sign in (anonymous is enabled) and use the seed tools or prefill flows as needed.

