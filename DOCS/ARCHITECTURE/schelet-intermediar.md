Voi structura în 7 blocuri:

Flow canonic definitiv (revizuit, compact)

CAT Profile v2 – în trepte, 7 axe fără să omorâm userul la intrare

Gating + Stripe – unde pui paywall-ul, pe ce logici

WOW modules și alegeri de lecții – fără fricțiune, cu „compliance ladder”

Arcuri, progres și mapping Temple/Arenă/OS

Role & engines (OmniKuno inclus) – ce există, ce mai trebuie

Omni-SensAI – cum se așază deasupra ca AI mentor/recomandation engine

1. Flow canonic definitiv (revizuit)

Îl rescriu în forma în care poate fi pus în DOCS/ARCHITECTURE:

Cinematic Intro (Entry)

Scop: identitate + promisiune + setare așteptări.

Outcome: user apasă un singur CTA:
„Începe evaluarea și primul antrenament (≈ 7–10 min).”

CAT Baseline Lite (Day 0)

4 axe din cele 7 (vezi secțiunea CAT):

Claritate cognitivă

Energie și recuperare

Stabilitate emoțională

Focus și continuitate

1 item pe axă la început (4 itemi total).

Outcome: catBaseline_initial_lite.

Prima sesiune – Daily Path (Short)

Structura fixă:
INTRO (context & motiv) → EXPERIENȚĂ (drill scurt) → MINI-REFLECȚIE → SUMMARY.

Durată: 5–8 min total.

Trait focus: axa cea mai slabă din baseline-lite + un pic cross-training.

Outcome:

session_1_completed

trait_delta_self_reported (ex: claritate pre/post).

Primul ecran Temple/OS

Micro-OS: nu tot templul, doar:

„Ai început să lucrezi la Claritate și Energie.”

Badge „Templul Clarității – Nivel 1 activat”.

CTA spre /today:

„Continuă mâine cu următoarea piesă din arc.”

opțiune „Vreau acum mai mult” care duce la modul Intensiv (dacă vrei să-l lași și în Day 0).

De a doua zi încolo – rama standard Today

Today afișează mereu două opțiuni:

„Sesiunea zilnică recomandată (5–10 min)” – modul normal.

„Sesiune intensivă (30–45 min)” – modul extins, cu gating pentru free vs premium.

Wizard pe obiective NU există vizibil în primele 3–4 săptămâni.

2. CAT Profile v2 – în trepte, 7 axe

Axe (rămân cele 7 pe care le ai):

Claritate cognitivă

Focus și continuitate

Recalibrare după greșeli

Energie și recuperare

Flexibilitate mentală

Încredere adaptativă

Stabilitate emoțională

Problema: 14 itemi la intrare = prea mult. Soluția: CAT în trepte.

2.1. Structură per axă

Recomand:

2 itemi / axă:

1 item de „stare curentă” (măsură afectivă / percepție).

1 item de „comportament tipic” (cum reacționezi de obicei).

Total: 14 itemi, dar nu îi dai toți deodată.

2.2. Etapele CAT

Etapa A – Baseline Lite (Day 0)

Axe active: 4 din 7 (cele mai „esențiale” pentru user la început):

Claritate cognitivă

Energie și recuperare

Stabilitate emoțională

Focus și continuitate

1 item / axă (strict stare curentă).

Durată: ≈ 60–90 sec.

Output:

catProfile: {
  version: "v2",
  axes: {
    clarity: { score: 0-10, confidence: "low", lastUpdated: Day0 },
    energy: { score: 0-10, confidence: "low", lastUpdated: Day0 },
    emotionalStability: { score: 0-10, confidence: "low", lastUpdated: Day0 },
    focus: { score: 0-10, confidence: "low", lastUpdated: Day0 },
    // restul axes: null sau "unknown"
  }
}


Etapa B – Deep CAT (Days 3–7)

La finalul unor sesiuni, intercalezi micro-ecrane cu max 2 întrebări.

În 3–5 zile ajungi să:

completezi al doilea item pentru cele 4 axe,

introduci treptat celelalte 3 axe (Flex, Încredere adaptativă, Recalibrare).

De fiecare dată, userul vede clar: „2 întrebări, sub 30 de secunde.”

Output:

Completare axes.flexibility, axes.adaptiveConfidence, axes.recalibration.

confidence trece la „medium” sau „high” după ce ai min. 2 itemi/axă.

Etapa C – Recalibrare periodică (weekly)

Mini-CAT săptămânal:

1 item/axă (stare din ultima săptămână, nu doar ACUM).

Folosit pentru:

catDelta_weekly (grafic),

ajustări de arc & dificultate.

UX:
CAT devine un proces încorporat în flux, nu un chestionar monolit la intrare.

3. Gating + Stripe – strategia inteligentă

Îți dau principii + decizii concrete.

3.1. Principii

Nu pui paywall înainte de:

baseline (CAT lite),

minim 3–4 sesiuni finalizate,

un prim mic „aha” (simte clar efectul unui exercițiu).

Gating-ul se face pe:

intensitate (număr sesiuni / zi),

profunzime (Arene, OmniKuno avansat, rapoarte),

AI mentor (Omni-SensAI mai serios),
NU pe „acces la funcția de bază”.

Trebuie să existe:

Free core loop complet (Today → sesiune scurtă → mic progres).

Premium = „amplificare + control + profunzime”.

3.2. Niveluri propuse

Free (fără card sau cu trial fără fricțiune)

Cinematic Intro.

CAT Baseline Lite + completare treptată.

1 sesiune Daily/zi (mod short).

1 sesiune Intensivă / săptămână (limită soft).

1 Arc activ (ex: Claritate) + vizualizare simplă progres.

1 intrare de test în Arenă (ex: Stroop demo).

Câteva lecții OmniKuno „taste” (1–2 micro-modul/arc).

Premium (Stripe)

Sesiuni nelimitate / zi:

Daily + Intensiv (în limite rezonabile dar fără zid artificial).

Acces complet la:

Arene (executive control, ambiguitate, etc.),

OmniKuno arcs întregi (8+ lecții de tip „campanie”).

2–3 Arcuri paralele (ex: Claritate + Energie).

Rapoarte detaliate:

CAT graf complet și istoric,

progres pe domenii (job/personal/relatii).

Omni-SensAI:

recomandări personalizate,

quest-uri adaptive,

sugerarea momentului potrivit pentru Wizard pe obiective.

Acces anticipat la Wizard pe obiective (de ex. după 10 zile în loc de 21).

3.3. Unde intră efectiv paywall-ul în experiență

După completarea primei săptămâni (Arc Day 7)

Ecran de recapitulare:

„Ai antrenat Claritate 7 zile.”

vezi grafic CAT mini (claritate + energie).

CTA:

„Continuă ca până acum (free)”

„Deblochează antrenamente mai intense și Arenele → Upgrade”.

Când încearcă a doua sesiune într-o zi (free user)

Card Today:

„Ai făcut deja sesiunea recomandată.
Vrei o sesiune intensivă azi? → doar cu OmniMental Premium (9€/lună).”

La intrarea în Arene după demo

Prima Arenă = demo gratuit (1 run).

A doua încercare → ecran:

„Arenele sunt laboratorul tău de performanță.
Deblochează acces complet cu Premium.”

La activarea Wizard-ului pe obiective

Poți alege:

Gratuit doar mapping simplu,

Mapping extins + suport de AI (Omni-SensAI) = Premium.

Implementare: totul condus de profile.isPremium + usageStats (sessionsPerDay, arcsCompleted, arenasRuns).

4. WOW Modules și alegerea lecțiilor – „compliance ladder”

Ai dreptate: acum WOW-urile sunt prea abrupte. Ai nevoie de o scară clară de complianță și de context înainte de acțiune.

4.1. Compliance Ladder (3 niveluri)

L1 – Micro-angajament (0–30 sec)

Ex: slider simplu, o scurtă observație, o întrebare de conștientizare.

Scop: să faci userul să facă prima acțiune voluntară, aproape fără cost.

Nu bagi exerciții complicate aici.

L2 – Micro-exercițiu (30–60 sec)

Ex: 3 respirații ghidate, un mini-scan corporal, un focus de 30 sec la respirație.

E mereu precedat de:

„De ce faci asta,
ce vei simți / obține în următorul minut.”

L3 – Exercițiu complet (90–180 sec)

Ex: protocol respirator complet 4–6, mini-Stroop, exercițiu de re-etichhetare gânduri.

Intră doar după ce userul a trecut de L1 și L2 în 1–2 sesiuni.

4.2. Structură standard WOW v2

Fiecare WOW devine o lecție Daily Path cu 3 carduri clare:

Card 1 – Context + L1 (max 45 sec)

„Ce facem acum” + slider / întrebare scurtă.

Card 2 – L2 / L3 (exercițiul în sine)

Timer clar, instrucțiuni minimaliste.

Card 3 – Reflecție + ancorare

„Ce ai observat?” + 1–2 întrebări,

ancorare în Trait + Domain.

Interzise la WOW:

carduri aglomerate cu 5–7 paragrafe,

3 idei mari în același ecran,

jargon fără punte către viața reală.

4.3. Alegerea lecțiilor fără fricțiune

User nu alege „lecția” manual în primele săptămâni. Engine:

ia trait-ul principal (din CAT),

ia domeniul dominant (job/personal/etc. din răspunsuri),

și alege modulul potrivit.

User vede pe Today ceva de genul:

„Astăzi: Claritate în context de job (7 min).”

buton: „Pornește sesiunea” – atât.

Abia mai târziu (premium / avansat) poți expune:

„Alege altă temă azi” -> listă scurtă de 3–4 opțiuni.

5. Arcuri, progres și sens

Arcurile sunt scheletul narativ și de învățare. Trebuie fixate.

5.1. Definiție

Arc = un micro-program de 7 sau 14 zile focusat pe:

1 trait principal (Ex: Claritate),

1–2 trait-uri secundare suport (Ex: Energie, Flex emoțională).

Metadate Arc:

Arc {
  id: "clarity_01",
  traitPrimary: "clarity",
  traitSecondary: ["energy"],
  lengthDays: 7,
  difficulty: "easy" | "medium" | "hard",
  entryRequirements: { minSessions: 0, minCatLevel: null },
  modules: [ ...refs spre module ],
}

5.2. Reguli de progres

Nue ai voie să sari haotic între 5 arcuri.
Standard:

Free: max 1 arc activ,

Premium: max 2–3 arcuri (dar doar 1/zi în Today).

Arc progression:

ziua 1–2: WOW-uri simple (L1–L2).

ziua 3–5: exerciții mai complexe / combinații,

ziua 6–7: integrare + mini-Challenge (OmniAbil + OmniScope reflecție).

5.3. Mapping la Temple / OS / hartă vizuală

Fiecare trait are „Templu”:

Templul Clarității,

Templul Energiei,

Templul Flexibilității emoționale etc.

Un Arc este un „segment” din templu (ex: „Treapta 1 din Templul Clarității”).

Vizual:

Hex-map sau grid:

celule gri (neactivate),

celule luminate (arcuri vizitate),

highlight pe arc-ul curent.

XP secundar: „Calități mentale”:
– scor Claritate, Energie etc. actualizat în funcție de CAT + sesiuni.

6. Engines – ce există / ce vrei ideal (inclusiv OmniKuno)

Nu intru în cod, doar în arhitectură logică.

6.1. Engines existente (aproximate din ce știu)

Today/Orchestrator – decide ce pagină și modul vezi pe /today.

DailyPath Engine – ia config pentru cluster (clarity/energy/etc.) și produce structura lecției (INTRO → LEARN → QUIZ → SIM → AUTONOMY → SUMMARY).

Arena Engine – rulează module de test/exerciții de tip Stroop etc.

OmniAbil Engine – gestionează „misiuni” (tasks de aplicare în viață).

ProgressFacts / Analytics Engine – calculează daily completion, streak, stats.

OmniKuno – engine de lecții structurate pe 8+ unități, cu logică de quiz/sim.

6.2. Ce îți trebuie ca arhitectură clară

Eu aș le-aș rescrie conceptual în:

ProfileEngine

Gestionează:

CAT profile (axes, levels),

domenii (job/personal/etc.),

preferințe (limbaj, stil, intensitate).

Output: UserProfileSnapshot.

SessionRecommenderEngine

Input: UserProfileSnapshot, history, arcsState, isPremium.

Output: SessionPlan de tip:

{
  type: "daily" | "intensive" | "arena" | "wizard",
  arcId: "clarity_01",
  modules: ["module_clarity_breathing_01", "module_energy_reset_03"],
  expectedDurationMinutes: 8 | 30 | ...
}


ContentAssemblyEngine

Ia SessionPlan.modules și returnează efectiv cardurile/steps (din config).

E un nivel sub DailyPath/OmniKuno: construiește secvența UI.

DifficultyEngine

Ajustează:

L1/L2/L3 drills,

durată,

cât de mult quiz vs reflectiv,

bazat pe:

successRate (exerciții rezolvate, rămânere până la final),

self-report „a fost prea greu / prea ușor”.

ArcEngine

Determină:

ce Arc e activ,

când se încheie,

ce Arc se propune următorul,

folosește:

CAT deltas,

aderență (câte zile/7 finalizează),

preferințe.

RewardEngine

XP, badges, streaks, progres vizual.

OmniKunoEngine (în noua arhitectură)

OmniKuno nu mai e „altă planetă”, ci:

un tip de SessionPlan (learning heavy),

format din aceleași bricks (INTRO, LEARN, QUIZ, SIM, AUTONOMY, SUMMARY).

Diferență față de DailyPath:

DailyPath: 1 modul/zi, legat de trait.

OmniKuno: campanie de 8–12 module, legate ca fir narativ/conceptual.

WizardEngine (Obiective)

Rulează doar când unlockConditions îndeplinite.

Output:

userGoals (domeniu, tip obiectiv, marker),

goalPriority,

constraints (ex: focus pe un singur obiectiv activ).

7. Omni-SensAI – AI Mentorship ca strat de orchestrare

Ce ai scris tu e, corect, stratul care leagă tot.

Cum îl așezăm deasupra:

7.1. Rolul Omni-SensAI

Nu e doar un chatbot. E:

Observer – citește:

UserProfileSnapshot (CAT, domenii),

SessionHistory (ce a făcut, ce a sărit),

DifficultySignals (prea greu/ușor, abandon rate),

EngagementSignals (intensiv da/nu, orele preferate).

Orchestrator – propune:

ce Arc urmează,

ce tip de sesiune e optimă azi (scurt vs intensiv),

când apare Wizard-ul pe obiective.

Mentor conversațional – explică:

ce se întâmplă în creier la exercițiile respective,

ajută la reinterpretarea progresului („nu ești leneș, ești saturat energetic”).

7.2. Mapez pe schema ta 0–4

Onboarding scurt

Colectare date:

stare: CAT lite,

context: 1–2 întrebări despre domenii (job/personal/etc.),

stil: preferință de durată (scurt/mediu), limbaj mai tehnic/simplu.

Omni-SensAI:

sintetizează în spate un UserProfileSnapshot_initial.

alege primul Arc + prioritate trait (Claritate/Energie/etc.).

Profil Cognitiv (Intel + Flex)

AI:

interpretează scorurile (în termeni simpli),

asociază un „nivel” pe trăsături (Low/Medium/High),

decide ce Arcuri sunt nepotrivite (ex: prea greu acum).

Plan zilnic (AI Orchestrat)

Pentru fiecare zi:

Omni-SensAI cheamă SessionRecommenderEngine cu parametrii personalizați.

Decide mix-ul:

OmniKuno (învățare),

OmniAbil (misiune practică),

OmniScope (măsurare/reflectare).

Loop de adaptare

După fiecare sesiune:

colectezi:

completare DA/NU,

rating „prea greu – potrivit – prea ușor”,

eventual „cât de util ți s-a părut azi?”.

Omni-SensAI:

ajustează ritmul (număr recomandat de sesiuni/săptămână),

ajustă difficulty (L1 vs L2 vs L3),

schimbă uneori domeniul pentru generalizare.

Mapă vizuală (Hexagon + Arcuri)

AI decide ce scoți în evidență:

„Uite, Claritatea a crescut cu +2 în ultimele 3 săptămâni.”

„Ai lucrat 60% pe job, 20% personal, 20% relații.”

Nu doar XP, ci „calități mentale” ca principale KPI.

Concluzie pragmatică

Scheletul acum e completabil direct în DOCS:

Flow canonic clar (Cinematic → CAT lite → Daily → Today).

CAT v2 în trepte (nu mai omori userul cu 14 itemi upfront).

Gating și Stripe plasate exact unde trebuie: după 7+ zile, a doua sesiune/zi, Arene, Wizard, OmniKuno complet, Omni-SensAI full.

WOW modules remodelate ca 3 carduri simple, cu L1 / L2 / L3 pe complianță.

Arcuri formalizate (trait, durată, difficulty, progres).

Engines mapate și pregătite pentru un strat Omni-SensAI care orientează tot.
