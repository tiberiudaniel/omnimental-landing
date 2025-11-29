# OmniKuno – Standard de denumire și structură module

Acest document definește convențiile unice de denumire pentru toate ariile OmniKuno. ID-urile sunt folosite în wizard, focus dashboard, OmniKuno content, OmniAbil, OmniFlex, recomandări și orice produs asociat. Nicio altă abreviere nu este acceptată.

## Tabel ID-uri oficiale

| ID module | Etichetă în UI |
| --- | --- |
| emotional_balance | Echilibru Emoțional |
| focus_clarity | Claritate & Focus |
| relationships_communication | Relații & Comunicare |
| energy_body | Energie & Corp |
| self_trust | Încredere în Sine |
| decision_discernment | Discernământ & Decizii |
| willpower_perseverance | Voință & Perseverență |
| optimal_weight_management | Greutate optimă |

## Convenții generale

1. **Fișiere MD**: fiecare modul are un fișier `DOCS/DOCS/omniKuno_{moduleId}.md`.
2. **ARC-uri**: prefix `moduleId_arc_{level}` (ex. `emotional_balance_arc_01_trezire`).
3. **Lecții**: `moduleId_l{n}_{slug}`.
4. **Mini-test**: `moduleId_final_test`.
5. **Config TS/UI**: folosește `moduleId` exact cum apare în tabel.
6. **Wizard/Focus/Recommendations**: returnează/consumă doar `moduleId` din listă.
