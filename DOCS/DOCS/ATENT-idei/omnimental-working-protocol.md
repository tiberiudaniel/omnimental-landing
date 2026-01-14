# OmniMental Working Protocol (Windsurf + Codex)

**North Star:** Keep the OmniMental repo **buildable, test-green, and shippable** with the least friction possible.

You are Codex working **inside Windsurf** with direct access to this repo.

---

## 1. Router (what to do when you’re called)

Given the user’s request + logs:

- **Single bug or failing test in this repo** → Inspect files in the repo, implement the minimal fix, run the relevant tests.
- **Small feature or copy/UX tweak** → Edit only the necessary files, keep behavior consistent, reuse patterns.
- **Multi-file refactor / feature** → Still keep scope tight, but you may touch multiple related modules (same domain).

You do **not** need to ask for the repo or large file dumps; assume you can open any file here.

---

## 2. How to use the repo

When diagnosing or implementing:

1. Use file operations and search:
   - `ls`, `find`, `rg "<symbol or test id>"`, `rg "data-testid=\\"...\\\""`, etc.
2. Open the concrete files:
   - Components under `app/` or `components/`
   - Tests under `tests/` or `components/**/tests/`
   - Shared helpers in `lib/`, `utils/`, etc.
3. Follow the code path end-to-end:
   - From UI → hooks → helpers → persistence (localStorage/Firebase) → tests.

If something is undefined or broken, **fix it in the repo; don’t ask the user to guess.**

---

## 3. Scope + safety

- Do:
  - Make the **smallest** coherent change that satisfies the tests/spec.
  - Respect existing architecture, naming, and patterns.
  - Keep behavior backwards-compatible unless the user explicitly wants a change.

- Don’t:
  - Introduce big new abstractions “just because”.
  - Rename/reshape public APIs unless necessary for the fix.
  - Ask the user to paste giant files you can open yourself.

---

## 4. Tests, builds, and logs

- Prefer targeted commands that the user already uses here, e.g.:
  - `npm run test:v4`
  - `npm run lint`
  - `npm run build`
- When a test is mentioned (e.g. `WorkflowBoard.test.tsx`), your priority is:
  1. Make that test pass legitimately (no mocking away core behavior unless clearly intended).
  2. Ensure related tests in the same suite/file still pass.

If the environment prevents tests from running, say so explicitly and fall back to static reasoning + type checks.

---

## 5. Output format

Always reply in this compact, structured way:

- **What I inspected:**
  - `components/admin/workflow/WorkflowBoard.tsx`
  - `components/admin/workflow/tests/WorkflowBoard.test.tsx`
  - plus any other key files
- **Root cause (short):**
  - 1–3 bullets describing the actual bug / mismatch vs tests.
- **Fix (summary):**
  - 1–3 bullets describing what you changed conceptually.
- **Changed files:**
  - `path/to/file1`
  - `path/to/file2`
- **Commands run:**
  - `npm run test:v4`
- **Results:**
  - `npm run test:v4` → PASS / FAIL (+ short note)
- **Next step (single step):**
  - e.g. “Smoke-test the Workflow admin UI in the browser.”

Stay concrete and repo-grounded. No vague “maybe try X”; always give a specific fix in code.
