# Flow Studio CANON — Worlds, Tags, Portals & Overlays (v1)

_Source of truth for Flow Studio UX and data discipline._

## 1. North Star
- **Worlds** = supra-sisteme/ spații (max 12) care descriu experiența macro.
- **Nodes** = ecrane reale (route-uri Next.js). Un route există o singură dată ca nod real.
- **Portals** = alias/bridge pentru reutilizare cross-world (zero duplicări de ecrane).
- **Flows / Overlays** = quest/recipe overlays peste worlds. Nu dețin noduri, doar trasează un path.
- **Today hub** = sesiunea implicită (Quick / Deep / Explore). Daily loop nu este o limitare de acces.

## 2. Worlds (ex-cunks)
Tabelul canonic de worlds este definit în `config/flowStudioChunks.v1.json` și `config/appChunks.v1.ts`. Lista actuală:
1. Public / Acquisition
2. Entry / Intro
3. Guided Day‑1
4. Onboarding / Calibration
5. Daily Loop (Today)
6. Progress Map
7. Training / Arenas
8. Curriculum / Library
9. Module Hubs
10. Advanced / Wizard / Coaching
11. Account / Billing / Admin / Legacy

(Recomandarea rămâne engine/tag; nu este world separat până nu există un Quest Board persistent.)

Rules:
- World = spațiu narativ + gating macro (tier, menu state, entry/exit). Niciodată nu ține logică de engine.
- Un world are entry și exit clare; lint-ul avertizează dacă nu există un start/finish.
- UI: Flow Studio, docs și audit raportează doar „Worlds”. Termenul „chunk” rămâne intern (schema, tipuri TS).

## 3. Tags vocabulary
Folosește `FlowNodeData.tags` drept vocabular simplu, stabil:
- `engine:(dailypath|vocab|assessment|arena|rewards|recommendation|sessionPlan|quest)`
- `surface:(today|onboarding|library|map|wizard|arenas)`
- `cluster:(clarity|energy|flex|focus|calm|...)`
- `gate:progressTier>=0..5`, `gate:membership=free|premium`
- `type:portal`, `type:overlay-step` (opțional)
- `state:(legacy|beta|hidden)`

Tags sunt singura modalitate acceptată pentru gating și vizibilitate; nu scriem condiții speciale în world metadata.

## 4. Portal canon
- Convenție nume: `PORTAL: To Today`, `PORTAL: Back to Today`, `PORTAL: Explore Arenas`.
- Portal node trebuie să aibă `type:portal` + target valid (`portal.targetRoutePath` sau `portal.targetNodeId`).
- Portalul afișează target-ul clar în UI (badge + card highlight).
- Reutilizarea cross-world se face _doar_ prin portal; nu duplicăm noduri reale.

## 5. Today = Session Hub
- Default: Quick Loop (10‑20 min).
- Deep Loop (30‑60 min) reutilizează același engine, playlist extins.
- Explore = Arena / Library / Wizard / Map (în funcție de gating).
- Daily loop nu limitează accesul. Premium poate face Deep + Explore fără să piardă streak/XP.
- Guided day1 și Onboarding se termină cu `PORTAL: To Today`. Arenas/Library/Wizard au `PORTAL: Back to Today` (și/sau Map).

## 6. Persistence & Personalizare
- MindPacing și alte semnale rămân în `progressFacts` / profil, nu doar localStorage.
- Refresh-ul păstrează recomandarea/next step.
- Tier semantics:
  - `progressTier` = 0..5 (deschis prin progres).
  - `membershipTier` = free/premium (plan/plată). Nu le amestecăm în UI/gating.

## 7. Overlays (Quest / Recipe)
- Overlays trăiesc lângă FlowDoc ca listă de `FlowOverlay` (id, name, steps, edges).
- Un overlay referă noduri existente (`nodeId`). Nu creează noduri noi.
- UI highlight: selectezi overlay → nodurile din overlay full opacity, restul dimmed.
- Editor minimal: name, descriere scurtă, listă ordonată de pași (nodeId + tag/gate opțional).

## 8. Workflow recomandat în Flow Studio
1. **Seed Worlds** din `flowStudioChunks.v1.json` (buton „Seed Worlds v1”).
2. **Import routes** din panel, trage rutele în canvas.
3. **Setează World** pentru fiecare nod (dropdown). Folosește tag-uri canonicale.
4. **Adaugă Portal nodes** pentru reutilizări cross-world.
5. **Rulează Lint + Export Audit Snapshot** – verifici worlds fără entry/exit, duplicate routes, portals fără target.
6. **Define overlays** pentru quest/recipe, highlight și share snapshot JSON.
7. **Persistă**: salvează FlowDoc, verifică status `Saved at HH:MM:SS` înainte de refresh.

## 9. Acceptance checklist
- UI nu folosește termenul „Chunk”.
- World list = sursa din acest doc + `config/flowStudioChunks.v1.json`.
- Tags, portals, Today hub și overlays funcționează conform regulilor de mai sus.

## 10. Flow Studio — How to use overlays
1. Selectează overlay-ul activ din selectorul nou de pe canvas; `None` dezactivează highlight-ul.
2. Apasă „Manage” pentru a deschide tab-ul `Overlays` din Inspector (se deschide automat chiar dacă Inspectorul era ascuns).
3. Creează overlay nou (nume + descriere), apoi selectează noduri în canvas și folosește acțiunea „Adaugă noduri selectate”.
4. Reordonează pașii (↑ / ↓), adaugă `gateTag` dacă e nevoie și folosește `Șterge overlay` doar după ce ai exportat auditul.
5. Overlay-urile sunt salvate împreună cu FlowDoc; Export Audit Snapshot include sumarul overlays.

## 11. Manual test checklist
- [ ] Focus World / Clear World Focus păstrează highlight-ul și dim-ul (cu/ fără `Hide others`).
- [ ] Overlay selectat diminuează restul nodurilor, persistă după Save + refresh și apare în Audit Snapshot.
- [ ] Portal creatorul forțează prefix `PORTAL:` și lint-ul raportează target lipsă dacă ștergi destinația.
- [ ] Tag Filters + view state (view mode, focus, flow selection) revin corect după refresh.
- [ ] Autosave și Save status afișează mesajul corect când muți noduri între worlds și când overlays se modifică.
