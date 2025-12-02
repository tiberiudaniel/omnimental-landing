# OmniAbil – Integrare cu Firestore (orientativ)

Notă: pagina OmniAbil v1 folosește deja mecanismele existente pentru:
- task-uri zilnice / săptămânale,
- recordere XP (OmniAbil + Daily Reset),
descrise în `lib/omniAbilTasks.ts`, `lib/dailyReset.ts`, `lib/progressFacts/recorders.ts` etc.

Pagina OmniAbil NU introduce o schemă nouă obligatorie, ci:
- consumă task-urile OmniAbil existente prin `OmniAbilCard`;
- afișează un „moveset library” static.

## 1. Colecțiile existente (rezumat)

Structura tipică (din codul actual, rezumat logic):

- `users/{uid}/dailyResetSummaries/{docId}`
- `users/{uid}/abilTasks/{taskId}`
- `users/{uid}/progressFacts/...`

OmniAbil:

- citește `abilTasks` prin hook-ul deja folosit în `OmniAbilCard`.
- marchează task-urile ca done prin `recordOmniAbilTaskCompletion()`.

## 2. Extinderi posibile (v2+)

Ulterior, se poate adăuga:

1. `users/{uid}/omniAbil/abilitiesConfig`
   - pentru a stoca ce abilități sunt „active” per user;
   - folosit pentru filtrarea în `getUserAbilitiesWithMoves()`.

2. `users/{uid}/omniAbil/movesUsage`
   - pentru a urmări ce moves sunt folosite mai mult;
   - OmniIntel poate genera analize calitative.

3. `users/{uid}/omniAbil/replayHints`
   - pentru a genera „Replay Recommendation Cards” (ce merită repetat).

În v1 nu este necesar să creezi aceste colecții; pagina OmniAbil poate funcționa complet cu structura existentă de task-uri și cu config-ul static.


