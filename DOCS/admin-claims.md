Admin claims și seeding insights (prod‑ready)

Scop
- Să scriem în `insights/*` doar cu privilegii admin, păstrând citirea publică.

Reguli Firestore (deja setate)
- `match /insights/{theme}`: `allow read: if true; allow create, update, delete: if isAdmin();`
- `isAdmin()` verifică `request.auth.token.admin == true`.

Setare custom claim admin
1) Creează un service account JSON din Google Cloud Console (sau folosește ADC/local credentials).
2) Rulează scriptul de setare a claim‑ului:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
node scripts/setAdminClaim.mjs --uid=FIREBASE_UID
```

Alternativ, după email:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
node scripts/setAdminClaim.mjs --email=user@example.com
```

Seed insights cu Admin SDK
- Opțiunea A (script server):

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
node scripts/seedInsightsAdmin.mjs
```

- Opțiunea B (din app):
  - Autentifică userul cu claim admin (vezi mai sus)
  - Setează `NEXT_PUBLIC_ENABLE_SEED=1`
  - Deschide `/admin/seed-insights` și apasă “Seed now”

Note
- Necesită pachetul `firebase-admin` instalat pentru scripturi (`npm i firebase-admin`).
- După seeding, revino la `NEXT_PUBLIC_ENABLE_SEED=0` și păstrează `NEXT_PUBLIC_USE_CLOUD_INSIGHTS=1` doar dacă vrei să servești din Firestore.

