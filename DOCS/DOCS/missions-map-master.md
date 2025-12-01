# OmniMental – Mission Map / Perspectivele Misiunii
(v1 – 2025)

Pornim de la ideea din White Paper: tehnologia ca **oglindă** pentru coerență (minte–corp–emoție), nu ca simplu „tracker de scoruri”.:contentReference[oaicite:0]{index=0}  
Pagina „Perspectivele Misiunii” oferă, pentru o misiune concretă (ex.: „Relația de cuplu”), două perspective:

1. **Resurse interne** – ce condiții de bază are nevoie sistemul (energie, somn, emoții etc.).
2. **Progres mental** – cât a lucrat deja pe misiune (Scop, Kuno, Abil, Flex).

Userul vede DOAR una dintre perspective pe ecran, și poate alterna între ele cu un toggle/tab.  

---

## 1. Obiectivele paginii

1. Să-i arate userului **„ce are nevoie”** (resurse) vs. **„ce a făcut deja”** (progres mental) pentru misiunea aleasă.
2. Să ofere un **următor pas clar** (CTA) – lecție / task / protocol de resurse.
3. Să păstreze mesajul: „Nu ești defect, doar nealiniat. Scorurile sunt orientative, nu etichete.”

---

## 2. Puncte de intrare

### 2.1. Din Dashboard

- Card nou: `MissionPerspectiveCard`.
- Afișat doar dacă userul are o misiune activă.

Copy recomandat:

- Titlu: `Harta misiunii tale`
- Subtitlu: `Vezi dintr-o privire cum stai cu resursele interne și cu progresul mental.`
- CTA: `Deschide harta`

Click → `/mission-map` (opțional `?missionId=...`).

### 2.2. Din Header (zona logată)

- Buton nou lângă „Jurnal”.
- Label: `Hartă misiune`
- Icon: busolă/hartă (lucide `Map`, `Route` sau ceva similar).
- Condiție de afișare: user autentificat + `activeMission` există.

Click → `/mission-map`.

### 2.3. Ruta autonomă

- `app/mission-map/page.tsx`
- Acceptă `?missionId=...`.
- Dacă lipsește `missionId`, folosește `activeMission` din profil.
- Dacă nu există nicio misiune: ecran „empty” cu CTA spre onboarding / alegere misiune.

---

## 3. Model de date minim

De extras printr-un helper/hook (`useMissionPerspective`):

```ts
export type MissionSummary = {
  id: string;
  title: string;
  description?: string;
  category?: string; // ex: "relatii", "energie", "trading"
};

export type ResourceMetricKey =
  | "energie"
  | "somn"
  | "respiratie"
  | "emotii"
  | "miscare"
  | "intuitie";

export type ResourceMetric = {
  key: ResourceMetricKey;
  label: string;
  description: string;
  score: number; // 0–100
};

export type MentalMetricKey = "scop" | "kuno" | "abil" | "flex";

export type MentalMetric = {
  key: MentalMetricKey;
  label: string;
  description: string;
  score: number; // 0–100
};

export type MissionPerspective = {
  mission: MissionSummary | null;
  resources: ResourceMetric[];
  mental: MentalMetric[];
};
În v1, scorurile pot fi mock / derivate simplu din:

rezultatele onboarding-ului,

număr lecții OmniKuno,

număr taskuri OmniAbil,

auto-raportări rapide.

Important: logica de calcul stă într-un singur loc (useMissionPerspective).

4. Layout & UX
4.1. Structura paginii
Hero sus – titlu + descriere scurtă + disclaimer.

Toggle/tabs – Resurse interne / Progres mental.

View 1: Resurse – siluetă + listă resurse.

View 2: Progres mental – fagure + listă skill-uri.

CTA jos – pasul următor.

4.2. Hero – copy propus
Titlu:
Harta misiunii tale

Subtitlu:
Pentru misiunea „{{missionTitle}}” ne uităm mai întâi la resursele tale interne, apoi la felul în care ai lucrat mental la această schimbare.

Disclaimer mic (gri):

„Valorile de mai jos sunt orientative. Ele nu te definesc, ci te ajută să vezi unde să investești atenție în perioada următoare.”

5. View 1 – „Resurse interne”
5.1. Vizual
Coloana stângă: siluetă umană desenată (imagine statică din public/assets/mission-map/silhouette-resources.png).

Pe siluetă, 3–4 hexagoane sau zone marcate (thorace, abdomen, pelvis).

Grad de umplere = overlay semitransparent în ton „miere” (dinamic în v2, static în v1).

5.2. Text (dreapta)
Titlu secțiune:
Resursele tale interne pentru această misiune

Intro:

„Ca să poți lucra cu adevărat la {{missionTitle}}, sistemul tău nervos are nevoie de o bază stabilă. Mai jos vezi câteva resurse de bază. Scorurile nu sunt perfecte, dar îți arată unde e bine să fii atent în perioada următoare.”

Listă cu resurse:

Energie – {{energie}}%
Cât de des simți că ai energie utilă de-a lungul zilei, nu doar vârfuri și prăbușiri.

Somn – {{somn}}%
Cât de recuperator simți somnul tău, nu doar numărul de ore.

Respirație – {{respiratie}}%
Cât de ușor îți este să revii la calm doar din respirație când crește tensiunea.

Emoții – {{emotii}}%
Cât de repede revii din stări de stres sau iritare.

Mișcare – {{miscare}}%
Cât de constant îți pui corpul în mișcare (nu doar sport intens, ci și micro-mișcări).

Intuiție corporală – {{intuitie}}%
Cât de mult îți asculți „senzația din stomac” și semnalele de oboseală / overload.

Sub listă – mesaj AI scurt (opțional):

„Observ că somnul și respirația sunt cele mai sensibile zone. Ar merita să începem cu 1–2 protocoale scurte aici, înainte să accelerăm restul procesului.”

CTA:
OK, am înțeles resursele mele → Vreau să văd progresul mental
(apasă tab-ul „Progres mental”).

6. View 2 – „Progres mental”
6.1. Vizual
Coloana stângă: fagure 4-hex minimal (public/assets/mission-map/hex-mental.png) sau componentă SVG:

sus: SCOP

dreapta: KUNO

stânga: ABIL

jos: FLEX

Fiecare hexagon: procent + umplere „miere”.

6.2. Text (dreapta)
Titlu secțiune:
Cum ai lucrat până acum la această misiune

Intro:

„Progresul tău pentru {{missionTitle}} nu ține doar de timp, ci de cum ți-ai folosit atenția. Mai jos vezi patru direcții care susțin orice schimbare reală.”

Listă:

Scop ({{scop}}%)
Cât de clar ai formulat ce vrei să obții, de ce e important și cum arată o versiune reușită a misiunii.

Cunoaștere – Kuno ({{kuno}}%)
Cât ai înțeles până acum despre mecanismele reale din spatele misiunii tale (ex.: dinamica relațiilor, pattern-uri de stres, principii de focus).

Abilități – Abil ({{abil}}%)
Cât de des ai aplicat exercițiile sau protocoalele, în situații reale, nu doar teoric.

Flexibilitate – Flex ({{flex}}%)
Cât de mult ai ajustat abordarea când ceva nu a mers, în loc să abandonezi sau să repeți la infinit aceeași strategie.

Mesaj AI scurt:

„De exemplu, ai claritate bună la Scop, dar Kuno și Abil sunt încă la început. Asta înseamnă că următorul pas logic este să acumulezi 1–2 insight-uri cheie și să le testezi în practică, nu să te judeci că nu s-a schimbat totul peste noapte.”

CTA principal:
Continuă cu următorul pas →
(duce către: lecție recomandată OmniKuno / task OmniAbil / protocol de resurse, în funcție de scoruri).

7. Extensibilitate
Lista de resurse poate fi extinsă/reordonată.

Fagurele mental poate primi încă 1–2 celule (ex.: „Identitate”, „Valori”).

În v2, putem adăuga selector de misiuni (dropdown) în header-ul paginii.

8. Cod – Skeleton Next.js + Tailwind
8.1. Hook – useMissionPerspective.ts
ts
Copy code
// lib/hooks/useMissionPerspective.ts
"use client";

import { useMemo } from "react";

export type MissionSummary = {
  id: string;
  title: string;
  description?: string;
  category?: string;
};

export type ResourceMetricKey =
  | "energie"
  | "somn"
  | "respiratie"
  | "emotii"
  | "miscare"
  | "intuitie";

export type ResourceMetric = {
  key: ResourceMetricKey;
  label: string;
  description: string;
  score: number; // 0-100
};

export type MentalMetricKey = "scop" | "kuno" | "abil" | "flex";

export type MentalMetric = {
  key: MentalMetricKey;
  label: string;
  description: string;
  score: number; // 0-100
};

export type MissionPerspective = {
  mission: MissionSummary | null;
  resources: ResourceMetric[];
  mental: MentalMetric[];
};

type Options = {
  missionId?: string;
};

export function useMissionPerspective(options?: Options): MissionPerspective {
  // TODO: înlocuiește cu date reale din Firestore / backend
  // Pentru început, valori mock pentru testare.

  const mission: MissionSummary = {
    id: options?.missionId ?? "demo-mission",
    title: "Relația de cuplu",
    description:
      "Vrei să reduci tensiunea, să comunici mai clar și să simți din nou conexiune autentică.",
    category: "relatii",
  };

  const resources: ResourceMetric[] = [
    {
      key: "energie",
      label: "Energie",
      description:
        "Cât de des simți că ai energie utilă de-a lungul zilei, nu doar vârfuri și prăbușiri.",
      score: 70,
    },
    {
      key: "somn",
      label: "Somn",
      description:
        "Cât de recuperator simți somnul tău, nu doar numărul de ore.",
      score: 45,
    },
    {
      key: "respiratie",
      label: "Respirație",
      description:
        "Cât de ușor îți este să revii la calm doar din respirație când crește tensiunea.",
      score: 35,
    },
    {
      key: "emotii",
      label: "Emoții",
      description:
        "Cât de repede revii din stări de stres sau iritare.",
      score: 55,
    },
    {
      key: "miscare",
      label: "Mișcare",
      description:
        "Cât de constant îți pui corpul în mișcare (nu doar sport intens, ci și micro-mișcări).",
      score: 50,
    },
    {
      key: "intuitie",
      label: "Intuiție corporală",
      description:
        "Cât de mult îți asculți „senzația din stomac” și semnalele de oboseală / overload.",
      score: 30,
    },
  ];

  const mental: MentalMetric[] = [
    {
      key: "scop",
      label: "Scop",
      description:
        "Cât de clar ai formulat ce vrei să obții și de ce e important.",
      score: 60,
    },
    {
      key: "kuno",
      label: "Kuno",
      description:
        "Cât ai înțeles până acum despre mecanismele reale din spatele misiunii.",
      score: 25,
    },
    {
      key: "abil",
      label: "Abil",
      description:
        "Cât de des ai aplicat exercițiile sau protocoalele, în situații reale.",
      score: 15,
    },
    {
      key: "flex",
      label: "Flex",
      description:
        "Cât de mult ai ajustat abordarea când ceva nu a mers.",
      score: 20,
    },
  ];

  return useMemo(
    () => ({
      mission,
      resources,
      mental,
    }),
    [mission, resources, mental]
  );
}
8.2. Pagina – app/mission-map/page.tsx
tsx
Copy code
// app/mission-map/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useMissionPerspective,
  ResourceMetric,
  MentalMetric,
} from "@/lib/hooks/useMissionPerspective";

type ViewType = "resources" | "mental";

export default function MissionMapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const missionId = searchParams.get("missionId") ?? undefined;

  const { mission, resources, mental } = useMissionPerspective({ missionId });
  const [view, setView] = useState<ViewType>("resources");

  if (!mission) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
          <h1 className="text-3xl font-semibold text-slate-900">
            Harta misiunii tale
          </h1>
          <p className="text-slate-600">
            Nu ai setat încă o misiune principală. Alege o misiune din
            onboarding sau din dashboard și revino aici.
          </p>
          <button
            className="inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-800"
            onClick={() => router.push("/experience-onboarding")}
          >
            Alege o misiune
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
        {/* Hero */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            OmniMental • Perspectiva misiunii
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Harta misiunii tale
          </h1>
          <p className="max-w-3xl text-sm text-slate-700">
            Pentru misiunea „{mission.title}” ne uităm mai întâi la resursele
            tale interne, apoi la felul în care ai lucrat mental la această
            schimbare.
          </p>
          <p className="max-w-3xl text-xs text-slate-500">
            Valorile de mai jos sunt orientative. Ele nu te definesc, ci te
            ajută să vezi unde să investești atenție în perioada următoare.
          </p>
        </header>

        {/* Tabs */}
        <div className="inline-flex w-fit rounded-full bg-slate-200/80 p-1 text-xs shadow-sm">
          <button
            className={`rounded-full px-4 py-1 transition ${
              view === "resources"
                ? "bg-slate-900 text-slate-50"
                : "text-slate-700 hover:text-slate-900"
            }`}
            onClick={() => setView("resources")}
          >
            Resurse interne
          </button>
          <button
            className={`rounded-full px-4 py-1 transition ${
              view === "mental"
                ? "bg-slate-900 text-slate-50"
                : "text-slate-700 hover:text-slate-900"
            }`}
            onClick={() => setView("mental")}
          >
            Progres mental
          </button>
        </div>

        {/* Content */}
        {view === "resources" ? (
          <MissionResourcesView resources={resources} />
        ) : (
          <MissionMentalProgressView mental={mental} />
        )}
      </div>
    </main>
  );
}

function MissionResourcesView({ resources }: { resources: ResourceMetric[] }) {
  return (
    <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      {/* Vizual */}
      <div className="flex items-center justify-center">
        <div className="relative max-w-xs">
          <img
            src="/assets/mission-map/silhouette-resources.png"
            alt="Siluetă resurse interne"
            className="w-full rounded-xl border border-slate-300/70 bg-slate-50/60 shadow-sm"
          />
          {/* Placeholder pentru future overlays dinamice */}
        </div>
      </div>

      {/* Text */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Resursele tale interne pentru această misiune
        </h2>
        <p className="text-sm text-slate-700">
          Ca să poți lucra cu adevărat la această misiune, sistemul tău nervos
          are nevoie de o bază stabilă. Mai jos vezi câteva resurse de bază.
          Scorurile nu sunt perfecte, dar îți arată unde e bine să fii atent în
          perioada următoare.
        </p>

        <div className="space-y-3">
          {resources.map((r) => (
            <ResourceRow key={r.key} metric={r} />
          ))}
        </div>

        <p className="text-xs text-slate-500">
          Observă ce resursă este cea mai fragilă acum. Uneori un mic pas aici
          schimbă mai mult decât zece tehnici mentale.
        </p>
      </div>
    </section>
  );
}

function ResourceRow({ metric }: { metric: ResourceMetric }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">
          {metric.label}
        </span>
        <span className="text-xs font-semibold text-slate-800">
          {metric.score}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-500/90"
          style={{ width: `${metric.score}%` }}
        />
      </div>
      <p className="text-xs text-slate-600">{metric.description}</p>
    </div>
  );
}

function MissionMentalProgressView({ mental }: { mental: MentalMetric[] }) {
  const byKey = Object.fromEntries(mental.map((m) => [m.key, m]));
  const scop = byKey["scop"];
  const kuno = byKey["kuno"];
  const abil = byKey["abil"];
  const flex = byKey["flex"];

  return (
    <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      {/* Vizual */}
      <div className="flex items-center justify-center">
        <div className="relative max-w-xs rounded-xl border border-slate-300/70 bg-slate-50/60 p-6 shadow-sm">
          {/* Hex layout simplu, nu ne batem cu SVG acum */}
          <div className="flex flex-col items-center gap-3">
            <HexMetric metric={scop} />
            <div className="flex gap-3">
              <HexMetric metric={abil} />
              <HexMetric metric={kuno} />
            </div>
            <HexMetric metric={flex} />
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Cum ai lucrat până acum la această misiune
        </h2>
        <p className="text-sm text-slate-700">
          Progresul tău nu ține doar de timp, ci de cum ți-ai folosit atenția.
          Mai jos vezi patru direcții care susțin orice schimbare reală.
        </p>

        <div className="space-y-3">
          {mental.map((m) => (
            <div
              key={m.key}
              className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-slate-200/70"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {m.label}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {m.score}%
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{m.description}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          De exemplu, dacă Scop este sus, dar Kuno și Abil sunt la început, e
          normal să nu vezi încă schimbări mari. Următorul pas logic este să
          acumulezi 1–2 insight-uri cheie și să le testezi în practică.
        </p>

        <button
          className="inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-800"
          onClick={() => {
            // TODO: redirect spre următorul pas recomandat
            // ex: router.push("/experience-onboarding?...") sau spre OmniKuno/Abil
          }}
        >
          Continuă cu următorul pas
        </button>
      </div>
    </section>
  );
}

function HexMetric({ metric }: { metric?: MentalMetric }) {
  if (!metric) return null;

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      {/* hex simplu stilizat */}
      <div className="absolute inset-0 origin-center rotate-45 rounded-[0.75rem] bg-amber-100 ring-1 ring-amber-400/70" />
      <div className="relative flex flex-col items-center justify-center px-2 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-800">
          {metric.label}
        </span>
        <span className="text-xs font-semibold text-slate-900">
          {metric.score}%
        </span>
      </div>
    </div>
  );
}
8.3. Card în Dashboard – MissionPerspectiveCard.tsx
tsx
Copy code
// components/dashboard/MissionPerspectiveCard.tsx
"use client";

import { useRouter } from "next/navigation";

type Props = {
  hasActiveMission: boolean;
  missionTitle?: string;
};

export function MissionPerspectiveCard({
  hasActiveMission,
  missionTitle,
}: Props) {
  const router = useRouter();

  if (!hasActiveMission) return null;

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-[#f7f3ea] p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="space-y-1.5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Harta misiunii
        </p>
        <h3 className="text-base font-semibold text-slate-900">
          Harta misiunii tale
        </h3>
        <p className="text-sm text-slate-700">
          Vezi dintr-o privire cum stai cu resursele interne și cu progresul
          mental pentru{" "}
          <span className="font-medium">
            {missionTitle ?? "misiunea ta principală"}
          </span>
          .
        </p>
      </div>

      <button
        className="mt-4 inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-50 hover:bg-slate-800"
        onClick={() => router.push("/mission-map")}
      >
        Deschide harta
      </button>
    </div>
  );
}
8.4. Buton în Header
tsx
Copy code
// components/layout/AppHeader.tsx (exemplu; adaptează la structura ta)
"use client";

import { useRouter } from "next/navigation";
// import { Map } from "lucide-react"; // dacă folosiți lucide

type MissionHeaderButtonProps = {
  hasActiveMission: boolean;
};

export function MissionHeaderButton({ hasActiveMission }: MissionHeaderButtonProps) {
  const router = useRouter();
  if (!hasActiveMission) return null;

  return (
    <button
      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
      onClick={() => router.push("/mission-map")}
    >
      {/* <Map className="h-3 w-3" /> */}
      <span>Hartă misiune</span>
    </button>
  );
}
Integrează MissionHeaderButton în zona de acțiuni din header, lângă butonul de „Jurnal”.

9. Tracking / Telemetrie (placeholder)
În locurile indicate, se pot adăuga:

ts
Copy code
// pseudo-code
track("mission_map_opened", { missionId, entryPoint: "dashboard" });
track("mission_map_view_toggled", { view: "resources" });
Astfel putem vedea:

câți useri ajung în pagină,

ce view folosesc mai mult,

de unde accesează (dashboard / header).

10. Rezumat pentru Codex
Creează hook useMissionPerspective cu structurile de mai sus (mock la început).

Creează pagina /mission-map cu layoutul descris (hero, tabs, două view-uri).

Adaugă cardul MissionPerspectiveCard în dashboard, condiționat de hasActiveMission.

Adaugă MissionHeaderButton în header (zona logată), tot condiționat de hasActiveMission.

Folosește copy-ul din secțiunile de mai sus; îl poți extrage într-un config de i18n ulterior.

Asigură-te că pagina arată curat pe 360 / 768 / 1024 / 1280 și folosește design language-ul actual OmniMental.

## 11. Dynamic Honeycomb Overlay – OmniINTEL Fagure

În loc să desenăm hexagoanele în imagine, le generăm în cod, peste fundalul cu silueta și drumul. Astfel:

- procentele pentru SCOP / KUNO / ABIL / FLEX se actualizează dinamic;
- celula INTEL este calculată automat ca un agregat al celorlalte;
- nu trebuie refăcute imagini de fiecare dată.

### 11.1. Fundal

Folosim o singură imagine statică:

- `public/assets/mission-map/silhouette-path.png`

Descriere: fundal sepia (tonuri similare cu pagina de onboarding), drum șerpuit spre orizont, soare, munți, siluetă umană în stânga (profil sau semi-profil). Fără hexagoane desenate în imagine.

### 11.2. Componentă hexagon – `HoneyHex`

Hexagonul este desenat ca SVG, cu umplere „miere” în funcție de procent și etichetele direct în interior.

```tsx
// components/missionMap/HoneyHex.tsx
"use client";

type HexProps = {
  label: string;
  value: number; // 0–100
};

export function HoneyHex({ label, value }: HexProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* contur hexagon */}
        <polygon
          points="25,5 75,5 95,50 75,95 25,95 5,50"
          className="fill-amber-50 stroke-amber-700"
          strokeWidth={2}
        />

        {/* umplere cu "miere" (rect mascat de hexagon) */}
        <defs>
          <clipPath id="hex-clip">
            <polygon points="25,5 75,5 95,50 75,95 25,95 5,50" />
          </clipPath>
        </defs>

        <rect
          x={0}
          y={100 - clamped}
          width={100}
          height={clamped}
          className="fill-amber-400"
          clipPath="url(#hex-clip)"
        />
      </svg>

      {/* text procent + label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold text-slate-900">
          {clamped}%
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-800">
          {label}
        </span>
      </div>
    </div>
  );
}
11.3. Layoutul fagurelui pentru SCOP / KUNO / ABIL / FLEX / INTEL
Ordine (de jos în sus):

jos: SCOP

deasupra: stânga KUNO, dreapta ABIL

deasupra lor, centrat: FLEX

deasupra lui FLEX, cu mică liniuță: INTEL (celulă separată)

Implementare în MissionMentalProgressView:

tsx
Copy code
// în app/mission-map/page.tsx sau componentă separată
import { HoneyHex } from "@/components/missionMap/HoneyHex";
import type { MentalMetric } from "@/lib/hooks/useMissionPerspective";

function MissionMentalProgressView({ mental }: { mental: MentalMetric[] }) {
  const byKey = Object.fromEntries(mental.map((m) => [m.key, m]));
  const scop = byKey["scop"];
  const kuno = byKey["kuno"];
  const abil = byKey["abil"];
  const flex = byKey["flex"];

  const scopScore = scop?.score ?? 0;
  const kunoScore = kuno?.score ?? 0;
  const abilScore = abil?.score ?? 0;
  const flexScore = flex?.score ?? 0;

  // OmniINTEL = integrarea celorlalte (v1: media simplă, extensibil ulterior)
  const intelScore = Math.round(
    (scopScore + kunoScore + abilScore + flexScore) / 4
  );

  const missionSuccess = intelScore >= 80; // prag configurabil

  return (
    <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      {/* Vizual: imagine + overlay fagure */}
      <div className="relative flex items-center justify-center">
        <img
          src="/assets/mission-map/silhouette-path.png"
          alt="Siluetă pe drum"
          className="w-full max-w-md rounded-xl border border-slate-300/70 bg-slate-50/60 shadow-sm"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-8">
          <div className="flex flex-col items-center gap-1">
            {/* INTEL sus */}
            <div className="mb-[-10px] flex flex-col items-center gap-1">
              <HoneyHex label="INTEL" value={intelScore} />
              {missionSuccess && (
                <span className="mt-1 rounded-full bg-emerald-700/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-50">
                  Misiune reușită
                </span>
              )}
            </div>

            {/* FLEX */}
            <div className="mt-[-4px]">
              <HoneyHex label="FLEX" value={flexScore} />
            </div>

            {/* KUNO + ABIL */}
            <div className="mt-[-4px] flex gap-2">
              <HoneyHex label="KUNO" value={kunoScore} />
              <HoneyHex label="ABIL" value={abilScore} />
            </div>

            {/* SCOP jos */}
            <div className="mt-[-4px]">
              <HoneyHex label="SCOP" value={scopScore} />
            </div>
          </div>
        </div>
      </div>

      {/* Text explicativ identic cu spec-ul anterior */}
      {/* ... (lista mental metrics + text + CTA) ... */}
    </section>
  );
}
În textul care explică fragilitatea și pașii următori păstrăm copy-ul definit mai sus, dar acum INTEL adaugă o frază scurtă, de ex.:

„OmniINTEL combină cât de clar ți-ai definit scopul, cât ai înțeles, cât ai exersat și cât de flexibil ai rămas. Când această celulă se umple, misiunea este practic integrată în viața ta de zi cu zi.”


md
Copy code
**End of spec v1 – Mission Map / Perspectivele Misiunii**
