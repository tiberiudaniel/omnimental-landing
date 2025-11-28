# OmniMental Master Strategy

Document de referință care descrie strategia completă, modulară și ciclică a proiectului OmniMental. Acest fișier servește drept hartă conceptuală și operațională pentru dezvoltare, produs, UX, AI, conținut și extinderi ulterioare.

---

# 1. Viziunea OmniMental

OmniMental este un ecosistem de antrenament mental ciclic, adaptiv și gamificat, care combină:

* **micro-învățare** (OmniKuno),
* **implementare practică** (OmniAbil),
* **ritualuri zilnice** (Daily Reset),
* **colecționabile mentale** (protocols/cards),
* **narațiune pe Arcuri/Sezoane**, inspirate de Pokémon × Duolingo × Mondly,
* **AI augmentativ** (OmniAI Companion),
* **biofeedback** și urmărirea coerenței mentale.

Obiectivul este transformarea mentalității și comportamentului, printr-un proces structurat, recurent și scalabil.

---

# 2. Principiile de arhitectură

1. **Ciclicitate naturală** – platforma funcționează pe cicluri de 3–6 luni (Sezoane), iar progresul utilizatorului se regenerează periodic.
2. **Univers mental** – utilizatorul navighează hărți mentale, nu liste de funcții.
3. **Progres multiplu** – lecții (teorie), abilități (practică), ritualuri (menținere), colectibile (ancorare).
4. **Gamificare matură** – XP, niveluri, protocoale, fără infantilizare.
5. **Autonomie + ghidaj** – sistemul sugerează următorul pas printr-un motor de decizie.
6. **Modularitate** – orice subsistem poate evolua independent.

---

# 3. Structura generală a ecosistemului OmniMental

## 3.1. Stratul 1 – **Explorarea** (Onboarding + OmniScope)

* Wizard
* Evaluări
* Prima recomandare
* Primele lecții recomandate

## 3.2. Stratul 2 – **Antrenamentul** (OmniKuno)

* Lecții de tip micro-learning
* Test final
* XP
* Deblocare treptată

## 3.3. Stratul 3 – **Implementarea** (OmniAbil)

* Task-uri zilnice
* Task-uri săptămânale
* Mark-as-done + XP
* Integrare cu Arcurile

## 3.4. Stratul 4 – **Ritualuri zilnice** (Daily Reset)

* Claritate, Energie, Emoții (1–5)
* Streak
* XP automat
* Bază pentru coerență

## 3.5. Stratul 5 – **Colecționabile mentale** (Collectibles)

* Protocoale
* Reguli
* Mini-tehnici
* Deblocare la fiecare 3–4 lecții
* „Dexul mental” al utilizatorului

## 3.6. Stratul 6 – **Mental Universe Map**

* Harta celor 5 arii majore
* Gateway către lecții/abilități/ritualuri
* Devine „regiunea” unui Arc

## 3.7. Stratul 7 – **Arcuri și Sezoane**

* Arc 1: Claritate & Energie
* Arc 2: Voință & Perseverență
* Arc 3: Emotional Balance
* Arc 4: Flow & Strategie

---

# 4. Sistemul de Arcuri (Season-Based Learning)

## 4.1. Ce este un Arc?

Un Arc este un pachet coerent de:

* Lecții OmniKuno
* Taskuri OmniAbil
* Ritualuri zilnice
* Carduri colecționabile
* KPIs în dashboard
* Niveluri + XP specifice

## 4.2. De ce Arcuri?

* oferă structură,
* creează motivație ciclică,
* permite upgrade anual fără a rupe platforma,
* oferă experiență narativă.

## 4.3. Componentele tehnice ale unui Arc

Definite în `config/omniArcs.ts`:

* `lessonIds`: lecții principale
* `abilTaskTemplates`: taskuri
* `rituals`: daily reset mapping
* `collectibleIds`: cardurile
* `xpRules`: distribuția XP

---

# 5. Sistemul de progres (XP + Level Up)

XP se obține prin:

* Finalizare lecții (OmniKuno)
* Taskuri zilnice/săptămânale (OmniAbil)
* Daily Reset
* Deblocarea colecționabilelor

Levels:

* Level 1 (0 XP)
* Level 2 (200 XP)
* Level 3 (500 XP)
* …

Dashboard afișează:

* Nivelul curent
* Progres pe Arc
* Progres pe lecții / taskuri / ritualuri

---

# 6. Colecționabilele (Mental Protocols)

Fiecare 3–4 lecții → un card.

Fiecare card conține:

* descriere scurtă,
* tehnica mentală,
* imagine stilizată,
* unlock conditions,
* XP bonus.

Scop:

* memorabilitate
* ancorare mentală
* motivație subtilă de progres

---

# 7. Ritualuri zilnice – Daily Reset

Sistemul zilnic care creează consistență:

* claritate: 1–5
* energie: 1–5
* emoții: 1–5
* salvare
* streak
* XP

Daily Reset este echivalentul unui „PokéStop mental”.

---

# 8. OmniAbil – Implementarea practică

Conectează învățarea cu realitatea:

* task zilnic (micro)
* task săptămânal (mini-proiect)
* mark as done
* XP
* progres în Arc

Este liantul dintre teorie și viață.

---

# 9. Mental Universe Map

Prima versiune:

* 5 regiuni mentale
* acces la lecțiile corespunzătoare
* devine vizual „harta” Arc-ului

Versiuni ulterioare:

* progres vizual
* regiuni noi
* extinderi sezoniere

---

# 10. Dashboard unificat

Dashboard combină:

* OmniKuno – progres lecții
* OmniAbil – taskuri
* Daily Reset – streak
* Nivelul Arc-ului
* carduri colecționabile
* CTA „Continuă Arcul”

Acesta este locul central al utilizatorului.

---

# 11. Motorul „getNextArcAction”

Funcția care decide următorul pas logic:

* lecție nefinalizată
* task zilnic neefectuat
* ritual zilnic necompletat
* task săptămânal
* finalizare Arc

Este echivalentul „Next Mission” din Duolingo.

---

# 12. Strategia pe termen lung

## 12.1. Anul 1 – Season 1 lansat complet

* Arc 1 complet funcțional
* XP + Levels
* Collectibles
* Ritualuri zilnice
* OmniAbil minimal
* Dashboard stabil
* Mental Universe Map

## 12.2. Anii 2–3 – Extinderea sistemului

* Arc 2, 3, 4
* OmniAI Companion
* Hărți mentale avansate
* Extinderea biofeedback

## 12.3. Anii 4–5 – Ecosistem global

* OmniAI Meta-Coach
* Coherence Network
* OmniMental Institute

---

# 13. Principii de design

1. Simplitate.
2. Coerență.
3. Progres vizibil.
4. Ciclicitate.
5. Autonomie.
6. Metaforă narativă.

---

# 14. Scope-ul acestui document

Acest document servește ca:

* referință strategică
* fundament pentru dezvoltatori
* hartă pentru UX/design
* document de aliniere cu colaboratori
* schelet pentru viitoarele whitepaper/roadmap updates

---

# 15. Status: ACTIV

Acest fișier se actualizează pe măsură ce platforma evoluează.

---
1.1. Axele principale ale stării (ce vede userul peste tot)

OmniMental folosește trei axe principale pentru a descrie starea psihologică și energetică a utilizatorului:

Claritate mentală
– Cât de limpede gândește, cât de ușor își organizează ideile, cât de bine se poate concentra.
– Include: atenție, focus, senzația de „minte încețoșată” vs. minte clară.
– Exemple:

Scor mare: „Îmi vin ideile ușor, știu ce am de făcut, nu mă simt împrăștiat.”

Scor mic: „Sunt confuz, nu mă pot concentra, mi se împrăștie mintea.”

Echilibru emoțional
– Cât de bine gestionează emoțiile și stresul cotidian.
– Nu înseamnă lipsă de emoții, ci faptul că emoțiile și stresul nu îl dau peste cap.
– Include: nivel de stres, anxietate, iritabilitate, sentimentul de „sunt ok cu mine”.
– Exemple:

Scor mare: „Mă simt stabil, am emoții dar le pot duce, stresul e sub control.”

Scor mic: „Mă simt copleșit, încordat, ușor de declanșat emoțional.”

Energie fizică
– Câtă „benzină în rezervor” are, din punct de vedere fizic.
– Include: oboseală, tonus fizic, calitatea somnului (indirect).
– Exemple:

Scor mare: „Simt că am energie pentru lucruri grele, pot susține efortul.”

Scor mic: „Sunt stors, fără vlagă, corpul îmi e greu.”

Aceste 3 axe sunt afișate coerent peste tot: KPI, Daily Reset (după completare), Today Guidance, eventual grafice de progres.

1.2. Cele 6 scale detaliate (nivel „de profunzime”)

În spatele celor 3 axe principale, OmniMental folosește 6 scale detaliate pe o scală 0–10:

Energie (câtă energie simți în corp acum)

Stres (nivelul perceput de stres / tensiune)

Claritate (cât de limpede simți gândirea)

Somn (calitatea somnului recent)

Încredere (încredere în tine / auto-eficacitate)

Focus (capacitatea de a rămâne concentrat pe ceva fără să te pierzi)

Aceste scale:

sunt folosite în onboarding și în re-evaluări periodice (săptămânale / bilunare);

pot fi folosite și în statistici avansate și în recomandări mai inteligente;

sunt mapate matematic pe cele 3 axe principale, nu duplică structuri paralele.

1.3. Maparea 6 scale → 3 axe

3 axe principale sunt derivate din cele 6 scale, aproximativ astfel:

Claritate mentală
= media dintre (Claritate + Focus + Încredere)
– accent pe gândire limpede, atenție, sentimentul că „poți face față”.

Echilibru emoțional
= combinație dintre (încredere + emoții pozitive − stres)
– tehnic: se folosește stres inversat (10 − stres) + Încredere.

Energie fizică
= media dintre (Energie + Somn)
– energia percepută este filtrată prin calitatea somnului.

Formulele exacte pot fi ajustate, dar logica rămâne:

stresul este sub-componentă a echilibrului emoțional,

somnul este sub-componentă a energiei fizice,

focusul și încrederea intră în claritate mentală.

1.4. Două niveluri de evaluare: zilnic vs. aprofundat

Evaluarea zilnică („Daily Reset”)
– Userul completează zilnic 3–4 slider-e simple:

Energie (0–10)

Stres (0–10)

Claritate (0–10)

(opțional) Somn (0–10) pentru noaptea anterioară
– Din aceste valori + baseline (încredere, focus) se recalculează:

Claritate mentală

Echilibru emoțional

Energie fizică
– Feedback-ul zilnic, recomandările și badge-urile pornesc din această evaluare rapidă.

Evaluarea aprofundată (săptămânal / bilunar)
– Ecran separat sau card în dashboard, cu toate cele 6 scale:
Energie, Stres, Claritate, Somn, Încredere, Focus.
– Aceste valori:

actualizează baseline-ul personal,

sunt folosite pentru KPI-uri pe termen mediu/lung,

recalibrează interpretarea valorilor zilnice (deviații față de „normalul personal”).

1.5. Deviații față de baseline („+2” / „-1 față de media ta”)

Intern, OmniMental nu folosește doar scorul brut (ex. Energie = 7/10), ci și diferența față de baseline:

baseline Energie (din evaluările aprofundate) → ex: 6

energia de azi după Daily Reset → 8

delta = +2 față de media personală

Aceste deviații sunt folosite:

în Today Guidance (ce tip de zi este: „Focus”, „Recovery”, „Light Day”),

în mesaje motivante („azi ești mult mai clar decât de obicei”),

în gamificare și badge-uri.

Userul vede în UI:

scorul actual 0–10,

plus un comentariu clar: „(+2 față de media ta)”, nu un scor criptic -5…+5




**Sfârșitul documentului.**
