OmniJournal System — Documentation (v1.0)

structura exactă a documentului (100% completă și utilă)
1. Overview / Purpose

ce este jurnalul OmniMental

de ce există

ce problemă rezolvă pentru user

care este rolul lui în învățare, în schimbare de comportament și în retenție

diferența între jurnal liber și jurnal legat de lecții

2. Tipuri de jurnale

Journal entries generale (reflection, daily)

Lesson-linked journal (omniKuno_lesson)

viitoarele categorii: aiCoachInsights, protocole, emotional logs

3. Principii fundamentale UX

zero fricțiune

acces rapid

posibilitate de „fragmentare” în blocuri

jurnal per lecție = un document cu mai multe blocuri

vizibil doar userului

limitele recomandate (no flooding)

atașarea contextelor pentru AI (future-proof)

4. Arhitectura completă

colecțiile Firestore folosite

reguli Firestore pentru securitate

shape-ul complet al documentelor (LessonJournalEntry, JournalBlock, etc.)

ce câmpuri sunt obligatorii

cum se generează ID-uri

diferența dintre data locală și data din server

5. Flux complet de scriere

deschidere jurnal din lecție

listarea blocurilor existente

adăugarea unei note noi

cum se face upsert (creare dacă nu există, update dacă există)

fallback local dacă userul e offline

sincronizare la reconectare

6. Flux complet de consum (Dashboard → Recent Entries)

cum sunt marcate notele OmniKuno

cum apare deep-link-ul

regulile de navigare

ce se întâmplă dacă lecția nu mai există sau e blocată

7. Interfața API / server actions

funcțiile existente

cum se suprascriu / extind

cum le folosește backend-ul

cum le apelează frontend-ul

8. Extensibilitate (roadmap intern)

highlight → „Save selection to journal”

linking cu AI Coach (rezumate, întrebări, feedback)

transformare jurnal → insight library personală

tag-uri, search semantic, filtre

timeline vizual cu conținut provenit din OmniKuno

9. Reguli de design și copywriting

tonul recomandat în jurnal

exemple pozitive

ce NU trebuie să facă produsul în jurnal (evitarea presiunii)

directive pentru viitoarele module OmniKuno

10. QA Checklist

ce testăm în UX

ce testăm în API

ce testăm în Dashboard

ce testăm în deep-link

ce testăm în sincronizarea locală



OmniMental – Internal Design & Architecture Spec

1. Overview & Purpose

OmniJournal este sistemul central de jurnalizare al OmniMental.
Este construit ca o unealtă de reflecție, integrare și consolidare a învățării, atât în modulele OmniKuno, cât și în restul ecosistemului: Dashboard, AI Coach, recomandări, introspecții, protocoale zilnice și progres.

Scopul principal:

să ofere userului un spațiu simplu, clar și liniștit în care să noteze idei,

să transforme fiecare lecție într-un punct de integrare,

să susțină retenția, înțelegerea profundă și internalizarea conceptelor,

să creeze o memorie personală a progresului.

Principii:

zero fricțiune — acces instant la jurnal din orice lecție;

un singur entry per lecție — dar cu mai multe blocuri de conținut;

date structurate — pentru analiză, AI și context semantic;

private & secure — doar userul vede conținutul.

2. Tipuri de jurnale
2.1. Lesson-Linked Journal (omniKuno_lesson)

Jurnalul asociat unei lecții OmniKuno.

Fiecare lecție poate avea un singur entry, dar cu blocuri multiple.

Userul poate salva:

text liber,

idei,

note scurte,

fragmente copiate din lecție (în versiunile viitoare).

2.2. General Reflections / Notes

Jurnal general pentru reflecții nelegate de lecții specifice:

introspecție zilnică,

insight-uri,

notițe mentale,

idei pentru viitor.

2.3. Protocol-linked Journal (viitoare extensii)

Conectat la:

protocoale de respirație,

exerciții mentale,

mini-sesiuni ghidate,

„anchoring logs”.

2.4. AI Coach Insight Memory (viitor)

Sistem semantic care permite:

rezumate automate,

pattern recognition,

recomandări contextuale.

3. Principii de design UX & produs
3.1. Simplitate absolută

Userul trebuie să poată deschide și folosi jurnalul fără să piardă focusul:

nu părăsește lecția, nu schimbă contextul,

jurnalul apare într-un drawer (dreapta sau jos).

3.2. Un entry per lecție

Evitați fragmentarea jurnalului pe 10 documente separate.
Regula:

Dacă userul salvează mai multe note din aceeași lecție → ele intră toate în același entry, ca blocuri separate.

3.3. Blocuri independente

Fiecare bloc are:

id

kind (ex: note, snippet)

text

createdAt

screenId (opțional – pentru fragmente extrase automat)

3.4. Structurare pentru AI

Fiecare entry are metadate:

moduleId

lessonId

lessonTitle

sourceType

Acest lucru permite ca AI Coach să citească jurnalul în contextul potrivit.

3.5. Fără presiune

UI-ul și copy-ul jurnalului trebuie să fie blânde:

fără obligativitate,

fără gamificare agresivă,

fără „trebuie să scrii”.

4. Arhitectura tehnică completă
4.1. Model de date (Firestore)
Document: LessonJournalEntry
{
  id: string,
  userId: string,
  sourceType: "omniKuno_lesson",
  moduleId: string,
  lessonId: string,
  lessonTitle: string,
  blocks: LessonJournalBlock[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Subcomponentă: LessonJournalBlock
{
  id: string,
  kind: "note" | "snippet",
  text: string,
  screenId?: string | null,
  createdAt: Timestamp
}

4.2. Colecție Firestore

lessonJournalEntries

4.3. Cheie logică pentru un entry

un entry unic per: (userId + moduleId + lessonId)

4.4. Reguli Firestore

doar owner-ul poate citi/scrie documentele sale,

structura este verificată prin validare minimă,

securitate completă implementată.

5. Flux complet – de la lecție la jurnal
5.1. Deschiderea Jurnalului

În LessonView.tsx, userul vede în bara lecției active:

📝 Jurnal

Click → se deschide drawer-ul LessonJournalDrawer.

5.2. Afișarea notelor existente

Drawer-ul încarcă:

lista de blocuri deja existente pentru lecția respectivă.

Dacă nu există entry → afișează:

„Nu ai încă note pentru această lecție.”

5.3. Adăugarea unei note noi

Userul introduce text → apasă „Adaugă în jurnal”.

Backend:

dacă entry nu există → îl creează,

dacă există → adaugă block în array.

5.4. Rezultatul

Userul vede imediat noul block apărut în listă.

6. Flux complet – consum în Dashboard
6.1. Recent Entries

Când userul revine în Dashboard:

ultima notă apare în cardul Recent Entries,

cu tag clar: OmniKuno,

afișează: lessonTitle + preview-ul ultimei note.

6.2. Deep-link în OmniKuno

Click pe entry → navighează înapoi în lecția exactă:

/omni-kuno?module=...&lesson=...

6.3. Fallback logic

Dacă în viitor lecția dispare / devine inactivă:

fallback la modulul corect,

cu un mesaj: „Structura lecțiilor a fost actualizată.”

7. API & Server Actions
Funcții principale:
addLessonJournalNote()

adaugă bloc nou în jurnal.

getLessonJournal()

returnează entry-ul complet (sau null).

Recorders / Recent Entries

jurnalul creează și intrări în recentEntries.

Integrare completă cu:

lib/db/lessonJournal.ts

lib/progressFacts/recorders.ts

fallback local în useJournal.ts.

8. Extensibilitate & roadmap
8.1. „Save selection to journal”

User selectează text → tooltip „Salvează în jurnal” → creează block de tip snippet.

8.2. Jurnal audio (voice note)

userul poate dicta,

transformare automată în text.

8.3. AI Coach Integration

sumarizează jurnalul,

extrage teme,

oferă insight-uri,

sugerează lecții relevante.

8.4. Semantic Search

Căutare în jurnal prin embedding-uri.

8.5. Tagging automat

Jurnalul poate fi extins cu tag-uri:

energie,

calm,

voință,

comunicare,

greutate optimă etc.

8.6. Cross-lesson insights

Dashboard poate genera un „Insight timeline”.

9. Design rules & copywriting
9.1. Tonul

calm,

blând,

non-judicativ,

încurajator,

scurt și clar.

9.2. Exemplu bun:

„Mi-am dat seama că emoția vine înaintea reacției. Încerc să fac loc între ele.”

9.3. Exemplu de evitat:

comenzi,

ton autoritar,

limbaj prea academic,

presiuni de tip „trebuie să”.

9.4. Recomandări UI

spațiu alb generos,

font clar,

blocuri ușor de citit,

structură aerisită,

lipsa distragerilor.

10. QA Checklist
10.1. UX

buton „Jurnal” vizibil în lecție,

drawer deschide corect,

salvarea notei este instant vizibilă.

10.2. API & DB

un entry per lecție,

multiple blocuri adăugate corect,

timestamp corect.

10.3. Dashboard

apare în Recent Entries,

tag „OmniKuno” vizibil,

deep-link duce exact în lecția potrivită.

10.4. Offline compatibility

fallback local funcționează,

sincronizare la reconectare.

10.5. Teste automate

test E2E pentru salvarea jurnalului,

test pentru deep-link,

test pentru fallback.

END — OmniJournal System (v1.0)