OMNIKUNO — REPLAY INTELLIGENCE SYSTEM v1

Master Specification Document (MD)
Pentru Codex — Documentare & Implementare

1. Introducere

Acest document definește arhitectura completă pentru sistemul de Replay, Mastery Tracking, Dynamic Recommendations, User Typology Detection, Insight Depth Analysis, Time Tracking, și Reintegration Logic în cadrul OmniMental (OmniKuno + OmniFlex + OmniIntel).

Scop:
• să transforme repetarea lecțiilor într-un proces inteligent, personalizat și util,
• să ajute utilizatorul să avanseze în profunzime, claritate și acțiune,
• să ofere Codex toate structurile necesare pentru implementare end-to-end.

2. Componentele sistemului Replay Intelligence

Sistemul este alcătuit din următoarele module majore:

User Typology Engine – detectează stilul utilizatorului (Fast Thinker, Deep Writer, Precision User).

Replay Recommendation Engine – decide ce să recomande: lecție, categorie sau întreg ciclu.

Dynamic Guidance Layer – generează mesaje personalizate pentru fiecare revenire.

Replay Recommendation Card – UI componentă unică ce apare în Dashboard / Lesson comeback.

Time Tracking Engine – monitorizează timpul și comportamentul.

Insight Depth Engine – analizează profunzimea răspunsurilor.

Correctness + Locked Answers Engine (pentru quiz).

Mastery Tracking System – calcul global de progres și consistență.

OmniFlex Adaptive Layer – adaptează provocările la flexibilitatea psihologică detectată.

3. User Typology Engine

Sistemul clasifică userul automat după comportament:

A. Fast Thinker

Indicatori:

timp de răspuns < 3 sec la multe întrebări,

răspunsuri scurte, incomplete,

parcurgere rapidă a lecțiilor.

Direcție: „Aprofundare + observarea detaliilor”.

B. Deep Writer

Indicatori:

răspunsuri lungi, complexe,

timp lung petrecut în lecție,

profunzime mare, dar puțină acțiune.

Direcție: „Simplificare + aplicare concretă”.

C. Precision User

Indicatori:

interes pentru scoruri,

răspuns corect vs greșit,

revine pentru perfecționare.

Direcție: „Mastery + consistență”.

Structură JSON pentru tipologie
{
  "userTypology": "fast_thinker | deep_writer | precision_user",
  "confidence": 0.82
}

4. Replay Recommendation Engine

Determină ce să recomande utilizatorului:

Nivel 1 — Lecție

Se recomandă dacă:

scor mic,

răspunsuri superficiale,

text prea lung fără aplicare,

condiție prealabilă pentru alt modul.

Nivel 2 — Categorie întreagă

Se recomandă dacă:

există inconsistențe între lecții,

userul are dezechilibru între înțelegere și aplicare,

OmniFlex detectează rigiditate sau evitări.

Nivel 3 — Ciclul complet

Se recomandă dacă:

userul vrea nivel avansat,

a trecut repede prin tot,

reîntoarcere după pauză lungă,

pregătire pentru modul “Advanced”.

Structură JSON pentru recomandare
{
  "replayType": "lesson | category | cycle",
  "target": "claritate_03" | "energie" | "omnikuno_cycle_1",
  "reason": "low_score | superficial | deep_no_action | consistency",
  "recommendedMode": "guided | applied | reflective"
}

5. Dynamic Guidance Layer

Mesaje personalizate, în funcție de tipologie și motivul revenirii.

Exemple:

Pentru Fast Thinker:
„Reia lecția cu un ochi nou. Caută un singur detaliu pe care nu l-ai observat prima dată.”

Pentru Deep Writer:
„Scrii profund. Acum transformă răspunsul într-o acțiune de 24 ore.”

Pentru Precision User:
„Poți îmbunătăți scorul. Repetarea arată consistența, nu perfecțiunea.”

6. Replay Recommendation Card (UI spec)

Card vizibil în Dashboard + Lesson comeback.

Conține:

motivul recomandării

beneficiul (“claritate”, “acțiune”, “consistență”, “insight nou”)

timp estimat de parcurgere

modul recomandat:

Replay Guided – cu întrebări noi

Replay Applied – cu task de 24h

Replay Reflective – cu întrebare profundă

7. Time Tracking Engine

Înregistrează:

startTimestamp

endTimestamp

idleTimeSec

timeSpentSec (diferența reală)

responseTimeMs pentru fiecare întrebare

{
  "lessonId": "claritate_01",
  "timeSpentSec": 214,
  "idleSec": 32,
  "responseTimes": [1200, 4500, 1800]
}

8. Insight Depth Engine

Analizează profunzimea răspunsurilor prin LLM:

Parametri:

lungime minimă

diversitate lexicală

specificitate (situații reale)

insight emoțional

{
  "depthScore": 0.72,
  "specificity": 0.81,
  "emotionalInsight": 0.66
}

9. Correctness + Locked Answers Engine (quiz)

Funcționalitate strictă:

userul trimite răspunsul

răspunsul devine locked: true

nu se poate modifica

dacă e greșit → rămâne greșit

{
  "quizId": "focus_quiz_01",
  "answer": "B",
  "isCorrect": false,
  "locked": true
}

10. Mastery Tracking System

4 metrici globale:

1. Consistency Index

Zile consecutive cu timp optim.

2. Learning Depth

Media scorurilor de profunzime.

3. Correctness Stability

% de quiz fără retake.

4. Implementation Density

Număr de acțiuni aplicate din lecțiile reluate.

{
  "mastery": {
    "consistency": 0.61,
    "depth": 0.78,
    "correctness": 0.83,
    "implementation": 0.55
  }
}

11. Legătura cu OmniFlex

OmniFlex adaptează recomandările și modul de reluare:

Exemple:

rigiditate mare → Replay Reflective

impulsivitate → Replay Guided Slow

exces de analiză → Replay Applied Action Mode

OmniFlex furnizează factorii psihologici care declanșează modul de reluare.

{
  "flexProfile": "rigid | impulsive | overthinking",
  "adaptiveReplayMode": "reflective | guided | applied"
}

12. Modurile de Replay (3 moduri oficiale)
Replay Guided

• o întrebare profundă în fiecare lecție.
• accent pe claritate.

Replay Applied

• task de 24 ore.
• accent pe acțiune.

Replay Reflective

• întrebări meta: „Ce pattern observ?”
• accent pe integrare psihologică.

13. Ce reia userul? — Logica completă
Nivel 1: Reia Lecția

– când e vorba de suprafață, viteză, confuzii, set-up.

Nivel 2: Reia Categoria

– când sunt dezechilibre în temă, lipsă aplicare, scoruri oscilante.

Nivel 3: Reia Ciclul

– pentru nivel avansat, pauze lungi, sau reset.

14. Scoruri noi introduse în Replay
A. Growth Delta

Diferența dintre vechiul scor și cel nou.

B. Insight Score

Punctaj pentru profunzime și claritate.

C. Consistency Bonus

Pentru repetare consecventă.

{
  "replayScores": {
    "growthDelta": 2,
    "insightScore": 0.74,
    "consistencyBonus": 1
  }
}

15. User Flow — Revenirea la lecție

Userul finalizează lecția.

Dashboard afisează Replay Recommendation Card.

Userul poate selecta:

Repetă Lecția

Repetă Categoria

Repetă Ciclul

Sistemul aplică modul recomandat (guided/applied/reflective).

Time Tracking + Insight Depth pornesc automat.

La final: update scoruri, mastery, insight.

16. Instrucțiuni pentru Codex (implementare tehnică)
1. Creează User Typology Engine

folosește timpi de răspuns, lungimea răspunsurilor, scorurile.

calculează userTypology.

2. Creează Replay Recommendation Engine

determină nivelul de repetare (lecție, categorie, ciclu).

generează JSON de recomandare.

3. Integrează Replay Recommendation Card în Dashboard

card cu motivul revenirii, modul, timp estimat.

4. Activează Time Tracking

monitorizare start/stop, idle, response time.

5. Integrează Insight Depth Engine

trimite răspunsul la LLM.

salvează scoruri.

6. Activează modul Locked Answers pentru quiz

răspunsurile devin finale.

GUI arată clar starea de „locked”.

7. Creează Mastery Tracking System

calculează consistency, depth, correctness, implementation.

8. Integrează OmniFlex

în funcție de flexProfile → modul de reluare recomandat.

9. Implementare moduri de Replay

Guided

Applied

Reflective

10. Salvare în Firestore

toate structurile JSON din acest document.

Mesaj scurt pentru Codex (instrucțiuni sintetice)

Acesta îl vei folosi după ce pui documentul .md.

Mesaj pt Codex:

„Studiază documentul Replay_Intelligence_System.md.
Implementarea necesară include:

User Typology Engine,

Replay Recommendation Engine,

Replay Recommendation Card,

Time Tracking,

Insight Depth Engine,

Locked Answers pentru quiz,

Mastery Tracking System,

Integrare OmniFlex în modul de replay,

Modurile Guided, Applied și Reflective,

Structurile JSON exacte.

Urmează documentul MD punct cu punct și implementează toate componentele în OmniKuno + Dashboard + Quiz.”