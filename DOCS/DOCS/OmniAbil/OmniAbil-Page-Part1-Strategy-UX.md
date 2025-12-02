# OmniAbil – Strategie & UX (v1, Hybrid)

## 1. Rolul OmniAbil în ecosistem

OmniAbil este stratul de implementare practică din OmniMental:

- OmniScope / intent → clarifică direcția.
- OmniKuno → oferă insight-uri și modele mentale.
- **OmniAbil → traduce insight-urile în acțiuni scurte, repetate, în viața de zi cu zi.**
- OmniFlex → ajută la alinierea cu valori și identitate.
- OmniIntel → reflectă în timp calitatea și continuitatea implementării.

OmniAbil este poziționat ca „Level 2 – Action” în experiență.

Principii (aliniate la White Paper):
- tehnologie pentru claritate, nu zgomot;
- acțiuni mici, realiste (90 sec – 10 min);
- progres auto-referențial (vs. competiție cu alții);
- AI = oglindă și ghid, nu motor de presiune sau manipulare.

---

## 2. Obiectivele paginii OmniAbil

1. Să răspundă imediat la întrebarea: „Ce pot face azi, concret?”  
2. Să afișeze clar:
   - misiunile zilei (daily / weekly) – conectate la OmniAbilTasks.
   - abilitățile pe care userul le antrenează (bază statică v1).
   - moveset-ul fiecărei abilități (4 „mișcări”/acțiuni tipice).
3. Să rămână calmă vizual, fără overload de carduri și metrici.
4. Să explice transparent, în limbaj simplu, cum funcționează:
   - OmniKuno → OmniAbil → OmniFlex / OmniIntel.

---

## 3. Structura UX a paginii

OmniAbil este structurată în 3 zone principale:

1. **Intro / Hero (card mare)**
   - Titlu: „OmniAbil · Implementare practică”
   - Subtitlu:
     - RO: „Aici transformi ce ai învățat în acțiuni scurte, repetate, care schimbă cum trăiești ziua.”
     - EN: „Here you turn what you’ve learned into short, repeatable actions that change how you live your day.”
   - Context scurt:
     - OmniKuno = înțelegere,
     - OmniAbil = acțiune,
     - totul cu pași simpli, fără presiune.

2. **Today’s Protocol – „Misiunile tale de azi”**
   - Reutilizează componenta existentă de tip `OmniAbilCard` (task-uri zilnice/săptămânale).
   - Microcopy:
     - accent pe explorare și consistență, nu pe vinovăție.
     - userul bifează, primește XP, își vede mai târziu progresul în dashboard.
   - Nu se afișează leaderboard sau comparații între useri.

3. **Active Abilities & Moveset**
   - Grid de carduri de abilitate, fiecare cu:
     - icon + titlu + one-liner (RO/EN),
     - 4 moves: daily ritual, micro reset, skill booster, emergency move.
   - Moveset-ul este, în v1, configurat static în `config/omniAbilConfig.ts`.
   - Mai târziu poate fi personalizat pe user (în funcție de intenție, scoruri etc).

---

## 4. Ton & Stil (Hybrid)

- Vizual: păstrează cardurile rotunjite, culorile OmniMental (bej / coffee-night), umbre soft.
- Text: inspirat de white paper – calm, clar, suportiv, fără promisiuni false.
- Gamificare: prezentă, dar discretă („+XP”, „misiuni”), fără presiune, fără ranking.

---

## 5. Fișiere implicate

1. Config & logic:
   - `config/omniAbilConfig.ts` – definirea abilităților și moveset-urilor.
   - `lib/omniAbilEngine.ts` – helperi pentru a obține abilități + moves pentru UI.

2. UI:
   - `components/omniAbil/OmniAbilPage.tsx` – pagina OmniAbil (client component).
   - `app/(app)/omni-abil/page.tsx` – route-level wrapper, cu `RequireAuth` + `Suspense`.

3. Integrare:
   - Pagina folosește deja:
     - `AppShell`
     - `SiteHeader`
     - `MenuOverlay`
     - `useNavigationLinks`
     - `useProfile`
     - `useI18n`
     - `OmniAbilCard` (task-uri existente).

---

## 6. Task Codex – rezumat

1. Creează fișierele de config și engine (`config/omniAbilConfig.ts`, `lib/omniAbilEngine.ts`).
2. Creează pagina UI (`components/omniAbil/OmniAbilPage.tsx`).
3. Creează route-ul (`app/(app)/omni-abil/page.tsx`).
4. Verifică build + smoke tests.
5. Opțional: adaugă link către `/omni-abil` în navigația principală, dacă nu există deja.
