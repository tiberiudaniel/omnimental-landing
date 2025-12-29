# FlowStudio Worlds, Tags & Portals — Canon Plan v1

Am nevoie să pornim o săptămână de lucru pe baza unui CANON clar (worlds/tags/portals + Today hub). Te rog urmează exact pașii de mai jos, fără interpretări care duc la duplicare.

0) Creează branch nou: feat/canon-worlds-tags-portals

1) În primul commit, creează un document canonic:
- Fișier: DOCS/FLOW/FlowStudio-Worlds-Tags-Portals-Plan-v1.md
- Conținut: îl iau exact din mesajul meu (îl copiez mai jos / sau îmi confirmi că l-ai copiat).
Scop: acest MD devine “contractul” pentru implementare + acceptance criteria. Tot ce implementezi trebuie să fie trasabil la acest doc.

2) Implementare Layer 1 — Flow Studio discipline (cel mai important multiplier)
2.1 Tags UX
- Folosește FlowNodeData.tags (există deja) ca vocabular standard.
- Adaugă badge-uri vizibile pe node-card (engine/surface/type), ca să pot scana rapid.
- Adaugă filtre multi-select după tags în Nodes view.
  Exemple: engine:vocab, engine:assessment, type:portal, surface:today etc.

2.2 Portal nodes (alias/bridge)
- Convenție: node name începe cu “PORTAL: …”
- Portal node trebuie să aibă tag “type:portal”.
- Portal node trebuie să aibă un target (route sau nodeId). Target-ul trebuie afișat clar în UI.
- Portal nodes sunt folosite pentru reutilizare cross-world: NU duplicăm ecrane reale în mai multe chunks.

2.3 Lint/validations + Audit export
- Warnings:
  - node fără chunkId
  - portal fără target
  - duplicate nodes care reprezintă același route
  - world fără entry/exit (minim info/warn)
- Adaugă “Export Audit Snapshot” (JSON) din Flow Studio:
  - chunks summary (count, start nodes, unreachable)
  - cross-chunk edges list
  - lint warnings list
Obiectiv: să pot vedea rapid unde e haosul fără să ghicesc.

3) Implementare Layer 2 — Today = Session Hub (nu “cage”)
3.1 Today hub trebuie să ofere explicit:
- Quick Loop (10–20 min) = daily loop standard (default)
- Deep Loop (30–60 min) = același engine dar playlist extins
- Explore = portal către Arenas / Library / Wizard / Map (în funcție de membership/gating)

3.2 Regula: Daily loop este default session, NU limită de acces.
- User premium trebuie să poată consuma 1 oră în ziua respectivă (Deep + Explore), fără să “spargă” streak/XP.
- Streak se acordă pentru orice sesiune validă (loop/arena/wizard) peste prag minim; daily loop poate avea bonus, dar nu monopol.

3.3 Convergență prin portal nodes (fără duplicare)
- guided_day1 se termină cu “PORTAL: To Today” (nu duplicăm Today node în guided_day1)
- onboarding se termină cu “PORTAL: To Today”
- arenas/library/wizard au “PORTAL: Back to Today” (și/sau Map unde e cazul)

4) Implementare Layer 3 — MindPacing persistence (personalizare reală)
- MindPacing NU rămâne doar localStorage. Persistă un semnal minim în progress facts/profil.
- După refresh, semnalul rămâne.
- Semnalul influențează măcar recommended next / sessionPlan selection.

5) Implementare Layer 4 — Tier semantics cleanup
În cod există ambiguitate între:
- progressTier (0..5, deblocat prin progres)
- membershipTier (free/premium, plan/plată)
Te rog separă clar numele și folosește sursa corectă în gating selectors + UI.

6) Tests (Layer 5) — minim ca să nu regresăm
Unit:
- gating selectors
- derive progressTier vs membership
E2E (Playwright):
- Free: entry → guided day1 → today quick
- Premium: today → deep + explore
- Wizard: enter → return to Today
- MindPacing persists after refresh

7) PR discipline
Commits mici, în ordinea:
1) docs: add canon md
2) flow-studio: tags badges + filters
3) flow-studio: portal node + lint + audit export
4) product: today session hub
5) flows: converge via portals (remove duplicates)
6) progress: mindpacing persistence
7) tests: unit + e2e

IMPORTANT:
- Nu introduce duplicări de pagini/nodes pentru confort vizual.
- Dacă ai nevoie de “apare în două locuri”, folosești portal nodes + tags.
- Dacă ceva din MD nu se potrivește cu implementarea curentă, actualizezi MD și notezi clar decizia înainte de cod.

Începe cu doc-ul MD și Flow Studio Layer 1 (tags/portals/audit). Fără astea, restul săptămânii e haos.
