# OmniMental — Nivelul 2 (ARENE) — 3 Module V1 (1 per arenă)

Acest document este **sursa de adevăr** pentru 3 module Arena (Nivelul 2).
Codex trebuie să genereze fișiere TypeScript din aceste specificații, fără să modifice engine-ul Daily Path.

## Scop
- Urcăm conținut incremental: **1 modul / arenă** (Control Executiv, Inteligență Adaptivă, Protecție Mentală).
- Modulele Arena sunt **alt nivel** față de Level 1: au constrângeri, context de presiune, criterii de reușită (metrici), și poduri cognitive către Level 1.
- Nu vrem duplicare Level 1.

## Invariants (non-negociabile)
1) Fiecare modul Arena conține obligatoriu:
   - explicație concisă (max 8 rânduri)
   - drill aplicat în 3 variante (30s / 90s / 3m)
   - fiecare drill are: `constraint`, `steps`, `successMetric`
   - 1 scenariu “real world challenge”
   - 1–2 poduri cognitive către module Level 1 (clarity / energy / emotional_flex) cu justificare
2) Nu se adaugă aceste module în registrul curent de DailyPaths cluster-based (ex: `config/dailyPaths/index.ts`) până când nu decidem wiring-ul UI.
3) Output-ul trebuie să fie **library de module Arena**: `config/arenaModules/v1/*.ts`.

---

## Output files (create)
Codex trebuie să creeze aceste fișiere:

- `config/arenaModules/v1/executive_metacognition.ts`
- `config/arenaModules/v1/adaptive_ambiguity_tolerance.ts`
- `config/arenaModules/v1/shield_values_compass.ts`
- `config/arenaModules/v1/index.ts`

## Tipuri / structură recomandată în output
Creează un tip simplu (dacă nu există deja) în `config/arenaModules/v1/types.ts`:

```ts
export type ArenaId = "executive_control" | "adaptive_intelligence" | "psychological_shielding";
export type L1Bridge = "clarity" | "energy" | "emotional_flex";
export type ArenaLang = "ro" | "en";

export type ArenaDrill = {
  duration: "30s" | "90s" | "3m";
  constraint: string;
  steps: string[];
  successMetric: string;
};

export type ArenaModuleV1 = {
  id: string;
  arena: ArenaId;
  title: Record<ArenaLang, string>;
  explain: Record<ArenaLang, string>;
  drills: Record<ArenaLang, ArenaDrill[]>;
  realWorldChallenge: Record<ArenaLang, { title: string; steps: string[]; successMetric: string }>;
  bridges: Array<{ toL1: L1Bridge; because: Record<ArenaLang, string> }>;
  tags?: string[];
};
Apoi fiecare fișier de modul exportă un ArenaModuleV1.

MODULE 1 — Arena Controlului Executiv
ID
executive_metacognition_v1

Spec (RO/EN)
yaml
Copy code
arenaModule:
  id: executive_metacognition_v1
  arena: executive_control

  title:
    ro: "Metacogniție aplicată (Control Executiv)"
    en: "Applied Metacognition (Executive Control)"

  explain:
    ro: >
      Când te identifici cu gândul, execuția scade: atenția fuge, apare rigiditate, reacționezi automat.
      Metacogniția = abilitatea de a observa gândul ca obiect, nu ca adevăr.
      Semnul că funcționează: apare un mic spațiu între stimul și reacție.
    en: >
      When you identify with a thought, execution drops: attention slips, rigidity appears, you react automatically.
      Metacognition = seeing the thought as an object, not a truth.
      Signal it works: a small gap appears between stimulus and response.

  drills:
    ro:
      - duration: "30s"
        constraint: "Nu rezolvi nimic. Doar observi + etichetezi."
        steps:
          - "Observă gândul dominant acum."
          - "Spune mental: «Acesta este un gând, nu un fapt.»"
          - "Revino la respirație 2 cicluri."
        successMetric: "Ai reușit dacă ai făcut etichetarea fără să intri în poveste."
      - duration: "90s"
        constraint: "3 gânduri consecutive, fără analiză."
        steps:
          - "Observă 3 gânduri consecutive."
          - "Etichetează: planificare / îngrijorare / judecată."
          - "După fiecare etichetă: revino 1 sec la o senzație din corp."
        successMetric: "Ai reușit dacă ai etichetat 3/3 și ai revenit la corp de 3 ori."
      - duration: "3m"
        constraint: "Menții atenția pe flux, nu pe conținut."
        steps:
          - "Timp de 3 minute: observă fluxul gândurilor."
          - "Detectează tiparul dominant (1 cuvânt)."
          - "Revino la ancoraj (respirație sau palme) ori de câte ori te pierzi."
        successMetric: "Ai reușit dacă poți numi tiparul dominant în 1 cuvânt la final."
    en:
      - duration: "30s"
        constraint: "Do not solve anything. Only observe + label."
        steps:
          - "Notice the dominant thought."
          - "Say mentally: “This is a thought, not a fact.”"
          - "Return to breath for 2 cycles."
        successMetric: "Success if you labeled without entering the story."
      - duration: "90s"
        constraint: "3 consecutive thoughts, no analysis."
        steps:
          - "Observe 3 consecutive thoughts."
          - "Label: planning / worry / judgment."
          - "After each label: return 1s to a body sensation."
        successMetric: "Success if you labeled 3/3 and returned to the body 3 times."
      - duration: "3m"
        constraint: "Stay with the stream, not the content."
        steps:
          - "For 3 minutes: watch the thought stream."
          - "Detect the dominant pattern (1 word)."
          - "Return to an anchor (breath or palms) whenever you drift."
        successMetric: "Success if you can name the dominant pattern in 1 word at the end."

  realWorldChallenge:
    ro:
      title: "Aplicare sub sarcină (micro-performanță)"
      steps:
        - "Alege o sarcină reală de 5–10 minute (scris / task / decizie)."
        - "Setează 2 momente de check (la minutul 2 și 5)."
        - "La fiecare check: Observă → Etichetează → Revino (10 sec)."
      successMetric: "Ai reușit dacă ai făcut 2/2 check-uri fără să abandonezi sarcina."
    en:
      title: "Apply under task load (micro-performance)"
      steps:
        - "Pick a real 5–10 minute task (writing / task / decision)."
        - "Set 2 check moments (minute 2 and 5)."
        - "At each check: Notice → Label → Return (10s)."
      successMetric: "Success if you executed 2/2 checks without abandoning the task."

  bridges:
    - toL1: clarity
      because:
        ro: "Observarea reduce zgomotul mental și clarifică intenția."
        en: "Observing reduces mental noise and sharpens intention."
    - toL1: emotional_flex
      because:
        ro: "Distanțarea reduce reactivitatea și face posibil reframing-ul."
        en: "Distancing lowers reactivity and enables reframing."
MODULE 2 — Arena Inteligenței Adaptive
ID
adaptive_ambiguity_tolerance_v1

yaml
Copy code
arenaModule:
  id: adaptive_ambiguity_tolerance_v1
  arena: adaptive_intelligence

  title:
    ro: "Toleranță la ambiguitate (Inteligență Adaptivă)"
    en: "Ambiguity Tolerance (Adaptive Intelligence)"

  explain:
    ro: >
      Sub ambiguitate, mintea caută închidere rapidă (certitudine). Asta produce rigiditate și decizii proaste.
      Abilitatea reală: tolerezi incertitudinea și acționezi pe criterii minime.
      Semn că funcționează: poți face un pas reversibil fără „răspuns perfect”.
    en: >
      Under ambiguity, the mind seeks fast closure (certainty). That creates rigidity and bad decisions.
      The real skill: tolerate uncertainty and act on minimal criteria.
      Signal it works: you can take a reversible step without a “perfect answer”.

  drills:
    ro:
      - duration: "30s"
        constraint: "Separi informația în 3 coloane; nu rezolvi."
        steps:
          - "Alege o situație incertă."
          - "Spune: «Știu / Nu știu / Presupun» și numește 1 item la fiecare."
          - "Stop. Nu optimizezi."
        successMetric: "Ai reușit dacă ai produs 3 itemi (1 pe coloană) fără să sari la concluzie."
      - duration: "90s"
        constraint: "Definiție MCA (minimal criterion to act) într-o propoziție."
        steps:
          - "Scrie mental: «Dacă X e adevărat → fac pasul 1»"
          - "Scrie: «Dacă Y apare → mă opresc»"
          - "Formulează MCA într-o propoziție finală."
        successMetric: "Ai reușit dacă ai 1 propoziție MCA clară și aplicabilă."
      - duration: "3m"
        constraint: "Alegi un pas mic reversibil, nu o decizie finală."
        steps:
          - "Definește 2 opțiuni posibile."
          - "Pentru fiecare: 1 risc + 1 câștig."
          - "Alege un pas mic reversibil (care poate fi anulat)."
        successMetric: "Ai reușit dacă pasul ales este reversibil și poate fi făcut azi."
    en:
      - duration: "30s"
        constraint: "Split info into 3 columns; don’t solve."
        steps:
          - "Pick an uncertain situation."
          - "Say: “Know / Don’t know / Assume” and name 1 item per column."
          - "Stop. No optimizing."
        successMetric: "Success if you produced 3 items (1 per column) without jumping to closure."
      - duration: "90s"
        constraint: "Define MCA (minimal criterion to act) in one sentence."
        steps:
          - "Write mentally: “If X is true → do step 1.”"
          - "Write: “If Y appears → stop.”"
          - "Finalize a single MCA sentence."
        successMetric: "Success if you have 1 clear, usable MCA sentence."
      - duration: "3m"
        constraint: "Choose a small reversible step, not a final decision."
        steps:
          - "Define 2 possible options."
          - "For each: 1 risk + 1 gain."
          - "Pick a small reversible step (can be undone)."
        successMetric: "Success if the step is reversible and doable today."

  realWorldChallenge:
    ro:
      title: "Decizie reală cu MCA (sub presiune)"
      steps:
        - "Alege o decizie reală azi (mică sau medie)."
        - "Aplică MCA: dacă X → pas 1; dacă Y → stop."
        - "Execută pasul reversibil în <10 minute."
      successMetric: "Ai reușit dacă ai executat pasul în timp, fără a căuta certitudine completă."
    en:
      title: "Real decision with MCA (under pressure)"
      steps:
        - "Pick a real decision today (small/medium)."
        - "Apply MCA: if X → step 1; if Y → stop."
        - "Execute the reversible step in <10 minutes."
      successMetric: "Success if you executed the step on time without seeking full certainty."

  bridges:
    - toL1: emotional_flex
      because:
        ro: "Reglajul emoțional scade anxietatea de incertitudine și permite acțiune."
        en: "Emotional regulation lowers uncertainty anxiety and enables action."
    - toL1: clarity
      because:
        ro: "Criteriile minime reduc zgomotul și clarifică decizia."
        en: "Minimal criteria reduce noise and clarify decisions."
MODULE 3 — Arena Protecției Mentale
ID
shield_values_compass_v1

yaml
Copy code
arenaModule:
  id: shield_values_compass_v1
  arena: psychological_shielding

  title:
    ro: "Valori & busolă internă (Protecție Mentală)"
    en: "Values & Inner Compass (Psychological Shielding)"

  explain:
    ro: >
      În contexte ostile, mintea sare pe scurtături: defensiv, justificare, conformare.
      Busola internă = criteriu stabil, repetabil, care te protejează de decizii reactive.
      Semn că funcționează: poți răspunde aliniat chiar când apare presiunea.
    en: >
      In hostile contexts, the mind jumps to shortcuts: defensiveness, justification, compliance.
      An inner compass = a stable, repeatable criterion that protects you from reactive decisions.
      Signal it works: you can respond aligned even under pressure.

  drills:
    ro:
      - duration: "30s"
        constraint: "Alegi o singură valoare activă azi."
        steps:
          - "Alege 1 valoare pentru azi (adevăr / curaj / respect / disciplină)."
          - "Spune: «Azi mă ghidez după <valoare>.»"
        successMetric: "Ai reușit dacă valoarea este 1 singură și formulată clar."
      - duration: "90s"
        constraint: "Transformi valoarea într-o regulă observabilă."
        steps:
          - "Completează: «Dacă respect <valoare>, atunci fac X.»"
          - "X trebuie să fie observabil (acțiune, nu intenție)."
        successMetric: "Ai reușit dacă X poate fi verificat de un observator extern."
      - duration: "3m"
        constraint: "Simulezi presiune și alegi un micro-răspuns."
        steps:
          - "Imaginează o presiune (critică / manipulare / grabă)."
          - "Numește reacția automată (1 cuvânt)."
          - "Alege un micro-răspuns care exprimă valoarea."
        successMetric: "Ai reușit dacă micro-răspunsul poate fi executat în <5 secunde în viața reală."
    en:
      - duration: "30s"
        constraint: "Pick a single active value for today."
        steps:
          - "Pick 1 value today (truth / courage / respect / discipline)."
          - "Say: “Today I’m guided by <value>.”"
        successMetric: "Success if it’s one value stated clearly."
      - duration: "90s"
        constraint: "Turn the value into an observable rule."
        steps:
          - "Complete: “If I honor <value>, I do X.”"
          - "X must be observable (action, not intention)."
        successMetric: "Success if X can be verified by an external observer."
      - duration: "3m"
        constraint: "Simulate pressure and pick a micro-response."
        steps:
          - "Imagine pressure (criticism / manipulation / urgency)."
          - "Name your automatic reaction (1 word)."
          - "Pick a micro-response that expresses the value."
        successMetric: "Success if the micro-response is executable in <5 seconds in real life."

  realWorldChallenge:
    ro:
      title: "Interacțiune dificilă (aplicare busolă)"
      steps:
        - "La prima interacțiune dificilă azi: pauză 1 secundă."
        - "Amintește valoarea activă."
        - "Execută micro-răspunsul ales."
      successMetric: "Ai reușit dacă ai făcut pauza + micro-răspunsul în moment real (nu după)."
    en:
      title: "Hard interaction (compass application)"
      steps:
        - "In your first hard interaction today: pause 1 second."
        - "Recall the active value."
        - "Execute the chosen micro-response."
      successMetric: "Success if you paused + executed the micro-response in the real moment (not after)."

  bridges:
    - toL1: clarity
      because:
        ro: "Valoarea devine criteriu de decizie și reduce confuzia sub presiune."
        en: "A value becomes a decision criterion and reduces confusion under pressure."
    - toL1: energy
      because:
        ro: "Alinierea reduce consumul mental din conflict intern și stabilizează energia."
        en: "Alignment reduces mental drain from inner conflict and stabilizes energy."
Implementare — reguli pentru Codex
Codex trebuie să parseze YAML-urile de mai sus și să genereze ArenaModuleV1 în fișierele TS indicate.

În output TS:

păstrează exact textele RO/EN

păstrează structura drills (30s/90s/3m) în această ordine

păstrează successMetric (nu-l omite)

config/arenaModules/v1/index.ts exportă toate cele 3 module.

Nu integra în Daily Path selection. Doar library.