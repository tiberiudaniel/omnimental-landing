“Trendul acțiunilor” = un singur loc unde vezi, pe zile, dacă ceea ce FACE omul e coerent cu tema în focus și cu motivația declarată.

Îți propun un model clar (și ușor de implementat) în 3 niveluri:

1. Ce înseamnă “acțiune”

Definim o unitate comună: ActivityEvent.

Orice lucru relevant făcut în platformă devine un event:

OmniKuno:

lecție parcursă

test făcut

OmniAbil:

exercițiu ghidat

drill / task practic

Alte module:

respirație ghidată

reflecție / jurnal ghidat

notă rapidă

slider-e de “stare de azi”

Conceptual (și poți duce exact asta în cod):

type ActivityCategory = "knowledge" | "practice" | "reflection";

type ActivityEvent = {
  startedAt: Date | string;
  durationMin?: number;           // dacă există
  units?: number;                 // ex: 1 lecție, 1 test
  source: "omnikuno" | "omniabil" | "breathing" | "journal" | "drill" | "slider" | "other";
  category: ActivityCategory;
  focusTag?: string;              // ex: "CALM", "SLEEP", "FOCUS"
};


“Trendul acțiunilor” va include TOATE aceste evenimente.

2. Ponderi inteligente: cunoaștere vs aplicare vs monitorizare

Vrei să nu fie toate egale. O lecție de 10 minute nu valorează la fel ca 10 minute de exercițiu practic.

2.1. Pasul 1 – minute “echivalente”

Pentru evenimentele fără durată (lecții, teste):

const DEFAULT_MIN_PER_UNIT: Record<ActivityCategory, number> = {
  knowledge: 6,   // o lecție/test ≈ 6 min efort cognitiv
  practice: 8,    // un exercițiu practic ≈ 8 min echivalente
  reflection: 4,  // o notă/jurnal scurt ≈ 4 min
};


Formula de bază pentru orice event:

const baseMinutes =
  event.durationMin ??
  (event.units || 1) * DEFAULT_MIN_PER_UNIT[event.category];

2.2. Pasul 2 – greutăți pe categorie

Implementarea trebuie să conteze mai mult decât doar cititul.

Exemplu de ponderi:

const CATEGORY_WEIGHTS: Record<ActivityCategory, number> = {
  knowledge: 0.8,   // învățarea contează, dar nu e suficientă singură
  practice: 1.5,    // aplicarea e “aurul”
  reflection: 1.1,  // reflecția consolidează schimbarea
};

2.3. Pasul 3 – cât de mult e legat de tema în focus

Dacă tema în focus este “Calm” și omul face un curs despre “Productivity hacking”, ar trebui să conteze, dar mai puțin.

const FOCUS_MATCH_WEIGHT = 1.0;
const FOCUS_MISMATCH_WEIGHT = 0.5;

function focusWeight(event: ActivityEvent, currentFocusTag?: string) {
  if (!currentFocusTag || !event.focusTag) return 1.0;
  return event.focusTag === currentFocusTag
    ? FOCUS_MATCH_WEIGHT
    : FOCUS_MISMATCH_WEIGHT;
}

2.4. Pasul 4 – scor zilnic de acțiuni

Pentru fiecare event:

const minutes = baseMinutes;
const wCat = CATEGORY_WEIGHTS[event.category];
const wFocus = focusWeight(event, currentFocusTag);

const weightedMinutes = minutes * wCat * wFocus;


Pe o zi:

DailyWeightedMinutes = Σ weightedMinutes (toate event-urile din acea zi)


Apoi normalizăm la un scor 0–100, ca să fie ușor de citit:

const DAILY_TARGET = 30; // 30 min ponderate ≈ zi “plină”

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const toActionScore = (mins: number) =>
  Math.round(clamp01(mins / DAILY_TARGET) * 100);


Rezultatul final pentru grafic:

pentru fiecare zi: day, label, totalMin = toActionScore(DailyWeightedMinutes)

pe axa Y vezi scor 0–100 (efortul de acțiune).

3. Cum arată “Trendul acțiunilor” în UI

Schimbi doar etichetele și ce date îi dai graficului:

Titlu card:

Trendul acțiunilor

Subtitlu:

„Acțiunile tale zilnice (lecții, exerciții, reflecții) în raport cu tema în focus.”

Toggle:

Săptămână / Lună

În loc de Minute / Sesiuni / Scor, poți avea:

Acțiuni (scor) – scor 0–100 (formula de mai sus)

opțional: Minute brute – doar suma minutelor ne-ponderate

opțional: Număr acțiuni – doar count de evenimente

Vizual:

un BarChart cu câte o bară pe zi (ultimele 7 sau 30 zile);

un mic sumar sub grafic:

„Pondere: 45% practice, 30% knowledge, 25% reflection în ultimele 7 zile.”

4. Funcție concretă pentru calcul (schelet pentru Codex)

Poți folosi o funcție nouă în progressAnalytics:

type DailyBucket = {
  day: number;      // timestamp ms
  label: string;    // ex: "Lu", "Ma" sau "12"
  totalMin: number; // aici punem scorul 0–100
};

export function computeActionTrend(
  events: ActivityEvent[],
  refMs: number,
  lang: string,
  days: number,
  currentFocusTag?: string
): DailyBucket[] {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startMs = refMs - (days - 1) * DAY_MS;

  const buckets: DailyBucket[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = startMs + i * DAY_MS;
    const dayEnd = dayStart + DAY_MS;

    const dayEvents = events.filter((ev) => {
      const t = new Date(ev.startedAt).getTime();
      return t >= dayStart && t < dayEnd;
    });

    let weightedTotal = 0;

    for (const ev of dayEvents) {
      const baseMinutes =
        ev.durationMin ??
        (ev.units || 1) * DEFAULT_MIN_PER_UNIT[ev.category];

      const wCat = CATEGORY_WEIGHTS[ev.category];
      const wFocus = focusWeight(ev, currentFocusTag);

      weightedTotal += baseMinutes * wCat * wFocus;
    }

    const score = toActionScore(weightedTotal);

    buckets.push({
      day: dayStart,
      label: new Date(dayStart).getDate().toString(),
      totalMin: score,
    });
  }

  return buckets;
}


Apoi în ProgressDashboard:

construiești events din:

sesiunile existente (reflection/breathing/drill ⇒ category: "practice" | "reflection")

logs din OmniKuno (lecții/teste ⇒ category: "knowledge")

etc.

pentru Săptămână:

const weeklyActions = computeActionTrend(allEvents, refMs, lang, 7, currentFocusTag);


pentru Lună:

const monthlyActions = computeActionTrend(allEvents, refMs, lang, 30, currentFocusTag);


Și pentru grafic:

<WeeklyTrendsChart
  data={timeframe === "week" ? weeklyActions : monthlyActions}
  showBars={true}
  showValues={false}
  ariaLabel="Trendul acțiunilor"
/>

5. Ce mai poți adăuga ca să fie “deștept”

Raport între dorință și acțiune
Compară scorul de acțiuni cu:

slider-ele de motivație / importanță pentru tema în focus.
Ex.: motivație 9/10, dar scor acțiuni = 20/100 ⇒ mesaj: „Vrei mult, dar acțiunile nu țin pasul.”

Feedback vizual simplu pe săptămână

medie săptămânală a scorului;

dacă media >70 ⇒ “Săptămână activă”;

40–70 ⇒ “În curs de consolidare”;

<40 ⇒ “Acțiuni insuficiente pentru schimbarea dorită.”

Filtru după temă
Buton: “Doar acțiuni legate de tema în focus / Toate acțiunile”, ca să vezi cât de aliniat e efortul.